#ifndef __COMMANDS_PWASM__
#define __COMMANDS_PWASM__

#include "stdbool.h"
#include "discord.h"

typedef struct {
    const char* name;
    const char* prefix;
    bool detached;
    void (*run)(MessageEvent* e, const char* args);
} Command;

static Command* commands;
static unsigned short commands_len = 0, commands_alloc = 0;

void register_command(Command* cmd);
void process_commands(MessageEvent* e);

#endif