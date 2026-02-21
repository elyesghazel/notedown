import { getPublished } from "@/lib/db";
import { Preview } from "@/components/preview/Preview";

export default async function SharePage({ params }: { params: Promise<{ uuid: string }> }) {
    const { uuid } = await params;
    const publishedList = getPublished();
    const snapshot = publishedList.find((p) => p.uuid === uuid);

    if (!snapshot) {
        return (
            <div className="flex-1 min-h-screen flex flex-col items-center justify-center text-muted-foreground bg-background">
                <h1 className="text-2xl font-bold mb-2 text-foreground">Snapshot Not Found</h1>
                <p>This document may have been unpublished or the link is invalid.</p>
            </div>
        );
    }

    const title = snapshot.title || "Published Note";

    return (
        <div className="min-h-screen bg-background flex flex-col w-full mx-auto">
            {/* Header - responsive */}
            <header className="h-14 border-b flex items-center justify-between px-4 md:px-6 sticky top-0 bg-background/90 backdrop-blur z-10">
                <div className="flex items-center space-x-3 min-w-0">
                    <span className="font-semibold text-base md:text-lg tracking-tight truncate">{title}</span>
                    <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium shrink-0">
                        Snapshot
                    </span>
                </div>
            </header>

            {/* Content - centered card with proper prose styling */}
            <main className="flex-1 flex justify-center w-5/6 mx-auto">
                <article className="w-full px-4 md:px-0 py-8 md:py-12">
                    <div className="bg-card border rounded-xl shadow-lg overflow-hidden">
                        <div className="h-1 bg-gradient-to-r from-primary to-primary/40" />
                        <div className="p-6 md:p-10">
                            <Preview content={snapshot.content} />
                        </div>
                    </div>
                </article>
            </main>

            {/* Footer */}
            <footer className="py-4 text-center text-xs text-muted-foreground border-t">
                Published {new Date(snapshot.publishedAt).toLocaleDateString()}
            </footer>
        </div>
    );
}
