# PDF Pro — Milestone Execution Plan (M1 – M5)

## Overview & Milestone Roadmap

```
MILESTONE ROADMAP
├── Milestone 1: Foundation, Core Engines, Shared Design System, i18n (TH/EN), Dashboard & Unified Workspace
├── Milestone 2: Organize Suite (5 tools) & Convert/Optimize Suite (4 tools)
├── Milestone 3: Edit & Annotate Suite (3 tools: PDF Editor, Watermark, Page Numbers)
├── Milestone 4: Security & Privacy Suite (5 tools: Sign, Protect, Unlock, Redact, Metadata)
└── Milestone 5: Final E2E Integration (100% E2E Pass) & Adversarial Hardening
```

---

## Milestone 1: Foundation, Core Engines & Shared Infrastructure

- [ ] **M1.1 Project Scaffolding & Configuration**
  - Initialize `package.json` with all dependencies (`react`, `react-dom`, `pdf-lib`, `@cantoo/pdf-lib`, `@pdf-lib/fontkit`, `pdfjs-dist`, `tesseract.js`, `jszip`, `file-saver`, `lucide-react`, `tailwindcss`, `typescript`, `vite`).
  - Configure `vite.config.ts`, `tailwind.config.js`, `postcss.config.js`, `tsconfig.json`.
  - Add Thai TrueType Unicode font files (`Sarabun-Regular.ttf`, `Prompt-Regular.ttf`) and worker bundles to `public/`.
- [ ] **M1.2 Core Service Engines**
  - Implement `fontService.ts` with font caching and `@pdf-lib/fontkit` embedding.
  - Implement `pdfRendererService.ts` with `pdfjs-dist` worker setup and canvas rasterization.
  - Implement `canvasService.ts` and `zipService.ts`.
- [ ] **M1.3 Bilingual i18n & Theme System**
  - Create complete `en.ts` and `th.ts` dictionaries covering all common terms, categories, and 17 tools.
  - Build `useTranslation` hook and `LanguageContext` supporting dynamic switching without reload.
  - Configure `ThemeContext` with dark/light mode persistence in `localStorage`.
  - Add Thai typography anti-clipping CSS rules in `typography.css`.
- [ ] **M1.4 App Shell & Dashboard**
  - Build `Header.tsx` with logo, navigation mega-dropdowns, language/theme toggles, and privacy pill.
  - Build `Footer.tsx` with zero-upload trust telemetry and offline monitor.
  - Build `Dashboard.tsx` with Hero command search (`Ctrl+K`), category filter tabs, and 17-tool card grid.
- [ ] **M1.5 Standardized Unified Workspace Container**
  - Implement `UnifiedWorkspace.tsx` managing 5 phases:
    1. Phase 1: `DropZone.tsx` (Drag & drop, multi-file validation, sample loader).
    2. Phase 2: `ThumbnailGrid.tsx` / `CanvasOverlay.tsx` (Visual page preview, drag reordering).
    3. Phase 3: Tool configuration sidebar.
    4. Phase 4: `ActionFooter.tsx` (Stats, streaming progress bar, action CTA).
    5. Phase 5: `ResultModal.tsx` (File size diff stats, download buttons, continue pipeline).
- [ ] **M1 Verification**: `npm run build` succeeds cleanly; Dashboard renders with full Thai/English switching.

---

## Milestone 2: Organize Suite & Convert/Optimize Suite

- [ ] **M2.1 Organize Suite (5 Tools)**
  - **Tool 1: Merge PDF (`MergeView.tsx`)**: Multi-file dropzone, drag-to-reorder list, page selection, rotation, merge engine in `pdfService.mergePDFs`.
  - **Tool 2: Split PDF (`SplitView.tsx`)**: Range expression parser (`1-3, 5, 8-end`), extract all mode, interval mode, single/ZIP export.
  - **Tool 3: Organize & Reorder (`OrganizeView.tsx`)**: Visual thumbnail grid, per-page rotation (+90°/-90°), duplication, deletion, drag-and-drop.
  - **Tool 4: Rotate PDF (`RotateView.tsx`)**: Global orientation (+90°, 180°, 270°) and per-page overrides with normalization.
  - **Tool 5: Remove / Extract Pages (`ExtractPagesView.tsx`)**: Invertible selection grid, Remove mode and Extract mode (standalone PDF / ZIP).
- [ ] **M2.2 Convert & Optimize Suite (4 Tools)**
  - **Tool 6: Images to PDF (`ImagesToPdfView.tsx`)**: JPG/PNG/WebP conversion, page size presets (A4, Letter, Fit), orientation, margin calculation.
  - **Tool 7: PDF to Images (`PdfToImagesView.tsx`)**: High-res canvas rasterization (72/150/300 DPI), PNG/JPG formats, single and bulk ZIP downloads.
  - **Tool 8: Compress PDF (`CompressPdfView.tsx`)**: Dual compression strategy (structural object stream stripping + raster stream downsampling), compression presets (Extreme, Recommended, Low), before/after size difference stats.
  - **Tool 9: OCR & Text Extraction (`OcrTextView.tsx`)**: `tesseract.js` worker integration (`eng`, `tha`, `tha+eng`), image contrast pre-processing, progress tracking, plain text and JSON export.
- [ ] **M2 Verification**: Automated and manual testing of all 9 tools in M2; verify valid PDF output structure and ZIP generation.

---

## Milestone 3: Edit & Annotate Suite

- [ ] **M3.1 Tool 10: PDF Editor (`PdfEditorView.tsx`)**
  - Interactive 2D canvas overlay over rendered PDF pages.
  - Rich text boxes (font family, font size, bold/italic, color, background).
  - Freehand pen with smooth quadratic bezier curves & variable stroke width.
  - Highlighter pen with translucent composite blending.
  - Geometric shapes (rectangles, circles, lines, arrows) with fill and stroke options.
  - Image / Stamp insertion.
  - PDF coordinate baking pipeline converting canvas screen coordinates to PDF point coordinates.
- [ ] **M3.2 Tool 11: Add Watermark (`AddWatermarkView.tsx`)**
  - Text watermarks (with Thai Unicode font support) & image logo watermarks.
  - Opacity control, rotation angle (-180° to +180°), 9-grid anchor alignment, repeating mosaic mode.
  - Page range filtering (All, Odd, Even, Custom).
- [ ] **M3.3 Tool 12: Add Page Numbers (`AddPageNumbersView.tsx`)**
  - Numbering templates (`"1"`, `"Page {n} of {total}"`, `"หน้า {n} จาก {total}"`, `"{n} / {total}"`).
  - 6 placement anchors (Header/Footer Left/Center/Right) with configurable margins.
  - Start page offset & page range filters.
- [ ] **M3 Verification**: Inspect exported PDF coordinates, verify Thai text rendering with `fontkit`, ensure exact visual positioning.

---

## Milestone 4: Security & Privacy Suite

- [ ] **M4.1 Tool 13: Sign PDF (`SignPdfView.tsx`)**
  - Signature creation pad (Draw on touch/mouse canvas, Type with cursive font, Upload image with auto-background removal).
  - Movable, resizable placement bounding box on any page.
  - Transparent PNG embedding into target PDF page.
- [ ] **M4.2 Tool 14: Protect PDF (`ProtectPdfView.tsx`)**
  - Password encryption (User Password to view, Owner Password for permissions).
  - Standard PDF encryption handlers (AES-128 / AES-256).
  - Password strength meter and match verification.
- [ ] **M4.3 Tool 15: Unlock PDF (`UnlockPdfView.tsx`)**
  - Password detection on load (`onPassword` callback in `pdfjs-dist`).
  - Password entry dialog and decryption export with removed security restrictions.
- [ ] **M4.4 Tool 16: Redact PDF (`RedactPdfView.tsx`)**
  - Permanent blackout rectangular redaction.
  - High-security page flattening (render redacted canvas at 300 DPI and replace original page, permanently destroying underlying text stream).
- [ ] **M4.5 Tool 17: Metadata Editor (`MetadataEditorView.tsx`)**
  - View and modify Title, Author, Subject, Keywords, Creator, Producer, Creation/Modification dates.
  - "Sanitize / Strip All Metadata" one-click action for complete privacy.
- [ ] **M4 Verification**: Verify encryption locks and unlocks, test redaction permanent destruction of text, verify metadata modification.

---

## Milestone 5: Final E2E Integration & Adversarial Hardening

- [ ] **M5.1 Synthetic Test Fixture Generator & Verifier**
  - Build `test/fixtures/generator.ts` and `test/utils/pdfVerifier.ts`.
- [ ] **M5.2 4-Tier Automated E2E Test Suite Execution**
  - Tier 1: Happy paths for all 17 tools.
  - Tier 2: Boundary conditions, corrupted files, malformed ranges, Thai unicode strings.
  - Tier 3: Multi-tool pipeline workflows (Images → PDF → Watermark → Compress → Protect → Unlock).
  - Tier 4: Heavy PDF stress tests (50+ pages), memory leak validation, offline verification.
- [ ] **M5.3 Adversarial Hardening & Production Polish**
  - Responsive mobile/desktop layout validation.
  - Zero-upload privacy CSP audit & live network monitor validation.
  - Dark mode and Thai font rendering QA check.
  - Final clean production build verification (`npm run build`).
