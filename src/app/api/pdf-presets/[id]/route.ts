import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { getPdfPresets, savePdfPresets } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const userId = await getUserId();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });
    const { id } = await params;
    const { name, header, footer } = await req.json();

    const presets = getPdfPresets(userId);
    const idx = presets.findIndex((p) => p.id === id);
    if (idx === -1) return new NextResponse("Not found", { status: 404 });

    if (name !== undefined) {
        const trimmed = String(name).trim();
        if (trimmed.length < 2 || trimmed.length > 80) {
            return new NextResponse("Name must be 2-80 characters", { status: 400 });
        }
        presets[idx].name = trimmed;
    }

    if (header !== undefined) {
        presets[idx].header = Array.isArray(header) ? header : [];
    }

    if (footer !== undefined) {
        presets[idx].footer = Array.isArray(footer) ? footer : [];
    }

    presets[idx].updatedAt = new Date().toISOString();
    savePdfPresets(userId, presets);

    return NextResponse.json(presets[idx]);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const userId = await getUserId();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });
    const { id } = await params;

    const presets = getPdfPresets(userId);
    const next = presets.filter((p) => p.id !== id);
    savePdfPresets(userId, next);

    return new NextResponse(null, { status: 204 });
}
