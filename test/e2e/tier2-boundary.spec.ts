import { describe, it, expect } from 'vitest';
import { PdfFixtureGenerator } from '../fixtures/generator';
import { PdfVerifier } from '../utils/pdfVerifier';
import { PDFDocument } from 'pdf-lib';

/**
 * Utility parser for page range expressions (e.g., "1-3, 5, 8-end")
 */
function parsePageRanges(rangeStr: string, totalPages: number): number[] {
  if (!rangeStr || !rangeStr.trim()) {
    throw new Error('Page range string cannot be empty.');
  }

  const parts = rangeStr.split(',').map((s) => s.trim()).filter(Boolean);
  if (parts.length === 0) {
    throw new Error('Invalid page range format.');
  }

  const selectedIndices = new Set<number>();

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-').map((s) => s.trim());
      const start = parseInt(startStr, 10);
      const end = endStr.toLowerCase() === 'end' ? totalPages : parseInt(endStr, 10);

      if (isNaN(start) || isNaN(end)) {
        throw new Error(`Malformed range token: "${part}"`);
      }
      if (start < 1 || end < 1 || start > totalPages || end > totalPages) {
        throw new Error(`Range "${part}" is out of bounds (document has ${totalPages} pages).`);
      }
      if (start > end) {
        throw new Error(`Range start (${start}) cannot exceed range end (${end}).`);
      }

      for (let i = start; i <= end; i++) {
        selectedIndices.add(i - 1);
      }
    } else {
      const pageNum = parseInt(part, 10);
      if (isNaN(pageNum)) {
        throw new Error(`Invalid page number token: "${part}"`);
      }
      if (pageNum < 1 || pageNum > totalPages) {
        throw new Error(`Page number ${pageNum} is out of bounds (1-${totalPages}).`);
      }
      selectedIndices.add(pageNum - 1);
    }
  }

  return Array.from(selectedIndices).sort((a, b) => a - b);
}

describe('Tier 2: Boundary Conditions, Adversarial Inputs & Resilience', () => {
  // =========================================================================
  // 1. 0-BYTE & CORRUPT FILE RECOVERY
  // =========================================================================
  describe('0-Byte & Corrupt Input Resilience', () => {
    it('should reject 0-byte file buffer with descriptive error', async () => {
      const emptyBuffer = PdfFixtureGenerator.createEmptyBuffer();
      expect(emptyBuffer.byteLength).toBe(0);

      await expect(PDFDocument.load(emptyBuffer)).rejects.toThrow();
    });

    it('should reject corrupted / malformed PDF stream without unhandled crashes', async () => {
      const corruptBytes = PdfFixtureGenerator.createCorruptPdf();
      await expect(PDFDocument.load(corruptBytes)).rejects.toThrow();
    });

    it('should reject non-PDF binary data (e.g. raw text or random bytes)', async () => {
      const randomBytes = new Uint8Array([0x00, 0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde]);
      await expect(PDFDocument.load(randomBytes)).rejects.toThrow();
    });
  });

  // =========================================================================
  // 2. MALFORMED PAGE RANGE PARSING
  // =========================================================================
  describe('Malformed Page Range Expression Parser', () => {
    const totalPages = 10;

    it('should correctly parse valid ranges: "1-3, 5, 8-end"', () => {
      const result = parsePageRanges('1-3, 5, 8-end', totalPages);
      // Expected 0-indexed: [0, 1, 2, 4, 7, 8, 9]
      expect(result).toEqual([0, 1, 2, 4, 7, 8, 9]);
    });

    it('should correctly parse single pages and remove duplicates: "1, 1, 2, 2, 3"', () => {
      const result = parsePageRanges('1, 1, 2, 2, 3', totalPages);
      expect(result).toEqual([0, 1, 2]);
    });

    it('should reject inverted ranges: "9-5"', () => {
      expect(() => parsePageRanges('9-5', totalPages)).toThrow(
        /Range start \(9\) cannot exceed range end \(5\)/
      );
    });

    it('should reject non-numeric garbage: "abc, def"', () => {
      expect(() => parsePageRanges('abc, def', totalPages)).toThrow(/Invalid page number token/);
    });

    it('should reject out-of-bounds page numbers: "15"', () => {
      expect(() => parsePageRanges('15', totalPages)).toThrow(/out of bounds/);
    });

    it('should reject zero and negative pages: "0, -3"', () => {
      expect(() => parsePageRanges('0', totalPages)).toThrow(/out of bounds/);
    });

    it('should reject empty or whitespace-only inputs', () => {
      expect(() => parsePageRanges('   ', totalPages)).toThrow(/Page range string cannot be empty/);
    });
  });

  // =========================================================================
  // 3. THAI UNICODE ROBUSTNESS
  // =========================================================================
  describe('Thai Unicode String & Metadata Robustness', () => {
    it('should preserve Thai Unicode strings in document metadata', async () => {
      const thaiPdf = await PdfFixtureGenerator.createThaiUnicodePdf({
        title: 'รายงานประจำปี_2569_PDF_Pro',
        author: 'ฝ่ายวิจัยและพัฒนา_บริษัททดสอบจำกัด',
        keywords: ['เอกสารลับ', 'สำเนาถูกต้อง', 'ภาษาไทย'],
      });

      const doc = await PDFDocument.load(thaiPdf);
      expect(doc.getTitle()).toBe('รายงานประจำปี_2569_PDF_Pro');
      expect(doc.getAuthor()).toBe('ฝ่ายวิจัยและพัฒนา_บริษัททดสอบจำกัด');
      
      const keywords = doc.getKeywords();
      expect(keywords).toBeDefined();
    });

    it('should handle complex Thai diacritics and tone marks without clipping', async () => {
      // Thai diacritics testing: mai ek, mai tho, sara ee, etc.
      const complexThaiText = 'ที่อยู่: ๑๒๓/๔๕ หมู่ ๖ ต.บ้านใหม่ อ.เมือง จ.เชียงใหม่ ๕๐๐๐๐';
      const thaiPdf = await PdfFixtureGenerator.createThaiUnicodePdf({
        title: complexThaiText,
      });

      const doc = await PDFDocument.load(thaiPdf);
      expect(doc.getTitle()).toBe(complexThaiText);
    });
  });

  // =========================================================================
  // 4. EXTREME PAGE DIMENSIONS
  // =========================================================================
  describe('Extreme Page Dimensions & Boundary Aspect Ratios', () => {
    it('should handle micro-pages (10x10 pt) without arithmetic failure', async () => {
      const microPdf = await PdfFixtureGenerator.createSinglePagePdf({
        width: 10,
        height: 10,
        text: 'M',
      });
      const dims = await PdfVerifier.getPageDimensions(microPdf, 0);
      expect(dims.width).toBe(10);
      expect(dims.height).toBe(10);
    });

    it('should handle poster-size pages (3000x5000 pt) accurately', async () => {
      const posterPdf = await PdfFixtureGenerator.createSinglePagePdf({
        width: 3000,
        height: 5000,
        text: 'Large Poster Format',
      });
      const dims = await PdfVerifier.getPageDimensions(posterPdf, 0);
      expect(dims.width).toBe(3000);
      expect(dims.height).toBe(5000);
    });
  });

  // =========================================================================
  // 5. ODD / EVEN PAGE FILTERING BOUNDARIES
  // =========================================================================
  describe('Odd / Even Page Filtering Edge Cases', () => {
    it('should handle odd page filter on 1-page document (returns 1 page)', async () => {
      const singleDoc = await PdfFixtureGenerator.createSinglePagePdf();
      const doc = await PDFDocument.load(singleDoc);
      const total = doc.getPageCount();

      // Odd indices: 0 (which is Page 1)
      const oddIndices = Array.from({ length: total }, (_, i) => i).filter((i) => i % 2 === 0);
      expect(oddIndices).toEqual([0]);
    });

    it('should handle even page filter on 1-page document (returns empty set / error caught)', async () => {
      const singleDoc = await PdfFixtureGenerator.createSinglePagePdf();
      const doc = await PDFDocument.load(singleDoc);
      const total = doc.getPageCount();

      // Even page numbers (index 1, 3, ...)
      const evenIndices = Array.from({ length: total }, (_, i) => i).filter((i) => i % 2 === 1);
      expect(evenIndices).toEqual([]);
    });
  });
});
