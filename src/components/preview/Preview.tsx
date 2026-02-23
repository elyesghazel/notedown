"use client";

import { useState, useRef, useEffect, useCallback, memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css"; // Basic dark highlight theme

interface PreviewProps {
    content: string;
    onContentChange?: (content: string) => void;
    className?: string;
}

// Move outside to avoid unmounting on every content change
const ResizableImage = memo(({ src, alt: originalAlt, content, onContentChange, ...props }: any) => {
    const [isResizing, setIsResizing] = useState(false);
    const [size, setSize] = useState<{ width: number, height: number | undefined }>({ width: 0, height: undefined });
    const imgRef = useRef<HTMLImageElement>(null);
    const startPos = useRef({ x: 0, y: 0, w: 0, h: 0 });

    // Parse the current size from alt
    let alt = originalAlt || "";
    let width: number | undefined;
    let height: number | undefined;

    // Use a proper regex literal for parsing
    const sizeMatch = alt.match(/(?:\||=)\s*(\d+)(?:x(\d+))?\s*$/);
    if (sizeMatch) {
        width = parseInt(sizeMatch[1]);
        if (sizeMatch[2]) height = parseInt(sizeMatch[2]);
        // Display alt text without the size suffix
        alt = alt.replace(/(?:\||=)\s*\d+(?:x\d+)?\s*$/, '').trim();
    }

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!imgRef.current) return;
        e.preventDefault();
        setIsResizing(true);
        const rect = imgRef.current.getBoundingClientRect();
        startPos.current = {
            x: e.clientX,
            y: e.clientY,
            w: rect.width,
            h: rect.height
        };
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;
            const dx = e.clientX - startPos.current.x;
            const dy = e.clientY - startPos.current.y;
            const newW = Math.max(50, startPos.current.w + dx);
            const newH = startPos.current.h + dy;

            setSize({
                width: Math.round(newW),
                height: height !== undefined ? Math.round(newH) : undefined
            });
        };

        const handleMouseUp = () => {
            if (!isResizing) return;
            setIsResizing(false);

            if (onContentChange && size.width > 0) {
                // Find and replace precisely using regex
                const cleanAlt = originalAlt.replace(/(?:\||=)\s*\d+(?:x\d+)?\s*$/, '').trim();
                const newSizeStr = `${size.width}${size.height ? 'x' + size.height : ''}`;

                // Escape characters for regex safety
                const escapedAlt = originalAlt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const escapedSrc = src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

                const imageRegex = new RegExp(`!\\[${escapedAlt}\\]\\(${escapedSrc}\\)`, 'g');
                const newMarkdown = `![${cleanAlt} | ${newSizeStr}](${src})`;

                const newContent = content.replace(imageRegex, newMarkdown);
                if (newContent !== content) {
                    onContentChange(newContent);
                }
            }
        };

        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, size, originalAlt, src, content, onContentChange, height]);

    return (
        <span className="relative inline-block group/img max-w-full my-2 align-top">
            <img
                ref={imgRef}
                {...props}
                src={src}
                alt={alt}
                style={{
                    width: size.width ? `${size.width}px` : (width ? `${width}px` : undefined),
                    height: size.height ? `${size.height}px` : (height ? `${height}px` : undefined),
                    cursor: isResizing ? 'nwse-resize' : 'default'
                }}
                className="rounded-lg shadow-md border border-border/50 max-w-full h-auto block"
            />
            <button
                type="button"
                onMouseDown={handleMouseDown}
                className="absolute bottom-1 right-1 w-5 h-5 bg-primary/90 rounded-tl-md cursor-nwse-resize opacity-0 group-hover/img:opacity-100 transition-all flex items-center justify-center shadow-lg hover:scale-110 z-20 border-0 p-0"
            >
                <span className="w-2.5 h-2.5 border-r-2 border-b-2 border-white/90" />
            </button>
            {isResizing && (
                <span className="absolute top-2 right-2 bg-black/80 text-white text-[10px] px-2 py-1 rounded backdrop-blur-md z-30 font-mono shadow-xl border border-white/10 pointer-events-none">
                    {size.width}{size.height ? ` × ${size.height}` : ''}
                </span>
            )}
        </span>
    );
});

ResizableImage.displayName = "ResizableImage";

export function Preview({ content, onContentChange, className }: PreviewProps) {
    return (
        <div className={`prose prose-invert prose-stone max-w-none w-full ${className || "h-full p-4 pb-28 md:pb-4 overflow-y-auto"}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                    img: (props) => (
                        <ResizableImage
                            {...props}
                            content={content}
                            onContentChange={onContentChange}
                        />
                    ),
                    blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-primary/40 bg-primary/5 pl-4 py-2 pr-2 rounded-r-md italic my-6 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-primary/20" />
                            {children}
                        </blockquote>
                    ),
                    h1: ({ children }) => <h1 className="text-3xl font-extrabold tracking-tight border-b-2 border-primary/10 pb-3 mb-6 mt-10 text-foreground">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-2xl font-bold tracking-tight mb-4 mt-8 text-foreground/90 flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-primary/40 rounded-full" />
                        {children}
                    </h2>,
                    h3: ({ children }) => <h3 className="text-xl font-semibold mb-3 mt-6 text-foreground/80">{children}</h3>,
                    hr: () => <hr className="my-10 border-t-2 border-border/50 rounded-full" />,
                    li: ({ node, className, children, ...props }: any) => {
                        return <li className={className} data-line={node?.position?.start?.line} {...props}>{children}</li>;
                    },
                    input: ({ node, checked, type, ...props }: any) => {
                        if (type === "checkbox") {
                            // Find line dynamically from parental AST if exact AST is stripped
                            const expectedLine = node?.position?.start?.line;
                            // Remove disabled if present so we can click it
                            const { disabled, className, ...rest } = props;
                            return (
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    {...rest}
                                    onChange={(e) => {
                                        if (!onContentChange) return;

                                        // We first try to use the raw AST line number (fast & safe)
                                        // or fetch it from the input's DOM context if we wrapped it
                                        const syntheticNodeLine = expectedLine;

                                        if (syntheticNodeLine) {
                                            const lines = content.split("\n");
                                            const lineIdx = syntheticNodeLine - 1;
                                            if (lineIdx >= 0 && lineIdx < lines.length) {
                                                const line = lines[lineIdx];
                                                if (e.target.checked) {
                                                    lines[lineIdx] = line.replace(/([ \t]*(?:[-*+]|\d+\.)\s+)\[ \]/, "$1[x]");
                                                } else {
                                                    lines[lineIdx] = line.replace(/([ \t]*(?:[-*+]|\d+\.)\s+)\[[xX]\]/, "$1[ ]");
                                                }
                                                const newContent = lines.join("\n");
                                                if (newContent !== content) {
                                                    onContentChange(newContent);
                                                }
                                            }
                                        } else {
                                            // Fallback for missing AST data: Mask code block texts so Regex skips them safely
                                            const maskedContent = content
                                                .replace(/```[\s\S]*?```/g, m => " ".repeat(m.length))
                                                .replace(/`[^`\n]*`/g, m => " ".repeat(m.length));

                                            // Since we do not have node.position, we need to locate this specific checkbox's index in the DOM
                                            // We get it efficiently at click time relative to other rendered task checkboxes
                                            const thisEventElement = e.target as HTMLInputElement;
                                            const allCheckboxes = Array.from(document.querySelectorAll('.preview-checkbox'));
                                            const thisIndex = allCheckboxes.indexOf(thisEventElement);

                                            if (thisIndex === -1) return;

                                            let matchCounter = 0;
                                            const newContent = content.replace(/^([ \t]*(?:[-*+]|\d+\.)\s+)\[([ xX])\]/gm, (match, prefix, check, offset) => {
                                                if (maskedContent.substring(offset, offset + match.length).trim() === "") {
                                                    return match; // inside code block
                                                }
                                                if (matchCounter === thisIndex) {
                                                    matchCounter++;
                                                    return e.target.checked ? `${prefix}[x]` : `${prefix}[ ]`;
                                                }
                                                matchCounter++;
                                                return match;
                                            });

                                            if (newContent !== content) onContentChange(newContent);
                                        }
                                    }}
                                    className={`preview-checkbox mr-2 cursor-pointer w-4 h-4 text-primary bg-background border-primary/50 focus:ring-primary/20 accent-primary transition-colors rounded ${className || ""}`}
                                />
                            );
                        }
                        return <input type={type} checked={checked} {...props} />;
                    }
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
