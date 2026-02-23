import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { getPublished, getDocuments, saveDocuments, getWorkspaces, saveWorkspaces, getSpaces, saveSpaces } from "@/lib/db";
import { Document, Workspace, Space } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";
import { slugify } from "@/lib/slugify";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

export async function POST(req: Request, { params }: { params: Promise<{ uuid: string }> }) {
    let userId = await getUserId();
    const { uuid } = await params;
    const { editPassword, content, guestName, title } = await req.json();

    const publishedList = getPublished();
    const published = publishedList.find((p) => p.uuid === uuid);

    if (!published || !published.editable) {
        return new NextResponse(JSON.stringify({ error: "Not editable" }), { status: 403, headers: { "Content-Type": "application/json" } });
    }

    // Check password if set
    if (published.editPassword) {
        const valid = await bcrypt.compare(editPassword || "", published.editPassword);
        if (!valid) {
            return new NextResponse(JSON.stringify({ error: "Invalid edit password" }), { status: 401, headers: { "Content-Type": "application/json" } });
        }
    }

    // If not authenticated, create a guest session
    if (!userId) {
        if (!guestName || typeof guestName !== "string" || guestName.trim().length < 2) {
            return new NextResponse(JSON.stringify({ error: "Guest name required (2+ characters)" }), { status: 400, headers: { "Content-Type": "application/json" } });
        }
        userId = `guest_${uuidv4()}`;
        const cookieStore = await cookies();
        cookieStore.set({
            name: "guest-id",
            value: userId,
            httpOnly: true,
            path: "/",
            maxAge: 24 * 60 * 60, // 24 hours
        });
        cookieStore.set({
            name: "guest-name",
            value: guestName.trim(),
            httpOnly: false,
            path: "/",
            maxAge: 24 * 60 * 60, // 24 hours
        });
    }

    // Ensure workspace and space exist for this user
    let workspaces = getWorkspaces(userId);
    if (workspaces.length === 0) {
        const newWorkspace: Workspace = {
            id: uuidv4(),
            name: "Personal",
            slug: "personal",
            createdAt: new Date().toISOString(),
        };
        workspaces = [newWorkspace];
        saveWorkspaces(userId, workspaces);
    }

    let spaces = getSpaces(userId);
    const defaultWorkspaceId = workspaces[0].id;
    if (spaces.length === 0) {
        const newSpace: Space = {
            id: uuidv4(),
            workspaceId: defaultWorkspaceId,
            name: "Shared Edits",
            slug: "shared-edits",
            createdAt: new Date().toISOString(),
        };
        spaces = [newSpace];
        saveSpaces(userId, spaces);
    }

    // Create fork document
    const forkName = title ? `${title} (edited)` : "Edited Document";
    let slug = slugify(forkName);
    if (!slug.endsWith(".md")) slug += ".md";

    const newDoc: Document = {
        id: uuidv4(),
        spaceId: spaces[0].id,
        folderId: null,
        name: forkName,
        slug,
        content: typeof content === "string" ? content : "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    const docs = getDocuments(userId);
    docs.push(newDoc);
    saveDocuments(userId, docs);

    return NextResponse.json({ docId: newDoc.id, name: newDoc.name });
}
