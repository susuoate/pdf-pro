import React from 'react';
import {
  FileText,
  ShieldCheck,
  Globe,
  Sun,
  Moon,
  Search,
} from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

export interface HeaderProps {
  onSelectTool: (toolId: string) => void;
  onOpenSearch: () => void;
  onNavigateHome: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSearch, onNavigateHome }) => {
  const { language, toggleLanguage, t } = useTranslation();
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center space-x-6">
          <button
            onClick={onNavigateHome}
            className="flex items-center space-x-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 rounded-lg p-1 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-rose-400 flex items-center justify-center text-white shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="flex items-center space-x-1.5">
                <span className="font-black text-lg text-slate-900 dark:text-white tracking-tight">
                  PDF PRO <span className="text-rose-500 font-extrabold text-sm">BY Oatdh</span>
                </span>
                <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                  Client-Side
                </span>
              </div>
            </div>
          </button>
        </div>

        {/* Action Controls (Search, Privacy, Language, Theme) */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Quick Search Shortcut Trigger */}
          <button
            onClick={onOpenSearch}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-sm hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700/60 transition-colors cursor-pointer"
            title="Search tools (Ctrl+K)"
          >
            <Search className="w-4 h-4 text-rose-500" />
            <span className="hidden sm:inline">{t('common.searchPlaceholder').slice(0, 16)}...</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-900 rounded border border-slate-300 dark:border-slate-600 shadow-xs">
              Ctrl+K
            </kbd>
          </button>

          {/* Privacy Trust Pill with Tooltip */}
          <div
            className="hidden md:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-medium cursor-help"
            title={t('common.privacyBadgeFull')}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{t('common.privacyPill')}</span>
          </div>

          {/* Language Toggle Button */}
          <button
            onClick={toggleLanguage}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            title="Switch Language (TH / EN)"
          >
            <Globe className="w-3.5 h-3.5 text-rose-500" />
            <span>{language === 'en' ? '🇹🇭 TH' : '🇬🇧 EN'}</span>
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            title={isDark ? t('common.lightMode') : t('common.darkMode')}
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400 transition-transform rotate-0 hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600 transition-transform rotate-0 hover:-rotate-12" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
