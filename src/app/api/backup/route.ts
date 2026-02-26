import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import {
    getUsers,
    saveUsers,
    getWorkspaces,
    saveWorkspaces,
    getSpaces,
    saveSpaces,
    getFolders,
    saveFolders,
    getDocuments,
    saveDocuments,
    getPublished,
    savePublished,
    getPdfPresets,
    savePdfPresets,
} from "@/lib/db";

export async function GET() {
    const userId = await getUserId();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const users = getUsers();
    const user = users.find((u) => u.id === userId);

    const workspaces = getWorkspaces(userId);
    const spaces = getSpaces(userId);
    const folders = getFolders(userId);
    const documents = getDocuments(userId);
    const presets = getPdfPresets(userId);

    const docIds = new Set(documents.map((d) => d.id));
    const published = getPublished()
        .filter((p) => docIds.has(p.docId))
        .map(({ editPassword, ...safe }) => safe); // Remove password hashes

    const payload = {
        version: 1,
        exportedAt: new Date().toISOString(),
        profile: {
            displayName: user?.displayName || user?.username || "",
        },
        workspaces,
        spaces,
        folders,
        documents,
        published,
        pdfPresets: presets,
    };

    return new NextResponse(JSON.stringify(payload, null, 2), {
        headers: {
            "Content-Type": "application/json",
            "Content-Disposition": "attachment; filename=\"notedown-backup.json\"",
        },
    });
}

export async function POST(req: Request) {
    const userId = await getUserId();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    let body: any;
    try {
        body = await req.json();
    } catch {
        return new NextResponse("Invalid JSON", { status: 400 });
    }

    const workspaces = Array.isArray(body?.workspaces) ? body.workspaces : [];
    const spaces = Array.isArray(body?.spaces) ? body.spaces : [];
    const folders = Array.isArray(body?.folders) ? body.folders : [];
    const documents = Array.isArray(body?.documents) ? body.documents : [];
    const pdfPresets = Array.isArray(body?.pdfPresets) ? body.pdfPresets : [];
    const incomingPublished = Array.isArray(body?.published) ? body.published : [];

    const existingDocs = getDocuments(userId);
    const existingDocIds = new Set(existingDocs.map((d) => d.id));
    const incomingDocIds = new Set(documents.map((d: any) => d.id));

    saveWorkspaces(userId, workspaces);
    saveSpaces(userId, spaces);
    saveFolders(userId, folders);
    saveDocuments(userId, documents);
    savePdfPresets(userId, pdfPresets);

    const allPublished = getPublished();
    const filteredPublished = allPublished.filter((p) => !existingDocIds.has(p.docId));
    const nextPublished = filteredPublished.concat(
        incomingPublished.filter((p: any) => incomingDocIds.has(p.docId))
    );
    savePublished(nextPublished);

    if (body?.profile?.displayName && typeof body.profile.displayName === "string") {
        const users = getUsers();
        const idx = users.findIndex((u) => u.id === userId);
        if (idx !== -1) {
            users[idx].displayName = body.profile.displayName.trim() || users[idx].username;
            saveUsers(users);
        }
    }

    return NextResponse.json({ success: true });
}
