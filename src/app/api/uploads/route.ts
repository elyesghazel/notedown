import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { getUploads } from "@/lib/db";

export async function GET(req: Request) {
    const userId = await getUserId();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const url = new URL(req.url);
    const type = url.searchParams.get("type");
    const query = (url.searchParams.get("q") || "").toLowerCase();

    let uploads = getUploads(userId);
    if (type === "pdf") {
        uploads = uploads.filter((file) => file.mimeType === "application/pdf" || file.filename.toLowerCase().endsWith(".pdf"));
    }

    if (query) {
        uploads = uploads.filter((file) =>
            file.originalName.toLowerCase().includes(query) || file.filename.toLowerCase().includes(query)
        );
    }

    uploads.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

    return NextResponse.json(uploads);
}
