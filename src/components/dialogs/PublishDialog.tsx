"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api-client";
import { Document } from "@/lib/types";
import { Loader2, Copy, ExternalLink, Globe, RefreshCw } from "lucide-react";

interface PublishDialogProps {
    doc: Document;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function PublishDialog({ doc, open, onOpenChange }: PublishDialogProps) {
    const [loading, setLoading] = useState(false);
    const [shareUrl, setShareUrl] = useState<string | null>(null);
    const [republished, setRepublished] = useState(false);

    // Reset state when dialog opens
    useEffect(() => {
        if (!open) {
            setShareUrl(null);
            setRepublished(false);
        }
    }, [open]);

    const handlePublish = async () => {
        setLoading(true);
        setRepublished(false);
        try {
            const { uuid } = await api.publishDoc(doc.id);
            const url = `${window.location.origin}/share/${uuid}`;
            setShareUrl(url);
        } catch {
            alert("Failed to publish");
        } finally {
            setLoading(false);
        }
    };

    const handleRepublish = async () => {
        setLoading(true);
        try {
            // The API already handles updating if docId exists
            const { uuid } = await api.publishDoc(doc.id);
            const url = `${window.location.origin}/share/${uuid}`;
            setShareUrl(url);
            setRepublished(true);
        } catch {
            alert("Failed to republish");
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
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Publish Document</DialogTitle>
                </DialogHeader>

                {!shareUrl ? (
                    <div className="flex flex-col items-center justify-center py-6 space-y-4">
                        <Globe className="w-12 h-12 text-muted-foreground" />
                        <p className="text-sm text-center text-muted-foreground max-w-[280px]">
                            Publishing creates a read-only snapshot accessible via a unique URL. If already published, it will update the existing snapshot.
                        </p>
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
                        <DialogFooter className="mt-4 flex-col sm:flex-row gap-2">
                            <Button variant="outline" onClick={handleRepublish} disabled={loading} className="flex-1">
                                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                                Republish (Update Snapshot)
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
