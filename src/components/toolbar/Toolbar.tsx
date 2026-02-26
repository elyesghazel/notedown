"use client";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Eye, FileEdit, Share, Download, Bold, Italic, Strikethrough, Code, Link2, List, ListOrdered, Quote, CheckSquare, ImagePlus, Type, Table, FileText } from "lucide-react";
import { Document } from "@/lib/types";
import { useState } from "react";
import { PublishDialog } from "../dialogs/PublishDialog";
import { ExportPDFDialog } from "../dialogs/ExportPDFDialog";

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

    const emitFormat = (type: string) => {
        window.dispatchEvent(new CustomEvent("editor:format", { detail: { type } }));
    };

    const emitPickImage = () => {
        window.dispatchEvent(new CustomEvent("editor:pick-image"));
    };

    const emitPickPdf = () => {
        window.dispatchEvent(new CustomEvent("editor:pick-pdf"));
    };

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
                <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-3 py-2 safe-area-bottom">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-2">
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
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-8 px-2" title="Formatting">
                                    <Type className="w-3.5 h-3.5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => emitFormat("bold")}>
                                    <Bold className="w-4 h-4 mr-2" /> Bold
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => emitFormat("italic")}>
                                    <Italic className="w-4 h-4 mr-2" /> Italic
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => emitFormat("strike")}>
                                    <Strikethrough className="w-4 h-4 mr-2" /> Strikethrough
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => emitFormat("code")}>
                                    <Code className="w-4 h-4 mr-2" /> Inline Code
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => emitFormat("link")}>
                                    <Link2 className="w-4 h-4 mr-2" /> Link
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => emitFormat("quote")}>
                                    <Quote className="w-4 h-4 mr-2" /> Quote
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => emitFormat("ul")}>
                                    <List className="w-4 h-4 mr-2" /> Bullet List
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => emitFormat("ol")}>
                                    <ListOrdered className="w-4 h-4 mr-2" /> Numbered List
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => emitFormat("task")}>
                                    <CheckSquare className="w-4 h-4 mr-2" /> Task List
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => emitFormat("table")}> 
                                    <Table className="w-4 h-4 mr-2" /> Table
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={emitPickImage}>
                                    <ImagePlus className="w-4 h-4 mr-2" /> Insert Image
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={emitPickPdf}>
                                    <FileText className="w-4 h-4 mr-2" /> Insert PDF
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button variant="outline" size="sm" className="h-8 px-2" onClick={() => setExportOpen(true)}>
                            <Download className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" className="h-8 px-2" onClick={() => setPublishOpen(true)}>
                            <Share className="w-3.5 h-3.5" />
                        </Button>
                            </div>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
                            <span className="truncate">{doc.name}</span>
                            <span>{isSaving ? "Saving..." : "Saved"}</span>
                        </div>
                    </div>
                </div>

                <PublishDialog doc={doc} open={publishOpen} onOpenChange={setPublishOpen} />
                {exportOpen && <ExportPDFDialog open={exportOpen} onOpenChange={setExportOpen} documentName={doc.name} />}
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

                <div className="flex items-center space-x-1 border rounded-md p-1 bg-background">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => emitFormat("bold")}> 
                                <Bold className="w-4 h-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Bold</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => emitFormat("italic")}>
                                <Italic className="w-4 h-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Italic</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => emitFormat("strike")}>
                                <Strikethrough className="w-4 h-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Strikethrough</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => emitFormat("code")}> 
                                <Code className="w-4 h-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Inline Code</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => emitFormat("link")}>
                                <Link2 className="w-4 h-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Link</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => emitFormat("quote")}>
                                <Quote className="w-4 h-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Quote</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => emitFormat("ul")}>
                                <List className="w-4 h-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Bullet List</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => emitFormat("ol")}>
                                <ListOrdered className="w-4 h-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Numbered List</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => emitFormat("task")}>
                                <CheckSquare className="w-4 h-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Task List</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => emitFormat("table")}>
                                <Table className="w-4 h-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Table</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 px-2" onClick={emitPickImage}>
                                <ImagePlus className="w-4 h-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Insert Image</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 px-2" onClick={emitPickPdf}>
                                <FileText className="w-4 h-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Insert PDF</TooltipContent>
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
            {exportOpen && <ExportPDFDialog open={exportOpen} onOpenChange={setExportOpen} documentName={doc.name} />}
        </>
    );
}
