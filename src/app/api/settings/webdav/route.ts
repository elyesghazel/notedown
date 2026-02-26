import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { getUsers, saveUsers } from "@/lib/db";
import { WebDavConfig } from "@/lib/types";
import { webdavPropfind } from "@/lib/webdav";

export async function GET() {
    const userId = await getUserId();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const users = getUsers();
    const user = users.find((u) => u.id === userId);
    if (!user) return new NextResponse("Not found", { status: 404 });

    // Never expose password in GET response
    const config = user.webdav || { enabled: false, url: "", username: "", password: "", basePath: "/", preferPdf: false };
    const { password, ...safeConfig } = config;
    return NextResponse.json({ ...safeConfig, hasPassword: !!password });
}

export async function PATCH(req: Request) {
    const userId = await getUserId();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const payload = (await req.json()) as WebDavConfig;
    if (!payload || typeof payload !== "object") {
        return new NextResponse("Invalid payload", { status: 400 });
    }

    const users = getUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) return new NextResponse("Not found", { status: 404 });

    users[idx].webdav = {
        enabled: !!payload.enabled,
        url: payload.url || "",
        username: payload.username || "",
        password: payload.password || "",
        basePath: payload.basePath || "/",
        preferPdf: !!payload.preferPdf,
    };
    saveUsers(users);

    return NextResponse.json(users[idx].webdav);
}

export async function POST(req: Request) {
    const userId = await getUserId();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const payload = (await req.json()) as WebDavConfig;
    if (!payload || !payload.url || !payload.username || !payload.password) {
        return new NextResponse("Missing WebDAV credentials", { status: 400 });
    }

    try {
        await webdavPropfind(payload, payload.basePath || "/", "0");
        return NextResponse.json({ ok: true });
    } catch (err: any) {
        return NextResponse.json({ ok: false, error: err?.message || "WebDAV test failed" }, { status: 400 });
    }
}
