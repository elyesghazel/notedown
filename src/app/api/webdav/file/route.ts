import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { getUsers } from "@/lib/db";
import { buildWebDavAuth, buildWebDavUrl } from "@/lib/webdav";

function normalizeBasePath(pathValue?: string) {
    if (!pathValue) return "/";
    let path = pathValue.trim();
    if (!path.startsWith("/")) path = `/${path}`;
    if (!path.endsWith("/")) path += "/";
    return path;
}

export async function GET(req: Request) {
    const userId = await getUserId();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const users = getUsers();
    const user = users.find((u) => u.id === userId);
    if (!user?.webdav?.enabled) return new NextResponse("WebDAV not configured", { status: 400 });

    const { searchParams } = new URL(req.url);
    const path = searchParams.get("path") || "";
    const download = searchParams.get("download") === "1";
    if (!path) return new NextResponse("Missing path", { status: 400 });

    const basePath = normalizeBasePath(user.webdav.basePath);
    if (!path.startsWith(basePath)) {
        return new NextResponse("Invalid path", { status: 403 });
    }

    const res = await fetch(buildWebDavUrl(user.webdav, path), {
        headers: {
            Authorization: buildWebDavAuth(user.webdav),
        },
    });

    if (!res.ok) {
        return new NextResponse("Not found", { status: res.status });
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get("Content-Type") || "application/octet-stream";
    const filename = path.split("/").pop() || "download";
    const contentDisposition = download
      ? `attachment; filename="${filename}"`
      : `inline; filename="${filename}"`;

    return new NextResponse(buffer, {
        headers: {
            "Content-Type": contentType,
            "Content-Disposition": contentDisposition,
            "Cache-Control": "private, max-age=0, must-revalidate",
        },
    });
}
