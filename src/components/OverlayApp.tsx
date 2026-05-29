import React, { useState, useEffect, useCallback } from 'react';

interface DragState {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  isDragging: boolean;
}

const INIT: DragState = { startX: 0, startY: 0, endX: 0, endY: 0, isDragging: false };

const OverlayApp: React.FC = () => {
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [drag, setDrag] = useState<DragState>(INIT);
  const [confirmed, setConfirmed] = useState(false);

  // Load desktop screenshot as background
  useEffect(() => {
    window.overlayAPI.getScreenshot().then((url) => {
      if (url) setScreenshot(url);
    });
  }, []);

  // ESC cancels
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') window.overlayAPI.cancelCapture();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const getRect = useCallback((d: DragState) => ({
    x: Math.min(d.startX, d.endX),
    y: Math.min(d.startY, d.endY),
    w: Math.abs(d.endX - d.startX),
    h: Math.abs(d.endY - d.startY),
  }), []);

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setConfirmed(false);
    setDrag({ startX: e.clientX, startY: e.clientY, endX: e.clientX, endY: e.clientY, isDragging: true });
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!drag.isDragging) return;
    setDrag((d) => ({ ...d, endX: e.clientX, endY: e.clientY }));
  };

  const onMouseUp = useCallback((e: React.MouseEvent) => {
    if (!drag.isDragging) return;
    const final = { ...drag, endX: e.clientX, endY: e.clientY, isDragging: false };
    setDrag(final);
    setConfirmed(true);

    const { x, y, w, h } = getRect(final);
    if (w > 5 && h > 5) {
      const dpr = window.devicePixelRatio || 1;
      window.overlayAPI.confirmRegion({
        x: Math.round(x * dpr),
        y: Math.round(y * dpr),
        w: Math.round(w * dpr),
        h: Math.round(h * dpr),
      });
    } else {
      window.overlayAPI.cancelCapture();
    }
  }, [drag, getRect]);

  const rect = getRect(drag);
  const showSel = (drag.isDragging || confirmed) && rect.w > 2 && rect.h > 2;

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        cursor: 'crosshair', userSelect: 'none',
        overflow: 'hidden', background: '#000',
      }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
    >
      {/* Desktop screenshot as background — shows exact screen state */}
      {screenshot && (
        <img
          src={screenshot}
          alt=""
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
            pointerEvents: 'none', userSelect: 'none',
            draggable: false,
          } as React.CSSProperties}
          draggable={false}
        />
      )}

      {/* Dark overlay — cut-out effect via box-shadow on selection */}
      {!showSel && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', pointerEvents: 'none' }} />
      )}

      {/* Selection area */}
      {showSel && (
        <>
          {/* Top mask */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: rect.y, background: 'rgba(0,0,0,0.45)', pointerEvents: 'none' }} />
          {/* Bottom mask */}
          <div style={{ position: 'absolute', left: 0, right: 0, top: rect.y + rect.h, bottom: 0, background: 'rgba(0,0,0,0.45)', pointerEvents: 'none' }} />
          {/* Left mask */}
          <div style={{ position: 'absolute', left: 0, width: rect.x, top: rect.y, height: rect.h, background: 'rgba(0,0,0,0.45)', pointerEvents: 'none' }} />
          {/* Right mask */}
          <div style={{ position: 'absolute', left: rect.x + rect.w, right: 0, top: rect.y, height: rect.h, background: 'rgba(0,0,0,0.45)', pointerEvents: 'none' }} />

          {/* Selection border */}
          <div style={{
            position: 'absolute',
            left: rect.x, top: rect.y, width: rect.w, height: rect.h,
            border: '2px solid #6366f1',
            boxSizing: 'border-box',
            pointerEvents: 'none',
          }} />

          {/* Corner handles */}
          {([[rect.x-3, rect.y-3],[rect.x+rect.w-5,rect.y-3],[rect.x-3,rect.y+rect.h-5],[rect.x+rect.w-5,rect.y+rect.h-5]] as [number,number][]).map(([l,t],i) => (
            <div key={i} style={{ position:'absolute', left:l, top:t, width:8, height:8, background:'#6366f1', borderRadius:2, pointerEvents:'none' }} />
          ))}

          {/* Size badge */}
          <div style={{
            position: 'absolute',
            left: Math.max(4, rect.x),
            top: Math.max(4, rect.y - 28),
            background: 'rgba(0,0,0,0.8)',
            color: '#fff', fontSize: 11,
            padding: '2px 8px', borderRadius: 4,
            fontFamily: 'monospace', whiteSpace: 'nowrap',
            pointerEvents: 'none',
            backdropFilter: 'blur(4px)',
          }}>
            {Math.round(rect.w)} × {Math.round(rect.h)}
          </div>
        </>
      )}

      {/* Help hint */}
      {!drag.isDragging && !confirmed && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 8, pointerEvents: 'none',
        }}>
          <p style={{ color: 'rgba(255,255,255,0.95)', fontSize: 20, fontWeight: 700, textShadow: '0 2px 8px rgba(0,0,0,0.9)' }}>
            Drag to select a region
          </p>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>
            Press ESC to cancel
          </p>
        </div>
      )}
    </div>
  );
};

export default OverlayApp;
