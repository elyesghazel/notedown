import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { SearchDialog } from "@/components/dialogs/SearchDialog";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Markdown Notes",
    description: "A lightweight markdown note-taking app",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark">
            <body
                className={`${inter.className} antialiased bg-background text-foreground flex h-screen overflow-hidden`}
            >
                <TooltipProvider>
                    <Sidebar />
                    {children}
                </TooltipProvider>
                <SearchDialog />
                <Toaster theme="dark" position="bottom-right" />
            </body>
        </html>
    );
}
