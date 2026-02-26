import { WebDavConfig } from "@/lib/types";

function normalizeBasePath(pathValue?: string) {
    if (!pathValue) return "/";
    let path = pathValue.trim();
    if (!path.startsWith("/")) path = `/${path}`;
    if (!path.endsWith("/")) path += "/";
    return path;
}

export function buildWebDavUrl(config: WebDavConfig, remotePath: string) {
    const base = config.url.replace(/\/+$/, "");
    const path = remotePath.startsWith("/") ? remotePath : `/${remotePath}`;
    return `${base}${path}`;
}

export function buildWebDavAuth(config: WebDavConfig) {
    const token = Buffer.from(`${config.username}:${config.password}`).toString("base64");
    return `Basic ${token}`;
}

export function buildRemotePath(config: WebDavConfig, filename: string) {
    const basePath = normalizeBasePath(config.basePath);
    return `${basePath}${filename}`;
}

export async function webdavPut(config: WebDavConfig, remotePath: string, data: Buffer, contentType: string) {
    const res = await fetch(buildWebDavUrl(config, remotePath), {
        method: "PUT",
        headers: {
            Authorization: buildWebDavAuth(config),
            "Content-Type": contentType,
        },
        body: data as unknown as BodyInit,
    });

    if (!res.ok) {
        throw new Error(`WebDAV upload failed (${res.status})`);
    }
}

export async function webdavPropfind(config: WebDavConfig, remotePath: string, depth: "0" | "1" = "1") {
    const body = `<?xml version="1.0"?>\n<d:propfind xmlns:d="DAV:">\n  <d:prop>\n    <d:displayname />\n    <d:getcontentlength />\n    <d:getcontenttype />\n    <d:getlastmodified />\n  </d:prop>\n</d:propfind>`;

    const res = await fetch(buildWebDavUrl(config, remotePath), {
        method: "PROPFIND",
        headers: {
            Authorization: buildWebDavAuth(config),
            Depth: depth,
            "Content-Type": "application/xml",
        },
        body,
    });

    if (!res.ok) {
        throw new Error(`WebDAV list failed (${res.status})`);
    }

    return res.text();
}

export function parseWebDavList(xml: string) {
    const entries: Array<{ href: string; displayName: string; contentType: string; size: number }> = [];
    const responseRegex = /<d:response[\s\S]*?<\/d:response>/gi;
    const hrefRegex = /<d:href>([\s\S]*?)<\/d:href>/i;
    const nameRegex = /<d:displayname>([\s\S]*?)<\/d:displayname>/i;
    const typeRegex = /<d:getcontenttype>([\s\S]*?)<\/d:getcontenttype>/i;
    const sizeRegex = /<d:getcontentlength>([\s\S]*?)<\/d:getcontentlength>/i;

    const responses = xml.match(responseRegex) || [];
    for (const block of responses) {
        const hrefMatch = block.match(hrefRegex);
        if (!hrefMatch) continue;
        const href = hrefMatch[1];
        const displayName = (block.match(nameRegex)?.[1] || "").trim();
        const contentType = (block.match(typeRegex)?.[1] || "").trim();
        const sizeRaw = (block.match(sizeRegex)?.[1] || "0").trim();
        const size = Number(sizeRaw) || 0;
        entries.push({ href, displayName, contentType, size });
    }

    return entries;
}
