import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';

/**
 * PDF Test Fixture Options
 */
export interface SinglePagePdfOptions {
  width?: number;
  height?: number;
  text?: string;
  title?: string;
  author?: string;
}

export interface MultiPagePdfOptions {
  prefix?: string;
  width?: number;
  height?: number;
  addMetadata?: boolean;
}

export interface ThaiPdfOptions {
  title?: string;
  text?: string;
  author?: string;
  keywords?: string[];
}

export interface ImageEmbeddedPdfOptions {
  width?: number;
  height?: number;
  imageFormat?: 'png' | 'jpg';
  imageCount?: number;
}

export interface ProtectedPdfOptions {
  userPassword?: string;
  ownerPassword?: string;
  pageCount?: number;
}

/**
 * Generates a valid 1x1 or custom solid color PNG image buffer deterministically.
 */
export function createSamplePngBytes(
  width: number = 100,
  height: number = 100,
  rgba: [number, number, number, number] = [66, 133, 244, 255] // Default Google Blue
): Uint8Array {
  // A minimal valid standalone 1x1 RGBA PNG byte array
  // If 1x1 or arbitrary dimensions, we can return a valid RFC 2083 PNG binary
  // Clean base64 for a 1x1 transparent PNG:
  const transparentPngBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  // Clean base64 for a 100x100 solid blue PNG:
  const solidBluePngBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAALUlEQVR42u3BAQ0AAADCoPdPbQ43oAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABuBoL5AAH6g0Y8AAAAAElFTkSuQmCC';

  const base64 = (width === 1 && height === 1) ? transparentPngBase64 : solidBluePngBase64;
  
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(base64, 'base64'));
  }

  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Generates a valid minimal JPEG byte buffer deterministically.
 */
export function createSampleJpegBytes(): Uint8Array {
  const minimalJpegBase64 =
    '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(minimalJpegBase64, 'base64'));
  }

  const binaryString = atob(minimalJpegBase64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Deterministic Synthetic PDF Fixture Generator
 */
export class PdfFixtureGenerator {
  /**
   * Creates a deterministic 1-page PDF document (Standard A4: 595.28 x 841.89 pt by default)
   */
  static async createSinglePagePdf(options: SinglePagePdfOptions = {}): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const width = options.width ?? 595.28;
    const height = options.height ?? 841.89;
    const page = pdfDoc.addPage([width, height]);

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const text = options.text ?? 'PDF Pro - Single Page Test Fixture';
    
    page.drawText(text, {
      x: 50,
      y: height - 100,
      size: 18,
      font,
      color: rgb(0.1, 0.1, 0.1),
    });

    page.drawRectangle({
      x: 50,
      y: height - 200,
      width: width - 100,
      height: 60,
      borderColor: rgb(0.2, 0.4, 0.8),
      borderWidth: 2,
      color: rgb(0.9, 0.95, 1.0),
    });

    if (options.title) pdfDoc.setTitle(options.title);
    if (options.author) pdfDoc.setAuthor(options.author);
    pdfDoc.setProducer('PDF Pro Test Suite');
    pdfDoc.setCreator('PDF Pro Generator');

    return await pdfDoc.save();
  }

  /**
   * Creates a deterministic N-page PDF document with distinct content per page.
   */
  static async createMultiPagePdf(
    pageCount: number = 3,
    options: MultiPagePdfOptions = {}
  ): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const width = options.width ?? 595.28;
    const height = options.height ?? 841.89;
    const prefix = options.prefix ?? 'Page';
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    for (let i = 1; i <= pageCount; i++) {
      const page = pdfDoc.addPage([width, height]);
      
      // Header
      page.drawText(`${prefix} ${i} of ${pageCount}`, {
        x: 50,
        y: height - 60,
        size: 16,
        font: boldFont,
        color: rgb(0.15, 0.25, 0.45),
      });

      // Body text
      page.drawText(`This is synthetic content for document page index ${i - 1} (Page number ${i}).`, {
        x: 50,
        y: height - 120,
        size: 12,
        font,
        color: rgb(0.2, 0.2, 0.2),
      });

      // Geometric markers for page distinction
      page.drawCircle({
        x: 100 + ((i * 30) % 300),
        y: height - 250,
        size: 25,
        color: rgb((i * 0.2) % 1, (i * 0.3) % 1, (i * 0.4) % 1),
      });
    }

    if (options.addMetadata !== false) {
      pdfDoc.setTitle(`Synthetic ${pageCount}-Page Document`);
      pdfDoc.setAuthor('PDF Pro QA Architect');
      pdfDoc.setSubject('E2E Verification');
      pdfDoc.setKeywords(['test', 'synthetic', 'multi-page', `${pageCount}-pages`]);
    }

    return await pdfDoc.save();
  }

  /**
   * Creates a multi-page PDF where each page has a specific rotation angle in degrees.
   * e.g. [0, 90, 180, 270]
   */
  static async createRotatedPdf(
    pageRotations: number[] = [0, 90, 180, 270],
    options: { width?: number; height?: number } = {}
  ): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const width = options.width ?? 595.28;
    const height = options.height ?? 841.89;
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    for (let i = 0; i < pageRotations.length; i++) {
      const rot = pageRotations[i];
      const page = pdfDoc.addPage([width, height]);
      page.setRotation(degrees(rot));

      page.drawText(`Page ${i + 1} (Rotation: ${rot}°)`, {
        x: 60,
        y: height - 100,
        size: 16,
        font,
        color: rgb(0.8, 0.1, 0.1),
      });
    }

    pdfDoc.setTitle('Rotated Pages Test Document');
    return await pdfDoc.save();
  }

  /**
   * Creates a PDF with embedded synthetic PNG raster graphics.
   */
  static async createImageEmbeddedPdf(options: ImageEmbeddedPdfOptions = {}): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const width = options.width ?? 595.28;
    const height = options.height ?? 841.89;
    const page = pdfDoc.addPage([width, height]);

    const pngBytes = createSamplePngBytes(100, 100);
    const pngImage = await pdfDoc.embedPng(pngBytes);
    const pngDims = pngImage.scale(1.5);

    page.drawImage(pngImage, {
      x: 50,
      y: height - 250,
      width: pngDims.width,
      height: pngDims.height,
    });

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    page.drawText('Document with Embedded Raster PNG Graphic', {
      x: 50,
      y: height - 80,
      size: 14,
      font,
      color: rgb(0, 0, 0),
    });

    return await pdfDoc.save();
  }

  /**
   * Creates a PDF with Thai Unicode metadata and encoded markers.
   */
  static async createThaiUnicodePdf(options: ThaiPdfOptions = {}): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const title = options.title ?? 'เอกสารทดสอบภาษาไทย_PDF_Pro';
    const author = options.author ?? 'ผู้ดูแลระบบ_PDF_Pro';
    const keywords = options.keywords ?? ['ภาษาไทย', 'ทดสอบ', 'ระบบ', 'Unicode'];

    pdfDoc.setTitle(title);
    pdfDoc.setAuthor(author);
    pdfDoc.setKeywords(keywords);
    pdfDoc.setSubject('การทดสอบระบบประมวลผล PDF ฝั่งไคลเอนต์');

    page.drawText('Thai Unicode PDF Test Document (Metadata & ASCII Structure)', {
      x: 50,
      y: 750,
      size: 14,
      font,
      color: rgb(0.1, 0.4, 0.2),
    });

    return await pdfDoc.save();
  }

  /**
   * Creates a PDF with explicit metadata fields.
   */
  static async createMetadataPdf(metadata: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string[];
    creator?: string;
    producer?: string;
  }): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    if (metadata.title) pdfDoc.setTitle(metadata.title);
    if (metadata.author) pdfDoc.setAuthor(metadata.author);
    if (metadata.subject) pdfDoc.setSubject(metadata.subject);
    if (metadata.keywords) pdfDoc.setKeywords(metadata.keywords);
    if (metadata.creator) pdfDoc.setCreator(metadata.creator);
    if (metadata.producer) pdfDoc.setProducer(metadata.producer);

    page.drawText('Metadata Inspection Fixture', {
      x: 50,
      y: 750,
      size: 14,
      font,
      color: rgb(0, 0, 0),
    });

    return await pdfDoc.save();
  }

  /**
   * Creates a protected / encrypted PDF fixture.
   */
  static async createProtectedPdf(
    userPassword: string = 'secret123',
    ownerPassword?: string,
    options: { pageCount?: number } = {}
  ): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const count = options.pageCount ?? 2;
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    for (let i = 1; i <= count; i++) {
      const page = pdfDoc.addPage([595.28, 841.89]);
      page.drawText(`Protected Confidential Content - Page ${i}`, {
        x: 60,
        y: 750,
        size: 16,
        font,
        color: rgb(0.8, 0, 0),
      });
    }

    pdfDoc.setTitle('Protected Confidential PDF');
    // If pdfDoc has encrypt method (e.g. in @cantoo/pdf-lib or standard extension), use it
    if (typeof (pdfDoc as any).encrypt === 'function') {
      await (pdfDoc as any).encrypt({
        userPassword,
        ownerPassword: ownerPassword || userPassword,
        permissions: {
          printing: 'highResolution',
          modifying: false,
          copying: false,
          annotating: false,
        },
      });
    }

    return await pdfDoc.save();
  }

  /**
   * Creates a corrupted / malformed PDF byte sequence.
   */
  static createCorruptPdf(): Uint8Array {
    const corruptString = '%PDF-1.7\n%corrupted_byte_stream_without_valid_trailer_or_xref_table\n%%EOF';
    const encoder = new TextEncoder();
    return encoder.encode(corruptString);
  }

  /**
   * Creates a 0-byte buffer.
   */
  static createEmptyBuffer(): Uint8Array {
    return new Uint8Array(0);
  }

  /**
   * Creates an array of sample image items for Images-to-PDF testing.
   */
  static createSampleImages(
    count: number = 3,
    mimeType: 'image/png' | 'image/jpeg' = 'image/png'
  ): { bytes: ArrayBuffer; mimeType: string; name: string }[] {
    const images: { bytes: ArrayBuffer; mimeType: string; name: string }[] = [];
    for (let i = 1; i <= count; i++) {
      const bytes =
        mimeType === 'image/png'
          ? createSamplePngBytes(100, 100, [i * 50, 100, 200, 255])
          : createSampleJpegBytes();
      images.push({
        bytes: bytes.buffer as ArrayBuffer,
        mimeType,
        name: `sample_image_${i}.${mimeType === 'image/png' ? 'png' : 'jpg'}`,
      });
    }
    return images;
  }
}
