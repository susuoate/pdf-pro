import React, { useState, useEffect } from 'react';
import { ShieldCheck, Cpu, Wifi, WifiOff, Instagram, Sparkles } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';

export interface FooterProps {
  onSelectTool: (toolId: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectTool }) => {
  const { t } = useTranslation();
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors">
      {/* Privacy Guarantee & Offline Telemetry Banner */}
      <div className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/50 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Local Sandbox Badge */}
            <div className="flex items-center space-x-3 p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {t('privacy.statProcessedLocally')}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Wasm & Pure JS Browser Execution
                </div>
              </div>
            </div>

            {/* Zero Server Upload */}
            <div className="flex items-center space-x-3 p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {t('privacy.statZeroDataSent')}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Zero Document Network Ingress/Egress
                </div>
              </div>
            </div>

            {/* Live Network & Offline Status */}
            <div className="flex items-center space-x-3 p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 shadow-sm">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  isOnline
                    ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                    : 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                }`}
              >
                {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {isOnline ? t('common.online') : t('common.offline')}
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                    }`}
                  />
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {t('privacy.stat100PercentOffline')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              {t('categories.organize')}
            </h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              {['merge', 'split', 'organize', 'rotate', 'extract'].map((tool) => (
                <li key={tool}>
                  <button
                    onClick={() => onSelectTool(tool)}
                    className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                  >
                    {t(`tools.${tool}.title`)}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              {t('categories.convert')}
            </h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              {['img2pdf', 'pdf2img', 'compress', 'ocr'].map((tool) => (
                <li key={tool}>
                  <button
                    onClick={() => onSelectTool(tool)}
                    className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                  >
                    {t(`tools.${tool}.title`)}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              {t('categories.edit')}
            </h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              {['editor', 'watermark', 'pageNumbers'].map((tool) => (
                <li key={tool}>
                  <button
                    onClick={() => onSelectTool(tool)}
                    className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                  >
                    {t(`tools.${tool}.title`)}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              {t('categories.security')}
            </h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              {['sign', 'protect', 'unlock', 'redact', 'metadata'].map((tool) => (
                <li key={tool}>
                  <button
                    onClick={() => onSelectTool(tool)}
                    className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                  >
                    {t(`tools.${tool}.title`)}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Attribution */}
        <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-4">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
            <span className="font-bold text-slate-800 dark:text-slate-200">PDF PRO BY Oatdh</span>
            <span>—</span>
            <span>{t('footer.allRightsReserved')}</span>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
            <a
              href="https://instagram.com/oatdh"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/10 via-rose-500/10 to-amber-500/10 dark:from-purple-950/50 dark:via-rose-950/50 dark:to-amber-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 font-bold hover:scale-105 hover:border-rose-400 transition-all shadow-xs"
              title="Instagram: @oatdh"
            >
              <Instagram className="w-3.5 h-3.5" />
              <span>IG : Oatdh</span>
            </a>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>
                Powered by <strong className="text-slate-900 dark:text-white font-extrabold">Antigravity</strong>
              </span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
