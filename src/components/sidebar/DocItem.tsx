"use client";

import { TreeNode as TreeNodeType } from "@/lib/tree";
import { Space, Folder } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { MoreHorizontal, FileText, Pencil, Trash } from "lucide-react";
import { mutate } from "swr";
import { api } from "@/lib/api-client";
import { usePathname, useRouter } from "next/navigation";
import { buildDocUrl, getFolderPath } from "@/lib/url";
import Link from "next/link";
import { useState } from "react";
import { MoveDialog } from "../dialogs/MoveDialog";
import { RenameDialog } from "../dialogs/RenameDialog";
import { Forward } from "lucide-react";

interface DocItemProps {
    node: TreeNodeType;
    space: Space;
    folders: Folder[];
    depth: number;
    publishedMap: Map<string, { editable: boolean }>;
}

export function DocItem({ node, space, folders, depth, publishedMap }: DocItemProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [moveOpen, setMoveOpen] = useState(false);
    const [renameOpen, setRenameOpen] = useState(false);

    const folderSlugs = node.folderId ? getFolderPath(node.folderId, folders) : [];
    const href = buildDocUrl(space.slug, folderSlugs, node.slug);
    const isActive = pathname === href;

    const handleRename = async (newName: string) => {

        // update current page URL if active
        let slug = newName.toLowerCase().replace(/\\s+/g, '-').replace(/[^\\w-]+/g, '');
        if (!slug.endsWith(".md")) slug += ".md";

        await api.renameDocument(node.id, newName);
        await mutate((key: string) => typeof key === "string" && key.startsWith("/api/documents"), undefined, { revalidate: true });

        if (isActive) {
            router.replace(buildDocUrl(space.slug, folderSlugs, slug));
        }
    };

    const handleDelete = async () => {
        if (!confirm(`Delete ${node.name}?`)) return;
        await api.deleteDocument(node.id);
        await mutate((key: string) => typeof key === "string" && key.startsWith("/api/documents"), undefined, { revalidate: true });

        if (isActive) {
            // route to first space
            router.push("/");
        }
    };

    const handleDragStart = (e: React.DragEvent) => {
        e.stopPropagation();
        e.dataTransfer.setData("application/json", JSON.stringify({ type: "doc", id: node.id, spaceId: space.id, folderId: node.folderId }));
        e.dataTransfer.effectAllowed = "move";
    };

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>
                <div
                    draggable
                    onDragStart={handleDragStart}
                    className={`group flex items-center justify-between rounded-md transition-colors text-sm mb-0.5 ${isActive ? "bg-primary/20 text-primary font-medium hover:bg-primary/25" : "hover:bg-muted/70"}`}
                    style={{ paddingLeft: `${depth * 16}px` }}
                >
                    <Link href={href} className="flex flex-1 items-center overflow-hidden py-1 px-2">
                        <FileText className={`w-3.5 h-3.5 mr-2 shrink-0 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                        <span className="truncate">{node.name}</span>
                        {publishedMap.get(node.id) && (
                            <span
                                className={`ml-2 inline-flex h-2 w-2 rounded-full ${publishedMap.get(node.id)?.editable ? "bg-emerald-500" : "bg-slate-400"}`}
                                title={publishedMap.get(node.id)?.editable ? "Live shared" : "Published"}
                            />
                        )}
                    </Link>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-6 w-6 p-0 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto focus-visible:opacity-100 shrink-0 ml-1 transition-opacity">
                                <MoreHorizontal className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
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
            <MoveDialog open={moveOpen} onOpenChange={setMoveOpen} type="doc" itemId={node.id} itemName={node.name} currentSpaceId={space.id} />
            <RenameDialog
                open={renameOpen}
                onOpenChange={setRenameOpen}
                title="Rename Document"
                initialValue={node.name}
                onConfirm={handleRename}
                confirmLabel="Rename"
                cancelLabel="Cancel"
            />
        </ContextMenu>
    );
}
