import { getUserId } from "@/lib/auth";
import { NextResponse, NextRequest } from "next/server";
import { getDocuments, saveDocuments, getSpaces, getFolders } from "@/lib/db";
import { slugify } from "@/lib/slugify";
import { Document } from "@/lib/types";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const userId = await getUserId();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });
    const { id } = await params;
    const docs = getDocuments(userId);
    const doc = docs.find((d) => d.id === id);
    if (!doc) return new NextResponse("Not found", { status: 404 });
    return NextResponse.json(doc);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const userId = await getUserId();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });
    const { id } = await params;
    const body = await req.json();
    const docs = getDocuments(userId);
    const idx = docs.findIndex((d) => d.id === id);

    if (idx === -1) return new NextResponse("Not found", { status: 404 });

    if (body.name !== undefined) {
        docs[idx].name = body.name;
        let slug = slugify(body.name);
        if (!slug.endsWith(".md")) slug += ".md";
        docs[idx].slug = slug;
    }

    if (body.content !== undefined) {
        docs[idx].content = body.content;
    }

    if (body.folderId !== undefined || body.folderId === null) {
        // Validate folder ownership
        if (body.folderId !== null) {
            const folders = getFolders(userId);
            if (!folders.find(f => f.id === body.folderId)) {
                return new NextResponse("Invalid folderId", { status: 403 });
            }
        }
        docs[idx].folderId = body.folderId;
    }

    if (body.spaceId !== undefined) {
        // Validate space ownership
        const spaces = getSpaces(userId);
        if (!spaces.find(s => s.id === body.spaceId)) {
            return new NextResponse("Invalid spaceId", { status: 403 });
        }
        docs[idx].spaceId = body.spaceId;
    }

    docs[idx].updatedAt = new Date().toISOString();
    saveDocuments(userId, docs);

    return NextResponse.json(docs[idx]);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const userId = await getUserId();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });
    const { id } = await params;
    const docs = getDocuments(userId);
    const filtered = docs.filter((d) => d.id !== id);
    saveDocuments(userId, filtered);
    return new NextResponse(null, { status: 204 });
}
