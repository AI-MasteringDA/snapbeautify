import React, { useEffect } from 'react';
import { useStore } from './store';
import TitleBar from './components/TitleBar';
import LandingScreen from './components/LandingScreen';
import EditorScreen from './components/EditorScreen';

const App: React.FC = () => {
  const screenshot = useStore((s) => s.screenshot);
  const setScreenshot = useStore((s) => s.setScreenshot);

  useEffect(() => {
    // Listen for screenshots from main process (global shortcut / tray)
    window.electronAPI.onScreenshotReady((dataURL) => {
      setScreenshot(dataURL);
    });

    return () => {
      window.electronAPI.removeScreenshotListener();
    };
  }, [setScreenshot]);

  return (
    <div className="flex flex-col h-screen bg-[#faf8ff] text-[#131b2e] select-none">
      {screenshot ? (
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
