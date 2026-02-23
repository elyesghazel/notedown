"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { api } from "@/lib/api-client";
import { Document } from "@/lib/types";
import { Loader2, Copy, ExternalLink, Globe, RefreshCw, Trash2 } from "lucide-react";

interface PublishDialogProps {
    doc: Document;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function PublishDialog({ doc, open, onOpenChange }: PublishDialogProps) {
    const [loading, setLoading] = useState(false);
    const [shareUrl, setShareUrl] = useState<string | null>(null);
    const [shareUuid, setShareUuid] = useState<string | null>(null);
    const [republished, setRepublished] = useState(false);
    const [editable, setEditable] = useState(false);
    const [editPassword, setEditPassword] = useState("");

    // Reset state when dialog opens
    useEffect(() => {
        if (!open) {
            setShareUrl(null);
            setShareUuid(null);
            setRepublished(false);
            setEditable(false);
            setEditPassword("");
        }
    }, [open]);

    const handlePublish = async () => {
        setLoading(true);
        setRepublished(false);
        try {
            const { uuid } = await api.publishDoc(doc.id, editable, editable ? editPassword : "");
            const url = `${window.location.origin}/share/${uuid}`;
            setShareUrl(url);
            setShareUuid(uuid);
        } catch {
            alert("Failed to publish");
        } finally {
            setLoading(false);
        }
    };

    const handleRepublish = async () => {
        setLoading(true);
        try {
            const { uuid } = await api.publishDoc(doc.id, editable, editable ? editPassword : "");
            const url = `${window.location.origin}/share/${uuid}`;
            setShareUrl(url);
            setShareUuid(uuid);
            setRepublished(true);
        } catch {
            alert("Failed to republish");
        } finally {
            setLoading(false);
        }
    };

    const handleToggleLive = async () => {
        const nextEditable = !editable;
        setLoading(true);
        try {
            const { uuid } = await api.publishDoc(doc.id, nextEditable, nextEditable ? editPassword : "");
            const url = `${window.location.origin}/share/${uuid}`;
            setShareUrl(url);
            setShareUuid(uuid);
            setEditable(nextEditable);
            setRepublished(true);
        } catch {
            alert("Failed to update sharing mode");
        } finally {
            setLoading(false);
        }
    };

    const handleUnpublish = async () => {
        if (!shareUuid) return;
        if (!confirm("Unpublish this document? The shared link will stop working.")) return;
        setLoading(true);
        try {
            await api.unpublishDoc(shareUuid);
            setShareUrl(null);
            setShareUuid(null);
            setRepublished(false);
        } catch {
            alert("Failed to unpublish");
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (shareUrl) {
            navigator.clipboard.writeText(shareUrl);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[720px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Publish Document</DialogTitle>
                </DialogHeader>

                {!shareUrl ? (
                    <div className="space-y-4 py-4">
                        <p className="text-sm text-muted-foreground">
                            Publishing creates a read-only snapshot accessible via a unique URL. If already published, it will update the existing snapshot.
                        </p>

                        <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
                            <Label className="flex items-center gap-2 cursor-pointer">
                                <Checkbox checked={editable} onCheckedChange={(val) => setEditable(!!val)} />
                                <span className="text-sm font-medium">Enable live editing (WebSocket)</span>
                            </Label>

                            {editable && (
                                <div className="space-y-2 ml-6">
                                    <Label className="text-xs">Edit Password (optional)</Label>
                                    <Input
                                        type="password"
                                        value={editPassword}
                                        onChange={(e) => setEditPassword(e.target.value)}
                                        placeholder="Leave blank for no password"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        If set, viewers must enter this to edit. Changes update the original document in real time.
                                    </p>
                                </div>
                            )}
                        </div>

                        <Button onClick={handlePublish} disabled={loading} className="w-full">
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Publish Now
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4 py-4">
                        <p className="text-sm font-medium text-green-500">
                            {republished ? "Document republished with latest content!" : "Document published successfully!"}
                        </p>
                        <div className="flex space-x-2">
                            <Input readOnly value={shareUrl} />
                            <Button variant="outline" size="icon" onClick={copyToClipboard} title="Copy link">
                                <Copy className="w-4 h-4" />
                            </Button>
                        </div>

                        {editable && (
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded p-3 text-sm text-blue-700 dark:text-blue-400">
                                <strong>Editable:</strong> Viewers can edit live
                                {editPassword ? " with a password" : " without a password"}.
                            </div>
                        )}

                        <DialogFooter className="mt-4 flex-col sm:flex-row gap-2">
                            <Button variant="outline" onClick={handleRepublish} disabled={loading} className="flex-1">
                                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                                Republish
                            </Button>
                            <Button variant="secondary" onClick={handleToggleLive} disabled={loading} className="flex-1">
                                {editable ? "Disable Live" : "Enable Live"}
                            </Button>
                            <Button variant="destructive" onClick={handleUnpublish} disabled={loading} className="flex-1">
                                <Trash2 className="w-4 h-4 mr-2" /> Unpublish
                            </Button>
                            <Button asChild className="flex-1">
                                <a href={shareUrl} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="w-4 h-4 mr-2" /> Open Link
                                </a>
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
