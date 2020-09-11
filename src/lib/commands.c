#include "commands.h"
#include "external.h"
#include <stdlib.h>
#include <string.h>

#define CMD_SIZE (sizeof(Command))
#define INITIAL_CMD_SIZE (4 * CMD_SIZE)

void register_command(Command* cmd) {
    if (commands == NULL) {
        commands = malloc(commands_alloc = INITIAL_CMD_SIZE);
    }

    if (commands_len * CMD_SIZE >= commands_alloc) {
        commands = realloc(commands, commands_alloc *= 2);
    }

    commands[commands_len++] = *cmd;
}

void process_commands(MessageEvent* message) {
    for (int i = 0; i < commands_len; ++i) {
        Command cmd = commands[i];

        if (cmd.detached) {
            continue;
        }

        int prefix_len = strlen(cmd.prefix), cmd_len = strlen(cmd.name);

        if (message->content_len < prefix_len + cmd_len) {
            continue;
        }

        char* p_prefix;
        char* p_cmd;
        strncpy(p_prefix, message->content, prefix_len);
        p_prefix[prefix_len] = '\0';

        if (strcmp(p_prefix, cmd.prefix) != 0) {
            continue;
        }

        strncpy(p_cmd, &(message->content)[prefix_len], cmd_len);
        p_cmd[cmd_len] = '\0';

        if (strcmp(p_cmd, cmd.name) != 0) {
            continue;
        }

        // messages can only have 2000 characters, so we allocate 2000 bytes
        // using a char array because stack allocation is faster
        char args[2000];
        strcpy(args, &(message->content)[prefix_len + cmd_len + 1]);

        cmd.run(message, args);
    }
}