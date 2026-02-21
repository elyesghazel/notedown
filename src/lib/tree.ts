import { Folder, Document } from "./types";

export interface TreeNode {
    type: "folder" | "document";
    id: string;
    name: string;
    slug: string;
    children?: TreeNode[];
    folderId?: string | null;
}

export function buildTree(
    spaceId: string,
    folders: Folder[],
    documents: Document[],
    parentFolderId: string | null = null
): TreeNode[] {
    const childFolders = folders
        .filter((f) => f.spaceId === spaceId && f.parentFolderId === parentFolderId)
        .map((f) => ({
            type: "folder" as const,
            id: f.id,
            name: f.name,
            slug: f.slug,
            children: buildTree(spaceId, folders, documents, f.id),
        }));

    const childDocs = documents
        .filter((d) => d.spaceId === spaceId && d.folderId === parentFolderId)
        .map((d) => ({
            type: "document" as const,
            id: d.id,
            name: d.name,
            slug: d.slug,
            folderId: d.folderId,
        }));

    return [...childFolders, ...childDocs];
}
