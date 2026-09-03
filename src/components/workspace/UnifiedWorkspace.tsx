import React, { useState, useRef } from 'react';
import { ArrowLeft, RotateCcw, Plus } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { useTranslation } from '../../context/LanguageContext';
import { DropZone } from './DropZone';
import { ThumbnailGrid, PageThumbnailItem } from './ThumbnailGrid';
import { ActionFooter } from './ActionFooter';
import { ResultModal, ResultData } from './ResultModal';
import { Button } from '../common/Button';

export interface WorkspaceFile {
  id: string;
  file: File;
  name: string;
  size: number;
  arrayBuffer: ArrayBuffer;
  pageCount?: number;
  thumbnails?: string[];
}

export interface UnifiedWorkspaceProps {
  toolId: string;
  title: string;
  description: string;
  badge?: string;
  acceptedTypes?: string[];
  maxFiles?: number;
  isMultiFile?: boolean;
  onBack: () => void;
  onExecute: (
    files: WorkspaceFile[],
    config: any,
    updateProgress: (percent: number, status: string) => void
  ) => Promise<ResultData>;
  renderSidebar?: (
    files: WorkspaceFile[],
    config: any,
    setConfig: React.Dispatch<React.SetStateAction<any>>,
    onAddMoreFiles?: (files: WorkspaceFile[]) => void
  ) => React.ReactNode;
  renderCustomPreview?: (
    files: WorkspaceFile[],
    config: any,
    setConfig: React.Dispatch<React.SetStateAction<any>>
  ) => React.ReactNode;
}

export const UnifiedWorkspace: React.FC<UnifiedWorkspaceProps> = ({
  toolId,
  title,
  description,
  badge,
  acceptedTypes = ['.pdf'],
  maxFiles = 50,
  isMultiFile = true,
  onBack,
  onExecute,
  renderSidebar,
  renderCustomPreview,
}) => {
  const { t } = useTranslation();
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [pageItems, setPageItems] = useState<PageThumbnailItem[]>([]);
  const [config, setConfig] = useState<any>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ percent: 0, status: '' });
  const [resultData, setResultData] = useState<ResultData | null>(null);
  const addMoreInputRef = useRef<HTMLInputElement>(null);

  const handleFilesSelected = (newFiles: WorkspaceFile[]) => {
    setFiles(isMultiFile ? [...files, ...newFiles] : newFiles);
  };

  const handleAddMoreFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const rawFiles = Array.from(e.target.files);
    const newWorkspaceFiles: WorkspaceFile[] = [];

    for (const file of rawFiles) {
      const buffer = await file.arrayBuffer();
      let pageCount = 1;
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      if (isPdf) {
        try {
          const doc = await PDFDocument.load(new Uint8Array(buffer.slice(0)), { ignoreEncryption: true });
          pageCount = doc.getPageCount();
        } catch (err) {
          console.warn('Could not read page count:', err);
        }
      }
      newWorkspaceFiles.push({
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        file,
        name: file.name,
        size: file.size,
        arrayBuffer: buffer,
        pageCount,
      });
    }

    if (newWorkspaceFiles.length > 0) {
      handleFilesSelected(newWorkspaceFiles);
    }
    e.target.value = '';
  };

  const handleReset = () => {
    setFiles([]);
    setPageItems([]);
    setProgress({ percent: 0, status: '' });
    setResultData(null);
  };

  const handleRunExecution = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setProgress({ percent: 10, status: t('common.statusRunning') });

    try {
      const mergedConfig = { ...config, pageItems };
      const outcome = await onExecute(files, mergedConfig, (percent, status) => {
        setProgress({ percent, status });
      });
      setResultData(outcome);
      setIsProcessing(false);
    } catch (err: any) {
      console.error('Workspace Execution Error:', err);
      setIsProcessing(false);
      alert(err?.message || t('messages.processFailed'));
    }
  };

  const totalPages = files.reduce((acc, f) => acc + (f.pageCount || 1), 0);
  const totalSizeBytes = files.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="flex flex-col min-h-[calc(100vh-140px)]">
      {/* Workspace Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={onBack} iconLeft={<ArrowLeft className="w-4 h-4" />}>
            {t('common.backToTools')}
          </Button>

          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {title}
              </h2>
              {badge && (
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
                  {badge}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 line-clamp-1">
              {description}
            </p>
          </div>
        </div>

        {files.length > 0 && (
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
              {files.length} {t('common.files')} • {totalPages} {t('common.pages')}
            </div>

            {isMultiFile && (
              <>
                <input
                  type="file"
                  ref={addMoreInputRef}
                  onChange={handleAddMoreFilesChange}
                  multiple
                  accept={acceptedTypes.join(',')}
                  className="hidden"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => addMoreInputRef.current?.click()}
                  iconLeft={<Plus className="w-3.5 h-3.5" />}
                >
                  {t('common.addMoreFiles')}
                </Button>
              </>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              iconLeft={<RotateCcw className="w-3.5 h-3.5" />}
            >
              {t('common.clearAll')}
            </Button>
          </div>
        )}
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 py-6">
        {files.length === 0 ? (
          /* PHASE 1: DropZone */
          <DropZone
            acceptedTypes={acceptedTypes}
            maxFiles={maxFiles}
            isMultiFile={isMultiFile}
            onFilesSelected={handleFilesSelected}
          />
        ) : (
          /* PHASE 2 & 3: Active Workspace Canvas / Grid + Sidebar */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Area: Visual Thumbnails or Custom Interactive Canvas */}
            <div className={renderSidebar ? 'lg:col-span-8' : 'lg:col-span-12'}>
              {renderCustomPreview ? (
                renderCustomPreview(files, config, setConfig)
              ) : (
                <ThumbnailGrid
                  files={files}
                  pageItems={pageItems}
                  onUpdatePageItems={(items) => {
                    setPageItems(items);
                    setConfig((prev: any) => ({ ...prev, pageItems: items }));
                  }}
                  onAddMoreFiles={handleFilesSelected}
                />
              )}
            </div>

            {/* Right Area: Tool Configuration Sidebar */}
            {renderSidebar && (
              <div className="lg:col-span-4">
                <div className="sticky top-24 p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
                  {renderSidebar(files, config, setConfig, handleFilesSelected)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* PHASE 4: Action Footer */}
      {files.length > 0 && (
        <ActionFooter
          toolActionLabel={t(`tools.${toolId}.action`)}
          totalFiles={files.length}
          totalPages={totalPages}
          totalSizeBytes={totalSizeBytes}
          isProcessing={isProcessing}
          progress={progress}
          onExecute={handleRunExecution}
          onCancel={handleReset}
        />
      )}

      {/* PHASE 5: Result Modal */}
      {resultData && (
        <ResultModal
          isOpen={!!resultData}
          data={resultData}
          onClose={() => setResultData(null)}
          onReset={handleReset}
          onSelectTool={(_nextToolId) => {
            setResultData(null);
          }}
        />
      )}
    </div>
  );
};
