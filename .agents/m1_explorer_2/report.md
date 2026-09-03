# Milestone 1 Explorer 2 Design Report: Core Engine Services & Types Layer

**Project:** PDF Pro (Client-Side First PDF Management Suite)  
**Agent:** Milestone 1 Explorer 2 (`.agents/m1_explorer_2`)  
**Scope:** Core Engine Services & Types Layer  
**Date:** 2026-08-25  
**Version:** 1.0.0  

---

## 1. Executive Summary & Design Principles

This report provides the formal architectural specification, complete TypeScript type contracts, and production-grade implementation blueprints for the **Core Engine Services & Types Layer** of PDF Pro.

### 1.1 Core Architectural Principles
1. **Zero UI Coupling:** Every service module in `src/services/` and utility in `src/utils/` is strictly decoupled from React presentation components and DOM rendering (except HTML5 2D Canvas context rendering where required). They can be run in Web Workers, Node/Vitest test suites, or standard browser environments.
2. **Zero-Server-Upload Privacy:** All byte manipulations, cryptographic operations, font embedding, and image decodes are conducted in client-side memory (`ArrayBuffer`, `Uint8Array`, `Blob`, `OffscreenCanvas`).
3. **Memory Safety & Resource Lifecycle:** Explicit cleanup mechanisms (`canvas.width = 0`, `URL.revokeObjectURL`, `PDFDocumentProxy.destroy()`) are built into all service interfaces to prevent memory leaks during heavy multi-page processing.
4. **Bilingual & Thai Unicode Resilience:** First-class font embedding via `@pdf-lib/fontkit` ensures all Thai script glyphs, diacritics, and tone marks render without truncation or WinAnsi character encoding errors.
5. **Coordinate Space Precision:** Bidirectional transformation between Screen Viewport (top-left origin), Canvas (pixel density scaling), and PDF Points (bottom-left origin, 72 pt/in) with full support for 0°, 90°, 180°, and 270° page rotations.

---

## 2. Type System Architecture (`src/types/`)

The types layer provides strict, compile-time type safety across document manipulation, annotations, tool registry, and bilingual localization.

### 2.1 PDF Document & Manipulation Types (`src/types/pdf.ts`)

```typescript
// src/types/pdf.ts

/**
 * Standard PDF Page Sizes in PostScript Points (72 points = 1 inch)
 */
export const PDF_PAGE_SIZES = {
  A4: { width: 595.28, height: 841.89 },
  A3: { width: 841.89, height: 1190.55 },
  A5: { width: 419.53, height: 595.28 },
  LETTER: { width: 612.0, height: 792.0 },
  LEGAL: { width: 612.0, height: 1008.0 },
  TABLOID: { width: 792.0, height: 1224.0 },
} as const;

export type StandardPageSizeKey = keyof typeof PDF_PAGE_SIZES;

export interface PageDimensions {
  width: number;
  height: number;
  rotation: number; // 0, 90, 180, 270
}

export interface PDFFileInfo {
  id: string;
  file: File;
  name: string;
  size: number;
  pageCount: number;
  dimensions: PageDimensions[];
  bytes?: ArrayBuffer;
  isEncrypted?: boolean;
  thumbnailUrls?: string[];
}

export interface PDFPageInfo {
  pageIndex: number; // 0-indexed
  pageNumber: number; // 1-indexed
  width: number;
  height: number;
  rotation: number; // 0, 90, 180, 270
  thumbnailUrl?: string;
  isDeleted?: boolean;
  customRotation?: number;
}

export interface MetadataFields {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
}

export interface MergeFileItem {
  id: string;
  name: string;
  bytes: ArrayBuffer;
  selectedPages?: number[]; // 0-indexed page indices
  rotations?: Record<number, number>; // pageIndex -> rotation angle
}

export interface SplitOptions {
  mode: 'ranges' | 'extract-all' | 'interval';
  ranges?: string; // e.g. "1-3, 5, 8-10"
  interval?: number; // e.g. every 2 pages
}

export interface SplitResult {
  name: string;
  bytes: Uint8Array;
  pageCount: number;
  pageRangeStr: string;
}

export interface PageOrganizeItem {
  originalIndex: number;
  rotation: number; // 0, 90, 180, 270
  isDeleted: boolean;
}

export interface RotateOptions {
  globalAngle: number; // +90, -90, 180, 270
  overrides?: Record<number, number>; // pageIndex -> rotation angle
}

export interface ExtractOptions {
  pageIndices: number[]; // 0-indexed
  mode: 'merge-single' | 'separate-files';
}

export interface ImageToPdfOptions {
  pageSize: 'A4' | 'Letter' | 'Legal' | 'Fit';
  orientation: 'auto' | 'portrait' | 'landscape';
  margin: 'none' | 'small' | 'big'; // 0, 20, 40 pt
  imageFit: 'contain' | 'fill' | 'center-original';
}

export interface CompressOptions {
  level: 'extreme' | 'recommended' | 'low';
  dpi?: number;
  quality?: number; // 0.1 to 1.0
}

export interface CompressionResult {
  originalSizeBytes: number;
  compressedSizeBytes: number;
  reductionPercentage: number;
  bytes: Uint8Array;
}

export interface WatermarkOptions {
  type: 'text' | 'image';
  text?: string;
  imageBytes?: ArrayBuffer;
  imageMime?: 'image/png' | 'image/jpeg';
  fontName?: 'Sarabun-Regular' | 'Sarabun-Bold' | 'Prompt-Regular' | 'Helvetica' | 'TimesRoman';
  fontSize?: number;
  fontColor?: string; // Hex e.g. "#FF0000"
  opacity?: number; // 0.0 to 1.0
  rotation?: number; // degrees e.g. 45
  positionMode: 'grid' | 'mosaic' | 'custom';
  gridAnchor?:
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'middle-left'
    | 'center'
    | 'middle-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right';
  offsetX?: number;
  offsetY?: number;
  pageRange?: string; // "all", "odd", "even", "1-5"
  layer?: 'over' | 'under';
}

export interface PageNumberOptions {
  template: string; // e.g. "Page {n} of {total}" or "หน้า {n} จาก {total}"
  position:
    | 'header-left'
    | 'header-center'
    | 'header-right'
    | 'footer-left'
    | 'footer-center'
    | 'footer-right';
  fontName?: 'Sarabun-Regular' | 'Sarabun-Bold' | 'Prompt-Regular' | 'Helvetica' | 'TimesRoman';
  fontSize?: number;
  fontColor?: string; // Hex e.g. "#000000"
  margin?: number; // points from edge (default: 30)
  startPageNumber?: number; // First numbered index (default 1)
  startFromDocPage?: number; // 1-indexed doc page to begin numbering (default 1)
  excludeFirstPage?: boolean;
  pageRange?: string; // e.g. "2-end"
}

export interface ProtectOptions {
  userPassword?: string;
  ownerPassword?: string;
  permissions?: {
    printing?: boolean;
    modifying?: boolean;
    copying?: boolean;
    annotating?: boolean;
  };
}

export interface UnlockOptions {
  password?: string;
}

export interface ProcessingProgress {
  status: string;
  percent: number; // 0 to 100
  currentStep?: number;
  totalSteps?: number;
}
```

---

### 2.2 Tool Registry & Workspace Types (`src/types/tool.ts`)

```typescript
// src/types/tool.ts

export type ToolCategory = 'organize' | 'convert' | 'edit' | 'security';

export type ToolId =
  | 'merge'
  | 'split'
  | 'organize'
  | 'rotate'
  | 'extract'
  | 'img2pdf'
  | 'pdf2img'
  | 'compress'
  | 'ocr'
  | 'editor'
  | 'watermark'
  | 'pageNumbers'
  | 'sign'
  | 'protect'
  | 'unlock'
  | 'redact'
  | 'metadata';

export interface ToolMeta {
  id: ToolId;
  titleKey: string;
  descriptionKey: string;
  iconName: string;
  category: ToolCategory;
  badge?: 'popular' | 'new' | 'privacy';
  path: string;
  acceptedMimeTypes: string[];
  maxFiles: number;
  minFiles: number;
  allowsMultiFile: boolean;
  requiresPasswordSupport?: boolean;
}

export type WorkspacePhase = 'upload' | 'configure' | 'processing' | 'result';

export interface ToolExecutionResult {
  success: boolean;
  outputBlob?: Blob;
  outputFilename: string;
  originalSizeBytes?: number;
  outputSizeBytes?: number;
  zipEntries?: Array<{ name: string; blob: Blob }>;
  error?: string;
}
```

---

### 2.3 Annotation & Canvas Geometry Types (`src/types/annotation.ts`)

```typescript
// src/types/annotation.ts

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Rect extends Point, Size {}

export interface PDFBox {
  x: number; // PostScript point X (bottom-left origin)
  y: number; // PostScript point Y (bottom-left origin)
  width: number; // PostScript point width
  height: number; // PostScript point height
}

export type AnnotationToolType =
  | 'select'
  | 'draw'
  | 'highlighter'
  | 'text'
  | 'rect'
  | 'circle'
  | 'line'
  | 'arrow'
  | 'image'
  | 'stamp'
  | 'signature'
  | 'redact';

export interface BaseAnnotation {
  id: string;
  pageIndex: number;
  toolType: AnnotationToolType;
  screenBounds: Rect; // Position & size on screen viewport
  pdfBounds: PDFBox; // Translated PostScript coordinates
  opacity: number; // 0.0 to 1.0
  rotation: number; // 0 to 360 degrees
  isLocked?: boolean;
}

export interface DrawingAnnotation extends BaseAnnotation {
  toolType: 'draw' | 'highlighter';
  points: Point[]; // Screen coordinate points
  strokeColor: string; // Hex color
  strokeWidth: number; // Pixels
  isHighlighter: boolean;
}

export interface TextAnnotation extends BaseAnnotation {
  toolType: 'text';
  text: string;
  fontFamily: 'Sarabun-Regular' | 'Sarabun-Bold' | 'Prompt-Regular' | 'Helvetica' | 'TimesRoman';
  fontSize: number; // PostScript points
  fontColor: string;
  isBold: boolean;
  isItalic: boolean;
  textAlign: 'left' | 'center' | 'right';
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  padding?: number;
}

export interface ShapeAnnotation extends BaseAnnotation {
  toolType: 'rect' | 'circle' | 'line' | 'arrow';
  shapeType: 'rect' | 'circle' | 'line' | 'arrow';
  strokeColor: string;
  strokeWidth: number;
  fillColor?: string; // undefined or transparent
  startPoint: Point;
  endPoint: Point;
  lineDash?: number[];
}

export interface ImageAnnotation extends BaseAnnotation {
  toolType: 'image' | 'stamp';
  dataUrl: string;
  imageBytes?: ArrayBuffer;
  mimeType: 'image/png' | 'image/jpeg';
  naturalWidth: number;
  naturalHeight: number;
  label?: string;
}

export interface SignatureAnnotation extends BaseAnnotation {
  toolType: 'signature';
  signatureType: 'draw' | 'type' | 'upload';
  dataUrl: string; // PNG transparent data URL
  signerName?: string;
  dateStr?: string;
}

export interface RedactionAnnotation extends BaseAnnotation {
  toolType: 'redact';
  reason?: string;
  overlayText?: string;
}

export type AnnotationItem =
  | DrawingAnnotation
  | TextAnnotation
  | ShapeAnnotation
  | ImageAnnotation
  | SignatureAnnotation
  | RedactionAnnotation;
```

---

### 2.4 Localization Types (`src/types/i18n.ts`)

```typescript
// src/types/i18n.ts

export type Language = 'en' | 'th';

export interface ToolTranslations {
  title: string;
  description: string;
  action: string;
  shortTitle?: string;
  instructions?: string;
  badge?: string;
}

export interface TranslationSchema {
  common: {
    appName: string;
    tagline: string;
    uploadTitle: string;
    uploadDesc: string;
    dropHere: string;
    browseFiles: string;
    processing: string;
    download: string;
    downloadZip: string;
    cancel: string;
    save: string;
    delete: string;
    rotate: string;
    duplicate: string;
    page: string;
    pages: string;
    of: string;
    all: string;
    selectAll: string;
    deselectAll: string;
    error: string;
    success: string;
    fileSize: string;
    sizeSaved: string;
    privacyPill: string;
    offlineMode: string;
    loading: string;
    continue: string;
    backToTools: string;
  };
  categories: {
    all: string;
    organize: string;
    convert: string;
    edit: string;
    security: string;
  };
  tools: Record<string, ToolTranslations>;
  editor: {
    selectTool: string;
    penTool: string;
    highlighterTool: string;
    textTool: string;
    shapeTool: string;
    imageTool: string;
    signatureTool: string;
    redactTool: string;
    color: string;
    strokeWidth: string;
    opacity: string;
    fontSize: string;
    fontFamily: string;
    align: string;
    fill: string;
    outline: string;
    undo: string;
    redo: string;
    clear: string;
  };
  security: {
    userPassword: string;
    ownerPassword: string;
    confirmPassword: string;
    enterPassword: string;
    passwordMismatch: string;
    passwordIncorrect: string;
    redactionWarning: string;
    redactionPermanent: string;
  };
  metadata: {
    title: string;
    author: string;
    subject: string;
    keywords: string;
    creator: string;
    producer: string;
    createdDate: string;
    modifiedDate: string;
    sanitizeAll: string;
    sanitizeConfirm: string;
  };
}
```

---

## 3. Font Service (`src/services/fontService.ts`)

### 3.1 Design & Thai Font Handling Architecture
Standard PDF engines lack built-in Unicode font tables, limiting text output to WinAnsi (ASCII / Western Europe). Passing Thai characters (e.g. `สวัสดี`, `สำเนาถูกต้อง`, `หน้าที่ 1 จาก 10`) throws an uncaught exception in `pdf-lib`.

`fontService` solves this via:
1. Registering `@pdf-lib/fontkit` into target `PDFDocument` instances.
2. In-memory binary caching of TrueType fonts fetched from `/fonts/`:
   - `Sarabun-Regular.ttf` (National standard Thai font)
   - `Sarabun-Bold.ttf` (Heavy weight variant)
   - `Prompt-Regular.ttf` (Modern geometric sans-serif)
3. Fallback to `StandardFonts.Helvetica` for standard English strings if custom font fetching fails.
4. Thai text measurement and line-wrap calculation.

### 3.2 Full Implementation Blueprint

```typescript
// src/services/fontService.ts
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
      console.error(`[FontService] Failed to load font ${fontName}:`, err);
      throw new Error(`Failed to load font "${fontName}". Verify ${fontPath} is in public/fonts/`);
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
    this.registerFontkit(pdfDoc);
    const bytes = await this.getFontBytes(fontName);
    return await pdfDoc.embedFont(bytes, { subset: options.subset ?? true });
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
```

---

## 4. PDF Renderer Service (`src/services/pdfRendererService.ts`)

### 4.1 Architecture & PDF.js Worker Configuration
`pdfRendererService` handles high-fidelity client-side PDF rasterization using `pdfjs-dist`:
- Configures `GlobalWorkerOptions.workerSrc` using Vite's `?url` asset import with fallback to `/pdf.worker.min.mjs`.
- Renders page thumbnails with automatic high-DPI scaling (`window.devicePixelRatio`).
- Provides page-to-image blob conversion at arbitrary DPI (72, 150, 300 DPI) for `PDF to Images` and `Compress PDF`.
- Extracts raw vector text streams for quick search and search index preview.
- Employs strict memory reclamation via `doc.destroy()`.

### 4.2 Full Implementation Blueprint

```typescript
// src/services/pdfRendererService.ts
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
    const loadingTask = pdfjsLib.getDocument({
      data: data instanceof Uint8Array ? data : new Uint8Array(data),
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
    const rotation = options.rotation !== undefined ? options.rotation : page.rotate;
    
    // Scale computation: standard 72 DPI base scale
    const dpiScale = options.dpi ? options.dpi / 72 : 1;
    const baseScale = options.scale ?? 1.5;
    const effectiveScale = baseScale * dpiScale;

    const viewport = page.getViewport({ scale: effectiveScale, rotation });

    const canvas = options.targetCanvas || document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) {
      throw new Error('Failed to obtain 2D rendering context from canvas');
    }

    // Set background fill (default white)
    ctx.fillStyle = options.backgroundColor || '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const renderContext = {
      canvasContext: ctx,
      viewport: viewport,
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
    const rot = rotation !== undefined ? rotation : page.rotate;
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

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({ canvasContext: ctx, viewport }).promise;

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

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
    options: { dpi?: number; format?: 'png' | 'jpeg'; quality?: number; rotation?: number } = {}
  ): Promise<Blob> {
    const dpi = options.dpi || 150;
    const format = options.format || 'png';
    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
    const quality = options.quality ?? 0.92;

    const result = await this.renderPageToCanvas(doc, pageNumber, {
      dpi,
      scale: 1.0,
      rotation: options.rotation,
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
```

---

## 5. Foundational PDF Service (`src/services/pdfService.ts`)

### 5.1 Architecture & Primitives Design
`pdfService` encapsulates all structural PDF document creation, loading, metadata inspection, and page assembly using `pdf-lib` / `@cantoo/pdf-lib`.

### 5.2 Full Implementation Blueprint

```typescript
// src/services/pdfService.ts
import { PDFDocument, degrees, PageSizes, PDFPage } from 'pdf-lib';
import type {
  MergeFileItem,
  SplitOptions,
  SplitResult,
  PageOrganizeItem,
  RotateOptions,
  MetadataFields,
  ProtectOptions,
  ImageToPdfOptions,
} from '../types/pdf';
import { parsePageRange } from '../utils/formatters';

export class PdfService {
  /**
   * Creates a new blank PDFDocument instance.
   */
  public async createDocument(): Promise<PDFDocument> {
    return await PDFDocument.create();
  }

  /**
   * Loads an existing PDF from ArrayBuffer or Uint8Array.
   */
  public async loadDocument(
    data: ArrayBuffer | Uint8Array,
    options?: { ignoreEncryption?: boolean; password?: string }
  ): Promise<PDFDocument> {
    return await PDFDocument.load(data, {
      ignoreEncryption: options?.ignoreEncryption,
      password: options?.password,
    });
  }

  /**
   * Copies pages from source document to destination document.
   */
  public async copyPages(
    srcDoc: PDFDocument,
    destDoc: PDFDocument,
    pageIndices: number[]
  ): Promise<PDFPage[]> {
    const copiedPages = await destDoc.copyPages(srcDoc, pageIndices);
    copiedPages.forEach((page) => destDoc.addPage(page));
    return copiedPages;
  }

  /**
   * Serializes a PDFDocument to Uint8Array.
   */
  public async saveDocument(
    doc: PDFDocument,
    options: { useObjectStreams?: boolean } = { useObjectStreams: true }
  ): Promise<Uint8Array> {
    return await doc.save({ useObjectStreams: options.useObjectStreams });
  }

  /**
   * Merge multiple PDF files into a single unified document.
   */
  public async mergePDFs(files: MergeFileItem[]): Promise<Uint8Array> {
    const mergedDoc = await PDFDocument.create();

    for (const fileItem of files) {
      const srcDoc = await PDFDocument.load(fileItem.bytes);
      const totalPages = srcDoc.getPageCount();
      const pageIndices = fileItem.selectedPages ?? Array.from({ length: totalPages }, (_, i) => i);

      const copiedPages = await mergedDoc.copyPages(srcDoc, pageIndices);

      copiedPages.forEach((page, idx) => {
        const originalPageIndex = pageIndices[idx];
        if (fileItem.rotations && fileItem.rotations[originalPageIndex] !== undefined) {
          const addRot = fileItem.rotations[originalPageIndex];
          const currAngle = page.getRotation().angle;
          page.setRotation(degrees((currAngle + addRot) % 360));
        }
        mergedDoc.addPage(page);
      });
    }

    return await mergedDoc.save({ useObjectStreams: true });
  }

  /**
   * Split a single PDF into multiple documents by ranges, interval, or extract-all.
   */
  public async splitPDF(
    fileBytes: ArrayBuffer,
    options: SplitOptions,
    baseFilename: string = 'document'
  ): Promise<SplitResult[]> {
    const srcDoc = await PDFDocument.load(fileBytes);
    const totalPages = srcDoc.getPageCount();
    const results: SplitResult[] = [];

    if (options.mode === 'extract-all') {
      for (let i = 0; i < totalPages; i++) {
        const singleDoc = await PDFDocument.create();
        const [copiedPage] = await singleDoc.copyPages(srcDoc, [i]);
        singleDoc.addPage(copiedPage);
        const bytes = await singleDoc.save({ useObjectStreams: true });
        results.push({
          name: `${baseFilename}_page_${i + 1}.pdf`,
          bytes,
          pageCount: 1,
          pageRangeStr: `${i + 1}`,
        });
      }
    } else if (options.mode === 'interval') {
      const interval = Math.max(1, options.interval || 1);
      for (let start = 0; start < totalPages; start += interval) {
        const end = Math.min(start + interval - 1, totalPages - 1);
        const rangeIndices: number[] = [];
        for (let j = start; j <= end; j++) rangeIndices.push(j);

        const chunkDoc = await PDFDocument.create();
        const copiedPages = await chunkDoc.copyPages(srcDoc, rangeIndices);
        copiedPages.forEach((p) => chunkDoc.addPage(p));
        const bytes = await chunkDoc.save({ useObjectStreams: true });

        results.push({
          name: `${baseFilename}_pages_${start + 1}-${end + 1}.pdf`,
          bytes,
          pageCount: rangeIndices.length,
          pageRangeStr: `${start + 1}-${end + 1}`,
        });
      }
    } else {
      // Range mode (e.g. "1-3, 5, 8-10")
      const rangeGroups = (options.ranges || `1-${totalPages}`)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      for (let idx = 0; idx < rangeGroups.length; idx++) {
        const groupStr = rangeGroups[idx];
        const pageIndices = parsePageRange(groupStr, totalPages);
        if (pageIndices.length === 0) continue;

        const rangeDoc = await PDFDocument.create();
        const copiedPages = await rangeDoc.copyPages(srcDoc, pageIndices);
        copiedPages.forEach((p) => rangeDoc.addPage(p));
        const bytes = await rangeDoc.save({ useObjectStreams: true });

        results.push({
          name: `${baseFilename}_split_${idx + 1}.pdf`,
          bytes,
          pageCount: pageIndices.length,
          pageRangeStr: groupStr,
        });
      }
    }

    return results;
  }

  /**
   * Organize, reorder, rotate, and delete pages.
   */
  public async organizePDF(
    fileBytes: ArrayBuffer,
    pageItems: PageOrganizeItem[]
  ): Promise<Uint8Array> {
    const srcDoc = await PDFDocument.load(fileBytes);
    const destDoc = await PDFDocument.create();

    const activeItems = pageItems.filter((item) => !item.isDeleted);
    const indicesToCopy = activeItems.map((item) => item.originalIndex);

    const copiedPages = await destDoc.copyPages(srcDoc, indicesToCopy);

    copiedPages.forEach((page, idx) => {
      const item = activeItems[idx];
      if (item.rotation !== 0) {
        const curr = page.getRotation().angle;
        page.setRotation(degrees((curr + item.rotation) % 360));
      }
      destDoc.addPage(page);
    });

    return await destDoc.save({ useObjectStreams: true });
  }

  /**
   * Rotate all or specific pages of a PDF.
   */
  public async rotatePDF(
    fileBytes: ArrayBuffer,
    globalAngle: number,
    overrides?: Record<number, number>
  ): Promise<Uint8Array> {
    const doc = await PDFDocument.load(fileBytes);
    const pages = doc.getPages();

    pages.forEach((page, idx) => {
      const angleToAdd = overrides && overrides[idx] !== undefined ? overrides[idx] : globalAngle;
      const current = page.getRotation().angle;
      page.setRotation(degrees((current + angleToAdd) % 360));
    });

    return await doc.save({ useObjectStreams: true });
  }

  /**
   * Extract selected pages into a standalone PDF or separate files.
   */
  public async extractPages(
    fileBytes: ArrayBuffer,
    pageIndices: number[],
    mergeIntoSingle: boolean = true,
    baseFilename: string = 'extracted'
  ): Promise<Uint8Array | SplitResult[]> {
    const srcDoc = await PDFDocument.load(fileBytes);

    if (mergeIntoSingle) {
      const destDoc = await PDFDocument.create();
      const copiedPages = await destDoc.copyPages(srcDoc, pageIndices);
      copiedPages.forEach((p) => destDoc.addPage(p));
      return await destDoc.save({ useObjectStreams: true });
    } else {
      const results: SplitResult[] = [];
      for (const pageIdx of pageIndices) {
        const singleDoc = await PDFDocument.create();
        const [copiedPage] = await singleDoc.copyPages(srcDoc, [pageIdx]);
        singleDoc.addPage(copiedPage);
        const bytes = await singleDoc.save({ useObjectStreams: true });
        results.push({
          name: `${baseFilename}_page_${pageIdx + 1}.pdf`,
          bytes,
          pageCount: 1,
          pageRangeStr: `${pageIdx + 1}`,
        });
      }
      return results;
    }
  }

  /**
   * Converts a list of image buffers into a structured PDF document.
   */
  public async imagesToPdf(
    images: { bytes: ArrayBuffer; mimeType: string }[],
    options: ImageToPdfOptions
  ): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();

    const marginPt = options.margin === 'big' ? 40 : options.margin === 'small' ? 20 : 0;

    for (const img of images) {
      let embeddedImage;
      if (img.mimeType === 'image/jpeg' || img.mimeType === 'image/jpg') {
        embeddedImage = await pdfDoc.embedJpg(img.bytes);
      } else {
        // PNG or WebP pre-converted to PNG
        embeddedImage = await pdfDoc.embedPng(img.bytes);
      }

      let pageWidth: number;
      let pageHeight: number;

      if (options.pageSize === 'Fit') {
        pageWidth = embeddedImage.width + 2 * marginPt;
        pageHeight = embeddedImage.height + 2 * marginPt;
      } else {
        const stdSize = PageSizes[options.pageSize as 'A4' | 'Letter' | 'Legal'] || PageSizes.A4;
        let [w, h] = stdSize;

        if (options.orientation === 'landscape') {
          pageWidth = Math.max(w, h);
          pageHeight = Math.min(w, h);
        } else if (options.orientation === 'portrait') {
          pageWidth = Math.min(w, h);
          pageHeight = Math.max(w, h);
        } else {
          // Auto orientation matching image aspect ratio
          if (embeddedImage.width > embeddedImage.height) {
            pageWidth = Math.max(w, h);
            pageHeight = Math.min(w, h);
          } else {
            pageWidth = Math.min(w, h);
            pageHeight = Math.max(w, h);
          }
        }
      }

      const availWidth = pageWidth - 2 * marginPt;
      const availHeight = pageHeight - 2 * marginPt;

      let drawWidth: number;
      let drawHeight: number;

      if (options.imageFit === 'fill') {
        drawWidth = availWidth;
        drawHeight = availHeight;
      } else if (options.imageFit === 'center-original') {
        drawWidth = embeddedImage.width;
        drawHeight = embeddedImage.height;
      } else {
        // Contain (preserve aspect ratio)
        const scale = Math.min(availWidth / embeddedImage.width, availHeight / embeddedImage.height);
        drawWidth = embeddedImage.width * scale;
        drawHeight = embeddedImage.height * scale;
      }

      const drawX = marginPt + (availWidth - drawWidth) / 2;
      const drawY = marginPt + (availHeight - drawHeight) / 2;

      const page = pdfDoc.addPage([pageWidth, pageHeight]);
      page.drawImage(embeddedImage, {
        x: drawX,
        y: drawY,
        width: drawWidth,
        height: drawHeight,
      });
    }

    return await pdfDoc.save({ useObjectStreams: true });
  }

  /**
   * Retrieves document metadata dictionary.
   */
  public async getMetadata(fileBytes: ArrayBuffer): Promise<MetadataFields> {
    const doc = await PDFDocument.load(fileBytes);
    return {
      title: doc.getTitle() || '',
      author: doc.getAuthor() || '',
      subject: doc.getSubject() || '',
      keywords: doc.getKeywords() ? doc.getKeywords()!.split(' ') : [],
      creator: doc.getCreator() || '',
      producer: doc.getProducer() || '',
      creationDate: doc.getCreationDate(),
      modificationDate: doc.getModificationDate(),
    };
  }

  /**
   * Updates or sanitizes document metadata.
   */
  public async updateMetadata(
    fileBytes: ArrayBuffer,
    metadata: MetadataFields,
    sanitize: boolean = false
  ): Promise<Uint8Array> {
    const doc = await PDFDocument.load(fileBytes);

    if (sanitize) {
      doc.setTitle('');
      doc.setAuthor('');
      doc.setSubject('');
      doc.setKeywords([]);
      doc.setCreator('');
      doc.setProducer('');
      doc.setCreationDate(new Date());
      doc.setModificationDate(new Date());
    } else {
      if (metadata.title !== undefined) doc.setTitle(metadata.title);
      if (metadata.author !== undefined) doc.setAuthor(metadata.author);
      if (metadata.subject !== undefined) doc.setSubject(metadata.subject);
      if (metadata.keywords !== undefined) doc.setKeywords(metadata.keywords);
      if (metadata.creator !== undefined) doc.setCreator(metadata.creator);
      if (metadata.producer !== undefined) doc.setProducer(metadata.producer);
      doc.setModificationDate(new Date());
    }

    return await doc.save({ useObjectStreams: true });
  }
}

export const pdfService = new PdfService();
```

---

## 6. Canvas Service (`src/services/canvasService.ts`)

### 6.1 Drawing Primitives, Bezier Smoothing & Transparency Filters
`canvasService` powers freehand drawing, geometric shapes, signature pads, and image processing:
1. **Buttery Smooth Quadratic Bezier Curves:** Interpolates midpoints between coordinate samples $(P_i, P_{i+1})$, preventing ugly angular vertices on high-speed cursor/touch movements.
2. **Highlighter Blending:** Translucent strokes with composite operations or alpha channels.
3. **White Background Thresholding:** Converts physical signature scans into transparent PNGs with alpha anti-aliasing.
4. **Memory-Safe Blob Pipeline:** Converts canvas bitmaps to Blobs.

### 6.2 Full Implementation Blueprint

```typescript
// src/services/canvasService.ts
import type { Point, Rect } from '../types/annotation';

export interface DrawingStroke {
  points: Point[];
  color: string;
  width: number;
  opacity: number;
  isHighlighter?: boolean;
}

export interface ShapeStyle {
  strokeColor: string;
  strokeWidth: number;
  fillColor?: string;
  opacity?: number;
  lineDash?: number[];
}

export class CanvasService {
  /**
   * Draws a smooth freehand stroke using midpoint quadratic bezier interpolation.
   */
  public drawSmoothStroke(ctx: CanvasRenderingContext2D, stroke: DrawingStroke): void {
    if (stroke.points.length === 0) return;

    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = stroke.opacity;

    if (stroke.isHighlighter) {
      ctx.globalCompositeOperation = 'multiply';
    }

    if (stroke.points.length === 1) {
      const p = stroke.points[0];
      ctx.arc(p.x, p.y, stroke.width / 2, 0, Math.PI * 2);
      ctx.fillStyle = stroke.color;
      ctx.fill();
      ctx.restore();
      return;
    }

    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

    for (let i = 1; i < stroke.points.length - 1; i++) {
      const p1 = stroke.points[i];
      const p2 = stroke.points[i + 1];
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
    }

    const last = stroke.points[stroke.points.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
    ctx.restore();
  }

  /**
   * Draws geometric shapes: rectangle, circle, line, arrow.
   */
  public drawShape(
    ctx: CanvasRenderingContext2D,
    type: 'rect' | 'circle' | 'line' | 'arrow',
    start: Point,
    end: Point,
    style: ShapeStyle
  ): void {
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = style.strokeColor;
    ctx.lineWidth = style.strokeWidth;
    ctx.globalAlpha = style.opacity ?? 1.0;

    if (style.lineDash) {
      ctx.setLineDash(style.lineDash);
    }

    switch (type) {
      case 'rect': {
        const x = Math.min(start.x, end.x);
        const y = Math.min(start.y, end.y);
        const w = Math.abs(end.x - start.x);
        const h = Math.abs(end.y - start.y);

        if (style.fillColor && style.fillColor !== 'transparent') {
          ctx.fillStyle = style.fillColor;
          ctx.fillRect(x, y, w, h);
        }
        if (style.strokeWidth > 0) {
          ctx.strokeRect(x, y, w, h);
        }
        break;
      }
      case 'circle': {
        const rx = Math.abs(end.x - start.x) / 2;
        const ry = Math.abs(end.y - start.y) / 2;
        const cx = Math.min(start.x, end.x) + rx;
        const cy = Math.min(start.y, end.y) + ry;

        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        if (style.fillColor && style.fillColor !== 'transparent') {
          ctx.fillStyle = style.fillColor;
          ctx.fill();
        }
        if (style.strokeWidth > 0) {
          ctx.stroke();
        }
        break;
      }
      case 'line': {
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        break;
      }
      case 'arrow': {
        this.drawArrowLine(ctx, start, end, style.strokeWidth * 3.5);
        ctx.stroke();
        break;
      }
    }

    ctx.restore();
  }

  /**
   * Helper to draw a directed arrow with arrowhead.
   */
  private drawArrowLine(
    ctx: CanvasRenderingContext2D,
    from: Point,
    to: Point,
    headLength: number = 15
  ): void {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const angle = Math.atan2(dy, dx);

    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);

    ctx.lineTo(
      to.x - headLength * Math.cos(angle - Math.PI / 6),
      to.y - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(
      to.x - headLength * Math.cos(angle + Math.PI / 6),
      to.y - headLength * Math.sin(angle + Math.PI / 6)
    );
  }

  /**
   * Removes white/light backgrounds from uploaded signatures with soft anti-aliased alpha falloff.
   */
  public removeWhiteBackground(
    sourceCanvas: HTMLCanvasElement,
    threshold: number = 235
  ): HTMLCanvasElement {
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = sourceCanvas.width;
    outputCanvas.height = sourceCanvas.height;

    const ctx = outputCanvas.getContext('2d');
    if (!ctx) return sourceCanvas;

    ctx.drawImage(sourceCanvas, 0, 0);
    const imgData = ctx.getImageData(0, 0, outputCanvas.width, outputCanvas.height);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const brightness = 0.299 * r + 0.587 * g + 0.114 * b;

      if (brightness >= threshold) {
        data[i + 3] = 0; // Pure transparent
      } else if (brightness > threshold - 40) {
        // Soft alpha transition
        const alphaFactor = (threshold - brightness) / 40;
        data[i + 3] = Math.round(data[i + 3] * alphaFactor);
      }
    }

    ctx.putImageData(imgData, 0, 0);
    return outputCanvas;
  }

  /**
   * Converts HTMLCanvasElement to Blob with Promise.
   */
  public canvasToBlob(
    canvas: HTMLCanvasElement,
    mimeType: string = 'image/png',
    quality: number = 0.92
  ): Promise<Blob> {
    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas to Blob conversion returned null'));
        },
        mimeType,
        quality
      );
    });
  }

  /**
   * Creates an Offscreen Canvas or standard Canvas helper.
   */
  public createCanvas(width: number, height: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    return { canvas, ctx };
  }

  /**
   * Cleans canvas dimensions to release GPU / browser raster memory.
   */
  public disposeCanvas(canvas: HTMLCanvasElement): void {
    canvas.width = 0;
    canvas.height = 0;
  }
}

export const canvasService = new CanvasService();
```

---

## 7. ZIP Archive Service (`src/services/zipService.ts`)

### 7.1 Architecture & Stream Download
`zipService` provides in-memory `.zip` archive creation and cross-browser download handling using `jszip` and `file-saver`:
- Packages split PDFs (`Split PDF`, `Extract Pages`) and rendered images (`PDF to Images`).
- Emits fine-grained compression progress callbacks (0% to 100%).
- Supports `Blob`, `Uint8Array`, `ArrayBuffer`, and string payloads.

### 7.2 Full Implementation Blueprint

```typescript
// src/services/zipService.ts
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export interface ZipFileEntry {
  filename: string;
  content: Blob | Uint8Array | ArrayBuffer | string;
}

export class ZipService {
  /**
   * Creates an in-memory ZIP archive from a list of file entries.
   */
  public async createZip(
    files: ZipFileEntry[],
    onProgress?: (percent: number, currentFile: string) => void
  ): Promise<Blob> {
    const zip = new JSZip();

    for (const file of files) {
      zip.file(file.filename, file.content, { binary: typeof file.content !== 'string' });
    }

    return await zip.generateAsync(
      {
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      },
      (metadata) => {
        if (onProgress) {
          onProgress(Math.round(metadata.percent), metadata.currentFile || '');
        }
      }
    );
  }

  /**
   * Triggers a browser download for any Blob with a specified filename.
   */
  public saveBlobAs(blob: Blob, filename: string): void {
    saveAs(blob, filename);
  }

  /**
   * Convenience method to build ZIP archive and immediately trigger file download.
   */
  public async generateZipAndDownload(
    files: ZipFileEntry[],
    zipFilename: string = 'archive.zip',
    onProgress?: (percent: number) => void
  ): Promise<void> {
    const zipBlob = await this.createZip(files, (pct) => {
      if (onProgress) onProgress(pct);
    });
    this.saveBlobAs(zipBlob, zipFilename);
  }
}

export const zipService = new ZipService();
```

---

## 8. Geometry & Coordinate System Engine (`src/utils/geometry.ts`)

### 8.1 Mathematical Foundation
Translation between Screen Viewport (top-left origin $(0, 0)$, CSS pixels) and PDF Point Space (bottom-left origin $(0, 0)$, PostScript 72 pt/in) must account for arbitrary page rotations:

$$S_x = \frac{W_{\text{pdf}}}{W_{\text{vp}}},\quad S_y = \frac{H_{\text{pdf}}}{H_{\text{vp}}}$$

### 8.2 Full Implementation Blueprint

```typescript
// src/utils/geometry.ts
import type { Point, Size, Rect, PDFBox } from '../types/annotation';

export type GridAnchor =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'middle-left'
  | 'center'
  | 'middle-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

/**
 * Normalizes any rotation angle to standard 0, 90, 180, 270 degrees.
 */
export function normalizeRotation(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

/**
 * Converts screen viewport bounding box to PDF point coordinates with rotation handling.
 */
export function screenToPdfCoordinates(
  screenBox: Rect,
  viewportSize: Size,
  pdfPageSize: Size,
  rotationAngle: number = 0
): PDFBox {
  const scaleX = pdfPageSize.width / viewportSize.width;
  const scaleY = pdfPageSize.height / viewportSize.height;
  const rot = normalizeRotation(rotationAngle);

  switch (rot) {
    case 90:
      return {
        x: screenBox.y * scaleX,
        y: screenBox.x * scaleY,
        width: screenBox.height * scaleX,
        height: screenBox.width * scaleY,
      };
    case 180:
      return {
        x: (viewportSize.width - screenBox.x - screenBox.width) * scaleX,
        y: screenBox.y * scaleY,
        width: screenBox.width * scaleX,
        height: screenBox.height * scaleY,
      };
    case 270:
      return {
        x: (viewportSize.height - screenBox.y - screenBox.height) * scaleX,
        y: (viewportSize.width - screenBox.x - screenBox.width) * scaleY,
        width: screenBox.height * scaleX,
        height: screenBox.width * scaleY,
      };
    case 0:
    default:
      return {
        x: screenBox.x * scaleX,
        y: (viewportSize.height - screenBox.y - screenBox.height) * scaleY,
        width: screenBox.width * scaleX,
        height: screenBox.height * scaleY,
      };
  }
}

/**
 * Converts PDF point coordinates back to screen viewport bounding box.
 */
export function pdfToScreenCoordinates(
  pdfBox: PDFBox,
  viewportSize: Size,
  pdfPageSize: Size,
  rotationAngle: number = 0
): Rect {
  const scaleX = viewportSize.width / pdfPageSize.width;
  const scaleY = viewportSize.height / pdfPageSize.height;
  const rot = normalizeRotation(rotationAngle);

  switch (rot) {
    case 90:
      return {
        x: pdfBox.y * scaleX,
        y: pdfBox.x * scaleY,
        width: pdfBox.height * scaleX,
        height: pdfBox.width * scaleY,
      };
    case 180:
      return {
        x: viewportSize.width - (pdfBox.x + pdfBox.width) * scaleX,
        y: pdfBox.y * scaleY,
        width: pdfBox.width * scaleX,
        height: pdfBox.height * scaleY,
      };
    case 270:
      return {
        x: viewportSize.width - (pdfBox.y + pdfBox.height) * scaleX,
        y: viewportSize.height - (pdfBox.x + pdfBox.width) * scaleY,
        width: pdfBox.height * scaleX,
        height: pdfBox.width * scaleY,
      };
    case 0:
    default:
      return {
        x: pdfBox.x * scaleX,
        y: viewportSize.height - (pdfBox.y + pdfBox.height) * scaleY,
        width: pdfBox.width * scaleX,
        height: pdfBox.height * scaleY,
      };
  }
}

/**
 * Converts a single screen point to a PDF point.
 */
export function screenToPdfPoint(
  point: Point,
  viewportSize: Size,
  pdfPageSize: Size,
  rotationAngle: number = 0
): Point {
  const box = screenToPdfCoordinates(
    { x: point.x, y: point.y, width: 0, height: 0 },
    viewportSize,
    pdfPageSize,
    rotationAngle
  );
  return { x: box.x, y: box.y };
}

/**
 * Calculates fit dimensions for images and canvases maintaining aspect ratio.
 */
export function calculateFitDimensions(
  srcWidth: number,
  srcHeight: number,
  maxWidth: number,
  maxHeight: number,
  fitMode: 'contain' | 'cover' | 'fill' = 'contain'
): { width: number; height: number; x: number; y: number } {
  if (fitMode === 'fill') {
    return { width: maxWidth, height: maxHeight, x: 0, y: 0 };
  }

  const scale =
    fitMode === 'contain'
      ? Math.min(maxWidth / srcWidth, maxHeight / srcHeight)
      : Math.max(maxWidth / srcWidth, maxHeight / srcHeight);

  const width = srcWidth * scale;
  const height = srcHeight * scale;
  const x = (maxWidth - width) / 2;
  const y = (maxHeight - height) / 2;

  return { width, height, x, y };
}

/**
 * Computes 9-grid anchor coordinate in PDF point space.
 */
export function getAnchorPosition(
  anchor: GridAnchor,
  pageSize: Size,
  contentSize: Size,
  margin: number = 30
): Point {
  let x = margin;
  let y = margin;

  // X coordinate
  if (anchor === 'top-left' || anchor === 'middle-left' || anchor === 'bottom-left') {
    x = margin;
  } else if (anchor === 'top-center' || anchor === 'center' || anchor === 'bottom-center') {
    x = (pageSize.width - contentSize.width) / 2;
  } else {
    // right
    x = pageSize.width - contentSize.width - margin;
  }

  // Y coordinate (PDF space: 0 is bottom)
  if (anchor === 'bottom-left' || anchor === 'bottom-center' || anchor === 'bottom-right') {
    y = margin;
  } else if (anchor === 'middle-left' || anchor === 'center' || anchor === 'middle-right') {
    y = (pageSize.height - contentSize.height) / 2;
  } else {
    // top
    y = pageSize.height - contentSize.height - margin;
  }

  return { x, y };
}
```

---

## 9. Formatters & Magic-Byte Validation (`src/utils/`)

### 9.1 Formatters (`src/utils/formatters.ts`)

```typescript
// src/utils/formatters.ts

/**
 * Formats byte size into human-readable string (KB, MB, GB).
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Formats reduction percentage.
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Parses user range strings (e.g. "1-3, 5, 8-10, end") into 0-indexed integer array.
 */
export function parsePageRange(rangeStr: string, totalPages: number): number[] {
  const pages = new Set<number>();
  const parts = rangeStr.split(',').map((p) => p.trim()).filter(Boolean);

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-').map((s) => s.trim());
      const start = parseInt(startStr, 10);
      let end = endStr.toLowerCase() === 'end' ? totalPages : parseInt(endStr, 10);

      if (!isNaN(start) && !isNaN(end)) {
        const min = Math.max(1, Math.min(start, end));
        const max = Math.min(totalPages, Math.max(start, end));
        for (let i = min; i <= max; i++) {
          pages.add(i - 1); // 0-indexed
        }
      }
    } else {
      const pageNum = parseInt(part, 10);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
        pages.add(pageNum - 1);
      }
    }
  }

  return Array.from(pages).sort((a, b) => a - b);
}

/**
 * Converts 0-indexed page array into compact human range string (e.g. [0, 1, 2, 4] -> "1-3, 5").
 */
export function formatPageRange(pageIndices: number[]): string {
  if (pageIndices.length === 0) return '';
  const sorted = Array.from(new Set(pageIndices)).sort((a, b) => a - b);
  const ranges: string[] = [];

  let start = sorted[0];
  let end = start;

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === end + 1) {
      end = sorted[i];
    } else {
      ranges.push(start === end ? `${start + 1}` : `${start + 1}-${end + 1}`);
      start = sorted[i];
      end = start;
    }
  }
  ranges.push(start === end ? `${start + 1}` : `${start + 1}-${end + 1}`);

  return ranges.join(', ');
}

/**
 * Sanitizes output filenames removing unsafe OS filesystem characters.
 */
export function sanitizeFilename(filename: string, fallback: string = 'document.pdf'): string {
  if (!filename || filename.trim().length === 0) return fallback;
  // Preserve Thai unicode characters while removing illegal filename chars: \ / : * ? " < > |
  const cleaned = filename.replace(/[\\/:*?"<>|]/g, '_').trim();
  return cleaned.length > 0 ? cleaned : fallback;
}
```

---

### 9.2 Magic-Byte Verification (`src/utils/fileValidation.ts`)

```typescript
// src/utils/fileValidation.ts

export type DetectedFileType = 'pdf' | 'png' | 'jpeg' | 'webp' | 'unknown';

export interface FileValidationResult {
  isValid: boolean;
  detectedType: DetectedFileType;
  error?: string;
}

/**
 * Inspects initial byte signatures (magic bytes) to verify actual file format,
 * preventing spoofed extension vulnerabilities.
 */
export async function detectFileTypeFromBytes(
  data: ArrayBuffer | Uint8Array | Blob
): Promise<DetectedFileType> {
  let header: Uint8Array;

  if (data instanceof Blob) {
    const slice = data.slice(0, 16);
    const buffer = await slice.arrayBuffer();
    header = new Uint8Array(buffer);
  } else if (data instanceof ArrayBuffer) {
    header = new Uint8Array(data.slice(0, 16));
  } else {
    header = data.subarray(0, 16);
  }

  if (header.length < 4) return 'unknown';

  // PDF Magic Bytes: %PDF- (0x25, 0x50, 0x44, 0x46)
  if (header[0] === 0x25 && header[1] === 0x50 && header[2] === 0x44 && header[3] === 0x46) {
    return 'pdf';
  }

  // PNG Magic Bytes: 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
  if (
    header.length >= 8 &&
    header[0] === 0x89 &&
    header[1] === 0x50 &&
    header[2] === 0x4E &&
    header[3] === 0x47 &&
    header[4] === 0x0D &&
    header[5] === 0x0A &&
    header[6] === 0x1A &&
    header[7] === 0x0A
  ) {
    return 'png';
  }

  // JPEG Magic Bytes: 0xFF, 0xD8, 0xFF
  if (header[0] === 0xFF && header[1] === 0xD8 && header[2] === 0xFF) {
    return 'jpeg';
  }

  // WebP Magic Bytes: RIFF....WEBP (0x52 0x49 0x46 0x46 ... 0x57 0x45 0x42 0x50)
  if (
    header.length >= 12 &&
    header[0] === 0x52 &&
    header[1] === 0x49 &&
    header[2] === 0x46 &&
    header[3] === 0x46 &&
    header[8] === 0x57 &&
    header[9] === 0x45 &&
    header[10] === 0x42 &&
    header[11] === 0x50
  ) {
    return 'webp';
  }

  return 'unknown';
}

/**
 * Validates whether a file is a valid PDF.
 */
export async function validatePdfFile(file: File | ArrayBuffer | Blob): Promise<FileValidationResult> {
  const detectedType = await detectFileTypeFromBytes(file);
  if (detectedType === 'pdf') {
    return { isValid: true, detectedType: 'pdf' };
  }
  return {
    isValid: false,
    detectedType,
    error: 'The uploaded file is not a valid PDF document.',
  };
}

/**
 * Validates whether a file is a valid image (PNG, JPEG, WebP).
 */
export async function validateImageFile(file: File | ArrayBuffer | Blob): Promise<FileValidationResult> {
  const detectedType = await detectFileTypeFromBytes(file);
  if (detectedType === 'png' || detectedType === 'jpeg' || detectedType === 'webp') {
    return { isValid: true, detectedType };
  }
  return {
    isValid: false,
    detectedType,
    error: 'The uploaded file is not a supported image format (JPEG, PNG, WebP).',
  };
}
```

---

## 10. Summary & Downstream Hand-off

The **Core Engine Services & Types Layer** is fully specified and architecturally unified:
1. **Types (`src/types/`)**: Ready for direct implementation across `pdf.ts`, `tool.ts`, `annotation.ts`, and `i18n.ts`.
2. **Font Service (`fontService.ts`)**: Solves Thai text rendering with fontkit and caching.
3. **Renderer Service (`pdfRendererService.ts`)**: Delivers fast, memory-safe canvas rasterization and thumbnail previews via PDF.js worker.
4. **Foundational PDF Engine (`pdfService.ts`)**: Provides complete document manipulation primitives (merge, split, organize, rotate, extract, image conversion, metadata).
5. **Canvas Service (`canvasService.ts`)**: Provides quadratic bezier smoothing, shape rendering, and background removal.
6. **ZIP Service (`zipService.ts`)**: Delivers multi-file zip generation and download flows.
7. **Coordinate Engine (`geometry.ts`)**: Full bidirectional math across 4 rotation angles.
8. **Formatters & Validation (`formatters.ts`, `fileValidation.ts`)**: Byte formatting, robust page range expression parser, and magic-byte security validator.
