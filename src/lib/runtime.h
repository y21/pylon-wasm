#ifndef __RUNTIME_PWASM__
#define __RUNTIME_PWASM__

// Function call that come from JavaScript
void default_message_create_(unsigned short task_id, const char* msg_ptr);
void call_event(unsigned short task_id, unsigned char event_id, const char* ptr);


// "Main" entry point
// This function is called when this module is loaded in JavaScript land
int wasm_main();

#endif