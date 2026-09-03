import React from 'react';
import { Stamp, Hash, Sparkles, LayoutTemplate, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { WorkspaceFile } from '../workspace/UnifiedWorkspace';

// ----------------------------------------------------
// WATERMARK SIDEBAR
// ----------------------------------------------------
export const WatermarkSidebar: React.FC<{
  files: WorkspaceFile[];
  config: any;
  setConfig: React.Dispatch<React.SetStateAction<any>>;
}> = ({ config, setConfig }) => {
  const { t } = useTranslation();
  const wm = config.watermark || {
    type: 'text',
    text: 'สำเนาถูกต้อง',
    fontSize: 42,
    color: '#b91c1c',
    opacity: 0.35,
    rotation: 45,
    position: 'center',
  };

  const updateWm = (updates: any) => {
    setConfig({
      ...config,
      watermark: { ...wm, ...updates },
    });
  };

  const gridPositions = [
    { id: 'top-left', label: 'บน-ซ้าย' },
    { id: 'top-center', label: 'บน-กลาง' },
    { id: 'top-right', label: 'บน-ขวา' },
    { id: 'middle-left', label: 'กลาง-ซ้าย' },
    { id: 'center', label: 'ตรงกลาง' },
    { id: 'middle-right', label: 'กลาง-ขวา' },
    { id: 'bottom-left', label: 'ล่าง-ซ้าย' },
    { id: 'bottom-center', label: 'ล่าง-กลาง' },
    { id: 'bottom-right', label: 'ล่าง-ขวา' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold pb-2 border-b border-slate-200 dark:border-slate-700">
        <Stamp className="w-5 h-5 text-blue-500" />
        <span>{t('tools.watermark.title')}</span>
      </div>

      {/* Watermark Text */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
          ข้อความลายน้ำที่ต้องการประทับ:
        </label>
        <input
          type="text"
          value={wm.text}
          onChange={(e) => updateWm({ text: e.target.value })}
          placeholder="เช่น สำเนาถูกต้อง, CONFIDENTIAL, ร่าง"
          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
        />

        {/* Quick Text Preset Chips */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {['สำเนาถูกต้อง', 'CONFIDENTIAL', 'เอกสารลับ', 'DRAFT', 'ห้ามเผยแพร่'].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => updateWm({ text: preset })}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
                wm.text === preset
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Sliders: Size & Opacity */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex justify-between">
            <span>ขนาดตัวอักษร</span>
            <span className="font-mono text-blue-600">{wm.fontSize}px</span>
          </label>
          <input
            type="range"
            min={14}
            max={80}
            value={wm.fontSize}
            onChange={(e) => updateWm({ fontSize: parseInt(e.target.value) })}
            className="w-full accent-blue-500 cursor-pointer"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex justify-between">
            <span>ความโปร่งแสง</span>
            <span className="font-mono text-blue-600">{Math.round(wm.opacity * 100)}%</span>
          </label>
          <input
            type="range"
            min={5}
            max={90}
            value={Math.round(wm.opacity * 100)}
            onChange={(e) => updateWm({ opacity: parseInt(e.target.value) / 100 })}
            className="w-full accent-blue-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Sliders: Rotation & Color */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex justify-between">
            <span>มุมเอียงลายน้ำ</span>
            <span className="font-mono text-blue-600">{wm.rotation}°</span>
          </label>
          <input
            type="range"
            min={-90}
            max={90}
            value={wm.rotation}
            onChange={(e) => updateWm({ rotation: parseInt(e.target.value) })}
            className="w-full accent-blue-500 cursor-pointer"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
            สีลายน้ำ
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="color"
              value={wm.color}
              onChange={(e) => updateWm({ color: e.target.value })}
              className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer"
            />
            <span className="text-xs font-mono text-slate-600 dark:text-slate-300">{wm.color}</span>
          </div>
        </div>
      </div>

      {/* 9-Grid Position Selector */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
          ตำแหน่งลายน้ำบนหน้ากระดาษ:
        </label>
        <div className="grid grid-cols-3 gap-1.5 p-2 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          {gridPositions.map((pos) => (
            <button
              key={pos.id}
              type="button"
              onClick={() => updateWm({ position: pos.id })}
              className={`p-2 rounded-xl text-[11px] font-semibold transition-all cursor-pointer text-center ${
                wm.position === pos.id
                  ? 'bg-blue-600 text-white shadow-md font-bold'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-blue-600'
              }`}
            >
              {pos.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// PAGE NUMBERS SIDEBAR
// ----------------------------------------------------
export const PageNumbersSidebar: React.FC<{
  files: WorkspaceFile[];
  config: any;
  setConfig: React.Dispatch<React.SetStateAction<any>>;
}> = ({ files, config, setConfig }) => {
  const { t } = useTranslation();
  const totalPages = files[0]?.pageCount || 5;

  const pn = config.pageNumbers || {
    format: 'หน้า {n} จาก {total}',
    position: 'bottom-center',
    fontSize: 11,
    color: '#0f172a',
    margin: 30,
    startNumber: 1,
    skipFirstPage: false,
  };

  const updatePn = (updates: any) => {
    setConfig({
      ...config,
      pageNumbers: { ...pn, ...updates },
    });
  };

  // Preset Template Formats with User-Friendly Thai Descriptions
  const formatPresets = [
    {
      template: 'หน้า {n} จาก {total}',
      label: 'หน้า 1 จาก 10',
      desc: 'ภาษาไทยมาตรฐาน',
    },
    {
      template: '{n} / {total}',
      label: '1 / 10',
      desc: 'แบบย่อสากล',
    },
    {
      template: 'หน้า {n}',
      label: 'หน้า 1',
      desc: 'เฉพาะเลขหน้า',
    },
    {
      template: '{n}',
      label: '1',
      desc: 'ตัวเลขเดี่ยว',
    },
    {
      template: 'Page {n} of {total}',
      label: 'Page 1 of 10',
      desc: 'English Standard',
    },
  ];

  // Calculate live preview sample string
  const previewSampleText = (pn.format || 'หน้า {n} จาก {total}')
    .replace('{n}', '1')
    .replace('{total}', String(totalPages));

  const positionLabelMap: Record<string, string> = {
    'top-left': 'หัวกระดาษ (ซ้าย)',
    'top-center': 'หัวกระดาษ (กึ่งกลาง)',
    'top-right': 'หัวกระดาษ (ขวา)',
    'bottom-left': 'ท้ายกระดาษ (ซ้าย)',
    'bottom-center': 'ท้ายกระดาษ (กึ่งกลาง)',
    'bottom-right': 'ท้ายกระดาษ (ขวา)',
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold pb-2 border-b border-slate-200 dark:border-slate-700">
        <Hash className="w-5 h-5 text-blue-500" />
        <span>{t('tools.pageNumbers.title')}</span>
      </div>

      {/* Live Sample Preview Card */}
      <div className="p-3.5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 space-y-1.5">
        <div className="flex items-center justify-between text-xs font-bold text-blue-700 dark:text-blue-300">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ตัวอย่างข้อความเลขหน้าจริง:</span>
          </span>
          <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
            {positionLabelMap[pn.position] || 'ท้ายกระดาษ (กึ่งกลาง)'}
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-blue-100 dark:border-blue-950 font-mono text-center text-sm font-bold text-slate-800 dark:text-slate-200 shadow-xs">
          "{previewSampleText}"
        </div>
      </div>

      {/* 1. Format Template Selection */}
      <div className="space-y-2.5">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <LayoutTemplate className="w-3.5 h-3.5 text-blue-500" />
          <span>{t('tools.pageNumbers.formatTemplate')}</span>
        </label>

        {/* Preset Format Buttons */}
        <div className="grid grid-cols-2 gap-2">
          {formatPresets.map((f) => (
            <button
              key={f.template}
              type="button"
              onClick={() => updatePn({ format: f.template })}
              className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                pn.format === f.template
                  ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 ring-2 ring-blue-500/20 text-blue-700 dark:text-blue-300'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              <div className="font-bold text-xs font-mono">{f.label}</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{f.desc}</div>
            </button>
          ))}
        </div>

        {/* Custom Format Input */}
        <div className="space-y-1 pt-1">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            หรือกำหนดข้อความเอง (ใช้ <code className="text-blue-600">{'{n}'}</code> สำหรับเลขหน้า, <code className="text-blue-600">{'{total}'}</code> สำหรับหน้าทั้งหมด):
          </span>
          <input
            type="text"
            value={pn.format}
            onChange={(e) => updatePn({ format: e.target.value })}
            placeholder="เช่น หน้า {n} / {total}"
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 2. Position Selection (Visual Header / Footer) */}
      <div className="space-y-2.5">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
          {t('tools.pageNumbers.position')}:
        </label>

        <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5">
          {/* Header Row */}
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
              หัวกระดาษ (Header):
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'top-left', label: 'ซ้าย', icon: AlignLeft },
                { id: 'top-center', label: 'กึ่งกลาง', icon: AlignCenter },
                { id: 'top-right', label: 'ขวา', icon: AlignRight },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => updatePn({ position: item.id })}
                    className={`py-2 px-1.5 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      pn.position === item.id
                        ? 'border-blue-500 bg-blue-600 text-white shadow-xs font-bold'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Row */}
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
              ท้ายกระดาษ (Footer):
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'bottom-left', label: 'ซ้าย', icon: AlignLeft },
                { id: 'bottom-center', label: 'กึ่งกลาง', icon: AlignCenter },
                { id: 'bottom-right', label: 'ขวา', icon: AlignRight },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => updatePn({ position: item.id })}
                    className={`py-2 px-1.5 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      pn.position === item.id
                        ? 'border-blue-500 bg-blue-600 text-white shadow-xs font-bold'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Typography: Font Size & Color */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex justify-between">
            <span>ขนาดตัวอักษร</span>
            <span className="font-mono text-blue-600">{pn.fontSize || 11}pt</span>
          </label>
          <input
            type="range"
            min={8}
            max={22}
            value={pn.fontSize || 11}
            onChange={(e) => updatePn({ fontSize: parseInt(e.target.value) })}
            className="w-full accent-blue-500 cursor-pointer"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex justify-between">
            <span>ระยะห่างจากขอบ</span>
            <span className="font-mono text-blue-600">{pn.margin || 30}pt</span>
          </label>
          <input
            type="range"
            min={10}
            max={60}
            value={pn.margin || 30}
            onChange={(e) => updatePn({ margin: parseInt(e.target.value) })}
            className="w-full accent-blue-500 cursor-pointer"
          />
        </div>
      </div>

      {/* 4. Options: Skip First Page */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
        <label className="flex items-center space-x-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50">
          <input
            type="checkbox"
            checked={pn.skipFirstPage}
            onChange={(e) => updatePn({ skipFirstPage: e.target.checked })}
            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
          <span className="font-semibold">{t('tools.pageNumbers.skipFirstPage')}</span>
        </label>
      </div>
    </div>
  );
};
