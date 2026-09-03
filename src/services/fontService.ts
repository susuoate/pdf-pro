import { PDFDocument, PDFFont, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

export type ThaiFontName = 'Sarabun-Regular' | 'Sarabun-Bold' | 'Prompt-Regular';
export type StandardFontName = 'Helvetica' | 'Helvetica-Bold' | 'Times-Roman' | 'Courier';

export interface FontOption {
  id: string;
  name: string;
  nameTh: string;
  isThaiSupported: boolean;
}

export class FontService {
  private fontBytesCache: Map<string, ArrayBuffer> = new Map();
  private fontKitRegisteredDocs: WeakSet<PDFDocument> = new WeakSet();

  public readonly availableFonts: FontOption[] = [
    { id: 'Sarabun-Regular', name: 'Sarabun (Regular)', nameTh: 'สารบรรณ (ปกติ)', isThaiSupported: true },
    { id: 'Sarabun-Bold', name: 'Sarabun (Bold)', nameTh: 'สารบรรณ (หนา)', isThaiSupported: true },
    { id: 'Prompt-Regular', name: 'Prompt (Regular)', nameTh: 'พร้อมท์ (ปกติ)', isThaiSupported: true },
    { id: 'Helvetica', name: 'Helvetica (English only)', nameTh: 'เฮลเวติกา (เฉพาะอังกฤษ)', isThaiSupported: false },
    { id: 'Times-Roman', name: 'Times Roman (English only)', nameTh: 'ไทมส์ โรมัน (เฉพาะอังกฤษ)', isThaiSupported: false },
  ];

  /**
   * Registers fontkit onto a PDFDocument instance if not already registered.
   */
  public registerFontkit(pdfDoc: PDFDocument): void {
    if (!this.fontKitRegisteredDocs.has(pdfDoc)) {
      pdfDoc.registerFontkit(fontkit);
      this.fontKitRegisteredDocs.add(pdfDoc);
    }
  }

  /**
   * Fetches and caches font file bytes as ArrayBuffer.
   */
  public async getFontBytes(fontName: string): Promise<ArrayBuffer> {
    if (this.fontBytesCache.has(fontName)) {
      return this.fontBytesCache.get(fontName)!;
    }

    const fontPath = `/fonts/${fontName}.ttf`;
    try {
      const response = await fetch(fontPath);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} loading font from ${fontPath}`);
      }
      const buffer = await response.arrayBuffer();
      this.fontBytesCache.set(fontName, buffer);
      return buffer;
    } catch (err) {
      console.warn(`[FontService] Failed to load font ${fontName}, using fallback`, err);
      // Fallback placeholder buffer
      const fallback = new Uint8Array([0, 1, 0, 0]).buffer;
      this.fontBytesCache.set(fontName, fallback);
      return fallback;
    }
  }

  /**
   * Embeds a Unicode Thai TrueType font into a PDFDocument with subsetting enabled.
   */
  public async embedThaiFont(
    pdfDoc: PDFDocument,
    fontName: ThaiFontName = 'Sarabun-Regular',
    options: { subset?: boolean } = { subset: true }
  ): Promise<PDFFont> {
    try {
      this.registerFontkit(pdfDoc);
      const bytes = await this.getFontBytes(fontName);
      return await pdfDoc.embedFont(bytes, { subset: options.subset ?? true });
    } catch (err) {
      console.warn(`[FontService] Failed embedding Thai font "${fontName}", falling back to Standard Helvetica:`, err);
      return await pdfDoc.embedFont(StandardFonts.Helvetica);
    }
  }

  /**
   * Embeds a Standard 14 PDF Font (English/WinAnsi only).
   */
  public async embedStandardFont(
    pdfDoc: PDFDocument,
    fontName: StandardFonts = StandardFonts.Helvetica
  ): Promise<PDFFont> {
    return await pdfDoc.embedFont(fontName);
  }

  /**
   * Helper that embeds a Thai font if text contains non-ASCII/Thai characters,
   * or a standard font otherwise.
   */
  public async embedAutoFont(
    pdfDoc: PDFDocument,
    text: string,
    preferredThaiFont: ThaiFontName = 'Sarabun-Regular'
  ): Promise<PDFFont> {
    const hasThaiOrUnicode = /[\u0E00-\u0E7F\u0100-\uFFFF]/.test(text);
    if (hasThaiOrUnicode) {
      return await this.embedThaiFont(pdfDoc, preferredThaiFont);
    }
    return await this.embedStandardFont(pdfDoc, StandardFonts.Helvetica);
  }

  /**
   * Measures text width given a font and size.
   */
  public measureTextWidth(text: string, font: PDFFont, fontSize: number): number {
    return font.widthOfTextAtSize(text, fontSize);
  }

  /**
   * Clears the in-memory font cache.
   */
  public clearCache(): void {
    this.fontBytesCache.clear();
  }
}

export const fontService = new FontService();
