import { getUserId } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getSpaces, getDocuments, getFolders, getUploads, getUsers } from "@/lib/db";
import { UploadedFile } from "@/lib/types";
import { parseWebDavList, webdavPropfind } from "@/lib/webdav";

export async function GET() {
    const userId = await getUserId();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });
    const spaces = getSpaces(userId);
    const documents = getDocuments(userId);
    const folders = getFolders(userId);
    let uploads = getUploads(userId);

    try {
        const users = getUsers();
        const user = users.find((u) => u.id === userId);
        if (user?.webdav?.enabled) {
            const xml = await webdavPropfind(user.webdav, user.webdav.basePath || "/", "1");
            const entries = parseWebDavList(xml);
            const webdavUploads: UploadedFile[] = [];
            for (const entry of entries) {
                if (entry.href.endsWith("/")) continue;
                const name = entry.displayName || entry.href.split("/").filter(Boolean).pop() || "file";
                const isPdf = entry.contentType === "application/pdf" || name.toLowerCase().endsWith(".pdf");
                if (!isPdf) continue;
                let rawHref = entry.href;
                if (rawHref.startsWith("http")) {
                    try {
                        rawHref = new URL(rawHref).pathname;
                    } catch {
                        // Ignore URL parsing errors
                    }
                }
                const remotePath = rawHref.startsWith("/") ? rawHref : `/${rawHref}`;
                webdavUploads.push({
                    id: `webdav:${remotePath}`,
                    filename: name,
                    url: `/api/webdav/file?path=${encodeURIComponent(remotePath)}`,
                    originalName: name,
                    mimeType: entry.contentType || "application/pdf",
                    size: entry.size || 0,
                    createdAt: new Date().toISOString(),
                    source: "webdav",
                    remotePath,
                });
            }
            uploads = [...uploads, ...webdavUploads];
        }
    } catch {
        // Ignore WebDAV failures in search
    }

    return NextResponse.json({ spaces, documents, folders, uploads });
}
