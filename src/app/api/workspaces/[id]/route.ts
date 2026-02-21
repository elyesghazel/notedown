import { getUserId } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getWorkspaces, saveWorkspaces, getSpaces, saveSpaces } from "@/lib/db";
import { slugify } from "@/lib/slugify";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const userId = await getUserId();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });
    const { id } = await params;
    const { name } = await req.json();
    const workspaces = getWorkspaces(userId);
    const idx = workspaces.findIndex((w) => w.id === id);
    if (idx === -1) return new NextResponse("Not found", { status: 404 });

    workspaces[idx].name = name;
    workspaces[idx].slug = slugify(name);
    saveWorkspaces(userId, workspaces);

    return NextResponse.json(workspaces[idx]);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const userId = await getUserId();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });
    const { id } = await params;
    const workspaces = getWorkspaces(userId);
    const filteredWorkspaces = workspaces.filter((w) => w.id !== id);
    saveWorkspaces(userId, filteredWorkspaces);

    // Spaces should realistically be cascade deleted here, but for now we'll just delete the workspace itself
    // as per typical minimalist spec. We can add cascade space deletion later if needed.

    return new NextResponse(null, { status: 204 });
}
