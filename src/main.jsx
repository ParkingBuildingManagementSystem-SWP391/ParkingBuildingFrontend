import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider, theme } from 'antd';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import './index.css';
import './i18n';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId="20498691383-rvdt426cc6nm3p08eoaidn7a59t1g4gk.apps.googleusercontent.com"> {/* Bao bọc tại đây */}
      <ConfigProvider
        theme={{
          algorithm: theme.defaultAlgorithm,
          token: {
            colorPrimary: '#4f46e5',
            colorSuccess: '#10b981',
            colorBgContainer: '#ffffff',
            colorBgLayout: '#f5f5f5',
            colorText: '#1e293b',
            colorTextDescription: '#64748b',
            borderRadius: 8,
            fontFamily: 'Inter, sans-serif',
          },
          components: {
            Menu: {
              itemBg: 'transparent',
              itemColor: '#475569',
              itemSelectedBg: '#eef2ff',
              itemSelectedColor: '#4f46e5',
            }
          }
        }}
      >
        <BrowserRouter>
          <ThemeProvider>
            <App />
          </ThemeProvider>
        </BrowserRouter>
      </ConfigProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
