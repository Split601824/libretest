import React from 'react';
import ReactDOM from 'react-dom/client';
import AppPlayer from './AppPlayer';
import AppStudio from './AppStudio';
import './index.css';

// Change this to 'studio' to test Studio
const mode: 'player' | 'studio' = 'studio';

const App = mode === 'player' ? AppPlayer : AppStudio;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppStudio />
  </React.StrictMode>
);