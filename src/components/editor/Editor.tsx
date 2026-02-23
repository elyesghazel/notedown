"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import { useImagePaste } from "@/hooks/useImagePaste";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ChevronUp, ChevronDown, X } from "lucide-react";
import { useSearchParams } from "next/navigation";

interface EditorProps {
    content: string;
    onChange: (value: string) => void;
}

export function Editor({ content, onChange }: EditorProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const searchParams = useSearchParams();

    const insertTextAtCursor = (text: string) => {
        const el = textareaRef.current;
        if (!el) return;
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const newContent = content.substring(0, start) + text + content.substring(end);
        onChange(newContent);

        setTimeout(() => {
            el.selectionStart = el.selectionEnd = start + text.length;
            el.focus();
        }, 0);
    };

    const { onPaste, onDrop } = useImagePaste(insertTextAtCursor);

    // Find functionality
    const [findOpen, setFindOpen] = useState(false);
    const [findText, setFindText] = useState("");
    const [matchIndex, setMatchIndex] = useState(0);

    // Initial Search URL Payload parsing
    useEffect(() => {
        const q = searchParams?.get("q");
        if (q) {
            setFindText(q);
            setFindOpen(true);
            setMatchIndex(0);
        }
    }, [searchParams]);

    const matches = useMemo(() => {
        if (!findText) return [];
        const result = [];
        const lowerContent = content.toLowerCase();
        const lowerSearch = findText.toLowerCase();
        let i = 0;
        while ((i = lowerContent.indexOf(lowerSearch, i)) !== -1) {
            result.push(i);
            i += lowerSearch.length;
        }
        return result;
    }, [content, findText]);

    const highlightMatch = (index: number) => {
        const el = textareaRef.current;
        if (!el || matches.length === 0) return;
        const pos = matches[index];
        el.setSelectionRange(pos, pos + findText.length);

        // Quick hack to scroll to selection in textarea since there is no standard API
        const textToPos = el.value.substring(0, pos);
        const newlines = (textToPos.match(/\\n/g) || []).length;
        el.scrollTop = newlines * 20; // approximate line height
    };

    useEffect(() => {
        if (matches.length > 0) {
            // Keep matchIndex in bounds
            const newIndex = Math.min(matchIndex, matches.length - 1);
            setMatchIndex(newIndex);
            highlightMatch(newIndex);
        }
    }, [matches, findText]);

    const handleNext = () => {
        if (matches.length === 0) return;
        const next = (matchIndex + 1) % matches.length;
        setMatchIndex(next);
        highlightMatch(next);
    };

    const handlePrev = () => {
        if (matches.length === 0) return;
        const prev = (matchIndex - 1 + matches.length) % matches.length;
        setMatchIndex(prev);
        highlightMatch(prev);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "f") {
                e.preventDefault();
                setFindOpen(true);
            }
            if (e.key === "Escape" && findOpen) {
                setFindOpen(false);
                setFindText("");
                textareaRef.current?.focus();
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [findOpen]);

    const backdropRef = useRef<HTMLDivElement>(null);

    const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
        if (backdropRef.current) {
            backdropRef.current.scrollTop = e.currentTarget.scrollTop;
            backdropRef.current.scrollLeft = e.currentTarget.scrollLeft;
        }
    };

    return (
        <div className="w-full h-full relative">
            {findOpen && matches.length > 0 && (
                <div
                    ref={backdropRef}
                    className="absolute inset-0 p-4 pointer-events-none overflow-y-auto font-mono text-sm leading-relaxed whitespace-pre-wrap wrap-break-word text-transparent pb-28 md:pb-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                >
                    {content.substring(0, matches[matchIndex])}
                    <mark className="bg-primary/40 text-transparent rounded-sm">
                        {content.substring(matches[matchIndex], matches[matchIndex] + findText.length)}
                    </mark>
                    {content.substring(matches[matchIndex] + findText.length)}
                </div>
            )}

            {findOpen && (
                <div className="absolute top-4 right-8 z-20 bg-card border shadow-lg rounded-md p-2 flex items-center space-x-2 w-80">
                    <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                    <Input
                        autoFocus
                        placeholder="Find..."
                        value={findText}
                        onChange={e => setFindText(e.target.value)}
                        className="h-8 border-none focus-visible:ring-0 shadow-none px-1"
                        onKeyDown={e => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                e.shiftKey ? handlePrev() : handleNext();
                            }
                        }}
                    />
                    <div className="text-xs text-muted-foreground whitespace-nowrap px-2">
                        {matches.length > 0 ? `${matchIndex + 1} of ${matches.length}` : "0 of 0"}
                    </div>
                    <div className="flex items-center space-x-1 border-l pl-2">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handlePrev} disabled={matches.length === 0}>
                            <ChevronUp className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleNext} disabled={matches.length === 0}>
                            <ChevronDown className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => { setFindOpen(false); setFindText(""); }}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}
            <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => onChange(e.target.value)}
                onPaste={onPaste}
                onDrop={onDrop}
                onScroll={handleScroll}
                onDragOver={(e) => e.preventDefault()}
                className="w-full h-full p-4 absolute inset-0 bg-transparent resize-none outline-none border-none font-mono text-sm leading-relaxed pb-28 md:pb-8 z-10 wrap-break-word"
                placeholder="Start typing your markdown..."
            />
        </div>
    );
}
