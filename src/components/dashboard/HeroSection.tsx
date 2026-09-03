import React from 'react';
import { Search, Sparkles } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';

export interface HeroSectionProps {
  onOpenSearch: () => void;
  onSelectTool: (toolId: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onOpenSearch, onSelectTool }) => {
  const { t } = useTranslation();

  const quickPills = [
    { id: 'merge', label: 'Merge PDF' },
    { id: 'compress', label: 'Compress PDF' },
    { id: 'sign', label: 'Sign PDF' },
    { id: 'ocr', label: 'OCR Text' },
    { id: 'img2pdf', label: 'Images to PDF' },
  ];

  return (
    <div className="text-center py-10 sm:py-14 relative">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-500/10 dark:bg-rose-500/15 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Main Headline */}
      <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-semibold mb-4">
        <Sparkles className="w-3.5 h-3.5" />
        <span>100% In-Browser PDF Suite • Zero Server Upload</span>
      </div>

      <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight max-w-3xl mx-auto">
        {t('common.tagline')}
      </h1>

      <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
        {t('privacy.bannerSubtitle')}
      </p>

      {/* Search Input Bar (Triggers QuickSearchModal) */}
      <div className="mt-8 max-w-xl mx-auto">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-lg shadow-slate-200/50 dark:shadow-none hover:border-rose-400 dark:hover:border-rose-500 text-slate-400 dark:text-slate-400 transition-all group cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <Search className="w-5 h-5 text-rose-500 group-hover:scale-110 transition-transform" />
            <span className="text-sm sm:text-base font-medium text-slate-500 dark:text-slate-400">
              {t('common.searchPlaceholder')}
            </span>
          </div>
          <div className="flex items-center space-x-1.5">
            <kbd className="hidden sm:inline-block px-2.5 py-1 text-xs font-mono font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg border border-slate-300 dark:border-slate-600 shadow-sm">
              Ctrl + K
            </kbd>
          </div>
        </button>
      </div>

      {/* Quick Jump Suggestion Pills */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs">
        <span className="text-slate-400 font-medium mr-1">Popular:</span>
        {quickPills.map((pill) => (
          <button
            key={pill.id}
            onClick={() => onSelectTool(pill.id)}
            className="px-3 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:border-rose-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/50 transition-all shadow-xs"
          >
            {t(`tools.${pill.id}.title`)}
          </button>
        ))}
      </div>
    </div>
  );
};
