"use client";

import { useState } from "react";
import { Space, Folder, Document } from "@/lib/types";
import { TreeNode as TreeNodeType, buildTree } from "@/lib/tree";
import { TreeNodeItem } from "./TreeNodeItem";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { ChevronRight, ChevronDown, MoreHorizontal, FolderPlus, FilePlus, Pencil, Trash } from "lucide-react";
import { NewFolderDialog } from "../dialogs/NewFolderDialog";
import { NewDocDialog } from "../dialogs/NewDocDialog";
import { mutate } from "swr";
import { api } from "@/lib/api-client";
import { useRouter } from "next/navigation";

interface SpaceItemProps {
    space: Space;
    folders: Folder[];
    documents: Document[];
}

export function SpaceItem({ space, folders, documents }: SpaceItemProps) {
    const [expanded, setExpanded] = useState(true);
    const [newFolderOpen, setNewFolderOpen] = useState(false);
    const [newDocOpen, setNewDocOpen] = useState(false);
    const router = useRouter();

    const handleRename = async () => {
        const newName = prompt("Rename Space:", space.name);
        if (!newName) return;
        await api.renameSpace(space.id, newName);
        await mutate((key: string) => typeof key === "string" && key.startsWith("/api/spaces"), undefined, { revalidate: true });
    };

    const handleDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${space.name}?`)) return;
        await api.deleteSpace(space.id);
        await mutate((key: string) => typeof key === "string" && (key.startsWith("/api/spaces") || key.startsWith("/api/documents") || key.startsWith("/api/folders")), undefined, { revalidate: true });
        router.push("/");
    };

    const tree = buildTree(space.id, folders, documents, null);

    return (
        <div className="mb-6">
            <ContextMenu>
                <ContextMenuTrigger asChild>
                    <div className="group flex items-center justify-between px-2 py-1 hover:bg-muted/50 rounded-md cursor-pointer text-sm font-semibold mb-1">
                        <div className="flex items-center flex-1" onClick={() => setExpanded(!expanded)}>
                            {expanded ? <ChevronDown className="w-4 h-4 mr-1 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 mr-1 text-muted-foreground" />}
                            {space.name}
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100">
                                    <MoreHorizontal className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                                <DropdownMenuItem onClick={() => setNewDocOpen(true)}>
                                    <FilePlus className="w-4 h-4 mr-2" /> New Document
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setNewFolderOpen(true)}>
                                    <FolderPlus className="w-4 h-4 mr-2" /> New Folder
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
                        <FolderPlus className="w-4 h-4 mr-2" /> New Folder
                    </ContextMenuItem>
                    <ContextMenuItem onClick={handleRename}>
                        <Pencil className="w-4 h-4 mr-2" /> Rename
                    </ContextMenuItem>
                    <ContextMenuItem onClick={handleDelete} className="text-destructive">
                        <Trash className="w-4 h-4 mr-2" /> Delete
                    </ContextMenuItem>
                </ContextMenuContent>
            </ContextMenu>

            {expanded && (
                <div className="space-y-0.5">
                    {tree.map(node => (
                        <TreeNodeItem key={node.id} node={node} space={space} folders={folders} depth={1} />
                    ))}
                    {tree.length === 0 && (
                        <div className="pl-6 py-1 text-xs text-muted-foreground italic">Empty space</div>
                    )}
                </div>
            )}

            <NewFolderDialog spaceId={space.id} open={newFolderOpen} onOpenChange={setNewFolderOpen} />
            <NewDocDialog spaceId={space.id} spaceSlug={space.slug} open={newDocOpen} onOpenChange={setNewDocOpen} />
        </div>
    );
}
