import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

export interface AppShellProps {
  children: React.ReactNode;
  onSelectTool: (toolId: string) => void;
  onOpenSearch: () => void;
  onNavigateHome: () => void;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  onSelectTool,
  onOpenSearch,
  onNavigateHome,
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors font-sans antialiased">
      <Header
        onSelectTool={onSelectTool}
        onOpenSearch={onOpenSearch}
        onNavigateHome={onNavigateHome}
      />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <Footer onSelectTool={onSelectTool} />
    </div>
  );
};
