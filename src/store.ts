import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Each preset is a list of color stops (Savvy-style vibrant gradients).
export const GRADIENT_PRESETS: string[][] = [
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

export type DrawTool = 'none' | 'move' | 'pen' | 'arrow' | 'rect' | 'ellipse' | 'text' | 'blur';

export type Annotation =
  | { id: string; type: 'pen'; points: number[]; color: string; width: number }
  | { id: string; type: 'arrow'; x1: number; y1: number; x2: number; y2: number; color: string; width: number }
  | { id: string; type: 'rect'; x: number; y: number; w: number; h: number; color: string; width: number }
  | { id: string; type: 'ellipse'; x: number; y: number; w: number; h: number; color: string; width: number }
  | { id: string; type: 'text'; x: number; y: number; text: string; color: string; size: number }
  | { id: string; type: 'blur'; x: number; y: number; w: number; h: number; radius: number };

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
  darkMode: boolean;
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
  addAnnotation: (a: Annotation) => void;
  undoAnnotation: () => void;
  clearAnnotations: () => void;
  toggleDarkMode: () => void;
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
  darkMode: false,
  gradientUserPresets: [],

  setScreenshot: (dataURL) => set({ screenshot: dataURL, annotations: [], drawTool: 'none', offsetX: 0, offsetY: 0 }),

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

  setDrawTool: (t) => set({ drawTool: t }),
  setDrawColor: (c) => set({ drawColor: c }),
  addAnnotation: (a) => set((s) => ({ annotations: [...s.annotations, a] })),
  undoAnnotation: () => set((s) => ({ annotations: s.annotations.slice(0, -1) })),
  clearAnnotations: () => set({ annotations: [] }),
  toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
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
  }),
}));
