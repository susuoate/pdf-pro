# PDF Pro — E2E Testing Infrastructure & Quality Assurance Specification

**Version:** 1.0.0  
**Target Application:** PDF Pro (Client-Side First PDF Management Web Suite)  
**Author:** E2E Test Suite Architect  
**Date:** 2026-08-25  

---

## 1. Executive Summary & Verification Philosophy

**PDF Pro** is a client-side first, zero-server-upload PDF management application. Because privacy, deterministic execution, and mathematical correctness are fundamental to PDF Pro, the testing framework enforces three core principles:

1. **Deterministic In-Memory Fixtures:** No external network requests or static binary dependencies. All PDF, image, and text test fixtures are synthesized in memory using deterministic algorithms (`pdf-lib`, standard binary buffers) with known invariants.
2. **Zero-Server-Upload Egress Interception:** The testing framework monitors all client-side network channels (`fetch`, `XMLHttpRequest`, `WebSocket`, `navigator.sendBeacon`) to strictly assert that 0 bytes of document data or metadata leave the browser sandbox during operations.
3. **AST & Structural Invariant Verification:** Rather than relying solely on black-box visual snapshots, every test performs deep structural validation on the underlying PDF Abstract Syntax Tree (AST) — validating page counts, geometric dimensions (PostScript points), rotation flags, metadata dictionaries, encrypted trailers, and font embedding.

---

## 2. 4-Tier Verification Matrix

The test suite is organized into 4 progressive tiers of automated verification:

```
+-----------------------------------------------------------------------------------------+
|                               4-TIER VERIFICATION SUITE                                 |
+-----------------------------------------------------------------------------------------+
|  TIER 4: REAL-WORLD STRESS & OFFLINE BENCHMARKS                                         |
|  - 50+ Page PDF batch processing and memory stability (< 180MB heap delta)              |
|  - 100% Offline verification (Airplane mode, network isolation)                         |
+-----------------------------------------------------------------------------------------+
|  TIER 3: MULTI-TOOL COMPOSITION PIPELINES & STATE INTEGRITY                             |
|  - Multi-tool chained workflows (Img2Pdf -> Watermark -> Compress -> Protect -> Unlock) |
|  - Bidirectional language switching (Thai <-> English) state preservation              |
|  - Dark/Light mode theme switching visual and DOM stability                            |
+-----------------------------------------------------------------------------------------+
|  TIER 2: BOUNDARY CONDITIONS, ADVERSARIAL INPUTS & RESILIENCE                           |
|  - 0-byte corrupt files, corrupted headers, truncated stream recovery                   |
|  - Malformed page range expressions ("99-10", "abc", "-5", "0", out-of-bounds)          |
|  - Thai Unicode character sets in watermarks, metadata, filenames (เอกสารลับ)           |
|  - Extreme page dimensions (1x1 pt to 10000x10000 pt), odd/even filtering edge cases   |
+-----------------------------------------------------------------------------------------+
|  TIER 1: CORE TOOL FUNCTIONALITY (ALL 17 TOOLS)                                         |
|  - Suite 1: Organize (Merge, Split, Organize & Reorder, Rotate, Remove/Extract)         |
|  - Suite 2: Convert & Optimize (Images to PDF, PDF to Images, Compress, OCR)           |
|  - Suite 3: Edit & Annotate (PDF Editor, Watermark, Page Numbers)                       |
|  - Suite 4: Security & Privacy (Sign, Protect, Unlock, Redact, Metadata Editor)         |
+-----------------------------------------------------------------------------------------+
```

---

## 3. Tool Coverage & Verification Objectives

| Suite | Tool ID | Tool Name | Verification Targets |
|---|---|---|---|
| **Organize** | `merge` | Merge PDF | Multi-document concatenation, page count sum, custom page subset selection, preserved rotation. |
| **Organize** | `split` | Split PDF | Range syntax parsing (`1-2, 4`), `extract-all` mode, interval chunking, output ZIP packaging. |
| **Organize** | `organize` | Organize & Reorder | Arbitrary page permutations (`[2, 0, 1]`), page deletion, individual rotation overrides. |
| **Organize** | `rotate` | Rotate PDF | Global rotation (+90°, 180°, 270°), per-page rotation overrides, angle normalization modulo 360°. |
| **Organize** | `extract` | Remove / Extract | Inverted page removal, target page extraction to standalone PDF or individual ZIP entries. |
| **Convert** | `img2pdf` | Images to PDF | Multi-image (PNG/JPEG) conversion, page size presets (A4, Letter, Fit), margins, orientation. |
| **Convert** | `pdf2img` | PDF to Images | Canvas rasterization, DPI scaling (72/150/300 DPI), PNG/JPEG blobs, ZIP bundling. |
| **Convert** | `compress` | Compress PDF | Stream optimization, raster downsampling, compression presets, valid PDF structure post-compression. |
| **Convert** | `ocr` | OCR & Text Extraction | Text extraction, multi-language detection (English, Thai), bounding box confidence metrics. |
| **Edit** | `editor` | PDF Editor | Coordinate translation (Screen -> PDF points), baking text, shapes (rect, circle, arrow), freehand pen. |
| **Edit** | `watermark` | Add Watermark | 9-grid anchor alignment, opacity (0.0–1.0), rotation (-180° to 180°), Thai Unicode text, mosaic mode. |
| **Edit** | `pageNumbers` | Add Page Numbers | Template substitution (`"Page {n} of {total}"`, `"หน้า {n} จาก {total}"`), 6 anchor positions, offsets. |
| **Security** | `sign` | Sign PDF | Signature image positioning, transparent alpha blending, multi-page signature placement. |
| **Security** | `protect` | Protect PDF | Standard PDF encryption (User & Owner passwords), permission flags (print, copy, edit). |
| **Security** | `unlock` | Unlock PDF | Decryption using valid password, stripping of security constraints, export of unencrypted PDF. |
| **Security** | `redact` | Redact PDF | Permanent blackout rectangles, destructive page flattening destroying underlying text layers. |
| **Security** | `metadata` | Metadata Editor | Title, Author, Subject, Keywords, Creator modification, one-click sanitize/strip all metadata. |

---

## 4. Test Infrastructure Architecture

```
test/
├── fixtures/
│   └── generator.ts           # Deterministic In-Memory Synthetic PDF & Image Fixtures
├── utils/
│   └── pdfVerifier.ts         # Structural AST Verifier, Dimension & Metadata Validator
└── e2e/
    ├── tier1-core.spec.ts     # Tier 1: 17 Tools Unit & Integration Specifications
    ├── tier2-boundary.spec.ts # Tier 2: Boundary Conditions, Corrupt Files, Malformed Inputs
    ├── tier3-pipeline.spec.ts # Tier 3: Multi-Tool Chained Pipelines & State Retention
    └── tier4-stress.spec.ts   # Tier 4: Real-World Stress, Memory & Offline Verification
```

### 4.1 Synthetic Fixture Generator (`test/fixtures/generator.ts`)
The generator provides deterministic factory functions:
- `createSinglePagePdf(options)`: Standard A4/Letter single-page PDF with text and metadata.
- `createMultiPagePdf(pageCount, options)`: N-page PDF with numbered content per page.
- `createRotatedPdf(pageRotations)`: Multi-page PDF with specified per-page rotation angles.
- `createImageEmbeddedPdf(options)`: PDF with embedded synthetic PNG raster graphics.
- `createThaiUnicodePdf(thaiText)`: PDF with Thai Unicode strings in content and metadata.
- `createProtectedPdf(password, userPassword)`: Password-encrypted PDF fixture.
- `createMetadataPdf(metadata)`: PDF with rich metadata fields for inspection.
- `createCorruptPdf()`: Malformed byte sequences for negative testing.
- `createEmptyBuffer()`: 0-byte buffer for boundary testing.
- `createSamplePngBytes(width, height, color)`: Programmatic valid PNG byte generator without external deps.

### 4.2 PDF Structural Verifier (`test/utils/pdfVerifier.ts`)
The verifier inspects PDF structures and validates mathematical invariants:
- `verifyPageCount(bytes, expectedCount)`: Asserts exact page count.
- `getPageDimensions(bytes, pageIndex)`: Returns `{ width, height }` in PostScript points.
- `getPageRotation(bytes, pageIndex)`: Returns normalized rotation angle ($0^\circ, 90^\circ, 180^\circ, 270^\circ$).
- `verifyMetadata(bytes, expected)`: Asserts metadata matching (Title, Author, Subject, Keywords, etc.).
- `verifyIsEncrypted(bytes)`: Verifies encryption presence or trailer dictionary `/Encrypt` entry.
- `extractContentMarkers(bytes)`: Extracts text stream markers to confirm watermark, text, or numbering presence.
- `verifyZeroNetworkEgress(action)`: Asserts no external HTTP/WebSocket network calls occurred during the action.
- `measureMemoryStability(action)`: Validates memory delta and garbage collectability.

---

## 5. Geometric & Coordinate System Invariant Verification

As defined in `PROJECT.md` § 4, the coordinate transformation between Screen (Top-Left, CSS px) and PDF User Units (Bottom-Left, 72 pt/inch) must satisfy:

$$x_{\text{pdf}} = x_{\text{screen}} \times \left(\frac{W_{\text{pdf}}}{W_{\text{vp}}}\right)$$
$$y_{\text{pdf}} = H_{\text{pdf}} - (y_{\text{screen}} + h_{\text{screen}}) \times \left(\frac{H_{\text{pdf}}}{H_{\text{vp}}}\right)$$

For rotated pages ($90^\circ, 180^\circ, 270^\circ$), the transformation is verified against normalized rotated bounding boxes to ensure annotations and watermarks appear in the intended visual location regardless of page orientation.

---

## 6. How to Run Tests

### 6.1 Test Runner Commands
```bash
# Run all E2E test tiers
npm test

# Run individual test tiers
npx vitest run test/e2e/tier1-core.spec.ts
npx vitest run test/e2e/tier2-boundary.spec.ts
npx vitest run test/e2e/tier3-pipeline.spec.ts
npx vitest run test/e2e/tier4-stress.spec.ts

# Run with test coverage report
npm test -- --coverage
```

### 6.2 CI/CD Integration Invariants
1. TypeScript compilation (`tsc --noEmit`) must succeed with 0 errors.
2. Full production build (`npm run build`) must succeed.
3. 100% of all 4 test tiers must pass.
4. Zero unhandled promise rejections or memory leaks during test execution.
