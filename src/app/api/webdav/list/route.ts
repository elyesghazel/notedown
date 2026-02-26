import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { getUsers } from "@/lib/db";
import { parseWebDavList, webdavPropfind } from "@/lib/webdav";

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
    if (!user?.webdav?.enabled) return NextResponse.json([]);

    const basePath = normalizeBasePath(user.webdav.basePath);
    const xml = await webdavPropfind(user.webdav, basePath, "1");
    const entries = parseWebDavList(xml);

    const uploads = entries
        .filter((entry) => !entry.href.endsWith("/"))
        .map((entry) => {
            const name = entry.displayName || entry.href.split("/").filter(Boolean).pop() || "file";
            const isPdf = entry.contentType === "application/pdf" || name.toLowerCase().endsWith(".pdf");
            if (!isPdf) return null;
            let rawHref = entry.href;
            if (rawHref.startsWith("http")) {
                try {
                    rawHref = new URL(rawHref).pathname;
                } catch {
                    // Ignore URL parsing errors
                }
            }
            const remotePath = rawHref.startsWith("/") ? rawHref : `/${rawHref}`;
            return {
                id: `webdav:${remotePath}`,
                filename: name,
                url: `/api/webdav/file?path=${encodeURIComponent(remotePath)}`,
                originalName: name,
                mimeType: entry.contentType || "application/pdf",
                size: entry.size || 0,
                createdAt: new Date().toISOString(),
                source: "webdav" as const,
                remotePath,
            };
        })
        .filter(Boolean);

    return NextResponse.json(uploads);
}
