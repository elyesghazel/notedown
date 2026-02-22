"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";
import { mutate } from "swr";
import { Workspace, Space, Folder } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";

interface MoveDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    type: "doc" | "folder";
    itemId: string;
    itemName: string;
    currentSpaceId: string;
}

export function MoveDialog({ open, onOpenChange, type, itemId, itemName, currentSpaceId }: MoveDialogProps) {
    const [loading, setLoading] = useState(false);
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [spaces, setSpaces] = useState<Space[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);

    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>("");
    const [selectedSpaceId, setSelectedSpaceId] = useState<string>(currentSpaceId);
    const [selectedFolderId, setSelectedFolderId] = useState<string>("root");

    useEffect(() => {
        if (open) {
            api.getWorkspaces().then((wss) => {
                setWorkspaces(wss);
                if (wss.length > 0) setSelectedWorkspaceId(wss[0].id);
            });
        }
    }, [open]);

    useEffect(() => {
        if (selectedWorkspaceId) {
            api.getSpaces(selectedWorkspaceId).then((sps) => {
                setSpaces(sps);
                if (!sps.find(s => s.id === selectedSpaceId)) {
                    setSelectedSpaceId(sps.length > 0 ? sps[0].id : "");
                }
            });
        }
    }, [selectedWorkspaceId]);

    useEffect(() => {
        if (selectedSpaceId) {
            api.getFolders(selectedSpaceId).then((f) => {
                setFolders(f);
                setSelectedFolderId("root");
            });
        }
    }, [selectedSpaceId]);

    const router = useRouter();

    const handleMove = async () => {
        if (!selectedSpaceId) return;

        setLoading(true);
        try {
            const fId = selectedFolderId === "root" ? null : selectedFolderId;
            if (type === "doc") {
                await api.moveDocument(itemId, selectedSpaceId, fId);
                await mutate((key: string) => typeof key === "string" && key.startsWith("/api/documents"), undefined, { revalidate: true });
            } else {
                await api.moveFolder(itemId, selectedSpaceId, fId);
                await mutate((key: string) => typeof key === "string" && (key.startsWith("/api/folders") || key.startsWith("/api/documents")), undefined, { revalidate: true });
            }
            onOpenChange(false);

            // Redirect to root to clear the active editor context, which is now pointing to a missing/moved path
            router.push('/');
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Move "{itemName}"</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Select Workspace</Label>
                        <Select value={selectedWorkspaceId} onValueChange={setSelectedWorkspaceId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Workspace" />
                            </SelectTrigger>
                            <SelectContent>
                                {workspaces.map((ws) => (
                                    <SelectItem key={ws.id} value={ws.id}>{ws.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label>Select Space</Label>
                        <Select value={selectedSpaceId} onValueChange={setSelectedSpaceId} disabled={!selectedWorkspaceId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Space" />
                            </SelectTrigger>
                            <SelectContent>
                                {spaces.map((s) => (
                                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label>Select Folder</Label>
                        <Select value={selectedFolderId} onValueChange={setSelectedFolderId} disabled={!selectedSpaceId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Space Root" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="root">-- / (Space Root)</SelectItem>
                                {folders.map((f) => (
                                    <SelectItem key={f.id} value={f.id} disabled={type === "folder" && f.id === itemId}>
                                        📁 {f.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleMove} disabled={loading || !selectedSpaceId}>
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Move
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
