# Original User Request

## 2026-08-25T07:25:16Z

<USER_REQUEST>
Build **PDF Pro**, a comprehensive, modern, production-grade PDF management web application inspired by iLovePDF (https://www.ilovepdf.com/). The application provides a complete suite of browser-based PDF tools with zero-server-upload privacy (100% client-side processing using WebAssembly/pure JS), beautiful responsive UI/UX, Thai and English localization, and real-time visual page previews.

Working directory: c:\Users\oate_\Desktop\pdf pro
Integrity mode: development

## Reference
- Target Reference: https://www.ilovepdf.com/
- Target Architecture: Client-Side First Web Application (React + TypeScript + Vite + Tailwind CSS + Lucide Icons + `pdf-lib` + `pdfjs-dist` + `tesseract.js` + `jszip` + HTML5 Canvas)

## Requirements

### R1. Comprehensive PDF Tool Suite (Organize, Convert, Edit, Security)
The application must provide an organized, categorized dashboard and dedicated interactive workspaces for all major PDF operations:
- **Organize PDF**:
  - **Merge PDF**: Select multiple PDF files, visually reorder files/pages with drag-and-drop, and merge into a single PDF.
  - **Split PDF**: Split by custom page ranges (e.g. 1-3, 5-8) or extract all pages as individual PDFs (with ZIP download).
  - **Organize & Reorder**: Visual grid preview of all pages, drag to reorder, rotate individual pages, and delete selected pages.
  - **Rotate PDF**: Rotate specific pages or all pages by 90°, 180°, or 270°.
  - **Remove / Extract Pages**: Select pages to remove or extract into a new standalone document.
- **Convert & Optimize**:
  - **Images to PDF**: Convert JPG, PNG, and WebP images into a single PDF with configurable orientation, margins, and page size (A4, Letter, Fit).
  - **PDF to Images**: High-resolution rendering of PDF pages into JPG/PNG images with single-page and bulk ZIP download.
  - **Compress PDF**: Client-side image resampling and PDF optimization with compression levels (Extreme, Recommended, Low) and file size estimation.
  - **OCR & Text Extraction**: Client-side optical character recognition (OCR) with multilingual support (Thai & English) to extract searchable text.
- **Edit & Annotate**:
  - **PDF Editor**: Interactive canvas overlay to add text boxes (font size, color, bold), freehand drawing/pen, highlighters, geometric shapes (rectangles, circles, arrows), and stamp images.
  - **Add Watermark**: Text or image watermarks with configurable opacity, rotation angle, font styling, and 9-grid anchor positioning.
  - **Add Page Numbers**: Automated page numbering with custom formats (e.g., "1", "Page {n} of {total}"), position selection (header/footer, left/center/right), and page range filtering.
- **Security & Privacy**:
  - **Sign PDF**: Interactive signature pad allowing drawing, typing, or uploading signature images, with movable and resizable placement on any page.
  - **Protect PDF**: Client-side password encryption (User & Owner passwords).
  - **Unlock PDF**: Password-protected PDF decryption and unlocked file export.
  - **Redact PDF**: Visual blackout redaction tool to permanently obscure sensitive or confidential information.
  - **Metadata Editor**: Inspect and edit PDF metadata (Title, Author, Subject, Keywords, Creator).

### R2. Client-Side First Architecture & Zero-Upload Privacy
All PDF operations, rendering, and transformations must execute 100% inside the user's browser using client-side engines (`pdf-lib`, `pdfjs-dist`, `tesseract.js`, `jszip`, `canvas`), ensuring complete privacy without transmitting sensitive documents to external servers.

### R3. Modern, Intuitive & Responsive UI/UX with Dual Language Support
- Clean, aesthetic dashboard with instant tool search and category filtering (All, Organize, Convert, Edit, Security).
- Drag-and-drop file upload zones with multi-file support and validation.
- Real-time PDF thumbnail grid with lazy rendering.
- Seamless Dark Mode 🌙 and Light Mode ☀️ theme toggle.
- Full localization supporting Thai (ภาษาไทย 🇹🇭) and English (🇬🇧) with live switching.
- Process feedback indicators (progress bars, status notifications, file size difference stats).

## Acceptance Criteria

### Functionality & Verification
- [ ] **Organize Suite**: Merge combines multiple PDFs accurately; Split separates page ranges or all pages; Organize allows reordering and page deletion.
- [ ] **Convert Suite**: Images to PDF generates valid PDFs with proper aspect ratios; PDF to Images renders clean, crisp images and packages into a ZIP; OCR successfully extracts text.
- [ ] **Edit & Annotate Suite**: Text, shapes, freehand drawing, watermarks, and page numbers are baked into the output PDF at precise coordinates.
- [ ] **Sign & Security Suite**: Signatures are placed accurately; Password protection and decryption work correctly; Redaction permanently blocks out sensitive regions.
- [ ] **Zero-Upload Privacy**: No PDF data is sent to external network endpoints during processing.
- [ ] **Responsive Design & i18n**: Fully usable across mobile and desktop viewports, with instant switching between Thai and English.
- [ ] **Build Verification**: Application builds cleanly with no TypeScript, bundling, or runtime errors (`npm.cmd run build` succeeds).
</USER_REQUEST>
