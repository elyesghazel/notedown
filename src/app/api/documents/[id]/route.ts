import { getUserId } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getDocuments, saveDocuments } from "@/lib/db";
import { slugify } from "@/lib/slugify";
import { Document } from "@/lib/types";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const userId = await getUserId();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });
    const { id } = await params;
    const docs = getDocuments(userId);
    const doc = docs.find((d) => d.id === id);
    if (!doc) return new NextResponse("Not found", { status: 404 });
    return NextResponse.json(doc);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
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
        docs[idx].folderId = body.folderId;
    }

    if (body.spaceId !== undefined) {
        docs[idx].spaceId = body.spaceId;
    }

    docs[idx].updatedAt = new Date().toISOString();
    saveDocuments(userId, docs);

    return NextResponse.json(docs[idx]);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const userId = await getUserId();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });
    const { id } = await params;
    const docs = getDocuments(userId);
    const filtered = docs.filter((d) => d.id !== id);
    saveDocuments(userId, filtered);
    return new NextResponse(null, { status: 204 });
}
