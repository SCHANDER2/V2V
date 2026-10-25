// src/app/api/docxkikit/convert/route.ts
import { NextRequest, NextResponse } from "next/server";
import { DocxKiKitEngine } from "@/lib/docxkikit-engine";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const action = (formData.get("action") as string) || "docx-to-pdf";
    const file = formData.get("file") as File | null;
    const watermarkText = (formData.get("watermarkText") as string) || "DOCXKIKIT";
    const password = (formData.get("password") as string) || "";
    const rawText = (formData.get("text") as string) || "";

    if (action === "text-to-docx") {
      const docxBytes = await DocxKiKitEngine.textOrPdfToDocx(
        rawText || "Generated from DocxKiKit",
        (formData.get("title") as string) || "Document"
      );
      return new NextResponse(Buffer.from(docxBytes), {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": 'attachment; filename="converted_document.docx"',
        },
      });
    }

    if (!file) {
      return NextResponse.json({ error: "No input file provided." }, { status: 400 });
    }

    const fileBytes = new Uint8Array(await file.arrayBuffer());

    if (action === "docx-to-pdf") {
      const pdfBytes = await DocxKiKitEngine.docxToPdf(fileBytes, file.name);
      return new NextResponse(Buffer.from(pdfBytes), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${file.name.replace(/\.[^/.]+$/, "")}.pdf"`,
        },
      });
    }

    if (action === "docx-to-html") {
      const html = await DocxKiKitEngine.docxToHtml(fileBytes);
      const { stats } = await DocxKiKitEngine.docxToTextAndStats(fileBytes);
      return NextResponse.json({ html, stats, filename: file.name });
    }

    if (action === "watermark-pdf") {
      const watermarked = await DocxKiKitEngine.watermarkPdf(fileBytes, watermarkText);
      return new NextResponse(Buffer.from(watermarked), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="watermarked_${file.name}"`,
        },
      });
    }

    if (action === "protect-pdf") {
      if (!password) {
        return NextResponse.json({ error: "Password is required to protect PDF." }, { status: 400 });
      }
      const protectedPdf = await DocxKiKitEngine.protectPdf(fileBytes, password);
      return new NextResponse(Buffer.from(protectedPdf), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="protected_${file.name}"`,
        },
      });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error("[DocxKiKit API Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to process document." }, { status: 500 });
  }
}
