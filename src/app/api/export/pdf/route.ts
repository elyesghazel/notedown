import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import puppeteer from "puppeteer";

export async function POST(req: Request) {
    try {
        const { html, header = [], footer = [] } = await req.json();

        if (!html) {
            return NextResponse.json({ error: "No HTML provided" }, { status: 400 });
        }

        const origin = new URL(req.url).origin;

        const fullHtml = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <base href="${origin}" />
                <script src="https://cdn.tailwindcss.com?plugins=typography"></script>
                <style>
                    :root {
                        --background: 0 0% 100%;
                        --foreground: 222.2 84% 4.9%;
                        --primary: 222.2 47.4% 11.2%;
                        --primary-foreground: 210 40% 98%;
                        --border: 214.3 31.8% 91.4%;
                        --muted: 210 40% 96.1%;
                        --muted-foreground: 215.4 16.3% 46.9%;
                        --accent: 210 40% 96.1%;
                        --accent-foreground: 222.2 47.4% 11.2%;
                    }
                    html, body {
                        margin: 0;
                        padding: 0;
                        height: auto !important;
                        overflow: visible !important;
                        background: white !important;
                        color: black !important;
                        font-family: sans-serif;
                    }
                    /* Fix page breaks */
                    #content-wrapper {
                        display: block !important;
                        height: auto !important;
                        overflow: visible !important;
                        width: 100%;
                    }
                    .prose {
                        max-width: none !important;
                        width: 100% !important;
                        height: auto !important;
                        overflow: visible !important;
                        display: block !important;
                        page-break-inside: auto;
                    }
                    .prose * {
                        page-break-inside: auto;
                    }
                    .prose img {
                        page-break-inside: avoid;
                        max-width: 100% !important;
                        height: auto !important;
                        display: block;
                        margin: 1em 0;
                    }
                    .prose pre,
                    .prose code {
                        white-space: pre-wrap !important;
                        word-break: break-word !important;
                        overflow-wrap: anywhere !important;
                        max-width: 100% !important;
                    }
                    .prose pre {
                        overflow: hidden !important;
                    }
                    @media print {
                        .prose {
                            color: black !important;
                        }
                    }
                </style>
            </head>
            <body>
                <div id="content-wrapper" class="p-12">
                    <div class="prose">
                        ${html}
                    </div>
                </div>
            </body>
            </html>
        `;

        const browser = await puppeteer.launch({
            headless: true,
            // Depending on environment, might need args like '--no-sandbox'
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });

        const page = await browser.newPage();

        // Pass authentication cookie so image requests don't redirect to /login
        const cookieStore = await cookies();
        const token = cookieStore.get("auth-token")?.value;
        if (token) {
            await page.setCookie({
                name: "auth-token",
                value: token,
                domain: new URL(origin).hostname,
                path: "/",
            });
        }

        // Emulate screen so Tailwind styles apply correctly if not in @media print
        await page.emulateMediaType('print');

        await page.setContent(fullHtml, { waitUntil: 'networkidle0' });
        await page.evaluateHandle('document.fonts.ready');
        await page.evaluate(async () => {
            const images = Array.from(document.images);
            await Promise.all(images.map((img) => {
                if (img.complete) return Promise.resolve();
                return new Promise<void>((resolve) => {
                    img.onload = () => resolve();
                    img.onerror = () => resolve();
                });
            }));
        });

        // Build header/footer HTML
        const buildHeaderFooterHTML = (items: any[]) => {
            if (!items || items.length === 0) return '';
            const left = items.filter(i => i.position === 'left').map(i => i.value).join(' ');
            const center = items.filter(i => i.position === 'center').map(i => i.value).join(' ');
            const right = items.filter(i => i.position === 'right').map(i => i.value).join(' ');

            return `
                <div style="display: flex; justify-content: space-between; font-size: 10px; width: 100%; padding: 0 20mm; color: #666;">
                    <div style="flex: 1; text-align: left;">${left}</div>
                    <div style="flex: 1; text-align: center;">${center}</div>
                    <div style="flex: 1; text-align: right;">${right}</div>
                </div>
            `;
        };

        const headerHTML = buildHeaderFooterHTML(
            header.map((item: any) => ({
                position: item.position,
                value: item.type === 'page_number' ? '<span class="pageNumber"></span>' :
                    item.type === 'date' ? new Date().toLocaleDateString() :
                        item.type === 'logo' ? `<img src="${item.value}" style="height: ${item.size || 10}mm; vertical-align: middle;" />` :
                            item.value
            }))
        );

        const footerHTML = buildHeaderFooterHTML(
            footer.map((item: any) => ({
                position: item.position,
                value: item.type === 'page_number' ? '<span class="pageNumber"></span> / <span class="totalPages"></span>' :
                    item.type === 'date' ? new Date().toLocaleDateString() :
                        item.type === 'logo' ? `<img src="${item.value}" style="height: ${item.size || 10}mm; vertical-align: middle;" />` :
                            item.value
            }))
        );

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            displayHeaderFooter: true,
            headerTemplate: headerHTML,
            footerTemplate: footerHTML,
            margin: {
                top: '20mm',
                right: '20mm',
                bottom: '20mm',
                left: '20mm',
            },
        });

        await browser.close();

        return new NextResponse(pdfBuffer as unknown as BodyInit, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename="document.pdf"',
            },
        });

    } catch (error) {
        console.error("PDF generation error:", error);
        return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
    }
}
