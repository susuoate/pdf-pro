import React from 'react';
import { Play, ShieldCheck } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { Button } from '../common/Button';
import { ProgressBar } from '../common/ProgressBar';

export interface ActionFooterProps {
  toolActionLabel: string;
  totalFiles: number;
  totalPages: number;
  totalSizeBytes: number;
  isProcessing: boolean;
  progress: { percent: number; status: string };
  onExecute: () => void;
  onCancel: () => void;
}

export const ActionFooter: React.FC<ActionFooterProps> = ({
  toolActionLabel,
  totalFiles,
  totalPages,
  totalSizeBytes,
  isProcessing,
  progress,
  onExecute,
  onCancel,
}) => {
  const { t } = useTranslation();

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="sticky bottom-0 z-30 w-full mt-8 p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-2xl">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left: Summary Telemetry */}
        <div className="flex items-center space-x-3 text-xs sm:text-sm">
          <div className="flex items-center space-x-1.5 text-slate-700 dark:text-slate-200 font-bold">
            <span>{totalFiles} {t('common.files')}</span>
            <span>•</span>
            <span>{totalPages} {t('common.pages')}</span>
            <span>•</span>
            <span className="text-rose-600 dark:text-rose-400">{formatBytes(totalSizeBytes)}</span>
          </div>

          <div className="hidden md:flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{t('privacy.statProcessedLocally')}</span>
          </div>
        </div>

        {/* Middle: Progress Streaming Bar */}
        {isProcessing && (
          <div className="w-full sm:max-w-xs">
            <ProgressBar
              percent={progress.percent}
              statusText={progress.status || t('common.processing')}
              color="brand"
              animated
            />
          </div>
        )}

        {/* Right: Actions */}
        <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
          <Button
            variant="ghost"
            size="md"
            onClick={onCancel}
            disabled={isProcessing}
          >
            {t('common.cancel')}
          </Button>

          <Button
            variant="primary"
            size="lg"
            onClick={onExecute}
            isLoading={isProcessing}
            iconLeft={<Play className="w-4 h-4 fill-current" />}
          >
            {toolActionLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};
