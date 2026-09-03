import React from 'react';
import {
  CheckCircle2,
  Download,
  Archive,
  RotateCcw,
} from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

export interface ResultData {
  blob?: Blob;
  filename: string;
  originalSize: number;
  newSize: number;
  zipBlob?: Blob;
  zipFilename?: string;
  extractedText?: string;
}

export interface ResultModalProps {
  isOpen: boolean;
  data: ResultData;
  onClose: () => void;
  onReset: () => void;
  onSelectTool?: (toolId: string) => void;
}

export const ResultModal: React.FC<ResultModalProps> = ({
  isOpen,
  data,
  onClose,
  onReset,
}) => {
  const { t } = useTranslation();

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownloadFile = () => {
    if (!data.blob) return;
    const url = URL.createObjectURL(data.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = data.filename || 'processed_document.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadZip = () => {
    if (!data.zipBlob) return;
    const url = URL.createObjectURL(data.zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = data.zipFilename || 'archive.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const savingsPercent =
    data.originalSize > 0 && data.newSize > 0
      ? Math.round(((data.originalSize - data.newSize) / data.originalSize) * 100)
      : 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="p-6 text-center">
        {/* Success Icon */}
        <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-4 animate-in zoom-in-75 duration-200">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <h3 className="text-2xl font-black text-slate-900 dark:text-white">
          {t('common.success')}
        </h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {t('messages.processSuccess')}
        </p>

        {/* Size Comparison Card */}
        <div className="mt-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-slate-400">{t('common.originalSize')}</div>
              <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                {formatBytes(data.originalSize)}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400">{t('common.newSize')}</div>
              <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center space-x-1">
                <span>{formatBytes(data.newSize)}</span>
                {savingsPercent > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 font-extrabold">
                    -{savingsPercent}%
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Download Action Buttons */}
        <div className="mt-6 space-y-3">
          {data.blob && (
            <Button
              variant="primary"
              size="lg"
              onClick={handleDownloadFile}
              className="w-full"
              iconLeft={<Download className="w-5 h-5" />}
            >
              {t('common.download')} ({data.filename})
            </Button>
          )}

          {data.zipBlob && (
            <Button
              variant="outline"
              size="lg"
              onClick={handleDownloadZip}
              className="w-full"
              iconLeft={<Archive className="w-5 h-5 text-amber-500" />}
            >
              {t('common.downloadZip')}
            </Button>
          )}
        </div>

        {/* Process Another Action */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onClose();
              onReset();
            }}
            iconLeft={<RotateCcw className="w-4 h-4" />}
          >
            {t('common.processAnother')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
