# PDF Pro — Orchestrator 2 Execution Plan

## 1. Project Roadmap

```
MILESTONE ROADMAP
├── Milestone 1: Foundation, Core Engines, Shared Design System, i18n (TH/EN), Dashboard & Unified Workspace [DONE]
├── Milestone 2: Organize Suite (5 tools) & Convert/Optimize Suite (4 tools) [IN PROGRESS]
├── Milestone 3: Edit & Annotate Suite (3 tools: PDF Editor, Watermark, Page Numbers) [PENDING]
├── Milestone 4: Security & Privacy Suite (5 tools: Sign, Protect, Unlock, Redact, Metadata) [PENDING]
└── Milestone 5: Final E2E Integration (100% E2E Pass) & Adversarial Hardening [PENDING]
```

## 2. Milestone 2 Scope (Organize & Convert/Optimize)
- **Organize Suite (5 Tools)**:
  1. Merge PDF (`MergeView.tsx`): multi-file dropzone, drag-to-reorder list, page selection, rotation, merge engine in `pdfService.mergePDFs`.
  2. Split PDF (`SplitView.tsx`): range expression parser (`1-3, 5, 8-end`), extract all mode, interval mode, single/ZIP export.
  3. Organize & Reorder (`OrganizeView.tsx`): visual thumbnail grid, per-page rotation (+90°/-90°), duplication, deletion, drag-and-drop.
  4. Rotate PDF (`RotateView.tsx`): global orientation (+90°, 180°, 270°) and per-page overrides with normalization.
  5. Remove / Extract Pages (`ExtractPagesView.tsx`): invertible selection grid, Remove mode and Extract mode (standalone PDF / ZIP).
- **Convert & Optimize Suite (4 Tools)**:
  6. Images to PDF (`ImagesToPdfView.tsx`): JPG/PNG/WebP conversion, page size presets (A4, Letter, Fit), orientation, margin calculation.
  7. PDF to Images (`PdfToImagesView.tsx`): high-res canvas rasterization (72/150/300 DPI), PNG/JPG formats, single and bulk ZIP downloads.
  8. Compress PDF (`CompressPdfView.tsx`): dual compression strategy (structural object stream stripping + raster stream downsampling), compression presets (Extreme, Recommended, Low), before/after size difference stats.
  9. OCR & Text Extraction (`OcrTextView.tsx`): `tesseract.js` worker integration (`eng`, `tha`, `tha+eng`), image contrast pre-processing, progress tracking, plain text and JSON export.
- **Wiring & Integration**:
  - Connect all 9 tools in `src/tools/organize/` and `src/tools/convert/` and wire into `App.tsx` / `UnifiedWorkspace.tsx`.

## 3. Milestone 3 Scope (Edit & Annotate)
- **Edit & Annotate Suite (3 Tools)**:
  10. PDF Editor (`PdfEditorView.tsx`): Canvas overlay, text boxes, freehand pen (bezier smoothing), highlighter, geometric shapes (rect, circle, line, arrow), image stamps, exact PDF baking at coordinate origin.
  11. Add Watermark (`AddWatermarkView.tsx`): Text (Thai Unicode) & image logo watermarks, opacity, rotation angle (-180° to +180°), 9-grid anchor alignment, repeating mosaic mode, page range filters.
  12. Add Page Numbers (`AddPageNumbersView.tsx`): Numbering templates (`"1"`, `"Page {n} of {total}"`, `"หน้า {n} จาก {total}"`, `"{n} / {total}"`), 6 placement anchors, margins, start page offsets.

## 4. Milestone 4 Scope (Security & Privacy)
- **Security & Privacy Suite (5 Tools)**:
  13. Sign PDF (`SignPdfView.tsx`): Draw / Type / Upload signature pad, movable/resizable bounding box, transparent PNG embedding into PDF.
  14. Protect PDF (`ProtectPdfView.tsx`): AES password encryption (User & Owner passwords), permissions, password strength meter.
  15. Unlock PDF (`UnlockPdfView.tsx`): Password detection on load, password dialog, decryption and unlocked file export.
  16. Redact PDF (`RedactPdfView.tsx`): Permanent blackout redaction, true high-security page flattening (300 DPI rasterization replacing page to destroy underlying text stream).
  17. Metadata Editor (`MetadataEditorView.tsx`): Title, Author, Subject, Keywords, Creator, Producer inspection and editing, one-click sanitize/strip all metadata.

## 5. Milestone 5 Scope (Verification & Build)
- Run full 4-Tier E2E automated test suite (`tier1-core`, `tier2-boundary`, `tier3-pipeline`, `tier4-stress`).
- Ensure 100% test pass rate.
- Adversarial hardening and edge-case verification.
- Offline and zero-server-upload privacy verification.
- Production build verification (`npm run build` succeeds cleanly).
