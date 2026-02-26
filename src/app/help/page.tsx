import { Metadata } from "next";
import Link from "next/link";
import fs from "fs";
import path from "path";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { remarkPlugins, rehypePlugins } from "@/lib/markdown";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
    title: "Help & Guides - Markdown Notes",
};

const helpPath = path.join(process.cwd(), "src", "content", "help.md");
const helpContent = fs.readFileSync(helpPath, "utf-8");

export default function HelpPage() {
    return (
        <div className="flex-1 w-full h-full bg-background overflow-y-auto">
            <div className="max-w-3xl mx-auto px-6 py-12 md:py-16">
                <Link href="/">
                    <Button variant="ghost" className="pl-0 text-muted-foreground hover:text-foreground mb-6">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to App
                    </Button>
                </Link>
                <article className="prose prose-stone dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={remarkPlugins} rehypePlugins={rehypePlugins}>
                        {helpContent}
                    </ReactMarkdown>
                </article>
            </div>
        </div>
    );
}
