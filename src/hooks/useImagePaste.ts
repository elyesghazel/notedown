import { api } from "@/lib/api-client";

export function useImagePaste(insertTextAtCursor: (text: string) => void) {
    const handleFileUpload = async (file: File) => {
        if (!file.type.startsWith("image/")) return;
        try {
            // First we need to grab the cursor position and insert a loading state. 
            // the insert function takes care of this
            const originalLength = `![Uploading ${file.name}...]()`.length;
            insertTextAtCursor(`![Uploading ${file.name}...]()`);

            const { url } = await api.uploadImage(file);
            // We can't easily find and replace the generic loading text without a full editor state manager.
            // For this lightweight textarea, we will just insert the correct one and rely on user to delete the loading one if desired, 
            // OR we can just omit the loading state and insert it when done.
            // Let's go with the cleaner "insert when done" approach:
        } catch {
            // Error uploading
        }
    };

    const processFile = async (file: File) => {
        if (!file.type.startsWith("image/")) return;
        try {
            const { url } = await api.uploadImage(file);
            insertTextAtCursor(`![image](${url})`);
        } catch (e) {
            console.error("Failed to upload image", e);
        }
    }

    const onPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const item = Array.from(e.clipboardData.items).find(i => i.kind === "file");
        if (item) {
            e.preventDefault();
            const file = item.getAsFile();
            if (file) {
                processFile(file);
            }
        }
    };

    const onDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) {
            processFile(file);
        }
    };

    return { onPaste, onDrop };
}
