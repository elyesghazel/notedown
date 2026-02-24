"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api-client";
import { mutate } from "swr";
import { Workspace, Space, Folder } from "@/lib/types";
import { buildDocUrl, getFolderPath } from "@/lib/url";
import { useRouter } from "next/navigation";

interface QuickLensDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultWorkspaceId?: string | null;
    defaultSpaceId?: string | null;
}

function pad(num: number) {
    return String(num).padStart(2, "0");
}

function buildDefaultName(date = new Date()) {
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    return `scan-${year}${month}${day}-${hours}${minutes}${seconds}`;
}

function buildDefaultTitle(date = new Date()) {
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    return `Scan ${year}-${month}-${day}`;
}

export function QuickLensDialog({
    open,
    onOpenChange,
    defaultWorkspaceId,
    defaultSpaceId,
}: QuickLensDialogProps) {
    const [loading, setLoading] = useState(false);
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [spaces, setSpaces] = useState<Space[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);

    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>("");
    const [selectedSpaceId, setSelectedSpaceId] = useState<string>("");
    const [selectedFolderId, setSelectedFolderId] = useState<string>("root");

    const [file, setFile] = useState<File | null>(null);
    const [docName, setDocName] = useState(buildDefaultName());

    const router = useRouter();

    useEffect(() => {
        if (!open) return;
        const nextName = buildDefaultName();
        setDocName(nextName);
        setFile(null);
        api.getWorkspaces().then((wss) => {
            setWorkspaces(wss);
            const nextWorkspaceId = defaultWorkspaceId || wss[0]?.id || "";
            setSelectedWorkspaceId(nextWorkspaceId);
        });
    }, [open, defaultWorkspaceId]);

    useEffect(() => {
        if (!selectedWorkspaceId) return;
        api.getSpaces(selectedWorkspaceId).then((sps) => {
            setSpaces(sps);
            const preferredSpace = sps.find((s) => s.id === defaultSpaceId);
            const nextSpaceId = preferredSpace?.id || sps[0]?.id || "";
            setSelectedSpaceId(nextSpaceId);
        });
    }, [selectedWorkspaceId, defaultSpaceId]);

    useEffect(() => {
        if (!selectedSpaceId) return;
        api.getFolders(selectedSpaceId).then((f) => {
            setFolders(f);
            setSelectedFolderId("root");
        });
    }, [selectedSpaceId]);

    const selectedSpace = useMemo(() => spaces.find((s) => s.id === selectedSpaceId), [spaces, selectedSpaceId]);

    const handleSave = async () => {
        if (!file || !selectedSpaceId || !docName.trim()) return;
        setLoading(true);
        try {
            const response = await api.uploadImage(file);
            const filename = response.url.split("/").pop();
            const imageUrl = `/api/uploads/${filename}`;
            const title = buildDefaultTitle();
            const content = `# ${title}\n\n![scan](${imageUrl})\n`;

            const folderId = selectedFolderId === "root" ? null : selectedFolderId;
            const doc = await api.createDocument(selectedSpaceId, docName.trim(), folderId);
            await api.saveDocument(doc.id, content);

            await mutate((key: string) => typeof key === "string" && key.startsWith("/api/documents"), undefined, { revalidate: true });

            onOpenChange(false);
            setFile(null);

            if (selectedSpace?.slug) {
                const folderSlugs = folderId ? getFolderPath(folderId, folders) : [];
                router.push(buildDocUrl(selectedSpace.slug, folderSlugs, doc.slug));
            }
        } catch (error) {
            console.error("[QUICK_LENS] Failed to save scan:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                    <DialogTitle>Quick Lens</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-2">
                    <div className="grid gap-2">
                        <Label>Save to workspace</Label>
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
                        <Label>Save to space</Label>
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
                        <Label>Save to folder</Label>
                        <Select value={selectedFolderId} onValueChange={setSelectedFolderId} disabled={!selectedSpaceId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Space Root" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="root">-- / (Space Root)</SelectItem>
                                {folders.map((f) => (
                                    <SelectItem key={f.id} value={f.id}>📁 {f.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label>Document name</Label>
                        <Input
                            value={docName}
                            onChange={(e) => setDocName(e.target.value)}
                            placeholder="scan-YYYYMMDD-HHMMSS"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label>Image</Label>
                        <div className="flex items-center gap-3">
                            <Button asChild variant="outline">
                                <label>
                                    {file ? "Replace image" : "Capture or upload"}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        className="hidden"
                                        onChange={(e) => {
                                            const nextFile = e.target.files?.[0] || null;
                                            setFile(nextFile);
                                            e.currentTarget.value = "";
                                        }}
                                    />
                                </label>
                            </Button>
                            <span className="text-sm text-muted-foreground truncate">
                                {file ? file.name : "No file selected"}
                            </span>
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={loading || !file || !selectedSpaceId || !docName.trim()}>
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Save scan
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
