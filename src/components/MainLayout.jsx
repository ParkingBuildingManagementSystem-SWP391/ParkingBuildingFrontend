import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const MainLayout = () => {
  return (
    <div className="flex h-screen w-full bg-background font-sans text-foreground selection:bg-primary/30 overflow-hidden transition-colors duration-500">
      
      {/* Fixed Left Sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-0">
        
        {/* Top Navigation Bar */}
        <Header />
        
        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto px-6 py-6 md:px-8 md:py-8 w-full">
          <div className="max-w-[1600px] mx-auto w-full animate-fade-in">
            <Outlet />
          </div>
        </main>
        
      </div>
    </div>
  );
};

export default MainLayout;
