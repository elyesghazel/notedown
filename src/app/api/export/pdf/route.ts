import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import puppeteer from "puppeteer";

export async function POST(req: Request) {
    try {
        const { html } = await req.json();

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

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
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
