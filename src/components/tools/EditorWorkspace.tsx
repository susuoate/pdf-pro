import React, { useState, useRef, useEffect } from 'react';
import {
  Edit3,
  Type,
  Square,
  Circle,
  ArrowRight,
  Highlighter,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { WorkspaceFile } from '../workspace/UnifiedWorkspace';
import { pdfRendererService } from '../../services/pdfRendererService';
import { canvasService, DrawingStroke } from '../../services/canvasService';

export type ToolMode = 'draw' | 'highlighter' | 'text' | 'rect' | 'circle' | 'arrow';

export interface TextAnnotation {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  pageIndex: number;
}

export interface ShapeAnnotation {
  id: string;
  type: 'rect' | 'circle' | 'arrow';
  start: { x: number; y: number };
  end: { x: number; y: number };
  color: string;
  strokeWidth: number;
  pageIndex: number;
}

export const EditorWorkspace: React.FC<{
  files: WorkspaceFile[];
  config: any;
  setConfig: React.Dispatch<React.SetStateAction<any>>;
}> = ({ files, config, setConfig }) => {
  const { t } = useTranslation();
  const [activeTool, setActiveTool] = useState<ToolMode>('draw');
  const [penColor, setPenColor] = useState('#ef4444');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageThumbnails, setPageThumbnails] = useState<string[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<{ x: number; y: number }[]>([]);
  const [shapeStart, setShapeStart] = useState<{ x: number; y: number } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const textAnnotations: TextAnnotation[] = config.textAnnotations || [];
  const strokes: DrawingStroke[] = config.strokes || [];
  const shapes: ShapeAnnotation[] = config.shapes || [];

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
        console.warn('Failed rendering pages for editor:', err);
      }
    };
    renderThumbnails();
    return () => {
      isMounted = false;
    };
  }, [files]);

  // Redraw canvas annotations whenever strokes/shapes or active page changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all strokes for current page
    strokes.forEach((s) => {
      canvasService.drawSmoothStroke(ctx, s);
    });

    // Draw all shapes for current page
    shapes
      .filter((sh) => sh.pageIndex === currentPage)
      .forEach((sh) => {
        canvasService.drawShape(ctx, sh.type, sh.start, sh.end, {
          strokeColor: sh.color,
          strokeWidth: sh.strokeWidth,
          opacity: 1.0,
        });
      });
  }, [strokes, shapes, currentPage]);

  const handlePointerDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === 'text') {
      const promptText = window.prompt(t('tools.editor.addTextPrompt') || 'Enter text:');
      if (promptText) {
        const newText: TextAnnotation = {
          id: `text-${Date.now()}`,
          text: promptText,
          x,
          y,
          fontSize: 16,
          color: penColor,
          pageIndex: currentPage,
        };
        setConfig({
          ...config,
          textAnnotations: [...textAnnotations, newText],
        });
      }
      return;
    }

    if (activeTool === 'draw' || activeTool === 'highlighter') {
      setIsDrawing(true);
      setCurrentStroke([{ x, y }]);
    } else {
      // Shape start
      setIsDrawing(true);
      setShapeStart({ x, y });
    }
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === 'draw' || activeTool === 'highlighter') {
      const updatedPts = [...currentStroke, { x, y }];
      setCurrentStroke(updatedPts);
      canvasService.drawSmoothStroke(ctx, {
        points: updatedPts,
        color: penColor,
        width: activeTool === 'highlighter' ? 18 : strokeWidth,
        opacity: activeTool === 'highlighter' ? 0.35 : 1.0,
        isHighlighter: activeTool === 'highlighter',
      });
    }
  };

  const handlePointerUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === 'draw' || activeTool === 'highlighter') {
      if (currentStroke.length > 0) {
        const newStroke: DrawingStroke = {
          points: currentStroke,
          color: penColor,
          width: activeTool === 'highlighter' ? 18 : strokeWidth,
          opacity: activeTool === 'highlighter' ? 0.35 : 1.0,
          isHighlighter: activeTool === 'highlighter',
        };
        setConfig({
          ...config,
          strokes: [...strokes, newStroke],
        });
      }
      setCurrentStroke([]);
    } else if (shapeStart) {
      const newShape: ShapeAnnotation = {
        id: `shape-${Date.now()}`,
        type: activeTool as any,
        start: shapeStart,
        end: { x, y },
        color: penColor,
        strokeWidth,
        pageIndex: currentPage,
      };
      setConfig({
        ...config,
        shapes: [...shapes, newShape],
      });
      setShapeStart(null);
    }
  };

  const handleClearCurrentPage = () => {
    setConfig({
      ...config,
      strokes: [],
      shapes: shapes.filter((sh) => sh.pageIndex !== currentPage),
      textAnnotations: textAnnotations.filter((t) => t.pageIndex !== currentPage),
    });
  };

  const totalPages = files[0]?.pageCount || pageThumbnails.length || 1;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Canvas Viewport */}
      <div className="lg:col-span-8 space-y-4">
        {/* Page Nav Header */}
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

        {/* Document Canvas Container */}
        <div className="relative mx-auto max-w-lg aspect-[1/1.414] bg-white shadow-xl rounded-xl border border-slate-300 dark:border-slate-700 overflow-hidden select-none">
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

          {/* Interactive Annotation Canvas Overlay */}
          <canvas
            ref={canvasRef}
            width={512}
            height={724}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            className="absolute inset-0 w-full h-full cursor-crosshair z-10 touch-none"
          />

          {/* Render Text Annotations */}
          {textAnnotations
            .filter((t) => t.pageIndex === currentPage)
            .map((txt) => (
              <div
                key={txt.id}
                style={{
                  top: `${(txt.y / 724) * 100}%`,
                  left: `${(txt.x / 512) * 100}%`,
                  fontSize: `${txt.fontSize}px`,
                  color: txt.color,
                }}
                className="absolute z-20 font-bold bg-white/80 dark:bg-slate-900/80 px-1 rounded shadow-xs cursor-move pointer-events-auto"
              >
                {txt.text}
              </div>
            ))}
        </div>
      </div>

      {/* Right Tool Palette Sidebar */}
      <div className="lg:col-span-4">
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
          <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold pb-2 border-b border-slate-200 dark:border-slate-700">
            <Edit3 className="w-5 h-5 text-blue-500" />
            <span>{t('tools.editor.title')}</span>
          </div>

          {/* Tool Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {t('common.tools')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'draw', label: 'Pen', icon: Edit3 },
                { id: 'highlighter', label: 'Highlight', icon: Highlighter },
                { id: 'text', label: 'Text', icon: Type },
                { id: 'rect', label: 'Rectangle', icon: Square },
                { id: 'circle', label: 'Circle', icon: Circle },
                { id: 'arrow', label: 'Arrow', icon: ArrowRight },
              ].map((tool) => {
                const Icon = tool.icon;
                return (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => setActiveTool(tool.id as any)}
                    className={`p-2.5 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      activeTool === tool.id
                        ? 'border-2 border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tool.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Palette */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {t('common.color')}
            </label>
            <div className="flex items-center space-x-2">
              {['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#0f172a'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setPenColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-7 h-7 rounded-full border-2 transition-all cursor-pointer ${
                    penColor === c ? 'border-white ring-2 ring-blue-500 scale-110' : 'border-transparent'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Stroke Width Slider */}
          {activeTool !== 'text' && (
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                {t('common.thickness')}: {strokeWidth}px
              </label>
              <input
                type="range"
                min={1}
                max={15}
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>
          )}

          {/* Actions */}
          <button
            type="button"
            onClick={handleClearCurrentPage}
            className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span>{t('tools.editor.clearPageAnnotations')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
