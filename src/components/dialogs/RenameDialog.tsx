"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface RenameDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    initialValue: string;
    onConfirm: (value: string) => Promise<void> | void;
    confirmLabel?: string;
    cancelLabel?: string;
}

export function RenameDialog({
    open,
    onOpenChange,
    title,
    initialValue,
    onConfirm,
    confirmLabel = "OK",
    cancelLabel = "Cancel",
}: RenameDialogProps) {
    const [value, setValue] = useState(initialValue);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (open) {
            setValue(initialValue);
        }
    }, [open, initialValue]);

    const handleConfirm = async () => {
        const next = value.trim();
        if (!next) return;
        setSaving(true);
        try {
            await onConfirm(next);
            onOpenChange(false);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <Input
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
                    autoFocus
                />
                <DialogFooter>
                    <Button variant="destructive" onClick={() => onOpenChange(false)} disabled={saving}>
                        {cancelLabel}
                    </Button>
                    <Button onClick={handleConfirm} disabled={saving || !value.trim()}>
                        {confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
