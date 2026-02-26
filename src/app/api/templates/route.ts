import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { getTemplates, saveTemplates } from "@/lib/db";
import { MarkdownTemplate } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";

const MAX_CONTENT_LENGTH = 50000;

export async function GET() {
    const userId = await getUserId();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    return NextResponse.json(getTemplates(userId));
}

export async function POST(req: Request) {
    const userId = await getUserId();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { name, content } = await req.json();
    if (!name || typeof name !== "string") {
        return new NextResponse("Name is required", { status: 400 });
    }

    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 80) {
        return new NextResponse("Name must be 2-80 characters", { status: 400 });
    }

    if (typeof content !== "string" || content.trim().length === 0) {
        return new NextResponse("Content is required", { status: 400 });
    }

    if (content.length > MAX_CONTENT_LENGTH) {
        return new NextResponse("Content is too long", { status: 400 });
    }

    const templates = getTemplates(userId);
    const now = new Date().toISOString();

    const template: MarkdownTemplate = {
        id: uuidv4(),
        name: trimmed,
        content,
        createdAt: now,
        updatedAt: now,
    };

    templates.push(template);
    saveTemplates(userId, templates);

    return NextResponse.json(template);
}
