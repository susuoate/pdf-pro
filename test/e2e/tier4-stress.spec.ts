import { describe, it, expect } from 'vitest';
import { PdfFixtureGenerator } from '../fixtures/generator';
import { PdfVerifier } from '../utils/pdfVerifier';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

describe('Tier 4: Real-World Stress, Memory & Offline Verification', () => {
  // =========================================================================
  // 1. 50+ PAGE STRESS PROCESSING
  // =========================================================================
  describe('Large Document Processing Stress Test (50 Pages)', () => {
    it('should generate, process, watermark, and number a 50-page PDF document without failure', async () => {
      const pageCount = 50;
      const largePdf = await PdfFixtureGenerator.createMultiPagePdf(pageCount, {
        prefix: 'Stress Test Page',
      });

      await PdfVerifier.verifyPageCount(largePdf, pageCount);

      // Load document and apply watermark + numbering across all 50 pages
      const doc = await PDFDocument.load(largePdf);
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

      const pages = doc.getPages();
      expect(pages.length).toBe(pageCount);

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const pageNum = i + 1;

        // Stamp watermark
        page.drawText('CONFIDENTIAL STRESS TEST', {
          x: 150,
          y: 400,
          size: 24,
          font: boldFont,
          color: rgb(0.9, 0.2, 0.2),
          opacity: 0.2,
        });

        // Stamp page numbers
        page.drawText(`Page ${pageNum} of ${pageCount}`, {
          x: 250,
          y: 20,
          size: 9,
          font,
          color: rgb(0.3, 0.3, 0.3),
        });
      }

      const processedBytes = await doc.save();
      await PdfVerifier.verifyPageCount(processedBytes, pageCount);
      expect(processedBytes.byteLength).toBeGreaterThan(largePdf.byteLength);
    });

    it('should split 50-page document into odd and even sub-documents accurately', async () => {
      const largePdf = await PdfFixtureGenerator.createMultiPagePdf(50);
      const sourceDoc = await PDFDocument.load(largePdf);

      const oddIndices = Array.from({ length: 50 }, (_, i) => i).filter((i) => i % 2 === 0);
      const evenIndices = Array.from({ length: 50 }, (_, i) => i).filter((i) => i % 2 === 1);

      // Odd Doc (25 pages)
      const oddDoc = await PDFDocument.create();
      const oddPages = await oddDoc.copyPages(sourceDoc, oddIndices);
      oddPages.forEach((p) => oddDoc.addPage(p));
      const oddBytes = await oddDoc.save();

      // Even Doc (25 pages)
      const evenDoc = await PDFDocument.create();
      const evenPages = await evenDoc.copyPages(sourceDoc, evenIndices);
      evenPages.forEach((p) => evenDoc.addPage(p));
      const evenBytes = await evenDoc.save();

      await PdfVerifier.verifyPageCount(oddBytes, 25);
      await PdfVerifier.verifyPageCount(evenBytes, 25);
    });
  });

  // =========================================================================
  // 2. ZERO-SERVER-UPLOAD OFFLINE PRIVACY GUARANTEE
  // =========================================================================
  describe('Zero-Server-Upload Offline Sandbox Guarantee', () => {
    it('should execute complete PDF pipeline with strictly 0 external network requests', async () => {
      await PdfVerifier.verifyZeroNetworkEgress(async () => {
        // Run full in-memory synthesis & transformations
        const pdf1 = await PdfFixtureGenerator.createSinglePagePdf({ text: 'Sensitive Patient Record' });
        const pdf2 = await PdfFixtureGenerator.createSinglePagePdf({ text: 'Confidential Tax ID' });

        const merged = await PDFDocument.create();
        const d1 = await PDFDocument.load(pdf1);
        const d2 = await PDFDocument.load(pdf2);

        const p1 = await merged.copyPages(d1, [0]);
        const p2 = await merged.copyPages(d2, [0]);
        merged.addPage(p1[0]);
        merged.addPage(p2[0]);

        merged.setTitle('Confidential Document');
        const outputBytes = await merged.save();

        expect(outputBytes.byteLength).toBeGreaterThan(0);
        await PdfVerifier.verifyPageCount(outputBytes, 2);
      });
    });
  });

  // =========================================================================
  // 3. MEMORY STABILITY
  // =========================================================================
  describe('Memory Allocation & Garbage Collection Stability', () => {
    it('should execute repeated PDF creation and manipulation cycles with stable memory footprint', async () => {
      const { heapDeltaMB } = await PdfVerifier.measureMemoryDelta(async () => {
        for (let cycle = 0; cycle < 10; cycle++) {
          const doc = await PDFDocument.create();
          for (let p = 0; p < 5; p++) {
            const page = doc.addPage([595.28, 841.89]);
            page.drawRectangle({
              x: 50,
              y: 50,
              width: 200,
              height: 200,
              color: rgb(0.1, 0.5, 0.9),
            });
          }
          const bytes = await doc.save();
          expect(bytes.byteLength).toBeGreaterThan(0);
        }
      });

      // Assert that heap growth during 10 cycles is bounded (well under 150 MB)
      expect(heapDeltaMB).toBeLessThan(150);
    });
  });
});
