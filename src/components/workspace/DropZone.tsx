import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, Sparkles, ShieldCheck } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { Button } from '../common/Button';
import { WorkspaceFile } from './UnifiedWorkspace';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface DropZoneProps {
  acceptedTypes?: string[];
  maxFiles?: number;
  isMultiFile?: boolean;
  onFilesSelected: (files: WorkspaceFile[]) => void;
}

export const DropZone: React.FC<DropZoneProps> = ({
  acceptedTypes = ['.pdf'],
  maxFiles = 50,
  isMultiFile = true,
  onFilesSelected,
}) => {
  const { t } = useTranslation();
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoadingSample, setIsLoadingSample] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = async (fileList: FileList | File[]) => {
    const rawFiles = Array.from(fileList).slice(0, maxFiles);
    const validFiles: WorkspaceFile[] = [];

    for (const file of rawFiles) {
      const buffer = await file.arrayBuffer();
      let pageCount = 1;
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

      if (isPdf) {
        try {
          const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
          pageCount = pdfDoc.getPageCount();
        } catch (err) {
          console.warn('Could not read page count with pdf-lib, defaulting to 1:', err);
        }
      }

      validFiles.push({
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        file,
        name: file.name,
        size: file.size,
        arrayBuffer: buffer,
        pageCount,
      });
    }

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(e.dataTransfer.files);
    }
  };

  // Synthetic Instant Sample Generator
  const handleLoadSample = async () => {
    setIsLoadingSample(true);
    try {
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

      for (let i = 1; i <= 3; i++) {
        const page = pdfDoc.addPage([595.28, 841.89]); // A4
        page.drawText(`PDF Pro Sample Document - Page ${i}`, {
          x: 50,
          y: 780,
          size: 20,
          font,
          color: rgb(0.88, 0.11, 0.28),
        });
        page.drawText(
          `This synthetic PDF was generated 100% in client-side WebAssembly memory.\nZero server upload guarantee verified.`,
          {
            x: 50,
            y: 720,
            size: 13,
            font: regularFont,
            color: rgb(0.2, 0.2, 0.2),
          }
        );
      }
      const pdfBytes = await pdfDoc.save();
      const sampleBlob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const sampleFile = new File([sampleBlob], 'sample_document.pdf', {
        type: 'application/pdf',
      });

      await processFiles([sampleFile]);
    } catch (err) {
      console.error('Failed to generate sample PDF:', err);
    } finally {
      setIsLoadingSample(false);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative flex flex-col items-center justify-center p-10 sm:p-16 rounded-3xl border-2 border-dashed transition-all ${
        isDragOver
          ? 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/30 scale-[1.01]'
          : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/40 hover:border-slate-400 dark:hover:border-slate-600'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple={isMultiFile}
        accept={acceptedTypes.join(',')}
        className="hidden"
        onChange={(e) => e.target.files && processFiles(e.target.files)}
      />

      {/* Cloud Upload Icon */}
      <div className="w-20 h-20 rounded-3xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-6 shadow-md shadow-rose-500/10">
        <UploadCloud className="w-10 h-10 animate-bounce" />
      </div>

      <h3 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-slate-100 text-center">
        {t('common.dragDropHere')}
      </h3>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 text-center max-w-md">
        {t('common.orClickToUpload')}
      </p>

      {/* Action Buttons */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Button
          variant="primary"
          size="lg"
          onClick={() => fileInputRef.current?.click()}
          iconLeft={<FileText className="w-5 h-5" />}
        >
          {t('common.selectFiles')}
        </Button>

        <Button
          variant="outline"
          size="lg"
          onClick={handleLoadSample}
          isLoading={isLoadingSample}
          iconLeft={<Sparkles className="w-4 h-4 text-amber-500" />}
        >
          {t('common.trySample')}
        </Button>
      </div>

      {/* Trust & Constraint Footnote */}
      <div className="mt-8 flex items-center space-x-2 text-xs text-slate-400">
        <ShieldCheck className="w-4 h-4 text-emerald-500" />
        <span>{t('common.fileLimitHint')}</span>
      </div>
    </div>
  );
};
