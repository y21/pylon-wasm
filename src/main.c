#include "lib/commands.h"
#include "lib/discord.h"
#include <stdio.h>

static void greet(MessageEvent* message, const char* args) {
    char response[2000];
    sprintf(response, "hello %s!", args);

    MessageData d = {
        .content = response,
        .flags = MSG_DISABLE_EVERYONE | MSG_DISABLE_USERS // disallow @everyone and @user
    };

    reply(message->task_id, &d);
}

int wasm_main() {
    Command cmd = {
        .name = "greet",
        .detached = false,
        .prefix = "!!",
        .run = greet
    };

    register_command(&cmd);

    return 0;
}