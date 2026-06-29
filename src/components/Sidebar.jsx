import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Logo from './Logo';
import {
  Map, Calendar as CalendarIcon, LayoutDashboard,
  UserPlus, ScanLine, Users, Activity, AlertTriangle,
  BarChart3, Grid3X3, DollarSign, ClipboardList, X, CreditCard
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Sidebar = ({ isMobileOpen = false, onMobileClose }) => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const currentPath = location.pathname;
  const lowerRole = role?.toLowerCase();

  const NavButton = ({ path, icon: Icon, label }) => {
    const isActive = currentPath === path;
    return (
      <button
        onClick={() => {
          navigate(path);
          onMobileClose?.();
        }}
        className={`w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-bold transition-all duration-200 relative ${isActive
            ? 'text-blue-600 bg-blue-50/80 rounded-r-full dark:bg-indigo-500/10 dark:text-indigo-300'
            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-r-full dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
          }`}
      >
        {isActive && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r-md"></div>
        )}
        <Icon size={18} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-blue-600 dark:text-indigo-300' : 'text-slate-400'} />
        {label}
      </button>
    );
  };

  const renderSidebarContent = ({ showCloseButton = false } = {}) => (
    <>
      {/* Brand Logo Header */}
      <div className="h-20 lg:h-24 flex items-center justify-between gap-3 px-5 lg:px-6 border-b border-slate-100 dark:border-slate-800">
        <Link
          to="/"
          onClick={onMobileClose}
          className="min-w-0 flex items-center gap-3 rounded-2xl transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
          aria-label="Về trang chủ"
        >
          <Logo />
        </Link>

        {showCloseButton && (
          <button
            type="button"
            onClick={onMobileClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700"
            aria-label="Đóng menu"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-5 pr-4 lg:py-6">
        {renderTabs()}
      </div>
    </>
  );

  const renderTabs = () => {
    if (!user) {
      return (
        <div className="mb-6">
          <h4 className="px-4 text-[10px] font-extrabold text-slate-400 tracking-wider uppercase mb-2">{t('sidebar.public')}</h4>
          <NavButton path="/parking-map" icon={Map} label={t('sidebar.parkingMap')} />
        </div>
      );
    }

    if (['driver', 'member', 'registered_driver', 'customer'].includes(lowerRole)) {
      return (
        <div className="mb-6">
          <h4 className="px-4 text-[10px] font-extrabold text-slate-400 tracking-wider uppercase mb-2">{t('sidebar.services')}</h4>
          <NavButton path="/parking-map" icon={Map} label={t('sidebar.parkingMap')} />
          <NavButton path="/my-bookings" icon={CalendarIcon} label={t('sidebar.myBookings')} />
        </div>
      );
    }

    if (lowerRole === 'staff') {
      return (
        <div className="mb-6">
          <h4 className="px-4 text-[10px] font-extrabold text-slate-400 tracking-wider uppercase mb-2">{t('sidebar.operations')}</h4>
          <NavButton path="/checkin-checkout" icon={ScanLine} label={t('sidebar.gateControl')} />
          <NavButton path="/parking-map" icon={Map} label={t('sidebar.parkingMap')} />
        </div>
      );
    }

    if (lowerRole === 'manager') {
      return (
        <div className="mb-6">
          <h4 className="px-4 text-[10px] font-extrabold text-slate-400 tracking-wider uppercase mb-2">{t('sidebar.management')}</h4>
          <NavButton path="/dashboard" icon={LayoutDashboard} label={t('sidebar.dashboard')} />
          <NavButton path="/parking-map" icon={Map} label={t('sidebar.parkingMap')} />
          <NavButton path="/live-status" icon={Activity} label={t('sidebar.liveStatus')} />
          <NavButton path="/incidents" icon={AlertTriangle} label={t('sidebar.incidents')} />
          <NavButton path="/analytics" icon={BarChart3} label={t('sidebar.analytics')} />
          <NavButton path="/slot-management" icon={Grid3X3} label={t('sidebar.slotManagement')} />
          <NavButton path="/dashboard/monthly-cards" icon={CreditCard} label={t('sidebar.monthlyCards', { defaultValue: 'Quản lý vé tháng' })} />
          <NavButton path="/pricing" icon={DollarSign} label={t('sidebar.pricing')} />
          <NavButton path="/staff-logs" icon={ClipboardList} label={t('sidebar.staffLogs')} />
        </div>
      );
    }

    if (lowerRole === 'admin') {
      return (
        <>
          <div className="mb-6">
            <h4 className="px-4 text-[10px] font-extrabold text-slate-400 tracking-wider uppercase mb-2">{t('sidebar.administration')}</h4>
            <NavButton path="/accounts" icon={Users} label={t('sidebar.userAccounts')} />
            <NavButton path="/create-account" icon={UserPlus} label={t('sidebar.createAccount')} />
            <NavButton path="/admin/parking-sessions" icon={CalendarIcon} label={t('sidebar.parkingSessions')} />
          </div>

        </>
      );
    }
    return null;
  };

  return (
    <>
      <aside className="hidden lg:flex flex-col w-[260px] h-screen bg-white border-r border-slate-200 sticky top-0 z-40 select-none transition-colors duration-300 dark:bg-slate-900 dark:border-slate-800">
        {renderSidebarContent()}
      </aside>

      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 h-full w-full bg-slate-950/45"
            onClick={onMobileClose}
            aria-label="Đóng menu"
          />
          <aside className="relative flex h-screen w-[min(82vw,320px)] flex-col bg-white shadow-2xl select-none transition-colors duration-300 dark:bg-slate-900 dark:border-slate-800">
            {renderSidebarContent({ showCloseButton: true })}
          </aside>
        </div>
      )}
    </>
  );
};

export default Sidebar;
