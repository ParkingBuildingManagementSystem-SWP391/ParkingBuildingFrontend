import React, { useState } from 'react';
import { CalendarCheck, Map } from 'lucide-react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';
import AppFooter from './AppFooter';

const MainLayout = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { user, role } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const normalizedRole = String(role || user?.role || '').toLowerCase();
  const isGuestLayout = !user || ['guest', 'public'].includes(normalizedRole);
  const isDriverLayout = ['driver', 'registered_driver', 'member', 'customer'].includes(normalizedRole);
  const showSidebar = ['admin', 'manager', 'staff'].includes(normalizedRole);
  const isFullWidthLayout = isGuestLayout || isDriverLayout || !showSidebar;
  const showDriverFab = isDriverLayout && ['/parking-map', '/my-bookings'].includes(location.pathname);
  const isBookingsPage = location.pathname === '/my-bookings';
  const fabTarget = isBookingsPage ? '/parking-map' : '/my-bookings';
  const FabIcon = isBookingsPage ? Map : CalendarCheck;
  const fabLabel = isBookingsPage ? t('driverFab.parkingMap') : t('driverFab.myBookings');

  return (
    <div className="flex min-h-screen w-full bg-background font-sans text-foreground selection:bg-primary/30 transition-colors duration-500">
      
      {/* Fixed Left Sidebar */}
      {showSidebar && (
        <Sidebar
          isMobileOpen={isMobileSidebarOpen}
          onMobileClose={() => setIsMobileSidebarOpen(false)}
        />
      )}
      
      {/* Main Content Area */}
      <div className="relative z-0 flex min-w-0 flex-1 flex-col">
        
        {/* Top Navigation Bar */}
        <Header
          hasSidebar={showSidebar}
          onOpenSidebar={() => setIsMobileSidebarOpen(true)}
        />
        
        {/* Scrollable Page Content */}
        <main className="min-w-0 flex-1 w-full bg-slate-50 transition-colors duration-300 dark:bg-slate-900">
          <div className="min-h-full flex flex-col">
            <div className={`flex-1 w-full ${isFullWidthLayout ? 'px-3 py-3 pb-24 sm:px-4 sm:py-4 sm:pb-24 md:px-5 md:py-5 md:pb-24' : 'px-4 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8'}`}>
              <div className={`${isFullWidthLayout ? 'max-w-none' : 'max-w-[1600px]'} mx-auto w-full animate-fade-in`}>
                <Outlet />
              </div>
            </div>
            <AppFooter />
          </div>
        </main>

        {showDriverFab && (
          <button
            type="button"
            onClick={() => navigate(fabTarget)}
            className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-3 text-sm font-extrabold text-white shadow-xl shadow-indigo-900/20 transition-all hover:-translate-y-0.5 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus:ring-indigo-800 sm:bottom-6 sm:right-6 sm:px-5"
          >
            <FabIcon size={18} />
            <span>{fabLabel}</span>
          </button>
        )}
        
      </div>
    </div>
  );
};

export default MainLayout;
