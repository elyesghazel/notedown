import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { getTemplates, saveTemplates } from "@/lib/db";

const MAX_CONTENT_LENGTH = 50000;

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const userId = await getUserId();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });
    const { id } = await params;
    const { name, content } = await req.json();

    const templates = getTemplates(userId);
    const idx = templates.findIndex((t) => t.id === id);
    if (idx === -1) return new NextResponse("Not found", { status: 404 });

    if (name !== undefined) {
        const trimmed = String(name).trim();
        if (trimmed.length < 2 || trimmed.length > 80) {
            return new NextResponse("Name must be 2-80 characters", { status: 400 });
        }
        templates[idx].name = trimmed;
    }

    if (content !== undefined) {
        if (typeof content !== "string" || content.trim().length === 0) {
            return new NextResponse("Content is required", { status: 400 });
        }
        if (content.length > MAX_CONTENT_LENGTH) {
            return new NextResponse("Content is too long", { status: 400 });
        }
        templates[idx].content = content;
    }

    templates[idx].updatedAt = new Date().toISOString();
    saveTemplates(userId, templates);

    return NextResponse.json(templates[idx]);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const userId = await getUserId();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });
    const { id } = await params;

    const templates = getTemplates(userId);
    const next = templates.filter((t) => t.id !== id);
    saveTemplates(userId, next);

    return new NextResponse(null, { status: 204 });
}
