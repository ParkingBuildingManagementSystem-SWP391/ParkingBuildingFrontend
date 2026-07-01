import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Logo from './Logo';
import {
  Map,
  Calendar as CalendarIcon,
  LayoutDashboard,
  UserPlus,
  ScanLine,
  Users,
  Activity,
  AlertTriangle,
  BarChart3,
  Grid3X3,
  DollarSign,
  ClipboardList,
  X,
  CreditCard,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Sidebar = ({
  collapsed = false,
  onToggle,
  isMobileOpen = false,
  onMobileClose
}) => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const currentPath = location.pathname;
  const lowerRole = role?.toLowerCase();

  const SectionTitle = ({ children, isCollapsed }) => (
    isCollapsed
      ? <div className="mx-auto mb-3 h-px w-8 bg-slate-200 dark:bg-slate-700" />
      : <h4 className="mb-2 px-4 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{children}</h4>
  );

  const NavButton = ({ path, icon: Icon, label, isCollapsed = false }) => {
    const isActive = currentPath === path;

    return (
      <button
        type="button"
        onClick={() => {
          navigate(path);
          onMobileClose?.();
        }}
        title={isCollapsed ? label : undefined}
        className={[
          'group relative flex w-full items-center gap-3 py-2.5 text-[13px] font-bold transition-all duration-200',
          isCollapsed ? 'justify-center rounded-2xl px-0' : 'rounded-r-full px-4',
          isActive
            ? 'bg-blue-50/80 text-blue-600 dark:bg-indigo-500/10 dark:text-indigo-300'
            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
        ].join(' ')}
      >
        {isActive && (
          <div className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-md bg-blue-600" />
        )}
        <Icon
          size={18}
          strokeWidth={isActive ? 2.5 : 2}
          className={isActive ? 'text-blue-600 dark:text-indigo-300' : 'text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-100'}
        />
        {!isCollapsed && <span className="min-w-0 truncate">{label}</span>}
      </button>
    );
  };

  const renderTabs = (isCollapsed = false) => {
    if (!user) {
      return (
        <div className="mb-6">
          <SectionTitle isCollapsed={isCollapsed}>{t('sidebar.public')}</SectionTitle>
          <NavButton path="/parking-map" icon={Map} label={t('sidebar.parkingMap')} isCollapsed={isCollapsed} />
        </div>
      );
    }

    if (['driver', 'member', 'registered_driver', 'customer'].includes(lowerRole)) {
      return (
        <div className="mb-6">
          <SectionTitle isCollapsed={isCollapsed}>{t('sidebar.services')}</SectionTitle>
          <NavButton path="/parking-map" icon={Map} label={t('sidebar.parkingMap')} isCollapsed={isCollapsed} />
          <NavButton path="/my-bookings" icon={CalendarIcon} label={t('sidebar.myBookings')} isCollapsed={isCollapsed} />
        </div>
      );
    }

    if (lowerRole === 'staff') {
      return (
        <div className="mb-6">
          <SectionTitle isCollapsed={isCollapsed}>{t('sidebar.operations')}</SectionTitle>
          <NavButton path="/checkin-checkout" icon={ScanLine} label={t('sidebar.gateControl')} isCollapsed={isCollapsed} />
          <NavButton path="/parking-map" icon={Map} label={t('sidebar.parkingMap')} isCollapsed={isCollapsed} />
        </div>
      );
    }

    if (lowerRole === 'manager') {
      return (
        <div className="mb-6">
          <SectionTitle isCollapsed={isCollapsed}>{t('sidebar.management')}</SectionTitle>
          <NavButton path="/dashboard" icon={LayoutDashboard} label={t('sidebar.dashboard')} isCollapsed={isCollapsed} />
          <NavButton path="/parking-map" icon={Map} label={t('sidebar.parkingMap')} isCollapsed={isCollapsed} />
          <NavButton path="/live-status" icon={Activity} label={t('sidebar.liveStatus')} isCollapsed={isCollapsed} />
          <NavButton path="/incidents" icon={AlertTriangle} label={t('sidebar.incidents')} isCollapsed={isCollapsed} />
          <NavButton path="/analytics" icon={BarChart3} label={t('sidebar.analytics')} isCollapsed={isCollapsed} />
          <NavButton path="/slot-management" icon={Grid3X3} label={t('sidebar.slotManagement')} isCollapsed={isCollapsed} />
          <NavButton path="/dashboard/monthly-cards" icon={CreditCard} label={t('sidebar.monthlyCards', { defaultValue: 'Quản lý vé tháng' })} isCollapsed={isCollapsed} />
          <NavButton path="/pricing" icon={DollarSign} label={t('sidebar.pricing')} isCollapsed={isCollapsed} />
          <NavButton path="/staff-logs" icon={ClipboardList} label={t('sidebar.staffLogs')} isCollapsed={isCollapsed} />
        </div>
      );
    }

    if (lowerRole === 'admin') {
      return (
        <div className="mb-6">
          <SectionTitle isCollapsed={isCollapsed}>{t('sidebar.administration')}</SectionTitle>
          <NavButton path="/accounts" icon={Users} label={t('sidebar.userAccounts')} isCollapsed={isCollapsed} />
          <NavButton path="/create-account" icon={UserPlus} label={t('sidebar.createAccount')} isCollapsed={isCollapsed} />
          <NavButton path="/admin/parking-sessions" icon={CalendarIcon} label={t('sidebar.parkingSessions')} isCollapsed={isCollapsed} />
        </div>
      );
    }

    return null;
  };

  const renderSidebarContent = ({ showCloseButton = false, isCollapsed = false } = {}) => (
    <>
      <div className={[
        'flex h-20 shrink-0 items-center border-b border-slate-100 dark:border-slate-800 lg:h-24',
        isCollapsed ? 'justify-center px-3' : 'justify-between gap-3 px-5 lg:px-6'
      ].join(' ')}
      >
        <Link
          to="/"
          onClick={onMobileClose}
          className={[
            'flex min-w-0 items-center rounded-2xl transition-colors hover:bg-slate-50 dark:hover:bg-slate-800',
            isCollapsed ? 'justify-center p-1.5' : 'gap-3'
          ].join(' ')}
          aria-label={t('common.backHome')}
          title={isCollapsed ? t('sidebar.systemName') : undefined}
        >
          <Logo showText={!isCollapsed} />
        </Link>

        {showCloseButton ? (
          <button
            type="button"
            onClick={onMobileClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            aria-label={t('common.closeMenu')}
          >
            <X size={20} />
          </button>
        ) : (
          null
        )}
      </div>

      <nav className={`flex-1 overflow-y-auto py-5 lg:py-6 ${isCollapsed ? 'px-3' : 'pr-4'}`}>
        {renderTabs(isCollapsed)}
      </nav>

      {!showCloseButton && (
        <div className={`hidden shrink-0 border-t border-slate-100 p-3 dark:border-slate-800 lg:block ${isCollapsed ? 'px-3' : 'px-4'}`}>
          <button
            type="button"
            onClick={onToggle}
            className={[
              'flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-sm font-extrabold text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white',
              isCollapsed ? 'px-0' : 'px-4'
            ].join(' ')}
            aria-label={isCollapsed ? t('common.expandSidebar') : t('common.collapseSidebar')}
            title={isCollapsed ? t('common.expandSidebar') : t('common.collapseSidebar')}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            {!isCollapsed && <span className="truncate">{t('common.collapseSidebar')}</span>}
          </button>
        </div>
      )}
    </>
  );

  return (
    <>
      <aside className={[
        'fixed left-0 top-0 z-40 hidden h-screen flex-col select-none border-r border-slate-200 bg-white transition-all duration-300 ease-in-out dark:border-slate-800 dark:bg-slate-900 lg:flex',
        collapsed ? 'w-[88px]' : 'w-[280px]'
      ].join(' ')}
      >
        {renderSidebarContent({ isCollapsed: collapsed })}
      </aside>

      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 h-full w-full bg-slate-950/45"
            onClick={onMobileClose}
            aria-label={t('common.closeMenu')}
          />
          <aside className="relative flex h-screen w-[min(82vw,320px)] flex-col bg-white shadow-2xl transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900">
            {renderSidebarContent({ showCloseButton: true, isCollapsed: false })}
          </aside>
        </div>
      )}
    </>
  );
};

export default Sidebar;
