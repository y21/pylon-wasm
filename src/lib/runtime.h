#ifndef __RUNTIME_PWASM__
#define __RUNTIME_PWASM__

// Function calls are coming from JavaScript
void call_message_create(unsigned short task_id, const char* msg_ptr, unsigned short len);

// "Main" entry point
// This function is called when this module is loaded in JavaScript land
int wasm_main();

#endif