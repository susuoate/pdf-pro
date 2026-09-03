## 2026-08-25T07:31:11Z

<USER_REQUEST>
You are Milestone 1 Explorer 2 (Core Engine Services).
Your working directory is: c:\Users\oate_\Desktop\pdf pro\.agents\m1_explorer_2
Read:
- ORIGINAL_REQUEST.md: c:\Users\oate_\Desktop\pdf pro\.agents\ORIGINAL_REQUEST.md
- PROJECT.md: c:\Users\oate_\Desktop\pdf pro\PROJECT.md

Scope: Milestone 1 — Core Engine Services & Types Layer.
Investigate and design the service layer per PROJECT.md Section 5:
1. `src/types/pdf.ts`, `src/types/tool.ts`, `src/types/annotation.ts`, `src/types/i18n.ts`.
2. `src/services/fontService.ts`: `@pdf-lib/fontkit` registration, Thai font loading (Sarabun, Prompt) with fallback.
3. `src/services/pdfRendererService.ts`: `pdfjs-dist` initialization, page rendering to canvas, high-DPI thumbnail generation, text extraction.
4. `src/services/pdfService.ts`: foundational PDF document creation, loading, metadata inspection/modification, page manipulation primitives.
5. `src/services/canvasService.ts`: 2D canvas drawing primitives, bezier smoothing, white background removal, blob conversion.
6. `src/services/zipService.ts`: JSZip archive creation and file download.
7. `src/utils/geometry.ts`: Exact coordinate transformation between screen/viewport pixels and PDF point units with rotation angles.
8. `src/utils/formatters.ts` & `src/utils/fileValidation.ts`: magic byte verification.

Write your report to: `c:\Users\oate_\Desktop\pdf pro\.agents\m1_explorer_2\report.md`
Write your handoff to: `c:\Users\oate_\Desktop\pdf pro\.agents\m1_explorer_2\handoff.md`
Send a completion message when finished.
</USER_REQUEST>
