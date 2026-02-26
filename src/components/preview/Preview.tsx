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
    const PdfEmbed = ({ href, title }: { href: string; title: string }) => {
        const [height, setHeight] = useState(520);
        const [showPreview, setShowPreview] = useState(false);
        const canvasRef = useRef<HTMLCanvasElement>(null);

        // Extract filename from href or use title
        const getFilename = () => {
            try {
                const url = new URL(href, window.location.origin);
                const pathname = url.pathname;
                const filename = pathname.split('/').pop() || 'document';
                // Ensure .pdf extension
                return filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
            } catch {
                // If href is relative or malformed, use title
                const safeName = title.replace(/[^a-z0-9_\-]/gi, '_');
                return `${safeName}.pdf`;
            }
        };

        const getDownloadUrl = () => {
            const url = new URL(href, window.location.origin);
            url.searchParams.set('download', '1');
            return url.toString();
        };

        // Load PDF thumbnail using canvas
        useEffect(() => {
            if (!showPreview || !canvasRef.current) return;

            const loadThumbnail = async () => {
                try {
                    // Use iframe to render first page as fallback
                    // For a proper implementation, you'd use PDF.js
                    // but that requires additional dependencies
                } catch (error) {
                    console.error('Failed to load PDF thumbnail:', error);
                }
            };

            loadThumbnail();
        }, [showPreview, href]);

        return (
            <div className="my-4 space-y-2 border rounded-lg p-3 bg-muted/5">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20M10.1,11.4C10.08,11.44 9.81,13.16 8,16.09C8,16.09 4.5,12.66 4.5,10.5C4.5,9.24 5.5,8.24 6.77,8.24C7.5,8.24 8.17,8.57 8.64,9.05L9,9.41L9.34,9.05C9.82,8.57 10.5,8.24 11.23,8.24C12.5,8.24 13.5,9.24 13.5,10.5C13.5,11.38 13.24,12.14 12.8,12.79C12.5,13.23 12.07,13.7 11.5,14.23C11.18,14.53 10.83,14.85 10.45,15.21C10.25,15.41 10.05,15.61 9.84,15.83L9,16.59L8.16,15.83L8.1,15.77L8.1,15.77C9.5,14.16 10.1,12.84 10.1,11.4Z" />
                        </svg>
                        <span className="font-medium text-muted-foreground">{getFilename()}</span>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setShowPreview(!showPreview)}
                            className="px-2 py-0.5 rounded border text-muted-foreground hover:text-foreground hover:border-primary transition-colors"
                        >
                            {showPreview ? 'Hide Preview' : 'Show Preview'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setHeight((prev) => Math.max(300, prev - 120))}
                            className="px-2 py-0.5 rounded border text-muted-foreground hover:text-foreground hover:border-primary transition-colors"
                        >
                            Smaller
                        </button>
                        <button
                            type="button"
                            onClick={() => setHeight((prev) => Math.min(900, prev + 120))}
                            className="px-2 py-0.5 rounded border text-muted-foreground hover:text-foreground hover:border-primary transition-colors"
                        >
                            Larger
                        </button>
                        <a
                            href={getDownloadUrl()}
                            download={getFilename()}
                            className="px-2 py-0.5 rounded border text-primary hover:text-primary/80 hover:border-primary transition-colors inline-block"
                        >
                            Download
                        </a>
                    </div>
                </div>
                {showPreview && (
                    <div className="border rounded-md bg-background/50 p-3 flex items-center justify-center">
                        <div className="text-center space-y-2">
                            <div className="w-32 h-40 mx-auto border-2 border-dashed rounded flex items-center justify-center bg-muted/20">
                                <svg className="w-16 h-16 text-muted-foreground/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <p className="text-xs text-muted-foreground">PDF Preview</p>
                        </div>
                    </div>
                )}
                <iframe
                    src={href}
                    title={title}
                    className="w-full border rounded-md bg-background"
                    style={{ height: `${height}px` }}
                />
            </div>
        );
    };

    return (
        <div className={`prose prose-invert prose-stone max-w-none w-full ${className || "h-full p-4 pb-28 md:pb-4 overflow-y-auto"}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                    p: ({ children, ...props }) => {
                        const items = Array.isArray(children) ? children : [children];
                        if (items.length === 1) {
                            const child = items[0];
                            if (typeof child === "object" && child && "props" in child) {
                                const propsChild = child.props as Record<string, unknown>;
                                const isPdf = propsChild["data-pdf-embed"] === "true";
                                if (isPdf) {
                                    const href = String(propsChild["data-pdf-href"] || "");
                                    const title = String(propsChild["data-pdf-title"] || "PDF");
                                    return <PdfEmbed href={href} title={title} />;
                                }
                            }
                        }
                        return <p {...props}>{children}</p>;
                    },
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
                    },
                    a: ({ href, children, ...props }) => {
                        const url = typeof href === "string" ? href : "";
                        let isPdf = url.toLowerCase().endsWith(".pdf");
                        if (!isPdf && url) {
                            try {
                                const parsed = new URL(url, "http://localhost");
                                const pathParam = parsed.searchParams.get("path") || "";
                                isPdf = pathParam.toLowerCase().endsWith(".pdf");
                            } catch {
                                // Ignore URL parsing errors
                            }
                        }

                        if (isPdf) {
                            return (
                                <a
                                    href={url}
                                    data-pdf-embed="true"
                                    data-pdf-href={url}
                                    data-pdf-title={typeof children === "string" ? children : "PDF"}
                                    {...props}
                                >
                                    {children}
                                </a>
                            );
                        }

                        return (
                            <a href={url} {...props}>
                                {children}
                            </a>
                        );
                    },
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
