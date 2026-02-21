import { getUserId } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getDocuments, getPublished, savePublished } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { PublishedDoc } from "@/lib/types";

export async function POST(req: Request) {
    const userId = await getUserId();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });
    const { docId } = await req.json();
    const docs = getDocuments(userId);
    const doc = docs.find((d) => d.id === docId);

    if (!doc) return new NextResponse("Document not found", { status: 404 });

    const publishedList = getPublished();

    // If already published, we can just return existing or update, let's create a new UUID snapshot anyway
    // For simplicity, allow multiple published snapshots or overwrite.
    const existingIdx = publishedList.findIndex((p) => p.docId === docId);

    if (existingIdx !== -1) {
        publishedList[existingIdx].content = doc.content;
        publishedList[existingIdx].title = doc.name;
        publishedList[existingIdx].publishedAt = new Date().toISOString();
        savePublished(publishedList);
        return NextResponse.json({ uuid: publishedList[existingIdx].uuid });
    }

    const snapshot: PublishedDoc = {
        uuid: uuidv4(),
        docId,
        title: doc.name,
        content: doc.content,
        publishedAt: new Date().toISOString(),
    };

    publishedList.push(snapshot);
    savePublished(publishedList);

    return NextResponse.json({ uuid: snapshot.uuid });
}
