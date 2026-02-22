"use client";

import { useMemo, useState } from "react";
import useSWR, { mutate } from "swr";
import { api } from "@/lib/api-client";
import { buildDocUrl, getFolderPath } from "@/lib/url";
import Link from "next/link";
import { CheckSquare, Square, FileText, Plus, Loader2 } from "lucide-react";

export default function TasksPage() {
    const { data: workspaces } = useSWR("/api/workspaces", api.getWorkspaces);
    const activeWorkspaceId = workspaces?.[0]?.id;

    // Fetch spaces
    const { data: spaces } = useSWR(activeWorkspaceId ? `/api/spaces?ws=${activeWorkspaceId}` : null, () => api.getSpaces(activeWorkspaceId!));
    const spaceIds = spaces?.map(s => s.id).join(",") || "";

    // Fetch folders and docs matching spaceIds
    const { data: folders } = useSWR(spaces ? `/api/folders?spaces=${spaceIds}` : null, () => Promise.all(spaces!.map(s => api.getFolders(s.id))).then(r => r.flat()));
    const { data: allDocs } = useSWR(spaces ? `/api/documents?spaces=${spaceIds}` : null, () => Promise.all(spaces!.map(s => api.getDocuments(s.id))).then(r => r.flat()));

    const [isAdding, setIsAdding] = useState(false);
    const [taskContent, setTaskContent] = useState("");
    const [taskDueDate, setTaskDueDate] = useState("");
    const [selectedDocId, setSelectedDocId] = useState("");

    const tasks = useMemo(() => {
        if (!allDocs || !spaces || !folders) return [];
        const result: { type: "todo" | "done", content: string, docName: string, docUrl: string, docId: string, lineIdx: number, dueDate?: string }[] = [];

        for (const doc of allDocs) {
            const space = spaces.find(s => s.id === doc.spaceId);
            if (!space) continue;

            const folderSlugs = doc.folderId ? getFolderPath(doc.folderId, folders) : [];
            const docUrl = buildDocUrl(space.slug, folderSlugs, doc.slug);

            const lines = doc.content.split('\n');
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const match = line.match(/^[ \t]*(?:[-*+]|\d+\.)\s+\[([ xX])\]\s+(.*)$/);
                if (match) {
                    const isDone = match[1] !== " ";
                    let content = match[2];

                    let dueDate = undefined;
                    // Match 📅 YYYY-MM-DD, due: YYYY-MM-DD, @due(YYYY-MM-DD) natively
                    const dateMatch = content.match(/(?:📅|due:|@due\()\s*(\d{4}[-/]\d{1,2}[-/]\d{1,2})\)?/i);
                    if (dateMatch) {
                        dueDate = dateMatch[1].replace(/\//g, "-");
                        // Strip the date from the display content
                        content = content.replace(dateMatch[0], "").trim();
                    }

                    result.push({
                        type: isDone ? "done" : "todo",
                        content,
                        docName: doc.name,
                        docUrl,
                        docId: doc.id,
                        lineIdx: i,
                        dueDate
                    });
                }
            }
        }
        return result;
    }, [allDocs, spaces, folders]);

    const todos = tasks.filter(t => t.type === "todo").sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
    });
    const done = tasks.filter(t => t.type === "done");

    const toggleTask = async (task: typeof tasks[0]) => {
        const doc = allDocs?.find(d => d.id === task.docId);
        if (!doc) return;

        const lines = doc.content.split('\n');
        if (task.type === "todo") {
            lines[task.lineIdx] = lines[task.lineIdx].replace(/([-*+]\s+)\[ \]/, "$1[x]");
        } else {
            lines[task.lineIdx] = lines[task.lineIdx].replace(/([-*+]\s+)\[[xX]\]/, "$1[ ]");
        }
        const newContent = lines.join('\n');

        // Optimistic update
        mutate((key: string) => typeof key === "string" && key.startsWith("/api/documents"), (current: any) => {
            if (!Array.isArray(current)) return current;
            return current.map(d => d.id === doc.id ? { ...d, content: newContent } : d);
        }, { revalidate: false });

        await api.saveDocument(doc.id, newContent);
        mutate((key: string) => typeof key === "string" && key.startsWith("/api/documents"));
    };

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDocId || !taskContent.trim()) return;
        setIsAdding(true);

        const doc = allDocs?.find(d => d.id === selectedDocId);
        if (doc) {
            const currentContent = doc.content || "";
            const prefix = currentContent.endsWith('\n') || currentContent === '' ? '' : '\n';
            const dateSuffix = taskDueDate ? ` 📅 ${taskDueDate}` : "";
            const newContent = currentContent + `${prefix}- [ ] ${taskContent.trim()}${dateSuffix}`;

            // Provide immediate SWR Contextual feedback to the React rendering tree to stop 'ghosting'
            mutate((key: string) => typeof key === "string" && key.startsWith("/api/documents"), (current: any) => {
                if (!Array.isArray(current)) return current;
                return current.map(d => d.id === doc.id ? { ...d, content: newContent } : d);
            }, { revalidate: false });

            await api.saveDocument(selectedDocId, newContent);
            await mutate((key: string) => typeof key === "string" && key.startsWith("/api/documents"));
            setTaskContent("");
            setTaskDueDate("");
        }
        setIsAdding(false);
    };

    if (!spaces || !folders || !allDocs) {
        return (
            <div className="flex-1 flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-4 sm:p-8 sm:pt-12 w-full">
            <h1 className="text-3xl font-bold mb-8 flex items-center px-2">
                <CheckSquare className="mr-3 w-8 h-8 text-primary" />
                Your Tasks
            </h1>

            <form onSubmit={handleAddTask} className="mb-10 flex flex-col sm:flex-row gap-3 p-4 sm:p-5 bg-card/60 backdrop-blur rounded-xl border border-border shadow-sm mx-2">
                <input
                    value={taskContent}
                    onChange={(e) => setTaskContent(e.target.value)}
                    placeholder="E.g. Call the client tomorrow"
                    className="flex-1 bg-background border border-input rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all w-full"
                    required
                />
                <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="bg-background border border-input rounded-lg px-4 py-2.5 text-sm sm:max-w-[150px] focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer w-full text-muted-foreground"
                />
                <select
                    value={selectedDocId}
                    onChange={(e) => setSelectedDocId(e.target.value)}
                    className="bg-background border border-input rounded-lg px-4 py-2.5 text-sm sm:max-w-[280px] focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer w-full"
                    required
                >
                    <option value="">Associate with file...</option>
                    {allDocs.map(d => {
                        const space = spaces.find(s => s.id === d.spaceId);
                        const folderSlugs = d.folderId ? getFolderPath(d.folderId, folders) : [];
                        const pathText = folderSlugs.length > 0 ? folderSlugs.join(" / ") + " / " : "";
                        const location = space ? `${space.name} / ${pathText}` : "";
                        return (
                            <option key={d.id} value={d.id}>
                                {location}{d.name}
                            </option>
                        );
                    })}
                </select>
                <button
                    type="submit"
                    disabled={isAdding}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center shadow-sm whitespace-nowrap disabled:opacity-50"
                >
                    {isAdding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                    Create Task
                </button>
            </form>

            <div className="space-y-8 px-2">
                <div>
                    <h2 className="text-xl font-semibold mb-4 text-foreground/80 border-b pb-2 flex items-center justify-between">
                        To-Do
                        <span className="bg-primary/10 text-primary text-xs py-0.5 px-2.5 rounded-full">{todos.length}</span>
                    </h2>
                    {todos.length === 0 ? (
                        <p className="text-muted-foreground italic text-sm p-4 bg-muted/30 rounded-lg">No pending tasks found. Break down your thoughts into tasks!</p>
                    ) : (
                        <ul className="space-y-3">
                            {todos.map((task, i) => {
                                const isOverdue = task.dueDate && new Date(task.dueDate) < new Date(new Date().setHours(0, 0, 0, 0));
                                return (
                                    <li key={i} className="flex items-start group p-4 rounded-xl border bg-card hover:border-primary/30 transition-all shadow-sm">
                                        <button onClick={() => toggleTask(task)} className="focus:outline-none shrink-0" title="Mark as done">
                                            <Square className="w-5 h-5 text-muted-foreground/70 group-hover:text-primary mr-3 mt-0.5 transition-colors" />
                                        </button>
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between">
                                                <p className="text-foreground leading-snug pr-4">{task.content}</p>
                                                {task.dueDate && (
                                                    <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded border font-medium whitespace-nowrap ${isOverdue ? 'bg-red-500/10 text-red-600 border-red-500/20' : 'bg-muted text-muted-foreground border-border/50'}`}>
                                                        📅 {task.dueDate}
                                                    </span>
                                                )}
                                            </div>
                                            <Link href={task.docUrl} className="inline-flex items-center text-xs text-muted-foreground/80 hover:text-primary mt-2 transition-colors py-1 px-2 -ml-2 rounded-md hover:bg-primary/10">
                                                <FileText className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                                                {task.docName}
                                            </Link>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-4 text-foreground/50 border-b pb-2 flex items-center justify-between">
                        Completed
                        <span className="bg-muted text-muted-foreground text-xs py-0.5 px-2.5 rounded-full">{done.length}</span>
                    </h2>
                    {done.length === 0 ? (
                        <p className="text-muted-foreground italic text-sm p-4">No completed tasks yet.</p>
                    ) : (
                        <ul className="space-y-3 opacity-60 hover:opacity-100 transition-opacity">
                            {done.map((task, i) => (
                                <li key={i} className="flex items-start group p-4 rounded-xl border bg-muted/40 transition-colors">
                                    <button onClick={() => toggleTask(task)} className="focus:outline-none shrink-0" title="Mark as todo">
                                        <CheckSquare className="w-5 h-5 text-primary mr-3 mt-0.5" />
                                    </button>
                                    <div className="flex-1">
                                        <p className="text-muted-foreground line-through decoration-muted-foreground/50 leading-snug pr-4">{task.content}</p>
                                        <Link href={task.docUrl} className="inline-flex items-center text-xs text-muted-foreground/80 hover:text-primary mt-2 transition-colors py-1 px-2 -ml-2 rounded-md hover:bg-primary/10">
                                            <FileText className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                                            {task.docName}
                                        </Link>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
