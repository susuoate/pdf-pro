import React, { useRef } from 'react';
import {
  Scissors,
  RotateCw,
  Copy,
  Image,
  FileImage,
  Minimize2,
  Lock,
  Unlock,
  Info,
  Layers,
  Plus,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { useTranslation } from '../../context/LanguageContext';
import { WorkspaceFile } from '../workspace/UnifiedWorkspace';
import { Button } from '../common/Button';
import { parsePageRange } from '../../utils/formatters';
import { pdfService } from '../../services/pdfService';

// ----------------------------------------------------
// 1. MERGE SIDEBAR
// ----------------------------------------------------
export const MergeSidebar: React.FC<{
  files: WorkspaceFile[];
  config: any;
  setConfig: React.Dispatch<React.SetStateAction<any>>;
  onAddMoreFiles?: (files: WorkspaceFile[]) => void;
}> = ({ files, onAddMoreFiles }) => {
  const { t } = useTranslation();
  const sidebarFileInputRef = useRef<HTMLInputElement>(null);

  const handleSidebarAddFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

  return (
    <div className="space-y-4">
      <input
        type="file"
        ref={sidebarFileInputRef}
        onChange={handleSidebarAddFiles}
        multiple
        accept=".pdf"
        className="hidden"
      />

      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold">
          <Layers className="w-5 h-5 text-rose-500" />
          <span>{t('tools.merge.title')}</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500 dark:text-slate-400">
          {files.length} {t('common.files')} {t('common.selected')}
        </span>
        {onAddMoreFiles && (
          <button
            onClick={() => sidebarFileInputRef.current?.click()}
            className="flex items-center space-x-1 text-rose-600 dark:text-rose-400 font-bold hover:underline cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('common.addMoreFiles')}</span>
          </button>
        )}
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
        {files.map((file, idx) => (
          <div
            key={file.id}
            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs"
          >
            <div className="flex items-center space-x-2 truncate">
              <span className="w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 font-bold flex items-center justify-center text-[10px] shrink-0">
                {idx + 1}
              </span>
              <span className="font-medium text-slate-700 dark:text-slate-200 truncate">
                {file.name}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 shrink-0">
              {file.pageCount || 1} {t('common.pages')}
            </span>
          </div>
        ))}
      </div>

      {onAddMoreFiles && (
        <Button
          variant="secondary"
          size="sm"
          className="w-full"
          onClick={() => sidebarFileInputRef.current?.click()}
          iconLeft={<Plus className="w-4 h-4" />}
        >
          {t('common.addMoreFiles')}
        </Button>
      )}

      <p className="text-xs text-slate-500 dark:text-slate-400 bg-rose-50/50 dark:bg-rose-950/20 p-3 rounded-xl border border-rose-100 dark:border-rose-900/30">
        💡 {t('messages.dragDropReorderTip')}
      </p>
    </div>
  );
};

// ----------------------------------------------------
// 2. SPLIT SIDEBAR
// ----------------------------------------------------
export const SplitSidebar: React.FC<{
  files: WorkspaceFile[];
  config: any;
  setConfig: React.Dispatch<React.SetStateAction<any>>;
}> = ({ files, config, setConfig }) => {
  const { t } = useTranslation();
  const totalPages = files[0]?.pageCount || 1;
  const mode = config.splitMode || 'ranges';

  // Initialize defaults on load or when totalPages changes
  React.useEffect(() => {
    if (!config.splitMode) {
      setConfig((prev: any) => ({ ...prev, splitMode: 'ranges' }));
    }
    if (config.ranges === undefined) {
      if (totalPages === 1) {
        setConfig((prev: any) => ({ ...prev, ranges: '1' }));
      } else if (totalPages === 2) {
        setConfig((prev: any) => ({ ...prev, ranges: '1, 2' }));
      } else {
        const mid = Math.ceil(totalPages / 2);
        setConfig((prev: any) => ({ ...prev, ranges: `1-${mid}, ${mid + 1}-${totalPages}` }));
      }
    }
  }, [totalPages]);

  const currentRangesStr =
    config.ranges !== undefined
      ? config.ranges
      : totalPages === 2
      ? '1, 2'
      : `1-${totalPages}`;

  // Parse range groups to show live breakdown preview
  const rawParts = currentRangesStr.split(',').map((s: string) => s.trim()).filter(Boolean);

  const handlePresetAllPages = () => {
    const all = Array.from({ length: totalPages }, (_, i) => i + 1).join(', ');
    setConfig({ ...config, ranges: all });
  };

  const handlePresetHalf = () => {
    if (totalPages <= 1) {
      setConfig({ ...config, ranges: '1' });
    } else {
      const mid = Math.ceil(totalPages / 2);
      setConfig({ ...config, ranges: `1-${mid}, ${mid + 1}-${totalPages}` });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold pb-2 border-b border-slate-200 dark:border-slate-700">
        <Scissors className="w-5 h-5 text-rose-500" />
        <span>{t('tools.split.title')}</span>
      </div>

      {/* Split Mode Selector */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
          {t('common.mode')}
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'ranges', label: t('config.splitModeRange') },
            { id: 'extract-all', label: t('config.splitModeExtractAll') },
            { id: 'interval', label: t('config.splitModeInterval') },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setConfig({ ...config, splitMode: item.id })}
              className={`p-2 rounded-xl text-xs font-semibold border text-center transition-all cursor-pointer ${
                mode === item.id
                  ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mode 1: Custom Ranges */}
      {mode === 'ranges' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {t('config.pageRangesLabel')}
            </label>
            <input
              type="text"
              placeholder={`เช่น 1, 2 หรือ 1-2, 3-${totalPages}`}
              value={currentRangesStr}
              onChange={(e) => setConfig({ ...config, ranges: e.target.value })}
              className="w-full px-3 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <p className="text-[11px] text-slate-400">
              {t('messages.rangeFormatExample')}
            </p>
          </div>

          {/* Preset Quick Chips */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-400">ตัวเลือกด่วน:</span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={handlePresetAllPages}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
              >
                📄 แยกทีละหน้า ({Array.from({ length: Math.min(3, totalPages) }, (_, i) => i + 1).join(', ')}{totalPages > 3 ? '...' : ''})
              </button>
              {totalPages > 2 && (
                <button
                  type="button"
                  onClick={handlePresetHalf}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                >
                  📑 แบ่ง 2 ส่วนเท่ากัน
                </button>
              )}
            </div>
          </div>

          {/* Live Preview Breakdown */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
            <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>ผลลัพธ์ที่จะได้:</span>
              <span className="text-rose-600 dark:text-rose-400 font-extrabold">
                {rawParts.length} ไฟล์
              </span>
            </div>
            <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
              {rawParts.map((part: string, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between px-2 py-1 rounded bg-white dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700"
                >
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    ไฟล์ที่ {idx + 1}:
                  </span>
                  <span className="text-rose-600 dark:text-rose-400 font-mono">
                    หน้า {part}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Merge Ranges Option */}
          <label className="flex items-center space-x-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 cursor-pointer text-xs">
            <input
              type="checkbox"
              checked={!!config.mergeRanges}
              onChange={(e) => setConfig({ ...config, mergeRanges: e.target.checked })}
              className="rounded text-rose-500 focus:ring-rose-500"
            />
            <span className="text-slate-700 dark:text-slate-300 font-medium">
              รวมช่วงที่เลือกเข้าเป็นไฟล์ PDF เดียวกัน
            </span>
          </label>
        </div>
      )}

      {/* Mode 2: Extract All */}
      {mode === 'extract-all' && (
        <div className="p-4 rounded-xl bg-rose-50/50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 text-xs space-y-2 text-slate-700 dark:text-slate-300">
          <p className="font-bold text-rose-600 dark:text-rose-400">
            📦 แยกทุกหน้าเป็นไฟล์เดี่ยว ({totalPages} ไฟล์)
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            ระบบจะดึงหน้า 1 ถึง {totalPages} แยกเป็นไฟล์ PDF เดี่ยวไฟล์ละ 1 หน้า และรวมดาวน์โหลดให้เป็นไฟล์ ZIP ไฟล์เดียว
          </p>
        </div>
      )}

      {/* Mode 3: Split by Interval */}
      {mode === 'interval' && (
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {t('config.intervalLabel')}
          </label>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500">แยกทุกๆ</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={config.interval || 1}
              onChange={(e) =>
                setConfig({ ...config, interval: Math.max(1, parseInt(e.target.value) || 1) })
              }
              className="w-20 px-3 py-2 text-xs font-bold text-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <span className="text-xs text-slate-500">หน้าต่อหนึ่งไฟล์</span>
          </div>
          <p className="text-[11px] text-slate-400">
            จะถูกแยกออกเป็น {Math.ceil(totalPages / (config.interval || 1))} ไฟล์ PDF
          </p>
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------
// 3. ROTATE SIDEBAR
// ----------------------------------------------------
export const RotateSidebar: React.FC<{
  files: WorkspaceFile[];
  config: any;
  setConfig: React.Dispatch<React.SetStateAction<any>>;
}> = ({ config, setConfig }) => {
  const { t } = useTranslation();
  const angle = config.globalAngle || 0;

  const rotateBy = (deg: number) => {
    setConfig({ ...config, globalAngle: (angle + deg + 360) % 360 });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold pb-2 border-b border-slate-200 dark:border-slate-700">
        <RotateCw className="w-5 h-5 text-rose-500" />
        <span>{t('tools.rotate.title')}</span>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
          {t('tools.rotate.rotateAll')}
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => rotateBy(90)}
            className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-rose-500 hover:text-rose-500 flex flex-col items-center gap-1 cursor-pointer"
          >
            <RotateCw className="w-4 h-4" />
            +90° {t('common.right')}
          </button>
          <button
            type="button"
            onClick={() => rotateBy(180)}
            className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-rose-500 hover:text-rose-500 flex flex-col items-center gap-1 cursor-pointer"
          >
            <RotateCw className="w-4 h-4" />
            180°
          </button>
          <button
            type="button"
            onClick={() => rotateBy(-90)}
            className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-rose-500 hover:text-rose-500 flex flex-col items-center gap-1 cursor-pointer"
          >
            <RotateCw className="w-4 h-4 -scale-x-100" />
            -90° {t('common.left')}
          </button>
        </div>
      </div>

      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-center">
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {t('tools.rotate.currentRotation')}:{' '}
        </span>
        <span className="text-sm font-black text-rose-500">{angle}°</span>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 4. EXTRACT SIDEBAR
// ----------------------------------------------------
// ----------------------------------------------------
// 4. EXTRACT SIDEBAR
// ----------------------------------------------------
export const ExtractSidebar: React.FC<{
  files: WorkspaceFile[];
  config: any;
  setConfig: React.Dispatch<React.SetStateAction<any>>;
}> = ({ files, config, setConfig }) => {
  const { t } = useTranslation();
  const totalPages = files[0]?.pageCount || 1;
  const pageItems = config.pageItems || [];

  // Selected pages from thumbnail grid checkboxes (1-indexed)
  const selectedPages: number[] = pageItems
    .filter((it: any) => it.isSelected)
    .map((it: any) => it.pageIndex + 1);

  const handleToggleSelectAll = (select: boolean) => {
    const updated = pageItems.map((it: any) => ({ ...it, isSelected: select }));
    setConfig({
      ...config,
      pageItems: updated,
      pageRanges: select ? `1-${totalPages}` : '',
    });
  };

  const handleSelectOdd = () => {
    const updated = pageItems.map((it: any) => ({
      ...it,
      isSelected: (it.pageIndex + 1) % 2 !== 0,
    }));
    const oddNumbers = updated.filter((it: any) => it.isSelected).map((it: any) => it.pageIndex + 1);
    setConfig({
      ...config,
      pageItems: updated,
      pageRanges: oddNumbers.join(', '),
    });
  };

  const handleSelectEven = () => {
    const updated = pageItems.map((it: any) => ({
      ...it,
      isSelected: (it.pageIndex + 1) % 2 === 0,
    }));
    const evenNumbers = updated.filter((it: any) => it.isSelected).map((it: any) => it.pageIndex + 1);
    setConfig({
      ...config,
      pageItems: updated,
      pageRanges: evenNumbers.join(', '),
    });
  };

  // Sync text input with checkboxes
  const handleRangeTextChange = (text: string) => {
    const parsed0 = parsePageRange(text, totalPages);
    const selectedSet = new Set(parsed0);
    const updated = pageItems.map((it: any) => ({
      ...it,
      isSelected: selectedSet.has(it.pageIndex),
    }));
    setConfig({
      ...config,
      pageRanges: text,
      pageItems: updated,
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold pb-2 border-b border-slate-200 dark:border-slate-700">
        <Copy className="w-5 h-5 text-rose-500" />
        <span>{t('tools.extract.title')}</span>
      </div>

      {/* Selected Counter Banner */}
      <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs">
        <div className="flex items-center justify-between font-bold text-rose-600 dark:text-rose-400">
          <span>หน้าที่เลือกดึงออกมา:</span>
          <span>{selectedPages.length} จาก {totalPages} หน้า</span>
        </div>
        {selectedPages.length > 0 ? (
          <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-300 font-mono">
            หน้า: {selectedPages.join(', ')}
          </p>
        ) : (
          <p className="mt-1 text-[11px] text-slate-400">
            ติ๊กถูกที่ภาพพรีวิวหน้าเอกสารเพื่อเลือกหน้าที่ต้องการ
          </p>
        )}
      </div>

      {/* Quick Selection Buttons */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
          เครื่องมือเลือกด่วน:
        </label>
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => handleToggleSelectAll(true)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-rose-600 hover:border-rose-300 font-medium transition-colors cursor-pointer"
          >
            เลือกทั้งหมด
          </button>
          <button
            type="button"
            onClick={() => handleToggleSelectAll(false)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-rose-600 hover:border-rose-300 font-medium transition-colors cursor-pointer"
          >
            ยกเลิกทั้งหมด
          </button>
          <button
            type="button"
            onClick={handleSelectOdd}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-rose-600 hover:border-rose-300 font-medium transition-colors cursor-pointer"
          >
            เฉพาะหน้าคี่ (1, 3, 5...)
          </button>
          <button
            type="button"
            onClick={handleSelectEven}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-rose-600 hover:border-rose-300 font-medium transition-colors cursor-pointer"
          >
            เฉพาะหน้าคู่ (2, 4, 6...)
          </button>
        </div>
      </div>

      {/* Manual Input Range Box */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
          หรือพิมพ์ระบุหน้าที่ต้องการดึง:
        </label>
        <input
          type="text"
          placeholder="เช่น 1, 3, 5-7"
          value={
            config.pageRanges !== undefined
              ? config.pageRanges
              : selectedPages.length > 0
              ? selectedPages.join(', ')
              : '1'
          }
          onChange={(e) => handleRangeTextChange(e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
        />
      </div>

      {/* Export Mode */}
      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
          รูปแบบการดาวน์โหลดไฟล์:
        </label>
        <div className="space-y-2">
          <label className="flex items-start space-x-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 cursor-pointer text-xs">
            <input
              type="radio"
              name="extractMode"
              checked={config.mergeIntoSingle !== false}
              onChange={() => setConfig({ ...config, mergeIntoSingle: true })}
              className="mt-0.5 text-rose-500 focus:ring-rose-500"
            />
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                รวมหน้าที่เลือกเป็นไฟล์ PDF เดียว
              </span>
              <p className="text-[11px] text-slate-400">
                {t('config.extractModeSingle')}
              </p>
            </div>
          </label>

          <label className="flex items-start space-x-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 cursor-pointer text-xs">
            <input
              type="radio"
              name="extractMode"
              checked={config.mergeIntoSingle === false}
              onChange={() => setConfig({ ...config, mergeIntoSingle: false })}
              className="mt-0.5 text-rose-500 focus:ring-rose-500"
            />
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                แยกแต่ละหน้าเป็นไฟล์เดี่ยว (ZIP)
              </span>
              <p className="text-[11px] text-slate-400">
                {t('config.extractModeSeparate')}
              </p>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 5. IMAGES TO PDF SIDEBAR
// ----------------------------------------------------
export const Img2PdfSidebar: React.FC<{
  files: WorkspaceFile[];
  config: any;
  setConfig: React.Dispatch<React.SetStateAction<any>>;
}> = ({ config, setConfig }) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-5">
      <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold pb-2 border-b border-slate-200 dark:border-slate-700">
        <Image className="w-5 h-5 text-emerald-500" />
        <span>{t('tools.img2pdf.title')}</span>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
          {t('tools.img2pdf.pageSize')}
        </label>
        <select
          value={config.pageSize || 'A4'}
          onChange={(e) => setConfig({ ...config, pageSize: e.target.value })}
          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="A4">A4 (210 x 297 mm)</option>
          <option value="Letter">US Letter (8.5 x 11 in)</option>
          <option value="Fit">{t('tools.img2pdf.fitImage')}</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
          {t('tools.img2pdf.orientation')}
        </label>
        <div className="grid grid-cols-3 gap-2">
          {['auto', 'portrait', 'landscape'].map((ori) => (
            <button
              key={ori}
              type="button"
              onClick={() => setConfig({ ...config, orientation: ori })}
              className={`p-2 rounded-xl text-xs font-semibold border text-center capitalize cursor-pointer ${
                (config.orientation || 'auto') === ori
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {t(`common.${ori}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
          {t('tools.img2pdf.margin')}
        </label>
        <div className="grid grid-cols-3 gap-2">
          {['none', 'small', 'big'].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setConfig({ ...config, margin: m })}
              className={`p-2 rounded-xl text-xs font-semibold border text-center capitalize cursor-pointer ${
                (config.margin || 'none') === m
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {t(`common.margin_${m}`)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 6. PDF TO IMAGES SIDEBAR
// ----------------------------------------------------
export const Pdf2ImgSidebar: React.FC<{
  files: WorkspaceFile[];
  config: any;
  setConfig: React.Dispatch<React.SetStateAction<any>>;
}> = ({ config, setConfig }) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-5">
      <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold pb-2 border-b border-slate-200 dark:border-slate-700">
        <FileImage className="w-5 h-5 text-emerald-500" />
        <span>{t('tools.pdf2img.title')}</span>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
          {t('tools.pdf2img.format')}
        </label>
        <div className="grid grid-cols-2 gap-2">
          {['jpeg', 'png'].map((fmt) => (
            <button
              key={fmt}
              type="button"
              onClick={() => setConfig({ ...config, format: fmt })}
              className={`p-2 rounded-xl text-xs font-bold uppercase border text-center cursor-pointer ${
                (config.format || 'jpeg') === fmt
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {fmt}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
          {t('tools.pdf2img.dpi')}
        </label>
        <select
          value={config.dpi || 150}
          onChange={(e) => setConfig({ ...config, dpi: parseInt(e.target.value) })}
          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value={96}>96 DPI (Web - Fast)</option>
          <option value={150}>150 DPI (Standard Quality)</option>
          <option value={300}>300 DPI (High Quality Print)</option>
        </select>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 7. COMPRESS SIDEBAR
// ----------------------------------------------------
export const CompressSidebar: React.FC<{
  files: WorkspaceFile[];
  config: any;
  setConfig: React.Dispatch<React.SetStateAction<any>>;
}> = ({ config, setConfig }) => {
  const { t } = useTranslation();
  const level = config.level || 'recommended';

  return (
    <div className="space-y-5">
      <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold pb-2 border-b border-slate-200 dark:border-slate-700">
        <Minimize2 className="w-5 h-5 text-emerald-500" />
        <span>{t('tools.compress.title')}</span>
      </div>

      <div className="space-y-3">
        {[
          {
            id: 'extreme',
            title: t('tools.compress.extremeTitle'),
            desc: t('tools.compress.extremeDesc'),
            badge: '~70% reduction',
          },
          {
            id: 'recommended',
            title: t('tools.compress.recommendedTitle'),
            desc: t('tools.compress.recommendedDesc'),
            badge: '~40% reduction',
          },
          {
            id: 'low',
            title: t('tools.compress.lowTitle'),
            desc: t('tools.compress.lowDesc'),
            badge: '~20% reduction',
          },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setConfig({ ...config, level: item.id })}
            className={`w-full p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
              level === item.id
                ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {item.title}
              </span>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                {item.badge}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              {item.desc}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 8. PROTECT SIDEBAR
// ----------------------------------------------------
export const ProtectSidebar: React.FC<{
  files: WorkspaceFile[];
  config: any;
  setConfig: React.Dispatch<React.SetStateAction<any>>;
}> = ({ config, setConfig }) => {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = React.useState(false);
  const password = config.password || '';
  const confirmPassword = config.confirmPassword || '';

  const isMatched = password.length > 0 && password === confirmPassword;
  const isMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  return (
    <div className="space-y-5">
      <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold pb-2 border-b border-slate-200 dark:border-slate-700">
        <Lock className="w-5 h-5 text-purple-500" />
        <span>{t('tools.protect.title')}</span>
      </div>

      {/* Security Level Banner */}
      <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/50 text-xs space-y-1">
        <div className="flex items-center space-x-1.5 font-bold text-purple-700 dark:text-purple-300">
          <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span>การเข้ารหัสมาตรฐานสากล AES-256</span>
        </div>
        <p className="text-[11px] text-slate-600 dark:text-slate-400">
          ไฟล์ PDF จะถูกล็อกรหัสผ่านอย่างปลอดภัย ต้องกรอกรหัสผ่านที่ถูกต้องจึงจะสามารถเปิดอ่านได้
        </p>
      </div>

      {/* Password Input */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
          {t('tools.protect.password')}
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="ตั้งรหัสผ่านสำหรับเปิดไฟล์..."
            value={password}
            onChange={(e) => setConfig({ ...config, password: e.target.value })}
            className="w-full pl-3 pr-10 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Confirm Password Input */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
          {t('tools.protect.confirmPassword')}
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="พิมพ์รหัสผ่านเดิมอีกครั้ง..."
            value={confirmPassword}
            onChange={(e) => setConfig({ ...config, confirmPassword: e.target.value })}
            className={`w-full pl-3 pr-10 py-2.5 text-xs rounded-xl border bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 font-medium ${
              isMatched
                ? 'border-emerald-500 ring-1 ring-emerald-500/30'
                : isMismatch
                ? 'border-rose-500 ring-1 ring-rose-500/30'
                : 'border-slate-200 dark:border-slate-700 focus:ring-purple-500'
            }`}
          />
        </div>

        {/* Validation Status Indicator */}
        {isMatched && (
          <div className="flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>รหัสผ่านตรงกันเรียบร้อย</span>
          </div>
        )}
        {isMismatch && (
          <div className="flex items-center space-x-1 text-rose-600 dark:text-rose-400 text-xs font-medium">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>รหัสผ่านทั้งสองช่องยังไม่ตรงกัน</span>
          </div>
        )}
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 9. UNLOCK SIDEBAR
// ----------------------------------------------------
export const UnlockSidebar: React.FC<{
  files: WorkspaceFile[];
  config: any;
  setConfig: React.Dispatch<React.SetStateAction<any>>;
}> = ({ config, setConfig }) => {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <div className="space-y-5">
      <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold pb-2 border-b border-slate-200 dark:border-slate-700">
        <Unlock className="w-5 h-5 text-purple-500" />
        <span>{t('tools.unlock.title')}</span>
      </div>

      <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/50 text-xs space-y-1">
        <span className="font-bold text-purple-700 dark:text-purple-300">
          🔓 ปลดล็อกรหัสผ่านถาวร
        </span>
        <p className="text-[11px] text-slate-600 dark:text-slate-400">
          กรอกรหัสผ่านของไฟล์ PDF เพื่อถอดการเข้ารหัสและสร้างไฟล์ใหม่ที่เปิดได้โดยไม่ต้องใช้รหัสผ่านอีกต่อไป
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
          กรอกรหัสผ่านปัจจุบันของไฟล์ PDF:
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="กรอกรหัสผ่านไฟล์..."
            value={config.password || ''}
            onChange={(e) => setConfig({ ...config, password: e.target.value })}
            className="w-full pl-3 pr-10 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 10. METADATA SIDEBAR
// ----------------------------------------------------
export const MetadataSidebar: React.FC<{
  files: WorkspaceFile[];
  config: any;
  setConfig: React.Dispatch<React.SetStateAction<any>>;
}> = ({ files, config, setConfig }) => {
  const { t } = useTranslation();
  const meta = config.metadata || {};

  // Auto-populate existing PDF metadata upon opening
  React.useEffect(() => {
    if (files[0]?.arrayBuffer && !config.metadataLoaded) {
      pdfService
        .getMetadata(files[0].arrayBuffer)
        .then((existingMeta) => {
          setConfig((prev: any) => ({
            ...prev,
            metadataLoaded: true,
            metadata: {
              title: existingMeta.title || '',
              author: existingMeta.author || '',
              subject: existingMeta.subject || '',
              keywords: Array.isArray(existingMeta.keywords)
                ? existingMeta.keywords.join(', ')
                : existingMeta.keywords || '',
              creator: existingMeta.creator || '',
              producer: existingMeta.producer || '',
              ...prev.metadata,
            },
          }));
        })
        .catch(() => {
          // Ignore read error
        });
    }
  }, [files, config.metadataLoaded, setConfig]);

  const handleFieldChange = (key: string, val: string) => {
    setConfig({
      ...config,
      metadata: {
        ...meta,
        [key]: val,
      },
    });
  };

  const fields = [
    {
      key: 'title',
      label: 'ชื่อเรื่องเอกสาร (Title)',
      placeholder: 'เช่น รายงานผลการดำเนินงาน 2026',
    },
    {
      key: 'author',
      label: 'ชื่อผู้เขียน / ผู้จัดทำ (Author)',
      placeholder: 'เช่น ชื่อ-นามสกุล หรือชื่อหน่วยงาน/องค์กร',
    },
    {
      key: 'subject',
      label: 'หัวข้อเรื่อง / รายละเอียดย่อ (Subject)',
      placeholder: 'เช่น สรุปรายงานประจำปีและการเงิน',
    },
    {
      key: 'keywords',
      label: 'คำสำคัญ / คีย์เวิร์ด (Keywords)',
      placeholder: 'เช่น รายงาน, การเงิน, บัญชี (คั่นด้วยจุลภาค)',
    },
    {
      key: 'creator',
      label: 'โปรแกรมต้นฉบับที่สร้าง (Creator)',
      placeholder: 'เช่น Microsoft Word, Google Docs',
    },
    {
      key: 'producer',
      label: 'ตัวแปลงเอกสาร PDF (Producer)',
      placeholder: 'เช่น PDF PRO BY Oatdh',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold pb-2 border-b border-slate-200 dark:border-slate-700">
        <Info className="w-5 h-5 text-purple-500" />
        <span>{t('tools.metadata.title')}</span>
      </div>

      <div className="space-y-3">
        {fields.map((f) => (
          <div key={f.key} className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              {f.label}
            </label>
            <input
              type="text"
              value={meta[f.key] || ''}
              onChange={(e) => handleFieldChange(f.key, e.target.value)}
              placeholder={f.placeholder}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
            />
          </div>
        ))}
      </div>

      {/* Sanitize Toggle Card */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setConfig({ ...config, sanitize: !config.sanitize })}
          className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer ${
            config.sanitize
              ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/60 ring-2 ring-purple-500/20 text-purple-700 dark:text-purple-300'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
          }`}
        >
          <div className="flex items-center justify-between font-bold text-xs">
            <span>🧹 ล้างข้อมูลประวัติและข้อมูลส่วนตัวทั้งหมด</span>
            <span
              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                config.sanitize
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
              }`}
            >
              {config.sanitize ? 'เปิดใช้งาน' : 'ปิด'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            ล้างข้อมูลชื่อผู้เขียน ซอฟต์แวร์ และประวัติการแก้ไขทั้งหมดออกจากไฟล์เพื่อความเป็นส่วนตัวสูงสุด
          </p>
        </button>
      </div>
    </div>
  );
};
