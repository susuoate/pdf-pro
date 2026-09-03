import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider, useTranslation } from './context/LanguageContext';
import { ToastProvider } from './components/common/ToastContainer';
import { AppShell } from './components/layout/AppShell';
import { HeroSection } from './components/dashboard/HeroSection';
import { CategoryTabs, CategoryId } from './components/dashboard/CategoryTabs';
import { ToolCardGrid } from './components/dashboard/ToolCardGrid';
import { QuickSearchModal } from './components/dashboard/QuickSearchModal';
import { UnifiedWorkspace } from './components/workspace/UnifiedWorkspace';
import {
  MergeSidebar,
  SplitSidebar,
  RotateSidebar,
  ExtractSidebar,
  Img2PdfSidebar,
  Pdf2ImgSidebar,
  CompressSidebar,
  ProtectSidebar,
  UnlockSidebar,
  MetadataSidebar,
} from './components/tools/ToolSidebars';
import {
  WatermarkSidebar,
  PageNumbersSidebar,
} from './components/tools/WatermarkPageNumberSidebars';
import { SignToolWorkspace } from './components/tools/SignToolWorkspace';
import { EditorWorkspace } from './components/tools/EditorWorkspace';
import { RedactWorkspace } from './components/tools/RedactWorkspace';
import { OcrWorkspace } from './components/tools/OcrWorkspace';
import { executeTool } from './services/toolExecutors';

const MainDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [activeTool, setActiveTool] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '');
      return hash || null;
    }
    return null;
  });
  const [activeCategory, setActiveCategory] = useState<CategoryId>('all');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Sync hash routing
  useEffect(() => {
    const handleHashChange = () => {
      const tool = window.location.hash.replace('#', '');
      setActiveTool(tool || null);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Global Ctrl+K shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelectTool = (toolId: string) => {
    window.location.hash = toolId;
    setActiveTool(toolId);
  };

  const handleNavigateHome = () => {
    window.location.hash = '';
    setActiveTool(null);
  };

  const categoryCounts: Record<CategoryId, number> = {
    all: 17,
    organize: 5,
    convert: 4,
    edit: 3,
    security: 5,
  };

  // Helper to render appropriate tool configuration sidebar
  const renderToolSidebar = (files: any[], config: any, setConfig: any, onAddMoreFiles?: any) => {
    if (!activeTool) return null;

    switch (activeTool) {
      case 'merge':
        return <MergeSidebar files={files} config={config} setConfig={setConfig} onAddMoreFiles={onAddMoreFiles} />;
      case 'split':
        return <SplitSidebar files={files} config={config} setConfig={setConfig} />;
      case 'rotate':
        return <RotateSidebar files={files} config={config} setConfig={setConfig} />;
      case 'extract':
        return <ExtractSidebar files={files} config={config} setConfig={setConfig} />;
      case 'img2pdf':
        return <Img2PdfSidebar files={files} config={config} setConfig={setConfig} />;
      case 'pdf2img':
        return <Pdf2ImgSidebar files={files} config={config} setConfig={setConfig} />;
      case 'compress':
        return <CompressSidebar files={files} config={config} setConfig={setConfig} />;
      case 'ocr':
        return <OcrWorkspace files={files} config={config} setConfig={setConfig} />;
      case 'watermark':
        return <WatermarkSidebar files={files} config={config} setConfig={setConfig} />;
      case 'pageNumbers':
        return <PageNumbersSidebar files={files} config={config} setConfig={setConfig} />;
      case 'protect':
        return <ProtectSidebar files={files} config={config} setConfig={setConfig} />;
      case 'unlock':
        return <UnlockSidebar files={files} config={config} setConfig={setConfig} />;
      case 'metadata':
        return <MetadataSidebar files={files} config={config} setConfig={setConfig} />;
      default:
        return null;
    }
  };

  // Helper to render custom interactive canvas workspace
  const renderCustomPreviewWorkspace = (files: any[], config: any, setConfig: any) => {
    if (!activeTool) return null;

    switch (activeTool) {
      case 'sign':
        return <SignToolWorkspace files={files} config={config} setConfig={setConfig} />;
      case 'editor':
        return <EditorWorkspace files={files} config={config} setConfig={setConfig} />;
      case 'redact':
        return <RedactWorkspace files={files} config={config} setConfig={setConfig} />;
      default:
        return null;
    }
  };

  const getAcceptedTypes = (tool: string | null) => {
    if (tool === 'img2pdf') {
      return ['.jpg', '.jpeg', '.png', '.webp', 'image/*'];
    }
    return ['.pdf'];
  };

  const getIsMultiFile = (tool: string | null) => {
    if (tool === 'merge' || tool === 'img2pdf') {
      return true;
    }
    return false;
  };

  return (
    <AppShell
      onSelectTool={handleSelectTool}
      onOpenSearch={() => setIsSearchOpen(true)}
      onNavigateHome={handleNavigateHome}
    >
      {!activeTool ? (
        /* Home Dashboard View */
        <div className="space-y-8 animate-in fade-in duration-200">
          <HeroSection
            onOpenSearch={() => setIsSearchOpen(true)}
            onSelectTool={handleSelectTool}
          />
          <CategoryTabs
            activeCategory={activeCategory}
            onSelectCategory={setActiveCategory}
            counts={categoryCounts}
          />
          <ToolCardGrid
            activeCategory={activeCategory}
            onSelectTool={handleSelectTool}
          />
        </div>
      ) : (
        /* Standardized Unified Workspace View */
        <div className="animate-in fade-in duration-200">
          <UnifiedWorkspace
            toolId={activeTool}
            title={t(`tools.${activeTool}.title`)}
            description={t(`tools.${activeTool}.desc`)}
            badge={t(`tools.${activeTool}.badge`)}
            acceptedTypes={getAcceptedTypes(activeTool)}
            isMultiFile={getIsMultiFile(activeTool)}
            onBack={handleNavigateHome}
            renderSidebar={
              ['sign', 'editor', 'redact'].includes(activeTool)
                ? undefined
                : renderToolSidebar
            }
            renderCustomPreview={
              ['sign', 'editor', 'redact'].includes(activeTool)
                ? renderCustomPreviewWorkspace
                : undefined
            }
            onExecute={async (files, config, updateProgress) => {
              return await executeTool(activeTool, files, config, updateProgress);
            }}
          />
        </div>
      )}

      {/* Global Quick Search Palette */}
      <QuickSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectTool={handleSelectTool}
      />
    </AppShell>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <ToastProvider>
          <MainDashboard />
        </ToastProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;
