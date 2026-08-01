#include <node_api.h>
#include "clipboard.h"

napi_value GetClipboardContent(napi_env env, napi_callback_info info) {
    std::string text = getClipboardText();
    napi_value result;
    napi_create_string_utf8(env, text.c_str(), text.length(), &result);
    return result;
}

napi_value Init(napi_env env, napi_value exports) {
    napi_value fn;
    napi_create_function(env, "getClipboardContent", NAPI_AUTO_LENGTH, GetClipboardContent, nullptr, &fn);
    napi_set_named_property(env, exports, "getClipboardContent", fn);
    return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)