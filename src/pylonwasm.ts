// Used to decode typed arrays (-> string)
const decoder = new TextDecoder();

interface EventQueueItem<T = any> {
  id?: number;
  item: T;
}

const enum IntSize {
  UINT8 = 1 << 0,
  UINT16 = 1 << 1,
  UINT32 = 1 << 2,
  UINT64 = 1 << 3
}

const enum MessageOptions {
  DISABLE_EVERYONE = 1 << 0,
  DISABLE_ROLES = 1 << 1,
  DISABLE_USERS = 1 << 2,
  DISABLE_ALL = 1 << 3
}

function hasFlag(all: number, bit: number) {
  return (all & bit) === bit;
}

function flagsToMentions(flags: number): discord.Message.IAllowedMentions {
  const hasMention = hasFlag.bind(null, flags);

  if (hasMention(MessageOptions.DISABLE_ALL)) return {};

  return {
    everyone: !hasMention(MessageOptions.DISABLE_EVERYONE),
    roles: hasMention(MessageOptions.DISABLE_ROLES) ? [] : true,
    users: hasMention(MessageOptions.DISABLE_USERS) ? [] : true
  };
}

class EventQueue {
  private highest: number = 0;
  public queue: Map<number, EventQueueItem> = new Map();

  /**
   * Stores "event data" in a map that can be accessed later on
   */
  public next(data: EventQueueItem): number {
    const id = (this.highest = -~this.highest % 0xffff);
    this.queue.set(id, Object.assign(data, { id }));

    return id;
  }

  public get<T>(taskId: number): EventQueueItem<T> | undefined {
    return this.queue.get(taskId);
  }

  public done(taskId: number) {
    this.queue.delete(taskId);
  }
}

export class PylonWasm {
  public wasm: WebAssembly.WebAssemblyInstantiatedSource | undefined;
  public wasmSource: string | undefined;

  private dv: DataView | undefined;
  private eventQueue: EventQueue;

  /**
   * Creates a new PylonWasm object
   * You can either pass in an ArrayBuffer, which will cause it to instantiate the binary,
   * or you can pass the direct link to the binary, which will be loaded in the next time
   * it receives a registered event
   */
  constructor(source: string | ArrayBuffer) {
    this.eventQueue = new EventQueue();

    if (source instanceof ArrayBuffer) {
      this.__load_wasm__(source);
    } else {
      this.wasmSource = source;
    }
  }

  /**
   * Pass this function to `discord.on(discord.Event.MESSAGE_CREATE)` to listen for
   * MESSAGE_CREATE events in C code
   */
  public async messageCreate(message: discord.Message) {
    if (!message.content || message.content.length === 0) return;

    if (!this.wasm) {
      if (!this.wasmSource) {
        throw new Error(
          'Cannot load WebAssembly binary (`wasmSource` is undefined)'
        );
      }

      await fetch(this.wasmSource)
        .then((x) => x.arrayBuffer())
        .then((x) => this.__load_wasm__(x));
    }

    const taskId = this.eventQueue.next({
      item: message
    });

    const ptr = this.__malloc_str__(message.content);

    if (ptr === 0) {
      throw new Error('Memory allocation failed');
    }

    try {
      this.wasm!.instance.exports.call_message_create(
        taskId,
        ptr,
        message.content.length
      );
    } catch (e) {
      console.error('[pylonwasm runtime error]', e);
    } finally {
      this.wasm!.instance.exports.free(ptr);
      this.eventQueue.done(taskId);
    }
  }

  // ===============
  // WASM FUNCTIONS
  //
  // Functions below (prefixed with __) are very low-level and are not meant to be called by end users unless you know what you are doing
  // Most of them are functions that either manage WebAssembly memory or functions that are called in C++ land
  //
  // For example, `__malloc_str__` allocates memory for a given value, sets it in wasm memory, returns the address
  // *and* expects the caller to free the memory by calling `instace.exports.free(ptr)`!
  //
  // WebAssembly *only* allows "numerical" values to be passed around, which is why we use pointers and sizes as parameter
  // ===============

  /**
   * Loads a WebAssembly binary
   * This function also attempts to call `wasm_main`.
   */
  private async __load_wasm__(source: ArrayBuffer) {
    // @ts-ignore
    this.wasm = await WebAssembly.instantiate(source, {
      env: {
        ext_send_message: this.__wasm_send_message__.bind(this),
        ext_log: this.__wasm_log__.bind(this)
      }
    });

    // @ts-ignore
    this.dv = new DataView(this.wasm.instance.exports.memory.buffer);

    if (Object.hasOwnProperty.call(this.wasm!.instance.exports, 'wasm_main')) {
      const code = this.wasm!.instance.exports.wasm_main();
      if (code !== 0) {
        console.warn(
          `warning: initial \`wasm_main\` function returned non-zero code: ${code}`
        );
      } else {
        console.info(`\`wasm_main\` function returned code: ${code}`);
      }
    } else {
      console.warn(
        'warning: wasm binary does not have an exported `wasm_main` function'
      );
    }
  }

  /**
   * Gets a value by its pointer (address in wasm memory).
   */

  private __get_ptr__(
    ptr: number,
    len: number,
    stringify = false
  ): Uint8Array | string | null {
    if (!this.wasm) return null;

    const nb = new Uint8Array(
      this.wasm.instance.exports.memory.buffer,
      ptr,
      len
    );
    return stringify ? decoder.decode(nb) : nb;
  }

  /**
   * Sets a value at a given memory address.
   */
  private __set_ptr__(ptr: number, val: any): boolean {
    if (!this.dv) return false;

    switch (val.constructor) {
      case String:
        __set_ptr_str__(this.dv, ptr, val);
        break;
      default:
        this.__handle_wasm_error__(
          new Error(
            `cannot write ${
              val.constructor.name
            } to memory (addr=0x${ptr.toString(16)})`
          )
        );
        break;
    }

    return true;
  }

  /**
   * Allocates heap memory for a string, sets the value in memory and returns the address, expecting the caller to free memory(!)
   * Returns 0 if `wasm` is not yet loaded, or if memory allocation failed.
   */
  private __malloc_str__(value: string): number {
    if (!this.wasm) return 0;
    const ptr = this.wasm.instance.exports.malloc(
      value.length * IntSize.UINT8 + 1
    );
    if (ptr === 0) return 0; // malloc failed

    this.__set_ptr__(ptr, value);
    return ptr;
  }

  /**
   * [External function]
   * This function is called for sending messages in C code, receiving the pointer of message content and its length.
   */
  private async __wasm_send_message__(
    task_id: number,
    flags: number,
    ct_ptr: number,
    ct_len: number
  ) {
    const event = this.eventQueue.get<discord.Message>(task_id);
    if (!event) return this.__handle_wasm_error__(new Error('Task not found.'));

    const content = <string | null>this.__get_ptr__(ct_ptr, ct_len, true);
    if (content === null)
      return this.__handle_wasm_error__(new Error('Invalid address'));

    const channel = await discord.getGuildTextChannel(event.item.channelId);

    if (!channel)
      return this.__handle_wasm_error__(new Error('Channel not found'));

    channel.sendMessage({
      content,
      allowedMentions: flagsToMentions(flags)
    });
  }

  /**
   * [External function]
   * This function is called to log a string to the console. This allows you to use `console.log` in C code.
   */
  private __wasm_log__(log_ptr: number, log_len: number, raw: number) {
    console.log(this.__get_ptr__(log_ptr, log_len, raw !== 0));
  }

  /**
   * Throwing exceptions doesn't really work well right now, so we just log the error to the console
   * This will probably be changed to actually throw exceptions that can be caught in some way at some point
   */
  private __handle_wasm_error__(e: Error, task_id?: number) {
    console.error(`[pylonpp${task_id ? `-${task_id}` : ''}]`, e);
  }
}

function __set_ptr_str__(dv: DataView, ptr: number, val: string) {
  for (let i = 0; i < val.length; ++i) {
    dv.setUint8(ptr + i, val.charCodeAt(i));
  }

  dv.setUint8(ptr + val.length, 0); // null terminate c-string
}
