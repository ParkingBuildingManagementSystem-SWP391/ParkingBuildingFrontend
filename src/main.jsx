import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider, theme } from 'antd';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#4f46e5', // Indigo-600
          colorSuccess: '#10b981', // Emerald-500
          colorBgContainer: '#ffffff', // White cards
          colorBgLayout: '#f5f5f5', // Figma background color
          colorText: '#1e293b', // Slate-800
          colorTextDescription: '#64748b', // Slate-500
          borderRadius: 8,
          fontFamily: 'Inter, sans-serif',
        },
        components: {
          Menu: {
            itemBg: 'transparent',
            itemColor: '#475569', // slate-600
            itemSelectedBg: '#eef2ff', // Soft indigo bg
            itemSelectedColor: '#4f46e5',
          },
          Card: {
            colorBgContainer: '#ffffff',
          },
          Table: {
            colorBgContainer: '#ffffff',
            colorHeaderBg: '#f8fafc',
          }
        }
      }}
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ConfigProvider>
  </React.StrictMode>
);
