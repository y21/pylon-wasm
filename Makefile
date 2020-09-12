EMSCRIPTEN=emcc

build: src/lib/discord.c src/lib/runtime.c src/lib/commands.c src/main.c
	$(EMSCRIPTEN) --no-entry src/lib/discord.c src/lib/runtime.c src/lib/commands.c src/main.c \
	-s STANDALONE_WASM=1 -s WASM=1 \
	-s EXPORTED_FUNCTIONS="['_call_message_create', '_wasm_main']" \
	-s ERROR_ON_UNDEFINED_SYMBOLS=0 \
	-o pylon.wasm