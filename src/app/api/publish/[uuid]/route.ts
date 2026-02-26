import { NextResponse, NextRequest } from "next/server";
import { getPublished, savePublished } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ uuid: string }> }) {
    const { uuid } = await params;
    const publishedList = getPublished();
    const snapshot = publishedList.find((p) => p.uuid === uuid);

    if (!snapshot) return new NextResponse("Not found", { status: 404 });
    return NextResponse.json(snapshot);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ uuid: string }> }) {
    const { uuid } = await params;
    const publishedList = getPublished();
    const filtered = publishedList.filter((p) => p.uuid !== uuid);
    savePublished(filtered);
    return new NextResponse(null, { status: 204 });
}
