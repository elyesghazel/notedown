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
                    body { font-family: sans-serif; }
                    /* Fix page breaks in PDF */
                    .prose * {
                        page-break-inside: avoid;
                    }
                    .prose img {
                        max-width: 100%;
                        height: auto;
                    }
                    /* Handle nice printed text */
                    @media print {
                        body {
                            background: white !important;
                            color: black !important;
                        }
                    }
                </style>
            </head>
            <body class="bg-white p-8">
                <div class="prose max-w-none">
                    ${html}
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

        // Build header/footer HTML
        const buildHeaderFooterHTML = (items: any[]) => {
            if (!items || items.length === 0) return '';
            const left = items.find(i => i.position === 'left')?.value || '';
            const center = items.find(i => i.position === 'center')?.value || '';
            const right = items.find(i => i.position === 'right')?.value || '';
            
            return `
                <div style="display: flex; justify-content: space-between; font-size: 10px; width: 100%;">
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
                       item.value
            }))
        );

        const footerHTML = buildHeaderFooterHTML(
            footer.map((item: any) => ({
                position: item.position,
                value: item.type === 'page_number' ? '<span class="pageNumber"></span>' : 
                       item.type === 'date' ? new Date().toLocaleDateString() :
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
