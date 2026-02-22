"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { api } from "@/lib/api-client";
import { buildDocUrl, getFolderPath } from "@/lib/url";
import Link from "next/link";
import { Tag, FileText, Loader2 } from "lucide-react";
import { getTagColor } from "@/lib/utils";

export default function TagsPage() {
    const { data: workspaces } = useSWR("/api/workspaces", api.getWorkspaces);
    const activeWorkspaceId = workspaces?.[0]?.id;

    // Fetch spaces
    const { data: spaces } = useSWR(activeWorkspaceId ? `/api/spaces?ws=${activeWorkspaceId}` : null, () => api.getSpaces(activeWorkspaceId!));
    const spaceIds = spaces?.map(s => s.id).join(",") || "";

    // Fetch folders and docs matching spaceIds
    const { data: folders } = useSWR(spaces ? `/api/folders?spaces=${spaceIds}` : null, () => Promise.all(spaces!.map(s => api.getFolders(s.id))).then(r => r.flat()));
    const { data: allDocs } = useSWR(spaces ? `/api/documents?spaces=${spaceIds}` : null, () => Promise.all(spaces!.map(s => api.getDocuments(s.id))).then(r => r.flat()));

    const sortedTags = useMemo(() => {
        if (!allDocs || !spaces || !folders) return [];
        const tagsMap = new Map<string, { docName: string, docUrl: string }[]>();

        for (const doc of allDocs) {
            const space = spaces.find(s => s.id === doc.spaceId);
            if (!space) continue;

            const folderSlugs = doc.folderId ? getFolderPath(doc.folderId, folders) : [];
            const docUrl = buildDocUrl(space.slug, folderSlugs, doc.slug);

            const tagRegex = /(?:^|\s)#([a-zA-Z0-9_-]+)/g;
            let match;
            const matches = new Set<string>();

            while ((match = tagRegex.exec(doc.content)) !== null) {
                matches.add(match[1].toLowerCase());
            }

            for (const tag of Array.from(matches)) {
                const list = tagsMap.get(tag) || [];
                list.push({ docName: doc.name, docUrl });
                tagsMap.set(tag, list);
            }
        }

        return Array.from(tagsMap.entries()).sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
    }, [allDocs, spaces, folders]);

    if (!spaces || !folders || !allDocs) {
        return (
            <div className="flex-1 flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pt-6 sm:pt-12 w-full">
            <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-10 flex items-center px-2">
                <Tag className="mr-3 w-7 h-7 sm:w-8 sm:h-8 text-primary" />
                Your Tags
            </h1>

            {sortedTags.length === 0 ? (
                <div className="p-8 text-center bg-muted/30 border rounded-xl mx-2">
                    <p className="text-muted-foreground text-sm">No tags found. Add tags like <span className="text-primary font-medium">#urgent</span> to your documents!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 px-2">
                    {sortedTags.map(([tag, docs]) => {
                        const styleClass = getTagColor(tag);
                        return (
                            <div key={tag} className="border border-border/80 bg-card rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-border transition-all group/card flex flex-col h-full">
                                <h2 className="text-base sm:text-lg font-semibold flex items-center mb-5 transition-colors">
                                    <span className={`inline-flex items-center px-3 py-1.5 rounded-lg border font-medium tracking-tight ${styleClass}`}>
                                        <span className="opacity-60 mr-0.5 text-xs sm:text-sm">#</span>{tag}
                                    </span>
                                    <span className="ml-auto bg-muted/60 text-muted-foreground text-xs py-1 px-3 rounded-full font-bold shadow-sm border border-border/50">
                                        {docs.length}
                                    </span>
                                </h2>
                                <ul className="space-y-2.5 flex-1">
                                    {docs.slice(0, 5).map((d, i) => (
                                        <li key={i}>
                                            <Link href={d.docUrl} className="flex items-center text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 p-2 -mx-2 rounded-lg transition-colors group">
                                                <FileText className="w-4 h-4 mr-2.5 opacity-50 group-hover:opacity-100 group-hover:text-primary transition-all shrink-0" />
                                                <span className="truncate flex-1 font-medium">{d.docName}</span>
                                            </Link>
                                        </li>
                                    ))}
                                    {docs.length > 5 && (
                                        <li className="text-xs font-medium text-muted-foreground/70 tracking-wide text-center pt-3 mt-auto border-t">
                                            + {docs.length - 5} MORE DOCUMENTS...
                                        </li>
                                    )}
                                </ul>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
