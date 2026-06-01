import React, { useRef, useCallback, useEffect } from 'react';
import { toPng } from 'html-to-image';
import { useStore, DrawTool, buildGradient } from '../store';
import AnnotationLayer from './AnnotationLayer';

const PreviewCanvas: React.FC = () => {
  const store = useStore();
  const previewRef = useRef<HTMLDivElement>(null);

  // ── Keyboard shortcuts ──────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      const typing = el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT');
      const s = useStore.getState();

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (typing) return;
        e.preventDefault();
        s.undoAnnotation();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        s.setDrawTool(s.drawTool === 'move' ? 'none' : 'move');
      } else if (e.key === 'Escape') {
        if (!typing) s.setDrawTool('none');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ── Compute canvas dimensions from aspect ratio ────────────────────────
  const getCanvasDimensions = () => {
    const ratios: Record<string, [number, number]> = {
      'auto': [0, 0],
      '4:3': [4, 3],
      '3:2': [3, 2],
      '16:9': [16, 9],
      '1:1': [1, 1],
      'custom': [store.customWidth, store.customHeight],
    };

    const [w, h] = ratios[store.aspectRatio] ?? [0, 0];
    if (w === 0 || h === 0) return { width: '100%', height: '100%', isFixed: false };

    const maxW = window.innerWidth * 0.75;
    const maxH = window.innerHeight * 0.80;
    const ratio = w / h;
    let width = maxW;
    let height = width / ratio;
    if (height > maxH) {
      height = maxH;
      width = height * ratio;
    }

    return { width: `${width}px`, height: `${height}px`, isFixed: true };
  };

  // ── Background style ───────────────────────────────────────────────────
  const getBgStyle = (): React.CSSProperties => {
    const { background } = store;
    if (background.type === 'gradient') {
      return { background: buildGradient(background.gradientType, background.gradientAngle, background.gradientColors) };
    }
    if (background.type === 'solid') {
      return { background: background.solidColor };
    }
    if (background.type === 'image' && background.imageUrl) {
      return {
        backgroundImage: `url(${background.imageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    }
    return { background: '#667eea' };
  };

  // ── Screenshot position offset (grid + free drag) ──────────────────────
  const getPositionStyle = (): React.CSSProperties => {
    const xPercent = store.positionX * 10;
    const yPercent = store.positionY * 10;
    return {
      transform: `translate(calc(${xPercent}% + ${store.offsetX}px), calc(${yPercent}% + ${store.offsetY}px))`,
    };
  };

  // ── Shadow ─────────────────────────────────────────────────────────────
  const getShadow = (): string => {
    if (store.shadowSize === 0) return 'none';
    const s = store.shadowSize;
    const color = store.shadowColor;
    return `0 ${s * 0.5}px ${s}px ${color}, 0 ${s * 0.25}px ${s * 0.5}px ${color}`;
  };

  // ── Export handlers ────────────────────────────────────────────────────
  const exportImage = useCallback(async (): Promise<string | null> => {
    if (!previewRef.current) return null;
    try {
      // Adaptive pixelRatio: export so the embedded screenshot keeps its full
      // native resolution. clientWidth is the unscaled layout width (CSS zoom
      // transform on the ancestor doesn't affect it).
      let pixelRatio = 3;
      const img = previewRef.current.querySelector('img');
      if (img && img.naturalWidth && img.clientWidth) {
        const needed = img.naturalWidth / img.clientWidth;
        pixelRatio = Math.min(5, Math.max(3, needed));
      }
      return await toPng(previewRef.current, { cacheBust: true, pixelRatio });
    } catch (err) {
      console.error('Export failed:', err);
      return null;
    }
  }, []);

  const handleSave = async () => {
    const dataURL = await exportImage();
    if (dataURL) {
      await window.electronAPI.saveImage(dataURL);
    }
  };

  const handleCopy = async () => {
    const dataURL = await exportImage();
    if (dataURL) {
      await window.electronAPI.copyToClipboard(dataURL);
    }
  };

  const handleNewScreenshot = () => {
    useStore.setState({ screenshot: null, annotations: [], drawTool: 'none' });
  };

  // ── Canvas padding conversion ──────────────────────────────────────────
  const paddingPx = Math.round((store.padding / 100) * 80);
  const insetPx = store.inset > 0 ? Math.round((store.inset / 60) * 24) : 0;
  const dims = getCanvasDimensions();
  // Max image box for auto mode (canvas hugs image with even padding)
  const maxAutoW = Math.round(window.innerWidth * 0.52);
  const maxAutoH = Math.round(window.innerHeight * 0.6);

  // ── Window frame chrome ─────────────────────────────────────────────────
  const TrafficLights = () => (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57' }} />
      <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#febc2e' }} />
      <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#28c840' }} />
    </div>
  );

  const renderTitleBar = () => {
    if (store.frame === 'macos') {
      return (
        <div style={{ height: 34, background: '#e9e9eb', display: 'flex', alignItems: 'center', padding: '0 14px', borderBottom: '1px solid #d4d4d8', lineHeight: 'normal' }}>
          <TrafficLights />
        </div>
      );
    }
    if (store.frame === 'windows') {
      return (
        <div style={{ height: 34, background: '#f3f3f3', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 18, padding: '0 16px', borderBottom: '1px solid #e0e0e0', lineHeight: 'normal', color: '#555' }}>
          {/* minimize */}
          <svg width="12" height="12" viewBox="0 0 12 12"><rect y="5.5" width="12" height="1" fill="currentColor" /></svg>
          {/* maximize */}
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><rect x="0.75" y="0.75" width="10.5" height="10.5" stroke="currentColor" strokeWidth="1.1" /></svg>
          {/* close */}
          <svg width="12" height="12" viewBox="0 0 12 12"><line x1="1" y1="1" x2="11" y2="11" stroke="currentColor" strokeWidth="1.2" /><line x1="11" y1="1" x2="1" y2="11" stroke="currentColor" strokeWidth="1.2" /></svg>
        </div>
      );
    }
    if (store.frame === 'browser') {
      return (
        <div style={{ height: 42, background: '#e9e9eb', display: 'flex', alignItems: 'center', gap: 14, padding: '0 14px', borderBottom: '1px solid #d4d4d8', lineHeight: 'normal' }}>
          <TrafficLights />
          <div style={{ flex: 1, height: 26, background: '#fff', borderRadius: 13, display: 'flex', alignItems: 'center', padding: '0 14px', fontSize: 12, color: '#9aa0aa', fontFamily: 'system-ui, sans-serif', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9aa0aa" strokeWidth="2" style={{ marginRight: 8, flexShrink: 0 }}>
              <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            example.com
          </div>
        </div>
      );
    }
    return null;
  };

  const renderScreenshot = (imgBox: { maxWidth: number | string; maxHeight: number | string }) => {
    const imgEl = (
      <img
        src={store.screenshot!}
        alt="Screenshot"
        style={{
          display: 'block',
          maxWidth: imgBox.maxWidth,
          maxHeight: imgBox.maxHeight,
          userSelect: 'none',
          pointerEvents: 'none',
        }}
        draggable={false}
      />
    );

    // No frame → image rounds itself, inset/border wrap it
    if (store.frame === 'none') {
      return (
        <div
          style={{
            display: 'inline-block',
            padding: insetPx > 0 ? insetPx : undefined,
            background: insetPx > 0 ? store.insetColor : undefined,
            border: store.borderWidth > 0 ? `${store.borderWidth}px solid ${store.borderColor}` : undefined,
            borderRadius: store.rounded,
            boxShadow: getShadow(),
            lineHeight: 0,
          }}
        >
          <img
            src={store.screenshot!}
            alt="Screenshot"
            style={{
              display: 'block',
              maxWidth: imgBox.maxWidth,
              maxHeight: imgBox.maxHeight,
              borderRadius: insetPx > 0 ? Math.max(0, store.rounded - insetPx) : store.rounded,
              userSelect: 'none',
              pointerEvents: 'none',
            }}
            draggable={false}
          />
        </div>
      );
    }

    // Framed → window chrome (title bar + image) as one rounded unit
    return (
      <div
        style={{
          display: 'inline-block',
          borderRadius: store.rounded,
          boxShadow: getShadow(),
          border: store.borderWidth > 0 ? `${store.borderWidth}px solid ${store.borderColor}` : undefined,
          overflow: 'hidden',
          background: '#fff',
          lineHeight: 0,
        }}
      >
        {renderTitleBar()}
        {imgEl}
      </div>
    );
  };

  const TOOLS: { id: DrawTool; title: string; icon: React.ReactNode }[] = [
    { id: 'none', title: 'Select (no draw)', icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m4 4 7.07 17 2.51-7.39L21 11.07z" /></svg>
    ) },
    { id: 'move', title: 'Move image (Ctrl+H)', icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 11V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2 2 2 0 0 0-2-2 2 2 0 0 0-2 2v0a2 2 0 0 0-2-2 2 2 0 0 0-2 2v6" /><path d="M14 10V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v2" /><path d="M10 10.5V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8" /><path d="M18 8a2 2 0 0 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" /></svg>
    ) },
    { id: 'blur', title: 'Blur region (hide info)', icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M7 8h.01M11 8h.01M15 8h.01M7 12h.01M11 12h.01M15 12h.01M7 16h.01M11 16h.01M15 16h.01" /></svg>
    ) },
    { id: 'pen', title: 'Pen', icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z" /><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" /><path d="M2 2l7.586 7.586" /><circle cx="11" cy="11" r="2" /></svg>
    ) },
    { id: 'arrow', title: 'Arrow', icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" /></svg>
    ) },
    { id: 'rect', title: 'Rectangle', icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="6" width="16" height="12" rx="2" /></svg>
    ) },
    { id: 'ellipse', title: 'Ellipse', icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><ellipse cx="12" cy="12" rx="9" ry="7" /></svg>
    ) },
    { id: 'text', title: 'Text', icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7" /><line x1="9" y1="20" x2="15" y2="20" /><line x1="12" y1="4" x2="12" y2="20" /></svg>
    ) },
  ];

  const DRAW_COLORS = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#111827', '#ffffff'];

  return (
    <div className="flex flex-col flex-1 overflow-hidden relative">
      {/* Drawing toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-white rounded-xl px-2 py-1.5 border border-[#dad0ee] shadow-lg">
        {TOOLS.map((t) => {
          const activeTool = store.drawTool === t.id;
          return (
            <button
              key={t.id}
              onClick={() => store.setDrawTool(t.id)}
              title={t.title}
              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                activeTool ? 'bg-[#4f35e8] text-white' : 'text-[#464555] hover:bg-[#f0f2ff]'
              }`}
            >
              {t.icon}
            </button>
          );
        })}

        <div className="w-px h-5 bg-[#e0ddf0] mx-1" />

        {/* Color swatches */}
        <div className="flex items-center gap-1">
          {DRAW_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => store.setDrawColor(c)}
              title={c}
              className={`w-5 h-5 rounded-full transition-transform hover:scale-110 ${
                store.drawColor === c ? 'ring-2 ring-offset-1 ring-[#4f35e8]' : 'ring-1 ring-[#d9def0]'
              }`}
              style={{ background: c }}
            />
          ))}
        </div>

        <div className="w-px h-5 bg-[#e0ddf0] mx-1" />

        {/* Undo */}
        <button
          onClick={() => store.undoAnnotation()}
          disabled={store.annotations.length === 0}
          title="Undo"
          className="w-8 h-8 flex items-center justify-center rounded-lg text-[#464555] hover:bg-[#f0f2ff] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" /></svg>
        </button>

        {/* Clear */}
        <button
          onClick={() => store.clearAnnotations()}
          disabled={store.annotations.length === 0}
          title="Clear all"
          className="w-8 h-8 flex items-center justify-center rounded-lg text-[#464555] hover:bg-[#fff0f0] hover:text-[#ef4444] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#464555] transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
        </button>
      </div>

      {/* Main canvas area */}
      <div className={`flex-1 ${store.darkMode ? 'canvas-bg-dark' : 'canvas-bg'} flex items-center justify-center overflow-auto p-12`}>
        <div
          style={{
            transform: `scale(${store.zoom / 100})`,
            transformOrigin: 'center center',
            transition: 'transform 0.1s ease',
            ...(dims.isFixed ? { width: dims.width, height: dims.height } : {}),
          }}
        >
          {/* The actual exported div */}
          <div
            id="preview-canvas"
            ref={previewRef}
            className={`relative rounded-[24px] overflow-hidden ${dims.isFixed ? 'w-full h-full' : 'inline-block'}`}
            style={{
              ...getBgStyle(),
              padding: paddingPx,
              minWidth: 200,
              minHeight: 150,
            }}
          >
            {dims.isFixed ? (
              /* Fixed aspect ratio → fill padded area, center image */
              <div
                className="relative w-full h-full flex items-center justify-center"
                style={getPositionStyle()}
              >
                {store.screenshot && renderScreenshot({ maxWidth: '100%', maxHeight: '100%' })}
              </div>
            ) : (
              /* Auto → canvas hugs the image, padding even on all 4 sides */
              <div style={{ ...getPositionStyle(), lineHeight: 0 }}>
                {store.screenshot && renderScreenshot({ maxWidth: maxAutoW, maxHeight: maxAutoH })}
              </div>
            )}

            {/* Drawing overlay — captured in export */}
            <AnnotationLayer zoom={store.zoom} />
          </div>
        </div>
      </div>

      {/* Bottom floating action bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-full px-5 py-2 border border-[#c7c4d8] shadow-lg flex items-center gap-3">
        {/* New button */}
        <button
          onClick={handleNewScreenshot}
          className="flex items-center gap-1.5 text-sm text-[#464555] hover:text-[#3525cd] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          New
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-[#c7c4d8]" />

        {/* Zoom controls */}
        <button
          onClick={() => store.setZoom(store.zoom - 10)}
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#eaedff] text-[#464555] transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <span className="text-xs font-semibold text-[#131b2e] min-w-[40px] text-center">
          {store.zoom}%
        </span>
        <button
          onClick={() => store.setZoom(store.zoom + 10)}
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#eaedff] text-[#464555] transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-[#c7c4d8]" />

        {/* Copy button */}
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-sm text-[#464555] hover:text-[#3525cd] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          Copy
        </button>

        {/* Save PNG button */}
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 bg-[#3525cd] text-white rounded-full px-5 py-1.5 text-sm font-semibold hover:bg-[#2a1fb5] transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Save PNG
        </button>
      </div>
    </div>
  );
};

export default PreviewCanvas;
