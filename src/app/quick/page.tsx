"use client";

import { useState, useRef, useEffect } from "react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { mutate } from "swr";
import { Zap, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function QuickCapturePage() {
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        textareaRef.current?.focus();
    }, []);

    const handleSave = async () => {
        if (!content.trim() || loading) return;
        setLoading(true);

        try {
            // Find or create "Personal" workspace
            const workspaces = await api.getWorkspaces();
            let defWorkspace = workspaces.length > 0 ? workspaces[0] : null;
            if (!defWorkspace) {
                defWorkspace = await api.createWorkspace("Personal");
            }

            // Find or create "Inbox" space
            const spaces = await api.getSpaces(defWorkspace.id);
            let inbox = spaces.find(s => s.name.toLowerCase() === "inbox");

            if (!inbox) {
                inbox = await api.createSpace(defWorkspace.id, "Inbox");
            }

            // Create document
            const d = new Date();
            const padded = (n: number) => String(n).padStart(2, '0');
            const docName = `note-${d.getFullYear()}-${padded(d.getMonth() + 1)}-${padded(d.getDate())} ${padded(d.getHours())}:${padded(d.getMinutes())}`;
            const doc = await api.createDocument(inbox.id, docName);

            // Save content
            await api.saveDocument(doc.id, content);

            // Invalidate caches globally so sidebar and lists update immediately
            mutate((key: string) => typeof key === "string" && key.startsWith("/api/documents"));
            mutate((key: string) => typeof key === "string" && key.startsWith("/api/spaces"));

            toast.success("Saved to Inbox");
            setContent("");
            textareaRef.current?.focus();
        } catch (err) {
            toast.error("Failed to save note");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 min-h-screen flex flex-col bg-background relative">
            <div className="absolute top-4 left-4">
                <Link href="/" className="text-muted-foreground hover:text-foreground inline-flex items-center">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Link>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-2xl mx-auto w-full">
                <div className="w-full relative">
                    <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onKeyDown={(e) => {
                            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                                e.preventDefault();
                                handleSave();
                            }
                        }}
                        placeholder="What's on your mind? (Cmd/Ctrl + Enter to save)"
                        className="w-full min-h-[400px] text-lg lg:text-xl bg-transparent resize-none outline-none font-mono placeholder:text-muted-foreground/50 border-0 focus:ring-0"
                    />

                    <button
                        onClick={handleSave}
                        disabled={!content.trim() || loading}
                        className="absolute -bottom-16 right-0 bg-primary text-primary-foreground px-4 py-2 rounded-full font-medium inline-flex items-center shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Zap className="w-4 h-4 mr-2" />
                        )}
                        Save Note
                    </button>
                </div>
            </div>
        </div>
    );
}
