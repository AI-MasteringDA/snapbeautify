import React from 'react';
import TitleBarEditor from './TitleBarEditor';
import LeftPanel from './LeftPanel';
import PreviewCanvas from './PreviewCanvas';

const EditorScreen: React.FC = () => (
  <div className="flex flex-col h-full bg-[#faf8ff]">
    <TitleBarEditor />
    <div className="flex flex-1 overflow-hidden">
      <LeftPanel />
      <PreviewCanvas />
    </div>
  </div>
);

export default EditorScreen;
