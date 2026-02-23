"use client";

import { useMemo, useState, useEffect, use, useRef } from "react";
import useSWR from "swr";
import { api } from "@/lib/api-client";
import { useAutoSave } from "@/hooks/useAutoSave";
import { Editor } from "@/components/editor/Editor";
import { Preview } from "@/components/preview/Preview";
import { Toolbar, ViewMode } from "@/components/toolbar/Toolbar";
import { Loader2 } from "lucide-react";
import { io, Socket } from "socket.io-client";

function useIsMobile() {
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);
    return isMobile;
}

export default function EditorPage({ params }: { params: Promise<{ space: string; path: string[] }> }) {
    const { space, path } = use(params);
    const { data: spaces } = useSWR("/api/spaces", () => api.getSpaces());

    const currentSpace = spaces?.find(s => s.slug === space);

    const { data: folders } = useSWR(
        currentSpace ? `/api/folders?spaceId=${currentSpace.id}` : null,
        () => api.getFolders(currentSpace!.id)
    );

    const { data: documents } = useSWR(
        currentSpace ? `/api/documents?spaceId=${currentSpace.id}` : null,
        () => api.getDocuments(currentSpace!.id)
    );

    const isMobile = useIsMobile();
    const [mode, setMode] = useState<ViewMode>("edit");
    const [content, setContent] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [docId, setDocId] = useState<string | null>(null);
    const socketRef = useRef<Socket | null>(null);
    const lastIncoming = useRef<string | null>(null);
    const emitTimer = useRef<NodeJS.Timeout | null>(null);

    // Resolve Document using the path array
    const currentDoc = useMemo(() => {
        if (!documents || !folders || !currentSpace) return null;
        const docSlug = path[path.length - 1];
        const folderSlugs = path.slice(0, -1);

        let currentFolderId: string | null = null;
        for (const fSlug of folderSlugs) {
            const f = folders.find(folder => folder.slug === fSlug && folder.parentFolderId === currentFolderId);
            if (!f) return null;
            currentFolderId = f.id;
        }

        return documents.find(d => d.slug === docSlug && d.folderId === currentFolderId);
    }, [documents, folders, currentSpace, path]);

    // Set mode based on viewport
    useEffect(() => {
        setMode(isMobile ? "edit" : "split");
    }, [isMobile, currentDoc?.id]);

    // Sync content when document changes
    useEffect(() => {
        if (currentDoc && currentDoc.id !== docId) {
            setContent(currentDoc.content);
            setDocId(currentDoc.id);
        }
    }, [currentDoc, docId]);

    useAutoSave(docId || "", content, () => setIsSaving(false));

    const handleContentChange = (val: string) => {
        setContent(val);
        setIsSaving(true);
    };

    useEffect(() => {
        if (!docId) return;

        const socket = io({ path: "/api/socket" });
        socketRef.current = socket;

        socket.emit("doc:join", { docId }, (resp: { ok: boolean }) => {
            if (!resp?.ok) {
                socket.disconnect();
            }
        });

        socket.on("doc:content", (payload: { docId: string; content: string; sourceId?: string }) => {
            if (payload.docId !== docId) return;
            if (payload.sourceId && payload.sourceId === socket.id) return;
            lastIncoming.current = payload.content;
            setContent(payload.content);
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [docId]);

    useEffect(() => {
        if (!docId || !socketRef.current) return;
        if (lastIncoming.current === content) {
            lastIncoming.current = null;
            return;
        }

        if (emitTimer.current) clearTimeout(emitTimer.current);
        emitTimer.current = setTimeout(() => {
            socketRef.current?.emit("doc:update", { docId, content });
        }, 200);

        return () => {
            if (emitTimer.current) clearTimeout(emitTimer.current);
        };
    }, [content, docId]);

    // Force edit or preview only on mobile (never split)
    const effectiveMode = isMobile && mode === "split" ? "edit" : mode;

    if (!spaces || !folders || !documents) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!currentDoc) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                <p className="text-xl font-semibold mb-2">Document not found</p>
                <p>It may have been deleted or the URL is incorrect.</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col min-w-0 bg-background h-screen">
            <Toolbar doc={currentDoc} mode={effectiveMode} setMode={setMode} isSaving={isSaving} isMobile={isMobile} />

            <div className={`flex-1 flex overflow-hidden min-h-0 relative ${isMobile ? "pb-14" : ""}`}>
                {(effectiveMode === "edit" || effectiveMode === "split") && (
                    <div className="flex-1 border-r">
                        <Editor content={content} onChange={handleContentChange} />
                    </div>
                )}

                {(effectiveMode === "preview" || effectiveMode === "split") && (
                    <div className="flex-1 bg-muted/10 h-full overflow-hidden">
                        <Preview content={content} onContentChange={handleContentChange} />
                    </div>
                )}
            </div>
        </div>
    );
}
