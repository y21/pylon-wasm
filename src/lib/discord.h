#ifndef __DISCORD_PWASM__
#define __DISCORD_PWASM__

// Flags
enum {
    // Mentions
    MSG_DISABLE_EVERYONE = 1 << 0,
    MSG_DISABLE_ROLES = 1 << 1,
    MSG_DISABLE_USERS = 1 << 2,
    MSG_DISABLE_ALL = 1 << 3
};

enum {
    EVENT_MESSAGE_CREATE = 0,
    EVENT_MESSAGE_DELETE = 1
};

typedef struct {
    unsigned int task_id;

    const char* content;
    unsigned short content_len;
} MessageEvent;

typedef struct {
    const char* content;
    unsigned int flags;
} MessageData;

void reply(unsigned short task_id, MessageData* data);
void reply_raw(unsigned short task_id, const char* content);

#endif