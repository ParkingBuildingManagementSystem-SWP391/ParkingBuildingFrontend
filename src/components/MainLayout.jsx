import React from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import AppFooter from './AppFooter';

const { Content } = Layout;

const MainLayout = () => {
  return (
    <Layout className="min-h-screen bg-[#F5F5F5] flex flex-col">
      {/* Navigation Top Header */}
      <Header />

      {/* Content Body */}
      <Content className="px-4 py-5 md:px-6 md:py-6 flex-grow bg-[#F5F5F5] w-full relative z-0">
        <div className="max-w-[1600px] mx-auto w-full animate-fade-in">
          <Outlet />
        </div>
      </Content>
      <AppFooter />
    </Layout>
  );
};

export default MainLayout;
