import React, { useState } from 'react';
import { ScanText, Copy, Download, Check, Languages } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { WorkspaceFile } from '../workspace/UnifiedWorkspace';

export const OcrWorkspace: React.FC<{
  files: WorkspaceFile[];
  config: any;
  setConfig: React.Dispatch<React.SetStateAction<any>>;
}> = ({ files, config, setConfig }) => {
  const { t } = useTranslation();
  const lang = config.ocrLang || 'eng+tha';
  const extractedText = config.extractedText || '';
  const [copied, setCopied] = useState(false);

  const totalPages = files[0]?.pageCount || 1;
  const pageItems = config.pageItems || [];

  // Selected pages from thumbnail grid checkboxes (1-indexed)
  const selectedPages: number[] = pageItems
    .filter((it: any) => it.isSelected)
    .map((it: any) => it.pageIndex + 1);

  const activePagesCount = pageItems.length > 0 ? pageItems.length : totalPages;

  const handleToggleSelectAll = (select: boolean) => {
    const updated = pageItems.map((it: any) => ({ ...it, isSelected: select }));
    setConfig({
      ...config,
      pageItems: updated,
    });
  };

  const handleSelectOdd = () => {
    const updated = pageItems.map((it: any) => ({
      ...it,
      isSelected: (it.pageIndex + 1) % 2 !== 0,
    }));
    setConfig({
      ...config,
      pageItems: updated,
    });
  };

  const handleSelectEven = () => {
    const updated = pageItems.map((it: any) => ({
      ...it,
      isSelected: (it.pageIndex + 1) % 2 === 0,
    }));
    setConfig({
      ...config,
      pageItems: updated,
    });
  };

  const handleCopy = () => {
    if (!extractedText) return;
    navigator.clipboard.writeText(extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    if (!extractedText) return;
    const blob = new Blob([extractedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `extracted_ocr_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold pb-2 border-b border-slate-200 dark:border-slate-700">
        <ScanText className="w-5 h-5 text-emerald-500" />
        <span>{t('tools.ocr.title')}</span>
      </div>

      {/* Language Selector */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Languages className="w-3.5 h-3.5 text-emerald-500" />
          <span>{t('config.ocrLanguage')}</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'eng+tha', label: `${t('config.ocrLangThaiEng')} 🇹🇭🇬🇧` },
            { id: 'tha', label: `${t('config.ocrLangThai')} 🇹🇭` },
            { id: 'eng', label: `${t('config.ocrLangEng')} 🇬🇧` },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setConfig({ ...config, ocrLang: item.id })}
              className={`p-2 rounded-xl text-xs font-semibold border text-center transition-all cursor-pointer ${
                lang === item.id
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Page Selection Scope Banner */}
      <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-xs">
        <div className="flex items-center justify-between font-bold text-emerald-700 dark:text-emerald-400">
          <span>ขอบเขตหน้าที่ต้องการสแกน:</span>
          <span>
            {selectedPages.length > 0
              ? `${selectedPages.length} หน้าที่เลือก`
              : `ทั้งหมด ${activePagesCount} หน้า`}
          </span>
        </div>
        {selectedPages.length > 0 ? (
          <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-300 font-mono">
            หน้า: {selectedPages.join(', ')}
          </p>
        ) : (
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            ระบบจะสแกนทุกหน้าที่เหลือในตารางพรีวิว (สามารถติ๊กเลือกเฉพาะหน้าที่ต้องการได้)
          </p>
        )}
      </div>

      {/* Quick Selection Buttons */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
          เครื่องมือเลือกหน้า:
        </label>
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => handleToggleSelectAll(true)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-emerald-600 hover:border-emerald-300 font-medium transition-colors cursor-pointer"
          >
            เลือกทั้งหมด
          </button>
          <button
            type="button"
            onClick={() => handleToggleSelectAll(false)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-emerald-600 hover:border-emerald-300 font-medium transition-colors cursor-pointer"
          >
            ยกเลิกการเลือก
          </button>
          <button
            type="button"
            onClick={handleSelectOdd}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-emerald-600 hover:border-emerald-300 font-medium transition-colors cursor-pointer"
          >
            เฉพาะหน้าคี่ (1, 3, 5...)
          </button>
          <button
            type="button"
            onClick={handleSelectEven}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-emerald-600 hover:border-emerald-300 font-medium transition-colors cursor-pointer"
          >
            เฉพาะหน้าคู่ (2, 4, 6...)
          </button>
        </div>
      </div>

      {/* Extracted Text Display Area */}
      {extractedText && (
        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              ข้อความที่สกัดได้:
            </span>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={handleCopy}
                className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? t('common.copied') : t('common.copy')}</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadTxt}
                className="px-2.5 py-1 text-xs rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>.TXT</span>
              </button>
            </div>
          </div>

          <textarea
            readOnly
            rows={8}
            value={extractedText}
            className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono focus:outline-none"
          />
        </div>
      )}
    </div>
  );
};
