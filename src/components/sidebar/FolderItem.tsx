"use client";

import { useState } from "react";
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

interface FolderItemProps {
    node: TreeNodeType;
    space: Space;
    folders: Folder[];
    depth: number;
    children?: React.ReactNode;
}

export function FolderItem({ node, space, folders, depth, children }: FolderItemProps) {
    const [expanded, setExpanded] = useState(false);
    const [newFolderOpen, setNewFolderOpen] = useState(false);
    const [newDocOpen, setNewDocOpen] = useState(false);

    const handleRename = async () => {
        const newName = prompt("Rename Folder:", node.name);
        if (!newName) return;
        await api.renameFolder(node.id, newName);
        await mutate((key: string) => typeof key === "string" && key.startsWith("/api/folders"), undefined, { revalidate: true });
    };

    const handleDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${node.name}? This will delete all subfolders and documents.`)) return;
        await api.deleteFolder(node.id);
        await mutate((key: string) => typeof key === "string" && key.startsWith("/api/folders"), undefined, { revalidate: true });
        await mutate((key: string) => typeof key === "string" && key.startsWith("/api/documents"), undefined, { revalidate: true });
    };

    return (
        <>
            <ContextMenu>
                <ContextMenuTrigger asChild>
                    <div
                        className="group flex items-center justify-between hover:bg-muted/50 rounded-md cursor-pointer text-sm mb-0.5 pr-2"
                        style={{ paddingLeft: `${depth * 16}px` }}
                    >
                        <div className="flex items-center flex-1 overflow-hidden py-1 h-full" onClick={() => setExpanded(!expanded)}>
                            {expanded ? <ChevronDown className="w-4 h-4 mr-1 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 mr-1 text-muted-foreground shrink-0" />}
                            <span className="truncate">{node.name}</span>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 flex-shrink-0 ml-1">
                                    <MoreHorizontal className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                                <DropdownMenuItem onClick={() => setNewDocOpen(true)}>
                                    <FilePlus className="w-4 h-4 mr-2" /> New Document
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setNewFolderOpen(true)}>
                                    <FolderPlus className="w-4 h-4 mr-2" /> New Subfolder
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleRename}>
                                    <Pencil className="w-4 h-4 mr-2" /> Rename
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                                    <Trash className="w-4 h-4 mr-2" /> Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                    <ContextMenuItem onClick={() => setNewDocOpen(true)}>
                        <FilePlus className="w-4 h-4 mr-2" /> New Document
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => setNewFolderOpen(true)}>
                        <FolderPlus className="w-4 h-4 mr-2" /> New Subfolder
                    </ContextMenuItem>
                    <ContextMenuItem onClick={handleRename}>
                        <Pencil className="w-4 h-4 mr-2" /> Rename
                    </ContextMenuItem>
                    <ContextMenuItem onClick={handleDelete} className="text-destructive">
                        <Trash className="w-4 h-4 mr-2" /> Delete
                    </ContextMenuItem>
                </ContextMenuContent>
            </ContextMenu>

            {expanded && <div className="space-y-0.5">{children}</div>}

            <NewFolderDialog spaceId={space.id} parentFolderId={node.id} open={newFolderOpen} onOpenChange={setNewFolderOpen} />
            <NewDocDialog spaceId={space.id} spaceSlug={space.slug} folderId={node.id} folders={folders} open={newDocOpen} onOpenChange={setNewDocOpen} />
        </>
    );
}
