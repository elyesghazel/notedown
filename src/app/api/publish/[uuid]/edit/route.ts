import { NextResponse, NextRequest } from "next/server";
import { getPublished, savePublished, getUsers, getDocuments, saveDocuments } from "@/lib/db";
import bcrypt from "bcryptjs";
import { checkRateLimit, getClientIp } from "@/lib/ratelimit";

export async function POST(req: NextRequest, { params }: { params: Promise<{ uuid: string }> }) {
    const { uuid } = await params;
    
    // Rate limit: 10 edits per 5 minutes per IP per document
    const clientIp = getClientIp(req);
    const rateLimitResponse = checkRateLimit(`${clientIp}:${uuid}`, {
        windowMs: 5 * 60 * 1000,
        maxRequests: 10,
        keyPrefix: "publish-edit"
    });
    
    if (rateLimitResponse) {
        return rateLimitResponse;
    }

    const { content, editPassword, guestName, validate } = await req.json();

    if (!guestName || typeof guestName !== "string" || guestName.trim().length < 2) {
        return new NextResponse(JSON.stringify({ error: "Guest name required (2+ characters)" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    const publishedList = getPublished();
    const published = publishedList.find((p) => p.uuid === uuid);

    if (!published) {
        return new NextResponse(JSON.stringify({ error: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
    }

    if (!published.editable) {
        return new NextResponse(JSON.stringify({ error: "Not editable" }), { status: 403, headers: { "Content-Type": "application/json" } });
    }

    if (published.editPassword) {
        const valid = await bcrypt.compare(editPassword || "", published.editPassword);
        if (!valid) {
            return new NextResponse(JSON.stringify({ error: "Invalid edit password" }), { status: 401, headers: { "Content-Type": "application/json" } });
        }
    }

    let ownerId = published.ownerId;
    if (!ownerId) {
        const users = getUsers();
        for (const user of users) {
            const docs = getDocuments(user.id);
            if (docs.some((d) => d.id === published.docId)) {
                ownerId = user.id;
                break;
            }
        }
        if (ownerId) {
            const idx = publishedList.findIndex((p) => p.uuid === uuid);
            if (idx !== -1) {
                publishedList[idx].ownerId = ownerId;
                savePublished(publishedList);
            }
        }
    }

    if (!ownerId) {
        return new NextResponse(JSON.stringify({ error: "Owner not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
    }

    if (validate) {
        return NextResponse.json({ success: true });
    }

    if (typeof content !== "string") {
        return new NextResponse(JSON.stringify({ error: "Content is required" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    const docs = getDocuments(ownerId);
    const docIdx = docs.findIndex((d) => d.id === published.docId);
    if (docIdx === -1) {
        return new NextResponse(JSON.stringify({ error: "Document not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
    }

    docs[docIdx].content = content;
    docs[docIdx].updatedAt = new Date().toISOString();
    saveDocuments(ownerId, docs);

    const pubIdx = publishedList.findIndex((p) => p.uuid === uuid);
    if (pubIdx !== -1) {
        publishedList[pubIdx].content = content;
        publishedList[pubIdx].publishedAt = new Date().toISOString();
        savePublished(publishedList);
    }

    return NextResponse.json({ success: true, updatedAt: docs[docIdx].updatedAt });
}
