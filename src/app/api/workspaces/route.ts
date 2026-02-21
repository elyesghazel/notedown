import { getUserId } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getWorkspaces, saveWorkspaces } from "@/lib/db";
import { slugify } from "@/lib/slugify";
import { v4 as uuidv4 } from "uuid";
import { Workspace } from "@/lib/types";

export async function GET() {
    const userId = await getUserId();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });
    const workspaces = getWorkspaces(userId);
    return NextResponse.json(workspaces);
}

export async function POST(req: Request) {
    const userId = await getUserId();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });
    const { name } = await req.json();
    if (!name) return new NextResponse("Name is required", { status: 400 });

    const workspaces = getWorkspaces(userId);
    const newWorkspace: Workspace = {
        id: uuidv4(),
        name,
        slug: slugify(name),
        createdAt: new Date().toISOString(),
    };

    workspaces.push(newWorkspace);
    saveWorkspaces(userId, workspaces);

    return NextResponse.json(newWorkspace);
}
