import type { NextApiRequest, NextApiResponse } from "next";
import { Server as IOServer } from "socket.io";
import { jwtVerify } from "jose";
import { getDocuments, saveDocuments, getPublished, savePublished, getUsers } from "@/lib/db";

const SECRET = new TextEncoder().encode("super-secret-key-change-in-prod");

const parseCookies = (cookieHeader?: string) => {
    const result: Record<string, string> = {};
    if (!cookieHeader) return result;
    const parts = cookieHeader.split(";");
    for (const part of parts) {
        const [name, ...rest] = part.trim().split("=");
        if (!name) continue;
        result[name] = decodeURIComponent(rest.join("=") || "");
    }
    return result;
};

const getUserIdFromCookies = async (cookieHeader?: string) => {
    try {
        const cookies = parseCookies(cookieHeader);
        const token = cookies["auth-token"];
        if (!token) return null;
        const { payload } = await jwtVerify(token, SECRET);
        return payload.sub as string;
    } catch {
        return null;
    }
};

const findOwnerIdByDocId = (docId: string) => {
    const users = getUsers();
    for (const user of users) {
        const docs = getDocuments(user.id);
        if (docs.some((d) => d.id === docId)) return user.id;
    }
    return null;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (!res.socket) {
        res.status(500).end();
        return;
    }

    const anyRes = res as any;
    if (!anyRes.socket.server.io) {
        const io = new IOServer(anyRes.socket.server, {
            path: "/api/socket",
        });
        anyRes.socket.server.io = io;

        io.on("connection", async (socket) => {
            const userId = await getUserIdFromCookies(socket.request.headers.cookie);
            socket.data.userId = userId || null;

            socket.on("doc:join", async (payload, cb) => {
                const docId = payload?.docId;
                if (!socket.data.userId) {
                    cb?.({ ok: false, error: "unauthorized" });
                    return;
                }
                if (!docId) {
                    cb?.({ ok: false, error: "docId required" });
                    return;
                }
                const docs = getDocuments(socket.data.userId);
                if (!docs.some((d) => d.id === docId)) {
                    cb?.({ ok: false, error: "not found" });
                    return;
                }
                socket.join(`doc:${docId}`);
                cb?.({ ok: true });
            });

            socket.on("doc:update", async (payload) => {
                const docId = payload?.docId;
                const content = payload?.content;
                if (!socket.data.userId || !docId || typeof content !== "string") return;

                const docs = getDocuments(socket.data.userId);
                const idx = docs.findIndex((d) => d.id === docId);
                if (idx === -1) return;

                docs[idx].content = content;
                docs[idx].updatedAt = new Date().toISOString();
                saveDocuments(socket.data.userId, docs);

                const publishedList = getPublished();
                const affected = publishedList.filter((p) => p.docId === docId);
                if (affected.length > 0) {
                    const updated = publishedList.map((p) =>
                        p.docId === docId
                            ? { ...p, content, publishedAt: new Date().toISOString() }
                            : p
                    );
                    savePublished(updated);
                    for (const p of affected) {
                        io.to(`share:${p.uuid}`).emit("doc:content", { docId, content, sourceId: socket.id });
                    }
                }

                io.to(`doc:${docId}`).emit("doc:content", { docId, content, sourceId: socket.id });
            });

            socket.on("share:join", async (payload, cb) => {
                const uuid = payload?.uuid;
                const guestName = payload?.guestName;
                const editPassword = payload?.editPassword;

                if (!uuid || typeof guestName !== "string" || guestName.trim().length < 2) {
                    cb?.({ ok: false, error: "guest name required" });
                    return;
                }

                const publishedList = getPublished();
                const published = publishedList.find((p) => p.uuid === uuid);

                if (!published) {
                    cb?.({ ok: false, error: "not found" });
                    return;
                }

                if (!published.editable) {
                    cb?.({ ok: false, error: "not editable" });
                    return;
                }

                if (published.editPassword) {
                    const bcrypt = await import("bcryptjs");
                    const valid = await bcrypt.default.compare(editPassword || "", published.editPassword);
                    if (!valid) {
                        cb?.({ ok: false, error: "invalid password" });
                        return;
                    }
                }

                let ownerId = published.ownerId;
                if (!ownerId) {
                    ownerId = findOwnerIdByDocId(published.docId);
                    if (ownerId) {
                        const idx = publishedList.findIndex((p) => p.uuid === uuid);
                        if (idx !== -1) {
                            publishedList[idx].ownerId = ownerId;
                            savePublished(publishedList);
                        }
                    }
                }

                if (!ownerId) {
                    cb?.({ ok: false, error: "owner not found" });
                    return;
                }

                socket.data.share = {
                    uuid,
                    docId: published.docId,
                    ownerId,
                    guestName: guestName.trim(),
                };

                socket.join(`share:${uuid}`);
                cb?.({ ok: true });
            });

            socket.on("share:update", async (payload) => {
                const uuid = payload?.uuid;
                const content = payload?.content;
                if (!uuid || typeof content !== "string") return;

                const share = socket.data.share;
                if (!share || share.uuid !== uuid) return;

                const docs = getDocuments(share.ownerId);
                const idx = docs.findIndex((d) => d.id === share.docId);
                if (idx === -1) return;

                docs[idx].content = content;
                docs[idx].updatedAt = new Date().toISOString();
                saveDocuments(share.ownerId, docs);

                const publishedList = getPublished();
                const updated = publishedList.map((p) =>
                    p.uuid === uuid ? { ...p, content, publishedAt: new Date().toISOString() } : p
                );
                savePublished(updated);

                io.to(`doc:${share.docId}`).emit("doc:content", { docId: share.docId, content, sourceId: socket.id });
                io.to(`share:${uuid}`).emit("doc:content", { docId: share.docId, content, sourceId: socket.id });
            });
        });
    }

    res.end();
}
