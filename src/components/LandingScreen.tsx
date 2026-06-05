import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useStore } from '../store';

type CaptureMode = 'region' | 'window' | 'screen';

const LandingScreen: React.FC = () => {
  const setScreenshot = useStore((s) => s.setScreenshot);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // ── Load image from dataURL ─────────────────────────────────────────────
  const loadDataURL = useCallback(
    (dataURL: string) => {
      setScreenshot(dataURL);
    },
    [setScreenshot],
  );

  // ── File reader helper ──────────────────────────────────────────────────
  const readFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) loadDataURL(e.target.result as string);
      };
      reader.readAsDataURL(file);
    },
    [loadDataURL],
  );

  // ── Paste ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) readFile(file);
          break;
        }
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [readFile]);

  // ── Close dropdown on outside click ────────────────────────────────────
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  // ── Drag & Drop ─────────────────────────────────────────────────────────
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const onDragLeave = () => setIsDragOver(false);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) readFile(file);
  };

  // ── Capture actions ─────────────────────────────────────────────────────
  const capture = async (mode: CaptureMode) => {
    setShowDropdown(false);
    if (mode === 'region') await window.electronAPI.captureRegion();
    else if (mode === 'window') await window.electronAPI.captureWindow();
    else await window.electronAPI.captureScreen();
  };

  const browseFile = async () => {
    const dataURL = await window.electronAPI.browseFile();
    if (dataURL) loadDataURL(dataURL);
  };

  return (
    <div className="flex flex-col h-full bg-[#faf8ff]">
      {/* Drag region placeholder at top */}
      <div className="drag-region shrink-0" style={{ height: 0 }} />

      {/* Centered content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        {/* Heading */}
        <div className="text-center">
          <h1 className="text-[28px] font-bold text-[#131b2e] mb-1">SnapBeautify</h1>
          <p className="text-[13px] text-[#777587]">Beautiful screenshots in seconds</p>
        </div>

        {/* Drop Zone */}
        <div
          ref={dropZoneRef}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`
            flex flex-col items-center justify-center gap-3 cursor-default
            w-[480px] h-[220px] rounded-2xl border-2 border-dashed transition-all
            ${isDragOver
              ? 'border-[#3525cd] bg-[#eaedff]'
              : 'border-[#c7c4d8] bg-[#f0f2ff] hover:border-[#9592ab]'}
          `}
        >
          {/* Upload cloud icon */}
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke={isDragOver ? '#3525cd' : '#9592ab'}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="16 16 12 12 8 16" />
            <line x1="12" y1="12" x2="12" y2="21" />
            <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
          </svg>
          <p className="text-[14px] text-[#464555] font-medium">
            {isDragOver ? 'Drop image here' : 'Drag your screenshot here'}
          </p>
          <p className="text-[12px] text-[#9592ab]">or paste with Ctrl+V</p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Take Screenshot split button */}
          <div className="relative" ref={dropdownRef}>
            <div className="flex rounded-xl overflow-hidden">
              {/* Main button */}
              <button
                onClick={() => capture('region')}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#3525cd] hover:bg-[#2a1fb5] transition-colors text-white text-[13px] font-medium"
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
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                Take Screenshot
              </button>

              {/* Dropdown toggle */}
              <button
                onClick={() => setShowDropdown((v) => !v)}
                className="px-3 bg-[#2a1fb5] hover:bg-[#241ab0] transition-colors border-l border-[#4f46e5] text-white"
              >
                <svg width="12" height="12" viewBox="0 0 12 12">
                  <polyline points="2,4 6,8 10,4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div
                className="absolute top-full mt-1 left-0 w-60 rounded-xl overflow-hidden shadow-lg z-50 border border-[#c7c4d8] bg-white"
              >
                <DropdownItem
                  label="Capture Region"
                  shortcut="Ctrl+Shift+4"
                  icon={
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
                      <rect x="7" y="7" width="10" height="10" rx="1" />
                    </svg>
                  }
                  onClick={() => capture('region')}
                />
                <DropdownItem
                  label="Capture Window"
                  shortcut="Ctrl+Shift+5"
                  icon={
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                      <line x1="8" y1="21" x2="16" y2="21" />
                      <line x1="12" y1="17" x2="12" y2="21" />
                    </svg>
                  }
                  onClick={() => capture('window')}
                />
                <DropdownItem
                  label="Capture Screen"
                  shortcut="Ctrl+Shift+6"
                  icon={
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="M8 20h8" />
                      <path d="M12 16v4" />
                    </svg>
                  }
                  onClick={() => capture('screen')}
                />
              </div>
            )}
          </div>

          {/* Browse File */}
          <button
            onClick={browseFile}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-[#c7c4d8] hover:bg-[#f0f2ff] transition-colors text-[#464555] text-[13px] font-medium"
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
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Browse File
          </button>

          {/* Writing Quotes */}
          <button
            onClick={() => useStore.getState().enterQuoteMode()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-[#c7c4d8] hover:bg-[#f0f2ff] transition-colors text-[#464555] text-[13px] font-medium"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21v-4l11-11 4 4-11 11H3z" />
              <path d="M14 7l3-3 4 4-3 3" />
            </svg>
            Writing Quotes
          </button>
        </div>

        {/* Hint */}
        <p className="text-[11px] text-[#9592ab]">
          Supports PNG, JPG, WEBP · Paste with Ctrl+V
        </p>
      </div>
    </div>
  );
};

interface DropdownItemProps {
  label: string;
  shortcut: string;
  icon: React.ReactNode;
  onClick: () => void;
}

const DropdownItem: React.FC<DropdownItemProps> = ({ label, shortcut, icon, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#f0f2ff] transition-colors text-left"
  >
    <span className="text-[#777587]">{icon}</span>
    <span className="flex-1 text-[#131b2e] text-sm">{label}</span>
    <span className="text-[#9592ab] text-xs">{shortcut}</span>
  </button>
);

export default LandingScreen;
