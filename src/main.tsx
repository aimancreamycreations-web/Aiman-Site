import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Automated compatibility router for GitHub Pages & custom domains
const pathname = window.location.pathname.toLowerCase();
if (pathname === '/admin' || pathname === '/admin/' || window.location.search.includes('view=admin')) {
  window.location.href = '/admin.html';
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
