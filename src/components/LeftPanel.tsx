import React, { useState } from 'react';
import { useStore, GRADIENT_PRESETS, buildGradient } from '../store';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ValBox: React.FC<{ value: number }> = ({ value }) => (
  <div
    className="flex items-center border border-[#d9def0] rounded-lg bg-white shrink-0"
    style={{ width: 60, height: 30 }}
  >
    <span className="flex-1 text-[12px] font-semibold text-[#111827] pl-2.5 tabular-nums">{value}</span>
    <span className="text-[10px] text-[#8a90a3] font-medium pr-2">px</span>
  </div>
);

const InfoBadge = () => (
  <div className="w-[15px] h-[15px] rounded-full border border-[#aab0c3] flex items-center justify-center shrink-0 select-none">
    <span className="text-[9px] text-[#8a90a3] font-semibold leading-none">i</span>
  </div>
);

const ColorSwatch: React.FC<{ color: string; onChange: (v: string) => void }> = ({ color, onChange }) => (
  <label className="relative cursor-pointer shrink-0" style={{ width: 26, height: 26 }}>
    <span className="absolute inset-0 rounded-md border border-[#d9def0]" style={{ background: color }} />
    <input
      type="color" value={color}
      onChange={(e) => onChange(e.target.value)}
      className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
    />
  </label>
);

const SectionDivider = () => (
  <div className="border-t border-[#eef0f7] -mx-5 my-4" />
);

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-[11px] font-extrabold tracking-[1.2px] text-[#70768c] uppercase mb-3">{children}</p>
);

// ─── Constants ────────────────────────────────────────────────────────────────

const ASPECT_RATIOS = ['Auto', '4:3', '3:2', '16:9', '1:1', 'Custom'] as const;
const ASPECT_VALUES = ['auto', '4:3', '3:2', '16:9', '1:1', 'custom'] as const;
const POSITIONS = [
  { x: -1, y: -1 }, { x: 0, y: -1 }, { x: 1, y: -1 },
  { x: -1, y:  0 }, { x: 0, y:  0 }, { x: 1, y:  0 },
  { x: -1, y:  1 }, { x: 0, y:  1 }, { x: 1, y:  1 },
];

const ACTIVE_GRADIENT = 'linear-gradient(135deg, #5f3df5, #3d2bd6)';
const ACTIVE_SHADOW = '0 6px 14px rgba(79,53,232,0.28)';

// ─── Main ─────────────────────────────────────────────────────────────────────

const LeftPanel: React.FC = () => {
  const store = useStore();
  const [bgTab, setBgTab] = useState<'gradient' | 'solid' | 'image'>(store.background.type);
  const [showProfileInput, setShowProfileInput] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const allPresets = [...GRADIENT_PRESETS, ...store.gradientUserPresets];
  const bg = store.background;

  const handleSaveProfile = () => {
    if (!newProfileName.trim()) return;
    store.saveProfile(newProfileName.trim());
    setNewProfileName('');
    setShowProfileInput(false);
  };

  return (
    <div
      className="flex flex-col h-full bg-white border-r border-[#e3e6f5] overflow-hidden"
      style={{ width: 288, minWidth: 288 }}
    >
      {/* ── Preset bar (fixed) ─────────────────────────────────────────── */}
      <div className="px-5 py-3.5 border-b border-[#eef0f7] shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1">
            <select
              value={store.activeProfile}
              onChange={(e) => store.loadProfile(e.target.value)}
              className="w-full border border-[#d9def0] rounded-lg px-3 text-[13px] bg-white text-[#1f2937] appearance-none outline-none focus:border-[#4f35e8] focus:ring-2 focus:ring-[#4f35e8]/10 cursor-pointer pr-8"
              style={{ height: 38 }}
            >
              <option value="Default">Default</option>
              {store.profiles.map((p) => (
                <option key={p.name} value={p.name}>{p.name}</option>
              ))}
            </select>
            <svg
              className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
              width="14" height="14" viewBox="0 0 24 24"
              fill="none" stroke="#9592ab" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
          <button
            onClick={() => setShowProfileInput((v) => !v)}
            title="Save profile"
            className="flex items-center justify-center rounded-lg border border-[#d9def0] bg-white hover:bg-[#f0f2ff] hover:border-[#4f35e8] transition-all text-[#7b8195] hover:text-[#4f35e8] shrink-0"
            style={{ width: 40, height: 38 }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
          </button>
          <button
            onClick={() => {
              if (store.activeProfile === 'Default') return;
              if (confirm(`Delete profile "${store.activeProfile}"?`)) {
                store.deleteProfile(store.activeProfile);
              }
            }}
            disabled={store.activeProfile === 'Default'}
            title={store.activeProfile === 'Default' ? 'Cannot delete Default' : 'Delete profile'}
            className="flex items-center justify-center rounded-lg border border-[#d9def0] bg-white transition-all shrink-0 disabled:opacity-40 disabled:cursor-not-allowed enabled:hover:bg-[#fff0f0] enabled:hover:border-[#ef4444] text-[#7b8195] enabled:hover:text-[#ef4444]"
            style={{ width: 40, height: 38 }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </button>
        </div>
        {showProfileInput && (
          <div className="flex gap-2 mt-2.5">
            <input
              type="text" value={newProfileName}
              onChange={(e) => setNewProfileName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveProfile()}
              placeholder="Profile name…"
              className="flex-1 border border-[#d9def0] rounded-lg px-3 py-2 text-[13px] text-[#1f2937] placeholder-[#b0adc4] outline-none focus:border-[#4f35e8] bg-white"
              autoFocus
            />
            <button
              onClick={handleSaveProfile}
              className="px-4 py-2 rounded-lg bg-[#4f35e8] hover:bg-[#3d2bd6] text-white text-[12px] font-bold transition-colors shrink-0"
            >
              Save
            </button>
          </div>
        )}
      </div>

      {/* ── Scrollable content ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-4">

        {/* LAYOUT */}
        <SectionTitle>Layout</SectionTitle>

        {/* Aspect ratio chips */}
        <div className="flex flex-wrap gap-2 mb-5">
          {ASPECT_RATIOS.map((label, i) => {
            const val = ASPECT_VALUES[i];
            const active = store.aspectRatio === val;
            return (
              <button
                key={val}
                onClick={() => store.setAspectRatio(val)}
                className={`px-3 py-1.5 text-[12px] font-semibold rounded-lg border transition-all ${
                  active
                    ? 'text-white border-transparent'
                    : 'border-[#d9def0] text-[#26324a] bg-white hover:bg-[#f0f2ff] hover:border-[#b0adc4]'
                }`}
                style={active ? { background: ACTIVE_GRADIENT, boxShadow: ACTIVE_SHADOW } : {}}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Position */}
        <SectionTitle>Position</SectionTitle>
        <div className="grid grid-cols-3 gap-2 mb-5" style={{ width: 'fit-content' }}>
          {POSITIONS.map((pos, i) => {
            const active = store.positionX === pos.x && store.positionY === pos.y;
            return (
              <button
                key={i}
                onClick={() => { store.setPositionX(pos.x); store.setPositionY(pos.y); }}
                className={`w-[34px] h-[34px] rounded-lg flex items-center justify-center transition-all ${
                  active ? 'border-transparent' : 'border border-[#d9def0] bg-white hover:bg-[#f0f2ff]'
                }`}
                style={active ? { background: ACTIVE_GRADIENT, boxShadow: '0 6px 14px rgba(79,53,232,0.26)' } : {}}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-white' : 'bg-[#a1a5b7]'}`} />
              </button>
            );
          })}
        </div>

        {/* Padding */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[12px] font-bold text-[#111827] tracking-wide">PADDING</span>
            <ValBox value={store.padding} />
          </div>
          <input type="range" min={0} max={100} value={store.padding}
            onChange={(e) => store.setPadding(Number(e.target.value))} className="w-full" />
        </div>

        {/* Rounded */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[12px] font-bold text-[#111827] tracking-wide">ROUNDED</span>
            <ValBox value={store.rounded} />
          </div>
          <input type="range" min={0} max={48} value={store.rounded}
            onChange={(e) => store.setRounded(Number(e.target.value))} className="w-full" />
        </div>

        {/* Frame */}
        <div className="mb-1">
          <p className="text-[12px] font-bold text-[#111827] tracking-wide mb-2.5">FRAME</p>
          <div className="relative">
            <select
              value={store.frame}
              onChange={(e) => store.setFrame(e.target.value as typeof store.frame)}
              className="w-full border border-[#d9def0] rounded-lg px-3 text-[13px] bg-white text-[#1f2937] appearance-none outline-none focus:border-[#4f35e8] focus:ring-2 focus:ring-[#4f35e8]/10 cursor-pointer pr-8"
              style={{ height: 38 }}
            >
              <option value="none">No Frame</option>
              <option value="macos">macOS Window</option>
              <option value="windows">Windows Window</option>
              <option value="browser">Browser</option>
            </select>
            <svg
              className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
              width="14" height="14" viewBox="0 0 24 24"
              fill="none" stroke="#9592ab" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>

        <SectionDivider />

        {/* APPEARANCE */}
        <SectionTitle>Appearance</SectionTitle>

        {/* Inset */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-semibold text-[#111827]">Inset</span>
              <InfoBadge />
            </div>
            <div className="flex items-center gap-2">
              <ColorSwatch color={store.insetColor} onChange={store.setInsetColor} />
              <ValBox value={store.inset} />
            </div>
          </div>
          <input type="range" min={0} max={60} value={store.inset}
            onChange={(e) => store.setInset(Number(e.target.value))} className="w-full" />
        </div>

        {/* Border */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-semibold text-[#111827]">Border</span>
              <InfoBadge />
            </div>
            <div className="flex items-center gap-2">
              <ColorSwatch color={store.borderColor} onChange={store.setBorderColor} />
              <ValBox value={store.borderWidth} />
            </div>
          </div>
          <input type="range" min={0} max={20} value={store.borderWidth}
            onChange={(e) => store.setBorderWidth(Number(e.target.value))} className="w-full" />
        </div>

        {/* Shadow */}
        <div className="mb-1">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-semibold text-[#111827]">Shadow</span>
              <InfoBadge />
            </div>
            <div className="flex items-center gap-2">
              <ColorSwatch
                color={store.shadowColor.startsWith('#') ? store.shadowColor : '#000000'}
                onChange={(v) => store.setShadowColor(v)}
              />
              <ValBox value={store.shadowSize} />
            </div>
          </div>
          <input type="range" min={0} max={50} value={store.shadowSize}
            onChange={(e) => store.setShadowSize(Number(e.target.value))} className="w-full" />
        </div>

        <SectionDivider />

        {/* BACKGROUND */}
        <SectionTitle>Background</SectionTitle>

        {/* Segmented tabs — Gradient | Image | Solid */}
        <div className="grid grid-cols-3 border border-[#d9def0] rounded-lg overflow-hidden mb-4">
          {(['gradient', 'image', 'solid'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => { setBgTab(tab); store.setBackground({ type: tab }); }}
              className={`py-2 text-[12px] font-bold text-center transition-all ${
                bgTab === tab
                  ? 'text-[#4f35e8] bg-white'
                  : 'text-[#7c8294] bg-[#fafbff] hover:text-[#464555]'
              }`}
              style={bgTab === tab ? { boxShadow: 'inset 0 -2px 0 #4f35e8' } : {}}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Gradient */}
        {bgTab === 'gradient' && (
          <>
            {/* Preset swatches (built-in + user) */}
            <div className="grid grid-cols-5 gap-2.5">
              {allPresets.map((colors, i) => {
                const active = bg.gradientPreset === i && bg.type === 'gradient';
                return (
                  <button
                    key={i}
                    onClick={() => store.applyGradientPreset(i, colors)}
                    title={i < GRADIENT_PRESETS.length ? `Preset ${i + 1}` : 'My preset'}
                    className="rounded-lg transition-all hover:scale-105 aspect-square"
                    style={{
                      background: buildGradient('linear', 135, colors),
                      outline: active ? '2.5px solid #4f35e8' : '1px solid #e3e6f5',
                      outlineOffset: active ? '2px' : '0',
                    }}
                  />
                );
              })}
            </div>

            {/* Advanced gradient settings */}
            {showAdvanced && (
              <div className="mt-4 flex flex-col gap-4">
                {/* Linear / Radial */}
                <div className="grid grid-cols-2 gap-2">
                  {(['linear', 'radial'] as const).map((gt) => {
                    const on = bg.gradientType === gt;
                    return (
                      <button
                        key={gt}
                        onClick={() => store.setGradientType(gt)}
                        className={`py-2 text-[12px] font-bold rounded-lg border capitalize transition-all ${
                          on ? 'text-white border-transparent' : 'border-[#d9def0] text-[#26324a] bg-white hover:bg-[#f0f2ff]'
                        }`}
                        style={on ? { background: ACTIVE_GRADIENT } : {}}
                      >
                        {gt}
                      </button>
                    );
                  })}
                </div>

                {/* Angle (linear only) */}
                {bg.gradientType === 'linear' && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-semibold text-[#111827]">Angle</span>
                      <ValBox value={bg.gradientAngle} />
                    </div>
                    <input
                      type="range" min={0} max={360} value={bg.gradientAngle}
                      onChange={(e) => store.setGradientAngle(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                )}

                {/* Gradient colors editor */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1 border-t border-[#eef0f7]" />
                    <span className="text-[10px] font-bold tracking-[1px] text-[#70768c] uppercase">Gradient Colors</span>
                    <div className="flex-1 border-t border-[#eef0f7]" />
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {bg.gradientColors.map((color, i) => (
                      <div key={i} className="relative group aspect-square">
                        <label className="relative block w-full h-full cursor-pointer rounded-lg overflow-hidden border border-[#d9def0]">
                          <span className="absolute inset-0" style={{ background: color }} />
                          <input
                            type="color" value={color}
                            onChange={(e) => store.updateGradientColor(i, e.target.value)}
                            className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                          />
                        </label>
                        {bg.gradientColors.length > 2 && (
                          <button
                            onClick={() => store.removeGradientColor(i)}
                            title="Remove color"
                            className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#ef4444] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                          >
                            <svg width="8" height="8" viewBox="0 0 12 12"><line x1="1" y1="1" x2="11" y2="11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><line x1="11" y1="1" x2="1" y2="11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                          </button>
                        )}
                      </div>
                    ))}
                    {/* Add color */}
                    <button
                      onClick={() => store.addGradientColor()}
                      title="Add color"
                      className="aspect-square rounded-lg border-2 border-dashed border-[#d9def0] text-[#9592ab] flex items-center justify-center hover:border-[#4f35e8] hover:text-[#4f35e8] transition-colors"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                    </button>
                  </div>

                  {/* Add to presets */}
                  <button
                    onClick={() => store.addGradientUserPreset()}
                    className="w-full mt-3 py-2 rounded-lg bg-[#f0f2ff] text-[#4f35e8] text-[12px] font-bold hover:bg-[#e6e9ff] transition-colors"
                  >
                    + Add to Presets
                  </button>
                </div>
              </div>
            )}

            {/* Show/Hide advanced toggle */}
            <button
              onClick={() => setShowAdvanced((v) => !v)}
              className="w-full mt-3 text-[12px] font-semibold text-[#7c8294] hover:text-[#4f35e8] transition-colors text-right"
            >
              {showAdvanced ? 'Hide Advance Setting' : 'Show Advance Setting'}
            </button>
          </>
        )}

        {/* Solid color */}
        {bgTab === 'solid' && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-[#f8f7ff] border border-[#eef0f7]">
            <label
              className="relative cursor-pointer rounded-lg overflow-hidden border-2 border-[#d9def0] hover:border-[#4f35e8] transition-colors shrink-0"
              style={{ width: 42, height: 42 }}
            >
              <span className="absolute inset-0" style={{ background: store.background.solidColor }} />
              <input
                type="color" value={store.background.solidColor}
                onChange={(e) => store.setBackground({ type: 'solid', solidColor: e.target.value })}
                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
              />
            </label>
            <div>
              <p className="text-[10px] text-[#70768c] mb-0.5 font-extrabold uppercase tracking-[1px]">Solid Color</p>
              <p className="text-[13px] text-[#111827] font-mono font-bold">{store.background.solidColor.toUpperCase()}</p>
            </div>
          </div>
        )}

        {/* Image upload */}
        {bgTab === 'image' && (
          <label className="flex flex-col items-center justify-center gap-2 py-6 rounded-lg border-2 border-dashed border-[#d9def0] hover:border-[#4f35e8] hover:bg-[#f0f2ff] cursor-pointer transition-all">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9592ab" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span className="text-[12px] text-[#9592ab] font-semibold">Click to upload image</span>
            <input
              type="file" accept="image/*" className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) =>
                  store.setBackground({ type: 'image', imageUrl: ev.target?.result as string });
                reader.readAsDataURL(file);
              }}
            />
          </label>
        )}

        <div className="h-1" />
      </div>

      {/* ── Footer (fixed) ─────────────────────────────────────────────── */}
      <div className="border-t border-[#eef0f7] px-5 py-2.5 flex items-center justify-between shrink-0">
        <button
          onClick={() => store.toggleDarkMode()}
          className={`w-8 h-8 flex items-center justify-center border rounded-lg text-[14px] transition-all leading-none ${
            store.darkMode
              ? 'bg-[#4f35e8] border-[#4f35e8] text-white'
              : 'border-[#d9def0] text-[#747b91] bg-white hover:bg-[#f0f2ff] hover:border-[#4f35e8] hover:text-[#4f35e8]'
          }`}
          title={store.darkMode ? 'Switch to light workspace' : 'Switch to dark workspace'}
        >
          {store.darkMode ? '☀' : '☾'}
        </button>
        <span className="text-[12px] text-[#747b91] font-medium">v1.0.0</span>
        <div className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full bg-[#1dd65f]"
            style={{ boxShadow: '0 0 0 3px rgba(29,214,95,0.14)' }}
          />
          <span className="text-[12px] font-extrabold text-[#13b957] tracking-wide">LIVE</span>
        </div>
      </div>
    </div>
  );
};

export default LeftPanel;
