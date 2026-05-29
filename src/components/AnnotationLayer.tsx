import React, { useRef, useState } from 'react';
import { useStore, Annotation } from '../store';

const uid = () => Math.random().toString(36).slice(2, 9);

interface Props {
  zoom: number;
}

interface MoveStart { sx: number; sy: number; ox: number; oy: number; }
interface Editing { x: number; y: number; value: string; }

const AnnotationLayer: React.FC<Props> = ({ zoom }) => {
  const store = useStore();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<Annotation | null>(null);
  const [moveStart, setMoveStart] = useState<MoveStart | null>(null);
  const [editing, setEditing] = useState<Editing | null>(null);
  const scale = zoom / 100;

  const tool = store.drawTool;
  const active = tool !== 'none';

  const toLocal = (e: React.PointerEvent) => {
    const rect = wrapRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale,
    };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!active) return;
    if (editing) return; // let the open text input commit first (onBlur)
    e.preventDefault();
    const { x, y } = toLocal(e);
    const color = store.drawColor;

    if (tool === 'move') {
      setMoveStart({ sx: e.clientX, sy: e.clientY, ox: store.offsetX, oy: store.offsetY });
      wrapRef.current!.setPointerCapture(e.pointerId);
      return;
    }

    if (tool === 'text') {
      setEditing({ x, y, value: '' });
      return;
    }

    wrapRef.current!.setPointerCapture(e.pointerId);

    if (tool === 'pen') setDraft({ id: uid(), type: 'pen', points: [x, y], color, width: 3 });
    else if (tool === 'arrow') setDraft({ id: uid(), type: 'arrow', x1: x, y1: y, x2: x, y2: y, color, width: 3 });
    else if (tool === 'rect') setDraft({ id: uid(), type: 'rect', x, y, w: 0, h: 0, color, width: 3 });
    else if (tool === 'ellipse') setDraft({ id: uid(), type: 'ellipse', x, y, w: 0, h: 0, color, width: 3 });
    else if (tool === 'blur') setDraft({ id: uid(), type: 'blur', x, y, w: 0, h: 0, radius: 10 });
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (moveStart) {
      store.setOffset(
        moveStart.ox + (e.clientX - moveStart.sx) / scale,
        moveStart.oy + (e.clientY - moveStart.sy) / scale,
      );
      return;
    }
    if (!draft) return;
    const { x, y } = toLocal(e);
    setDraft((d) => {
      if (!d) return d;
      if (d.type === 'pen') return { ...d, points: [...d.points, x, y] };
      if (d.type === 'arrow') return { ...d, x2: x, y2: y };
      if (d.type === 'rect' || d.type === 'ellipse' || d.type === 'blur') return { ...d, w: x - d.x, h: y - d.y };
      return d;
    });
  };

  const onPointerUp = () => {
    if (moveStart) { setMoveStart(null); return; }
    if (!draft) return;
    const big =
      draft.type === 'pen'
        ? draft.points.length > 4
        : draft.type === 'arrow'
        ? Math.hypot(draft.x2 - draft.x1, draft.y2 - draft.y1) > 6
        : Math.abs((draft as any).w) > 4 && Math.abs((draft as any).h) > 4;
    if (big) store.addAnnotation(draft);
    setDraft(null);
  };

  const commitText = () => {
    if (editing && editing.value.trim()) {
      store.addAnnotation({ id: uid(), type: 'text', x: editing.x, y: editing.y, text: editing.value.trim(), color: store.drawColor, size: 22 });
    }
    setEditing(null);
  };

  // ── Renderers ─────────────────────────────────────────────────────────
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
      case 'arrow': {
        const ang = Math.atan2(a.y2 - a.y1, a.x2 - a.x1);
        const L = 16, spread = 0.5;
        const bx1 = a.x2 - L * Math.cos(ang - spread);
        const by1 = a.y2 - L * Math.sin(ang - spread);
        const bx2 = a.x2 - L * Math.cos(ang + spread);
        const by2 = a.y2 - L * Math.sin(ang + spread);
        // shorten line so it ends at the arrowhead base (no poke-through)
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
      case 'text':
        return (
          <text key={a.id} x={a.x} y={a.y} fill={a.color} fontSize={a.size} fontWeight={700} fontFamily="Inter, system-ui, sans-serif" dominantBaseline="hanging">
            {a.text}
          </text>
        );
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

  const blurs = store.annotations.filter((a) => a.type === 'blur');
  const vectors = store.annotations.filter((a) => a.type !== 'blur');

  const cursor = tool === 'move' ? (moveStart ? 'grabbing' : 'grab') : active ? 'crosshair' : 'default';

  return (
    <div
      ref={wrapRef}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: active ? 'auto' : 'none',
        cursor,
        zIndex: 5,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {/* Blur regions (under vector shapes) */}
      {blurs.map(renderBlur)}
      {draft?.type === 'blur' && renderBlur(draft)}

      {/* Vector shapes */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}>
        {vectors.map(renderVector)}
        {draft && draft.type !== 'blur' && renderVector(draft)}
      </svg>

      {/* Inline text editor */}
      {editing && (
        <input
          autoFocus
          value={editing.value}
          onChange={(e) => setEditing({ ...editing, value: e.target.value })}
          onBlur={commitText}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitText();
            if (e.key === 'Escape') setEditing(null);
          }}
          style={{
            position: 'absolute',
            left: editing.x,
            top: editing.y,
            fontSize: 22,
            fontWeight: 700,
            fontFamily: 'Inter, system-ui, sans-serif',
            color: store.drawColor,
            background: 'rgba(255,255,255,0.85)',
            border: `1px dashed ${store.drawColor}`,
            borderRadius: 4,
            padding: '0 4px',
            outline: 'none',
            minWidth: 40,
          }}
          placeholder="Type…"
        />
      )}
    </div>
  );
};

export default AnnotationLayer;
