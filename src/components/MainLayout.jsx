import React from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import Header from './Header';

const { Content } = Layout;

const MainLayout = () => {
  return (
    <Layout className="min-h-screen bg-[#F5F5F5] flex flex-col">
      {/* Navigation Top Header */}
      <Header />

      {/* Content Body */}
      <Content className="p-6 md:p-8 overflow-y-auto max-h-[calc(100vh-64px)] flex-grow bg-[#F5F5F5] w-full">
        <div className="max-w-7xl mx-auto w-full animate-fade-in">
          <Outlet />
        </div>
      </Content>
    </Layout>
  );
};

export default MainLayout;
