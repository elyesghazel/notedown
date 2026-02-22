import { useEffect, useRef } from "react";
import { api } from "@/lib/api-client";
import { mutate } from "swr";

export function useAutoSave(docId: string, content: string, onSaveComplete?: () => void) {
    const timer = useRef<NodeJS.Timeout | undefined>(undefined);
    const lastSavedContent = useRef(content);
    const currentContent = useRef(content);

    const cb = useRef(onSaveComplete);
    useEffect(() => {
        cb.current = onSaveComplete;
    }, [onSaveComplete]);

    // Track the latest content continuously so the unmount handler has access to it
    useEffect(() => {
        currentContent.current = content;
    }, [content]);

    // Unmount safe-guard: Flush to disk if modified!
    useEffect(() => {
        return () => {
            const finalDocId = docId;
            const finalContent = currentContent.current;
            if (finalDocId && lastSavedContent.current !== finalContent) {
                // Use a synchronous sendBeacon or a fire-and-forget fetch since we are actively unmounting
                fetch(`/api/documents/${finalDocId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content: finalContent }),
                    keepalive: true
                }).catch(console.error);

                // Update the local cache optimistically immediately since we are unmounting and moving elsewhere
                mutate(
                    (key: string) => typeof key === "string" && key.startsWith("/api/documents"),
                    (currentData: any) => {
                        if (!Array.isArray(currentData)) return currentData;
                        return currentData.map((d: any) => d.id === finalDocId ? { ...d, content: finalContent } : d);
                    },
                    { revalidate: false }
                );
            }
        };
    }, [docId]);

    useEffect(() => {
        if (!docId || content === lastSavedContent.current) return;

        clearTimeout(timer.current);
        timer.current = setTimeout(async () => {
            await api.saveDocument(docId, content);
            lastSavedContent.current = content;

            // Only update the local cache for this specific document optimisticially, do not trigger a full re-fetch
            await mutate(
                (key: string) => typeof key === "string" && key.startsWith("/api/documents"),
                (currentData: any) => {
                    if (!Array.isArray(currentData)) return currentData;
                    return currentData.map((d: any) => d.id === docId ? { ...d, content } : d);
                },
                { revalidate: false }
            );

            cb.current?.();
        }, 800);

        return () => clearTimeout(timer.current);
    }, [docId, content]);
}
