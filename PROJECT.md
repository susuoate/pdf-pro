# PDF Pro — Master Project Architecture & Interface Specification

**Target Application:** PDF Pro (Client-Side First PDF Management Web Suite)  
**Reference Architecture:** Inspired by iLovePDF (https://www.ilovepdf.com/)  
**Version:** 1.0.0  
**Date:** 2026-08-25  

---

## 1. Overview & Architectural Blueprint

### 1.1 Project Objective
**PDF Pro** is a comprehensive, production-grade, 100% browser-based PDF utility platform. It provides an all-in-one suite of 17 distinct PDF tools organized into 4 primary suites (Organize, Convert & Optimize, Edit & Annotate, Security & Privacy).

### 1.2 Zero-Server-Upload Privacy Architecture
In contrast to conventional PDF web platforms that upload sensitive user documents to remote cloud backends, PDF Pro enforces a **Strict Zero-Server-Upload Guarantee**:
- **Local Browser Execution Sandbox:** All document parsing, rendering, manipulation, transformation, OCR, cryptographic hashing, and vector synthesis execute 100% in client memory using WebAssembly, Web Workers, pure JavaScript (`pdf-lib`, `pdfjs-dist`, `tesseract.js`), and HTML5 OffscreenCanvas.
- **Zero Document Network Ingress/Egress:** Not a single document byte or extracted text payload is transmitted to any external server.
- **Memory Safety & Lifecycle Management:** File buffers (`ArrayBuffer`) and object URLs (`blob:`) are strictly tracked, revoked upon unmount, and garbage collected.

```
+------------------------------------------------------------------------------------+
|                                    PDF Pro UI                                      |
|  +------------------------------------------------------------------------------+  |
|  | Dashboard | Organize Suite | Convert Suite | Edit Suite | Security Suite     |  |
|  +------------------------------------------------------------------------------+  |
|                                       |                                            |
|                                       v                                            |
|  +------------------------------------------------------------------------------+  |
|  |                        Presentation & State Layer                            |  |
|  | - React 18/19 + TypeScript + Tailwind CSS + Lucide Icons                     |  |
|  | - Unified Workspace (DropZone -> ThumbnailGrid -> Sidebar -> ActionFooter)   |  |
|  | - i18n Context (Thai 🇹🇭 / English 🇬🇧) + Theme Context (Dark 🌙 / Light ☀️)   |  |
|  +------------------------------------------------------------------------------+  |
|                                       |                                            |
|                                       v                                            |
|  +------------------------------------------------------------------------------+  |
|  |                            Service / Engine Layer                            |  |
|  | +------------------+ +-------------------+ +----------------+ +------------+ |  |
|  | |    pdfService    | | pdfRendererService| |   ocrService   | |canvasService| |  |
|  | |  (pdf-lib / font)| |    (pdfjs-dist)   | | (tesseract.js) | | (2D Canvas)| |  |
|  | +------------------+ +-------------------+ +----------------+ +------------+ |  |
|  | +--------------------------------------------------------------------------+ |  |
|  | | Supporting Engines: fontService, zipService, compressionService          | |  |
|  | +--------------------------------------------------------------------------+ |  |
|  +------------------------------------------------------------------------------+  |
|                                       |                                            |
|                                       v                                            |
|  +------------------------------------------------------------------------------+  |
|  |                      Browser Sandbox & Web Workers                            |  |
|  | - HTML5 FileReader / Blob API / WebAssembly runtime                          |  |
|  | - pdf.worker.min.mjs (PDF.js) & tesseract-worker.js (Tesseract.js)           |  |
|  +------------------------------------------------------------------------------+  |
+------------------------------------------------------------------------------------+
```

---

## 2. Technology Stack & Dependencies Matrix

| Layer / Subsystem | Technology / Package | Target Version | Architectural Role |
|---|---|---|---|
| **Build & Bundler** | **Vite** | `^5.4.0` / `^6.x` | Ultra-fast HMR, ESM bundling, Web Worker asset handling via `?url`. |
| **UI Framework** | **React** | `^18.3.1` / `^19.x` | Component-based state management, concurrent rendering, rich hooks. |
| **Language** | **TypeScript** | `^5.5.0` | Strict type safety for PDF ASTs, geometric math, and service boundaries. |
| **Styling & Theme** | **Tailwind CSS** | `^3.4.10` | Responsive utility classes, class-based dark mode, zero runtime CSS overhead. |
| **Iconography** | **Lucide React** | `^0.436.0` | Clean, modern, accessible vector icon library. |
| **PDF Manipulation** | **`pdf-lib` / `@cantoo/pdf-lib`** | `^1.17.9` / `^1.23.0` | In-browser PDF assembly, merging, splitting, rotation, metadata, vector baking, encryption. |
| **Font Engine** | **`@pdf-lib/fontkit`** | `^1.1.1` | TrueType/OpenType font embedding enabling Thai Unicode glyph rendering in PDFs. |
| **PDF Rendering** | **`pdfjs-dist`** | `^4.5.136` / `^3.11.x` | High-fidelity canvas rasterization, thumbnail previews, vector text extraction. |
| **OCR Engine** | **`tesseract.js`** | `^5.1.1` | Pure client-side WebAssembly OCR supporting Thai (`tha`) and English (`eng`). |
| **Archive Packaging** | **`jszip`** | `^3.10.1` | In-memory ZIP archive generation for bulk image and split PDF downloads. |
| **Stream Download** | **`file-saver`** | `^2.0.5` | Cross-browser stream download initiator for Blobs and Files. |
| **Canvas & Graphics** | **HTML5 Canvas 2D API** | Native Browser API | Drawing pen, shapes, highlighters, signatures, image scaling, permanent redaction. |

---

## 3. Feature Inventory & Milestone Schedule (M1 – M5)

### 3.1 17-Tool Matrix Across 4 Primary Suites

| # | Suite | Tool Name | Tool ID | Primary Input | Output | Primary Engine | Milestone |
|:---|:---|:---|:---|:---|:---|:---|:---|
| **1** | Organize | **Merge PDF** | `merge` | 2+ PDF files | Single `.pdf` | `pdf-lib` | **M2** |
| **2** | Organize | **Split PDF** | `split` | 1 PDF file | `.pdf` or `.zip` | `pdf-lib`, `jszip` | **M2** |
| **3** | Organize | **Organize & Reorder** | `organize` | 1 PDF file | Single `.pdf` | `pdf-lib`, `pdfjs-dist` | **M2** |
| **4** | Organize | **Rotate PDF** | `rotate` | 1 PDF file | Single `.pdf` | `pdf-lib` | **M2** |
| **5** | Organize | **Remove / Extract Pages**| `extract` | 1 PDF file | `.pdf` or `.zip` | `pdf-lib`, `jszip` | **M2** |
| **6** | Convert | **Images to PDF** | `img2pdf` | JPG, PNG, WebP | Single `.pdf` | `pdf-lib`, Canvas | **M2** |
| **7** | Convert | **PDF to Images** | `pdf2img` | 1 PDF file | `.png`/`.jpg` / `.zip` | `pdfjs-dist`, Canvas, `jszip` | **M2** |
| **8** | Convert | **Compress PDF** | `compress` | 1 PDF file | Single `.pdf` | `pdfjs-dist`, Canvas, `pdf-lib` | **M2** |
| **9** | Convert | **OCR & Text Extraction** | `ocr` | 1 PDF or Image | `.txt`, JSON, `.pdf` | `tesseract.js`, Canvas, `pdf-lib` | **M2** |
| **10**| Edit | **PDF Editor** | `editor` | 1 PDF file | Single `.pdf` | Canvas, `pdf-lib`, `fontkit` | **M3** |
| **11**| Edit | **Add Watermark** | `watermark` | 1 PDF file | Single `.pdf` | `pdf-lib`, `fontkit` | **M3** |
| **12**| Edit | **Add Page Numbers** | `pageNumbers`| 1 PDF file | Single `.pdf` | `pdf-lib`, `fontkit` | **M3** |
| **13**| Security | **Sign PDF** | `sign` | 1 PDF file | Single `.pdf` | Canvas, `pdf-lib` | **M4** |
| **14**| Security | **Protect PDF** | `protect` | 1 PDF file | Single `.pdf` | `pdf-lib` | **M4** |
| **15**| Security | **Unlock PDF** | `unlock` | 1 Encrypted PDF| Single `.pdf` | `pdfjs-dist`, `pdf-lib` | **M4** |
| **16**| Security | **Redact PDF** | `redact` | 1 PDF file | Single `.pdf` | Canvas, `pdfjs-dist`, `pdf-lib` | **M4** |
| **17**| Security | **Metadata Editor** | `metadata` | 1 PDF file | Single `.pdf` | `pdf-lib` | **M4** |

---

### 3.2 Milestone Breakdown & Deliverables Schedule

```
MILESTONE ROADMAP
├── M1: Foundation, Core Engines, Shared Design System, i18n (TH/EN), Dashboard & Unified Workspace
├── M2: Organize Suite (5 tools) & Convert/Optimize Suite (4 tools)
├── M3: Edit & Annotate Suite (3 tools: PDF Editor, Watermark, Page Numbers)
├── M4: Security & Privacy Suite (5 tools: Sign, Protect, Unlock, Redact, Metadata)
└── M5: Final E2E Integration (100% E2E Pass) & Adversarial Hardening
```

#### Milestone 1 (M1): Foundation, Core Engines & Shared Infrastructure
- **Core Objectives**:
  1. Initialize Vite + React + TypeScript + Tailwind CSS project baseline with strict TypeScript settings.
  2. Setup complete static asset infrastructure: Unicode Thai TrueType fonts (`Sarabun-Regular.ttf`, `Prompt-Regular.ttf`) and worker bundles in `public/`.
  3. Implement `fontService` with `@pdf-lib/fontkit` registration and font caching.
  4. Implement `pdfRendererService` with `pdfjs-dist` worker setup.
  5. Implement `i18n` dual-language system (`useTranslation` hook) with complete `en.ts` and `th.ts` dictionaries and Thai typography anti-clipping rules.
  6. Implement Theme Engine (Dark Mode 🌙 / Light Mode ☀️ with persistent `localStorage`).
  7. Build Global App Shell: `Header` (navigation mega-menu, language & theme toggles, privacy trust pill), `Footer` (telemetry verification), `Dashboard` (Hero search with `Ctrl+K`, category tabs, tool cards grid).
  8. Build Standardized `UnifiedWorkspace` component structure (Phase 1 DropZone → Phase 2 ThumbnailGrid / Canvas → Phase 3 Sidebar → Phase 4 ActionFooter → Phase 5 ResultModal).

#### Milestone 2 (M2): Organize Suite & Convert/Optimize Suite
- **Core Objectives**:
  1. **Organize Suite**:
     - **Merge PDF**: Multi-file dropzone, drag-to-reorder list, page selection, rotation, merge engine.
     - **Split PDF**: Range expression parser (`1-3, 5, 8-end`), extract all mode, single/bulk ZIP export.
     - **Organize & Reorder**: Visual thumbnail grid, per-page rotation (+90°/-90°), duplication, deletion, drag-and-drop.
     - **Rotate PDF**: Global orientation (+90°, 180°, 270°) and per-page overrides with normalization.
     - **Remove / Extract**: Invertible selection grid, Remove mode (invert & save) and Extract mode (standalone PDF / ZIP).
  2. **Convert & Optimize Suite**:
     - **Images to PDF**: JPG/PNG/WebP conversion, page size presets (A4, Letter, Fit), orientation, margin calculation.
     - **PDF to Images**: High-res canvas rasterization (72/150/300 DPI), PNG/JPG formats, single and bulk ZIP downloads.
     - **Compress PDF**: Dual compression strategy (structural object stream stripping + raster stream downsampling), compression presets (Extreme, Recommended, Low), before/after size difference stats.
     - **OCR & Text Extraction**: `tesseract.js` worker integration (`eng`, `tha`, `tha+eng`), image contrast pre-processing, progress tracking, plain text and JSON export.

#### Milestone 3 (M3): Edit & Annotate Suite
- **Core Objectives**:
  1. **PDF Editor**:
     - Interactive 2D canvas overlay over rendered PDF pages.
     - Rich text boxes (font family, font size, bold/italic, color, background).
     - Freehand pen with smooth quadratic bezier curves & variable stroke width.
     - Highlighter pen with translucent composite blending.
     - Geometric shapes (rectangles, circles, lines, arrows) with fill and stroke options.
     - Image / Stamp insertion.
     - Exact PDF baking pipeline converting canvas screen coordinates to PDF point coordinates.
  2. **Add Watermark**:
     - Text watermarks (with Thai Unicode font support) & image logo watermarks.
     - Opacity control, rotation angle (-180° to +180°), 9-grid anchor alignment, repeating mosaic mode.
     - Page range filtering (All, Odd, Even, Custom).
  3. **Add Page Numbers**:
     - Numbering templates (`"1"`, `"Page {n} of {total}"`, `"หน้า {n} จาก {total}"`, `"{n} / {total}"`).
     - 6 placement anchors (Header/Footer Left/Center/Right) with configurable margins.
     - Start page offset & page range filters.

#### Milestone 4 (M4): Security & Privacy Suite
- **Core Objectives**:
  1. **Sign PDF**:
     - Signature creation pad (Draw on touch/mouse canvas, Type with cursive font, Upload image with auto-background removal).
     - Movable, resizable placement bounding box on any page.
     - Transparent PNG embedding into target PDF page.
  2. **Protect PDF**:
     - Password encryption (User Password to view, Owner Password for permissions).
     - Standard PDF encryption handlers (AES-128 / AES-256).
     - Password strength meter and match verification.
  3. **Unlock PDF**:
     - Password detection on load (`onPassword` callback in `pdfjs-dist`).
     - Password entry dialog and decryption export with removed security restrictions.
  4. **Redact PDF**:
     - Permanent blackout rectangular redaction.
     - True high-security page flattening (render redacted canvas at 300 DPI and replace original page, permanently destroying underlying text stream).
  5. **Metadata Editor**:
     - View and modify Title, Author, Subject, Keywords, Creator, Producer, Creation/Modification dates.
     - "Sanitize / Strip All Metadata" one-click action for complete privacy.

#### Milestone 5 (M5): Final E2E Integration & Adversarial Hardening
- **Core Objectives**:
  1. Comprehensive 4-Tier E2E automated test suite:
     - Tier 1: Happy paths for all 17 tools with synthetic test fixtures.
     - Tier 2: Boundary conditions, corrupted files, malformed ranges, Thai unicode strings.
     - Tier 3: Multi-tool pipeline workflows (e.g. Convert Images → Watermark → Compress → Protect → Unlock).
     - Tier 4: Heavy PDF stress tests (50+ pages), memory leak validation, offline verification.
  2. Strict UI polish: responsive mobile/desktop layout checks, WCAG contrast verification, dark mode consistency.
  3. Zero-upload privacy verification: CSP validation and live network monitor verification.
  4. 100% clean build verification (`npm run build` succeeds with zero errors).

---

## 4. Geometric & Coordinate System Transformation

Browser-based PDF manipulation requires precise translation between three distinct coordinate spaces:
1. **Screen / CSS Viewport Space:** Origin $(0, 0)$ at **Top-Left**, units in CSS pixels (variable based on responsive display size).
2. **HTML5 Canvas Pixel Space:** Origin $(0, 0)$ at **Top-Left**, units in physical device pixels ($W_{\text{canvas}} = W_{\text{viewport}} \times \text{DPR}$).
3. **PDF User Unit Space (PostScript):** Origin $(0, 0)$ at **Bottom-Left**, units in points ($1\text{ pt} = \frac{1}{72}\text{ inch}$; A4 $= 595.28 \times 841.89\text{ pt}$).

```
Screen / Canvas Space (Origin Top-Left):
(0,0) -----------------------------------> +X (pixels)
  |
  |
  v +Y (pixels)
[Bottom-Left] ---------------------------- [Bottom-Right]

PDF Point Space (Origin Bottom-Left):
[Top-Left] ------------------------------ [Top-Right]
  ^ +Y (points)
  |
  |
(0,0) -----------------------------------> +X (points)
```

### 4.1 Transformation Formulas

Given:
- $W_{\text{pdf}}, H_{\text{pdf}}$ = PDF page size in points (from `page.getSize()`).
- $W_{\text{vp}}, H_{\text{vp}}$ = Screen viewport dimensions in pixels.
- $x_{\text{screen}}, y_{\text{screen}}, w_{\text{screen}}, h_{\text{screen}}$ = Annotation bounding box on screen.
- $\theta$ = Internal PDF page rotation angle ($0^\circ, 90^\circ, 180^\circ, 270^\circ$).

Scale factors:
$$S_x = \frac{W_{\text{pdf}}}{W_{\text{vp}}},\quad S_y = \frac{H_{\text{pdf}}}{H_{\text{vp}}}$$

#### Unrotated Page ($\theta = 0^\circ$):
$$x_{\text{pdf}} = x_{\text{screen}} \times S_x$$
$$w_{\text{pdf}} = w_{\text{screen}} \times S_x$$
$$h_{\text{pdf}} = h_{\text{screen}} \times S_y$$
$$y_{\text{pdf}} = H_{\text{pdf}} - (y_{\text{screen}} + h_{\text{screen}}) \times S_y$$

#### Rotated Pages ($\theta = 90^\circ, 180^\circ, 270^\circ$):
```typescript
export interface PDFBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function screenToPdfCoordinates(
  screenBox: { x: number; y: number; width: number; height: number },
  viewportSize: { width: number; height: number },
  pdfPageSize: { width: number; height: number },
  rotationAngle: number = 0
): PDFBox {
  const scaleX = pdfPageSize.width / viewportSize.width;
  const scaleY = pdfPageSize.height / viewportSize.height;
  const rot = ((rotationAngle % 360) + 360) % 360;

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
```

---

## 5. Formal Service Module Interface Contracts

All application business logic is encapsulated in isolated service modules with zero UI dependencies:

### 5.1 `pdfService` (`src/services/pdfService.ts`)
```typescript
import { PDFDocument } from 'pdf-lib';

export interface MergeFileItem {
  id: string;
  name: string;
  bytes: ArrayBuffer;
  selectedPages?: number[]; // 0-indexed
  rotations?: Record<number, number>; // pageIndex -> rotation angle
}

export interface SplitOptions {
  mode: 'ranges' | 'extract-all' | 'interval';
  ranges?: string; // e.g. "1-3, 5, 8-10"
  interval?: number; // e.g. every 2 pages
}

export interface PageOrganizeItem {
  originalIndex: number;
  rotation: number; // 0, 90, 180, 270
  isDeleted: boolean;
}

export interface WatermarkOptions {
  type: 'text' | 'image';
  text?: string;
  imageBytes?: ArrayBuffer;
  imageMime?: 'image/png' | 'image/jpeg';
  fontName?: string;
  fontSize?: number;
  fontColor?: string; // Hex e.g. "#FF0000"
  opacity?: number; // 0.0 to 1.0
  rotation?: number; // degrees e.g. 45
  positionMode: 'grid' | 'mosaic' | 'custom';
  gridAnchor?: 'top-left' | 'top-center' | 'top-right' | 'middle-left' | 'center' | 'middle-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  pageRange?: string; // "all", "odd", "even", "1-5"
  layer?: 'over' | 'under';
}

export interface PageNumberOptions {
  template: string; // e.g. "Page {n} of {total}" or "หน้า {n} จาก {total}"
  position: 'header-left' | 'header-center' | 'header-right' | 'footer-left' | 'footer-center' | 'footer-right';
  fontName?: string;
  fontSize?: number;
  fontColor?: string;
  margin?: number;
  startPageNumber?: number; // First numbered index (default 1)
  startFromDocPage?: number; // 1-indexed doc page to begin (default 1)
  excludeFirstPage?: boolean;
}

export interface ImageToPdfOptions {
  pageSize: 'A4' | 'Letter' | 'Legal' | 'Fit';
  orientation: 'auto' | 'portrait' | 'landscape';
  margin: 'none' | 'small' | 'big'; // 0, 20, 50 pt
  imageFit: 'contain' | 'fill' | 'center-original';
}

export interface CompressOptions {
  level: 'extreme' | 'recommended' | 'low';
  dpi?: number;
  quality?: number;
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

export interface IPdfService {
  mergePDFs(files: MergeFileItem[]): Promise<Uint8Array>;
  splitPDF(fileBytes: ArrayBuffer, options: SplitOptions): Promise<{ name: string; bytes: Uint8Array }[]>;
  organizePDF(fileBytes: ArrayBuffer, pageItems: PageOrganizeItem[]): Promise<Uint8Array>;
  rotatePDF(fileBytes: ArrayBuffer, globalAngle: number, overrides?: Record<number, number>): Promise<Uint8Array>;
  extractPages(fileBytes: ArrayBuffer, pageIndices: number[], mergeIntoSingle?: boolean): Promise<Uint8Array | { name: string; bytes: Uint8Array }[]>;
  imagesToPdf(images: { bytes: ArrayBuffer; mimeType: string }[], options: ImageToPdfOptions): Promise<Uint8Array>;
  addWatermark(fileBytes: ArrayBuffer, options: WatermarkOptions): Promise<Uint8Array>;
  addPageNumbers(fileBytes: ArrayBuffer, options: PageNumberOptions): Promise<Uint8Array>;
  protectPDF(fileBytes: ArrayBuffer, options: ProtectOptions): Promise<Uint8Array>;
  unlockPDF(fileBytes: ArrayBuffer, password?: string): Promise<Uint8Array>;
  getMetadata(fileBytes: ArrayBuffer): Promise<MetadataFields>;
  updateMetadata(fileBytes: ArrayBuffer, metadata: MetadataFields, sanitize?: boolean): Promise<Uint8Array>;
}
```

---

### 5.2 `pdfRendererService` (`src/services/pdfRendererService.ts`)
```typescript
export interface RenderPageResult {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  pageNumber: number;
}

export interface IPdfRendererService {
  loadDocument(data: ArrayBuffer | Uint8Array, password?: string): Promise<any>;
  getPageCount(doc: any): number;
  renderThumbnail(doc: any, pageNumber: number, maxDim?: number): Promise<string>;
  renderPageToCanvas(doc: any, pageNumber: number, scale?: number, targetCanvas?: HTMLCanvasElement): Promise<RenderPageResult>;
  renderPageToImageBlob(doc: any, pageNumber: number, dpi: number, format: 'png' | 'jpeg', quality?: number): Promise<Blob>;
  extractTextFromPage(doc: any, pageNumber: number): Promise<string>;
}
```

---

### 5.3 `canvasService` (`src/services/canvasService.ts`)
```typescript
export interface Point {
  x: number;
  y: number;
}

export interface DrawingPath {
  points: Point[];
  color: string;
  width: number;
  opacity: number;
  isHighlighter?: boolean;
}

export interface ICanvasService {
  drawSmoothStroke(ctx: CanvasRenderingContext2D, path: DrawingPath): void;
  drawShape(ctx: CanvasRenderingContext2D, type: 'rect' | 'circle' | 'line' | 'arrow', start: Point, end: Point, options: { strokeColor: string; strokeWidth: number; fillColor?: string }): void;
  removeWhiteBackground(sourceCanvas: HTMLCanvasElement, threshold?: number): HTMLCanvasElement;
  canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality?: number): Promise<Blob>;
}
```

---

### 5.4 `ocrService` (`src/services/ocrService.ts`)
```typescript
export interface OcrProgress {
  status: string;
  progress: number; // 0.0 to 1.0
}

export interface OcrResult {
  text: string;
  confidence: number;
  words?: { text: string; bbox: { x0: number; y0: number; x1: number; y1: number }; confidence: number }[];
}

export interface IOcrService {
  performOcr(
    imageSource: HTMLCanvasElement | Blob | string,
    language: 'eng' | 'tha' | 'eng+tha',
    onProgress?: (progress: OcrProgress) => void
  ): Promise<OcrResult>;
  terminate(): Promise<void>;
}
```

---

### 5.5 `zipService` (`src/services/zipService.ts`)
```typescript
export interface ZipFileEntry {
  filename: string;
  content: Blob | Uint8Array | ArrayBuffer | string;
}

export interface IZipService {
  createZip(files: ZipFileEntry[], onProgress?: (percent: number) => void): Promise<Blob>;
  saveZip(blob: Blob, zipFilename: string): void;
}
```

---

### 5.6 `fontService` (`src/services/fontService.ts`)
```typescript
import { PDFDocument, PDFFont } from 'pdf-lib';

export interface IFontService {
  getFontBytes(fontName: 'Sarabun-Regular' | 'Sarabun-Bold' | 'Prompt-Regular'): Promise<ArrayBuffer>;
  embedThaiFont(pdfDoc: PDFDocument, fontName?: string): Promise<PDFFont>;
  embedStandardFont(pdfDoc: PDFDocument, fontName: string): Promise<PDFFont>;
}
```

---

### 5.7 `i18n` Engine (`src/locales/`)
```typescript
export type Language = 'en' | 'th';

export interface I18nContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (path: string, params?: Record<string, string | number>) => string;
}
```

---

## 6. Code Layout and File Structure

```
c:\Users\oate_\Desktop\pdf pro\
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── public/
│   ├── favicon.svg
│   ├── fonts/
│   │   ├── Sarabun-Regular.ttf
│   │   ├── Sarabun-Bold.ttf
│   │   └── Prompt-Regular.ttf
│   └── pdf.worker.min.mjs
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── vite-env.d.ts
│   │
│   ├── types/                     # Core TypeScript models & schemas
│   │   ├── pdf.ts                 # PDF document, page, metadata types
│   │   ├── tool.ts                # Tool registry, categories, actions
│   │   ├── annotation.ts          # Drawing, shapes, text, watermark, signature models
│   │   └── i18n.ts                # Translation schema types
│   │
│   ├── locales/                   # Bilingual dictionaries & i18n hook
│   │   ├── en.ts                  # English translations
│   │   ├── th.ts                  # Thai translations
│   │   ├── types.ts               # Schema definitions
│   │   └── index.ts               # i18n hook & translation helper
│   │
│   ├── context/                   # Global React State Providers
│   │   ├── ThemeContext.tsx       # Dark/Light theme provider & local persistence
│   │   └── LanguageContext.tsx    # i18n language provider
│   │
│   ├── services/                  # Business Logic Engines (Zero UI Dependencies)
│   │   ├── pdfService.ts          # Core PDF manipulation (merge, split, rotate, organize, protect)
│   │   ├── pdfRendererService.ts  # pdfjs-dist rendering, thumbnail generation, canvas rasterizer
│   │   ├── canvasService.ts       # Canvas 2D drawings, smooth stroke, transparent image filters
│   │   ├── ocrService.ts          # Tesseract.js WASM worker manager & text recognition
│   │   ├── compressionService.ts  # Visual canvas resampling & PDF object stream compressor
│   │   ├── fontService.ts         # Fontkit registration & Thai Unicode font caching
│   │   ├── watermarkService.ts    # 9-grid anchor math & watermark drawing
│   │   ├── pageNumberService.ts   # Page numbering formatters & position embedding
│   │   ├── signatureService.ts    # Signature canvas smoothing & transparent PNG extraction
│   │   └── zipService.ts          # JSZip multi-file packaging & stream download
│   │
│   ├── hooks/                     # Custom Reusable React Hooks
│   │   ├── usePDFDocument.ts      # Multi-file loading, validation, and state manager
│   │   ├── usePageThumbnails.ts   # Asynchronous thumbnail generator with cancellation
│   │   ├── useCanvasDrawer.ts     # Freehand drawing, paths, and shape math
│   │   ├── useFileDrop.ts         # Drag-and-drop file ingestion & MIME/magic byte validator
│   │   └── useDebounce.ts         # Input debouncer for search and sliders
│   │
│   ├── utils/                     # Utility functions
│   │   ├── formatters.ts          # Byte size, date, page range string parser
│   │   ├── geometry.ts            # Coordinate translation between screen and PDF points
│   │   └── fileValidation.ts      # Magic-number byte validation for PDF/JPG/PNG
│   │
│   ├── components/                # Reusable UI Presentation Components
│   │   ├── layout/
│   │   │   ├── Header.tsx         # Brand logo, mega-dropdowns, language toggle, theme toggle, privacy pill
│   │   │   ├── Footer.tsx         # Zero-upload trust indicators, offline monitor, open web standards
│   │   │   └── AppShell.tsx       # Responsive main container
│   │   ├── dashboard/
│   │   │   ├── HeroSection.tsx    # Headline, search bar (Ctrl+K trigger)
│   │   │   ├── QuickSearchModal.tsx# Fuzzy search across 17 tools
│   │   │   ├── CategoryTabs.tsx   # All, Organize, Convert, Edit, Security pills
│   │   │   └── ToolCardGrid.tsx   # Responsive grid of tool cards with hover animations
│   │   ├── workspace/
│   │   │   ├── UnifiedWorkspace.tsx # Unified container managing 5-phase tool lifecycle
│   │   │   ├── DropZone.tsx       # Multi-file drag & drop zone with validation & sample loader
│   │   │   ├── ThumbnailGrid.tsx  # Visual page preview grid with drag reordering & rotate/delete buttons
│   │   │   ├── CanvasOverlay.tsx  # Interactive canvas layer for annotation/signing/watermark/redact
│   │   │   ├── ActionFooter.tsx   # Live stats, progress bar, cancel & execute CTA buttons
│   │   │   └── ResultModal.tsx    # Success modal with size savings badge, download, ZIP, continue actions
│   │   └── common/
│   │       ├── Button.tsx         # Standardized button variants
│   │       ├── Modal.tsx          # Accessible dialog with focus trap
│   │       ├── ProgressBar.tsx    # Animated progress bar with phase indicators
│   │       ├── ToastContainer.tsx # Multi-stack toast notification system
│   │       └── PasswordModal.tsx  # Modal prompt for unlocking encrypted PDFs
│   │
│   └── tools/                     # 17 Dedicated Tool Workspace Views
│       ├── organize/
│       │   ├── MergeView.tsx
│       │   ├── SplitView.tsx
│       │   ├── OrganizeView.tsx
│       │   ├── RotateView.tsx
│       │   └── ExtractPagesView.tsx
│       ├── convert/
│       │   ├── ImagesToPdfView.tsx
│       │   ├── PdfToImagesView.tsx
│       │   ├── CompressPdfView.tsx
│       │   └── OcrTextView.tsx
│       ├── edit/
│       │   ├── PdfEditorView.tsx
│       │   ├── AddWatermarkView.tsx
│       │   └── AddPageNumbersView.tsx
│       └── security/
│           ├── SignPdfView.tsx
│           ├── ProtectPdfView.tsx
│           ├── UnlockPdfView.tsx
│           ├── RedactPdfView.tsx
│           └── MetadataEditorView.tsx
│
└── test/                          # Automated Verification Suite
    ├── fixtures/
    │   └── generator.ts           # Synthetic deterministic PDF fixture generator
    ├── utils/
    │   └── pdfVerifier.ts         # PDF AST & structural validator
    └── e2e/
        ├── tier1-core.spec.ts     # Tier 1 happy path test for all 17 tools
        ├── tier2-boundary.spec.ts # Tier 2 edge cases, corrupt inputs, Thai unicode
        ├── tier3-pipeline.spec.ts # Tier 3 multi-tool composition & state retention
        └── tier4-stress.spec.ts   # Tier 4 offline mode & performance benchmarks
```

---

## 7. 4-Tier E2E Verification & Quality Assurance Strategy

```
+-------------------------------------------------------------------------------------+
| TIER 4: REAL-WORLD STRESS & OFFLINE BENCHMARKS                                      |
| - 50MB / 100-page PDF stress test with memory leak profiling (< 180MB heap usage)   |
| - 100% Offline Airplane mode verification (zero network requests during operations) |
+-------------------------------------------------------------------------------------+
| TIER 3: MULTI-TOOL COMPOSITION PIPELINES & STATE INTEGRITY                          |
| - Pipeline: Images -> PDF -> Watermark -> Compress -> Password Protect -> Unlock    |
| - Language switch mid-operation preserved state verification                        |
| - Dark/Light mode toggle visual stability                                           |
+-------------------------------------------------------------------------------------+
| TIER 2: BOUNDARY CONDITIONS, ADVERSARIAL INPUTS & RESILIENCE                        |
| - 0-byte corrupt files, corrupted headers (graceful error toast without crash)      |
| - Malformed page ranges (e.g. "99-10, abc", "5-0") validation & error messaging     |
| - Thai Unicode strings in filenames, watermarks, metadata (`เอกสารลับ_สำเนาถูกต้อง`) |
+-------------------------------------------------------------------------------------+
| TIER 1: CORE TOOL FUNCTIONALITY (ALL 17 TOOLS)                                      |
| - Synthetic deterministic PDF test fixtures                                         |
| - Exact output page count, rotation flag, text layer, dimension verification        |
+-------------------------------------------------------------------------------------+
```

### 7.1 Automated Synthetic Fixture Generation
All automated tests utilize in-memory synthetic PDF generators (`test/fixtures/generator.ts`) to ensure self-contained, reproducible, and deterministic test executions without external network dependencies.

### 7.2 Verification Protocol
- All milestones (M1–M5) must verify:
  1. `tsc --noEmit` succeeds with zero TypeScript compilation errors.
  2. `npm run build` succeeds and produces optimized production assets.
  3. All automated verification tests pass 100%.

---

## 8. Conclusion

This `PROJECT.md` specification defines the complete, mathematically grounded, and privacy-first architectural master plan for **PDF Pro**. All 17 tools across 4 suites are systematically mapped to milestones M1 through M5 with unambiguous interface contracts, coordinate geometry standards, bilingual typography rules, and 4-tier verification criteria.
