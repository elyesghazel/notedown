"use client";

import { useMemo, useState } from "react";
import useSWR, { mutate } from "swr";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { buildDocUrl, getFolderPath } from "@/lib/url";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink, Copy, Trash2, Globe } from "lucide-react";
import { Document, Folder, Space } from "@/lib/types";

export default function PublishedPage() {
    const { data: spaces } = useSWR("/api/spaces", () => api.getSpaces());
    const spaceIds = spaces?.map((s) => s.id).join(",") || "";

    const { data: folders } = useSWR(
        spaces ? `/api/folders?spaces=${spaceIds}` : null,
        () => Promise.all(spaces!.map((s) => api.getFolders(s.id))).then((r) => r.flat())
    );
    const { data: documents } = useSWR(
        spaces ? `/api/documents?spaces=${spaceIds}` : null,
        () => Promise.all(spaces!.map((s) => api.getDocuments(s.id))).then((r) => r.flat())
    );
    const { data: published } = useSWR("/api/publish", api.getPublishedList);

    const [busyId, setBusyId] = useState<string | null>(null);

    const rows = useMemo(() => {
        if (!published || !documents || !folders || !spaces) return [] as Array<{
            uuid: string;
            editable: boolean;
            doc?: Document;
            space?: Space;
            shareUrl: string;
            docUrl?: string;
        }>;

        return published.map((item) => {
            const doc = documents.find((d) => d.id === item.docId);
            const space = doc ? spaces.find((s) => s.id === doc.spaceId) : undefined;
            const folderSlugs = doc?.folderId ? getFolderPath(doc.folderId, folders as Folder[]) : [];
            const docUrl = doc && space ? buildDocUrl(space.slug, folderSlugs, doc.slug) : undefined;
            return {
                uuid: item.uuid,
                editable: item.editable,
                doc,
                space,
                shareUrl: `${window.location.origin}/share/${item.uuid}`,
                docUrl,
            };
        });
    }, [published, documents, folders, spaces]);

    const handleUnpublish = async (uuid: string) => {
        if (!confirm("Unpublish this document?")) return;
        setBusyId(uuid);
        try {
            await api.unpublishDoc(uuid);
            await mutate("/api/publish");
        } finally {
            setBusyId(null);
        }
    };

    const handleCopy = async (url: string) => {
        await navigator.clipboard.writeText(url);
    };

    if (!spaces || !folders || !documents || !published) {
        return (
            <div className="flex-1 flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-6 sm:p-10 w-full">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold">Published</h1>
                    <p className="text-sm text-muted-foreground">Manage your live and published links.</p>
                </div>
            </div>

            {rows.length === 0 ? (
                <div className="border rounded-xl p-8 text-center text-muted-foreground bg-muted/30">
                    No published documents yet.
                </div>
            ) : (
                <div className="space-y-4">
                    {rows.map((row) => (
                        <div key={row.uuid} className="border rounded-xl p-4 sm:p-5 bg-card shadow-sm">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold truncate">
                                            {row.doc?.name || "(deleted document)"}
                                        </span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${row.editable ? "border-emerald-500/40 text-emerald-600" : "border-slate-300 text-slate-500"}`}>
                                            {row.editable ? "Live" : "Snapshot"}
                                        </span>
                                    </div>
                                    {row.space && (
                                        <div className="text-xs text-muted-foreground mt-1">in {row.space.name}</div>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Button variant="outline" size="sm" onClick={() => handleCopy(row.shareUrl)}>
                                        <Copy className="w-4 h-4 mr-2" /> Copy Link
                                    </Button>
                                    <Button variant="outline" size="sm" asChild>
                                        <a href={row.shareUrl} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="w-4 h-4 mr-2" /> Open Share
                                        </a>
                                    </Button>
                                    {row.docUrl && (
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link href={row.docUrl}>Open Doc</Link>
                                        </Button>
                                    )}
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleUnpublish(row.uuid)}
                                        disabled={busyId === row.uuid}
                                    >
                                        {busyId === row.uuid ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                                        Unpublish
                                    </Button>
                                </div>
                            </div>
                            <div className="mt-3 text-xs text-muted-foreground break-all">{row.shareUrl}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
