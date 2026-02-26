"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface TemplateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    initialName?: string;
    initialContent?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: (name: string, content: string) => Promise<void> | void;
}

export function TemplateDialog({
    open,
    onOpenChange,
    title,
    initialName = "",
    initialContent = "",
    confirmLabel = "Save",
    cancelLabel = "Cancel",
    onConfirm,
}: TemplateDialogProps) {
    const [name, setName] = useState(initialName);
    const [content, setContent] = useState(initialContent);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (open) {
            setName(initialName);
            setContent(initialContent);
        }
    }, [open, initialName, initialContent]);

    const handleConfirm = async () => {
        const nextName = name.trim();
        const nextContent = content.trim();
        if (!nextName || !nextContent) return;
        setSaving(true);
        try {
            await onConfirm(nextName, nextContent);
            onOpenChange(false);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                    <Input
                        placeholder="Template name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
                        autoFocus
                    />
                    <Textarea
                        placeholder="Template markdown..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="min-h-56 font-mono text-sm"
                    />
                </div>
                <DialogFooter>
                    <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={saving}>
                        {cancelLabel}
                    </Button>
                    <Button onClick={handleConfirm} disabled={saving || !name.trim() || !content.trim()}>
                        {confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
