import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// First 3 are the popular FB-style gradients people pick most often.
export const GRADIENT_PRESETS: string[][] = [
  ['#FF512F', '#DD2476'],                       // Sunset (orange→magenta)
  ['#8E2DE2', '#4A00E0'],                       // Royal purple
  ['#FF8008', '#FFC837'],                       // Tropical orange-yellow
  ['#3a1c71', '#d76d77', '#ffaf7b'],
  ['#0f2027', '#203a43', '#2c5364'],
  ['#f7971e', '#ffd200', '#21d4fd'],
  ['#a18cd1', '#fbc2eb'],
  ['#134e5e', '#71b280'],
  ['#43cea2', '#185a9d'],
  ['#ee9ca7', '#ffdde1'],
  ['#c94b4b', '#4b134f'],
  ['#2193b0', '#6dd5ed'],
  ['#cc2b5e', '#753a88'],
];

export interface BackgroundConfig {
  type: 'gradient' | 'solid' | 'image';
  gradientType: 'linear' | 'radial';
  gradientAngle: number;
  gradientColors: string[];
  gradientPreset: number; // index into combined preset list, -1 = custom
  solidColor: string;
  imageUrl: string;
}

// Build a CSS gradient string from the config.
export const buildGradient = (type: 'linear' | 'radial', angle: number, colors: string[]): string => {
  const stops = colors.join(', ');
  return type === 'radial'
    ? `radial-gradient(circle, ${stops})`
    : `linear-gradient(${angle}deg, ${stops})`;
};

export interface Profile {
  name: string;
  settings: Partial<AppState>;
}

export type DrawTool = 'none' | 'move' | 'pen' | 'line' | 'arrow' | 'rect' | 'ellipse' | 'text' | 'blur';

// ─── Quote Studio ───────────────────────────────────────────────────────────
// Each template is a complete visual style: a background, a paired font, default
// text color, alignment, and layout. Selecting a template fills in sensible
// defaults; the user may then override font/size/bold/color via the inline
// toolbar that appears when they click the text in the preview.
export type QuoteTemplateId =
  | 'lamp'            // Dark wall + desk lamp spotlight — "Don't wish for it…" (DEFAULT)
  | 'silk'            // White silk satin — "stay focused" bold sans
  | 'abundant'        // Torn-paper blue with brand header
  | 'bird'            // Cream + hand-drawn + blue highlights + bird
  | 'brush'           // Cream + brushstroke watercolor
  | 'bold-white'
  | 'serif-gray'
  | 'cream-highlight'
  | 'dark-mixed'
  | 'tweet-card'
  | 'gradient-white'
  | 'marker-caps'
  ;

export type QuoteAspect = '1:1' | '4:5' | '16:9' | '9:16';

// All optional fields are user overrides — undefined = use the template's default.
export interface QuoteState {
  text: string;
  author: string;
  template: QuoteTemplateId;
  aspect: QuoteAspect;
  font?: string;
  fontSize?: number;
  textColor?: string;
  textBold?: boolean;
  authorSize?: number; // px override for author line
  highlightWords?: string; // space-separated; used by templates that highlight key words
  textOffsetX?: number; // -100..100, percent of canvas width
  textOffsetY?: number; // -100..100, percent of canvas height
}

export interface TextEditState {
  x: number;
  y: number;
  value: string;
  font: string;
  size: number;
  bold: boolean;
  color: string;
  // null = creating new text; otherwise = editing existing text annotation
  targetId: string | null;
}

export type CtaChannel = 'website' | 'zalo' | 'email' | 'fb' | 'ig' | 'li';

export interface CtaChannelConfig {
  on: boolean;
  value: string;
}

export interface CtaConfig {
  enabled: boolean;
  channels: Record<CtaChannel, CtaChannelConfig>;
  offsetX: number;
  offsetY: number;
  scale: number;
}

export interface LogoConfig {
  enabled: boolean;
  src: string; // empty = use bundled MDA logo
  offsetX: number;
  offsetY: number;
  scale: number;
}

export const CTA_LABELS: Record<CtaChannel, string> = {
  website: 'Website',
  zalo: 'Zalo',
  email: 'Email',
  fb: 'Facebook',
  ig: 'Instagram',
  li: 'LinkedIn',
};

export const TEXT_FONTS = [
  'Inter',
  'Segoe UI',
  'Arial',
  'Georgia',
  'Courier New',
  'Comic Sans MS',
  'Impact',
] as const;

export type Annotation =
  | { id: string; type: 'pen'; points: number[]; color: string; width: number }
  | { id: string; type: 'line'; x1: number; y1: number; x2: number; y2: number; color: string; width: number }
  | { id: string; type: 'arrow'; x1: number; y1: number; x2: number; y2: number; color: string; width: number }
  | { id: string; type: 'rect'; x: number; y: number; w: number; h: number; color: string; width: number }
  | { id: string; type: 'ellipse'; x: number; y: number; w: number; h: number; color: string; width: number }
  | { id: string; type: 'text'; x: number; y: number; text: string; color: string; size: number; font: string; bold: boolean }
  | { id: string; type: 'blur'; x: number; y: number; w: number; h: number; radius: number }
  | { id: string; type: 'image'; x: number; y: number; w: number; h: number; src: string };

export interface AppState {
  screenshot: string | null;
  background: BackgroundConfig;
  padding: number;
  inset: number;
  insetColor: string;
  borderWidth: number;
  borderColor: string;
  shadowSize: number;
  shadowColor: string;
  rounded: number;
  backgroundRounded: number;
  frame: 'none' | 'macos' | 'windows' | 'browser';
  aspectRatio: 'auto' | '4:3' | '3:2' | '16:9' | '1:1' | 'custom';
  customWidth: number;
  customHeight: number;
  positionX: number;
  positionY: number;
  offsetX: number;
  offsetY: number;
  zoom: number;
  profiles: Profile[];
  activeProfile: string;

  drawTool: DrawTool;
  drawColor: string;
  annotations: Annotation[];
  selectedAnnotationId: string | null;
  textFont: string;
  textSize: number;
  textBold: boolean;
  editingText: TextEditState | null;
  darkMode: boolean;
  logo: LogoConfig;
  cta: CtaConfig;
  quoteMode: boolean;
  quote: QuoteState;
  gradientUserPresets: string[][];

  setScreenshot: (dataURL: string) => void;
  setBackground: (bg: Partial<BackgroundConfig>) => void;
  applyGradientPreset: (index: number, colors: string[]) => void;
  setGradientType: (t: 'linear' | 'radial') => void;
  setGradientAngle: (a: number) => void;
  updateGradientColor: (index: number, color: string) => void;
  addGradientColor: () => void;
  removeGradientColor: (index: number) => void;
  addGradientUserPreset: () => void;
  setPadding: (v: number) => void;
  setInset: (v: number) => void;
  setInsetColor: (v: string) => void;
  setBorderWidth: (v: number) => void;
  setBorderColor: (v: string) => void;
  setShadowSize: (v: number) => void;
  setShadowColor: (v: string) => void;
  setRounded: (v: number) => void;
  setBackgroundRounded: (v: number) => void;
  setFrame: (v: AppState['frame']) => void;
  setAspectRatio: (v: AppState['aspectRatio']) => void;
  setZoom: (v: number) => void;
  setPositionX: (v: number) => void;
  setPositionY: (v: number) => void;
  setOffset: (x: number, y: number) => void;
  saveProfile: (name: string) => void;
  loadProfile: (name: string) => void;
  deleteProfile: (name: string) => void;

  setDrawTool: (t: DrawTool) => void;
  setDrawColor: (c: string) => void;
  setTextFont: (f: string) => void;
  setTextSize: (s: number) => void;
  setTextBold: (b: boolean) => void;
  addAnnotation: (a: Annotation) => void;
  updateAnnotation: (id: string, patch: Partial<Annotation>) => void;
  deleteAnnotation: (id: string) => void;
  selectAnnotation: (id: string | null) => void;
  undoAnnotation: () => void;
  clearAnnotations: () => void;
  beginTextEdit: (initial: TextEditState) => void;
  updateTextEdit: (patch: Partial<TextEditState>) => void;
  commitTextEdit: () => void;
  cancelTextEdit: () => void;
  toggleDarkMode: () => void;
  setLogoEnabled: (b: boolean) => void;
  setLogoSrc: (src: string) => void;
  setLogoPosition: (x: number, y: number) => void;
  setLogoScale: (s: number) => void;
  setCtaEnabled: (b: boolean) => void;
  setCtaChannel: (channel: CtaChannel, patch: Partial<CtaChannelConfig>) => void;
  setCtaPosition: (x: number, y: number) => void;
  setCtaScale: (s: number) => void;
  enterQuoteMode: () => void;
  exitQuoteMode: () => void;
  setQuote: (patch: Partial<QuoteState>) => void;
}

const DEFAULT_BACKGROUND: BackgroundConfig = {
  type: 'gradient',
  gradientType: 'linear',
  gradientAngle: 135,
  gradientColors: GRADIENT_PRESETS[0],
  gradientPreset: 0,
  solidColor: '#6366f1',
  imageUrl: '',
};

export const useStore = create<AppState>()(persist((set, get) => ({
  screenshot: null,
  background: DEFAULT_BACKGROUND,
  padding: 40,
  inset: 0,
  insetColor: '#ffffff',
  borderWidth: 0,
  borderColor: '#ffffff',
  shadowSize: 20,
  shadowColor: 'rgba(0,0,0,0.5)',
  rounded: 12,
  backgroundRounded: 0,
  frame: 'none',
  aspectRatio: 'auto',
  customWidth: 1920,
  customHeight: 1080,
  positionX: 0,
  positionY: 0,
  offsetX: 0,
  offsetY: 0,
  zoom: 100,
  profiles: [],
  activeProfile: 'Default',

  drawTool: 'none',
  drawColor: '#ef4444',
  annotations: [],
  selectedAnnotationId: null,
  textFont: 'Inter',
  textSize: 22,
  textBold: true,
  editingText: null,
  darkMode: false,
  gradientUserPresets: [],
  logo: { enabled: false, src: '', offsetX: 0, offsetY: 0, scale: 1 },
  cta: {
    enabled: false,
    channels: {
      website: { on: true, value: 'www.mastering-da.com' },
      zalo: { on: true, value: '0961 48 66 48' },
      email: { on: true, value: 'sales@mastering-da.com' },
      fb: { on: false, value: 'facebook.com/masteringda' },
      ig: { on: false, value: '@masteringda' },
      li: { on: false, value: 'linkedin.com/company/mda' },
    },
    offsetX: 0,
    offsetY: 0,
    scale: 1,
  },
  quoteMode: false,
  quote: {
    text: 'Don\'t wish for it,\nwork for it',
    author: '',
    template: 'lamp',
    aspect: '16:9',
  },

  setScreenshot: (dataURL) => set({ screenshot: dataURL, annotations: [], drawTool: 'none', offsetX: 0, offsetY: 0, selectedAnnotationId: null }),

  setBackground: (bg) =>
    set((state) => ({
      background: { ...state.background, ...bg },
    })),

  applyGradientPreset: (index, colors) =>
    set((state) => ({
      background: { ...state.background, type: 'gradient', gradientColors: [...colors], gradientPreset: index },
    })),

  setGradientType: (t) =>
    set((state) => ({ background: { ...state.background, gradientType: t } })),

  setGradientAngle: (a) =>
    set((state) => ({ background: { ...state.background, gradientAngle: a } })),

  updateGradientColor: (index, color) =>
    set((state) => {
      const gradientColors = state.background.gradientColors.map((c, i) => (i === index ? color : c));
      return { background: { ...state.background, gradientColors, gradientPreset: -1 } };
    }),

  addGradientColor: () =>
    set((state) => {
      const colors = state.background.gradientColors;
      const next = colors.length > 0 ? colors[colors.length - 1] : '#ffffff';
      return { background: { ...state.background, gradientColors: [...colors, next], gradientPreset: -1 } };
    }),

  removeGradientColor: (index) =>
    set((state) => {
      if (state.background.gradientColors.length <= 2) return {} as Partial<AppState>;
      const gradientColors = state.background.gradientColors.filter((_, i) => i !== index);
      return { background: { ...state.background, gradientColors, gradientPreset: -1 } };
    }),

  addGradientUserPreset: () =>
    set((state) => ({
      gradientUserPresets: [...state.gradientUserPresets, [...state.background.gradientColors]],
    })),

  setPadding: (v) => set({ padding: v }),
  setInset: (v) => set({ inset: v }),
  setInsetColor: (v) => set({ insetColor: v }),
  setBorderWidth: (v) => set({ borderWidth: v }),
  setBorderColor: (v) => set({ borderColor: v }),
  setShadowSize: (v) => set({ shadowSize: v }),
  setShadowColor: (v) => set({ shadowColor: v }),
  setRounded: (v) => set({ rounded: v }),
  setBackgroundRounded: (v) => set({ backgroundRounded: v }),
  setFrame: (v) => set({ frame: v }),
  setAspectRatio: (v) => set({ aspectRatio: v }),
  setZoom: (v) => set({ zoom: Math.max(10, Math.min(200, v)) }),
  setPositionX: (v) => set({ positionX: v }),
  setPositionY: (v) => set({ positionY: v }),
  setOffset: (x, y) => set({ offsetX: x, offsetY: y }),

  saveProfile: (name) => {
    const state = get();
    const newProfile: Profile = {
      name,
      settings: {
        background: state.background,
        padding: state.padding,
        inset: state.inset,
        insetColor: state.insetColor,
        borderWidth: state.borderWidth,
        borderColor: state.borderColor,
        shadowSize: state.shadowSize,
        shadowColor: state.shadowColor,
        rounded: state.rounded,
        frame: state.frame,
        aspectRatio: state.aspectRatio,
        positionX: state.positionX,
        positionY: state.positionY,
      },
    };

    set((s) => {
      const existing = s.profiles.findIndex((p) => p.name === name);
      const profiles =
        existing >= 0
          ? s.profiles.map((p, i) => (i === existing ? newProfile : p))
          : [...s.profiles, newProfile];
      return { profiles, activeProfile: name };
    });
  },

  loadProfile: (name) => {
    if (name === 'Default') {
      set({ activeProfile: 'Default' });
      return;
    }
    const profile = get().profiles.find((p) => p.name === name);
    if (!profile) return;
    set((s) => ({ ...s, ...profile.settings, activeProfile: name }));
  },

  deleteProfile: (name) => {
    set((s) => {
      const profiles = s.profiles.filter((p) => p.name !== name);
      const activeProfile = s.activeProfile === name ? 'Default' : s.activeProfile;
      return { profiles, activeProfile };
    });
  },

  setDrawTool: (t) => set({ drawTool: t, selectedAnnotationId: null }),
  setDrawColor: (c) => set({ drawColor: c }),
  setTextFont: (f) => set({ textFont: f }),
  setTextSize: (s) => set({ textSize: Math.max(8, Math.min(120, s)) }),
  setTextBold: (b) => set({ textBold: b }),
  addAnnotation: (a) => set((s) => ({ annotations: [...s.annotations, a] })),
  updateAnnotation: (id, patch) =>
    set((s) => ({
      annotations: s.annotations.map((a) =>
        a.id === id ? ({ ...a, ...patch } as Annotation) : a,
      ),
    })),
  deleteAnnotation: (id) =>
    set((s) => ({
      annotations: s.annotations.filter((a) => a.id !== id),
      selectedAnnotationId: s.selectedAnnotationId === id ? null : s.selectedAnnotationId,
    })),
  selectAnnotation: (id) => set({ selectedAnnotationId: id }),
  undoAnnotation: () => set((s) => ({ annotations: s.annotations.slice(0, -1) })),
  clearAnnotations: () => set({ annotations: [], selectedAnnotationId: null }),

  beginTextEdit: (initial) => set({ editingText: initial }),
  updateTextEdit: (patch) =>
    set((s) => (s.editingText ? { editingText: { ...s.editingText, ...patch } } : ({} as Partial<AppState>))),
  commitTextEdit: () => {
    const e = get().editingText;
    if (!e) return;
    const trimmed = e.value.trim();
    if (e.targetId) {
      const existing = get().annotations.find((a) => a.id === e.targetId);
      if (!existing) { set({ editingText: null }); return; }
      if (trimmed) {
        get().updateAnnotation(e.targetId, {
          text: e.value, font: e.font, size: e.size, bold: e.bold, color: e.color,
        } as any);
      } else {
        get().deleteAnnotation(e.targetId);
      }
    } else if (trimmed) {
      get().addAnnotation({
        id: Math.random().toString(36).slice(2, 9),
        type: 'text',
        x: e.x, y: e.y, text: e.value,
        color: e.color, size: e.size, font: e.font, bold: e.bold,
      });
    }
    set({ editingText: null });
  },
  cancelTextEdit: () => set({ editingText: null }),
  toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),

  setLogoEnabled: (b) => set((s) => ({ logo: { ...s.logo, enabled: b } })),
  setLogoSrc: (src) => set((s) => ({ logo: { ...s.logo, src } })),
  setLogoPosition: (x, y) => set((s) => ({ logo: { ...s.logo, offsetX: x, offsetY: y } })),
  setLogoScale: (scale) => set((s) => ({ logo: { ...s.logo, scale: Math.max(0.3, Math.min(3, scale)) } })),
  setCtaEnabled: (b) => set((s) => ({ cta: { ...s.cta, enabled: b } })),
  setCtaChannel: (channel, patch) =>
    set((s) => ({
      cta: {
        ...s.cta,
        channels: { ...s.cta.channels, [channel]: { ...s.cta.channels[channel], ...patch } },
      },
    })),
  setCtaPosition: (x, y) => set((s) => ({ cta: { ...s.cta, offsetX: x, offsetY: y } })),
  setCtaScale: (scale) => set((s) => ({ cta: { ...s.cta, scale: Math.max(0.3, Math.min(3, scale)) } })),

  enterQuoteMode: () => set({ quoteMode: true }),
  exitQuoteMode: () => set({ quoteMode: false }),
  setQuote: (patch) => set((s) => ({ quote: { ...s.quote, ...patch } })),
}), {
  name: 'snapbeautify-state',
  storage: createJSONStorage(() => localStorage),
  version: 1,
  // Discard persisted state from older schemas (missing required fields).
  migrate: (persisted: any) => {
    if (persisted?.background && !Array.isArray(persisted.background.gradientColors)) {
      persisted.background = DEFAULT_BACKGROUND;
    }
    return persisted;
  },
  // Deep-merge persisted nested objects with initial state so any newly-added
  // field (e.g. logo.scale, cta.scale) keeps its default value when an older
  // persisted state is rehydrated.
  merge: (persisted: any, current: any) => ({
    ...current,
    ...persisted,
    background: { ...current.background, ...(persisted?.background ?? {}) },
    logo: { ...current.logo, ...(persisted?.logo ?? {}) },
    cta: {
      ...current.cta,
      ...(persisted?.cta ?? {}),
      channels: { ...current.cta.channels, ...(persisted?.cta?.channels ?? {}) },
    },
    quote: { ...current.quote, ...(persisted?.quote ?? {}) },
  }),
  // Only persist user settings; skip transient/per-screenshot state.
  partialize: (state) => ({
    background: state.background,
    padding: state.padding,
    inset: state.inset,
    insetColor: state.insetColor,
    borderWidth: state.borderWidth,
    borderColor: state.borderColor,
    shadowSize: state.shadowSize,
    shadowColor: state.shadowColor,
    rounded: state.rounded,
    backgroundRounded: state.backgroundRounded,
    frame: state.frame,
    aspectRatio: state.aspectRatio,
    customWidth: state.customWidth,
    customHeight: state.customHeight,
    positionX: state.positionX,
    positionY: state.positionY,
    zoom: state.zoom,
    profiles: state.profiles,
    activeProfile: state.activeProfile,
    darkMode: state.darkMode,
    gradientUserPresets: state.gradientUserPresets,
    drawColor: state.drawColor,
    textFont: state.textFont,
    textSize: state.textSize,
    textBold: state.textBold,
    logo: state.logo,
    cta: state.cta,
    quote: state.quote,
  }),
}));
