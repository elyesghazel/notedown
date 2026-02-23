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
        } catch (e) {
            console.error("[IMAGE_UPLOAD] Upload failed:", e);
        }
    };

    const processFile = async (file: File) => {
        if (!file.type.startsWith("image/")) return;
        try {
            console.log(`[IMAGE_PASTE] Uploading image: ${file.name} (${file.size} bytes)`);
            const response = await api.uploadImage(file);
            // Extract filename from URL and use API route
            const filename = response.url.split('/').pop();
            const imageUrl = `/api/uploads/${filename}`;
            console.log(`[IMAGE_PASTE] Upload successful: ${imageUrl}`);
            insertTextAtCursor(`![image](${imageUrl})`);
        } catch (e: any) {
            const errorMsg = e?.message || String(e);
            console.error("[IMAGE_PASTE] Failed to upload image:", errorMsg);
            // Optionally show the error to the user in the editor
            insertTextAtCursor(`![Error uploading image: ${errorMsg}]()`);
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
