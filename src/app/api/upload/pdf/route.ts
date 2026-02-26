import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";

import { getUserId } from "@/lib/auth";
import { getUploads, saveUploads, getUsers } from "@/lib/db";
import { UploadedFile } from "@/lib/types";
import { buildRemotePath, webdavPut } from "@/lib/webdav";

export async function POST(req: Request) {
    const userId = await getUserId();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return new NextResponse("No file part", { status: 400 });
        }

        const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
        if (!isPdf) {
            return new NextResponse("Only PDF files are supported", { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const extMatch = file.name.match(/\.[0-9a-z]+$/i);
        const ext = extMatch ? extMatch[0] : ".pdf";
        const filename = `${uuidv4()}${ext}`;

        const users = getUsers();
        const user = users.find((u) => u.id === userId);
        const webdav = user?.webdav;

        if (webdav?.enabled && webdav.preferPdf) {
            const remotePath = buildRemotePath(webdav, filename);
            await webdavPut(webdav, remotePath, buffer, "application/pdf");

            const uploads = getUploads(userId);
            const record: UploadedFile = {
                id: uuidv4(),
                filename,
                url: `/api/webdav/file?path=${encodeURIComponent(remotePath)}`,
                originalName: file.name,
                mimeType: "application/pdf",
                size: file.size,
                createdAt: new Date().toISOString(),
                source: "webdav",
                remotePath,
            };
            uploads.push(record);
            saveUploads(userId, uploads);

            return NextResponse.json({ url: record.url });
        }

        const uploadsDir = path.join(process.cwd(), "public", "uploads");
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const filepath = path.join(uploadsDir, filename);
        fs.writeFileSync(filepath, buffer);

        const url = `/uploads/${filename}`;
        const uploads = getUploads(userId);
        const record: UploadedFile = {
            id: uuidv4(),
            filename,
            url,
            originalName: file.name,
            mimeType: "application/pdf",
            size: file.size,
            createdAt: new Date().toISOString(),
            source: "local",
        };
        uploads.push(record);
        saveUploads(userId, uploads);

        return NextResponse.json({ url });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
    }
}
