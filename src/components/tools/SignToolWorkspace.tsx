import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  PenTool,
  Type,
  Upload,
  Trash2,
  Check,
  Move,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Palette,
  Sparkles,
} from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { WorkspaceFile } from '../workspace/UnifiedWorkspace';
import { canvasService } from '../../services/canvasService';
import { pdfRendererService } from '../../services/pdfRendererService';

export interface SignatureItem {
  id: string;
  dataUrl: string;
  x: number; // Center X Percentage (0 - 100)
  y: number; // Center Y Percentage (0 - 100)
  widthPercent: number; // Width as % of container
  heightPercent: number; // Height as % of container
  pageIndex: number;
}

export const SignToolWorkspace: React.FC<{
  files: WorkspaceFile[];
  config: any;
  setConfig: React.Dispatch<React.SetStateAction<any>>;
}> = ({ files, config, setConfig }) => {
  const { t } = useTranslation();
  const [tab, setTab] = useState<'draw' | 'type' | 'upload'>('draw');
  const [typedName, setTypedName] = useState('');
  const [selectedFont, setSelectedFont] = useState<'font-brush' | 'font-cursive' | 'font-calligraphy'>('font-brush');
  const [penColor, setPenColor] = useState('#0f172a');
  const [penThickness, setPenThickness] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageThumbnails, setPageThumbnails] = useState<string[]>([]);
  const [selectedSigId, setSelectedSigId] = useState<string | null>(null);

  // Dragging & Resizing State
  const [dragState, setDragState] = useState<{
    sigId: string;
    action: 'move' | 'resize';
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    initialW: number;
    initialH: number;
  } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pdfContainerRef = useRef<HTMLDivElement | null>(null);

  const signatures: SignatureItem[] = config.signatures || [];

  // Render high-res previews for the active document pages
  useEffect(() => {
    let isMounted = true;
    const renderThumbnails = async () => {
      if (!files[0]?.arrayBuffer) return;
      try {
        const doc = await pdfRendererService.loadDocument(files[0].arrayBuffer);
        const count = pdfRendererService.getPageCount(doc);
        const urls: string[] = [];
        for (let i = 1; i <= count; i++) {
          const url = await pdfRendererService.renderThumbnail(doc, i, 1200);
          urls.push(url);
        }
        if (isMounted) setPageThumbnails(urls);
        pdfRendererService.destroyDocument(doc);
      } catch (err) {
        console.warn('Failed rendering pages for signature view:', err);
      }
    };
    renderThumbnails();
    return () => {
      isMounted = false;
    };
  }, [files]);

  // Drawing Pad logic
  const handleStartDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const handleDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.lineWidth = penThickness;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = penColor;
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const handleStopDraw = () => {
    setIsDrawing(false);
  };

  const handleClearPad = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const placeSignatureOnPage = (dataUrl: string) => {
    const newSig: SignatureItem = {
      id: `sig-${Date.now()}`,
      dataUrl,
      x: 50,
      y: 75,
      widthPercent: 32,
      heightPercent: 12,
      pageIndex: currentPage,
    };
    const updated = [...signatures, newSig];
    setConfig({ ...config, signatures: updated });
    setSelectedSigId(newSig.id);
  };

  const handleAdoptDrawnSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    placeSignatureOnPage(dataUrl);
  };

  const handleAdoptTypedSignature = () => {
    if (!typedName) return;
    const { canvas, ctx } = canvasService.createCanvas(600, 200);
    const fontCss =
      selectedFont === 'font-brush'
        ? 'italic bold 52px "Brush Script MT", cursive'
        : selectedFont === 'font-cursive'
        ? 'italic 48px "Lucida Handwriting", "Caveat", cursive'
        : 'italic 50px "Segoe Script", "Dancing Script", cursive';

    ctx.font = fontCss;
    ctx.fillStyle = penColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(typedName, 300, 100);
    const dataUrl = canvas.toDataURL('image/png');
    placeSignatureOnPage(dataUrl);
  };

  const handleUploadSignature = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const { canvas, ctx } = canvasService.createCanvas(img.width, img.height);
        ctx.drawImage(img, 0, 0);
        const transparentCanvas = canvasService.removeWhiteBackground(canvas, 230);
        const dataUrl = transparentCanvas.toDataURL('image/png');
        placeSignatureOnPage(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveSignature = (id: string) => {
    const updated = signatures.filter((s) => s.id !== id);
    setConfig({ ...config, signatures: updated });
    if (selectedSigId === id) setSelectedSigId(null);
  };

  // Drag & Move Signature on Page
  const startDragMove = (e: React.MouseEvent | React.TouchEvent, sig: SignatureItem) => {
    e.stopPropagation();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setSelectedSigId(sig.id);
    setDragState({
      sigId: sig.id,
      action: 'move',
      startX: clientX,
      startY: clientY,
      initialX: sig.x,
      initialY: sig.y,
      initialW: sig.widthPercent,
      initialH: sig.heightPercent,
    });
  };

  // Resize Signature on Page
  const startResize = (e: React.MouseEvent | React.TouchEvent, sig: SignatureItem) => {
    e.stopPropagation();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setSelectedSigId(sig.id);
    setDragState({
      sigId: sig.id,
      action: 'resize',
      startX: clientX,
      startY: clientY,
      initialX: sig.x,
      initialY: sig.y,
      initialW: sig.widthPercent,
      initialH: sig.heightPercent,
    });
  };

  // Global mousemove / mouseup listeners for smooth dragging
  const handlePointerMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!dragState || !pdfContainerRef.current) return;
      const rect = pdfContainerRef.current.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const deltaXPercent = ((clientX - dragState.startX) / rect.width) * 100;
      const deltaYPercent = ((clientY - dragState.startY) / rect.height) * 100;

      if (dragState.action === 'move') {
        const newX = Math.max(5, Math.min(95, dragState.initialX + deltaXPercent));
        const newY = Math.max(5, Math.min(95, dragState.initialY + deltaYPercent));

        const updated = signatures.map((s) =>
          s.id === dragState.sigId ? { ...s, x: newX, y: newY } : s
        );
        setConfig({ ...config, signatures: updated });
      } else if (dragState.action === 'resize') {
        const newW = Math.max(10, Math.min(80, dragState.initialW + deltaXPercent * 2));
        const newH = Math.max(4, Math.min(50, dragState.initialH + deltaYPercent * 2));

        const updated = signatures.map((s) =>
          s.id === dragState.sigId ? { ...s, widthPercent: newW, heightPercent: newH } : s
        );
        setConfig({ ...config, signatures: updated });
      }
    },
    [dragState, signatures, config, setConfig]
  );

  const handlePointerUp = useCallback(() => {
    setDragState(null);
  }, []);

  useEffect(() => {
    if (dragState) {
      window.addEventListener('mousemove', handlePointerMove);
      window.addEventListener('mouseup', handlePointerUp);
      window.addEventListener('touchmove', handlePointerMove);
      window.addEventListener('touchend', handlePointerUp);
    }
    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [dragState, handlePointerMove, handlePointerUp]);

  const totalPages = files[0]?.pageCount || pageThumbnails.length || 1;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Area: Document Page Viewer with Interactive Drag & Drop Signature Overlays */}
      <div className="lg:col-span-8 space-y-4">
        {/* Page Nav */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
            {t('common.page')} {currentPage + 1} / {totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              disabled={currentPage === 0}
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-rose-50 text-slate-700 dark:text-slate-200 disabled:opacity-40 flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>{t('common.prev')}</span>
            </button>
            <button
              disabled={currentPage >= totalPages - 1}
              onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-rose-50 text-slate-700 dark:text-slate-200 disabled:opacity-40 flex items-center gap-1 cursor-pointer"
            >
              <span>{t('common.next')}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* PDF Page Canvas with Signature Overlays */}
        <div
          ref={pdfContainerRef}
          onClick={() => setSelectedSigId(null)}
          className="relative mx-auto max-w-xl aspect-[1/1.414] bg-white shadow-2xl rounded-2xl border border-slate-300 dark:border-slate-700 overflow-hidden select-none"
        >
          {pageThumbnails[currentPage] ? (
            <img
              src={pageThumbnails[currentPage]}
              alt={`Page ${currentPage + 1}`}
              className="w-full h-full object-contain pointer-events-none"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-sm gap-2">
              <Sparkles className="w-6 h-6 animate-pulse text-purple-500" />
              <span>กำลังโหลดหน้าเอกสาร...</span>
            </div>
          )}

          {/* Render Active Signatures on this page */}
          {signatures
            .filter((sig) => sig.pageIndex === currentPage)
            .map((sig) => {
              const isSelected = selectedSigId === sig.id;
              return (
                <div
                  key={sig.id}
                  onMouseDown={(e) => startDragMove(e, sig)}
                  onTouchStart={(e) => startDragMove(e, sig)}
                  style={{
                    top: `${sig.y}%`,
                    left: `${sig.x}%`,
                    width: `${sig.widthPercent}%`,
                    height: `${sig.heightPercent}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className={`absolute group cursor-move rounded-xl p-1.5 transition-all flex items-center justify-center ${
                    isSelected
                      ? 'ring-2 ring-purple-500 bg-purple-500/10 shadow-lg'
                      : 'border border-dashed border-purple-400/80 bg-purple-50/20 hover:border-purple-600'
                  }`}
                >
                  <img
                    src={sig.dataUrl}
                    alt="Signature"
                    className="w-full h-full object-contain pointer-events-none drop-shadow-xs"
                  />

                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveSignature(sig.id);
                    }}
                    title="ลบลายเซ็น"
                    className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs shadow-md opacity-0 group-hover:opacity-100 hover:bg-rose-600 transition-opacity cursor-pointer z-10"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>

                  {/* Move Helper Tag */}
                  <div className="absolute -top-2.5 -left-2.5 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <Move className="w-3 h-3" />
                  </div>

                  {/* Resize Handle at Bottom-Right */}
                  <div
                    onMouseDown={(e) => startResize(e, sig)}
                    onTouchStart={(e) => startResize(e, sig)}
                    title="ลากเพื่อย่อ/ขยายขนาด"
                    className="absolute -bottom-2 -right-2 w-5 h-5 rounded-full bg-purple-600 border-2 border-white text-white flex items-center justify-center cursor-nwse-resize shadow-md hover:scale-125 transition-transform"
                  >
                    <Maximize2 className="w-2.5 h-2.5 -rotate-45" />
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Right Area: Signature Creator Studio */}
      <div className="lg:col-span-4">
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
          <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold pb-2 border-b border-slate-200 dark:border-slate-700">
            <PenTool className="w-5 h-5 text-purple-500" />
            <span>{t('tools.sign.title')}</span>
          </div>

          {/* Creation Mode Tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
            {[
              { id: 'draw', label: t('tools.sign.draw'), icon: PenTool },
              { id: 'type', label: t('tools.sign.type'), icon: Type },
              { id: 'upload', label: t('tools.sign.upload'), icon: Upload },
            ].map((tabItem) => {
              const Icon = tabItem.icon;
              return (
                <button
                  key={tabItem.id}
                  type="button"
                  onClick={() => setTab(tabItem.id as any)}
                  className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                    tab === tabItem.id
                      ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tabItem.label}</span>
                </button>
              );
            })}
          </div>

          {/* Pen Color & Thickness Controls */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Palette className="w-3.5 h-3.5 text-purple-500" />
                <span>สีหมึกลายเซ็น:</span>
              </span>
              <div className="flex space-x-2">
                {[
                  { color: '#0f172a', label: 'ดำ' },
                  { color: '#1d4ed8', label: 'น้ำเงิน' },
                  { color: '#1e3a8a', label: 'กรมท่า' },
                  { color: '#b91c1c', label: 'แดง' },
                ].map((c) => (
                  <button
                    key={c.color}
                    type="button"
                    title={c.label}
                    onClick={() => setPenColor(c.color)}
                    style={{ backgroundColor: c.color }}
                    className={`w-6 h-6 rounded-full border-2 transition-all cursor-pointer ${
                      penColor === c.color ? 'border-purple-500 scale-125 shadow-xs' : 'border-transparent'
                    }`}
                  />
                ))}
              </div>
            </div>

            {tab === 'draw' && (
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-slate-500">ขนาดเส้นหมึก:</span>
                <div className="flex space-x-1.5">
                  {[
                    { sz: 2, label: 'บาง' },
                    { sz: 3, label: 'ปกติ' },
                    { sz: 5, label: 'หนา' },
                  ].map((item) => (
                    <button
                      key={item.sz}
                      type="button"
                      onClick={() => setPenThickness(item.sz)}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer ${
                        penThickness === item.sz
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* TAB 1: DRAW */}
          {tab === 'draw' && (
            <div className="space-y-3">
              <div className="border-2 border-dashed border-purple-200 dark:border-purple-900/60 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-900/60 shadow-inner">
                <canvas
                  ref={canvasRef}
                  width={340}
                  height={150}
                  onMouseDown={handleStartDraw}
                  onMouseMove={handleDraw}
                  onMouseUp={handleStopDraw}
                  onMouseLeave={handleStopDraw}
                  onTouchStart={handleStartDraw}
                  onTouchMove={handleDraw}
                  onTouchEnd={handleStopDraw}
                  className="w-full h-40 cursor-crosshair touch-none"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={handleClearPad}
                  className="flex-1 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center space-x-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t('common.clear')}</span>
                </button>
                <button
                  type="button"
                  onClick={handleAdoptDrawnSignature}
                  className="flex-1 py-2 text-xs font-bold rounded-xl bg-purple-600 text-white hover:bg-purple-700 flex items-center justify-center space-x-1 cursor-pointer shadow-md"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{t('tools.sign.placeSignature')}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: TYPE */}
          {tab === 'type' && (
            <div className="space-y-3">
              <input
                type="text"
                placeholder={t('tools.sign.typeYourName')}
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
              />

              {/* Font Style Selection */}
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'font-brush', label: 'แบบที่ 1 (Classic)' },
                  { id: 'font-cursive', label: 'แบบที่ 2 (Script)' },
                  { id: 'font-calligraphy', label: 'แบบที่ 3 (Modern)' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSelectedFont(f.id as any)}
                    className={`py-1.5 px-2 text-[11px] font-medium rounded-lg border text-center cursor-pointer truncate ${
                      selectedFont === f.id
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Live Typed Preview Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center min-h-[90px] shadow-inner">
                <span
                  style={{
                    color: penColor,
                    fontFamily:
                      selectedFont === 'font-brush'
                        ? '"Brush Script MT", cursive'
                        : selectedFont === 'font-cursive'
                        ? '"Caveat", "Lucida Handwriting", cursive'
                        : '"Dancing Script", "Segoe Script", cursive',
                  }}
                  className="text-3xl italic"
                >
                  {typedName || 'ลายเซ็นของคุณ'}
                </span>
              </div>

              <button
                type="button"
                onClick={handleAdoptTypedSignature}
                disabled={!typedName.trim()}
                className="w-full py-2.5 text-xs font-bold rounded-xl bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-40 flex items-center justify-center space-x-1 cursor-pointer shadow-md"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{t('tools.sign.placeSignature')}</span>
              </button>
            </div>
          )}

          {/* TAB 3: UPLOAD */}
          {tab === 'upload' && (
            <div className="space-y-3">
              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-purple-300 dark:border-purple-800 rounded-2xl hover:border-purple-500 cursor-pointer bg-purple-50/40 dark:bg-purple-950/20 transition-all hover:scale-[1.01]">
                <Upload className="w-8 h-8 text-purple-600 dark:text-purple-400 mb-2" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {t('tools.sign.uploadSignatureImg')}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 text-center">
                  PNG, JPG (ระบบจะลบพื้นหลังขาวให้อัตโนมัติ)
                </span>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg"
                  onChange={handleUploadSignature}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* Placement Notice */}
          <div className="p-3.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/30 text-[11px] text-purple-700 dark:text-purple-300 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <Move className="w-3.5 h-3.5" /> {t('tools.sign.placementTip')}
            </p>
            <p>
              • สามารถคลิกลากย้ายตำแหน่งลายเซ็นบนหน้ากระดาษได้อิสระ
              <br />• ลากจุดมุมขวาล่าง ↘ เพื่อย่อหรือขยายขนาดลายเซ็น
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
