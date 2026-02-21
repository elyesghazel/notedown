"use client";

import { usePathname } from "next/navigation";
import useSWR, { mutate } from "swr";
import { api } from "@/lib/api-client";
import { SpaceItem } from "./SpaceItem";
import { NewSpaceDialog } from "../dialogs/NewSpaceDialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Zap, Loader2, ChevronLeft, ChevronRight, RefreshCw, Menu, Search, HelpCircle } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { SearchDialog } from "../dialogs/SearchDialog";

export function Sidebar() {
    const { data: workspaces } = useSWR("/api/workspaces", api.getWorkspaces);

    // Auto-create default workspace if empty
    useEffect(() => {
        if (workspaces && workspaces.length === 0) {
            api.createWorkspace("Personal").then(() => mutate("/api/workspaces"));
        }
    }, [workspaces]);

    const defaultWsId = workspaces && workspaces.length > 0 ? workspaces[0].id : null;
    const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);

    useEffect(() => {
        if (!activeWorkspaceId && defaultWsId) {
            setActiveWorkspaceId(defaultWsId);
        }
    }, [defaultWsId, activeWorkspaceId]);

    const activeWorkspace = workspaces?.find(w => w.id === activeWorkspaceId) || workspaces?.[0];

    // Use simple, stable cache keys that ALL components can reference
    const { data: spaces } = useSWR(
        activeWorkspaceId ? `/api/spaces?ws=${activeWorkspaceId}` : null,
        () => api.getSpaces(activeWorkspaceId!)
    );
    const { data: folders } = useSWR(
        spaces ? "/api/folders" : null,
        () => Promise.all(spaces!.map(s => api.getFolders(s.id))).then(r => r.flat())
    );
    const { data: documents } = useSWR(
        spaces ? "/api/documents" : null,
        () => Promise.all(spaces!.map(s => api.getDocuments(s.id))).then(r => r.flat())
    );

    const [collapsed, setCollapsed] = useState(false);
    const [reloading, setReloading] = useState(false);
    const pathname = usePathname();

    if (pathname?.startsWith("/share")) return null;

    const handleReload = async () => {
        setReloading(true);
        await mutate(() => true, undefined, { revalidate: true });
        setTimeout(() => setReloading(false), 500);
    };

    // Collapsed state (desktop only)
    if (collapsed) {
        return (
            <div className="hidden md:flex w-12 h-full bg-card border-r flex-col items-center py-4 relative transition-all">
                <Button variant="ghost" size="icon" onClick={() => setCollapsed(false)} className="mb-4">
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </Button>
                <Link href="/quick" className="mt-auto items-center justify-center p-2 rounded-full hover:bg-muted text-muted-foreground">
                    <Zap className="w-5 h-5" />
                </Link>
            </div>
        );
    }

    const sidebarInner = (
        <div className="w-full h-full bg-card flex flex-col">
            <div className="p-3 flex items-center justify-between border-b h-14 gap-1">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 px-2 flex-1 justify-start overflow-hidden font-semibold tracking-tight text-base hover:bg-muted/50 truncate">
                            {activeWorkspace?.name ?? "Loading..."}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                        {workspaces?.map((ws) => (
                            <DropdownMenuItem key={ws.id} onClick={() => setActiveWorkspaceId(ws.id)} className="font-medium">
                                {ws.name}
                            </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={async () => {
                            const name = prompt("New workspace name:");
                            if (name) {
                                const ws = await api.createWorkspace(name);
                                await mutate("/api/workspaces");
                                setActiveWorkspaceId(ws.id);
                            }
                        }}>
                            + Create Workspace
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <div className="flex items-center shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleReload} title="Reload">
                        <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${reloading ? "animate-spin" : ""}`} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 hidden md:flex" onClick={() => setCollapsed(true)}>
                        <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground" />
                    </Button>
                </div>
            </div>

            <ScrollArea className="flex-1 px-3 py-3">
                {!spaces && (
                    <div className="flex justify-center p-4">
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                )}

                {spaces && folders && documents && spaces.map((space) => (
                    <SpaceItem
                        key={space.id}
                        space={space}
                        folders={folders.filter(f => f.spaceId === space.id)}
                        documents={documents.filter(d => d.spaceId === space.id)}
                    />
                ))}

                {activeWorkspaceId && <NewSpaceDialog workspaceId={activeWorkspaceId} />}
            </ScrollArea>

            <div className="p-3 border-t">
                <button
                    onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
                    className="w-full flex items-center justify-start text-sm font-medium text-muted-foreground hover:text-foreground transition-colors p-2 rounded-md hover:bg-muted mb-1"
                >
                    <Search className="w-4 h-4 mr-2" />
                    Search...
                    <span className="ml-auto text-xs text-muted-foreground bg-muted-foreground/10 px-1.5 py-0.5 rounded">⌘K</span>
                </button>
                <Link href="/quick" className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors p-2 rounded-md hover:bg-muted mb-1">
                    <Zap className="w-4 h-4 mr-2" />
                    Quick Capture
                </Link>
                <Link href="/help" className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors p-2 rounded-md hover:bg-muted mb-1">
                    <HelpCircle className="w-4 h-4 mr-2" />
                    Help & Guides
                </Link>
                <button
                    onClick={async () => {
                        await fetch("/api/auth/logout", { method: "POST" });
                        window.location.href = "/login";
                    }}
                    className="w-full flex items-center text-sm font-medium text-muted-foreground hover:text-destructive transition-colors p-2 rounded-md hover:bg-destructive/10"
                >
                    <RefreshCw className="w-4 h-4 mr-2 opacity-50" />
                    Sign Out
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <div className="hidden md:flex w-64 h-full border-r shrink-0">
                {sidebarInner}
            </div>

            {/* Mobile Sidebar */}
            <div className="md:hidden fixed top-3 left-3 z-50">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="icon" className="h-9 w-9 bg-background/90 backdrop-blur shadow-md">
                            <Menu className="h-4 w-4" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-72" showCloseButton={false}>
                        <SheetTitle className="sr-only">Navigation</SheetTitle>
                        {sidebarInner}
                    </SheetContent>
                </Sheet>
            </div>
        </>
    );
}
