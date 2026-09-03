## 2026-08-25T07:34:03Z

You are Milestone 1 Worker for PDF Pro.
Your working directory is: c:\Users\oate_\Desktop\pdf pro\.agents\m1_worker

Read:
- ORIGINAL_REQUEST.md: c:\Users\oate_\Desktop\pdf pro\.agents\ORIGINAL_REQUEST.md
- PROJECT.md: c:\Users\oate_\Desktop\pdf pro\PROJECT.md
- M1 Explorer 1 Report: c:\Users\oate_\Desktop\pdf pro\.agents\m1_explorer_1\report.md
- M1 Explorer 2 Report: c:\Users\oate_\Desktop\pdf pro\.agents\m1_explorer_2\report.md
- M1 Explorer 3 Report: c:\Users\oate_\Desktop\pdf pro\.agents\m1_explorer_3\report.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Scope: Implement Milestone 1 — Project Foundation, Core Engine Services, Shared Design System, Dual Language (TH/EN) Localization, Dashboard, and 5-Phase Unified Workspace.

Tasks:
1. Initialize project files in `c:\Users\oate_\Desktop\pdf pro\`:
   - `package.json`
   - `vite.config.ts`
   - `tsconfig.json`
   - `tsconfig.node.json`
   - `tailwind.config.js`
   - `postcss.config.js`
   - `index.html`
   - `src/vite-env.d.ts`
   - `src/index.css` (include Tailwind directives and Thai font typography rules)
   - `src/main.tsx`
2. Static assets in `public/`:
   - Create `public/favicon.svg`
   - Create `public/fonts/` (ensure font files or valid font binary headers/fallbacks are present for Sarabun-Regular.ttf, Sarabun-Bold.ttf, Prompt-Regular.ttf)
3. Types in `src/types/`:
   - `pdf.ts`, `tool.ts`, `annotation.ts`, `i18n.ts`
4. Utilities in `src/utils/`:
   - `cn.ts`, `geometry.ts`, `formatters.ts`, `fileValidation.ts`
5. Services in `src/services/`:
   - `fontService.ts`, `pdfRendererService.ts`, `pdfService.ts`, `canvasService.ts`, `ocrService.ts`, `zipService.ts`, `compressionService.ts`
6. Locales & i18n in `src/locales/`:
   - `types.ts`, `en.ts`, `th.ts`, `index.ts` (complete coverage for all 17 tools and UI elements)
7. State Contexts in `src/context/`:
   - `ThemeContext.tsx`, `LanguageContext.tsx`
8. UI Components in `src/components/`:
   - `common/Button.tsx`, `common/ProgressBar.tsx`, `common/ToastContainer.tsx`, `common/Modal.tsx`
   - `layout/Header.tsx`, `layout/Footer.tsx`, `layout/AppShell.tsx`
   - `dashboard/HeroSection.tsx`, `dashboard/QuickSearchModal.tsx`, `dashboard/CategoryTabs.tsx`, `dashboard/ToolCardGrid.tsx`
   - `workspace/UnifiedWorkspace.tsx`, `workspace/DropZone.tsx`, `workspace/ThumbnailGrid.tsx`, `workspace/ActionFooter.tsx`, `workspace/ResultModal.tsx`
9. Main Application Root:
   - `src/App.tsx`
10. Run `npm.cmd install`, run `npx.cmd tsc --noEmit` and `npm.cmd run build`. Verify that build passes with zero errors.

Write your handoff to `c:\Users\oate_\Desktop\pdf pro\.agents\m1_worker\handoff.md`.
Send a completion message when finished with build verification results.
