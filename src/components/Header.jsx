import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import {
  Home, LogOut, Sun, Moon, Bell, Settings, ChevronDown, LogIn, Languages
} from 'lucide-react';

const Header = () => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const userMenuRef = useRef(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const { isDarkMode, toggleTheme } = useTheme();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'vi' ? 'en' : 'vi';
    i18n.changeLanguage(newLang);
  };

  const getFormattedDate = () => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('vi-VN', options);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name) => {
    if (!name) return 'TK';
    const cleanName = name.replace(/\s+/g, ' ').trim();
    const parts = cleanName.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return cleanName[0]?.toUpperCase() || 'TK';
  };

  const getDisplayName = () => (
    user?.fullName
    || user?.name
    || user?.username
    || user?.email
    || 'Tài khoản'
  );

  const getDisplayRole = () => (
    user?.role
    || user?.userRole
    || user?.roles?.[0]
    || role
    || 'Người dùng'
  );

  const handleGoHome = () => {
    setIsUserMenuOpen(false);
    navigate('/');
  };

  const handleGoToProfile = () => {
    setIsUserMenuOpen(false);
    navigate('/settings');
  };

  const handleLogout = () => {
    setIsUserMenuOpen(false);
    logout();
    navigate('/login');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const getPageTitle = () => {
    const path = location.pathname.substring(1);
    if (!path) return t('header.title.default');
    return t(`header.title.${path}`, { defaultValue: t('header.title.default') });
  };

  const getPageSubtitle = () => {
    if (location.pathname === '/dashboard') {
      return getFormattedDate();
    }
    const path = location.pathname.substring(1);
    if (!path) return t('header.subtitle.default');
    return t(`header.subtitle.${path}`, { defaultValue: t('header.subtitle.default') });
  };

  return (
    <header className="w-full h-[96px] flex items-center justify-between px-8 bg-white border-b border-slate-100 select-none transition-colors duration-300 dark:bg-slate-900 dark:border-slate-800">

      {/* Left: Dynamic Page Title */}
      <div className="flex-1 flex flex-col pt-2">
        <h1 className="text-[22px] font-extrabold text-slate-900 tracking-tight dark:text-slate-100">{getPageTitle()}</h1>
        <p className="text-[13px] text-slate-500 font-medium dark:text-slate-400">{getPageSubtitle()}</p>
      </div>

      {/* Right: Actions & Indicators */}
      <div className="flex items-center gap-6">



        {/* Notifications */}
        <button className="w-10 h-10 rounded-full flex items-center justify-center bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors shadow-[0_2px_5px_rgba(0,0,0,0.02)] relative dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white">
          <Bell size={18} strokeWidth={2} />
          <span className="absolute -top-1 -right-1 w-[18px] h-[18px] bg-[#FF3B30] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
            2
          </span>
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-white border border-slate-200 text-[#FF9500] hover:bg-slate-50 transition-colors shadow-[0_2px_5px_rgba(0,0,0,0.02)] dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700"
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Language Switcher Toggle */}
        <button
          onClick={toggleLanguage}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors shadow-[0_2px_5px_rgba(0,0,0,0.02)] relative dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
          title={i18n.language === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
        >
          <Languages size={18} />
          <span className="absolute -bottom-1 -right-1 bg-indigo-100 text-indigo-700 text-[9px] font-bold px-1 rounded-sm border border-white">
            {i18n.language.toUpperCase()}
          </span>
        </button>

        {user ? (
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
              className="flex items-center gap-3 rounded-full border border-slate-200 bg-white py-1.5 pl-1.5 pr-3 text-left shadow-[0_2px_5px_rgba(0,0,0,0.02)] transition-colors hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700"
            >
              <div className="w-9 h-9 rounded-full bg-[#FF4B6E] flex items-center justify-center text-white text-[11px] font-bold shadow-sm">
                {getInitials(getDisplayName())}
              </div>
              <div className="hidden lg:flex flex-col leading-tight">
                <span className="max-w-[120px] truncate text-[13px] font-bold text-slate-900 dark:text-slate-100">
                  {getDisplayName()}
                </span>
                <span className="max-w-[120px] truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {getDisplayRole() || t('header.userRole')}
                </span>
              </div>
              <ChevronDown size={15} className={`text-slate-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-slate-100 bg-white py-1.5 shadow-lg dark:bg-slate-900 dark:border-slate-700">
                <button
                  onClick={handleGoHome}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-[13px] font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <Home size={15} className="text-slate-400" />
                  Trang chủ
                </button>
                <button
                  onClick={handleGoToProfile}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-[13px] font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <Settings size={15} className="text-slate-400" />
                  {t('header.profile')}
                </button>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-[13px] font-semibold text-rose-600 transition-colors hover:bg-rose-50"
                >
                  <LogOut size={15} />
                  {t('header.logout')}
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={handleLogin}
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-bold text-slate-700 shadow-[0_2px_5px_rgba(0,0,0,0.02)] transition-colors hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <LogIn size={16} className="text-slate-400" />
            Đăng nhập
          </button>
        )}

      </div>
    </header>
  );
};

export default Header;
