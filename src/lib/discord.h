#ifndef __DISCORD_PWASM__
#define __DISCORD_PWASM__

typedef struct {
    unsigned int task_id;

    const char* content;
    unsigned short content_len;
} MessageEvent;

typedef struct {
    const char* content;
} MessageData;

void reply(unsigned short task_id, MessageData* data);
void reply_raw(unsigned short task_id, const char* content);

#endif