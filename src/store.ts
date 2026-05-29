import { create } from 'zustand';

export const GRADIENT_PRESETS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  'linear-gradient(135deg, #2d3561 0%, #c05c7e 100%)',
  'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
];

export interface BackgroundConfig {
  type: 'gradient' | 'solid' | 'image';
  gradient: string;
  gradientPreset: number;
  solidColor: string;
  imageUrl: string;
}

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

  setScreenshot: (dataURL: string) => void;
  setBackground: (bg: Partial<BackgroundConfig>) => void;
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
  gradient: GRADIENT_PRESETS[0],
  gradientPreset: 0,
  solidColor: '#6366f1',
  imageUrl: '',
};

export const useStore = create<AppState>((set, get) => ({
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

  setScreenshot: (dataURL) => set({ screenshot: dataURL, annotations: [], drawTool: 'none', offsetX: 0, offsetY: 0 }),

  setBackground: (bg) =>
    set((state) => ({
      background: { ...state.background, ...bg },
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
}));
