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

interface DocItemProps {
    node: TreeNodeType;
    space: Space;
    folders: Folder[];
    depth: number;
}

export function DocItem({ node, space, folders, depth }: DocItemProps) {
    const router = useRouter();
    const pathname = usePathname();

    const folderSlugs = node.folderId ? getFolderPath(node.folderId, folders) : [];
    const href = buildDocUrl(space.slug, folderSlugs, node.slug);
    const isActive = pathname === href;

    const handleRename = async () => {
        let newName = prompt("Rename Document:", node.name);
        if (!newName) return;

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

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>
                <div
                    className={`group flex items-center justify-between rounded-md transition-colors text-sm mb-0.5 ${isActive ? "bg-primary/20 text-primary font-medium" : "hover:bg-muted/50"}`}
                    style={{ paddingLeft: `${depth * 16}px` }}
                >
                    <Link href={href} className="flex flex-1 items-center overflow-hidden py-1 px-2">
                        <FileText className={`w-3.5 h-3.5 mr-2 shrink-0 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                        <span className="truncate">{node.name}</span>
                    </Link>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 flex-shrink-0 ml-1">
                                <MoreHorizontal className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
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
                <ContextMenuItem onClick={handleRename}>
                    <Pencil className="w-4 h-4 mr-2" /> Rename
                </ContextMenuItem>
                <ContextMenuItem onClick={handleDelete} className="text-destructive">
                    <Trash className="w-4 h-4 mr-2" /> Delete
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
}
