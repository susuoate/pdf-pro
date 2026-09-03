import React, { useState, useEffect, useRef } from 'react';
import {
  RotateCw,
  Trash2,
  Copy,
  CheckSquare,
  Square,
  GripVertical,
  Loader2,
  Plus,
  FilePlus2,
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { useTranslation } from '../../context/LanguageContext';
import { WorkspaceFile } from './UnifiedWorkspace';
import { Button } from '../common/Button';
import { pdfRendererService } from '../../services/pdfRendererService';

export interface PageThumbnailItem {
  id: string;
  fileId: string;
  pageIndex: number; // 0-indexed
  rotation: number; // 0, 90, 180, 270
  isSelected: boolean;
  thumbnailUrl?: string;
  isLoading?: boolean;
}

export interface ThumbnailGridProps {
  files: WorkspaceFile[];
  pageItems: PageThumbnailItem[];
  onUpdatePageItems: (items: PageThumbnailItem[]) => void;
  onAddMoreFiles?: (files: WorkspaceFile[]) => void;
}

export const ThumbnailGrid: React.FC<ThumbnailGridProps> = ({
  files,
  pageItems,
  onUpdatePageItems,
  onAddMoreFiles,
}) => {
  const { t } = useTranslation();
  const [zoomLevel, setZoomLevel] = useState<'sm' | 'md' | 'lg'>('md');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [thumbnailsMap, setThumbnailsMap] = useState<Record<string, string>>({});
  const gridAddFileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize page items when files change (initial load, add more files, remove files)
  useEffect(() => {
    if (files.length === 0) {
      if (pageItems.length > 0) onUpdatePageItems([]);
      return;
    }

    const existingFileIds = new Set(pageItems.map((it) => it.fileId));
    const validFileIds = new Set(files.map((f) => f.id));
    const retainedItems = pageItems.filter((it) => validFileIds.has(it.fileId));

    const newItems: PageThumbnailItem[] = [];
    for (const file of files) {
      if (!existingFileIds.has(file.id)) {
        const count = file.pageCount || 1;
        for (let i = 0; i < count; i++) {
          newItems.push({
            id: `${file.id}-page-${i}`,
            fileId: file.id,
            pageIndex: i,
            rotation: 0,
            isSelected: false,
          });
        }
      }
    }

    if (pageItems.length === 0) {
      // First load of files
      const allInitial: PageThumbnailItem[] = files.flatMap((f) =>
        Array.from({ length: f.pageCount || 1 }, (_, i) => ({
          id: `${f.id}-page-${i}`,
          fileId: f.id,
          pageIndex: i,
          rotation: 0,
          isSelected: false,
        }))
      );
      onUpdatePageItems(allInitial);
    } else if (newItems.length > 0 || retainedItems.length !== pageItems.length) {
      // Additional files added or deleted
      onUpdatePageItems([...retainedItems, ...newItems]);
    }
  }, [files]);

  // Load thumbnails asynchronously without mutating or detaching buffer
  useEffect(() => {
    let isMounted = true;

    const loadAllThumbnails = async () => {
      for (const file of files) {
        const isPdf = file.file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
        const isImage = file.file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(file.name);

        if (isImage) {
          const imgUrl = URL.createObjectURL(file.file);
          if (isMounted) {
            setThumbnailsMap((prev) => ({ ...prev, [`${file.id}_0`]: imgUrl }));
          }
        } else if (isPdf && file.arrayBuffer) {
          try {
            // Load PDF safely with cloned buffer
            const docProxy = await pdfRendererService.loadDocument(file.arrayBuffer);
            const numPages = pdfRendererService.getPageCount(docProxy);

            for (let pageNum = 1; pageNum <= numPages; pageNum++) {
              if (!isMounted) break;
              const pageIdx = pageNum - 1;
              const thumbKey = `${file.id}_${pageIdx}`;

              // Render if not yet in cache
              if (!thumbnailsMap[thumbKey]) {
                const thumbUrl = await pdfRendererService.renderThumbnail(docProxy, pageNum, 400);
                if (isMounted && thumbUrl) {
                  setThumbnailsMap((prev) => ({ ...prev, [thumbKey]: thumbUrl }));
                }
              }
            }
            pdfRendererService.destroyDocument(docProxy);
          } catch (err) {
            console.error(`[ThumbnailGrid] Error rendering thumbnails for ${file.name}:`, err);
          }
        }
      }
    };

    loadAllThumbnails();

    return () => {
      isMounted = false;
    };
  }, [files]);

  // Handle adding more files from grid button / dropcard
  const handleAddFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !onAddMoreFiles) return;
    const rawFiles = Array.from(e.target.files);
    const newFiles: WorkspaceFile[] = [];

    for (const file of rawFiles) {
      const buffer = await file.arrayBuffer();
      let pageCount = 1;
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      if (isPdf) {
        try {
          const doc = await PDFDocument.load(new Uint8Array(buffer.slice(0)), { ignoreEncryption: true });
          pageCount = doc.getPageCount();
        } catch (err) {
          console.warn('Could not parse page count:', err);
        }
      }
      newFiles.push({
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        file,
        name: file.name,
        size: file.size,
        arrayBuffer: buffer,
        pageCount,
      });
    }

    if (newFiles.length > 0) {
      onAddMoreFiles(newFiles);
    }
    e.target.value = '';
  };

  // Derive current items
  const items: PageThumbnailItem[] =
    pageItems.length > 0
      ? pageItems
      : files.flatMap((f) =>
          Array.from({ length: f.pageCount || 1 }, (_, i) => ({
            id: `${f.id}-page-${i}`,
            fileId: f.id,
            pageIndex: i,
            rotation: 0,
            isSelected: false,
          }))
        );

  const handleRotatePage = (index: number, angle: number) => {
    const updated = [...items];
    updated[index].rotation = (updated[index].rotation + angle + 360) % 360;
    onUpdatePageItems(updated);
  };

  const handleDeletePage = (index: number) => {
    const updated = items.filter((_, idx) => idx !== index);
    onUpdatePageItems(updated);
  };

  const handleDuplicatePage = (index: number) => {
    const target = items[index];
    const duplicateItem: PageThumbnailItem = {
      ...target,
      id: `${target.id}-copy-${Date.now()}`,
    };
    const updated = [...items];
    updated.splice(index + 1, 0, duplicateItem);
    onUpdatePageItems(updated);
  };

  const handleToggleSelect = (index: number) => {
    const updated = [...items];
    updated[index].isSelected = !updated[index].isSelected;
    onUpdatePageItems(updated);
  };

  const handleSelectAll = (select: boolean) => {
    const updated = items.map((it) => ({ ...it, isSelected: select }));
    onUpdatePageItems(updated);
  };

  // Drag and Drop reordering
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const reordered = [...items];
    const [moved] = reordered.splice(draggedIndex, 1);
    reordered.splice(index, 0, moved);
    setDraggedIndex(index);
    onUpdatePageItems(reordered);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const getGridCols = () => {
    switch (zoomLevel) {
      case 'sm':
        return 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8';
      case 'lg':
        return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3';
      case 'md':
      default:
        return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5';
    }
  };

  return (
    <div className="space-y-4">
      {/* Hidden file input for adding more files */}
      <input
        type="file"
        ref={gridAddFileInputRef}
        onChange={handleAddFiles}
        multiple
        accept=".pdf,image/*"
        className="hidden"
      />

      {/* Grid Toolbar Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
        <div className="flex items-center space-x-2">
          {onAddMoreFiles && (
            <Button
              variant="secondary"
              size="xs"
              onClick={() => gridAddFileInputRef.current?.click()}
              iconLeft={<Plus className="w-3.5 h-3.5" />}
            >
              {t('common.addMoreFiles')}
            </Button>
          )}
          <Button variant="ghost" size="xs" onClick={() => handleSelectAll(true)}>
            {t('common.selectAll')}
          </Button>
          <Button variant="ghost" size="xs" onClick={() => handleSelectAll(false)}>
            {t('common.deselectAll')}
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-slate-400">{t('common.preview')}:</span>
          {(['sm', 'md', 'lg'] as const).map((z) => (
            <button
              key={z}
              onClick={() => setZoomLevel(z)}
              className={`px-2 py-1 rounded font-bold uppercase cursor-pointer ${
                zoomLevel === z
                  ? 'bg-rose-500 text-white'
                  : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {z}
            </button>
          ))}
        </div>
      </div>

      {/* Thumbnails Grid */}
      <div className={`grid ${getGridCols()} gap-4`}>
        {items.map((item, idx) => {
          const thumbKey = `${item.fileId}_${item.pageIndex}`;
          const currentThumb = thumbnailsMap[thumbKey] || item.thumbnailUrl;

          return (
            <div
              key={item.id}
              draggable
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
              className={`group relative flex flex-col rounded-2xl bg-white dark:bg-slate-800 border-2 transition-all cursor-grab active:cursor-grabbing overflow-hidden shadow-xs hover:shadow-md ${
                item.isSelected
                  ? 'border-rose-500 ring-2 ring-rose-500/30'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
              }`}
            >
              {/* Page Header Bar */}
              <div className="p-2 flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
                <button
                  onClick={() => handleToggleSelect(idx)}
                  className="text-slate-400 hover:text-rose-500 cursor-pointer"
                >
                  {item.isSelected ? (
                    <CheckSquare className="w-4 h-4 text-rose-500" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
                <span className="font-bold text-slate-700 dark:text-slate-200">
                  {t('common.page')} {idx + 1}
                </span>
                <GripVertical className="w-3.5 h-3.5 text-slate-400" />
              </div>

              {/* Thumbnail Canvas / Image Area */}
              <div className="aspect-[3/4] p-2 flex items-center justify-center bg-slate-100 dark:bg-slate-900/60 overflow-hidden relative">
                {currentThumb ? (
                  <img
                    src={currentThumb}
                    alt={`Page ${idx + 1}`}
                    style={{ transform: `rotate(${item.rotation}deg)` }}
                    className="max-h-full max-w-full object-contain shadow-xs transition-transform duration-200"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
                    <span className="text-[10px]">Loading preview...</span>
                  </div>
                )}

                {/* Hover Quick Actions Overlay */}
                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 transition-opacity backdrop-blur-xs">
                  <button
                    onClick={() => handleRotatePage(idx, 90)}
                    title={t('common.rotateRight')}
                    className="p-1.5 rounded-lg bg-white/90 text-slate-800 hover:bg-white hover:text-rose-600 cursor-pointer shadow-xs"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDuplicatePage(idx)}
                    title={t('common.duplicate')}
                    className="p-1.5 rounded-lg bg-white/90 text-slate-800 hover:bg-white hover:text-rose-600 cursor-pointer shadow-xs"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeletePage(idx)}
                    title={t('common.delete')}
                    className="p-1.5 rounded-lg bg-white/90 text-rose-600 hover:bg-rose-600 hover:text-white cursor-pointer shadow-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Add More Files Card at the end of the grid */}
        {onAddMoreFiles && (
          <div
            onClick={() => gridAddFileInputRef.current?.click()}
            className="aspect-[3/4] p-4 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-rose-300 dark:border-rose-700/60 bg-rose-50/40 dark:bg-rose-950/20 hover:bg-rose-100/60 dark:hover:bg-rose-900/30 text-rose-600 dark:text-rose-400 cursor-pointer transition-all hover:scale-[1.02] shadow-xs group"
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <FilePlus2 className="w-6 h-6 text-rose-600 dark:text-rose-400" />
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {t('common.addMoreFiles')}
            </span>
            <span className="text-[10px] text-slate-400 mt-1 text-center">
              + PDF / Images
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
