"use client";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Eye, FileEdit, Share, Download } from "lucide-react";
import { Document } from "@/lib/types";
import { useState } from "react";
import { PublishDialog } from "../dialogs/PublishDialog";
import { ExportDialog } from "../dialogs/ExportDialog";

export type ViewMode = "edit" | "split" | "preview";

interface ToolbarProps {
    doc: Document;
    mode: ViewMode;
    setMode: (mode: ViewMode) => void;
    isSaving: boolean;
    isMobile?: boolean;
}

export function Toolbar({ doc, mode, setMode, isSaving, isMobile = false }: ToolbarProps) {
    const [publishOpen, setPublishOpen] = useState(false);
    const [exportOpen, setExportOpen] = useState(false);

    if (isMobile) {
        // Mobile: floating bottom bar with just edit/preview toggle + actions
        return (
            <>
                {/* Top: doc name only */}
                <div className="h-12 border-b flex items-center px-4 bg-muted/30 pl-14">
                    <div className="flex flex-col flex-1 min-w-0">
                        <span className="font-semibold text-sm truncate">{doc.name}</span>
                        <span className="text-[10px] text-muted-foreground">
                            {isSaving ? "Saving..." : "Saved"}
                        </span>
                    </div>
                </div>

                {/* Bottom floating bar */}
                <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-4 py-2 flex items-center justify-between safe-area-bottom">
                    <div className="flex items-center space-x-1 border rounded-lg p-1 bg-muted/50">
                        <Button
                            variant={mode === "edit" ? "secondary" : "ghost"}
                            size="sm"
                            className="h-8 px-3 text-xs"
                            onClick={() => setMode("edit")}
                        >
                            <FileEdit className="w-3.5 h-3.5 mr-1.5" />
                            Edit
                        </Button>
                        <Button
                            variant={mode === "preview" ? "secondary" : "ghost"}
                            size="sm"
                            className="h-8 px-3 text-xs"
                            onClick={() => setMode("preview")}
                        >
                            <Eye className="w-3.5 h-3.5 mr-1.5" />
                            Preview
                        </Button>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" className="h-8 px-2" onClick={() => setExportOpen(true)}>
                            <Download className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" className="h-8 px-2" onClick={() => setPublishOpen(true)}>
                            <Share className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                </div>

                <PublishDialog doc={doc} open={publishOpen} onOpenChange={setPublishOpen} />
                {exportOpen && <ExportDialog open={exportOpen} onOpenChange={setExportOpen} />}
            </>
        );
    }

    // Desktop toolbar
    return (
        <>
            <div className="h-14 border-b flex items-center justify-between px-4 bg-muted/30">
                <div className="flex flex-col">
                    <span className="font-semibold text-sm">{doc.name}</span>
                    <span className="text-xs text-muted-foreground">
                        {isSaving ? "Saving..." : "Saved"}
                    </span>
                </div>

                <div className="flex items-center space-x-2 border rounded-md p-1 bg-background">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant={mode === "edit" ? "secondary" : "ghost"} size="sm" className="h-8 px-2" onClick={() => setMode("edit")}>
                                <FileEdit className="w-4 h-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit Mode</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant={mode === "split" ? "secondary" : "ghost"} size="sm" className="h-8 px-2" onClick={() => setMode("split")}>
                                <Eye className="w-4 h-4 mr-1" /><FileEdit className="w-4 h-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Split Mode</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant={mode === "preview" ? "secondary" : "ghost"} size="sm" className="h-8 px-2" onClick={() => setMode("preview")}>
                                <Eye className="w-4 h-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Preview Mode</TooltipContent>
                    </Tooltip>
                </div>

                <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setExportOpen(true)}>
                        <Download className="w-4 h-4 mr-2" /> Export
                    </Button>
                    <Button size="sm" onClick={() => setPublishOpen(true)}>
                        <Share className="w-4 h-4 mr-2" /> Publish
                    </Button>
                </div>
            </div>

            <PublishDialog doc={doc} open={publishOpen} onOpenChange={setPublishOpen} />
            {exportOpen && <ExportDialog open={exportOpen} onOpenChange={setExportOpen} />}
        </>
    );
}
