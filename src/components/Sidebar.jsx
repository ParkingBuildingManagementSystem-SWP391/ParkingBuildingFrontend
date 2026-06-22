import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Map, Calendar as CalendarIcon, LayoutDashboard,
  UserPlus, ScanLine, LogOut, Users, ShieldCheck, Settings
} from 'lucide-react';

const Sidebar = () => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogoutClick = () => {
    logout();
    navigate('/login');
  };

  const currentPath = location.pathname;
  const lowerRole = role?.toLowerCase();

  const getInitials = (name) => {
    if (!name) return 'US';
    const cleanName = name.replace(/\s+/g, ' ').trim();
    const parts = cleanName.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const NavButton = ({ path, icon: Icon, label }) => {
    const isActive = currentPath === path;
    return (
      <button
        onClick={() => navigate(path)}
        className={`w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-bold transition-all duration-200 relative ${
          isActive 
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
          <h4 className="px-4 text-[10px] font-extrabold text-slate-400 tracking-wider uppercase mb-2">Public</h4>
          <NavButton path="/parking-map" icon={Map} label="Parking Map" />
        </div>
      );
    }

    if (['driver', 'member', 'registered_driver', 'customer'].includes(lowerRole)) {
      return (
        <div className="mb-6">
          <h4 className="px-4 text-[10px] font-extrabold text-slate-400 tracking-wider uppercase mb-2">Driver Services</h4>
          <NavButton path="/parking-map" icon={Map} label="Parking Map" />
          <NavButton path="/my-bookings" icon={CalendarIcon} label="My Bookings" />
        </div>
      );
    }

    if (lowerRole === 'staff') {
      return (
        <div className="mb-6">
          <h4 className="px-4 text-[10px] font-extrabold text-slate-400 tracking-wider uppercase mb-2">Operations</h4>
          <NavButton path="/checkin-checkout" icon={ScanLine} label="Gate Control" />
          <NavButton path="/parking-map" icon={Map} label="Parking Map" />
        </div>
      );
    }

    if (lowerRole === 'manager') {
      return (
        <div className="mb-6">
          <h4 className="px-4 text-[10px] font-extrabold text-slate-400 tracking-wider uppercase mb-2">Management</h4>
          <NavButton path="/dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavButton path="/parking-map" icon={Map} label="Parking Map" />
        </div>
      );
    }

    if (lowerRole === 'admin') {
      return (
        <>
          <div className="mb-6">
            <h4 className="px-4 text-[10px] font-extrabold text-slate-400 tracking-wider uppercase mb-2">Administration</h4>
            <NavButton path="/accounts" icon={Users} label="User Management" />
            <NavButton path="/create-account" icon={UserPlus} label="Create Account" />
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
            <span className="font-extrabold text-[15px] tracking-tight text-slate-900 leading-tight">
              Parking Building
            </span>
            <span className="text-[11px] font-medium text-slate-500">
              Management System
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-6 pr-4 overflow-y-auto">
        {renderTabs()}
      </div>

      {/* Bottom User Profile Section */}
      {user && (
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div 
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate('/settings')}
              title="Account Settings"
            >
              {/* Circular Avatar */}
              <div className="w-9 h-9 rounded-full bg-[#FF4B6E] flex items-center justify-center text-white text-[11px] font-bold shadow-sm">
                {getInitials(user.username || user.name)}
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] font-bold text-slate-900 truncate max-w-[100px]">
                  {user.username || user.name}
                </span>
                <span className="text-[11px] font-medium text-slate-500 capitalize">
                  {role || 'User'}
                </span>
              </div>
            </div>
            {/* Logout Icon */}
            <button 
              onClick={handleLogoutClick}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
