import React from 'react';
import ReactDOM from 'react-dom/client';
import AppPlayer from './AppPlayer';
import { StudioHome } from './StudioHome';
import './index.css';

// Toggle this variable to switch between Player and Studio
const mode: 'player' | 'studio' = 'studio';

const App = mode === 'player' ? AppPlayer : StudioHome;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);