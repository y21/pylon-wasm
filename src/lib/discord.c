#include "external.h"
#include "discord.h"
#include "string.h"

void reply(unsigned short task_id, MessageData* data) {
    ext_send_message(task_id, data->content, strlen(data->content));
}

void reply_raw(unsigned short task_id, const char* content) {
    ext_send_message(task_id, content, strlen(content));
}