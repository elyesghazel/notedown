import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { getPdfPresets, savePdfPresets } from "@/lib/db";
import { PDFPreset } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
    const userId = await getUserId();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    return NextResponse.json(getPdfPresets(userId));
}

export async function POST(req: Request) {
    const userId = await getUserId();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { name, header = [], footer = [] } = await req.json();
    if (!name || typeof name !== "string") {
        return new NextResponse("Name is required", { status: 400 });
    }

    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 80) {
        return new NextResponse("Name must be 2-80 characters", { status: 400 });
    }

    const presets = getPdfPresets(userId);
    const now = new Date().toISOString();

    const preset: PDFPreset = {
        id: uuidv4(),
        name: trimmed,
        header: Array.isArray(header) ? header : [],
        footer: Array.isArray(footer) ? footer : [],
        createdAt: now,
        updatedAt: now,
    };

    presets.push(preset);
    savePdfPresets(userId, presets);

    return NextResponse.json(preset);
}
