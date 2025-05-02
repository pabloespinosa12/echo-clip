const clipboardListener = require('clipboard-event');
const clipboardAddOn = require('../clipboard-addon/build/Release/clipboard');

class ClipboardController {
    constructor() {
        this.lastCopiedText = ""; // Store the last copied text
        this.shouldSkipClipboardChange = false; // True if the text was copied by clicking on the clipboard
        this.onClipboardUpdate = null; // Callback to notify when new clipboard content is detected; set externally via onClipboardChange()
    }

    setClipboardUpdateCallback(callback) {
        this.onClipboardUpdate = callback;
    }

    skipClipboardChange() {
        this.shouldSkipClipboardChange = true;
    }

    startListening() {
        clipboardListener.startListening();

        clipboardListener.on('change', () => {

            if (this.shouldSkipClipboardChange) {
                this.shouldSkipClipboardChange = false; // Reset flag after skipping
                return;
            }
            
            const copiedContent = clipboardAddOn.getClipboardContent(); // Read content with the C++ addon
            
            if(!copiedContent || !copiedContent.trim()){
                console.warn("Empty clipboard entry ignored")
                return;
            }
            // Avoid re-adding if it's the same text as the last copied one
            if (copiedContent == this.lastCopiedText) {
                console.log("Duplicate clipboard entry ignored:", copiedContent);
                return;
            }
            this.lastCopiedText = copiedContent;
            
            console.log("New clipboard content:", copiedContent);
            if(this.onClipboardUpdate) {
                this.onClipboardUpdate(copiedContent);
            }
        });
    }

    stopListening() {
        clipboardListener.stopListening();
    }
}

module.exports = new ClipboardController(); // Singleton instance

