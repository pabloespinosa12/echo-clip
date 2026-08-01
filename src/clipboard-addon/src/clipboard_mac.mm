#include "clipboard.h"
#import <Foundation/Foundation.h>
#import <AppKit/AppKit.h>

std::string getClipboardText() {
    NSPasteboard* pasteboard = [NSPasteboard generalPasteboard];
    NSString* text = [pasteboard stringForType:NSPasteboardTypeString];
    if (text == nil) {
        return "";
    }
    return std::string([text UTF8String]);
}
