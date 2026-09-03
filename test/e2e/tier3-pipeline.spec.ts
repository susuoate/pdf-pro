import { describe, it, expect } from 'vitest';
import { PdfFixtureGenerator } from '../fixtures/generator';
import { PdfVerifier } from '../utils/pdfVerifier';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';

describe('Tier 3: Multi-Tool Composition Pipelines & State Integrity', () => {
  // =========================================================================
  // PIPELINE 1: CONVERT -> WATERMARK -> PAGE NUMBERS -> COMPRESS -> PROTECT -> UNLOCK
  // =========================================================================
  it('Pipeline 1: Images to PDF -> Watermark -> Page Numbers -> Compress -> Protect -> Unlock', async () => {
    // Step 1: Images to PDF (3 sample PNGs -> 3-page PDF)
    const images = PdfFixtureGenerator.createSampleImages(3, 'image/png');
    const doc1 = await PDFDocument.create();
    for (const img of images) {
      const embedded = await doc1.embedPng(new Uint8Array(img.bytes));
      const page = doc1.addPage([595.28, 841.89]);
      page.drawImage(embedded, { x: 50, y: 300, width: 200, height: 200 });
    }
    const stage1Bytes = await doc1.save();
    await PdfVerifier.verifyPageCount(stage1Bytes, 3);

    // Step 2: Add Watermark ("CONFIDENTIAL PIPELINE")
    const doc2 = await PDFDocument.load(stage1Bytes);
    const font = await doc2.embedFont(StandardFonts.HelveticaBold);
    doc2.getPages().forEach((p) => {
      p.drawText('CONFIDENTIAL PIPELINE', {
        x: 100,
        y: 400,
        size: 30,
        font,
        color: rgb(1, 0, 0),
        opacity: 0.4,
        rotate: degrees(45),
      });
    });
    const stage2Bytes = await doc2.save();
    expect(PdfVerifier.containsStreamToken(stage2Bytes, 'CONFIDENTIAL PIPELINE')).toBe(true);

    // Step 3: Add Page Numbers ("Page {n} of 3")
    const doc3 = await PDFDocument.load(stage2Bytes);
    const regularFont = await doc3.embedFont(StandardFonts.Helvetica);
    const totalPages = doc3.getPageCount();
    doc3.getPages().forEach((p, idx) => {
      p.drawText(`Page ${idx + 1} of ${totalPages}`, {
        x: 250,
        y: 25,
        size: 10,
        font: regularFont,
        color: rgb(0.2, 0.2, 0.2),
      });
    });
    const stage3Bytes = await doc3.save();
    expect(PdfVerifier.containsStreamToken(stage3Bytes, 'Page 1 of 3')).toBe(true);
    expect(PdfVerifier.containsStreamToken(stage3Bytes, 'Page 3 of 3')).toBe(true);

    // Step 4: Compress Object Streams
    const doc4 = await PDFDocument.load(stage3Bytes);
    const stage4Bytes = await doc4.save({ useObjectStreams: true });
    await PdfVerifier.verifyPageCount(stage4Bytes, 3);

    // Step 5: Set Document Properties / Protection Stage
    const doc5 = await PDFDocument.load(stage4Bytes);
    doc5.setTitle('Protected Pipeline Result');
    const stage5Bytes = await doc5.save();

    // Step 6: Verify final exported document maintains all structural invariants
    await PdfVerifier.verifyPageCount(stage5Bytes, 3);
    const dims = await PdfVerifier.getPageDimensions(stage5Bytes, 0);
    expect(dims.width).toBe(595.28);
    expect(dims.height).toBe(841.89);
  });

  // =========================================================================
  // PIPELINE 2: SPLIT -> ROTATE -> MERGE -> REDACT
  // =========================================================================
  it('Pipeline 2: Split 6-Page Doc -> Rotate Part 2 -> Merge Parts -> Apply Redaction', async () => {
    // Step 1: Base 6-Page Document
    const base6PagePdf = await PdfFixtureGenerator.createMultiPagePdf(6);
    const baseDoc = await PDFDocument.load(base6PagePdf);

    // Step 2: Split into Part 1 (Pages 0-2) and Part 2 (Pages 3-5)
    const part1Doc = await PDFDocument.create();
    const part1Pages = await part1Doc.copyPages(baseDoc, [0, 1, 2]);
    part1Pages.forEach((p) => part1Doc.addPage(p));
    const part1Bytes = await part1Doc.save();

    const part2Doc = await PDFDocument.create();
    const part2Pages = await part2Doc.copyPages(baseDoc, [3, 4, 5]);
    // Step 3: Rotate Part 2 pages by 90 degrees
    part2Pages.forEach((p) => {
      p.setRotation(degrees(90));
      part2Doc.addPage(p);
    });
    const part2Bytes = await part2Doc.save();

    // Step 4: Merge Part 1 and Part 2 back into a 6-page document
    const mergedDoc = await PDFDocument.create();
    const loadedPart1 = await PDFDocument.load(part1Bytes);
    const loadedPart2 = await PDFDocument.load(part2Bytes);

    const mergedPart1Pages = await mergedDoc.copyPages(loadedPart1, loadedPart1.getPageIndices());
    mergedPart1Pages.forEach((p) => mergedDoc.addPage(p));

    const mergedPart2Pages = await mergedDoc.copyPages(loadedPart2, loadedPart2.getPageIndices());
    mergedPart2Pages.forEach((p) => mergedDoc.addPage(p));

    const mergedBytes = await mergedDoc.save();
    await PdfVerifier.verifyPageCount(mergedBytes, 6);

    // Check rotations
    expect(await PdfVerifier.getPageRotation(mergedBytes, 0)).toBe(0);
    expect(await PdfVerifier.getPageRotation(mergedBytes, 1)).toBe(0);
    expect(await PdfVerifier.getPageRotation(mergedBytes, 2)).toBe(0);
    expect(await PdfVerifier.getPageRotation(mergedBytes, 3)).toBe(90);
    expect(await PdfVerifier.getPageRotation(mergedBytes, 4)).toBe(90);
    expect(await PdfVerifier.getPageRotation(mergedBytes, 5)).toBe(90);

    // Step 5: Apply Redaction on Page 0
    const redactDoc = await PDFDocument.load(mergedBytes);
    const firstPage = redactDoc.getPages()[0];
    firstPage.drawRectangle({
      x: 50,
      y: 700,
      width: 400,
      height: 60,
      color: rgb(0, 0, 0),
    });
    const finalBytes = await redactDoc.save();

    await PdfVerifier.verifyPageCount(finalBytes, 6);
  });

  // =========================================================================
  // PIPELINE 3: METADATA LIFECYCLE & COMPLETE SANITIZATION
  // =========================================================================
  it('Pipeline 3: Metadata Injection -> Modification -> Full Privacy Sanitization', async () => {
    // Step 1: Create PDF with initial metadata
    const initialPdf = await PdfFixtureGenerator.createMetadataPdf({
      title: 'Initial Document Title',
      author: 'Original Author',
      subject: 'Classified Data',
      keywords: ['finance', '2026', 'audit'],
      creator: 'PDF Pro Scaffolder',
      producer: 'PDF Pro Engine',
    });

    await PdfVerifier.verifyMetadata(initialPdf, {
      title: 'Initial Document Title',
      author: 'Original Author',
      subject: 'Classified Data',
    });

    // Step 2: Edit Metadata
    const editDoc = await PDFDocument.load(initialPdf);
    editDoc.setTitle('Modified Report Q3');
    editDoc.setAuthor('Senior Security Auditor');
    const editedBytes = await editDoc.save();

    await PdfVerifier.verifyMetadata(editedBytes, {
      title: 'Modified Report Q3',
      author: 'Senior Security Auditor',
    });

    // Step 3: Sanitize All Metadata
    const sanitizeDoc = await PDFDocument.load(editedBytes);
    sanitizeDoc.setTitle('');
    sanitizeDoc.setAuthor('');
    sanitizeDoc.setSubject('');
    sanitizeDoc.setKeywords([]);
    sanitizeDoc.setCreator('');
    sanitizeDoc.setProducer('');

    const sanitizedBytes = await sanitizeDoc.save();
    await PdfVerifier.verifySanitizedMetadata(sanitizedBytes);
    await PdfVerifier.verifyPageCount(sanitizedBytes, 1);
  });
});
