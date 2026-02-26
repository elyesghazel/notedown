import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";

import { getUserId } from "@/lib/auth";
import { getUploads, saveUploads } from "@/lib/db";
import { UploadedFile } from "@/lib/types";

export async function POST(req: Request) {
    const userId = await getUserId();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            console.error("[UPLOAD] No file part in request");
            return new NextResponse("No file part", { status: 400 });
        }

        console.log(`[UPLOAD] Received file: ${file.name} (${file.size} bytes, type: ${file.type})`);

        const buffer = Buffer.from(await file.arrayBuffer());
        console.log(`[UPLOAD] Buffer created: ${buffer.length} bytes`);

        // Attempt to keep extension
        const extMatch = file.name.match(/\.[0-9a-z]+$/i);
        const ext = extMatch ? extMatch[0] : ".png";
        const filename = `${uuidv4()}${ext}`;

        const uploadsDir = path.join(process.cwd(), "public", "uploads");
        console.log(`[UPLOAD] Uploads directory: ${uploadsDir}`);

        if (!fs.existsSync(uploadsDir)) {
            console.log(`[UPLOAD] Creating uploads directory...`);
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const filepath = path.join(uploadsDir, filename);
        console.log(`[UPLOAD] Writing to: ${filepath}`);
        
        fs.writeFileSync(filepath, buffer);
        console.log(`[UPLOAD] File written successfully`);

        // Verify file exists
        if (fs.existsSync(filepath)) {
            const stats = fs.statSync(filepath);
            console.log(`[UPLOAD] File verified: ${stats.size} bytes`);
        } else {
            console.error(`[UPLOAD] File exists check failed!`);
        }

        const url = `/uploads/${filename}`;

        const uploads = getUploads(userId);
        const record: UploadedFile = {
            id: uuidv4(),
            filename,
            url,
            originalName: file.name,
            mimeType: file.type || "application/octet-stream",
            size: file.size,
            createdAt: new Date().toISOString(),
            source: "local",
        };
        uploads.push(record);
        saveUploads(userId, uploads);

        return NextResponse.json({ url });
    } catch (err: any) {
        console.error("[UPLOAD] Error:", err.message, err.stack);
        return NextResponse.json(
            { error: err.message || "Server error" },
            { status: 500 }
        );
    }
}
