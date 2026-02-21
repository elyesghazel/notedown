"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import useSWR from "swr";
import { api } from "@/lib/api-client";
import { FileText, Folder as FolderIcon, Terminal, Zap, LogOut, Home } from "lucide-react";
import { Space, Document, Folder } from "@/lib/types";
import { buildDocUrl, getFolderPath } from "@/lib/url";

export function SearchDialog() {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const router = useRouter();

    const { data } = useSWR<{ spaces: Space[], documents: Document[], folders: Folder[] }>("/api/search", (url: string) => fetch(url).then(r => r.json()));
    const spaces = data?.spaces || [];
    const documents = data?.documents || [];
    const folders = data?.folders || [];

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
                e.preventDefault();
                setSearch(prev => prev.startsWith(">") ? "" : prev);
                setOpen((open) => !open);
            }
            if (e.key === "p" && (e.metaKey || e.ctrlKey) && e.shiftKey) {
                e.preventDefault();
                setSearch("> ");
                setOpen(true);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const onSelectDoc = (doc: Document, space: Space) => {
        setOpen(false);
        const folderSlugs = doc.folderId ? getFolderPath(doc.folderId, folders) : [];
        router.push(buildDocUrl(space.slug, folderSlugs, doc.slug));
    };

    const snippetMatch = (content: string, term: string) => {
        if (!term) return "";
        const idx = content.toLowerCase().indexOf(term.toLowerCase());
        if (idx === -1) return "";
        const start = Math.max(0, idx - 20);
        const end = Math.min(content.length, idx + term.length + 20);
        return (start > 0 ? "..." : "") + content.substring(start, end) + (end < content.length ? "..." : "");
    };

    return (
        <CommandDialog open={open} onOpenChange={setOpen}>
            <CommandInput
                value={search}
                onValueChange={setSearch}
                placeholder="Search files... (type '>' for commands)"
            />
            <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                {search.startsWith(">") && (
                    <CommandGroup heading="System Commands">
                        <CommandItem value="> quick note capture" onSelect={() => { setOpen(false); router.push("/quick"); }}>
                            <Zap className="mr-2 h-4 w-4" />
                            <span>Quick Note</span>
                        </CommandItem>
                        <CommandItem value="> home page dashboard" onSelect={() => { setOpen(false); router.push("/"); }}>
                            <Home className="mr-2 h-4 w-4" />
                            <span>Home</span>
                        </CommandItem>
                        <CommandItem value="> sign out logout" onSelect={async () => {
                            await fetch("/api/auth/logout", { method: "POST" });
                            window.location.href = "/login";
                        }}>
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Sign Out</span>
                        </CommandItem>
                    </CommandGroup>
                )}
                {!search.startsWith(">") && (
                    <>
                        <CommandGroup heading="Spaces">
                            {spaces?.map((space) => (
                                <CommandItem key={space.id} onSelect={() => {
                                    setOpen(false);
                                    router.push(`/${space.slug}/readme.md`);
                                }}>
                                    <FolderIcon className="mr-2 h-4 w-4" />
                                    <span>{space.name}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                        <CommandGroup heading="Documents">
                            {documents?.map((doc) => {
                                const space = spaces?.find(s => s.id === doc.spaceId);
                                if (!space) return null;
                                return (
                                    <CommandItem
                                        key={doc.id}
                                        value={`${doc.name} ${doc.content}`}
                                        onSelect={() => onSelectDoc(doc, space)}
                                    >
                                        <div className="flex flex-col w-full overflow-hidden">
                                            <div className="flex items-center">
                                                <FileText className="mr-2 h-4 w-4 shrink-0" />
                                                <span className="truncate">{doc.name}</span>
                                                <span className="ml-2 text-xs text-muted-foreground whitespace-nowrap">in {space.name}</span>
                                            </div>
                                            {search && doc.content.toLowerCase().includes(search.toLowerCase()) && !doc.name.toLowerCase().includes(search.toLowerCase()) && (
                                                <span className="ml-6 text-xs text-muted-foreground mt-0.5 max-w-[90%] truncate opacity-70">
                                                    {snippetMatch(doc.content, search)}
                                                </span>
                                            )}
                                        </div>
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    </>
                )}
            </CommandList>
        </CommandDialog>
    );
}
