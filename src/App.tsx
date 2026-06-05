import React, { useEffect } from 'react';
import { useStore } from './store';
import TitleBar from './components/TitleBar';
import LandingScreen from './components/LandingScreen';
import EditorScreen from './components/EditorScreen';

const App: React.FC = () => {
  const screenshot = useStore((s) => s.screenshot);
  const quoteMode = useStore((s) => s.quoteMode);
  const setScreenshot = useStore((s) => s.setScreenshot);

  useEffect(() => {
    window.electronAPI.onScreenshotReady((dataURL) => {
      setScreenshot(dataURL);
    });
    return () => {
      window.electronAPI.removeScreenshotListener();
    };
  }, [setScreenshot]);

  // Quote mode and screenshot mode both use EditorScreen — same toolbar,
  // annotation layer, Logo/CTA overlays, export — only the canvas content
  // and a few sidebar sections differ.
  const showEditor = quoteMode || !!screenshot;

  return (
    <div className="flex flex-col h-screen bg-[#faf8ff] text-[#131b2e] select-none">
      {showEditor ? (
        <EditorScreen />
      ) : (
        <>
          <TitleBar />
          <div className="flex-1 overflow-hidden">
            <LandingScreen />
          </div>
        </>
      )}
    </div>
  );
};

export default App;
