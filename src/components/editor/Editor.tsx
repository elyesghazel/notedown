"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import { useImagePaste } from "@/hooks/useImagePaste";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ChevronUp, ChevronDown, X } from "lucide-react";

interface EditorProps {
    content: string;
    onChange: (value: string) => void;
}

export function Editor({ content, onChange }: EditorProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

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

    return (
        <div className="w-full h-full p-4 relative">
            {findOpen && (
                <div className="absolute top-4 right-8 z-10 bg-card border shadow-lg rounded-md p-2 flex items-center space-x-2 w-80">
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
                onDragOver={(e) => e.preventDefault()}
                className="w-full h-full bg-transparent resize-none outline-none font-mono text-sm leading-relaxed pb-24 md:pb-4"
                placeholder="Start typing your markdown..."
            />
        </div>
    );
}
