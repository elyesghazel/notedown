import { useEffect, useRef } from "react";
import { api } from "@/lib/api-client";

export function useAutoSave(docId: string, content: string, onSaveComplete?: () => void) {
    const timer = useRef<NodeJS.Timeout | undefined>(undefined);

    useEffect(() => {
        if (!docId) return;
        clearTimeout(timer.current);
        timer.current = setTimeout(async () => {
            await api.saveDocument(docId, content);
            onSaveComplete?.();
        }, 500);
        return () => clearTimeout(timer.current);
    }, [docId, content, onSaveComplete]);
}
