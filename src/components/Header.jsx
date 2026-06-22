import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LogOut, User, Sun, Moon, Search, Bell, Settings, ChevronDown, Activity
} from 'lucide-react';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  const toggleDarkMode = () => {
    const root = document.documentElement;
    if (root.classList.contains('dark')) {
      root.classList.remove('dark');
      setIsDarkMode(false);
    } else {
      root.classList.add('dark');
      setIsDarkMode(true);
    }
  };

  const getFormattedDate = () => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
  };

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/parking-map': return 'Live Map';
      case '/dashboard': return 'Manager Dashboard';
      case '/accounts': return 'User Management';
      case '/create-account': return 'Create Account';
      case '/my-bookings': return 'My Bookings';
      case '/checkin-checkout': return 'Gate Control';
      case '/settings': return 'Account Settings';
      default: return 'User Management'; // Defaulting to the mockup title
    }
  };

  const getPageSubtitle = () => {
    if (location.pathname === '/dashboard') {
      return getFormattedDate();
    }
    if (location.pathname === '/parking-map') {
      return 'Real-time parking slot availability map';
    }
    if (location.pathname === '/accounts') {
      return 'Manage system user accounts and permissions';
    }
    if (location.pathname === '/settings') {
      return 'Configure your personal profile details, system preferences, and administrative tools';
    }
    if (location.pathname === '/checkin-checkout') {
      return 'Simultaneous entry and exit lanes control center';
    }
    if (location.pathname === '/create-account') {
      return 'Provision new users and grant system access roles';
    }
    if (location.pathname === '/my-bookings') {
      return 'Manage your parking reservations and history';
    }
    return 'Manage system user accounts and permissions';
  };

  return (
    <header className="w-full h-[96px] flex items-center justify-between px-8 bg-white border-b border-slate-100 select-none">

      {/* Left: Dynamic Page Title */}
      <div className="flex-1 flex flex-col pt-2">
        <h1 className="text-[22px] font-extrabold text-slate-900 tracking-tight">{getPageTitle()}</h1>
        <p className="text-[13px] text-slate-500 font-medium">{getPageSubtitle()}</p>
      </div>

      {/* Right: Actions & Indicators */}
      <div className="flex items-center gap-6">

        {/* Active Indicator */}
        <div className="hidden sm:flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#34C759]"></div>
          <span className="text-[13px] font-bold text-slate-800">3 <span className="font-medium text-slate-500">active</span></span>
        </div>

        {/* Occupancy Indicator */}
        <div className="hidden sm:flex items-center gap-2">
          <Activity size={16} className="text-[#4B6BFB]" />
          <span className="text-[13px] font-medium text-slate-500">Occupancy</span>
          <span className="text-[13px] font-bold text-[#34C759]">29%</span>
        </div>

        <div className="h-6 w-px bg-slate-200 mx-1"></div>

        {/* Notifications */}
        <button className="w-10 h-10 rounded-full flex items-center justify-center bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors shadow-[0_2px_5px_rgba(0,0,0,0.02)] relative">
          <Bell size={18} strokeWidth={2} />
          <span className="absolute -top-1 -right-1 w-[18px] h-[18px] bg-[#FF3B30] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
            2
          </span>
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-white border border-slate-200 text-[#FF9500] hover:bg-slate-50 transition-colors shadow-[0_2px_5px_rgba(0,0,0,0.02)]"
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

      </div>
    </header>
  );
};

export default Header;
