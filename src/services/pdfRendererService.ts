import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';

// Vite worker URL import
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Initialize PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl || '/pdf.worker.min.mjs';
}

export interface RenderPageResult {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  pageNumber: number;
}

export interface RenderPageOptions {
  scale?: number;
  dpi?: number;
  rotation?: number; // 0, 90, 180, 270
  targetCanvas?: HTMLCanvasElement;
  backgroundColor?: string;
}

export interface ExtractedTextItem {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontName: string;
}

export interface PageTextContent {
  fullText: string;
  items: ExtractedTextItem[];
}

export class PdfRendererService {
  /**
   * Loads a PDF document from raw ArrayBuffer or Uint8Array.
   */
  public async loadDocument(
    data: ArrayBuffer | Uint8Array,
    password?: string
  ): Promise<PDFDocumentProxy> {
    // Clone buffer slice so the original ArrayBuffer is NEVER detached by Web Worker!
    const rawBuffer = data instanceof Uint8Array ? data.buffer : data;
    const clonedData = new Uint8Array(rawBuffer.slice(0));

    const loadingTask = pdfjsLib.getDocument({
      data: clonedData,
      password: password || undefined,
      cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.5.136/cmaps/',
      cMapPacked: true,
      standardFontDataUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.5.136/standard_fonts/',
    });

    return await loadingTask.promise;
  }

  /**
   * Retrieves total page count of loaded document.
   */
  public getPageCount(doc: PDFDocumentProxy): number {
    return doc.numPages;
  }

  /**
   * Renders a specific page to an HTMLCanvasElement with high-DPI scaling.
   */
  public async renderPageToCanvas(
    doc: PDFDocumentProxy,
    pageNumber: number,
    options: RenderPageOptions = {}
  ): Promise<RenderPageResult> {
    const page: PDFPageProxy = await doc.getPage(pageNumber);
    // Combine intrinsic PDF page rotation with any additional user rotation
    const rotation = (page.rotate + (options.rotation || 0)) % 360;

    // Scale computation: standard 72 DPI base scale
    const dpiScale = options.dpi ? options.dpi / 72 : 1;
    const baseScale = options.scale ?? 1.0;
    const effectiveScale = baseScale * dpiScale;

    const viewport = page.getViewport({ scale: effectiveScale, rotation });

    const canvas = options.targetCanvas || document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    const ctx = canvas.getContext('2d', { alpha: options.backgroundColor === 'transparent' });
    if (!ctx) {
      throw new Error('Failed to obtain 2D rendering context from canvas');
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Set background fill (default solid white)
    if (options.backgroundColor !== 'transparent') {
      ctx.fillStyle = options.backgroundColor || '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    const renderContext = {
      canvasContext: ctx,
      viewport: viewport,
      intent: 'print' as const, // Print mode renders complete vector details and crisp fonts
    };

    await page.render(renderContext).promise;

    return {
      canvas,
      width: canvas.width,
      height: canvas.height,
      pageNumber,
    };
  }

  /**
   * Generates a high-quality thumbnail Data URL for page preview grids.
   */
  public async renderThumbnail(
    doc: PDFDocumentProxy,
    pageNumber: number,
    maxDimension: number = 300,
    rotation?: number
  ): Promise<string> {
    const page = await doc.getPage(pageNumber);
    const rot = (page.rotate + (rotation || 0)) % 360;
    const unscaledViewport = page.getViewport({ scale: 1.0, rotation: rot });

    const scale = Math.min(
      maxDimension / unscaledViewport.width,
      maxDimension / unscaledViewport.height
    );

    const viewport = page.getViewport({ scale, rotation: rot });
    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return '';

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({ canvasContext: ctx, viewport, intent: 'print' as const }).promise;

    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);

    // Free canvas dimensions immediately
    canvas.width = 0;
    canvas.height = 0;

    return dataUrl;
  }

  /**
   * Renders page to an image Blob (PNG or JPEG) at specified DPI.
   */
  public async renderPageToImageBlob(
    doc: PDFDocumentProxy,
    pageNumber: number,
    options: { dpi?: number; format?: 'png' | 'jpeg'; quality?: number; rotation?: number; backgroundColor?: string } = {}
  ): Promise<Blob> {
    const dpi = options.dpi || 150;
    const format = options.format || 'png';
    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
    const quality = options.quality ?? 0.95;

    const result = await this.renderPageToCanvas(doc, pageNumber, {
      dpi,
      scale: 1.0,
      rotation: options.rotation,
      backgroundColor: options.backgroundColor || '#FFFFFF',
    });

    return new Promise<Blob>((resolve, reject) => {
      result.canvas.toBlob(
        (blob) => {
          result.canvas.width = 0;
          result.canvas.height = 0;
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert rendered canvas to Blob'));
          }
        },
        mimeType,
        quality
      );
    });
  }

  /**
   * Extracts text content from a page with vector coordinates.
   */
  public async extractTextFromPage(
    doc: PDFDocumentProxy,
    pageNumber: number
  ): Promise<PageTextContent> {
    const page = await doc.getPage(pageNumber);
    const textContent = await page.getTextContent();

    const items: ExtractedTextItem[] = [];
    const strings: string[] = [];

    for (const item of textContent.items as any[]) {
      if ('str' in item) {
        strings.push(item.str);
        items.push({
          text: item.str,
          x: item.transform[4],
          y: item.transform[5],
          width: item.width,
          height: item.height,
          fontName: item.fontName,
        });
      }
    }

    return {
      fullText: strings.join(' '),
      items,
    };
  }

  /**
   * Safely destroys the document proxy and releases browser memory.
   */
  public destroyDocument(doc: PDFDocumentProxy): void {
    doc.destroy().catch((err) => console.warn('[PdfRendererService] Error destroying doc:', err));
  }
}

export const pdfRendererService = new PdfRendererService();
