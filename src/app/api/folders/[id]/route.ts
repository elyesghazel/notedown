import { getUserId } from "@/lib/auth";
import { NextResponse, NextRequest } from "next/server";
import { getFolders, saveFolders, getDocuments, saveDocuments, getSpaces } from "@/lib/db";
import { slugify } from "@/lib/slugify";
import { Folder, Document } from "@/lib/types";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const userId = await getUserId();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });
    const { id } = await params;
    const body = await req.json();
    const folders = getFolders(userId);
    const docs = getDocuments(userId);
    const idx = folders.findIndex((f) => f.id === id);

    if (idx === -1) return new NextResponse("Not found", { status: 404 });

    if (body.name !== undefined) {
        folders[idx].name = body.name;
        folders[idx].slug = slugify(body.name);
    }

    if (body.parentFolderId !== undefined || body.parentFolderId === null) {
        // Validate parent folder ownership  
        if (body.parentFolderId !== null) {
            if (!folders.find(f => f.id === body.parentFolderId)) {
                return new NextResponse("Invalid parentFolderId", { status: 403 });
            }
        }
        folders[idx].parentFolderId = body.parentFolderId;
    }

    if (body.spaceId !== undefined && body.spaceId !== folders[idx].spaceId) {
        // Validate space ownership
        const spaces = getSpaces(userId);
        if (!spaces.find(s => s.id === body.spaceId)) {
            return new NextResponse("Invalid spaceId", { status: 403 });
        }
        const newSpaceId = body.spaceId;
        folders[idx].spaceId = newSpaceId;

        const updateChildren = (folderId: string) => {
            folders.filter(f => f.parentFolderId === folderId).forEach(f => {
                f.spaceId = newSpaceId;
                updateChildren(f.id);
            });
            docs.filter(d => d.folderId === folderId).forEach(d => {
                d.spaceId = newSpaceId;
            });
        };
        updateChildren(id);
        saveDocuments(userId, docs);
    }

    saveFolders(userId, folders);

    return NextResponse.json(folders[idx]);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
