import { getUserId } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getDocuments, getPublished, savePublished } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { PublishedDoc } from "@/lib/types";
import bcrypt from "bcryptjs";

export async function GET() {
    const userId = await getUserId();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const docs = getDocuments(userId);
    const docIds = new Set(docs.map((d) => d.id));
    const publishedList = getPublished();

    const result = publishedList
        .filter((p) => docIds.has(p.docId))
        .map((p) => ({
            docId: p.docId,
            uuid: p.uuid,
            editable: !!p.editable,
        }));

    return NextResponse.json(result);
}

export async function POST(req: Request) {
    const userId = await getUserId();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });
    const { docId, editable = false, editPassword = "" } = await req.json();
    const docs = getDocuments(userId);
    const doc = docs.find((d) => d.id === docId);

    if (!doc) return new NextResponse("Document not found", { status: 404 });

    const publishedList = getPublished();
    const hashedPassword = editable && editPassword ? await bcrypt.hash(editPassword, 10) : "";

    // If already published, update the snapshot
    const existingIdx = publishedList.findIndex((p) => p.docId === docId);

    if (existingIdx !== -1) {
        publishedList[existingIdx].content = doc.content;
        publishedList[existingIdx].title = doc.name;
        publishedList[existingIdx].publishedAt = new Date().toISOString();
        publishedList[existingIdx].editable = editable;
        publishedList[existingIdx].editPassword = hashedPassword;
        publishedList[existingIdx].ownerId = userId;
        savePublished(publishedList);
        return NextResponse.json({ uuid: publishedList[existingIdx].uuid });
    }

    const snapshot: PublishedDoc = {
        uuid: uuidv4(),
        docId,
        ownerId: userId,
        title: doc.name,
        content: doc.content,
        publishedAt: new Date().toISOString(),
        editable,
        editPassword: hashedPassword,
    };

    publishedList.push(snapshot);
    savePublished(publishedList);

    return NextResponse.json({ uuid: snapshot.uuid });
}
