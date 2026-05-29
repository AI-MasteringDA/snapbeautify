export {};

declare global {
  interface Window {
    electronAPI: {
      captureRegion: () => Promise<null>;
      captureWindow: () => Promise<null>;
      captureScreen: () => Promise<null>;
      saveImage: (dataURL: string) => Promise<boolean>;
      copyToClipboard: (dataURL: string) => Promise<boolean>;
      browseFile: () => Promise<string | null>;
      onScreenshotReady: (cb: (dataURL: string) => void) => void;
      removeScreenshotListener: () => void;
      minimizeWindow: () => void;
      maximizeWindow: () => void;
      closeWindow: () => void;
    };

    overlayAPI: {
      confirmRegion: (bounds: { x: number; y: number; w: number; h: number }) => Promise<null>;
      cancelCapture: () => Promise<null>;
      getScreenshot: () => Promise<string | null>;
    };
  }
}
