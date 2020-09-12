#include "external.h"
#include "discord.h"
#include "commands.h"
#include <string.h>

void default_message_create(unsigned short task_id, const char* msg_ptr) {
    MessageEvent event = { task_id, msg_ptr, strlen(msg_ptr) };

    process_commands(&event);
}

void call_event(unsigned short task_id, unsigned char event_id, const char* ptr) {
    switch (event_id) {
        case EVENT_MESSAGE_CREATE:
            default_message_create(task_id, ptr);
            break;
    }
}