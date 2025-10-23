import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { SDKProvider } from '@telegram-apps/sdk-react';
import App from './App';
import './index.css';

createRoot(document.getElementById("root")!).render(
  <SDKProvider acceptCustomStyles debug>
    <App />
  </SDKProvider>
);