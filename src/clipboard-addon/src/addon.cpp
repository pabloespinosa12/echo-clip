#include <napi.h>
#include "clipboard.h"

Napi::String GetClipboardContent(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    std::string text = getClipboardText();
    return Napi::String::New(env, text);
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set(Napi::String::New(env, "getClipboardContent"), 
                Napi::Function::New(env, GetClipboardContent));
    return exports;
}

NODE_API_MODULE(clipboard, Init)