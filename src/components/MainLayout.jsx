import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import AppFooter from './AppFooter';

const MainLayout = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-background font-sans text-foreground selection:bg-primary/30 transition-colors duration-500">
      
      {/* Fixed Left Sidebar */}
      <Sidebar
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />
      
      {/* Main Content Area */}
      <div className="relative z-0 flex min-w-0 flex-1 flex-col">
        
        {/* Top Navigation Bar */}
        <Header onOpenSidebar={() => setIsMobileSidebarOpen(true)} />
        
        {/* Scrollable Page Content */}
        <main className="min-w-0 flex-1 w-full bg-slate-50 transition-colors duration-300 dark:bg-slate-900">
          <div className="min-h-full flex flex-col">
            <div className="flex-1 w-full px-4 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8">
              <div className="max-w-[1600px] mx-auto w-full animate-fade-in">
                <Outlet />
              </div>
            </div>
            <AppFooter />
          </div>
        </main>
        
      </div>
    </div>
  );
};

export default MainLayout;
