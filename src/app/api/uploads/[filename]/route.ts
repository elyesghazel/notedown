import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  // Security: prevent directory traversal
  if (filename.includes("..") || filename.includes("/")) {
    console.error(`[API_UPLOADS] Invalid filename: ${filename}`);
    return new NextResponse("Forbidden", { status: 403 });
  }

  const filepath = path.join(process.cwd(), "public", "uploads", filename);
  console.log(`[API_UPLOADS] GET ${filename} -> ${filepath}`);

  if (!fs.existsSync(filepath)) {
    console.error(`[API_UPLOADS] File not found: ${filepath}`);
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
    };

    const contentType = mimeTypes[ext] || "application/octet-stream";
    console.log(`[API_UPLOADS] Serving ${filename} (${buffer.length} bytes, type: ${contentType})`);

    return new NextResponse(buffer, {
      headers: { 
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable"
      },
    });
  } catch (err: any) {
    console.error(`[API_UPLOADS] Error reading file:`, err.message);
    return new NextResponse("Server error", { status: 500 });
  }
}
