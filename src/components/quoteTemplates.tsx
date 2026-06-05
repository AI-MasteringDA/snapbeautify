import React from 'react';
import { QuoteState, QuoteTemplateId, QuoteAspect } from '../store';
import quoteBgAbundant from '../assets/quote-bg-abundant.png';
import quoteBgBird from '../assets/quote-bg-bird.png';
import quoteBgBrush from '../assets/quote-bg-brush.png';
import quoteBgLamp from '../assets/quote-bg-lamp.png';
import quoteBgSilk from '../assets/quote-bg-silk.png';

export interface TemplateMeta {
  id: QuoteTemplateId;
  label: string;
  swatch: React.CSSProperties;
  defaultFont: string;
  defaultSize: number;       // baseline at 600px canvas
  defaultColor: string;
  defaultBold: boolean;
  defaultAuthorSize?: number;
}

export const TEMPLATES: TemplateMeta[] = [
  // Top of the list = the user's reference background images.
  { id: 'lamp',            label: 'Lamp',           swatch: { backgroundImage: `url(${quoteBgLamp})`,    backgroundSize: 'cover', color: '#1a1a1a', fontFamily: 'Roboto Slab' },                                       defaultFont: 'Roboto Slab',          defaultSize: 30, defaultColor: '#1a1a1a', defaultBold: false, defaultAuthorSize: 16 },
  { id: 'silk',            label: 'Silk',           swatch: { backgroundImage: `url(${quoteBgSilk})`,    backgroundSize: 'cover', color: '#0b0b0b', fontFamily: 'Inter', fontWeight: 900 },                            defaultFont: 'Inter',                defaultSize: 56, defaultColor: '#0b0b0b', defaultBold: true,  defaultAuthorSize: 16 },
  { id: 'abundant',        label: 'Abundant',       swatch: { backgroundImage: `url(${quoteBgAbundant})`, backgroundSize: 'cover', color: '#fff', fontFamily: 'Inter', fontWeight: 800 },                             defaultFont: 'Inter',                defaultSize: 36, defaultColor: '#ffffff', defaultBold: true,  defaultAuthorSize: 16 },
  { id: 'bird',            label: 'Bird',           swatch: { backgroundImage: `url(${quoteBgBird})`,    backgroundSize: 'cover', color: '#0f2b54', fontFamily: 'Architects Daughter' },                              defaultFont: 'Architects Daughter',  defaultSize: 36, defaultColor: '#0f2b54', defaultBold: false, defaultAuthorSize: 18 },
  { id: 'brush',           label: 'Brush',          swatch: { backgroundImage: `url(${quoteBgBrush})`,   backgroundSize: 'cover', color: '#1a1a1a', fontFamily: 'Caveat' },                                            defaultFont: 'Caveat',               defaultSize: 50, defaultColor: '#1a1a1a', defaultBold: false, defaultAuthorSize: 22 },
  { id: 'bold-white',      label: 'Bold White',     swatch: { background: '#fff', color: '#000', fontFamily: 'Inter', fontWeight: 900 },                                                                              defaultFont: 'Inter',                defaultSize: 56, defaultColor: '#0b0b0b', defaultBold: true,  defaultAuthorSize: 18 },
  { id: 'serif-gray',      label: 'Serif Gray',     swatch: { background: '#6b7280', color: '#fff', fontFamily: 'Playfair Display' },                                                                                 defaultFont: 'Playfair Display',     defaultSize: 36, defaultColor: '#ffffff', defaultBold: false, defaultAuthorSize: 14 },
  { id: 'cream-highlight', label: 'Cream Highlight',swatch: { background: '#fdf6e3', color: '#111', fontFamily: 'Roboto Slab', fontWeight: 700 },                                                                     defaultFont: 'Roboto Slab',          defaultSize: 44, defaultColor: '#111111', defaultBold: true,  defaultAuthorSize: 16 },
  { id: 'dark-mixed',      label: 'Dark Editorial', swatch: { background: '#000', color: '#fff', fontFamily: 'Playfair Display', fontStyle: 'italic' },                                                               defaultFont: 'Playfair Display',     defaultSize: 46, defaultColor: '#ffffff', defaultBold: false, defaultAuthorSize: 22 },
  { id: 'tweet-card',      label: 'Tweet Card',     swatch: { background: '#374151', color: '#fff', fontFamily: 'Inter' },                                                                                            defaultFont: 'Inter',                defaultSize: 28, defaultColor: '#e5e7eb', defaultBold: false, defaultAuthorSize: 18 },
  { id: 'gradient-white',  label: 'Gradient',       swatch: { background: 'linear-gradient(135deg,#FF512F,#DD2476)', color: '#fff', fontWeight: 700 },                                                                defaultFont: 'Inter',                defaultSize: 42, defaultColor: '#ffffff', defaultBold: true,  defaultAuthorSize: 18 },
  { id: 'marker-caps',     label: 'Marker Caps',    swatch: { background: '#fff', color: '#000', fontFamily: 'Permanent Marker' },                                                                                    defaultFont: 'Permanent Marker',     defaultSize: 56, defaultColor: '#0b0b0b', defaultBold: false, defaultAuthorSize: 22 },
];

export const ASPECT_RATIOS: { id: QuoteAspect; label: string; w: number; h: number }[] = [
  { id: '1:1',  label: '1:1 Square',   w: 600, h: 600 },
  { id: '4:5',  label: '4:5 Portrait', w: 480, h: 600 },
  { id: '16:9', label: '16:9 Wide',    w: 600, h: 337 },
  { id: '9:16', label: '9:16 Story',   w: 337, h: 600 },
];

export const getMeta = (id: QuoteTemplateId): TemplateMeta =>
  TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];

const useEff = (q: QuoteState, m: TemplateMeta, canvasW: number) => {
  const scaleFactor = canvasW / 600;
  return {
    font: q.font ?? m.defaultFont,
    size: (q.fontSize ?? m.defaultSize) * scaleFactor,
    color: q.textColor ?? m.defaultColor,
    bold: q.textBold ?? m.defaultBold,
    authorSize: (q.authorSize ?? m.defaultAuthorSize ?? 16) * scaleFactor,
    offsetX: q.textOffsetX ?? 0,
    offsetY: q.textOffsetY ?? 0,
  };
};

// CSS for the offset transform on the text container — used by every template.
const offsetTransform = (eff: { offsetX: number; offsetY: number }) =>
  `translate(${eff.offsetX}%, ${eff.offsetY}%)`;

// Font stack used directly on text elements so the user's font override is
// always applied (browsers can be inconsistent inheriting from parent).
const fontStack = (font: string, fallback: string = 'sans-serif') =>
  `"${font}", ${fallback}`;

const highlightedText = (text: string, words: string, fg: string, hl: string) => {
  if (!words.trim()) return text;
  const targets = words.trim().split(/\s+/).map((w) => w.toLowerCase());
  const tokens = text.split(/(\s+)/);
  return (
    <>
      {tokens.map((tok, i) => {
        const isHL = targets.includes(tok.toLowerCase().replace(/[.,!?'"]/g, ''));
        return isHL ? (
          <span key={i} style={{ background: hl, padding: '0 6px', borderRadius: 4, color: fg }}>{tok}</span>
        ) : (
          <span key={i}>{tok}</span>
        );
      })}
    </>
  );
};

// ─── Template renderers ──────────────────────────────────────────────────────

interface Props { quote: QuoteState; meta: TemplateMeta; width: number; height: number; }

// 0. LAMP — desk lamp on dark wall. Quote sits inside the warm-lit spot.
const Lamp: React.FC<Props> = ({ quote, meta, width, height }) => {
  const s = useEff(quote, meta, width);
  return (
    <div style={{ position: 'relative', width, height, backgroundImage: `url(${quoteBgLamp})`, backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat', overflow: 'hidden', pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', left: '22%', right: '12%', top: '36%', bottom: '14%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: s.color, textAlign: 'center', transform: offsetTransform(s) }}>
        <p style={{ fontFamily: fontStack(s.font, "'Roboto Slab', serif"), fontSize: s.size, fontWeight: s.bold ? 700 : 400, lineHeight: 1.3, margin: 0, whiteSpace: 'pre-wrap' }}>{quote.text}</p>
        {quote.author && (
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: s.authorSize, marginTop: width * 0.02, opacity: 0.75 }}>— {quote.author}</p>
        )}
      </div>
    </div>
  );
};

// 0b. SILK — white satin folds. Bold black sans-serif headline center-left.
const Silk: React.FC<Props> = ({ quote, meta, width, height }) => {
  const s = useEff(quote, meta, width);
  return (
    <div style={{ position: 'relative', width, height, backgroundImage: `url(${quoteBgSilk})`, backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat', overflow: 'hidden', pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', inset: '15%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: s.color, textAlign: 'center', transform: offsetTransform(s) }}>
        <p style={{ fontFamily: fontStack(s.font), fontSize: s.size, fontWeight: s.bold ? 900 : 500, lineHeight: 1.05, letterSpacing: '-0.04em', margin: 0, whiteSpace: 'pre-wrap' }}>{quote.text}</p>
        {quote.author && (
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: s.authorSize, marginTop: width * 0.025, fontWeight: 500, color: '#444' }}>— {quote.author}</p>
        )}
      </div>
    </div>
  );
};

// 1. ABUNDANT — torn-paper PNG. No brand header per request. Quote in blue band,
// supports highlighted words (yellow band) like the original reference.
const Abundant: React.FC<Props> = ({ quote, meta, width, height }) => {
  const s = useEff(quote, meta, width);
  const yellow = '#fcc500';
  return (
    <div style={{ position: 'relative', width, height, backgroundImage: `url(${quoteBgAbundant})`, backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat', overflow: 'hidden', pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', top: '28%', left: '8%', right: '8%', bottom: '22%', display: 'flex', flexDirection: 'column', justifyContent: 'center', transform: offsetTransform(s) }}>
        <div style={{ color: yellow, fontFamily: 'Playfair Display, serif', fontSize: width * 0.14, fontWeight: 700, lineHeight: 0.5, marginBottom: width * 0.02 }}>"</div>
        <p style={{ color: s.color, fontFamily: fontStack(s.font, 'Inter, sans-serif'), fontSize: s.size, fontWeight: s.bold ? 800 : 500, lineHeight: 1.2, letterSpacing: '0.02em', textTransform: 'uppercase', margin: 0, whiteSpace: 'pre-wrap' }}>
          "{highlightedText(quote.text, quote.highlightWords ?? '', s.color, yellow)}"
        </p>
        {quote.author && (
          <p style={{ color: s.color, fontSize: s.authorSize, fontWeight: 700, marginTop: width * 0.03, textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'Inter, sans-serif' }}>
            - {quote.author}
          </p>
        )}
      </div>
    </div>
  );
};

// 2. BIRD — uses the cream + blue-bird PNG. Text in upper-left, away from the bird.
const Bird: React.FC<Props> = ({ quote, meta, width, height }) => {
  const s = useEff(quote, meta, width);
  const hl = '#a7d8f0';
  return (
    <div style={{ position: 'relative', width, height, backgroundImage: `url(${quoteBgBird})`, backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat', overflow: 'hidden', pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', top: '6%', left: '7%', right: '7%', bottom: '50%', color: s.color, fontSize: s.size, lineHeight: 1.4, fontWeight: s.bold ? 700 : 400, whiteSpace: 'pre-wrap', fontFamily: fontStack(s.font, "'Architects Daughter', cursive"), transform: offsetTransform(s) }}>
        {highlightedText(quote.text, quote.highlightWords ?? '', s.color, hl)}
        {quote.author && (
          <p style={{ fontSize: s.authorSize, marginTop: width * 0.04, textAlign: 'right', fontWeight: 700 }}>— {quote.author}</p>
        )}
      </div>
    </div>
  );
};

// 3. BRUSH — cream + watercolor brushstroke PNG. Casual handwritten quote.
const Brush: React.FC<Props> = ({ quote, meta, width, height }) => {
  const s = useEff(quote, meta, width);
  return (
    <div style={{ position: 'relative', width, height, backgroundImage: `url(${quoteBgBrush})`, backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat', overflow: 'hidden', pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', inset: '12%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: s.color, textAlign: 'center', transform: offsetTransform(s) }}>
        <p style={{ fontFamily: fontStack(s.font, 'Caveat, cursive'), fontSize: s.size, fontWeight: s.bold ? 700 : 500, lineHeight: 1.2, margin: 0, whiteSpace: 'pre-wrap' }}>{quote.text}</p>
        {quote.author && (
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: s.authorSize, marginTop: width * 0.04, fontWeight: 600, opacity: 0.7 }}>— {quote.author}</p>
        )}
      </div>
    </div>
  );
};

const BoldWhite: React.FC<Props> = ({ quote, meta, width, height }) => {
  const s = useEff(quote, meta, width);
  return (
    <div style={{ width, height, background: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: width * 0.08 }}>
      <div style={{ transform: offsetTransform(s), color: s.color, lineHeight: 1.1, letterSpacing: '-0.02em', whiteSpace: 'pre-wrap' }}>
        <p style={{ fontFamily: fontStack(s.font), fontSize: s.size, fontWeight: s.bold ? 900 : 400, margin: 0 }}>{highlightedText(quote.text, quote.highlightWords ?? '', s.color, '#fde047')}</p>
        {quote.author && <p style={{ fontFamily: 'Inter, sans-serif', fontSize: s.authorSize, fontWeight: 500, color: '#6b7280', marginTop: 24 }}>— {quote.author}</p>}
      </div>
    </div>
  );
};

const SerifGray: React.FC<Props> = ({ quote, meta, width, height }) => {
  const s = useEff(quote, meta, width);
  return (
    <div style={{ width, height, background: '#6b7280', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: width * 0.1 }}>
      <div style={{ transform: offsetTransform(s), color: s.color, whiteSpace: 'pre-wrap', textAlign: 'center', lineHeight: 1.4 }}>
        <p style={{ fontFamily: fontStack(s.font, 'Georgia, serif'), fontSize: s.size, fontWeight: s.bold ? 700 : 400, margin: 0 }}>"{highlightedText(quote.text, quote.highlightWords ?? '', s.color, '#fde047')}"</p>
        {quote.author && (
          <div style={{ marginTop: 36, background: '#fff', color: '#374151', padding: '8px 24px', borderRadius: 4, fontSize: s.authorSize, fontFamily: 'Inter, sans-serif', fontWeight: 700, letterSpacing: '0.06em', display: 'inline-block' }}>
            {quote.author.toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );
};

const CreamHighlight: React.FC<Props> = ({ quote, meta, width, height }) => {
  const s = useEff(quote, meta, width);
  return (
    <div style={{ width, height, background: '#fdf6e3', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: width * 0.1 }}>
      <div style={{ transform: offsetTransform(s), color: s.color, whiteSpace: 'pre-wrap', textAlign: 'center', lineHeight: 1.4 }}>
        <p style={{ fontFamily: fontStack(s.font, 'Georgia, serif'), fontSize: s.size, fontWeight: s.bold ? 700 : 400, margin: 0 }}>{highlightedText(quote.text, quote.highlightWords ?? '', s.color, '#fde047')}</p>
        {quote.author && <p style={{ fontFamily: 'Inter, sans-serif', fontSize: s.authorSize, marginTop: 28, color: '#6b7280' }}>— {quote.author}</p>}
      </div>
    </div>
  );
};

const DarkMixed: React.FC<Props> = ({ quote, meta, width, height }) => {
  const s = useEff(quote, meta, width);
  return (
    <div style={{ width, height, background: '#0b0b0b', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: width * 0.1 }}>
      <div style={{ transform: offsetTransform(s), color: s.color, whiteSpace: 'pre-wrap', textAlign: 'center', lineHeight: 1.4, fontStyle: 'italic' }}>
        <p style={{ fontFamily: fontStack(s.font, 'Georgia, serif'), fontSize: s.size, fontWeight: s.bold ? 700 : 400, margin: 0 }}>"{highlightedText(quote.text, quote.highlightWords ?? '', s.color, '#ec4899')}"</p>
        {quote.author && <p style={{ fontFamily: 'Dancing Script, cursive', fontSize: s.authorSize, marginTop: 28, color: '#ec4899', fontStyle: 'normal', fontWeight: 700 }}>— {quote.author}</p>}
      </div>
    </div>
  );
};

const TweetCard: React.FC<Props> = ({ quote, meta, width, height }) => {
  const s = useEff(quote, meta, width);
  const av = width * 0.08;
  return (
    <div style={{ width, height, background: '#374151', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: width * 0.08 }}>
      <div style={{ transform: offsetTransform(s), color: s.color, whiteSpace: 'pre-wrap', lineHeight: 1.45 }}>
        {quote.author && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ width: av, height: av, borderRadius: '50%', background: 'linear-gradient(135deg,#8b5cf6,#ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: av * 0.5 }}>{quote.author.charAt(0).toUpperCase()}</div>
            <div>
              <p style={{ margin: 0, color: '#fff', fontWeight: 700, fontSize: s.authorSize * 1.2, fontFamily: 'Inter, sans-serif' }}>{quote.author}</p>
              <p style={{ margin: 0, color: '#9ca3af', fontSize: s.authorSize * 0.9, fontFamily: 'Inter, sans-serif' }}>@{quote.author.replace(/\s/g, '').toLowerCase()}</p>
            </div>
          </div>
        )}
        <p style={{ fontFamily: fontStack(s.font), fontSize: s.size, fontWeight: s.bold ? 700 : 500, margin: 0 }}>{quote.text}</p>
      </div>
    </div>
  );
};

const GradientWhite: React.FC<Props> = ({ quote, meta, width, height }) => {
  const s = useEff(quote, meta, width);
  return (
    <div style={{ width, height, background: 'linear-gradient(135deg,#FF512F 0%,#DD2476 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: width * 0.08 }}>
      <div style={{ transform: offsetTransform(s), color: s.color, whiteSpace: 'pre-wrap', textAlign: 'center', lineHeight: 1.2 }}>
        <p style={{ fontFamily: fontStack(s.font), fontSize: s.size, fontWeight: s.bold ? 800 : 500, margin: 0, textShadow: '0 2px 16px rgba(0,0,0,0.15)' }}>{highlightedText(quote.text, quote.highlightWords ?? '', s.color, '#fde047')}</p>
        {quote.author && <p style={{ fontFamily: 'Inter, sans-serif', fontSize: s.authorSize, marginTop: 28, opacity: 0.9, fontWeight: 500 }}>— {quote.author}</p>}
      </div>
    </div>
  );
};

const MarkerCaps: React.FC<Props> = ({ quote, meta, width, height }) => {
  const s = useEff(quote, meta, width);
  return (
    <div style={{ width, height, background: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: width * 0.1 }}>
      <div style={{ transform: offsetTransform(s), color: s.color, whiteSpace: 'pre-wrap', lineHeight: 1.15, textTransform: 'uppercase' }}>
        <p style={{ fontFamily: fontStack(s.font, "'Permanent Marker', sans-serif"), fontSize: s.size, margin: 0 }}>{highlightedText(quote.text, quote.highlightWords ?? '', s.color, '#fde047')}</p>
        {quote.author && <p style={{ fontFamily: "'Permanent Marker', cursive", fontSize: s.authorSize * 1.4, marginTop: 28, textAlign: 'right' }}>— {quote.author}</p>}
      </div>
    </div>
  );
};

export const renderQuoteTemplate = (props: Props): React.ReactNode => {
  switch (props.meta.id) {
    case 'lamp':            return <Lamp {...props} />;
    case 'silk':            return <Silk {...props} />;
    case 'abundant':        return <Abundant {...props} />;
    case 'bird':            return <Bird {...props} />;
    case 'brush':           return <Brush {...props} />;
    case 'bold-white':      return <BoldWhite {...props} />;
    case 'serif-gray':      return <SerifGray {...props} />;
    case 'cream-highlight': return <CreamHighlight {...props} />;
    case 'dark-mixed':      return <DarkMixed {...props} />;
    case 'tweet-card':      return <TweetCard {...props} />;
    case 'gradient-white':  return <GradientWhite {...props} />;
    case 'marker-caps':     return <MarkerCaps {...props} />;
  }
};
