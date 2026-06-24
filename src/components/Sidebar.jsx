import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Map, Calendar as CalendarIcon, LayoutDashboard,
  UserPlus, ScanLine, Users, Activity, AlertTriangle,
  BarChart3, Grid3X3, DollarSign, ClipboardList
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Sidebar = () => {
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
        onClick={() => navigate(path)}
        className={`w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-bold transition-all duration-200 relative ${isActive
            ? 'text-blue-600 bg-blue-50/80 rounded-r-full'
            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-r-full'
          }`}
      >
        {isActive && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r-md"></div>
        )}
        <Icon size={18} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
        {label}
      </button>
    );
  };

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
    <aside className="hidden md:flex flex-col w-[260px] h-screen bg-white border-r border-slate-200 sticky top-0 z-40 select-none">

      {/* Brand Logo Header */}
      <div className="h-24 flex items-center px-6 border-b border-slate-100">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate(user ? (lowerRole === 'admin' ? '/accounts' : '/dashboard') : '/parking-map')}
        >
          {/* Square Blue Logo with White P */}
          <div className="w-10 h-10 rounded-[10px] bg-[#4B6BFB] flex items-center justify-center text-white font-extrabold text-xl shadow-[0_4px_10px_rgba(75,107,251,0.3)]">
            P
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-[15px] tracking-tight text-slate-900 leading-tight uppercase">
              {t('sidebar.systemName')}
            </span>
            <span className="text-[11px] font-extrabold tracking-tight text-slate-500 leading-tight uppercase">
              {t('sidebar.systemDesc')}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-6 pr-4 overflow-y-auto">
        {renderTabs()}
      </div>
    </aside>
  );
};

export default Sidebar;
