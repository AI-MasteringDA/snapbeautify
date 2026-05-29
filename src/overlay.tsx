import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import OverlayApp from './components/OverlayApp';

ReactDOM.createRoot(document.getElementById('overlay-root')!).render(
  <React.StrictMode>
    <OverlayApp />
  </React.StrictMode>,
);
