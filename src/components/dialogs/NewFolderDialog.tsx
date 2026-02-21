"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api-client";
import { mutate } from "swr";

interface NewFolderDialogProps {
    spaceId: string;
    parentFolderId?: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function NewFolderDialog({ spaceId, parentFolderId = null, open, onOpenChange }: NewFolderDialogProps) {
    const [name, setName] = useState("");

    const handleCreate = async () => {
        if (!name.trim()) return;
        await api.createFolder(spaceId, parentFolderId, name.trim());
        // Invalidate ALL folder caches so sidebar updates
        await mutate((key: string) => typeof key === "string" && key.startsWith("/api/folders"), undefined, { revalidate: true });
        onOpenChange(false);
        setName("");
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create a new folder</DialogTitle>
                </DialogHeader>
                <Input
                    placeholder="Folder name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                    autoFocus
                />
                <DialogFooter>
                    <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleCreate} disabled={!name.trim()}>Create folder</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
