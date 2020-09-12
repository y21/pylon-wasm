# pylon-wasm
### Note: This is a WIP
That being said, it's not very usable right now.
It works, but it barely supports any gateway events and only gives you access to the message content due to how it works. <br/>
It's also not very stable at the moment, so if you find any bugs, feel free to open an issue. <br/>

## Write serverless Discord bots in C
<img src="https://media.discordapp.net/attachments/607227034170687491/754367039681855579/unknown.png?width=1440&height=559" width="700" />

### How do I use this?
The "main entry file" is `src/main.c`. This file contains boilerplate code to get you started. Feel free to add more commands by creating instances of `Command` and calling `register_command` with a pointer to your command as parameter.

### How do I build this?
1) Install [Emscripten](https://emscripten.org/) <br/>
Emscripten is used to compile C/C++ source code down to a small `.wasm` file. <br/>
We can then import the binary in JavaScript land, instantiate and use it! <br/>
Installing emscripten is quite easy: see [this](https://emscripten.org/docs/getting_started/downloads.html) page.

2) Install [Make](https://www.gnu.org/software/make/) <br/>
This step isn't required, but it will make compiling the source code a lot easier. <br />

3) Compile the source code <br/>
If you've just installed Make, you can simply run `make build`. This will build the project and produce a `.wasm` file.

4) Import the TypeScript library <br/>
The easiest way to import this library for now is to simply copy & paste the contents of `src/pylonwasm.ts` into a new file.
You can then `import()` it in a file, instantiate `PylonWasm` and register events.

Example: 
```ts
import { PylonWasm } from './pylonwasm';

const pwasm = new PylonWasm(
  'https://cdn.discordapp.com/attachments/652646728813772820/754364397853343815/pylonwasm.wasm'
);

discord.on(
  discord.Event.MESSAGE_CREATE,
  pwasm.forEvent(discord.Event.MESSAGE_CREATE).bind(pwasm)
);

// !!greet test
// ==> hello test!
```

### How does it work?
v8 (Google's JavaScript engine that Chromium *and Pylon* uses to run code) supports WebAssembly, which is a relatively new technology that supports running code written in another programming language. <br/>
This project uses Emscripten to compile code to *WebAssembly*, which we can then instantiate in JavaScript!

### Why is there no `message->author`, or basically anything else other than `message->content`?
WebAssembly (by design) only allows numerical values to be passed around. This means no strings, structs or arrays. Only numbers and pointers are allowed. <br/>
The way this works is by allocating memory for the message content in JavaScript and calling C functions with a pointer to the message content as parameter. <br/>
As you can see, this makes it hard to pass a lot of external values to C functions, however I do have plans for making this possible by allocating memory for a struct in JavaScript and passing the pointer to the struct to C functions.

##### TODO
- Transfer pointer to structs rather than pointer to string
- Support more events
- Support for Pylon's built-in command group