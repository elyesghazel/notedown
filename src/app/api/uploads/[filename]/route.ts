import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getUserId } from "@/lib/auth";
import { getUploads } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const userId = await getUserId();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const { filename } = await params;
  const url = new URL(req.url);
  const download = url.searchParams.get("download") === "1";

  // Security: prevent directory traversal
  if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // Security: verify file ownership
  const uploads = getUploads(userId);
  const userFile = uploads.find(u => u.filename === filename && u.source === "local");
  
  if (!userFile) {
    return new NextResponse("Not found", { status: 404 });
  }

  const filepath = path.join(process.cwd(), "public", "uploads", filename);

  if (!fs.existsSync(filepath)) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const buffer = fs.readFileSync(filepath);
    const ext = path.extname(filename).toLowerCase();

    const mimeTypes: { [key: string]: string } = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".pdf": "application/pdf",
    };

    const contentType = mimeTypes[ext] || "application/octet-stream";
    const contentDisposition = download
      ? `attachment; filename="${filename}"`
      : ext === ".pdf"
      ? `inline; filename="${filename}"`
      : undefined;

    return new NextResponse(buffer, {
      headers: { 
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=31536000, immutable",
        ...(contentDisposition ? { "Content-Disposition": contentDisposition } : {}),
      },
    });
  } catch (err: any) {
    return new NextResponse("Server error", { status: 500 });
  }
}
