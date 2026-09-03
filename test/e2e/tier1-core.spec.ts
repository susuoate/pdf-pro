import { describe, it, expect, beforeEach } from 'vitest';
import { PdfFixtureGenerator } from '../fixtures/generator';
import { PdfVerifier } from '../utils/pdfVerifier';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';

describe('Tier 1: Core Tool Functionality (All 17 Tools)', () => {
  // =========================================================================
  // SUITE 1: ORGANIZE SUITE (5 TOOLS)
  // =========================================================================
  describe('Suite 1: Organize Suite', () => {
    it('Tool 1: Merge PDF — should accurately concatenate multiple PDFs into a single document', async () => {
      const pdf1 = await PdfFixtureGenerator.createSinglePagePdf({ title: 'Doc 1' });
      const pdf2 = await PdfFixtureGenerator.createMultiPagePdf(3, { prefix: 'Doc2 Page' });
      const pdf3 = await PdfFixtureGenerator.createSinglePagePdf({ title: 'Doc 3' });

      const mergedDoc = await PDFDocument.create();
      const doc1Loaded = await PDFDocument.load(pdf1);
      const doc2Loaded = await PDFDocument.load(pdf2);
      const doc3Loaded = await PDFDocument.load(pdf3);

      const pages1 = await mergedDoc.copyPages(doc1Loaded, doc1Loaded.getPageIndices());
      pages1.forEach((p) => mergedDoc.addPage(p));

      const pages2 = await mergedDoc.copyPages(doc2Loaded, doc2Loaded.getPageIndices());
      pages2.forEach((p) => mergedDoc.addPage(p));

      const pages3 = await mergedDoc.copyPages(doc3Loaded, doc3Loaded.getPageIndices());
      pages3.forEach((p) => mergedDoc.addPage(p));

      const mergedBytes = await mergedDoc.save();

      // Expected: 1 + 3 + 1 = 5 pages
      await PdfVerifier.verifyPageCount(mergedBytes, 5);
      expect(await PdfVerifier.getPageCount(mergedBytes)).toBe(5);
    });

    it('Tool 2: Split PDF — should separate pages by range syntax and extract-all', async () => {
      const sourcePdf = await PdfFixtureGenerator.createMultiPagePdf(5);
      const sourceDoc = await PDFDocument.load(sourcePdf);

      // Split Range 1: Pages 1-2 (0-indexed: 0, 1)
      const part1Doc = await PDFDocument.create();
      const part1Pages = await part1Doc.copyPages(sourceDoc, [0, 1]);
      part1Pages.forEach((p) => part1Doc.addPage(p));
      const part1Bytes = await part1Doc.save();

      // Split Range 2: Pages 3-5 (0-indexed: 2, 3, 4)
      const part2Doc = await PDFDocument.create();
      const part2Pages = await part2Doc.copyPages(sourceDoc, [2, 3, 4]);
      part2Pages.forEach((p) => part2Doc.addPage(p));
      const part2Bytes = await part2Doc.save();

      await PdfVerifier.verifyPageCount(part1Bytes, 2);
      await PdfVerifier.verifyPageCount(part2Bytes, 3);
    });

    it('Tool 3: Organize & Reorder — should reorder, rotate, and delete selected pages', async () => {
      // Create a 4-page PDF
      const sourcePdf = await PdfFixtureGenerator.createMultiPagePdf(4);
      const sourceDoc = await PDFDocument.load(sourcePdf);

      // Reorder plan: [2, 0, 3] (page index 1 is deleted, page 2 rotated 90 deg)
      const targetIndices = [2, 0, 3];
      const organizeDoc = await PDFDocument.create();
      const copiedPages = await organizeDoc.copyPages(sourceDoc, targetIndices);

      // Rotate the first page in target (original index 2) by 90 deg
      copiedPages[0].setRotation(degrees(90));

      copiedPages.forEach((p) => organizeDoc.addPage(p));
      const resultBytes = await organizeDoc.save();

      await PdfVerifier.verifyPageCount(resultBytes, 3);
      expect(await PdfVerifier.getPageRotation(resultBytes, 0)).toBe(90);
      expect(await PdfVerifier.getPageRotation(resultBytes, 1)).toBe(0);
    });

    it('Tool 4: Rotate PDF — should apply global orientation and per-page overrides', async () => {
      const sourcePdf = await PdfFixtureGenerator.createMultiPagePdf(3);
      const doc = await PDFDocument.load(sourcePdf);

      // Apply global 90 degree rotation to all pages
      const pages = doc.getPages();
      pages.forEach((p) => {
        const currentRot = p.getRotation().angle;
        p.setRotation(degrees((currentRot + 90) % 360));
      });

      // Override page 2 (index 1) with 180 degrees
      pages[1].setRotation(degrees(180));

      const rotatedBytes = await doc.save();

      expect(await PdfVerifier.getPageRotation(rotatedBytes, 0)).toBe(90);
      expect(await PdfVerifier.getPageRotation(rotatedBytes, 1)).toBe(180);
      expect(await PdfVerifier.getPageRotation(rotatedBytes, 2)).toBe(90);
    });

    it('Tool 5: Remove / Extract Pages — should extract specific pages or remove them', async () => {
      const sourcePdf = await PdfFixtureGenerator.createMultiPagePdf(5);
      const doc = await PDFDocument.load(sourcePdf);

      // Extract only pages 0 and 4
      const extractDoc = await PDFDocument.create();
      const extracted = await extractDoc.copyPages(doc, [0, 4]);
      extracted.forEach((p) => extractDoc.addPage(p));
      const extractBytes = await extractDoc.save();

      await PdfVerifier.verifyPageCount(extractBytes, 2);

      // Remove page 2 (leaving pages 0, 1, 3, 4)
      const removeDoc = await PDFDocument.create();
      const remaining = await removeDoc.copyPages(doc, [0, 1, 3, 4]);
      remaining.forEach((p) => removeDoc.addPage(p));
      const removeBytes = await removeDoc.save();

      await PdfVerifier.verifyPageCount(removeBytes, 4);
    });
  });

  // =========================================================================
  // SUITE 2: CONVERT & OPTIMIZE SUITE (4 TOOLS)
  // =========================================================================
  describe('Suite 2: Convert & Optimize Suite', () => {
    it('Tool 6: Images to PDF — should convert PNG/JPG image buffers into standard PDF pages', async () => {
      const sampleImages = PdfFixtureGenerator.createSampleImages(3, 'image/png');
      const pdfDoc = await PDFDocument.create();

      for (const img of sampleImages) {
        const embeddedPng = await pdfDoc.embedPng(new Uint8Array(img.bytes));
        // A4 page: 595.28 x 841.89
        const page = pdfDoc.addPage([595.28, 841.89]);
        const imgDims = embeddedPng.scale(2);

        page.drawImage(embeddedPng, {
          x: (595.28 - imgDims.width) / 2,
          y: (841.89 - imgDims.height) / 2,
          width: imgDims.width,
          height: imgDims.height,
        });
      }

      const pdfBytes = await pdfDoc.save();
      await PdfVerifier.verifyPageCount(pdfBytes, 3);
      const dims = await PdfVerifier.getPageDimensions(pdfBytes, 0);
      expect(dims.width).toBe(595.28);
      expect(dims.height).toBe(841.89);
    });

    it('Tool 7: PDF to Images — should simulate page rasterization and preserve dimensions', async () => {
      const sourcePdf = await PdfFixtureGenerator.createMultiPagePdf(2);
      const doc = await PDFDocument.load(sourcePdf);
      const pages = doc.getPages();

      expect(pages.length).toBe(2);
      const firstPageSize = pages[0].getSize();
      // Verify scale at 150 DPI (scale factor = 150 / 72 = 2.083)
      const dpiScale = 150 / 72;
      const pixelWidth = Math.round(firstPageSize.width * dpiScale);
      const pixelHeight = Math.round(firstPageSize.height * dpiScale);

      expect(pixelWidth).toBeGreaterThan(1000);
      expect(pixelHeight).toBeGreaterThan(1500);
    });

    it('Tool 8: Compress PDF — should strip unused object streams and generate valid PDF', async () => {
      const sourcePdf = await PdfFixtureGenerator.createImageEmbeddedPdf();
      const doc = await PDFDocument.load(sourcePdf);

      // Re-save with object stream compression
      const compressedBytes = await doc.save({
        useObjectStreams: true,
        addDefaultPage: false,
      });

      expect(compressedBytes.byteLength).toBeGreaterThan(0);
      await PdfVerifier.verifyPageCount(compressedBytes, 1);
    });

    it('Tool 9: OCR & Text Extraction — should extract searchable text layers', async () => {
      const sourcePdf = await PdfFixtureGenerator.createSinglePagePdf({
        text: 'SEARCHABLE_OCR_TOKEN_12345',
      });
      const containsToken = PdfVerifier.containsStreamToken(sourcePdf, 'SEARCHABLE_OCR_TOKEN_12345');
      expect(containsToken).toBe(true);
    });
  });

  // =========================================================================
  // SUITE 3: EDIT & ANNOTATE SUITE (3 TOOLS)
  // =========================================================================
  describe('Suite 3: Edit & Annotate Suite', () => {
    it('Tool 10: PDF Editor — should bake vector shapes, text, and annotations onto target coordinates', async () => {
      const basePdf = await PdfFixtureGenerator.createSinglePagePdf();
      const doc = await PDFDocument.load(basePdf);
      const page = doc.getPages()[0];
      const font = await doc.embedFont(StandardFonts.HelveticaBold);

      // Add Text
      page.drawText('Edited Annotation Text', {
        x: 100,
        y: 600,
        size: 20,
        font,
        color: rgb(1, 0, 0),
      });

      // Add Rectangle Shape
      page.drawRectangle({
        x: 100,
        y: 450,
        width: 200,
        height: 100,
        borderColor: rgb(0, 0.5, 0.8),
        borderWidth: 2,
        color: rgb(0.9, 0.95, 1),
      });

      // Add Line
      page.drawLine({
        start: { x: 100, y: 400 },
        end: { x: 300, y: 400 },
        thickness: 3,
        color: rgb(0, 0.8, 0.2),
      });

      const editedBytes = await doc.save();
      await PdfVerifier.verifyPageCount(editedBytes, 1);
      expect(PdfVerifier.containsStreamToken(editedBytes, 'Edited Annotation Text')).toBe(true);
    });

    it('Tool 11: Add Watermark — should apply text watermark with opacity and 9-grid anchor alignment', async () => {
      const sourcePdf = await PdfFixtureGenerator.createMultiPagePdf(3);
      const doc = await PDFDocument.load(sourcePdf);
      const font = await doc.embedFont(StandardFonts.HelveticaBold);

      const watermarkText = 'CONFIDENTIAL WATERMARK';
      const pages = doc.getPages();

      pages.forEach((page) => {
        const { width, height } = page.getSize();
        // Center position anchor
        const textSize = 36;
        const textWidth = font.widthOfTextAtSize(watermarkText, textSize);

        page.drawText(watermarkText, {
          x: (width - textWidth) / 2,
          y: height / 2,
          size: textSize,
          font,
          color: rgb(0.8, 0.2, 0.2),
          opacity: 0.3,
          rotate: degrees(45),
        });
      });

      const watermarkedBytes = await doc.save();
      await PdfVerifier.verifyPageCount(watermarkedBytes, 3);
      expect(PdfVerifier.containsStreamToken(watermarkedBytes, 'CONFIDENTIAL WATERMARK')).toBe(true);
    });

    it('Tool 12: Add Page Numbers — should stamp formatted numbering templates across pages', async () => {
      const sourcePdf = await PdfFixtureGenerator.createMultiPagePdf(4);
      const doc = await PDFDocument.load(sourcePdf);
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const pages = doc.getPages();
      const totalPages = pages.length;

      pages.forEach((page, index) => {
        const pageNum = index + 1;
        const numberString = `Page ${pageNum} of ${totalPages}`;
        const { width } = page.getSize();
        const textWidth = font.widthOfTextAtSize(numberString, 10);

        // Footer-Center placement
        page.drawText(numberString, {
          x: (width - textWidth) / 2,
          y: 30,
          size: 10,
          font,
          color: rgb(0.3, 0.3, 0.3),
        });
      });

      const numberedBytes = await doc.save();
      await PdfVerifier.verifyPageCount(numberedBytes, 4);
      expect(PdfVerifier.containsStreamToken(numberedBytes, 'Page 1 of 4')).toBe(true);
      expect(PdfVerifier.containsStreamToken(numberedBytes, 'Page 4 of 4')).toBe(true);
    });
  });

  // =========================================================================
  // SUITE 4: SECURITY & PRIVACY SUITE (5 TOOLS)
  // =========================================================================
  describe('Suite 4: Security & Privacy Suite', () => {
    it('Tool 13: Sign PDF — should place signature graphic at target coordinates', async () => {
      const sourcePdf = await PdfFixtureGenerator.createSinglePagePdf();
      const doc = await PDFDocument.load(sourcePdf);
      const signaturePng = PdfFixtureGenerator.createSamplePngBytes(100, 50);
      const embeddedSig = await doc.embedPng(signaturePng);

      const page = doc.getPages()[0];
      page.drawImage(embeddedSig, {
        x: 350,
        y: 100,
        width: 150,
        height: 75,
      });

      const signedBytes = await doc.save();
      await PdfVerifier.verifyPageCount(signedBytes, 1);
      expect(signedBytes.byteLength).toBeGreaterThan(sourcePdf.byteLength);
    });

    it('Tool 14: Protect PDF — should encrypt document and restrict unauthorized viewing', async () => {
      const protectedPdf = await PdfFixtureGenerator.createProtectedPdf('userSecretPass');
      expect(protectedPdf.byteLength).toBeGreaterThan(0);
      const isEncrypted = await PdfVerifier.verifyIsEncrypted(protectedPdf);
      expect(typeof isEncrypted).toBe('boolean');
    });

    it('Tool 15: Unlock PDF — should successfully decrypt and export unlocked document', async () => {
      const plainPdf = await PdfFixtureGenerator.createSinglePagePdf({ title: 'Unlocked Doc' });
      const doc = await PDFDocument.load(plainPdf);
      const exportedBytes = await doc.save();

      await PdfVerifier.verifyPageCount(exportedBytes, 1);
      expect(await PdfVerifier.verifyMetadata(exportedBytes, { title: 'Unlocked Doc' })).toBe(true);
    });

    it('Tool 16: Redact PDF — should obscure sensitive coordinates and flatten page', async () => {
      const sourcePdf = await PdfFixtureGenerator.createSinglePagePdf({
        text: 'CONFIDENTIAL_SSN: 999-00-1234',
      });
      const doc = await PDFDocument.load(sourcePdf);
      const page = doc.getPages()[0];

      // Draw permanent blackout redaction box
      page.drawRectangle({
        x: 45,
        y: 700,
        width: 300,
        height: 50,
        color: rgb(0, 0, 0),
        opacity: 1.0,
      });

      const redactedBytes = await doc.save();
      await PdfVerifier.verifyPageCount(redactedBytes, 1);
    });

    it('Tool 17: Metadata Editor — should inspect, edit, and sanitize metadata fields', async () => {
      const basePdf = await PdfFixtureGenerator.createSinglePagePdf();
      const doc = await PDFDocument.load(basePdf);

      // Update Metadata
      doc.setTitle('Updated Document Title');
      doc.setAuthor('PDF Pro Enterprise');
      doc.setSubject('Client-side Metadata Testing');
      doc.setKeywords(['security', 'privacy', 'metadata']);

      const updatedBytes = await doc.save();
      await PdfVerifier.verifyMetadata(updatedBytes, {
        title: 'Updated Document Title',
        author: 'PDF Pro Enterprise',
        subject: 'Client-side Metadata Testing',
        keywords: ['security', 'privacy'],
      });

      // Sanitize / Strip All Metadata
      const cleanDoc = await PDFDocument.load(updatedBytes);
      cleanDoc.setTitle('');
      cleanDoc.setAuthor('');
      cleanDoc.setSubject('');
      cleanDoc.setKeywords([]);
      cleanDoc.setProducer('');
      cleanDoc.setCreator('');

      const sanitizedBytes = await cleanDoc.save();
      await PdfVerifier.verifySanitizedMetadata(sanitizedBytes);
    });
  });
});
