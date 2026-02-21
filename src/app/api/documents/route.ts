import { getUserId } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getDocuments, saveDocuments } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { slugify } from "@/lib/slugify";
import { Document } from "@/lib/types";

export async function GET(req: Request) {
    const userId = await getUserId();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });
    const { searchParams } = new URL(req.url);
    const spaceId = searchParams.get("spaceId");
    const docs = getDocuments(userId);

    if (spaceId) {
        return NextResponse.json(docs.filter((d) => d.spaceId === spaceId));
    }
    return NextResponse.json(docs);
}

export async function POST(req: Request) {
    const userId = await getUserId();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });
    const { spaceId, name, folderId } = await req.json();
    const docs = getDocuments(userId);

    let slug = slugify(name);
    if (!slug.endsWith(".md")) {
        slug += ".md";
    }

    const doc: Document = {
        id: uuidv4(),
        spaceId,
        folderId: folderId || null,
        name,
        slug,
        content: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    docs.push(doc);
    saveDocuments(userId, docs);

    return NextResponse.json(doc);
}
