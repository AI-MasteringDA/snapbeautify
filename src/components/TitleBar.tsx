import React from 'react';

const TitleBar: React.FC = () => {
  const handleMinimize = () => window.electronAPI.minimizeWindow();
  const handleMaximize = () => window.electronAPI.maximizeWindow();
  const handleClose = () => window.electronAPI.closeWindow();

  return (
    <div
      className="flex items-center justify-between px-3 shrink-0 border-b border-[#c7c4d8] bg-white"
      style={{
        height: 32,
        WebkitAppRegion: 'drag',
      } as React.CSSProperties}
    >
      {/* Left: logo + name */}
      <div
        className="flex items-center gap-2"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#3525cd"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
        <span className="text-sm font-semibold text-[#131b2e] tracking-wide">SnapBeautify</span>
      </div>

      {/* Right: window controls */}
      <div
        className="flex items-center gap-0.5"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
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

export default TitleBar;
