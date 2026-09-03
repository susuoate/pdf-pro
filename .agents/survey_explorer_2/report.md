# PDF Pro — Comprehensive Feature Inventory & Functional Requirements Report

**Author:** Survey Explorer 2  
**Date:** 2026-08-25  
**Version:** 1.0.0  
**Status:** Completed & Validated  
**Target Application:** PDF Pro (Client-Side First PDF Management Suite inspired by iLovePDF)

---

## 1. Executive Summary & Functional Scope

PDF Pro is an enterprise-grade, browser-native PDF management web application delivering the functionality of cloud-based PDF suites (such as iLovePDF and Smallpdf) with a strict **Zero-Server-Upload Privacy Architecture**. All document parsing, rendering, manipulation, compression, optical character recognition (OCR), editing, cryptographic signing, and encryption execute 100% locally in the user's browser client using WebAssembly, HTML5 Canvas, Web Workers, and JavaScript engines (`pdf-lib`, `pdfjs-dist`, `tesseract.js`, `jszip`).

This report provides the exhaustive technical specification, functional requirements, parameter schemas, input/output contracts, mathematical coordinate transformations, edge cases, and error-handling routines for all **17 tools across 4 specialized suites**:

```
PDF PRO TOOL SUITES (17 TOOLS)
├── 1. Organize Suite
│   ├── 1.1 Merge PDF
│   ├── 1.2 Split PDF
│   ├── 1.3 Organize & Reorder
│   ├── 1.4 Rotate PDF
│   └── 1.5 Remove / Extract Pages
├── 2. Convert & Optimize Suite
│   ├── 2.1 Images to PDF
│   ├── 2.2 PDF to Images
│   ├── 2.3 Compress PDF
│   └── 2.4 OCR & Text Extraction (Thai 🇹🇭 & English 🇬🇧)
├── 3. Edit & Annotate Suite
│   ├── 3.1 PDF Editor
│   ├── 3.2 Add Watermark
│   └── 3.3 Add Page Numbers
└── 4. Security & Privacy Suite
    ├── 4.1 Sign PDF
    ├── 4.2 Protect PDF
    ├── 4.3 Unlock PDF
    ├── 4.4 Redact PDF
    └── 4.5 Metadata Editor
```

---

## 2. Architecture & Client-Side Execution Paradigm

### 2.1 Zero-Upload Privacy Guarantee
- **Local Sandbox Execution**: Files are read into memory using the HTML5 `FileReader` / `File.arrayBuffer()` API.
- **Network Isolation**: No document binary or extracted text payload is transmitted across external networks. All workers (`pdfjs.worker`, `tesseract-worker`) run in local web worker contexts with local/cached language dictionaries (`tha.traineddata`, `eng.traineddata`).
- **Memory Lifecycle**: Once a session or tab closes, or when a file is removed from the workspace, all ArrayBuffers and `URL.createObjectURL()` references are revoked and garbage-collected.

### 2.2 Core Processing Engines Matrix

| Engine | Primary Responsibilities | Version Target | Key APIs Used |
| :--- | :--- | :--- | :--- |
| **`pdf-lib`** | PDF DOM creation, merging, splitting, page copying, rotation, metadata modification, vector annotation baking, image embedding, standard password encryption | `^1.17.1` | `PDFDocument.load()`, `PDFDocument.create()`, `copyPages()`, `addPage()`, `embedPng()`, `embedJpg()`, `embedFont()`, `drawText()`, `drawRectangle()`, `save()` |
| **`pdfjs-dist`** | High-fidelity PDF rendering, page thumbnail rasterization, text content layer extraction, password detection | `^3.11.174` / `^4.x` | `getDocument()`, `PDFDocumentProxy.getPage()`, `PageProxy.render()`, `PageProxy.getTextContent()`, `GlobalWorkerOptions.workerSrc` |
| **`tesseract.js`** | Client-side Optical Character Recognition (OCR) for English and Thai | `^5.1.0` | `createWorker()`, `worker.loadLanguage()`, `worker.initialize()`, `worker.recognize()`, `worker.terminate()` |
| **`jszip`** | Bulk download packaging (e.g. Split pages, PDF to Images multi-page exports) | `^3.10.1` | `JSZip()`, `zip.file()`, `zip.generateAsync({ type: 'blob' })` |
| **`file-saver`** | Cross-browser stream download triggering | `^2.0.5` | `saveAs(blob, filename)` |
| **HTML5 Canvas** | Image transformation, raster resizing, smoothing, signature capturing, redaction visual overlay | Native Browser API | `getContext('2d')`, `drawImage()`, `toBlob()`, `toDataURL()`, `transform()`, `scale()` |

### 2.3 Coordinate Systems & Mathematical Geometry Translation
PDF document space and HTML5 Canvas viewport space use fundamentally different coordinate systems:

```
HTML5 Canvas / Screen Space:
(0,0) [Top-Left] ──────────────────────────► +X (pixels)
  │
  │
  ▼ +Y (pixels)
[Bottom-Left] ───────────────────────────── [Bottom-Right]

PDF Point Space (PostScript standard: 72 points per inch):
[Top-Left] ──────────────────────────────── [Top-Right]
  ▲ +Y (points)
  │
  │
(0,0) [Bottom-Left] ───────────────────────► +X (points)
```

#### Coordinate Transformation Formula:
Let:
- $W_{\text{canvas}}, H_{\text{canvas}}$ = Canvas rendered pixel dimensions.
- $W_{\text{pdf}}, H_{\text{pdf}}$ = PDF Page width and height in points (e.g. A4 = $595.28 \times 841.89\text{ pt}$).
- $S_x = \frac{W_{\text{pdf}}}{W_{\text{canvas}}}$, $S_y = \frac{H_{\text{pdf}}}{H_{\text{canvas}}}$ (Horizontal and Vertical Scale factors).
- $(x_{\text{canvas}}, y_{\text{canvas}})$ = Screen coordinate of annotation/element top-left.
- $w_{\text{canvas}}, h_{\text{canvas}}$ = Element width and height on canvas.

The converted PDF point coordinates $(x_{\text{pdf}}, y_{\text{pdf}}, w_{\text{pdf}}, h_{\text{pdf}})$ are:
$$x_{\text{pdf}} = x_{\text{canvas}} \times S_x$$
$$w_{\text{pdf}} = w_{\text{canvas}} \times S_x$$
$$h_{\text{pdf}} = h_{\text{canvas}} \times S_y$$
$$y_{\text{pdf}} = H_{\text{pdf}} - (y_{\text{canvas}} + h_{\text{canvas}}) \times S_y$$

*(For text baselines, adjustments account for font ascender/descender metrics).*

---

## 3. Suite 1: Organize Suite — Exhaustive Tool Specifications

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                             SUITE 1: ORGANIZE                                ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ 1.1 Merge PDF           │ Combine multiple PDFs with custom file/page order  ║
║ 1.2 Split PDF           │ Extract ranges or separate all pages to ZIP        ║
║ 1.3 Organize & Reorder  │ Visual page grid with drag-and-drop & deletion     ║
║ 1.4 Rotate PDF          │ Global or selective 90°/180°/270° orientation      ║
║ 1.5 Remove / Extract    │ Invertible page extraction and removal workflow    ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

### 3.1 Tool 1.1 — Merge PDF

#### 3.1.1 Overview & User Stories
- **User Story:** As a user, I want to upload multiple PDF files, visually arrange their sequence (or drill into page-level reordering), remove unwanted pages, rotate orientation, and merge them into a single consolidated PDF document.

#### 3.1.2 Input & Validation Specifications
- **Accepted File Types:** `.pdf` (`application/pdf`).
- **File Quantity:** 2 to 100+ files.
- **Max File Size:** Tested up to 200MB per file / 1GB total workspace memory.
- **Validation Rules:**
  - Must reject non-PDF files with localized error toast: *"Invalid file type. Please upload PDF files only."* / *"ประเภทไฟล์ไม่ถูกต้อง กรุณาอัปโหลดไฟล์ PDF เท่านั้น"*
  - Minimum of 2 files required to trigger merge.
  - Automatically detect password-protected files and trigger Unlock modal.

#### 3.1.3 Configurable Parameters
| Parameter | Type | Default | Values / Range | Description |
| :--- | :--- | :--- | :--- | :--- |
| `fileOrder` | `string[]` | Upload order | Array of file IDs | Order in which documents are stitched |
| `pageInclusions` | `Record<string, number[]>` | All pages | `[0, 1, 2, ...]` per file | Specific 0-indexed pages to retain from each file |
| `rotations` | `Record<string, Record<number, number>>` | `{}` | `0, 90, 180, 270` | Angle adjustments per file per page |
| `outputFilename` | `string` | `"merged.pdf"` | Sanitized string | Name of the generated merged PDF |
| `preserveMetadata` | `boolean` | `false` | `true \| false` | Copy title/author from first document or create clean metadata |

#### 3.1.4 Processing Pipeline & Implementation Details
1. **Load Documents:** For each file, read `ArrayBuffer` and call `PDFDocument.load(buffer, { ignoreEncryption: false })`.
2. **Create Target Document:** Initialize `const mergedPdf = await PDFDocument.create()`.
3. **Iterate & Copy:**
   ```typescript
   for (const fileItem of sortedFiles) {
     const srcDoc = await PDFDocument.load(fileItem.arrayBuffer);
     const pageIndicesToCopy = fileItem.selectedPageIndices; // e.g. [0, 1, 2]
     const copiedPages = await mergedPdf.copyPages(srcDoc, pageIndicesToCopy);
     for (let i = 0; i < copiedPages.length; i++) {
       const page = copiedPages[i];
       const extraRotation = fileItem.rotations[pageIndicesToCopy[i]] || 0;
       if (extraRotation !== 0) {
         page.setRotation(degrees((page.getRotation().angle + extraRotation) % 360));
       }
       mergedPdf.addPage(page);
     }
   }
   ```
4. **Serialize & Export:** Call `const pdfBytes = await mergedPdf.save()` -> create `Blob([pdfBytes], { type: 'application/pdf' })` -> trigger `saveAs(blob, outputFilename)`.

#### 3.1.5 Edge Cases & Error Boundaries
- **Encrypted Source PDF:** Catches `PasswordException` -> prompts user for password inline without resetting the upload queue.
- **Corrupted PDF Structure:** Isolate failing file with specific error notification and keep remaining valid files in queue.
- **High Page Count Memory Saturation:** Sequential chunked copying and immediate dereferencing of source documents to allow browser Garbage Collector to reclaim heap.

---

### 3.2 Tool 1.2 — Split PDF

#### 3.2.1 Overview & User Stories
- **User Story:** As a user, I want to take a multi-page PDF and split it into multiple smaller documents by entering custom page ranges, splitting by fixed intervals, or extracting every page into individual PDF files packaged in a ZIP archive.

#### 3.2.2 Splitting Modes
1. **Mode A: Custom Page Ranges (Extract to Separate Files)**
   - User inputs range expression (e.g. `1-3, 5, 7-10`).
   - Generates multiple PDFs: `Document_1-3.pdf`, `Document_5.pdf`, `Document_7-10.pdf`, packaged in a `.zip` or downloaded individually.
2. **Mode B: Custom Page Ranges (Merge into Single PDF)**
   - Combines specified ranges (e.g. pages 1-3 and 7-10) into a single continuous output PDF (`Document_selected.pdf`).
3. **Mode C: Extract All Pages**
   - Every single page $i \in [1, N]$ is extracted into `page_001.pdf`, `page_002.pdf`, ... and packed into `document_split_all.zip`.
4. **Mode D: Fixed Page Interval**
   - Splits every $K$ pages (e.g., $K=2$ on a 5-page PDF produces `part_1.pdf` [pages 1-2], `part_2.pdf` [pages 3-4], `part_3.pdf` [page 5]).

#### 3.2.3 Range Parser Syntax & Grammar
The parser accepts standard PDF range syntax with robust error correction:
- Range syntax: `1-5, 8, 11-15, 20-end`
- Tokens:
  - Single numbers: `N` $\to$ Page index $N-1$
  - Hyphenated ranges: `A-B` $\to$ Pages $A$ through $B$ inclusive
  - Open ranges: `A-end` / `A-` $\to$ Pages $A$ through total pages $N$
- Grammar Validation Rules:
  - $1 \le A \le B \le N_{\text{total}}$
  - Auto-sort and deduplicate or preserve user order based on toggle `preserveOrder`.

#### 3.2.4 Output Packaging Contract
- **Single Output File:** Output direct `.pdf` download.
- **Multiple Output Files:** Package using `JSZip` into `document_split.zip`. Include compression option `compression: "DEFLATE"`.

#### 3.2.5 Edge Cases & Error Boundaries
- **Invalid Range Strings:** Real-time regex validation with immediate visual error border and helper text: *"Invalid page range: 12 exceeds document length (10 pages)"*.
- **Inverted Range (`10-5`):** Automatically normalize to `5-10` or flag as invalid with explanatory toast.
- **Single Page Document:** Disable split operations that require multiple pages and inform user.

---

### 3.3 Tool 1.3 — Organize & Reorder

#### 3.3.1 Overview & User Stories
- **User Story:** As a user, I want an interactive visual canvas grid showing thumbnails of all pages in my document, where I can drag and drop pages to reorder them, rotate individual or multiple pages, duplicate pages, delete pages, and export the reorganized document.

#### 3.3.2 Workspace UI & Interactions
- **Visual Thumbnail Grid:** Virtualized responsive grid (2 to 6 columns based on viewport) rendering each page with page number badge (`#1`, `#2`, ...).
- **Drag-and-Drop Reordering:** HTML5 Drag & Drop or `@dnd-kit` / `react-beautiful-dnd` with smooth drop-placeholder animations.
- **Per-Page Card Action Toolbar:**
  - 🔄 Rotate Clockwise (+90°)
  - 🔄 Rotate Counter-Clockwise (-90°)
  - 📋 Duplicate Page (inserts copy at adjacent index)
  - 🗑️ Delete Page (marks for removal, with Undo toast)
  - 🔍 Zoom / Fullscreen Page Preview Modal
- **Batch Selection Bar:**
  - "Select All", "Deselect All", "Select Odd Pages", "Select Even Pages".
  - Bulk Actions: Rotate selected, Delete selected, Extract selected.

#### 3.3.3 Data Structure & State Model
```typescript
interface PageItem {
  id: string;              // Unique UUID
  originalIndex: number;   // 0-indexed position in source PDF
  rotationDelta: number;   // 0, 90, 180, 270 degrees
  isDeleted: boolean;
  thumbnailUrl: string;    // DataURL from pdfjs canvas render
  aspectRatio: number;     // width / height
}
```

#### 3.3.4 Export Logic
```typescript
const exportPdf = async (srcBuffer: ArrayBuffer, pages: PageItem[]): Promise<Uint8Array> => {
  const srcDoc = await PDFDocument.load(srcBuffer);
  const outDoc = await PDFDocument.create();
  
  const activePages = pages.filter(p => !p.isDeleted);
  if (activePages.length === 0) throw new Error("Document must contain at least 1 page.");

  for (const p of activePages) {
    const [copiedPage] = await outDoc.copyPages(srcDoc, [p.originalIndex]);
    if (p.rotationDelta !== 0) {
      copiedPage.setRotation(degrees((copiedPage.getRotation().angle + p.rotationDelta) % 360));
    }
    outDoc.addPage(copiedPage);
  }
  return await outDoc.save();
};
```

---

### 3.4 Tool 1.4 — Rotate PDF

#### 3.4.1 Overview & User Stories
- **User Story:** As a user, I want to quickly fix orientation issues across my entire document or on specific pages by rotating 90°, 180°, or 270° clockwise or counter-clockwise, with real-time visual feedback and permanent orientation saving.

#### 3.4.2 Parameters & Controls
- **Global Actions:**
  - "Rotate All Right" (+90° CW)
  - "Rotate All Left" (-90° CCW)
  - "Rotate 180°" (+180°)
  - "Reset All Rotations" (0°)
- **Filter Targets:**
  - All Pages
  - Portrait Pages Only (auto-detect $H > W$)
  - Landscape Pages Only (auto-detect $W > H$)
  - Custom Page Range (e.g. `2, 4, 6`)

#### 3.4.3 Technical Mechanics
- PDF pages have an internal dictionary entry `/Rotate` which can be $0, 90, 180, 270$.
- `pdf-lib` represents rotation via `page.getRotation().angle` and `page.setRotation(degrees(angle))`.
- **Modulo 360 Rule:** The final rotation must always be strictly normalized:
  $$\theta_{\text{final}} = ((\theta_{\text{existing}} + \Delta\theta) \pmod{360} + 360) \pmod{360}$$

---

### 3.5 Tool 1.5 — Remove / Extract Pages

#### 3.5.1 Overview & User Stories
- **User Story:** As a user, I want to view all pages in my document, select specific pages, and choose whether to **Remove** them (keeping everything else) or **Extract** them into a standalone document or separate single-page files.

#### 3.5.2 Dual-Action Workflows
```
Page Selection Workspace (e.g. Pages 2 and 4 selected)
       │
       ├──► [Action: REMOVE] ──► Generates PDF with Pages 1, 3, 5, ...
       │
       └──► [Action: EXTRACT]
              ├── Option 1: Extract to 1 Single PDF ──► Generates PDF with Pages 2, 4
              └── Option 2: Extract to Separate PDFs ──► Generates ZIP containing:
                                                          - page_002.pdf
                                                          - page_004.pdf
```

#### 3.5.3 UI Selection Tools
- Thumbnail click to toggle selection border and checkmark overlay.
- Quick Select Presets:
  - "Odd Pages" ($1, 3, 5, \dots$)
  - "Even Pages" ($2, 4, 6, \dots$)
  - "Select Range" modal input (e.g. `3-7, 10`)
  - "Invert Selection"

---

## 4. Suite 2: Convert & Optimize Suite — Exhaustive Tool Specifications

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                        SUITE 2: CONVERT & OPTIMIZE                           ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ 2.1 Images to PDF       │ JPG/PNG/WebP to PDF with margin & size presets     ║
║ 2.2 PDF to Images       │ High-res rendering to JPG/PNG with ZIP download    ║
║ 2.3 Compress PDF        │ Client-side raster/stream compression with stats   ║
║ 2.4 OCR & Text Extract  │ Thai & English optical recognition to text/PDF     ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

### 4.1 Tool 2.1 — Images to PDF

#### 4.1.1 Overview & User Stories
- **User Story:** As a user, I want to convert one or multiple image files (JPG, PNG, WebP, GIF, BMP) into a single, beautifully formatted PDF with customizable page sizes, orientations, margins, and image alignments.

#### 4.1.2 Input File Specifications
- Supported Formats: `.jpg`, `.jpeg`, `.png`, `.webp`, `.bmp`, `.gif`, `.svg`.
- Multi-file selection with drag-and-drop reordering.

#### 4.1.3 Configurable Parameters
| Parameter | Type | Default | Options | Description |
| :--- | :--- | :--- | :--- | :--- |
| `pageSize` | `string` | `"A4"` | `"A4"`, `"Letter"`, `"Legal"`, `"Fit"` | Standard page dimensions or exact image bounding box |
| `orientation` | `string` | `"auto"` | `"auto"`, `"portrait"`, `"landscape"` | Auto chooses based on image aspect ratio |
| `margin` | `string` | `"none"` | `"none"` (0pt), `"small"` (20pt), `"big"` (50pt) | Padding around image on page |
| `imageFit` | `string` | `"contain"` | `"contain"`, `"fill"`, `"center-original"` | Aspect ratio fitting strategy |
| `mergeMode` | `string` | `"single"` | `"single"` (1 merged PDF), `"multiple"` (ZIP of PDFs) | Export packaging mode |

#### 4.1.4 Coordinate & Page Dimension Calculation Engine
1. **Standard Dimensions (Points @ 72 DPI):**
   - A4: $595.28 \times 841.89\text{ pt}$
   - US Letter: $612.00 \times 792.00\text{ pt}$
   - US Legal: $612.00 \times 1008.00\text{ pt}$
   - Fit: Page Width = Image Width $\times \frac{72}{\text{DPI}}$, Page Height = Image Height $\times \frac{72}{\text{DPI}}$
2. **Margin Values in Points:**
   - None: $M = 0\text{ pt}$
   - Small: $M = 20\text{ pt}$ (~7.05 mm)
   - Big: $M = 50\text{ pt}$ (~17.63 mm)
3. **Aspect Ratio Fitting (`contain`):**
   Given available canvas area:
   $$W_{\text{avail}} = W_{\text{page}} - 2M,\quad H_{\text{avail}} = H_{\text{page}} - 2M$$
   Scale factor:
   $$s = \min\left(\frac{W_{\text{avail}}}{W_{\text{img}}}, \frac{H_{\text{avail}}}{H_{\text{img}}}\right)$$
   Drawn Dimensions:
   $$w_{\text{draw}} = W_{\text{img}} \times s,\quad h_{\text{draw}} = H_{\text{img}} \times s$$
   Centered Position in PDF Coordinate Space:
   $$x_{\text{draw}} = M + \frac{W_{\text{avail}} - w_{\text{draw}}}{2}$$
   $$y_{\text{draw}} = M + \frac{H_{\text{avail}} - h_{\text{draw}}}{2}$$

4. **Image Embedding Code:**
   ```typescript
   // For non-JPEG/PNG formats (WebP/BMP/GIF), draw to canvas and export to PNG Uint8Array first
   const imageBytes = await normalizeToStandardImage(file);
   const isJpg = file.type === 'image/jpeg';
   const pdfImage = isJpg 
     ? await pdfDoc.embedJpg(imageBytes) 
     : await pdfDoc.embedPng(imageBytes);

   const page = pdfDoc.addPage([pageWidth, pageHeight]);
   page.drawImage(pdfImage, {
     x: x_draw,
     y: y_draw,
     width: w_draw,
     height: h_draw,
   });
   ```

---

### 4.2 Tool 2.2 — PDF to Images

#### 4.2.1 Overview & User Stories
- **User Story:** As a user, I want to convert every page (or selected pages) of a PDF into high-resolution JPG or PNG image files with selectable DPI settings and download them as individual images or a packaged ZIP file.

#### 4.2.2 Configurable Parameters
| Parameter | Type | Default | Options | Description |
| :--- | :--- | :--- | :--- | :--- |
| `format` | `string` | `"png"` | `"png"`, `"jpg"` | Target raster image MIME type |
| `quality` | `number` | `0.92` | `0.1` to `1.0` | Compression quality for JPEG output |
| `dpi` | `number` | `150` | `72` (1x), `150` (2.08x), `300` (4.16x) | Target resolution scale factor |
| `pageRange` | `string` | `"all"` | `"all"`, `"1-5"`, `custom selection` | Page subset to convert |
| `background` | `string` | `"#FFFFFF"` | Hex color string | Background canvas fill (prevents transparent PNG blackness in JPG) |

#### 4.2.3 High-Resolution Rendering Pipeline
```typescript
const renderPageToImageBlob = async (
  pdfDoc: pdfjsLib.PDFDocumentProxy, 
  pageNumber: number, 
  dpi: number, 
  format: 'png' | 'jpg', 
  quality: number
): Promise<Blob> => {
  const page = await pdfDoc.getPage(pageNumber);
  const scale = dpi / 72.0; // e.g. 300 / 72 = 4.1667x
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d', { alpha: format === 'png' })!;

  // Fill background white for JPG
  if (format === 'jpg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  const renderContext = {
    canvasContext: ctx,
    viewport: viewport,
  };
  await page.render(renderContext).promise;

  return new Promise((resolve) => {
    const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
    canvas.toBlob((blob) => resolve(blob!), mimeType, quality);
  });
};
```

#### 4.2.4 ZIP Packaging Naming Standard
- Single page download: `{originalName}_page_{n}.{ext}`
- ZIP archive: `{originalName}_images.zip`
- Folder structure inside ZIP:
  ```
  document_images.zip
  ├── page_001.png
  ├── page_002.png
  └── page_003.png
  ```

---

### 4.3 Tool 2.3 — Compress PDF

#### 4.3.1 Overview & User Stories
- **User Story:** As a user, I want to reduce the file size of my PDF document directly in my browser without compromising readability, with instant before/after file size comparison stats and 3 intuitive compression presets.

#### 4.3.2 Compression Presets & Technical Specifications

| Preset | Target DPI | JPEG Quality | Use Case | Estimated Size Reduction |
| :--- | :--- | :--- | :--- | :--- |
| **Extreme Compression** | 72 DPI | 0.40 - 0.50 | Email attachments, low bandwidth, emergency size limits | **60% – 85%** |
| **Recommended Compression** | 144 DPI | 0.70 - 0.75 | Standard sharing, web publishing, balanced screen clarity | **40% – 65%** |
| **Low Compression / High Quality** | 200+ DPI | 0.85 - 0.90 | High-quality printing, archival, minimal visual degradation | **20% – 40%** |

#### 4.3.3 Dual Compression Engine Architecture
1. **Raster Stream Resampling Strategy (For Scanned & Image-Heavy PDFs):**
   - Render each page to an offscreen canvas at the preset's scale factor.
   - Convert canvas to compressed JPEG byte stream (`canvas.toBlob('image/jpeg', quality)`).
   - Reconstruct a clean PDF with `pdf-lib`, embedding the downscaled JPEG images into identical page dimension viewports.
2. **Object Stream & Metadata Stripping Strategy (For Vector & Text PDFs):**
   - Remove redundant fonts, XMP metadata streams, thumbnail caches, and revision history.
   - Save using `pdfDoc.save({ useObjectStreams: true })` for standard structural compression.
3. **Adaptive Auto-Detection:**
   - Detect whether document is primarily image-scanned or vector-text. If vector-text, prioritize stream compression to preserve crisp vector text selectable layers.

#### 4.3.4 Real-time Progress & Stats Feedback
- Progress bar: *Processing page 4 of 12 (33%)...*
- Result Display:
  - **Original Size:** e.g. `14.8 MB`
  - **Compressed Size:** e.g. `3.2 MB`
  - **Saved:** `-78.4%` (Green highlight badge)

---

### 4.4 Tool 2.4 — OCR & Text Extraction (Thai 🇹🇭 & English 🇬🇧)

#### 4.4.1 Overview & User Stories
- **User Story:** As a user, I want to extract readable and searchable text from scanned PDF documents and images containing Thai and English characters, view the recognized text side-by-side with the page, copy it to the clipboard, export as `.txt`, or generate a searchable PDF.

#### 4.4.2 Language Support & Model Architecture
- **Language Models:**
  - `eng` — English (Tesseract traineddata)
  - `tha` — Thai (ภาษาไทย - Tesseract traineddata with Thai script vowel & tone mark support)
  - `tha+eng` — Combined bilingual dictionary for mixed English/Thai documents
- **Worker Configuration:**
  - `tesseract.js` Web Worker instantiated locally.
  - Worker loads `.traineddata.gz` from local `/tessdata/` assets or cached IndexedDB/CacheStorage, ensuring 100% offline capability after initial load.

#### 4.4.3 Image Preprocessing Pipeline for OCR Accuracy
Before passing a rendered PDF canvas page to Tesseract, run an image optimization filter on the canvas:
1. **Grayscale Conversion:** $Y = 0.299R + 0.587G + 0.114B$
2. **Contrast Enhancement & Adaptive Thresholding:** Binarize pixels to sharpen Thai tone marks (่ ้ ๊ ๋ ์) and upper/lower vowels (ิ ี ึ ื ุ ู) which are prone to OCR degradation on low-contrast scans.

#### 4.4.4 Output Formats
1. **Plain Text (`.txt`):** Structured text with preserved paragraph breaks.
2. **Copy to Clipboard:** One-click copy with visual toast confirmation.
3. **Structured JSON:** Character/word bounding boxes `[{ text: "สวัสดี", bbox: { x0, y0, x1, y1 }, confidence: 94.2 }]`.
4. **Searchable PDF (Optional Layer Baking):** An invisible vector text layer rendered with transparent fill over the background image matching exact word bounding boxes.

---

## 5. Suite 3: Edit & Annotate Suite — Exhaustive Tool Specifications

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                         SUITE 3: EDIT & ANNOTATE                             ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ 3.1 PDF Editor          │ Interactive drawing, text, shapes, stamp overlays  ║
║ 3.2 Add Watermark       │ Text & image watermarking with 9-grid & mosaic     ║
║ 3.3 Add Page Numbers    │ Customizable header/footer page numbering schemas  ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

### 5.1 Tool 3.1 — PDF Editor

#### 5.1.1 Overview & User Stories
- **User Story:** As a user, I want a comprehensive interactive editing workspace where I can add rich text boxes, freehand pen drawings, highlighters, geometric shapes, lines, arrows, and stamp images directly over any PDF page, and permanently bake them into the PDF coordinates.

#### 5.1.2 Annotation Tools & Properties Schema

```typescript
type AnnotationType = 'text' | 'pen' | 'highlighter' | 'rect' | 'circle' | 'line' | 'arrow' | 'image' | 'stamp';

interface BaseAnnotation {
  id: string;
  pageIndex: number;
  type: AnnotationType;
  x: number;       // Screen pixels (scaled relative to standard 72DPI page points)
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number; // 0.0 to 1.0
}

interface TextAnnotation extends BaseAnnotation {
  type: 'text';
  content: string;
  fontSize: number;       // 8pt to 72pt
  fontFamily: 'Helvetica' | 'Times' | 'Courier' | 'Sarabun';
  fontColor: string;      // Hex
  bold: boolean;
  italic: boolean;
  textAlign: 'left' | 'center' | 'right';
  backgroundColor?: string;
}

interface DrawingAnnotation extends BaseAnnotation {
  type: 'pen' | 'highlighter';
  points: { x: number; y: number }[]; // Bezier points
  strokeColor: string;
  strokeWidth: number;   // 1px to 40px
}

interface ShapeAnnotation extends BaseAnnotation {
  type: 'rect' | 'circle' | 'line' | 'arrow';
  strokeColor: string;
  strokeWidth: number;
  fillColor: string;     // Hex or 'transparent'
  isFilled: boolean;
}

interface ImageStampAnnotation extends BaseAnnotation {
  type: 'image' | 'stamp';
  imageUrl: string;      // Base64 DataURL
  imageBytes: Uint8Array;
  mimeType: 'image/png' | 'image/jpeg';
}
```

#### 5.1.3 Interactive Canvas Workspace Layout
- **Top Toolbar:** Tool Selector (Select/Move, Text, Pen, Highlighter, Rectangle, Circle, Arrow, Line, Stamp, Image, Eraser), Undo (`Ctrl+Z`), Redo (`Ctrl+Y`), Zoom Controls (50%, 100%, 150%, Fit Width), Page Navigation (`< Page 1 of 5 >`).
- **Contextual Property Bar (Floating/Sub-header):** Changes dynamically based on selected tool/annotation (Color picker palette, stroke width slider, font picker, font size dropdown, opacity slider).
- **Canvas Viewport:** Responsive dual-layer architecture:
  - *Layer 1 (Bottom):* Static Canvas displaying rendered PDF page via `pdfjs-dist`.
  - *Layer 2 (Top):* Interactive Fabric.js / Custom HTML5 Canvas capturing user input, drag handles, bounding box transformations, and live drawings.

#### 5.1.4 Coordinate Mapping & PDF Baking Pipeline
When user clicks "Save & Export PDF":
1. Open original PDF with `pdf-lib`: `const pdfDoc = await PDFDocument.load(fileBuffer)`.
2. For each page and its associated annotation list:
   - Calculate scale ratio between Canvas dimensions and PDF Page point dimensions:
     $$S_x = \frac{W_{\text{pdf}}}{W_{\text{canvas}}},\quad S_y = \frac{H_{\text{pdf}}}{H_{\text{canvas}}}$$
   - **Text Baking:**
     ```typescript
     const pdfFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
     const pdfX = ann.x * Sx;
     const pdfY = pageHeight - (ann.y + ann.fontSize) * Sy; // Y-inversion
     page.drawText(ann.content, {
       x: pdfX,
       y: pdfY,
       size: ann.fontSize * Sy,
       font: pdfFont,
       color: rgb(r, g, b),
       opacity: ann.opacity,
     });
     ```
   - **Drawing / Path Baking:**
     Convert canvas bezier points to SVG path string and call `page.drawSvgPath(svgPath, { ... })` or draw line segments with `page.drawLine()`.
   - **Rectangle / Circle Baking:**
     ```typescript
     page.drawRectangle({
       x: ann.x * Sx,
       y: pageHeight - (ann.y + ann.height) * Sy,
       width: ann.width * Sx,
       height: ann.height * Sy,
       borderColor: rgb(r, g, b),
       borderWidth: ann.strokeWidth * Sx,
       color: ann.isFilled ? rgb(fillR, fillG, fillB) : undefined,
       opacity: ann.opacity,
     });
     ```
   - **Image / Stamp Baking:**
     Embed image using `embedPng` or `embedJpg` and call `page.drawImage()` with scaled dimensions and inverted Y-coordinate.

---

### 5.2 Tool 3.2 — Add Watermark

#### 5.2.1 Overview & User Stories
- **User Story:** As a user, I want to apply a custom text or logo image watermark across my PDF pages with full control over opacity, angle, font, scale, 9-grid anchor positions, or full-page repeating mosaic pattern.

#### 5.2.2 Configurable Parameters
| Parameter | Type | Default | Options / Range | Description |
| :--- | :--- | :--- | :--- | :--- |
| `type` | `string` | `"text"` | `"text"`, `"image"` | Watermark media type |
| `text` | `string` | `"CONFIDENTIAL"` | Text string (Supports Thai & EN) | Watermark string content |
| `imageFile` | `File \| null` | `null` | PNG, JPG, WebP | Image logo source |
| `fontSize` | `number` | `48` | `12` to `144` pt | Font size for text watermark |
| `fontColor` | `string` | `"#FF0000"` | Hex Color | Text color |
| `opacity` | `number` | `0.3` | `0.05` to `1.0` | Transparency level |
| `rotation` | `number` | `45` | `-180°` to `+180°` | Rotation angle |
| `positionMode` | `string` | `"grid"` | `"grid"`, `"mosaic"`, `"custom"` | Positioning layout strategy |
| `gridAnchor` | `string` | `"center"` | 9-Grid anchors: `top-left`, `top-center`, `top-right`, `middle-left`, `center`, `middle-right`, `bottom-left`, `bottom-center`, `bottom-right` | Anchor position |
| `mosaicSpacing` | `number` | `150` | `50` to `300` pt | Spacing between tiled instances |
| `pageRange` | `string` | `"all"` | `"all"`, `"odd"`, `"even"`, `"custom"` | Target page filtering |
| `layer` | `string` | `"over"` | `"over"` (Foreground), `"under"` (Background) | Stacking order relative to document content |

#### 5.2.3 9-Grid Anchor Position Math

```
[Top-Left]       [Top-Center]       [Top-Right]
(Margin, H-Margin) (W/2, H-Margin)   (W-Margin, H-Margin)

[Middle-Left]       [Center]        [Middle-Right]
(Margin, H/2)       (W/2, H/2)       (W-Margin, H/2)

[Bottom-Left]    [Bottom-Center]    [Bottom-Right]
(Margin, Margin)   (W/2, Margin)     (W-Margin, Margin)
```

For rotated text at angle $\theta$ around anchor center $(X_c, Y_c)$:
$$X_{\text{origin}} = X_c - \frac{W_{\text{text}}}{2} \cos\theta + \frac{H_{\text{text}}}{2} \sin\theta$$
$$Y_{\text{origin}} = Y_c - \frac{W_{\text{text}}}{2} \sin\theta - \frac{H_{\text{text}}}{2} \cos\theta$$

#### 5.2.4 Mosaic (Tiled Pattern) Math
For page dimensions $W_{\text{pdf}}, H_{\text{pdf}}$ with step interval $\Delta X, \Delta Y$:
$$\forall x \in \{0, \Delta X, 2\Delta X, \dots, W_{\text{pdf}}\},\quad \forall y \in \{0, \Delta Y, 2\Delta Y, \dots, H_{\text{pdf}}\}$$
Draw instance with rotation $\theta = 45^\circ$ and low opacity $\alpha = 0.15$.

---

### 5.3 Tool 3.3 — Add Page Numbers

#### 5.3.1 Overview & User Stories
- **User Story:** As a user, I want to add page numbers to my document with flexible formatting templates (e.g., "1", "Page {n} of {total}", "หน้า {n}/{total}"), custom positioning (Header/Footer Left/Center/Right), start page offset, and font styling.

#### 5.3.2 Template Tokens & Internationalization
- Standard Tokens:
  - `{n}`: Current page number
  - `{total}`: Total pages in document (or total numbered pages)
  - `{filename}`: Source document title
- Built-in Format Presets:
  - `"{n}"` $\to$ `1`, `2`, `3`
  - `"Page {n}"` $\to$ `Page 1`, `Page 2`
  - `"Page {n} of {total}"` $\to$ `Page 1 of 10`
  - `"{n} / {total}"` $\to$ `1 / 10`
  - `"หน้า {n} จาก {total}"` $\to$ `หน้า 1 จาก 10` (Thai standard)
  - `"หน้า {n}"` $\to$ `หน้า 1` (Thai short)

#### 5.3.3 Placement Configuration
- **6 Anchor Positions:**
  - Header Left ($x = M_x, y = H_{\text{page}} - M_y$)
  - Header Center ($x = \frac{W_{\text{page}}}{2} - \frac{W_{\text{text}}}{2}, y = H_{\text{page}} - M_y$)
  - Header Right ($x = W_{\text{page}} - M_x - W_{\text{text}}, y = H_{\text{page}} - M_y$)
  - Footer Left ($x = M_x, y = M_y$)
  - Footer Center ($x = \frac{W_{\text{page}}}{2} - \frac{W_{\text{text}}}{2}, y = M_y$)
  - Footer Right ($x = W_{\text{page}} - M_x - W_{\text{text}}, y = M_y$)
- **Margins:** Default $M_x = 36\text{ pt}$ (0.5 in), $M_y = 36\text{ pt}$ (0.5 in), customizable from $10\text{ pt}$ to $100\text{ pt}$.

#### 5.3.4 Pagination Logic & Range Offset
- `startPageNumber`: Value of the first numbered page (e.g. start counting from `1` or `101`).
- `startFromDocPage`: Page in document where numbering begins (e.g. `2` to skip cover page).
- `stopAtDocPage`: Page in document where numbering ends.
- `excludeFirstPage`: Boolean toggle to skip rendering on page 1 while continuing sequence on page 2.

---

## 6. Suite 4: Security & Privacy Suite — Exhaustive Tool Specifications

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                        SUITE 4: SECURITY & PRIVACY                           ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ 4.1 Sign PDF            │ Draw, type, or upload signature with drag placement ║
║ 4.2 Protect PDF         │ User & owner password encryption (AES-128/256)     ║
║ 4.3 Unlock PDF          │ Decrypt and strip password restrictions            ║
║ 4.4 Redact PDF          │ Permanent blackout masking / page rasterization    ║
║ 4.5 Metadata Editor     │ Inspect, edit, or sanitize PDF document info       ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

### 6.1 Tool 4.1 — Sign PDF

#### 6.1.1 Overview & User Stories
- **User Story:** As a user, I want to create an electronic signature by drawing on a canvas touch pad, typing my name with a realistic calligraphic font, or uploading an image of my signature, and place it seamlessly on any page with resize and reposition controls.

#### 6.1.2 Signature Creation Modes
1. **Mode A: Draw Pad**
   - HTML5 Canvas with smooth quadratic bezier curves and variable velocity stroke width.
   - Ink color options: Black (`#000000`), Dark Blue / Royal Blue (`#002B7F`), Dark Red (`#8B0000`).
   - Clear and Undo stroke actions.
2. **Mode B: Type Signature**
   - User types full name or initials.
   - Cursive/Calligraphic font picker:
     - *Great Vibes*
     - *Dancing Script*
     - *Caveat*
     - *Alex Brush*
     - *Charm / Mali* (for Thai cursive signature rendering)
   - Real-time vector font rendering onto offscreen transparent canvas.
3. **Mode C: Upload Image**
   - Import PNG/JPG signature image.
   - **Auto-Thresholding Background Remover:** Converts near-white pixels ($R, G, B > 220$) to transparent alpha channel, leaving crisp handwritten ink.

#### 6.1.3 Placement & Embedding Pipeline
- User drags signature onto target page canvas.
- Interactive transformer box with corner resize handles (aspect-ratio locked) and delete badge.
- Optional companion fields: "Signer Name", "Signing Date" (auto-populated today's date), "Reason / Title".
- On export, signature image is extracted as transparent PNG blob and embedded using `pdfDoc.embedPng()` at the calculated PDF coordinate space.

---

### 6.2 Tool 4.2 — Protect PDF

#### 6.2.1 Overview & User Stories
- **User Story:** As a user, I want to lock my PDF with a password so that unauthorized users cannot open it, and configure permission restrictions (prevent printing, copying, or modifying).

#### 6.2.2 Security Parameters & Cryptographic Standards
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `userPassword` | `string` | Yes | Required to open and view the PDF document |
| `ownerPassword` | `string` | No (Auto-gen if empty) | Master password required to change permissions/passwords |
| `allowPrinting` | `boolean` | Optional (`true`) | Allow or block printing |
| `allowCopying` | `boolean` | Optional (`false`) | Allow or block text and graphic content copying |
| `allowModifying` | `boolean` | Optional (`false`) | Allow or block editing, annotating, form filling |
| `encryptionAlgorithm`| `string` | Default `AES-256` | Standard PDF encryption standard |

#### 6.2.3 Password Validation & Security Rules
- Client-side password strength meter:
  - Weak: $< 6$ characters
  - Medium: $\ge 6$ chars with mix of letters & numbers
  - Strong: $\ge 8$ chars with uppercase, lowercase, numbers, and symbols
- "Confirm Password" match validation before encryption execution.
- Strict warning notice: *"PDF Pro does not store passwords. If you lose this password, the document cannot be recovered."*

---

### 6.3 Tool 4.3 — Unlock PDF

#### 6.3.1 Overview & User Stories
- **User Story:** As a user, I want to supply the password for a protected PDF document to unlock it, remove all security restrictions, and export an unencrypted PDF for future editing and sharing.

#### 6.3.2 Detection & Decryption Flow
1. **Password Detection:**
   When loading file in `pdfjs-dist`:
   ```typescript
   const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
   loadingTask.onPassword = (callback, reason) => {
     // reason === pdfjsLib.PasswordResponses.NEED_PASSWORD (1)
     // reason === pdfjsLib.PasswordResponses.INCORRECT_PASSWORD (2)
     triggerPasswordModal(callback, reason);
   };
   ```
2. **User Decryption Input:**
   - Password modal appears with password reveal eye toggle.
   - User submits password $\to$ passed to `callback(enteredPassword)`.
3. **Unlocking & Saving:**
   - Once decrypted in memory, load into `pdf-lib` with password.
   - Save document with encryption options stripped (`pdfDoc.save()`).
   - Download the unlocked PDF file.

---

### 6.4 Tool 4.4 — Redact PDF

#### 6.4.1 Overview & User Stories
- **User Story:** As a user, I want to permanently redact and blackout confidential or sensitive information (such as ID numbers, personal data, financials) from my PDF document so that it cannot be recovered, extracted, or viewed.

#### 6.4.2 Redaction Modes & True Security Guarantee
There are two levels of redaction implemented to ensure total security:

1. **Level 1: Permanent Vector Blackout Boxes**
   - Draws opaque solid black (`#000000`) or white (`#FFFFFF`) rectangles directly into the PDF content stream via `pdf-lib`:
     ```typescript
     page.drawRectangle({
       x: redactX,
       y: redactY,
       width: redactW,
       height: redactH,
       color: rgb(0, 0, 0),
       opacity: 1.0,
     });
     ```
2. **Level 2: High-Security Page Flattening / Rasterization (Recommended)**
   - *Security Concern:* Drawing a rectangle over vector text in basic PDF implementations can leave underlying text searchable in raw PDF stream analyzers if not properly stripped.
   - *PDF Pro Solution:* When "Flatten & Rasterize Redacted Pages" is enabled:
     1. Render the redacted page canvas (with redaction blocks composited) to a 300 DPI high-resolution raster image.
     2. Replace the original PDF page with a clean page containing only the flattened image.
     3. **Guarantee:** 100% destruction of underlying text glyphs, metadata, and vectors in the redacted zone.

#### 6.4.3 Redaction Customization
- Blackout (`#000000`) vs Whiteout (`#FFFFFF`).
- Optional Redaction Label overlay (e.g., `"[REDACTED]"`, `"[ปกปิดข้อมูล]"`, `"CONFIDENTIAL"` in white/black text).

---

### 6.5 Tool 4.5 — Metadata Editor

#### 6.5.1 Overview & User Stories
- **User Story:** As a user, I want to view, modify, or completely sanitize the internal metadata (Title, Author, Subject, Keywords, Creator, Producer, Dates) of my PDF document to maintain professional standards or protect privacy before sharing.

#### 6.5.2 Metadata Fields Specification
| Field Name | PDF Dictionary Key | Editable | Description |
| :--- | :--- | :--- | :--- |
| **Title** | `/Title` | Yes | Document title |
| **Author** | `/Author` | Yes | Name of document creator/author |
| **Subject** | `/Subject` | Yes | Description or subject matter |
| **Keywords** | `/Keywords` | Yes | Search tags (comma or space separated) |
| **Creator** | `/Creator` | Yes | Originating application (e.g. Microsoft Word, InDesign) |
| **Producer** | `/Producer` | Yes | PDF converter library (e.g. PDF Pro Client Engine) |
| **Creation Date**| `/CreationDate` | Yes | Timestamp of document creation |
| **Modification Date**| `/ModDate` | Yes | Timestamp of last modification |

#### 6.5.3 Privacy Sanitization ("Strip All Metadata")
- One-click button: **"Sanitize / Clean Document"**
- Action:
  - Sets `Title`, `Author`, `Subject`, `Keywords`, `Creator` to empty strings or sanitized defaults.
  - Strips embedded XMP metadata streams (`/Metadata`).
  - Clears document revision history.

---

## 7. Cross-Cutting Functional Specifications

### 7.1 Multi-File Validation, Drag-and-Drop & MIME Filtering
- **Dropzone Requirements:**
  - Global window drag-over detection with visual drop backdrop overlay.
  - Multi-file batch selection via `<input type="file" multiple accept=".pdf,...">`.
  - Client-side MIME and magic-number validation:
    - PDF magic bytes: `%PDF-` (`0x25, 0x50, 0x44, 0x46, 0x2D`)
    - PNG magic bytes: `\x89PNG\r\n\x1a\n`
    - JPEG magic bytes: `\xFF\xD8\xFF`
  - Rejection of invalid files with non-blocking toast notifications.

### 7.2 Real-time Thumbnail Generation & Canvas Worker Pipeline
- **Lazy Rendering:** For documents with $> 20$ pages, render thumbnails lazily using `IntersectionObserver` to avoid memory bottlenecks and main-thread freezes.
- **Thumbnail Cache:** Cache rendered DataURLs in an in-memory `Map<pageNumber, string>` keyed by file hash. Revoke blobs when file is discarded.

### 7.3 Memory Management & Large Document Chunking
- Web browsers enforce a per-tab heap memory limit (typically 1.5GB to 4GB depending on browser/OS).
- **Optimization Rules:**
  1. Always reuse or discard `<canvas>` contexts. Set `canvas.width = 0; canvas.height = 0` when unmounting.
  2. For multi-page ZIP generation (e.g. 100-page PDF to Image at 300 DPI), process pages sequentially in batches of 3 to 5 pages, stream chunks directly into `JSZip`, and release intermediate canvas blobs.
  3. Explicitly call `URL.revokeObjectURL(url)` after download trigger.

### 7.4 Dual-Language Localization (Thai 🇹🇭 & English 🇬🇧)
- **Language Switcher:** Instant live switching in top navigation header without losing active tool state or uploaded files.
- **Thai Typography Standards:**
  - Clean font rendering supporting complex Thai tone marks and vowel clustering (Sarabun, Kanit, Prompt fonts).
  - No clipping of upper tone marks (่ ้ ๊ ๋ ์) or lower vowels (ุ ู).
  - Full Thai localization coverage across all 17 tools: tool titles, descriptions, options, buttons, placehoders, error messages, and download toasts.

---

## 8. Comprehensive Tool Parameter & Functional Matrix

| # | Suite | Tool Name | Primary Inputs | Output Format | Core Parameters | Primary Engine |
| :- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | Organize | **Merge PDF** | 2+ PDF files | Single `.pdf` | `fileOrder`, `pageInclusions`, `rotations` | `pdf-lib` |
| **2** | Organize | **Split PDF** | 1 PDF file | `.pdf` or `.zip` | `mode`, `ranges`, `interval`, `outputPattern` | `pdf-lib`, `jszip` |
| **3** | Organize | **Organize & Reorder** | 1 PDF file | Single `.pdf` | `pageOrder`, `rotations`, `deletedPages`, `duplicates` | `pdf-lib`, `pdfjs-dist` |
| **4** | Organize | **Rotate PDF** | 1 PDF file | Single `.pdf` | `globalAngle`, `pageOverrides`, `targetFilter` | `pdf-lib` |
| **5** | Organize | **Remove / Extract** | 1 PDF file | `.pdf` or `.zip` | `action` (Remove/Extract), `selectedPages`, `exportMode` | `pdf-lib`, `jszip` |
| **6** | Convert | **Images to PDF** | JPG, PNG, WebP | Single `.pdf` | `pageSize`, `orientation`, `margin`, `imageFit` | `pdf-lib`, Canvas |
| **7** | Convert | **PDF to Images** | 1 PDF file | `.png`/`.jpg` / `.zip` | `format`, `dpi` (72/150/300), `quality`, `pageRange` | `pdfjs-dist`, Canvas, `jszip` |
| **8** | Convert | **Compress PDF** | 1 PDF file | Single `.pdf` | `compressionLevel` (Extreme, Recommended, Low) | `pdfjs-dist`, Canvas, `pdf-lib` |
| **9** | Convert | **OCR & Text Extraction**| 1 PDF / Image | `.txt`, Searchable `.pdf`| `language` (`tha`, `eng`, `tha+eng`), `outputMode` | `tesseract.js`, Canvas, `pdf-lib` |
| **10**| Edit | **PDF Editor** | 1 PDF file | Single `.pdf` | `annotations` (Text, Pen, Highlighters, Shapes, Stamps) | Fabric/Canvas, `pdf-lib` |
| **11**| Edit | **Add Watermark** | 1 PDF file | Single `.pdf` | `text`/`image`, `opacity`, `angle`, `gridAnchor`, `mosaic` | `pdf-lib` |
| **12**| Edit | **Add Page Numbers** | 1 PDF file | Single `.pdf` | `formatTemplate`, `position` (6 anchors), `margins`, `startOffset` | `pdf-lib` |
| **13**| Security | **Sign PDF** | 1 PDF file | Single `.pdf` | `signatureType` (Draw, Type, Upload), `position`, `scale` | Canvas, `pdf-lib` |
| **14**| Security | **Protect PDF** | 1 PDF file | Single `.pdf` | `userPassword`, `ownerPassword`, `permissions` | `pdf-lib` |
| **15**| Security | **Unlock PDF** | 1 Encrypted PDF | Single `.pdf` | `password` | `pdfjs-dist`, `pdf-lib` |
| **16**| Security | **Redact PDF** | 1 PDF file | Single `.pdf` | `redactionBoxes`, `style` (Black/White), `flattenRaster` | Canvas, `pdf-lib` |
| **17**| Security | **Metadata Editor** | 1 PDF file | Single `.pdf` | `title`, `author`, `subject`, `keywords`, `sanitizeAll` | `pdf-lib` |

---

## 9. Conclusion & Implementation Readiness

The functional requirements and feature inventory defined above represent an exhaustive, mathematically sound, and privacy-compliant blueprint for building **PDF Pro**. All 17 tools are designed for 100% in-browser client execution, robust error recovery, and seamless Thai/English dual-language operation.
