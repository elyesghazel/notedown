"use client";

import { useEffect, useMemo, useState } from "react";
import { TreeNode as TreeNodeType } from "@/lib/tree";
import { Space, Folder } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { ChevronRight, ChevronDown, MoreHorizontal, FolderPlus, FilePlus, Pencil, Trash } from "lucide-react";
import { NewFolderDialog } from "../dialogs/NewFolderDialog";
import { NewDocDialog } from "../dialogs/NewDocDialog";
import { mutate } from "swr";
import { api } from "@/lib/api-client";
import { MoveDialog } from "../dialogs/MoveDialog";
import { RenameDialog } from "../dialogs/RenameDialog";
import { Forward } from "lucide-react";

interface FolderItemProps {
    node: TreeNodeType;
    space: Space;
    folders: Folder[];
    depth: number;
    children?: React.ReactNode;
}

export function FolderItem({ node, space, folders, depth, children }: FolderItemProps) {
    const storageKey = useMemo(() => `folder-expanded:${node.id}`, [node.id]);
    const [expanded, setExpanded] = useState(false);
    const [newFolderOpen, setNewFolderOpen] = useState(false);
    const [newDocOpen, setNewDocOpen] = useState(false);
    const [moveOpen, setMoveOpen] = useState(false);
    const [renameOpen, setRenameOpen] = useState(false);

    useEffect(() => {
        const saved = window.localStorage.getItem(storageKey);
        if (saved !== null) {
            setExpanded(saved === "1");
        }
    }, [storageKey]);

    const toggleExpanded = () => {
        setExpanded((prev) => {
            const next = !prev;
            window.localStorage.setItem(storageKey, next ? "1" : "0");
            return next;
        });
    };

    const handleRename = async (newName: string) => {
        await api.renameFolder(node.id, newName);
        await mutate((key: string) => typeof key === "string" && key.startsWith("/api/folders"), undefined, { revalidate: true });
    };

    const handleDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${node.name}? This will delete all subfolders and documents.`)) return;
        await api.deleteFolder(node.id);
        await mutate((key: string) => typeof key === "string" && key.startsWith("/api/folders"), undefined, { revalidate: true });
        await mutate((key: string) => typeof key === "string" && key.startsWith("/api/documents"), undefined, { revalidate: true });
    };


    const handleDragStart = (e: React.DragEvent) => {
        e.stopPropagation();
        const folder = folders.find(f => f.id === node.id);
        e.dataTransfer.setData("application/json", JSON.stringify({ type: "folder", id: node.id, spaceId: space.id, parentFolderId: folder?.parentFolderId || null }));
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.add("ring-1", "ring-primary", "bg-muted/50");
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.currentTarget.classList.remove("ring-1", "ring-primary", "bg-muted/50");
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove("ring-1", "ring-primary", "bg-muted/50");
        try {
            const data = JSON.parse(e.dataTransfer.getData("application/json"));

            // Cannot drop a folder into itself or its own children (we don't strictly check deep children here for simplicity, but avoid dropping to self)
            if (data.type === "folder" && data.id === node.id) return;

            if (data.type === "doc") {
                if (data.spaceId === space.id && data.folderId === node.id) return;
                await api.moveDocument(data.id, space.id, node.id);
                await mutate((key: string) => typeof key === "string" && key.startsWith("/api/documents"), undefined, { revalidate: true });
            } else if (data.type === "folder") {
                if (data.spaceId === space.id && data.parentFolderId === node.id) return;
                await api.moveFolder(data.id, space.id, node.id);
                await mutate((key: string) => typeof key === "string" && (key.startsWith("/api/folders") || key.startsWith("/api/documents")), undefined, { revalidate: true });
            }
        } catch (err) { }
    };

    return (
        <>
            <ContextMenu>
                <ContextMenuTrigger asChild>
                    <div
                        draggable
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className="group flex items-center justify-between hover:bg-muted/50 rounded-md cursor-pointer text-sm mb-0.5 pr-2 transition-colors"
                        style={{ paddingLeft: `${depth * 16}px` }}
                    >
                        <div className="flex items-center flex-1 overflow-hidden py-1 h-full" onClick={toggleExpanded}>
                            {expanded ? <ChevronDown className="w-4 h-4 mr-1 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 mr-1 text-muted-foreground shrink-0" />}
                            <span className="truncate">{node.name}</span>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-6 w-6 p-0 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto focus-visible:opacity-100 shrink-0 ml-1 transition-opacity">
                                    <MoreHorizontal className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                                <DropdownMenuItem onClick={() => { setExpanded(true); window.localStorage.setItem(storageKey, "1"); setNewDocOpen(true); }}>
                                    <FilePlus className="w-4 h-4 mr-2" /> New Document
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setExpanded(true); window.localStorage.setItem(storageKey, "1"); setNewFolderOpen(true); }}>
                                    <FolderPlus className="w-4 h-4 mr-2" /> New Subfolder
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setRenameOpen(true)}>
                                    <Pencil className="w-4 h-4 mr-2" /> Rename
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setMoveOpen(true)}>
                                    <Forward className="w-4 h-4 mr-2" /> Move To...
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                                    <Trash className="w-4 h-4 mr-2" /> Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                    <ContextMenuItem onClick={() => { setExpanded(true); window.localStorage.setItem(storageKey, "1"); setNewDocOpen(true); }}>
                        <FilePlus className="w-4 h-4 mr-2" /> New Document
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => { setExpanded(true); window.localStorage.setItem(storageKey, "1"); setNewFolderOpen(true); }}>
                        <FolderPlus className="w-4 h-4 mr-2" /> New Subfolder
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => setRenameOpen(true)}>
                        <Pencil className="w-4 h-4 mr-2" /> Rename
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => setMoveOpen(true)}>
                        <Forward className="w-4 h-4 mr-2" /> Move To...
                    </ContextMenuItem>
                    <ContextMenuItem onClick={handleDelete} className="text-destructive">
                        <Trash className="w-4 h-4 mr-2" /> Delete
                    </ContextMenuItem>
                </ContextMenuContent>
            </ContextMenu>

            {expanded && <div className="space-y-0.5">{children}</div>}

            <NewFolderDialog spaceId={space.id} parentFolderId={node.id} open={newFolderOpen} onOpenChange={setNewFolderOpen} />
            <NewDocDialog spaceId={space.id} spaceSlug={space.slug} folderId={node.id} folders={folders} open={newDocOpen} onOpenChange={setNewDocOpen} />
            <MoveDialog open={moveOpen} onOpenChange={setMoveOpen} type="folder" itemId={node.id} itemName={node.name} currentSpaceId={space.id} />
            <RenameDialog
                open={renameOpen}
                onOpenChange={setRenameOpen}
                title="Rename Folder"
                initialValue={node.name}
                onConfirm={handleRename}
                confirmLabel="Rename"
                cancelLabel="Cancel"
            />
        </>
    );
}
