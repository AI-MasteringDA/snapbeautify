import React from 'react';
import { useStore } from '../store';

const TitleBarEditor: React.FC = () => {
  const quoteMode = useStore((s) => s.quoteMode);
  const exitQuoteMode = useStore((s) => s.exitQuoteMode);
  const setScreenshot = useStore((s) => s.setScreenshot);
  const handleMinimize = () => window.electronAPI.minimizeWindow();
  const handleMaximize = () => window.electronAPI.maximizeWindow();
  const handleClose = () => window.electronAPI.closeWindow();
  const handleBack = () => {
    // Quote mode: just exit; screenshot mode: clear screenshot to go back to landing.
    if (quoteMode) exitQuoteMode();
    else useStore.setState({ screenshot: null, annotations: [], drawTool: 'none' });
  };

  return (
    <div
      className="flex items-center justify-between px-3 shrink-0 border-b border-[#c7c4d8] bg-white"
      style={{
        height: 40,
        WebkitAppRegion: 'drag',
      } as React.CSSProperties}
    >
      {/* Left: back + logo + name */}
      <div
        className="flex items-center gap-2"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <button
          onClick={handleBack}
          className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-[#f0f2ff] text-[#464555] text-[12px] font-medium transition-colors"
          title="Back to home"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>
        <div className="w-px h-4 bg-[#e8eaf6]" />
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3525cd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {quoteMode ? (
            <>
              <path d="M3 21v-4l11-11 4 4-11 11H3z" />
              <path d="M14 7l3-3 4 4-3 3" />
            </>
          ) : (
            <>
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </>
          )}
        </svg>
        <span className="text-sm font-semibold text-[#131b2e] tracking-wide">{quoteMode ? 'Quote Studio' : 'SnapBeautify'}</span>
      </div>

      {/* Center: spacer */}
      <div className="flex-1" />

      {/* Right: settings + window controls */}
      <div
        className="flex items-center gap-0.5"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        {/* Settings icon */}
        <button
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#eaedff] transition-colors text-[#464555]"
          title="Settings"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>

        <div className="w-px h-4 bg-[#c7c4d8] mx-1" />

        {/* Minimize */}
        <button
          onClick={handleMinimize}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#eaedff] transition-colors text-[#464555]"
          title="Minimize"
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <rect y="5.5" width="12" height="1" fill="currentColor" />
          </svg>
        </button>

        {/* Maximize */}
        <button
          onClick={handleMaximize}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#eaedff] transition-colors text-[#464555]"
          title="Maximize"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect x="0.75" y="0.75" width="10.5" height="10.5" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </button>

        {/* Close */}
        <button
          onClick={handleClose}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-100 hover:text-red-500 transition-colors text-[#464555]"
          title="Close"
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <line x1="1" y1="1" x2="11" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="11" y1="1" x2="1" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default TitleBarEditor;
