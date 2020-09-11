#include "external.h"
#include "discord.h"
#include "commands.h"
#include <stdlib.h> // malloc() and free()

#define C_STR_SIZE(n) (sizeof(char) * n)

void call_message_create(unsigned short task_id, const char* msg_ptr, unsigned short len) {
    MessageEvent event = { task_id, msg_ptr, len };

    process_commands(&event);
}