import { getUserId } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getSpaces, saveSpaces, getDocuments, saveDocuments } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { slugify } from "@/lib/slugify";
import { Space, Document } from "@/lib/types";

export async function GET(req: Request) {
    const userId = await getUserId();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });
    const url = new URL(req.url);
    const workspaceId = url.searchParams.get("workspaceId");

    let spaces = getSpaces(userId);
    if (workspaceId) {
        spaces = spaces.filter(s => s.workspaceId === workspaceId);
    }

    return NextResponse.json(spaces);
}

export async function POST(req: Request) {
    const userId = await getUserId();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });
    const { name, workspaceId } = await req.json();
    if (!name || !workspaceId) return new NextResponse("Missing fields", { status: 400 });

    const spaces = getSpaces(userId);

    const space: Space = {
        id: uuidv4(),
        workspaceId,
        name,
        slug: slugify(name) || uuidv4().slice(0, 8),
        createdAt: new Date().toISOString(),
    };

    spaces.push(space);
    saveSpaces(userId, spaces);

    // Auto-create readme.md
    const docs = getDocuments(userId);
    const readme: Document = {
        id: uuidv4(),
        spaceId: space.id,
        folderId: null,
        name: "readme",
        slug: "readme.md",
        content: `# Welcome to ${space.name}\n\nStart typing your markdown here.`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    docs.push(readme);
    saveDocuments(userId, docs);

    return NextResponse.json(space);
}
