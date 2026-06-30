import React, { useState } from 'react';
import { CalendarCheck, Map, ScanLine } from 'lucide-react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';
import PageHeader from './PageHeader';
import AppFooter from './AppFooter';
import { formatLongDateVN } from '../utils/dateTime';

const RoleFloatingActionButton = ({ icon: Icon, label, onClick }) => (
  <div className="fixed bottom-5 right-5 z-40 sm:bottom-8 sm:right-8">
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-3 text-sm font-extrabold text-white shadow-xl shadow-indigo-900/25 transition-all hover:scale-[1.02] hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus:ring-indigo-800 sm:px-5"
    >
      <Icon className="h-5 w-5" strokeWidth={2.4} />
      <span>{label}</span>
    </button>
  </div>
);

const MainLayout = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { user, role } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const normalizedRole = String(role || user?.role || '').toLowerCase();
  const isGuestLayout = !user || ['guest', 'public'].includes(normalizedRole);
  const isDriverLayout = ['driver', 'registered_driver', 'member', 'customer'].includes(normalizedRole);
  const isStaffLayout = normalizedRole === 'staff';
  const showSidebar = ['admin', 'manager'].includes(normalizedRole);
  const isFullWidthLayout = isGuestLayout || isDriverLayout || !showSidebar;
  const isParkingMapPage = location.pathname === '/parking-map';
  const isBookingsPage = location.pathname === '/my-bookings';
  const isGateControlPage = location.pathname === '/checkin-checkout';

  const driverFabConfig = isDriverLayout && (isParkingMapPage || isBookingsPage)
    ? {
      target: isBookingsPage ? '/parking-map' : '/my-bookings',
      icon: isBookingsPage ? Map : CalendarCheck,
      label: isBookingsPage ? t('nav.parkingMap') : t('nav.myBookings')
    }
    : null;

  const staffFabConfig = isStaffLayout && (isParkingMapPage || isGateControlPage)
    ? {
      target: isGateControlPage ? '/parking-map' : '/checkin-checkout',
      icon: isGateControlPage ? Map : ScanLine,
      label: isGateControlPage ? t('nav.parkingMap') : t('nav.gateControl')
    }
    : null;

  const fabConfig = driverFabConfig || staffFabConfig;
  const contentMaxWidthClass = isFullWidthLayout ? 'max-w-none' : 'max-w-[1600px]';
  const contentPaddingClass = isFullWidthLayout
    ? 'px-3 sm:px-4 md:px-5'
    : 'px-4 sm:px-6 md:px-8';
  const contentSpacingClass = isFullWidthLayout
    ? 'px-3 py-3 pb-24 sm:px-4 sm:py-4 sm:pb-24 md:px-5 md:py-5 md:pb-24'
    : 'px-4 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8';

  const getPageMeta = () => {
    const path = location.pathname;

    const routeMeta = {
      '/dashboard/monthly-cards': {
        title: normalizedRole === 'manager' ? t('monthlyCard.managerTitle') : t('monthlyCard.title'),
        subtitle: normalizedRole === 'manager'
          ? t('monthlyCard.managerSubtitle')
          : t('monthlyCard.paymentRequestSubtitle')
      },
      '/my-monthly-card': {
        title: t('monthlyCard.title'),
        subtitle: t('monthlyCard.subtitle')
      },
      '/my-bookings': {
        title: t('myBookings.pageTitle'),
        subtitle: t('myBookings.pageSubtitle')
      },
      '/create-account': {
        title: t('createAccount.pageTitle'),
        subtitle: t('createAccount.pageSubtitle')
      },
      '/staff-management': {
        title: t('staff.pageTitle'),
        subtitle: t('staff.pageDesc')
      },
      '/admin/parking-sessions': {
        title: t('parkingSession.pageTitle'),
        subtitle: t('parkingSession.pageDesc')
      },
      '/about': {
        title: '',
        subtitle: ''
      }
    };

    if (path === '/dashboard') {
      return {
        title: t('header.title.dashboard'),
        subtitle: formatLongDateVN()
      };
    }

    if (routeMeta[path]) return routeMeta[path];

    const routeKey = path.replace(/^\/+/, '');
    if (!routeKey) {
      return { title: '', subtitle: '' };
    }

    return {
      title: t(`header.title.${routeKey}`, { defaultValue: t('header.title.default') }),
      subtitle: t(`header.subtitle.${routeKey}`, { defaultValue: t('header.subtitle.default') })
    };
  };

  const pageMeta = getPageMeta();

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
          <PageHeader
            title={pageMeta.title}
            subtitle={pageMeta.subtitle}
            contentClassName={contentMaxWidthClass}
            paddingClassName={contentPaddingClass}
          />
          <div className="min-h-full flex flex-col">
            <div className={`flex-1 w-full ${contentSpacingClass}`}>
              <div className={`${contentMaxWidthClass} mx-auto w-full animate-fade-in`}>
                <Outlet />
              </div>
            </div>
            <AppFooter />
          </div>
        </main>

        {fabConfig && (
          <RoleFloatingActionButton
            icon={fabConfig.icon}
            label={fabConfig.label}
            onClick={() => navigate(fabConfig.target)}
          />
        )}
        
      </div>
    </div>
  );
};

export default MainLayout;
