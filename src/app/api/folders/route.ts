import { getUserId } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getFolders, saveFolders } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { slugify } from "@/lib/slugify";
import { Folder } from "@/lib/types";

export async function GET(req: Request) {
    const userId = await getUserId();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });
    const { searchParams } = new URL(req.url);
    const spaceId = searchParams.get("spaceId");
    const folders = getFolders(userId);

    if (spaceId) {
        return NextResponse.json(folders.filter((f) => f.spaceId === spaceId));
    }
    return NextResponse.json(folders);
}

export async function POST(req: Request) {
    const userId = await getUserId();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });
    const { spaceId, parentFolderId, name } = await req.json();
    const folders = getFolders(userId);

    const folder: Folder = {
        id: uuidv4(),
        spaceId,
        parentFolderId: parentFolderId || null,
        name,
        slug: slugify(name) || uuidv4().slice(0, 8),
        createdAt: new Date().toISOString(),
    };

    folders.push(folder);
    saveFolders(userId, folders);

    return NextResponse.json(folder);
}
