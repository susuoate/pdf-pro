import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowRight, FileText, Layers, ArrowRightLeft, Edit3, Lock } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { Modal } from '../common/Modal';

export interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTool: (toolId: string) => void;
}

interface SearchItem {
  id: string;
  category: 'organize' | 'convert' | 'edit' | 'security';
  title: string;
  desc: string;
  keywords: string[];
}

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectTool,
}) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const toolsRegistry: SearchItem[] = [
    // Organize
    { id: 'merge', category: 'organize', title: t('tools.merge.title'), desc: t('tools.merge.desc'), keywords: ['merge', 'combine', 'join', 'concat', 'รวมไฟล์'] },
    { id: 'split', category: 'organize', title: t('tools.split.title'), desc: t('tools.split.desc'), keywords: ['split', 'separate', 'ranges', 'divide', 'แยกไฟล์', 'ตัดหน้า'] },
    { id: 'organize', category: 'organize', title: t('tools.organize.title'), desc: t('tools.organize.desc'), keywords: ['organize', 'reorder', 'sort', 'delete', 'จัดเรียง', 'สลับหน้า'] },
    { id: 'rotate', category: 'organize', title: t('tools.rotate.title'), desc: t('tools.rotate.desc'), keywords: ['rotate', 'turn', 'orientation', 'หมุนหน้า', 'กลับหัว'] },
    { id: 'extract', category: 'organize', title: t('tools.extract.title'), desc: t('tools.extract.desc'), keywords: ['extract', 'pull', 'select pages', 'ดึงหน้า', 'คัดลอกหน้า'] },
    // Convert
    { id: 'img2pdf', category: 'convert', title: t('tools.img2pdf.title'), desc: t('tools.img2pdf.desc'), keywords: ['jpg', 'png', 'webp', 'image to pdf', 'รูปเป็น pdf', 'แปลงรูป'] },
    { id: 'pdf2img', category: 'convert', title: t('tools.pdf2img.title'), desc: t('tools.pdf2img.desc'), keywords: ['pdf to jpg', 'pdf to png', 'extract images', 'แปลงเป็นรูป'] },
    { id: 'compress', category: 'convert', title: t('tools.compress.title'), desc: t('tools.compress.desc'), keywords: ['compress', 'shrink', 'reduce size', 'optimize', 'บีบอัด', 'ย่อไฟล์'] },
    { id: 'ocr', category: 'convert', title: t('tools.ocr.title'), desc: t('tools.ocr.desc'), keywords: ['ocr', 'text', 'scan', 'tesseract', 'thai ocr', 'สแกนข้อความ'] },
    // Edit
    { id: 'editor', category: 'edit', title: t('tools.editor.title'), desc: t('tools.editor.desc'), keywords: ['editor', 'annotate', 'pen', 'draw', 'highlight', 'shapes', 'แก้ไข', 'วาด'] },
    { id: 'watermark', category: 'edit', title: t('tools.watermark.title'), desc: t('tools.watermark.desc'), keywords: ['watermark', 'stamp', 'logo', 'copyright', 'ลายน้ำ', 'ตราประทับ'] },
    { id: 'pageNumbers', category: 'edit', title: t('tools.pageNumbers.title'), desc: t('tools.pageNumbers.desc'), keywords: ['page numbers', 'header', 'footer', 'paginate', 'เลขหน้า'] },
    // Security
    { id: 'sign', category: 'security', title: t('tools.sign.title'), desc: t('tools.sign.desc'), keywords: ['sign', 'signature', 'e-sign', 'autograph', 'เซ็นชื่อ', 'ลายเซ็น'] },
    { id: 'protect', category: 'security', title: t('tools.protect.title'), desc: t('tools.protect.desc'), keywords: ['protect', 'password', 'encrypt', 'lock', 'ล็อกรหัสผ่าน', 'ใส่รหัส'] },
    { id: 'unlock', category: 'security', title: t('tools.unlock.title'), desc: t('tools.unlock.desc'), keywords: ['unlock', 'decrypt', 'remove password', 'ปลดล็อก'] },
    { id: 'redact', category: 'security', title: t('tools.redact.title'), desc: t('tools.redact.desc'), keywords: ['redact', 'blackout', 'censor', 'destroy', 'ถมดำ', 'เซนเซอร์'] },
    { id: 'metadata', category: 'security', title: t('tools.metadata.title'), desc: t('tools.metadata.desc'), keywords: ['metadata', 'author', 'title', 'sanitize', 'strip', 'ข้อมูลเอกสาร'] },
  ];

  const filtered = toolsRegistry.filter((item) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      item.title.toLowerCase().includes(q) ||
      item.desc.toLowerCase().includes(q) ||
      item.keywords.some((kw) => kw.toLowerCase().includes(q))
    );
  });

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        onSelectTool(filtered[selectedIndex].id);
        onClose();
      }
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'organize': return <Layers className="w-4 h-4 text-rose-500" />;
      case 'convert': return <ArrowRightLeft className="w-4 h-4 text-emerald-500" />;
      case 'edit': return <Edit3 className="w-4 h-4 text-blue-500" />;
      case 'security': return <Lock className="w-4 h-4 text-purple-500" />;
      default: return <FileText className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-4" onKeyDown={handleKeyDown}>
        {/* Search Header */}
        <div className="flex items-center space-x-3 pb-3 border-b border-slate-200 dark:border-slate-700">
          <Search className="w-5 h-5 text-rose-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder={t('common.searchPlaceholder')}
            className="w-full bg-transparent border-none text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none text-base"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Results List */}
        <div className="mt-3 max-h-96 overflow-y-auto space-y-1.5 pr-1">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-sm">
              {t('common.noResultsFound')}
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTool(item.id);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all ${
                    isSelected
                      ? 'bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 shadow-xs'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-700 shadow-xs">
                      {getCategoryIcon(item.category)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                        <span>{item.title}</span>
                        <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-semibold">
                          {t(`categories.${item.category}`)}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                        {item.desc}
                      </div>
                    </div>
                  </div>
                  <ArrowRight
                    className={`w-4 h-4 transition-transform ${
                      isSelected
                        ? 'text-rose-500 translate-x-0.5'
                        : 'text-slate-300 dark:text-slate-600'
                    }`}
                  />
                </button>
              );
            })
          )}
        </div>

        {/* Modal Keyboard Footer */}
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center space-x-3">
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono">↑↓</kbd>{' '}
              Navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono">↵</kbd>{' '}
              Select
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono">ESC</kbd>{' '}
              Close
            </span>
          </div>
          <span>{filtered.length} tools available</span>
        </div>
      </div>
    </Modal>
  );
};
