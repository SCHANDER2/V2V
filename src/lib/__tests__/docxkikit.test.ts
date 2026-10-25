// src/lib/__tests__/docxkikit.test.ts
import { DocxKiKitEngine } from "../docxkikit-engine";
import { PDFDocument } from "pdf-lib";

describe("DocxKiKitEngine Unit Tests", () => {
  describe("textOrPdfToDocx", () => {
    it("should synthesize a valid .docx document from raw text", async () => {
      const text = "Hello DocxKiKit!\nThis is a test paragraph.\nSecond line.";
      const docxBytes = await DocxKiKitEngine.textOrPdfToDocx(text, "Test Doc");

      expect(docxBytes).toBeInstanceOf(Uint8Array);
      expect(docxBytes.length).toBeGreaterThan(500);

      // DOCX files are zip packages; their first two bytes are 'PK' (0x50, 0x4B)
      expect(docxBytes[0]).toBe(0x50);
      expect(docxBytes[1]).toBe(0x4b);
    });
  });

  describe("mergePdfs", () => {
    it("should successfully merge multiple PDF documents into a single file", async () => {
      // Create Doc 1 (1 page)
      const doc1 = await PDFDocument.create();
      doc1.addPage([200, 200]);
      const bytes1 = await doc1.save();

      // Create Doc 2 (2 pages)
      const doc2 = await PDFDocument.create();
      doc2.addPage([200, 200]);
      doc2.addPage([200, 200]);
      const bytes2 = await doc2.save();

      const mergedBytes = await DocxKiKitEngine.mergePdfs([bytes1, bytes2]);
      expect(mergedBytes).toBeInstanceOf(Uint8Array);

      // Load back merged PDF and verify page count
      const loaded = await PDFDocument.load(mergedBytes);
      expect(loaded.getPageCount()).toBe(3);
    });

    it("should throw an error if fewer than 2 PDFs are provided to merge", async () => {
      const doc1 = await PDFDocument.create();
      doc1.addPage();
      const bytes1 = await doc1.save();

      await expect(DocxKiKitEngine.mergePdfs([bytes1])).rejects.toThrow(
        "At least two PDF files are required to merge."
      );
    });
  });

  describe("watermarkPdf", () => {
    it("should stamp watermark on all PDF pages", async () => {
      const doc = await PDFDocument.create();
      doc.addPage([300, 300]);
      doc.addPage([300, 300]);
      const bytes = await doc.save();

      const watermarked = await DocxKiKitEngine.watermarkPdf(bytes, "CONFIDENTIAL");
      expect(watermarked.length).toBeGreaterThan(bytes.length);

      const loaded = await PDFDocument.load(watermarked);
      expect(loaded.getPageCount()).toBe(2);
    });
  });

  describe("protectPdf", () => {
    it("should encrypt PDF with a password", async () => {
      const doc = await PDFDocument.create();
      doc.addPage([300, 300]);
      const bytes = await doc.save();

      const protectedBytes = await DocxKiKitEngine.protectPdf(bytes, "SecretPass123");
      expect(protectedBytes).toBeInstanceOf(Uint8Array);
      expect(protectedBytes.length).toBeGreaterThan(0);
    });
  });
});
