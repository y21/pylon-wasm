#ifndef __EXTERNAL_PWASM__
#define __EXTERNAL_PWASM__

// External functions that exist in JavaScript land
// Functions prefixed with `ext` aren't intended for use by end users
// There's usually "higher level" wrapper functions around them that don't require passing ptr/len
// For that reason you can ignore 
// "warning: undefined symbol: <ext_xxx> (referenced by top-level compiled C/C++ code)" when compiling
// 
// WebAssembly only allows "numerical" values to be passed around, so we call external functions
// with pointers and length as parameters

void ext_send_message(unsigned int task_id, unsigned int flags, const char* ct_ptr, unsigned short ct_len);

void ext_log(const char* log_ptr, unsigned short log_len);


#endif