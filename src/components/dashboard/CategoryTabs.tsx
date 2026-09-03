import React from 'react';
import { Layers, ArrowRightLeft, Edit3, Lock, Grid } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';

export type CategoryId = 'all' | 'organize' | 'convert' | 'edit' | 'security';

export interface CategoryTabsProps {
  activeCategory: CategoryId;
  onSelectCategory: (category: CategoryId) => void;
  counts: Record<CategoryId, number>;
}

export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  activeCategory,
  onSelectCategory,
  counts,
}) => {
  const { t } = useTranslation();

  const categories: { id: CategoryId; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'all', label: t('categories.all'), icon: Grid },
    { id: 'organize', label: t('categories.organize'), icon: Layers },
    { id: 'convert', label: t('categories.convert'), icon: ArrowRightLeft },
    { id: 'edit', label: t('categories.edit'), icon: Edit3 },
    { id: 'security', label: t('categories.security'), icon: Lock },
  ];

  return (
    <div className="flex items-center justify-center overflow-x-auto py-2 no-scrollbar">
      <div className="inline-flex p-1.5 rounded-2xl bg-slate-200/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-300/40 dark:border-slate-700/40 space-x-1">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                isActive
                  ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-md shadow-slate-200/50 dark:shadow-none'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/40'
              }`}
            >
              <Icon
                className={`w-4 h-4 ${
                  isActive ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'
                }`}
              />
              <span>{cat.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[11px] font-semibold ${
                  isActive
                    ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                    : 'bg-slate-300/50 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400'
                }`}
              >
                {counts[cat.id] || 0}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
