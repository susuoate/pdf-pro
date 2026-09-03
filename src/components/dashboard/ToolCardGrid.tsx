import React from 'react';
import {
  FileText,
  Layers,
  Scissors,
  RotateCw,
  Copy,
  Image,
  FileImage,
  Minimize2,
  ScanText,
  Edit3,
  Stamp,
  Hash,
  PenTool,
  Lock,
  Unlock,
  EyeOff,
  Info,
} from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { CategoryId } from './CategoryTabs';

export interface ToolCardGridProps {
  activeCategory: CategoryId;
  onSelectTool: (toolId: string) => void;
}

export const ToolCardGrid: React.FC<ToolCardGridProps> = ({ activeCategory, onSelectTool }) => {
  const { t } = useTranslation();

  const toolDefs = [
    // Organize
    { id: 'merge', category: 'organize', icon: Layers, color: 'rose' },
    { id: 'split', category: 'organize', icon: Scissors, color: 'rose' },
    { id: 'organize', category: 'organize', icon: FileText, color: 'rose' },
    { id: 'rotate', category: 'organize', icon: RotateCw, color: 'rose' },
    { id: 'extract', category: 'organize', icon: Copy, color: 'rose' },
    // Convert
    { id: 'img2pdf', category: 'convert', icon: Image, color: 'emerald' },
    { id: 'pdf2img', category: 'convert', icon: FileImage, color: 'emerald' },
    { id: 'compress', category: 'convert', icon: Minimize2, color: 'emerald' },
    { id: 'ocr', category: 'convert', icon: ScanText, color: 'emerald' },
    // Edit
    { id: 'editor', category: 'edit', icon: Edit3, color: 'blue' },
    { id: 'watermark', category: 'edit', icon: Stamp, color: 'blue' },
    { id: 'pageNumbers', category: 'edit', icon: Hash, color: 'blue' },
    // Security
    { id: 'sign', category: 'security', icon: PenTool, color: 'purple' },
    { id: 'protect', category: 'security', icon: Lock, color: 'purple' },
    { id: 'unlock', category: 'security', icon: Unlock, color: 'purple' },
    { id: 'redact', category: 'security', icon: EyeOff, color: 'purple' },
    { id: 'metadata', category: 'security', icon: Info, color: 'purple' },
  ];

  const filteredTools =
    activeCategory === 'all'
      ? toolDefs
      : toolDefs.filter((tool) => tool.category === activeCategory);

  const getIconColorClasses = (color: string) => {
    switch (color) {
      case 'rose':
        return 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 group-hover:bg-rose-500 group-hover:text-white';
      case 'emerald':
        return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white';
      case 'blue':
        return 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 group-hover:bg-blue-500 group-hover:text-white';
      case 'purple':
        return 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 group-hover:bg-purple-500 group-hover:text-white';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mt-6">
      {filteredTools.map((tool) => {
        const Icon = tool.icon;
        const title = t(`tools.${tool.id}.title`);
        const desc = t(`tools.${tool.id}.desc`);
        const badge = t(`tools.${tool.id}.badge`);

        return (
          <button
            key={tool.id}
            onClick={() => onSelectTool(tool.id)}
            className="group relative flex flex-col justify-between p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/70 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all text-left overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 cursor-pointer"
          >
            {/* Top Row: Icon & Badge */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-xs transition-colors duration-200 ${getIconColorClasses(
                    tool.color
                  )}`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                {badge && (
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300">
                    {badge}
                  </span>
                )}
              </div>

              {/* Title & Description */}
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                {title}
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                {desc}
              </p>
            </div>

            {/* Bottom Category Pill Indicator */}
            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold uppercase tracking-wider text-[10px]">
                {t(`categories.${tool.category}`)}
              </span>
              <span className="font-bold text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                {t(`tools.${tool.id}.action`)} →
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
};
