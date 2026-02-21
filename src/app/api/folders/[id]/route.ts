import { getUserId } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getFolders, saveFolders, getDocuments, saveDocuments } from "@/lib/db";
import { slugify } from "@/lib/slugify";
import { Folder, Document } from "@/lib/types";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const userId = await getUserId();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });
    const { id } = await params;
    const { name } = await req.json();
    const folders = getFolders(userId);
    const idx = folders.findIndex((f) => f.id === id);

    if (idx === -1) return new NextResponse("Not found", { status: 404 });

    folders[idx].name = name;
    folders[idx].slug = slugify(name);
    saveFolders(userId, folders);

    return NextResponse.json(folders[idx]);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const userId = await getUserId();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });
    const { id } = await params;
    const folders = getFolders(userId);
    const docs = getDocuments(userId);

    // Find all folder IDs to delete (recursive)
    const idsToDelete = new Set<string>();

    function gather(folderId: string) {
        if (idsToDelete.has(folderId)) return;
        idsToDelete.add(folderId);

        // Find children
        const children = folders.filter((f) => f.parentFolderId === folderId);
        for (const child of children) {
            gather(child.id);
        }
    }

    gather(id);

    // Perform deletions
    const remainingFolders = folders.filter((f) => !idsToDelete.has(f.id));
    const remainingDocs = docs.filter((d) => !d.folderId || !idsToDelete.has(d.folderId));

    saveFolders(userId, remainingFolders);
    saveDocuments(userId, remainingDocs);

    return new NextResponse(null, { status: 204 });
}
