"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Editor } from "@/components/editor/Editor";
import { Preview } from "@/components/preview/Preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, FileEdit } from "lucide-react";
import { io, Socket } from "socket.io-client";

type ViewMode = "edit" | "split" | "preview";

interface PublishedSnapshot {
    uuid: string;
    title?: string;
    content: string;
    editable?: boolean;
    editPassword?: string;
    publishedAt: string;
}

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

export default function ShareEditPage() {
    const params = useParams();
    const uuid = typeof params?.uuid === "string" ? params.uuid : Array.isArray(params?.uuid) ? params.uuid[0] : "";

    const [snapshot, setSnapshot] = useState<PublishedSnapshot | null>(null);
    const [loading, setLoading] = useState(true);
    const [content, setContent] = useState("");
    const [mode, setMode] = useState<ViewMode>("split");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [guestName, setGuestName] = useState("");
    const [editPassword, setEditPassword] = useState("");
    const [ready, setReady] = useState(false);
    const socketRef = useRef<Socket | null>(null);
    const lastIncoming = useRef<string | null>(null);
    const emitTimer = useRef<NodeJS.Timeout | null>(null);

    const isMobile = useIsMobile();
    const effectiveMode = isMobile && mode === "split" ? "edit" : mode;

    useEffect(() => {
        let active = true;
        const load = async () => {
            try {
                const res = await fetch(`/api/publish/${uuid}`);
                if (!res.ok) {
                    if (active) setLoadError("Share not found.");
                    return;
                }
                const data = await res.json();
                if (!active) return;
                setSnapshot(data);
                setContent(data.content || "");
                if (!data.editable) {
                    setLoadError("This share link is view-only.");
                }
            } catch {
                if (active) setLoadError("Failed to load shared document.");
            } finally {
                if (active) setLoading(false);
            }
        };
        if (uuid) load();
        return () => {
            active = false;
        };
    }, [uuid]);

    useEffect(() => {
        setMode(isMobile ? "edit" : "split");
    }, [isMobile]);

    useEffect(() => {
        return () => {
            socketRef.current?.disconnect();
            socketRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (!ready || !socketRef.current) return;
        if (lastIncoming.current === content) {
            lastIncoming.current = null;
            return;
        }

        if (emitTimer.current) clearTimeout(emitTimer.current);
        setSaving(true);
        emitTimer.current = setTimeout(() => {
            socketRef.current?.emit("share:update", { uuid, content });
            setSaving(false);
        }, 200);

        return () => {
            if (emitTimer.current) clearTimeout(emitTimer.current);
        };
    }, [content, ready, uuid]);

    const handleStart = async () => {
        setError(null);
        if (!guestName || guestName.trim().length < 2) {
            setError("Please enter your name (2+ characters).");
            return;
        }
        if (snapshot?.editPassword && !editPassword) {
            setError("This document requires an edit password.");
            return;
        }

        const socket = io({ path: "/api/socket" });
        socketRef.current = socket;

        socket.emit(
            "share:join",
            { uuid, guestName, editPassword },
            (resp: { ok: boolean; error?: string }) => {
                if (!resp?.ok) {
                    if (resp?.error === "invalid password") {
                        setError("Invalid edit password.");
                    } else if (resp?.error === "not editable") {
                        setError("This document is not editable.");
                    } else {
                        setError("Unable to start editing.");
                    }
                    socket.disconnect();
                    socketRef.current = null;
                    return;
                }
                setReady(true);
            }
        );

        socket.on("doc:content", (payload: { docId: string; content: string; sourceId?: string }) => {
            if (payload.sourceId && payload.sourceId === socket.id) return;
            lastIncoming.current = payload.content;
            setContent(payload.content);
        });
    };

    const title = snapshot?.title || "Shared Document";

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (loadError && !ready) {
        return (
            <div className="min-h-screen flex items-center justify-center text-muted-foreground">
                <div className="max-w-md text-center space-y-3">
                    <div className="text-lg font-semibold text-foreground">Unable to edit</div>
                    <div>{loadError}</div>
                </div>
            </div>
        );
    }

    if (!ready) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-full max-w-sm space-y-4 border rounded-xl bg-card p-6 shadow-lg">
                    <div className="space-y-1">
                        <h1 className="text-xl font-semibold">Edit Live</h1>
                        <p className="text-sm text-muted-foreground">Enter your name to start editing this shared document.</p>
                    </div>

                    <div className="space-y-3">
                        <div className="space-y-2">
                            <Label>Your Name</Label>
                            <Input
                                value={guestName}
                                onChange={(e) => setGuestName(e.target.value)}
                                placeholder="Enter your name"
                            />
                        </div>

                        {snapshot?.editPassword && (
                            <div className="space-y-2">
                                <Label>Edit Password</Label>
                                <Input
                                    type="password"
                                    value={editPassword}
                                    onChange={(e) => setEditPassword(e.target.value)}
                                    placeholder="Enter edit password"
                                />
                            </div>
                        )}

                        {error && <div className="text-sm text-destructive">{error}</div>}
                    </div>

                    <Button className="w-full" onClick={handleStart}>
                        Start Editing
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col min-w-0 bg-background h-screen">
            <div className="h-14 border-b flex items-center justify-between px-4 bg-muted/30">
                <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-sm truncate">{title}</span>
                    <span className="text-xs text-muted-foreground">
                        {saving ? "Saving..." : "Saved"} · Editing as {guestName}
                    </span>
                </div>

                <div className="flex items-center space-x-2 border rounded-md p-1 bg-background">
                    <Button
                        variant={effectiveMode === "edit" ? "secondary" : "ghost"}
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => setMode("edit")}
                    >
                        <FileEdit className="w-4 h-4" />
                    </Button>
                    <Button
                        variant={effectiveMode === "split" ? "secondary" : "ghost"}
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => setMode("split")}
                    >
                        <Eye className="w-4 h-4 mr-1" /><FileEdit className="w-4 h-4" />
                    </Button>
                    <Button
                        variant={effectiveMode === "preview" ? "secondary" : "ghost"}
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => setMode("preview")}
                    >
                        <Eye className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <div className={`flex-1 flex overflow-hidden min-h-0 relative ${isMobile ? "pb-14" : ""}`}>
                {(effectiveMode === "edit" || effectiveMode === "split") && (
                    <div className="flex-1 border-r">
                        <Editor content={content} onChange={setContent} />
                    </div>
                )}

                {(effectiveMode === "preview" || effectiveMode === "split") && (
                    <div className="flex-1 bg-muted/10 h-full overflow-hidden">
                        <Preview content={content} onContentChange={setContent} />
                    </div>
                )}
            </div>
        </div>
    );
}
