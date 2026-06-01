import React, { useRef, useState } from 'react';
import { useStore, Annotation } from '../store';

const uid = () => Math.random().toString(36).slice(2, 9);

interface Props { zoom: number; }

interface MoveStart { sx: number; sy: number; ox: number; oy: number; }
interface DragSel { id: string; sx: number; sy: number; orig: Annotation; }
type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';
interface ResizeStart { id: string; handle: ResizeHandle; sx: number; sy: number; orig: { x: number; y: number; w: number; h: number }; }
// (Text-editing state now lives in the store as `editingText` so the
// PreviewCanvas toolbar can mutate size/font/bold live.)

// ─── Geometry helpers ────────────────────────────────────────────────────────
const bbox = (a: Annotation): { x: number; y: number; w: number; h: number } | null => {
  switch (a.type) {
    case 'pen': {
      if (a.points.length < 2) return null;
      let minX = a.points[0], minY = a.points[1], maxX = a.points[0], maxY = a.points[1];
      for (let i = 0; i < a.points.length; i += 2) {
        minX = Math.min(minX, a.points[i]); maxX = Math.max(maxX, a.points[i]);
        minY = Math.min(minY, a.points[i + 1]); maxY = Math.max(maxY, a.points[i + 1]);
      }
      return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
    }
    case 'line':
    case 'arrow':
      return { x: Math.min(a.x1, a.x2), y: Math.min(a.y1, a.y2), w: Math.abs(a.x2 - a.x1), h: Math.abs(a.y2 - a.y1) };
    case 'rect':
    case 'ellipse':
    case 'blur':
    case 'image':
      return { x: a.w < 0 ? a.x + a.w : a.x, y: a.h < 0 ? a.y + a.h : a.y, w: Math.abs(a.w), h: Math.abs(a.h) };
    case 'text': {
      const factor = a.bold ? 0.6 : 0.55;
      const lines = a.text.split('\n');
      const lineH = a.size * 1.2;
      const w = Math.max(...lines.map((l) => l.length)) * a.size * factor;
      return { x: a.x, y: a.y, w: Math.max(40, w), h: lineH * lines.length };
    }
  }
};

const hits = (a: Annotation, x: number, y: number, pad = 6): boolean => {
  const b = bbox(a);
  if (!b) return false;
  return x >= b.x - pad && x <= b.x + b.w + pad && y >= b.y - pad && y <= b.y + b.h + pad;
};

const translate = (a: Annotation, dx: number, dy: number): Annotation => {
  switch (a.type) {
    case 'pen': {
      const pts = a.points.map((v, i) => v + (i % 2 === 0 ? dx : dy));
      return { ...a, points: pts };
    }
    case 'line':
    case 'arrow':
      return { ...a, x1: a.x1 + dx, y1: a.y1 + dy, x2: a.x2 + dx, y2: a.y2 + dy };
    case 'rect':
    case 'ellipse':
    case 'blur':
    case 'image':
    case 'text':
      return { ...a, x: a.x + dx, y: a.y + dy };
  }
};

const HANDLE_CURSORS: Record<ResizeHandle, string> = {
  nw: 'nwse-resize', se: 'nwse-resize',
  ne: 'nesw-resize', sw: 'nesw-resize',
  n: 'ns-resize', s: 'ns-resize',
  e: 'ew-resize', w: 'ew-resize',
};

// ─── Component ───────────────────────────────────────────────────────────────
const AnnotationLayer: React.FC<Props> = ({ zoom }) => {
  const store = useStore();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<Annotation | null>(null);
  const [moveStart, setMoveStart] = useState<MoveStart | null>(null);
  const [dragSel, setDragSel] = useState<DragSel | null>(null);
  const [resizeStart, setResizeStart] = useState<ResizeStart | null>(null);
  const editing = store.editingText;
  const scale = zoom / 100;

  const tool = store.drawTool;
  // Keep the layer interactable in select/move/text modes AND whenever annotations
  // exist so the user can still click them to select/edit.
  const interactable = tool !== 'none' || store.annotations.length > 0;

  const toLocal = (e: React.PointerEvent) => {
    const rect = wrapRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale,
    };
  };

  const startEditExisting = (a: Annotation & { type: 'text' }) => {
    store.beginTextEdit({
      x: a.x, y: a.y, value: a.text,
      font: a.font, size: a.size, bold: a.bold, color: a.color,
      targetId: a.id,
    });
    store.selectAnnotation(null);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (editing) return; // active inline editor handles its own pointer events
    e.preventDefault();
    const { x, y } = toLocal(e);
    const color = store.drawColor;

    // Move tool — drag an annotation if hit, otherwise pan the screenshot
    if (tool === 'move') {
      const hit = [...store.annotations].reverse().find((a) => hits(a, x, y));
      if (hit) {
        store.selectAnnotation(hit.id);
        setDragSel({ id: hit.id, sx: x, sy: y, orig: hit });
        wrapRef.current!.setPointerCapture(e.pointerId);
        return;
      }
      setMoveStart({ sx: e.clientX, sy: e.clientY, ox: store.offsetX, oy: store.offsetY });
      wrapRef.current!.setPointerCapture(e.pointerId);
      return;
    }

    // Select tool
    if (tool === 'none') {
      const hit = [...store.annotations].reverse().find((a) => hits(a, x, y));
      if (hit) {
        store.selectAnnotation(hit.id);
        setDragSel({ id: hit.id, sx: x, sy: y, orig: hit });
        wrapRef.current!.setPointerCapture(e.pointerId);
      } else {
        store.selectAnnotation(null);
      }
      return;
    }

    // Text tool: hit existing text → edit; else create new
    if (tool === 'text') {
      const hit = [...store.annotations].reverse().find(
        (a) => a.type === 'text' && hits(a, x, y),
      ) as (Annotation & { type: 'text' }) | undefined;
      if (hit) {
        startEditExisting(hit);
        return;
      }
      store.beginTextEdit({
        x, y, value: '',
        font: store.textFont, size: store.textSize, bold: store.textBold, color: store.drawColor,
        targetId: null,
      });
      return;
    }

    wrapRef.current!.setPointerCapture(e.pointerId);
    if (tool === 'pen') setDraft({ id: uid(), type: 'pen', points: [x, y], color, width: 3 });
    else if (tool === 'line') setDraft({ id: uid(), type: 'line', x1: x, y1: y, x2: x, y2: y, color, width: 3 });
    else if (tool === 'arrow') setDraft({ id: uid(), type: 'arrow', x1: x, y1: y, x2: x, y2: y, color, width: 3 });
    else if (tool === 'rect') setDraft({ id: uid(), type: 'rect', x, y, w: 0, h: 0, color, width: 3 });
    else if (tool === 'ellipse') setDraft({ id: uid(), type: 'ellipse', x, y, w: 0, h: 0, color, width: 3 });
    else if (tool === 'blur') setDraft({ id: uid(), type: 'blur', x, y, w: 0, h: 0, radius: 10 });
  };

  const onDoubleClick = (e: React.MouseEvent) => {
    if (tool !== 'none' && tool !== 'move') return;
    const rect = wrapRef.current!.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    const hit = [...store.annotations].reverse().find((a) => hits(a, x, y));
    if (hit?.type === 'text') {
      setDragSel(null);
      startEditExisting(hit);
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (resizeStart) {
      const { x, y } = toLocal(e);
      const dx = x - resizeStart.sx;
      const dy = y - resizeStart.sy;
      const o = resizeStart.orig;
      let nx = o.x, ny = o.y, nw = o.w, nh = o.h;
      if (resizeStart.handle.includes('e')) nw = Math.max(20, o.w + dx);
      if (resizeStart.handle.includes('w')) { nw = Math.max(20, o.w - dx); nx = o.x + (o.w - nw); }
      if (resizeStart.handle.includes('s')) nh = Math.max(20, o.h + dy);
      if (resizeStart.handle.includes('n')) { nh = Math.max(20, o.h - dy); ny = o.y + (o.h - nh); }
      store.updateAnnotation(resizeStart.id, { x: nx, y: ny, w: nw, h: nh } as any);
      return;
    }
    if (moveStart) {
      store.setOffset(
        moveStart.ox + (e.clientX - moveStart.sx) / scale,
        moveStart.oy + (e.clientY - moveStart.sy) / scale,
      );
      return;
    }
    if (dragSel) {
      const { x, y } = toLocal(e);
      store.updateAnnotation(dragSel.id, translate(dragSel.orig, x - dragSel.sx, y - dragSel.sy));
      return;
    }
    if (!draft) return;
    const { x, y } = toLocal(e);
    setDraft((d) => {
      if (!d) return d;
      if (d.type === 'pen') return { ...d, points: [...d.points, x, y] };
      if (d.type === 'line' || d.type === 'arrow') return { ...d, x2: x, y2: y };
      if (d.type === 'rect' || d.type === 'ellipse' || d.type === 'blur') return { ...d, w: x - d.x, h: y - d.y };
      return d;
    });
  };

  const onPointerUp = () => {
    if (resizeStart) { setResizeStart(null); return; }
    if (moveStart) { setMoveStart(null); return; }
    if (dragSel) { setDragSel(null); return; }
    if (!draft) return;
    const big =
      draft.type === 'pen'
        ? draft.points.length > 4
        : draft.type === 'line' || draft.type === 'arrow'
        ? Math.hypot(draft.x2 - draft.x1, draft.y2 - draft.y1) > 6
        : Math.abs((draft as any).w) > 4 && Math.abs((draft as any).h) > 4;
    if (big) store.addAnnotation(draft);
    setDraft(null);
  };

  const commitText = () => store.commitTextEdit();

  // ─── Render helpers ──────────────────────────────────────────────────────
  const norm = (a: { x: number; y: number; w: number; h: number }) => ({
    x: a.w < 0 ? a.x + a.w : a.x,
    y: a.h < 0 ? a.y + a.h : a.y,
    w: Math.abs(a.w),
    h: Math.abs(a.h),
  });

  const renderVector = (a: Annotation) => {
    switch (a.type) {
      case 'pen': {
        let d = '';
        for (let i = 0; i < a.points.length; i += 2) {
          d += (i === 0 ? 'M' : 'L') + a.points[i] + ',' + a.points[i + 1] + ' ';
        }
        return <path key={a.id} d={d} fill="none" stroke={a.color} strokeWidth={a.width} strokeLinecap="round" strokeLinejoin="round" />;
      }
      case 'line':
        return <line key={a.id} x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2} stroke={a.color} strokeWidth={a.width} strokeLinecap="round" />;
      case 'arrow': {
        const ang = Math.atan2(a.y2 - a.y1, a.x2 - a.x1);
        const L = 16, spread = 0.5;
        const bx1 = a.x2 - L * Math.cos(ang - spread);
        const by1 = a.y2 - L * Math.sin(ang - spread);
        const bx2 = a.x2 - L * Math.cos(ang + spread);
        const by2 = a.y2 - L * Math.sin(ang + spread);
        const lineEndX = a.x2 - (L * 0.8) * Math.cos(ang);
        const lineEndY = a.y2 - (L * 0.8) * Math.sin(ang);
        return (
          <g key={a.id}>
            <line x1={a.x1} y1={a.y1} x2={lineEndX} y2={lineEndY} stroke={a.color} strokeWidth={a.width} strokeLinecap="round" />
            <polygon points={`${a.x2},${a.y2} ${bx1},${by1} ${bx2},${by2}`} fill={a.color} />
          </g>
        );
      }
      case 'rect': {
        const r = norm(a);
        return <rect key={a.id} x={r.x} y={r.y} width={r.w} height={r.h} fill="none" stroke={a.color} strokeWidth={a.width} rx={4} />;
      }
      case 'ellipse': {
        const r = norm(a);
        return <ellipse key={a.id} cx={r.x + r.w / 2} cy={r.y + r.h / 2} rx={r.w / 2} ry={r.h / 2} fill="none" stroke={a.color} strokeWidth={a.width} />;
      }
      case 'text': {
        const lines = a.text.split('\n');
        const lineH = a.size * 1.2;
        return (
          <text key={a.id} x={a.x} y={a.y} fill={a.color} fontSize={a.size} fontWeight={a.bold ? 700 : 400} fontFamily={`${a.font || 'Inter'}, system-ui, sans-serif`} dominantBaseline="hanging">
            {lines.map((ln, i) => (
              <tspan key={i} x={a.x} dy={i === 0 ? 0 : lineH}>{ln || ' '}</tspan>
            ))}
          </text>
        );
      }
      case 'image': {
        const r = norm(a);
        return (
          <image
            key={a.id}
            href={a.src}
            xlinkHref={a.src as any}
            x={r.x} y={r.y} width={r.w} height={r.h}
            preserveAspectRatio="xMidYMid meet"
          />
        );
      }
      default:
        return null;
    }
  };

  const renderBlur = (a: Annotation) => {
    if (a.type !== 'blur') return null;
    const r = norm(a);
    return (
      <div
        key={a.id}
        style={{
          position: 'absolute',
          left: r.x, top: r.y, width: r.w, height: r.h,
          backdropFilter: `blur(${a.radius}px)`,
          WebkitBackdropFilter: `blur(${a.radius}px)`,
          background: 'rgba(255,255,255,0.02)',
          borderRadius: 4,
          pointerEvents: 'none',
        } as React.CSSProperties}
      />
    );
  };

  const renderSelectionBox = () => {
    if (!store.selectedAnnotationId) return null;
    const sel = store.annotations.find((a) => a.id === store.selectedAnnotationId);
    if (!sel) return null;
    const b = bbox(sel);
    if (!b) return null;
    const pad = 6;
    return (
      <rect
        x={b.x - pad} y={b.y - pad} width={b.w + pad * 2} height={b.h + pad * 2}
        fill="none" stroke="#4f35e8" strokeWidth={1.5} strokeDasharray="4 3" rx={4}
      />
    );
  };

  // Resize handles for selected image / rect / ellipse / blur (anything with w,h)
  const renderResizeHandles = () => {
    if (!store.selectedAnnotationId) return null;
    const sel = store.annotations.find((a) => a.id === store.selectedAnnotationId);
    if (!sel) return null;
    if (sel.type !== 'image' && sel.type !== 'rect' && sel.type !== 'ellipse' && sel.type !== 'blur') return null;
    const b = norm(sel as any);

    const handles: { id: ResizeHandle; x: number; y: number }[] = [
      { id: 'nw', x: b.x, y: b.y },
      { id: 'n', x: b.x + b.w / 2, y: b.y },
      { id: 'ne', x: b.x + b.w, y: b.y },
      { id: 'e', x: b.x + b.w, y: b.y + b.h / 2 },
      { id: 'se', x: b.x + b.w, y: b.y + b.h },
      { id: 's', x: b.x + b.w / 2, y: b.y + b.h },
      { id: 'sw', x: b.x, y: b.y + b.h },
      { id: 'w', x: b.x, y: b.y + b.h / 2 },
    ];

    return handles.map((h) => (
      <div
        key={h.id}
        onPointerDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
          wrapRef.current!.setPointerCapture(e.pointerId);
          setResizeStart({
            id: sel.id, handle: h.id,
            sx: h.x, sy: h.y,
            orig: { x: b.x, y: b.y, w: b.w, h: b.h },
          });
        }}
        style={{
          position: 'absolute',
          left: h.x - 5, top: h.y - 5,
          width: 10, height: 10,
          background: '#4f35e8',
          border: '1.5px solid white',
          borderRadius: 2,
          cursor: HANDLE_CURSORS[h.id],
          zIndex: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
        }}
      />
    ));
  };

  const blurs = store.annotations.filter((a) => a.type === 'blur');
  // Hide the text being edited so the input visually replaces it
  const vectors = store.annotations.filter(
    (a) => a.type !== 'blur' && !(editing?.targetId && a.id === editing.targetId),
  );

  const cursor =
    tool === 'move'
      ? (dragSel ? 'grabbing' : moveStart ? 'grabbing' : 'grab')
      : tool === 'none'
      ? (dragSel ? 'grabbing' : 'default')
      : 'crosshair';

  return (
    <div
      ref={wrapRef}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: interactable ? 'auto' : 'none',
        cursor,
        zIndex: 5,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onDoubleClick={onDoubleClick}
    >
      {blurs.map(renderBlur)}
      {draft?.type === 'blur' && renderBlur(draft)}

      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}>
        {vectors.map(renderVector)}
        {draft && draft.type !== 'blur' && renderVector(draft)}
        {renderSelectionBox()}
      </svg>

      {renderResizeHandles()}

      {editing && (
        <textarea
          autoFocus
          value={editing.value}
          onChange={(e) => store.updateTextEdit({ value: e.target.value })}
          onBlur={commitText}
          onKeyDown={(e) => {
            // Enter (no Shift) commits; Shift+Enter adds newline
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              commitText();
            } else if (e.key === 'Escape') {
              store.cancelTextEdit();
            }
          }}
          rows={1}
          style={{
            position: 'absolute',
            left: editing.x - 4,
            top: editing.y - 4,
            fontSize: editing.size,
            fontWeight: editing.bold ? 700 : 400,
            fontFamily: `${editing.font}, system-ui, sans-serif`,
            color: editing.color,
            background: 'rgba(255,255,255,0.94)',
            border: `1px dashed ${editing.color}`,
            borderRadius: 4,
            padding: '2px 6px',
            outline: 'none',
            minWidth: 80,
            minHeight: editing.size * 1.3,
            resize: 'none',
            overflow: 'hidden',
            lineHeight: 1.2,
            zIndex: 11,
            whiteSpace: 'pre',
            // Stretch width with content
            width: `${Math.max(80, editing.value.split('\n').reduce((m, l) => Math.max(m, l.length), 1) * editing.size * (editing.bold ? 0.62 : 0.57) + 30)}px`,
            height: `${(editing.value.split('\n').length) * editing.size * 1.25 + 8}px`,
          }}
          placeholder="Type…"
        />
      )}
    </div>
  );
};

export default AnnotationLayer;
