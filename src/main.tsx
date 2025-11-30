import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  
  integrations: [
    Sentry.browserTracingIntegration(), 
    Sentry.replayIntegration(),         
  ],

 tracesSampleRate: 1.0, 
  
  replaysOnErrorSampleRate: 1.0, 
  replaysSessionSampleRate: 0.1, 
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)