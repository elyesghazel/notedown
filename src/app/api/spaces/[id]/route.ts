import { getUserId } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getSpaces, saveSpaces, getDocuments, saveDocuments, getFolders, saveFolders } from "@/lib/db";
import { slugify } from "@/lib/slugify";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const userId = await getUserId();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });
    const { id } = await params;
    const { name } = await req.json();
    const spaces = getSpaces(userId);
    const idx = spaces.findIndex((s) => s.id === id);
    if (idx === -1) return new NextResponse("Not found", { status: 404 });

    spaces[idx].name = name;
    spaces[idx].slug = slugify(name);
    saveSpaces(userId, spaces);

    return NextResponse.json(spaces[idx]);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const userId = await getUserId();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });
    const { id } = await params;
    const spaces = getSpaces(userId);
    const filteredSpaces = spaces.filter((s) => s.id !== id);
    saveSpaces(userId, filteredSpaces);

    // Cascade delete folders and docs
    const folders = getFolders(userId);
    saveFolders(userId, folders.filter((f) => f.spaceId !== id));

    const docs = getDocuments(userId);
    saveDocuments(userId, docs.filter((d) => d.spaceId !== id));

    return new NextResponse(null, { status: 204 });
}
