"use client";

import { useState, useRef, useEffect, useCallback, memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css"; // Basic dark highlight theme

interface PreviewProps {
    content: string;
    onContentChange?: (content: string) => void;
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
        <div className="relative inline-block group/img max-w-full my-2 align-top">
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
            <div
                onMouseDown={handleMouseDown}
                className="absolute bottom-1 right-1 w-5 h-5 bg-primary/90 rounded-tl-md cursor-nwse-resize opacity-0 group-hover/img:opacity-100 transition-all flex items-center justify-center shadow-lg hover:scale-110 z-20"
            >
                <div className="w-2.5 h-2.5 border-r-2 border-b-2 border-white/90" />
            </div>
            {isResizing && (
                <div className="absolute top-2 right-2 bg-black/80 text-white text-[10px] px-2 py-1 rounded backdrop-blur-md z-30 font-mono shadow-xl border border-white/10 pointer-events-none">
                    {size.width}{size.height ? ` × ${size.height}` : ''}
                </div>
            )}
        </div>
    );
});

ResizableImage.displayName = "ResizableImage";

export function Preview({ content, onContentChange }: PreviewProps) {
    return (
        <div className="prose prose-invert prose-stone max-w-none w-full h-full p-4 pb-28 md:pb-4 overflow-y-auto">
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
                    )
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
