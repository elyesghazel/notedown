import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";

import { getUserId } from "@/lib/auth";

export async function POST(req: Request) {
    const userId = await getUserId();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return new NextResponse("No file part", { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // Attempt to keep extension
        const extMatch = file.name.match(/\.[0-9a-z]+$/i);
        const ext = extMatch ? extMatch[0] : ".png";
        const filename = `${uuidv4()}${ext}`;

        const uploadsDir = path.join(process.cwd(), "public", "uploads");
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const filepath = path.join(uploadsDir, filename);
        fs.writeFileSync(filepath, buffer);

        return NextResponse.json({ url: `/uploads/${filename}` });
    } catch (err: any) {
        return new NextResponse("Server error", { status: 500 });
    }
}
