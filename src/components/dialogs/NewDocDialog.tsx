"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api-client";
import { mutate } from "swr";
import { useRouter } from "next/navigation";
import { buildDocUrl, getFolderPath } from "@/lib/url";
import { Folder } from "@/lib/types";

interface NewDocDialogProps {
    spaceId: string;
    spaceSlug: string;
    folderId?: string | null;
    folders?: Folder[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function NewDocDialog({ spaceId, spaceSlug, folderId = null, folders = [], open, onOpenChange }: NewDocDialogProps) {
    const [name, setName] = useState("");
    const router = useRouter();

    const handleCreate = async () => {
        if (!name.trim()) return;
        const doc = await api.createDocument(spaceId, name.trim(), folderId);

        // Invalidate ALL document caches so sidebar updates
        await mutate((key: string) => typeof key === "string" && key.startsWith("/api/documents"), undefined, { revalidate: true });

        onOpenChange(false);
        setName("");

        // Navigate to the new document
        const folderSlugs = folderId ? getFolderPath(folderId, folders) : [];
        router.push(buildDocUrl(spaceSlug, folderSlugs, doc.slug));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create a new document</DialogTitle>
                </DialogHeader>
                <Input
                    placeholder="Document name (e.g., meeting-notes)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                    autoFocus
                />
                <DialogFooter>
                    <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleCreate} disabled={!name.trim()}>Create document</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
