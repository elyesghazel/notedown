import { api } from "@/lib/api-client";

export function useImagePaste(insertTextAtCursor: (text: string) => void) {
    const handleFileUpload = async (file: File) => {
        const isImage = file.type.startsWith("image/");
        const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
        if (!isImage && !isPdf) return;
        try {
            // First we need to grab the cursor position and insert a loading state. 
            // the insert function takes care of this
            const originalLength = `![Uploading ${file.name}...]()`.length;
            insertTextAtCursor(`![Uploading ${file.name}...]()`);

            const { url } = await api.uploadFile(file);
            // We can't easily find and replace the generic loading text without a full editor state manager.
            // For this lightweight textarea, we will just insert the correct one and rely on user to delete the loading one if desired, 
            // OR we can just omit the loading state and insert it when done.
            // Let's go with the cleaner "insert when done" approach:
        } catch (e) {
            console.error("[IMAGE_UPLOAD] Upload failed:", e);
        }
    };

    const processFile = async (file: File) => {
        const isImage = file.type.startsWith("image/");
        const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
        if (!isImage && !isPdf) return;
        try {
            const tag = isImage ? "IMAGE" : "PDF";
            console.log(`[${tag}_PASTE] Uploading: ${file.name} (${file.size} bytes)`);
            const response = isPdf ? await api.uploadPdf(file) : await api.uploadFile(file);
            const fileUrl = response.url.startsWith("/uploads/")
                ? `/api/uploads/${response.url.split('/').pop()}`
                : response.url;
            console.log(`[${tag}_PASTE] Upload successful: ${fileUrl}`);
            if (isImage) {
                insertTextAtCursor(`![image](${fileUrl})`);
            } else {
                insertTextAtCursor(`[${file.name}](${fileUrl})`);
            }
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

    return { onPaste, onDrop, processFile };
}
