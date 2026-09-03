import React, { useState, useRef, useEffect } from 'react';
import { EyeOff, Trash2, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { WorkspaceFile } from '../workspace/UnifiedWorkspace';
import { pdfRendererService } from '../../services/pdfRendererService';

export interface RedactBox {
  id: string;
  x: number; // in percentage
  y: number; // in percentage
  width: number; // in percentage
  height: number; // in percentage
  pageIndex: number;
}

export const RedactWorkspace: React.FC<{
  files: WorkspaceFile[];
  config: any;
  setConfig: React.Dispatch<React.SetStateAction<any>>;
}> = ({ files, config, setConfig }) => {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(0);
  const [pageThumbnails, setPageThumbnails] = useState<string[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentBox, setCurrentBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const redactBoxes: RedactBox[] = config.redactBoxes || [];

  // Render high-res previews for the active document pages
  useEffect(() => {
    let isMounted = true;
    const renderThumbnails = async () => {
      if (!files[0]?.arrayBuffer) return;
      try {
        const doc = await pdfRendererService.loadDocument(files[0].arrayBuffer);
        const count = pdfRendererService.getPageCount(doc);
        const urls: string[] = [];
        for (let i = 1; i <= count; i++) {
          const url = await pdfRendererService.renderThumbnail(doc, i, 900);
          urls.push(url);
        }
        if (isMounted) setPageThumbnails(urls);
        pdfRendererService.destroyDocument(doc);
      } catch (err) {
        console.warn('Failed rendering pages for redact view:', err);
      }
    };
    renderThumbnails();
    return () => {
      isMounted = false;
    };
  }, [files]);

  const handlePointerDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setIsDrawing(true);
    setStartPos({ x, y });
    setCurrentBox({ x, y, w: 0, h: 0 });
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !startPos) return;
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const currX = ((e.clientX - rect.left) / rect.width) * 100;
    const currY = ((e.clientY - rect.top) / rect.height) * 100;

    const x = Math.min(startPos.x, currX);
    const y = Math.min(startPos.y, currY);
    const w = Math.abs(currX - startPos.x);
    const h = Math.abs(currY - startPos.y);

    setCurrentBox({ x, y, w, h });
  };

  const handlePointerUp = () => {
    if (isDrawing && currentBox && currentBox.w > 1 && currentBox.h > 1) {
      const newBox: RedactBox = {
        id: `redact-${Date.now()}`,
        x: currentBox.x,
        y: currentBox.y,
        width: currentBox.w,
        height: currentBox.h,
        pageIndex: currentPage,
      };
      setConfig({
        ...config,
        redactBoxes: [...redactBoxes, newBox],
      });
    }
    setIsDrawing(false);
    setStartPos(null);
    setCurrentBox(null);
  };

  const handleRemoveBox = (id: string) => {
    setConfig({
      ...config,
      redactBoxes: redactBoxes.filter((b) => b.id !== id),
    });
  };

  const totalPages = files[0]?.pageCount || pageThumbnails.length || 1;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Canvas Area */}
      <div className="lg:col-span-8 space-y-4">
        {/* Page Nav */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
            {t('common.page')} {currentPage + 1} / {totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              disabled={currentPage === 0}
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              className="px-3 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-700 disabled:opacity-40 cursor-pointer flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> {t('common.prev')}
            </button>
            <button
              disabled={currentPage >= totalPages - 1}
              onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
              className="px-3 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-700 disabled:opacity-40 cursor-pointer flex items-center gap-1"
            >
              {t('common.next')} <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* PDF Page with Redaction Overlay */}
        <div
          ref={containerRef}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          className="relative mx-auto max-w-lg aspect-[1/1.414] bg-white shadow-xl rounded-xl border border-slate-300 dark:border-slate-700 overflow-hidden select-none cursor-crosshair"
        >
          {pageThumbnails[currentPage] ? (
            <img
              src={pageThumbnails[currentPage]}
              alt={`Page ${currentPage + 1}`}
              className="w-full h-full object-contain pointer-events-none"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
              Loading...
            </div>
          )}

          {/* Active drawing box */}
          {isDrawing && currentBox && (
            <div
              style={{
                top: `${currentBox.y}%`,
                left: `${currentBox.x}%`,
                width: `${currentBox.w}%`,
                height: `${currentBox.h}%`,
              }}
              className="absolute bg-black/90 border border-red-500 pointer-events-none"
            />
          )}

          {/* Render Committed Blackout Boxes */}
          {redactBoxes
            .filter((b) => b.pageIndex === currentPage)
            .map((b) => (
              <div
                key={b.id}
                style={{
                  top: `${b.y}%`,
                  left: `${b.x}%`,
                  width: `${b.width}%`,
                  height: `${b.height}%`,
                }}
                className="absolute group bg-black text-white flex items-center justify-center pointer-events-auto shadow-md"
              >
                <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold select-none opacity-40">
                  REDACTED
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveBox(b.id);
                  }}
                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md"
                >
                  ✕
                </button>
              </div>
            ))}
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="lg:col-span-4">
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
          <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold pb-2 border-b border-slate-200 dark:border-slate-700">
            <EyeOff className="w-5 h-5 text-purple-500" />
            <span>{t('tools.redact.title')}</span>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 text-xs space-y-2">
            <div className="flex items-center space-x-2 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{t('tools.redact.permanentWarning')}</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              {t('tools.redact.warningDesc')}
            </p>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {redactBoxes.length} {t('tools.redact.activeRedactions')}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('tools.redact.dragInstruction')}
            </p>
          </div>

          {redactBoxes.length > 0 && (
            <button
              type="button"
              onClick={() => setConfig({ ...config, redactBoxes: [] })}
              className="w-full py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 flex items-center justify-center space-x-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span>{t('common.clearAll')}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
