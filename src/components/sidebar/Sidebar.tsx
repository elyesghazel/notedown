"use client";

import { usePathname } from "next/navigation";
import useSWR, { mutate } from "swr";
import { api } from "@/lib/api-client";
import { SpaceItem } from "./SpaceItem";
import { NewSpaceDialog } from "../dialogs/NewSpaceDialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Zap, Loader2, ChevronLeft, ChevronRight, RefreshCw, Menu, Search, HelpCircle, Pencil, CheckSquare, Tag, Settings, LogOut, Camera, Globe, FileText, Plus, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { SearchDialog } from "../dialogs/SearchDialog";
import { QuickLensDialog } from "../dialogs/QuickLensDialog";
import { TemplateDialog } from "../dialogs/TemplateDialog";

export function Sidebar() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const { data: workspaces } = useSWR("/api/workspaces", api.getWorkspaces);
    const { data: published } = useSWR("/api/publish", api.getPublishedList);
    const { data: userInfo } = useSWR("/api/auth/me", async () => {
        const res = await fetch("/api/auth/me");
        if (!res.ok) return null;
        return res.json();
    });

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
    const spaceIds = spaces?.map(s => s.id).join(",") || "";
    const { data: folders } = useSWR(
        spaces ? `/api/folders?spaces=${spaceIds}` : null,
        () => Promise.all(spaces!.map(s => api.getFolders(s.id))).then(r => r.flat())
    );
    const { data: documents } = useSWR(
        spaces ? `/api/documents?spaces=${spaceIds}` : null,
        () => Promise.all(spaces!.map(s => api.getDocuments(s.id))).then(r => r.flat())
    );
    const { data: templates } = useSWR("/api/templates", api.getTemplates);

    const publishedMap = useMemo(() => {
        const map = new Map<string, { editable: boolean }>();
        if (published) {
            for (const p of published) {
                map.set(p.docId, { editable: p.editable });
            }
        }
        return map;
    }, [published]);

    const [collapsed, setCollapsed] = useState(false);
    const [reloading, setReloading] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [quickLensOpen, setQuickLensOpen] = useState(false);
    const [templateCreateOpen, setTemplateCreateOpen] = useState(false);
    const [templateEditOpen, setTemplateEditOpen] = useState(false);
    const [activeTemplate, setActiveTemplate] = useState<{ id: string; name: string; content: string } | null>(null);
    const pathname = usePathname();

    const openTasksCount = useMemo(() => {
        if (!documents) return 0;
        let count = 0;
        for (const doc of documents) {
            const matches = doc.content.match(/^[ \t]*(?:[-*+]|\d+\.)\s+\[ \]\s+.*/gm);
            if (matches) count += matches.length;
        }
        return count;
    }, [documents]);

    if (pathname?.startsWith("/share")) return null;
    if (pathname?.startsWith("/login")) return null;
    if (pathname?.startsWith("/register")) return null;

    const currentSpaceSlug = pathname?.split("/")[1];
    const currentSpace = spaces?.find((space) => space.slug === currentSpaceSlug);

    if (!mounted) {
        return (
            <div className="hidden md:flex w-72 h-full border-r shrink-0 items-center justify-center bg-card">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const handleReload = async () => {
        setReloading(true);
        await mutate(() => true, undefined, { revalidate: true });
        setTimeout(() => setReloading(false), 500);
    };

    const handleInsertTemplate = (content: string) => {
        window.dispatchEvent(new CustomEvent("editor:insert-template", { detail: { content } }));
    };

    const handleCreateTemplate = async (name: string, content: string) => {
        await api.createTemplate(name, content);
        await mutate("/api/templates");
    };

    const handleUpdateTemplate = async (name: string, content: string) => {
        if (!activeTemplate) return;
        await api.updateTemplate(activeTemplate.id, { name, content });
        await mutate("/api/templates");
    };

    const handleDeleteTemplate = async (id: string, name: string) => {
        if (!confirm(`Delete template "${name}"?`)) return;
        await api.deleteTemplate(id);
        await mutate("/api/templates");
    };

    const closeMobileSidebar = () => setMobileOpen(false);

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
        <div className="w-full h-full bg-card flex flex-col overflow-hidden">
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
                        {activeWorkspace && (
                            <DropdownMenuItem onClick={async () => {
                                const newName = prompt("Rename Workspace:", activeWorkspace.name);
                                if (newName) {
                                    await api.renameWorkspace(activeWorkspace.id, newName);
                                    await mutate("/api/workspaces");
                                }
                            }}>
                                <Pencil className="w-4 h-4 mr-2" /> Rename Workspace
                            </DropdownMenuItem>
                        )}
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

            <ScrollArea className="flex-1 min-h-0 px-3 py-3">
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
                        publishedMap={publishedMap}
                    />
                ))}

                {activeWorkspaceId && <NewSpaceDialog workspaceId={activeWorkspaceId} />}

                <div className="mt-6">
                    <div className="flex items-center justify-between px-2 text-xs uppercase tracking-wider text-muted-foreground">
                        <span>Templates</span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => setTemplateCreateOpen(true)}
                            title="New template"
                        >
                            <Plus className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                    <div className="mt-2 space-y-1">
                        {!templates && (
                            <div className="px-2 text-xs text-muted-foreground">Loading templates...</div>
                        )}
                        {templates && templates.length === 0 && (
                            <div className="px-2 text-xs text-muted-foreground">No templates yet</div>
                        )}
                        {templates && templates.map((template) => (
                            <div key={template.id} className="group flex items-center justify-between px-2 py-1 rounded-md hover:bg-muted/50">
                                <button
                                    className="flex-1 text-left truncate text-sm"
                                    onClick={() => handleInsertTemplate(template.content)}
                                    title="Insert template"
                                >
                                    {template.name}
                                </button>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => handleInsertTemplate(template.content)}
                                        title="Insert template"
                                    >
                                        <FileText className="w-3.5 h-3.5" />
                                    </Button>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-6 w-6" title="Template actions">
                                                <MoreHorizontal className="w-3.5 h-3.5" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start">
                                            <DropdownMenuItem onClick={() => {
                                                setActiveTemplate(template);
                                                setTemplateEditOpen(true);
                                            }}>
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleDeleteTemplate(template.id, template.name)} className="text-destructive">
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </ScrollArea>

            <div className="p-3 border-t space-y-2 hidden md:block">
                {userInfo && (
                    <div className="px-2 py-2 mb-2 rounded-md bg-muted/50 text-xs">
                        <div className="text-muted-foreground">Logged in as</div>
                        <div className="font-semibold truncate text-foreground">
                            {userInfo.displayName}
                            {userInfo.isGuest && <span className="text-muted-foreground text-xs ml-1">(guest)</span>}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                    <Link href="/quick" className="flex items-center justify-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors p-2 rounded-md hover:bg-muted">
                        <Zap className="w-4 h-4 mr-1" />
                        Quick
                    </Link>
                    <Link href="/tasks" className="flex items-center justify-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors p-2 rounded-md hover:bg-muted">
                        <CheckSquare className="w-4 h-4 mr-1" />
                        Tasks
                        {openTasksCount > 0 && (
                            <span className="ml-1 bg-primary/20 text-primary text-[9px] px-1 py-0.5 rounded-full font-bold">
                                {openTasksCount}
                            </span>
                        )}
                    </Link>
                    <button
                        onClick={() => setQuickLensOpen(true)}
                        className="flex items-center justify-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors p-2 rounded-md hover:bg-muted"
                    >
                        <Camera className="w-4 h-4 mr-1" />
                        Lens
                    </button>
                    <button
                        onClick={() => {
                            document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
                        }}
                        className="flex items-center justify-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors p-2 rounded-md hover:bg-muted"
                    >
                        <Search className="w-4 h-4 mr-1" />
                        Search
                    </button>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="w-full justify-center text-xs text-muted-foreground">
                            <Menu className="w-4 h-4 mr-2" /> More
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-52">
                        <DropdownMenuItem asChild>
                            <Link href="/tags">
                                <Tag className="w-4 h-4 mr-2" /> Tags
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/published">
                                <Globe className="w-4 h-4 mr-2" /> Published
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/settings">
                                <Settings className="w-4 h-4 mr-2" /> Settings
                            </Link>
                        </DropdownMenuItem>
                        {userInfo?.isAdmin && (
                            <DropdownMenuItem asChild>
                                <Link href="/admin" className="text-purple-600">
                                    <Settings className="w-4 h-4 mr-2" /> Admin Panel
                                </Link>
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem asChild>
                            <Link href="/help">
                                <HelpCircle className="w-4 h-4 mr-2" /> Help & Guides
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={async () => {
                                await fetch("/api/auth/logout", { method: "POST" });
                                window.location.href = "/login";
                            }}
                            className="text-destructive"
                        >
                            <LogOut className="w-4 h-4 mr-2" /> Sign Out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="p-2 border-t md:hidden">
                {userInfo && (
                    <div className="px-2 py-1.5 mb-2 rounded-md bg-muted/50 text-[11px]">
                        <div className="text-muted-foreground">Logged in as</div>
                        <div className="font-semibold truncate text-foreground">
                            {userInfo.displayName}
                            {userInfo.isGuest && <span className="text-muted-foreground text-[10px] ml-1">(guest)</span>}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-1">
                    <button
                        onClick={() => {
                            document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
                            closeMobileSidebar();
                        }}
                        className="flex items-center justify-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors p-2 rounded-md hover:bg-muted"
                    >
                        <Search className="w-4 h-4 mr-1" />
                        Search
                    </button>
                    <Link
                        href="/quick"
                        onClick={closeMobileSidebar}
                        className="flex items-center justify-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors p-2 rounded-md hover:bg-muted"
                    >
                        <Zap className="w-4 h-4 mr-1" />
                        Quick
                    </Link>
                    <Link
                        href="/tasks"
                        onClick={closeMobileSidebar}
                        className="flex items-center justify-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors p-2 rounded-md hover:bg-muted"
                    >
                        <CheckSquare className="w-4 h-4 mr-1" />
                        Tasks
                        {openTasksCount > 0 && (
                            <span className="ml-1 bg-primary/20 text-primary text-[9px] px-1 py-0.5 rounded-full font-bold">
                                {openTasksCount}
                            </span>
                        )}
                    </Link>
                    <button
                        onClick={() => {
                            setQuickLensOpen(true);
                            closeMobileSidebar();
                        }}
                        className="flex items-center justify-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors p-2 rounded-md hover:bg-muted"
                    >
                        <Camera className="w-4 h-4 mr-1" />
                        Lens
                    </button>
                    <Link
                        href="/settings"
                        onClick={closeMobileSidebar}
                        className="flex items-center justify-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors p-2 rounded-md hover:bg-muted"
                    >
                        <Settings className="w-4 h-4 mr-1" />
                        Settings
                    </Link>
                    <Link
                        href="/tags"
                        onClick={closeMobileSidebar}
                        className="flex items-center justify-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors p-2 rounded-md hover:bg-muted"
                    >
                        <Tag className="w-4 h-4 mr-1" />
                        Tags
                    </Link>
                    <Link
                        href="/help"
                        onClick={closeMobileSidebar}
                        className="flex items-center justify-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors p-2 rounded-md hover:bg-muted"
                    >
                        <HelpCircle className="w-4 h-4 mr-1" />
                        Help
                    </Link>
                    <button
                        onClick={async () => {
                            await fetch("/api/auth/logout", { method: "POST" });
                            window.location.href = "/login";
                        }}
                        className="col-span-2 flex items-center justify-center text-xs font-medium text-muted-foreground hover:text-destructive transition-colors p-2 rounded-md hover:bg-destructive/10"
                    >
                        <LogOut className="w-4 h-4 mr-1" />
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <div className="hidden md:flex w-72 h-full border-r shrink-0">
                {sidebarInner}
            </div>

            {/* Mobile Sidebar */}
            <div className="md:hidden fixed top-3 left-3 z-50">
                <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="icon" className="h-9 w-9 bg-background/90 backdrop-blur shadow-md">
                            <Menu className="h-4 w-4" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent
                        side="left"
                        className="p-0 w-72"
                        showCloseButton={false}
                        onClickCapture={(e) => {
                            const target = e.target as HTMLElement | null;
                            if (target?.closest("a")) {
                                closeMobileSidebar();
                            }
                        }}
                    >
                        <SheetTitle className="sr-only">Navigation</SheetTitle>
                        {sidebarInner}
                    </SheetContent>
                </Sheet>
            </div>
            <QuickLensDialog
                open={quickLensOpen}
                onOpenChange={setQuickLensOpen}
                defaultWorkspaceId={activeWorkspaceId}
                defaultSpaceId={currentSpace?.id}
            />
            <TemplateDialog
                open={templateCreateOpen}
                onOpenChange={setTemplateCreateOpen}
                title="New template"
                confirmLabel="Create"
                onConfirm={handleCreateTemplate}
            />
            <TemplateDialog
                open={templateEditOpen}
                onOpenChange={(open) => {
                    setTemplateEditOpen(open);
                    if (!open) setActiveTemplate(null);
                }}
                title="Edit template"
                confirmLabel="Save"
                initialName={activeTemplate?.name}
                initialContent={activeTemplate?.content}
                onConfirm={handleUpdateTemplate}
            />
        </>
    );
}

