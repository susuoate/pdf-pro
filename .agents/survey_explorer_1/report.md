# PDF Pro: Comprehensive Technical Architecture Survey Report
**Project:** PDF Pro (Client-Side First PDF Suite)  
**Author:** Survey Explorer 1  
**Date:** 2026-08-25  
**Version:** 1.0.0  

---

## 1. Executive Summary & High-Level Architecture

### 1.1 Project Objective
**PDF Pro** is a comprehensive, modern, production-grade PDF management web application inspired by iLovePDF (https://www.ilovepdf.com/). It provides a complete suite of browser-based PDF tools with zero-server-upload privacy (100% client-side processing using WebAssembly, Web Workers, and pure JavaScript), a clean, responsive UI/UX, full Thai (ภาษาไทย 🇹🇭) and English (🇬🇧) localization, real-time visual page previews, and dark/light theme switching.

### 1.2 Zero-Upload Privacy Principle
In traditional PDF web applications, files are uploaded to remote backend servers for processing, posing severe security, GDPR/PDPA compliance, and confidentiality risks. PDF Pro operates **100% on the client side**:
- Document parsing, rendering, manipulation, transformation, and saving happen strictly within the browser sandbox.
- No file data or user content is ever transmitted over network connections.
- Offline-capable architecture ensuring reliability regardless of network conditions.

```
+-----------------------------------------------------------------------------------+
|                                  PDF Pro UI                                       |
|  +-----------------------------------------------------------------------------+  |
|  | Dashboard | Organize Suite | Convert Suite | Edit Suite | Security Suite    |  |
|  +-----------------------------------------------------------------------------+  |
|                                       |                                           |
|                                       v                                           |
|  +-----------------------------------------------------------------------------+  |
|  |                       Presentation & State Layer                            |  |
|  | - React 18/19 + TypeScript + Tailwind CSS + Lucide Icons                    |  |
|  | - Tool State Hooks + i18n Context (TH/EN) + Theme Context (Dark/Light)      |  |
|  +-----------------------------------------------------------------------------+  |
|                                       |                                           |
|                                       v                                           |
|  +-----------------------------------------------------------------------------+  |
|  |                           Service / Engine Layer                            |  |
|  | +-----------------+ +-------------------+ +-----------------+ +-------------+ |
|  | | pdf-lib Engine  | | pdfjs-dist Engine | |  Tesseract OCR  | | HTML5 Canvas| |
|  | | (Manipulate,    | | (Render, Preview, | |  (Thai + Eng,   | | (Draw, Sign,| |
|  | |  Merge, Split,  | |  Thumbnail, High- | |   Worker-based, | |  Annotate,  | |
|  | |  Fonts, Encrypt)| |  Res Rasterize)   | |   IndexedDB)    | |  Redact)    | |
|  | +-----------------+ +-------------------+ +-----------------+ +-------------+ |
|  | +-------------------------------------------------------------------------+ | |
|  | | Packaging & Utility Services: JSZip, FileSaver, Compression Engine      | | |
|  | +-------------------------------------------------------------------------+ | |
|  +-----------------------------------------------------------------------------+  |
|                                       |                                           |
|                                       v                                           |
|  +-----------------------------------------------------------------------------+  |
|  |                     Browser Sandbox & Web Workers                           |  |
|  | - File System Access / Blob API / ArrayBuffer Memory Pool                   |  |
|  | - pdf.worker.min.mjs (PDF.js) & tesseract-worker.js (Tesseract.js)          |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

### 1.3 Recommended Core Tech Stack
| Component | Technology | Rationale |
|---|---|---|
| **Build & Bundler** | **Vite 5.x / 6.x** | Fast HMR, optimized ESM bundling, seamless Web Worker asset handling via `?url`. |
| **Framework** | **React 18 / 19** | Component-based UI, concurrent rendering, rich hooks ecosystem. |
| **Language** | **TypeScript 5.x** | Strict typing for PDF data structures, geometry math, and API boundaries. |
| **Styling** | **Tailwind CSS 3.x** | Rapid responsive design, class-based dark mode, zero runtime CSS overhead. |
| **Icons** | **Lucide React** | Clean, modern, tree-shakeable icon set matching modern web standards. |
| **PDF Manipulation** | **`pdf-lib` / `@cantoo/pdf-lib`** | Pure client-side PDF creation, merging, splitting, rotation, metadata, and encryption. |
| **Font Shaping** | **`@pdf-lib/fontkit`** | TrueType/OpenType font embedding required for Thai (Unicode) text rendering. |
| **PDF Rendering** | **`pdfjs-dist` (v4.x / v3.x)** | High-fidelity PDF-to-canvas rendering, vector text display, thumbnail generation. |
| **OCR Engine** | **`tesseract.js` (v5+)** | Pure client-side WebAssembly OCR with support for `eng` and `tha` traineddata. |
| **Archive Packaging** | **`jszip` & FileSaver** | In-browser ZIP compression for multi-page image/split PDF exports. |
| **Canvas & Graphics** | **HTML5 Canvas 2D API** | Real-time drawing, annotation overlays, signatures, and rasterization. |

---

## 2. Comprehensive Tool Suite Architecture & Engine Design

The application provides 4 primary suites containing 15 distinct tools:

```
PDF PRO TOOL MATRIX
├── 1. Organize PDF Suite
│   ├── Merge PDF
│   ├── Split PDF
│   ├── Organize & Reorder
│   ├── Rotate PDF
│   └── Remove / Extract Pages
├── 2. Convert & Optimize Suite
│   ├── Images to PDF (JPG/PNG/WebP -> PDF)
│   ├── PDF to Images (PDF -> JPG/PNG + ZIP)
│   ├── Compress PDF (Client-side resampling & optimization)
│   └── OCR & Text Extraction (Multilingual Thai + English)
├── 3. Edit & Annotate Suite
│   ├── PDF Editor (Text, Shapes, Freehand Pen, Highlighters, Stamps)
│   ├── Add Watermark (Text/Image with 9-grid anchor & rotation)
│   └── Add Page Numbers (Custom templates, headers/footers, styling)
└── 4. Security & Privacy Suite
    ├── Sign PDF (Draw, Type, Upload signature + placement)
    ├── Protect PDF (Password encryption)
    ├── Unlock PDF (Password decryption)
    ├── Redact PDF (True permanent blackout rasterization)
    └── Metadata Editor (Title, Author, Subject, Keywords, Creator)
```

---

### 2.1 Suite 1: Organize PDF

#### 2.1.1 Merge PDF
- **Workflow**:
  1. User selects/drags multiple PDF files.
  2. UI displays draggable file cards with page counts and initial page thumbnails.
  3. User reorders file cards via drag-and-drop.
  4. Engine creates a new `PDFDocument.create()`.
  5. For each file in order, `PDFDocument.load(fileBytes)` is called, all pages are copied via `destDoc.copyPages(srcDoc, srcDoc.getPageIndices())`, and appended via `destDoc.addPage(page)`.
  6. Output is saved to `Uint8Array` via `destDoc.save()` and downloaded.

```typescript
// Core Merge Algorithm
export async function mergePDFs(pdfFiles: ArrayBuffer[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();
  for (const fileBytes of pdfFiles) {
    const srcPdf = await PDFDocument.load(fileBytes);
    const copiedPages = await mergedPdf.copyPages(srcPdf, srcPdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }
  return await mergedPdf.save();
}
```

#### 2.1.2 Split PDF
- **Modes**:
  - **Custom Page Ranges**: User specifies ranges (e.g., `1-3, 5, 7-10`).
  - **Extract All Pages**: Every page is split into its own independent PDF.
- **Workflow**:
  1. Parse range string (supporting 1-indexed comma-separated ranges).
  2. Load source PDF.
  3. For each split group/page:
     - Create new `PDFDocument`.
     - Copy target pages from source.
     - Add to new document and call `save()`.
  4. If multiple files are generated, package into a `.zip` archive using `JSZip` or provide individual downloads.

#### 2.1.3 Organize & Reorder PDF
- **Workflow**:
  1. Render visual grid of all document pages with live thumbnails generated via `pdfjs-dist`.
  2. Each page card supports:
     - Drag-and-drop reordering (updating page order array).
     - Individual page rotation (90° increments).
     - Quick delete toggle (marking page as removed).
     - Duplicate page button.
  3. On export:
     - Create new `PDFDocument`.
     - Copy pages in the new specified sequence.
     - Apply custom rotations (`page.setRotation(degrees(newRotation))`).
     - Save and download new PDF.

#### 2.1.4 Rotate PDF
- **Workflow**:
  - Global rotation: Rotate all pages by +90°, -90°, or 180°.
  - Per-page rotation: Click thumbnail to rotate specific pages.
  - Implementation:
    ```typescript
    const currentRotation = page.getRotation().angle;
    page.setRotation(degrees((currentRotation + rotateBy) % 360));
    ```

#### 2.1.5 Remove / Extract Pages
- **Workflow**:
  - User views thumbnail grid and checks/selects pages.
  - **Remove Mode**: Inverts selection and creates PDF containing only unchecked pages.
  - **Extract Mode**: Creates a new PDF containing only selected pages, or extracts each selected page into separate files packaged in a ZIP.

---

### 2.2 Suite 2: Convert & Optimize PDF

#### 2.2.1 Images to PDF
- **Input Formats**: JPEG, PNG, WebP.
- **Options**:
  - Page Size: `A4` (595.28 x 841.89 pt), `US Letter` (612 x 792 pt), or `Fit to Image` (matches image pixel dimensions converted to 72 DPI points).
  - Orientation: `Portrait`, `Landscape`, or `Auto` (matches image aspect ratio).
  - Margins: `None` (0 pt), `Small` (20 pt), `Big` (40 pt).
  - Image Quality / Compression.
- **Implementation**:
  ```typescript
  // Embedding JPG/PNG in pdf-lib
  const pdfDoc = await PDFDocument.create();
  for (const imgData of images) {
    let embeddedImage;
    if (imgData.type === 'image/jpeg') {
      embeddedImage = await pdfDoc.embedJpg(imgData.bytes);
    } else {
      // PNG & WebP (converted to PNG via Canvas if needed)
      embeddedImage = await pdfDoc.embedPng(imgData.bytes);
    }
    
    // Compute bounding box with margins and aspect ratio fitting
    const { width, height } = calculateFitDimensions(
      embeddedImage.width,
      embeddedImage.height,
      pageWidth - 2 * margin,
      pageHeight - 2 * margin
    );
    
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    page.drawImage(embeddedImage, {
      x: (pageWidth - width) / 2,
      y: (pageHeight - height) / 2,
      width,
      height,
    });
  }
  ```

#### 2.2.2 PDF to Images
- **Workflow**:
  1. User selects target format: `JPEG` or `PNG`.
  2. User selects resolution scale factor: `1x` (72 DPI), `2x` (144 DPI - high quality), `3x` (216 DPI - ultra crisp).
  3. `pdfjs-dist` renders each page sequentially onto an offscreen canvas.
  4. Canvas is exported via `canvas.toBlob('image/png')` or `canvas.toBlob('image/jpeg', 0.92)`.
  5. Single page documents trigger direct image download; multi-page documents are packed into a `.zip` archive via `JSZip` and named `page-1.jpg`, `page-2.jpg`, etc.

#### 2.2.3 Compress & Optimize PDF
- **Engine Strategy**:
  Since standard `pdf-lib` does not provide an automated raster image recompression pipeline, PDF Pro uses a dual-level optimization strategy:
  1. **Structural Optimization (Fast)**:
     - Remove unused objects, strip redundant metadata, enable stream compression in `pdf-lib` (`useObjectStreams: true`).
  2. **Visual Resampling Compression (Deep)**:
     - Render pages to high-resolution canvas at controlled DPI (e.g. 150 DPI for Recommended, 100 DPI for Extreme).
     - Compress canvas to progressive JPEG (quality 0.7 for Recommended, 0.4 for Extreme).
     - Reassemble into an optimized PDF document.
  3. **Diff Estimation UI**:
     - Real-time before/after size calculation (e.g. `12.4 MB -> 3.2 MB (74% reduction)`).

```typescript
export interface CompressionOptions {
  level: 'extreme' | 'recommended' | 'low';
  dpi: number;       // 96, 150, 200
  quality: number;   // 0.4, 0.7, 0.88
}
```

#### 2.2.4 OCR & Text Extraction (Multilingual: Thai + English)
- **Engine**: `tesseract.js` (v5+) WebAssembly worker.
- **Workflow**:
  1. Load PDF pages and rasterize to canvas at high DPI (200-300 DPI for optimal OCR accuracy).
  2. Initialize Tesseract worker with `'eng+tha'` (or user-chosen language).
  3. Pass canvas data to `worker.recognize(canvas)`.
  4. Real-time progress callback reports recognition percentage:
     ```typescript
     const worker = await createWorker('eng+tha', 1, {
       logger: (m) => onProgress(m.status, m.progress),
     });
     ```
  5. Output:
     - Editable extracted text preview with search and copy-to-clipboard.
     - Download as `.txt` or `.json` (with character/word bounding boxes).
     - Optional: Generate searchable PDF with invisible text layer overlaid using `pdf-lib`.

---

### 2.3 Suite 3: Edit & Annotate PDF

#### 2.3.1 PDF Editor
The PDF Editor provides an interactive annotation layer on top of the rendered PDF canvas:
- **Tools**:
  - **Text Box**: Editable text with customizable font size, font family, color, bold/italic, background fill, and border.
  - **Freehand Pen**: Smooth stroke drawing using quadratic bezier curve interpolation between mouse/touch points, configurable brush stroke width, color, and opacity.
  - **Highlighter**: Semi-transparent yellow/green/pink/blue highlighter pen with `globalCompositeOperation = 'multiply'` or 40% alpha.
  - **Shapes**: Rectangle (outline/fill), Circle/Ellipse, Straight Line, Arrow.
  - **Stamp / Image Insertion**: Upload PNG/JPG stamp or logo, resize, and place.
- **Baking Annotations to PDF**:
  When the user clicks "Save & Export", all annotations are converted from Canvas screen space to PDF points and drawn into the underlying `PDFDocument` using `pdf-lib` primitive draw calls (`drawText`, `drawRectangle`, `drawEllipse`, `drawLine`, `drawImage`, `drawSvgPath`).

#### 2.3.2 Add Watermark
- **Modes**:
  - **Text Watermark**: Custom text (e.g., "CONFIDENTIAL", "DRAFT", "สำเนาถูกต้อง"), font size, color, opacity (0.1 - 1.0), rotation angle (-180° to 180°).
  - **Image Watermark**: Upload company logo / stamp image, scale percentage, opacity.
- **Positioning**:
  - 9-grid anchor positions:
    - Top-Left, Top-Center, Top-Right
    - Middle-Left, Center, Middle-Right
    - Bottom-Left, Bottom-Center, Bottom-Right
  - Custom X/Y offsets from anchor.
- **Page Selection**: Apply to all pages, odd pages, even pages, or specific page range.
- **Layering**: Foreground (above content) or Background (behind content).

#### 2.3.3 Add Page Numbers
- **Template Formats**:
  - Simple: `1`
  - Page of Total: `Page {n} of {total}`
  - Fraction: `{n} / {total}`
  - Thai Format: `หน้า {n} จาก {total}`
  - Custom prefix/suffix: `- {n} -`
- **Positioning**:
  - Header: Top-Left, Top-Center, Top-Right
  - Footer: Bottom-Left, Bottom-Center, Bottom-Right
  - Margin distance from edge (default: 30 pt).
- **Styling**:
  - Font size (8 pt - 24 pt), font color, font family (including Thai Unicode fonts).
  - Start numbering at specific page (e.g., skip cover page, start at page 2 as #1).
  - Range filter (e.g., only pages 2 to end).

---

### 2.4 Suite 4: Security & Privacy

#### 2.4.1 Sign PDF
- **Signature Input Modes**:
  1. **Draw**: Interactive canvas signature pad with smooth stroke smoothing (velocity-based stroke width).
  2. **Type**: User types their name (in English or Thai), rendered in elegant cursive/calligraphy script font onto canvas.
  3. **Upload**: User uploads an existing signature image (JPG/PNG) with optional automatic background removal / white transparency thresholding.
- **Placement**:
  - Draggable, resizable bounding box on top of the document page.
  - Date stamp & signer title attachment option.
  - Multi-page placement capability.
- **Export**:
  - Signature raster is converted to PNG bytes and embedded via `pdfDoc.embedPng()`, drawn at the calculated PDF coordinate box.

#### 2.4.2 Protect PDF (Password Encryption)
- Sets User Password (required to open and view the document) and Owner Password (controls permissions like printing, copying text, modifying).
- Implemented via `@cantoo/pdf-lib` standard encryption algorithms (RC4 128-bit / AES-128 / AES-256 standard PDF security handlers).

#### 2.4.3 Unlock PDF (Password Decryption)
- User enters the password for an encrypted PDF.
- `@cantoo/pdf-lib` loads the document with the provided `password` parameter:
  ```typescript
  const pdfDoc = await PDFDocument.load(fileBytes, { password: userPassword });
  const unlockedBytes = await pdfDoc.save(); // Saved without encryption dictionaries
  ```
- Generates a completely unlocked PDF file for direct download.

#### 2.4.4 Redact PDF (True Permanent Blackout)
- **Security Vulnerability Warning**: In naive PDF editors, adding a black rectangle on top of text leaves the underlying text stream in the PDF! Anyone can select and copy the text underneath.
- **PDF Pro True Redaction Solution**:
  1. User selects redaction bounding box(es).
  2. The page is rendered to canvas via `pdfjs-dist`.
  3. Blackout rectangles are drawn onto the canvas at high DPI.
  4. The redacted page is rasterized into a clean, flattened image where the confidential pixel data is permanently erased.
  5. The flattened image replaces the original page in the new PDF, guaranteeing **100% irreversible redaction**.

#### 2.4.5 Metadata Editor
- View and modify document information dictionary:
  - Title (`pdfDoc.setTitle(...)`)
  - Author (`pdfDoc.setAuthor(...)`)
  - Subject (`pdfDoc.setSubject(...)`)
  - Keywords (`pdfDoc.setKeywords(...)`)
  - Creator (`pdfDoc.setCreator(...)`)
  - Producer (`pdfDoc.setProducer(...)`)
  - Creation Date (`pdfDoc.setCreationDate(...)`)
  - Modification Date (`pdfDoc.setModificationDate(...)`)
- Option to "Sanitize / Strip All Metadata" for privacy before sharing.

---

## 3. Deep-Dive: Coordinate Systems & Geometric Mapping

One of the most critical engineering challenges in browser-based PDF editing is the translation between three distinct coordinate spaces:

```
+-----------------------------------------------------------------------------+
| 1. Web / Screen CSS Space:                                                  |
|    - Top-left origin (0, 0)                                                 |
|    - Units: CSS Pixels (affected by display zoom, responsive container width) |
+-----------------------------------------------------------------------------+
                                       |
                                       v  (scale factor = devicePixelRatio * renderScale)
+-----------------------------------------------------------------------------+
| 2. HTML5 Canvas Pixel Space:                                                |
|    - Top-left origin (0, 0)                                                 |
|    - Units: Physical Device Pixels (e.g. 2x or 3x for crisp Retina display)  |
+-----------------------------------------------------------------------------+
                                       |
                                       v  (coordinate transformation matrix)
+-----------------------------------------------------------------------------+
| 3. PDF User Unit Space (PDF-Lib):                                           |
|    - Bottom-left origin (0, 0)                                              |
|    - Units: Points (1 point = 1/72 inch; A4 = 595.28 x 841.89 pt)           |
|    - Affected by page rotation (0°, 90°, 180°, 270°)                        |
+-----------------------------------------------------------------------------+
```

### 3.1 Mathematical Transform Formulas

Given:
- $W_{pdf}, H_{pdf}$: Dimensions of the PDF page in points (from `page.getSize()`).
- $W_{viewport}, H_{viewport}$: Dimensions of the rendered viewport on screen.
- $(X_{screen}, Y_{screen})$: Screen coordinate of an annotation (origin at top-left).
- $(W_{screen}, H_{screen})$: Width and height of the annotation on screen.

#### Case 1: Standard Unrotated Page (Rotation = 0°)
$$X_{pdf} = X_{screen} \times \left(\frac{W_{pdf}}{W_{viewport}}\right)$$
$$Y_{pdf} = H_{pdf} - \left( (Y_{screen} + H_{screen}) \times \left(\frac{H_{pdf}}{H_{viewport}}\right) \right)$$
$$W_{pdf\_box} = W_{screen} \times \left(\frac{W_{pdf}}{W_{viewport}}\right)$$
$$H_{pdf\_box} = H_{screen} \times \left(\frac{H_{pdf}}{H_{viewport}}\right)$$

#### Case 2: Rotated Pages (90°, 180°, 270°)
When a PDF page has an internal rotation angle `page.getRotation().angle`, the visual top-left on screen does not correspond to the physical page coordinate (0, H). The transformer utility must apply rotation transformation:

```typescript
export interface PDFCoordinate {
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
): PDFCoordinate {
  const scaleX = pdfPageSize.width / viewportSize.width;
  const scaleY = pdfPageSize.height / viewportSize.height;

  const normalizedRotation = ((rotationAngle % 360) + 360) % 360;

  switch (normalizedRotation) {
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

## 4. Deep-Dive: Thai (ภาษาไทย 🇹🇭) & Unicode Typography Architecture

### 4.1 The WinAnsi Limitation in Standard `pdf-lib`
Standard `pdf-lib` includes 14 built-in standard fonts (Helvetica, Times Roman, Courier, Symbol, ZapfDingbats). These fonts are strictly encoded in **WinAnsi (Windows-1252)** and do not contain Unicode glyphs.
- Attempting to pass Thai characters (e.g. `สวัสดี`, `เอกสารลับ`, `หน้า 1 จาก 10`) to standard `StandardFonts.Helvetica` throws a runtime error or produces corrupt placeholder glyphs (`?` or square boxes).

### 4.2 Fontkit & TrueType Font Embedding Solution
To support Thai and universal Unicode text across watermarks, page numbers, text annotations, and typed signatures:
1. **Dependency**: `@pdf-lib/fontkit` is registered to the `PDFDocument`.
2. **Font Files**: Include clean Unicode TrueType font files:
   - `Sarabun-Regular.ttf` & `Sarabun-Bold.ttf` (The official Thai National Standard Font).
   - `Prompt-Regular.ttf` (Modern Thai geometric sans-serif).
   - `NotoSansThai-Regular.ttf` (Google Noto Unicode standard).
3. **Static Asset Loading**:
   Store font files in `public/fonts/` and fetch them as `ArrayBuffer` on demand, cached in an in-memory font cache.

```typescript
// services/fontService.ts
import { PDFDocument, PDFFont } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

class FontManager {
  private fontCache: Map<string, ArrayBuffer> = new Map();

  async getFontBytes(fontName: string): Promise<ArrayBuffer> {
    if (this.fontCache.has(fontName)) {
      return this.fontCache.get(fontName)!;
    }
    const response = await fetch(`/fonts/${fontName}.ttf`);
    if (!response.ok) {
      throw new Error(`Failed to load font: ${fontName}`);
    }
    const bytes = await response.arrayBuffer();
    this.fontCache.set(fontName, bytes);
    return bytes;
  }

  async embedThaiFont(pdfDoc: PDFDocument, fontName: string = 'Sarabun-Regular'): Promise<PDFFont> {
    pdfDoc.registerFontkit(fontkit);
    const fontBytes = await this.getFontBytes(fontName);
    return await pdfDoc.embedFont(fontBytes, { subset: true });
  }
}

export const fontManager = new FontManager();
```

---

## 5. Deep-Dive: Web Worker & Async Bundling in Vite

Heavy PDF operations (multi-page rasterization, OCR recognition) must not block the main browser UI thread.

### 5.1 `pdfjs-dist` Worker Bundling in Vite
In Vite, `pdfjs-dist` worker must be bundled as an asset URL.

#### Recommended Implementation:
```typescript
// services/pdfRenderer.ts
import * as pdfjsLib from 'pdfjs-dist';
// Use Vite's ?url asset import
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;
```

#### TypeScript Declaration Support:
Add to `src/vite-env.d.ts`:
```typescript
/// <reference types="vite/client" />

declare module '*?url' {
  const content: string;
  export default content;
}
```

#### Public Folder Fallback Strategy:
If worker cross-origin issues arise in certain strict enterprise hosting environments:
- Copy `node_modules/pdfjs-dist/build/pdf.worker.min.mjs` to `public/pdf.worker.min.mjs`.
- Set `pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'`.

### 5.2 `tesseract.js` Worker & Traineddata Caching
`tesseract.js` (v5+) uses WebAssembly and Web Workers.
- For Thai and English OCR, the worker fetches language traineddata files (`eng.traineddata.gz` and `tha.traineddata.gz`).
- `tesseract.js` automatically caches these traineddata files in the browser's **IndexedDB**, ensuring subsequent OCR operations are instantaneous without re-downloading traineddata.
- Progress monitoring hook updates the UI with fine-grained status (loading model -> initializing -> recognizing text).

```typescript
// services/ocrService.ts
import { createWorker, Worker } from 'tesseract.js';

export async function performOcr(
  imageSource: HTMLCanvasElement | Blob | string,
  lang: 'eng' | 'tha' | 'eng+tha' = 'eng+tha',
  onProgress?: (progress: number, status: string) => void
): Promise<{ text: string; confidence: number }> {
  const worker: Worker = await createWorker(lang, 1, {
    logger: (m) => {
      if (onProgress && m.progress !== undefined) {
        onProgress(m.progress, m.status);
      }
    },
  });

  try {
    const result = await worker.recognize(imageSource);
    return {
      text: result.data.text,
      confidence: result.data.confidence,
    };
  } finally {
    await worker.terminate();
  }
}
```

---

## 6. UI/UX, Localization (i18n), and Design System

### 6.1 Design System & Theme Architecture
- **Palette**: Professional Indigo/Blue primary (`#4F46E5` / `#3B82F6`), Slate/Zinc neutrals, vibrant accent badges for tool categories.
- **Dark Mode**: Complete Dark Theme support via Tailwind `dark:` classes with smooth transitions and persistent `localStorage` preference.
- **Layout Structure**:
  - **Top Navigation Bar**: Brand logo, quick category tabs, Language Switcher (🇹🇭 TH / 🇬🇧 EN), Theme Toggle (🌙 / ☀️), Github/Info link.
  - **Hero & Search Bar**: Instant real-time tool search with fuzzy keyword matching in both Thai and English (e.g. searching "รวมไฟล์" or "merge" highlights Merge PDF).
  - **Category Filter Tabs**: `All Tools`, `Organize`, `Convert & Optimize`, `Edit & Annotate`, `Security & Privacy`.
  - **Tool Cards Grid**: Modern card layout with tool icon, title, description, category badge, and hover animation.
  - **Interactive Workspace**: Unified tool canvas with drag-and-drop file upload zone, live page thumbnail ribbon/grid, tool-specific parameter sidebar, and action buttons.

### 6.2 Dual-Language Localization (i18n)
A lightweight, reactive, zero-dependency i18n system:
- Type-safe dictionary covering all UI labels, tool descriptions, error messages, and dialogs.
- Instant live language switching without page reloads.

```typescript
// locales/types.ts
export type Language = 'en' | 'th';

export interface TranslationDictionary {
  common: {
    uploadPrompt: string;
    dropHere: string;
    processing: string;
    download: string;
    cancel: string;
    save: string;
    page: string;
    of: string;
    rotate: string;
    delete: string;
    // ...
  };
  tools: {
    merge: { title: string; description: string; action: string };
    split: { title: string; description: string; action: string };
    organize: { title: string; description: string; action: string };
    compress: { title: string; description: string; action: string };
    ocr: { title: string; description: string; action: string };
    watermark: { title: string; description: string; action: string };
    pageNumbers: { title: string; description: string; action: string };
    sign: { title: string; description: string; action: string };
    protect: { title: string; description: string; action: string };
    unlock: { title: string; description: string; action: string };
    redact: { title: string; description: string; action: string };
    // ...
  };
}
```

---

## 7. Recommended Project Layout & Module Boundaries

The optimal directory structure ensures clean modularity, strict separation of concerns, and ease of maintainability:

```
c:\Users\oate_\Desktop\pdf pro/
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
│   └── pdf.worker.min.mjs (optional fallback)
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── vite-env.d.ts
│   │
│   ├── types/                     # Core TypeScript models & interfaces
│   │   ├── pdf.ts                 # Page info, document metadata, rotation
│   │   ├── tool.ts                # Tool definitions, categories, registry
│   │   ├── annotation.ts          # Drawing, shapes, text, watermark, signature models
│   │   └── i18n.ts                # Localization types
│   │
│   ├── locales/                   # Translation dictionaries
│   │   ├── en.ts                  # English translations
│   │   ├── th.ts                  # Thai (ภาษาไทย) translations
│   │   └── index.ts               # i18n provider & hooks
│   │
│   ├── context/                   # Global React Contexts
│   │   ├── ThemeContext.tsx       # Dark/Light theme provider
│   │   └── LanguageContext.tsx    # i18n provider
│   │
│   ├── services/                  # PDF Engine & Transformation Services (Zero UI)
│   │   ├── pdfLibService.ts       # Merge, split, organize, rotate, metadata, protect
│   │   ├── pdfRendererService.ts  # pdfjs-dist rendering, thumbnail generation, canvas extraction
│   │   ├── ocrService.ts          # Tesseract.js worker management & recognition
│   │   ├── compressionService.ts  # Image downsampling & PDF size reduction
│   │   ├── fontService.ts         # Fontkit registration & Thai font embedding
│   │   ├── watermarkService.ts    # 9-grid anchor calculations & watermark embedding
│   │   ├── pageNumberService.ts   # Page numbering formatters & position embedding
│   │   ├── signatureService.ts    # Signature canvas smoothing & rasterization
│   │   └── zipService.ts          # JSZip packaging & multi-file export
│   │
│   ├── hooks/                     # Custom React Hooks
│   │   ├── usePDFDocument.ts      # Loading, caching, and managing active PDF file
│   │   ├── usePageThumbnails.ts   # Asynchronous thumbnail generator with cancellation
│   │   ├── useCanvasDrawer.ts     # Freehand drawing, paths, and shape math
│   │   └── useFileDrop.ts         # Drag-and-drop file ingestion & validation
│   │
│   ├── components/                # Reusable UI Components
│   │   ├── layout/
│   │   │   ├── Navbar.tsx         # Header with theme toggle & language switch
│   │   │   ├── Footer.tsx         # Footer with privacy notice
│   │   │   └── Container.tsx
│   │   ├── common/
│   │   │   ├── FileUploadZone.tsx # Drag & drop zone with multi-file support
│   │   │   ├── PageThumbnail.tsx  # Interactive page preview card
│   │   │   ├── ProgressBar.tsx    # Step & byte progress indicator
│   │   │   ├── Modal.tsx          # Dialog modal for alerts/settings
│   │   │   └── Button.tsx
│   │   └── viewer/
│   │       ├── PDFCanvasViewer.tsx# High-resolution interactive canvas viewer
│   │       └── AnnotationOverlay.tsx # Overlay layer for drawing/stamping
│   │
│   └── tools/                     # Dedicated Tool Workspace Views
│       ├── Dashboard.tsx          # Main tool catalog & search view
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
```

---

## 8. Package Dependencies Matrix

Below is the verified package dependency matrix recommended for `package.json`:

```json
{
  "name": "pdf-pro",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "pdf-lib": "^1.17.9",
    "@cantoo/pdf-lib": "^1.23.0",
    "@pdf-lib/fontkit": "^1.1.1",
    "pdfjs-dist": "^4.5.136",
    "tesseract.js": "^5.1.1",
    "jszip": "^3.10.1",
    "file-saver": "^2.0.5",
    "lucide-react": "^0.436.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.2"
  },
  "devDependencies": {
    "@types/react": "^18.3.5",
    "@types/react-dom": "^18.3.0",
    "@types/file-saver": "^2.0.7",
    "@vitejs/plugin-react": "^4.3.1",
    "typescript": "^5.5.3",
    "vite": "^5.4.2",
    "tailwindcss": "^3.4.10",
    "postcss": "^8.4.41",
    "autoprefixer": "^10.4.20"
  }
}
```

*Note: For Windows PowerShell environments, using `npm.cmd` ensures reliable script execution.*

---

## 9. Key Technical Pitfalls & Risk Mitigation

| Potential Risk | Technical Cause | Architectural Mitigation |
|---|---|---|
| **Thai text rendering crash in `pdf-lib`** | Standard 14 PDF fonts only support WinAnsi (ASCII/Latin-1). | Register `@pdf-lib/fontkit` and embed TrueType Unicode fonts (`Sarabun-Regular.ttf` / `Prompt-Regular.ttf`). |
| **`pdfjs-dist` worker loading failure in Vite** | Vite ESM bundler transforms paths; missing worker URL results in main-thread parsing crash. | Use `import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'` and set `pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker`. |
| **Insecure / Fake Redaction** | Naive editors only draw a black rectangle on top of the visual layer, leaving selectable text underneath. | Implement **true rasterization redaction**: render page to canvas, erase data permanently, and re-encode page image. |
| **High Memory Consumption on Large PDFs** | Rendering 100+ pages simultaneously causes browser tab crashes (OOM). | Implement virtualized thumbnail rendering; render thumbnails only when visible in viewport, release canvas memory after rasterization. |
| **Password Protected PDF crashes** | Standard `PDFDocument.load()` throws `EncryptedPDFError`. | Catch `EncryptedPDFError` gracefully in UI; prompt user for password dialog; decrypt via `@cantoo/pdf-lib` or `pdfjs-dist`. |
| **Tesseract OCR Network Latency** | Downloading multi-megabyte traineddata models on each run. | Leverage `tesseract.js` built-in IndexedDB caching; display clear progress feedback during initial language model download. |

---

## 10. Conclusion & Architectural Recommendation

The client-side architecture surveyed herein achieves:
1. **100% Zero-Upload Privacy**: Fully compliant with enterprise data protection and privacy standards.
2. **Complete Feature Parity**: Comprehensive coverage across Organize, Convert, Edit, and Security suites.
3. **High Performance**: Asynchronous worker execution for rendering and OCR, hardware-accelerated canvas overlays, and responsive rendering.
4. **Flawless Thai & English Localization**: Dual-language typography with custom TrueType font embedding and instant dictionary switching.

This architectural blueprint provides the necessary foundation for immediate implementation.
