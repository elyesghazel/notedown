"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api-client";
import { mutate } from "swr";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export function NewSpaceDialog({ workspaceId }: { workspaceId: string }) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const router = useRouter();

    const handleCreate = async () => {
        if (!name.trim() || !workspaceId) return;
        const space = await api.createSpace(workspaceId, name.trim());
        // Invalidate ALL space caches so sidebar updates
        await mutate((key: string) => typeof key === "string" && key.startsWith("/api/spaces"), undefined, { revalidate: true });
        setOpen(false);
        setName("");
        router.push(`/${space.slug}/readme.md`);
    };

    return (
        <>
            <Button onClick={() => setOpen(true)} variant="ghost" className="w-full justify-start text-muted-foreground mt-4">
                <Plus className="w-4 h-4 mr-2" />
                New Space
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create a new space</DialogTitle>
                    </DialogHeader>
                    <Input
                        placeholder="Space name (e.g., Projects)"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                        autoFocus
                    />
                    <DialogFooter>
                        <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreate} disabled={!name.trim()}>Create space</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
