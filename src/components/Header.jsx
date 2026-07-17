import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import Logo from './Logo';
import NotificationBell from './NotificationBell';
import {
  Bell,
  ChevronDown,
  Languages,
  LogIn,
  Menu,
  Moon,
  Sun
} from 'lucide-react';
import { getRoleMenuItems, normalizeRole } from '../config/roleMenus';
import { getRoleLabel } from '../utils/i18nLabels';

const getCurrentRole = (user, role) => (
  user?.role
  || user?.roleName
  || user?.userRole
  || user?.roles?.[0]
  || role
);

const Header = ({ onOpenSidebar, hasSidebar = true, showLogo = true, pageTitle, pageSubtitle }) => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const userMenuRef = useRef(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const { isDarkMode, toggleTheme } = useTheme();

  const currentRole = getCurrentRole(user, role);
  const normalizedRole = normalizeRole(currentRole);
  const usesCompactRoleMenu = normalizedRole === 'admin' || normalizedRole === 'manager';
  const { navigationItems, accountItems } = getRoleMenuItems({
    role: currentRole,
    t,
    currentPath: location.pathname
  });

  const toggleLanguage = () => {
    const newLang = i18n.language === 'vi' ? 'en' : 'vi';
    i18n.changeLanguage(newLang);
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
    || t('home.defaultAccount')
  );

  const getDisplayRole = () => getRoleLabel(currentRole, t);

  const navigateFromMenu = (path) => {
    setIsUserMenuOpen(false);
    navigate(path);
  };

  const handleLogout = () => {
    setIsUserMenuOpen(false);
    logout();
    navigate('/login');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const isActivePath = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const menuButtonClass = (path, tone = 'default') => {
    if (tone === 'danger') {
      return 'flex w-full items-center gap-2 px-4 py-2.5 text-left text-[13px] font-semibold text-rose-600 transition-colors hover:bg-rose-50 dark:hover:bg-rose-500/10';
    }

    const isActive = path && isActivePath(path);
    return [
      'flex w-full items-center gap-2 px-4 py-2.5 text-left text-[13px] font-semibold transition-colors dark:text-slate-200',
      isActive
        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200'
        : 'text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
    ].join(' ');
  };

  const iconClass = (path) => (
    path && isActivePath(path)
      ? 'text-indigo-600 dark:text-indigo-300'
      : 'text-slate-400'
  );
  const headerHeightClass = hasSidebar ? 'min-h-[72px] lg:h-24' : 'min-h-[72px]';

  return (
    <header className={`flex ${headerHeightClass} w-full min-w-0 items-center justify-between gap-3 border-b border-slate-100 bg-white px-4 py-3 select-none transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900 sm:px-6 md:px-8`}>
      <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
        {hasSidebar && (
          <button
            type="button"
            onClick={onOpenSidebar}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-[0_2px_5px_rgba(0,0,0,0.02)] transition-colors hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700 lg:hidden"
            aria-label={t('common.openMenu')}
          >
            <Menu size={20} />
          </button>
        )}
        {showLogo && (
          <Link
            to="/"
            className="flex shrink-0 items-center rounded-2xl transition-colors hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-indigo-100 dark:hover:bg-slate-800 dark:focus:ring-indigo-900/40"
            aria-label={t('common.backHome')}
          >
            <Logo size="small" showText={false} className="sm:hidden" />
            <Logo size="default" className="hidden sm:flex" />
          </Link>
        )}
        {!showLogo && pageTitle && (
          <div className="min-w-0 pr-4">
            <h1 className="max-w-full break-words text-lg font-extrabold leading-[1.25] tracking-normal text-slate-900 dark:text-slate-100 sm:text-2xl">
              {pageTitle}
            </h1>
            {pageSubtitle && (
              <p className="mt-0.5 max-w-full break-words text-xs font-medium leading-[1.3] text-slate-500 dark:text-slate-400 sm:mt-1 sm:text-sm">
                {pageSubtitle}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3 md:gap-4 lg:gap-6">
        <div className="hidden sm:block">
          <NotificationBell />
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-white border border-slate-200 text-[#FF9500] hover:bg-slate-50 transition-colors shadow-[0_2px_5px_rgba(0,0,0,0.02)] dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700"
          aria-label={t('home.toggleTheme')}
          title={t('home.toggleTheme')}
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button
          type="button"
          onClick={toggleLanguage}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors shadow-[0_2px_5px_rgba(0,0,0,0.02)] relative dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
          aria-label={t('home.toggleLanguage')}
          title={i18n.language === 'vi' ? t('common.switchToEnglish') : t('common.switchToVietnamese')}
        >
          <Languages size={18} />
          <span className="absolute -bottom-1 -right-1 bg-indigo-100 text-indigo-700 text-[9px] font-bold px-1 rounded-sm border border-white">
            {i18n.language.toUpperCase()}
          </span>
        </button>

        {user ? (
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
              className="flex items-center gap-2 sm:gap-3 rounded-full border border-slate-200 bg-white py-1.5 pl-1.5 pr-2 sm:pr-3 text-left shadow-[0_2px_5px_rgba(0,0,0,0.02)] transition-colors hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700"
              aria-label={t('dropdown.account')}
            >
              <div className="w-9 h-9 rounded-full bg-[#FF4B6E] flex items-center justify-center text-white text-[11px] font-bold shadow-sm">
                {getInitials(getDisplayName())}
              </div>
              <div className="hidden lg:flex flex-col leading-tight">
                <span className="max-w-[120px] truncate text-[13px] font-bold text-slate-900 dark:text-slate-100">
                  {getDisplayName()}
                </span>
                <span className="max-w-[120px] truncate text-[11px] font-medium text-slate-555 dark:text-slate-400">
                  {getDisplayRole()}
                </span>
              </div>
              <ChevronDown size={15} className={`hidden sm:block text-slate-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-64 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-slate-100 bg-white py-1.5 shadow-lg dark:bg-slate-900 dark:border-slate-700">
                {usesCompactRoleMenu ? (
                  <div className="py-1">
                    {navigationItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => navigateFromMenu(item.path)}
                          className={menuButtonClass(item.path)}
                        >
                          <Icon size={15} className={iconClass(item.path)} />
                          {item.label}
                        </button>
                      );
                    })}
                    {accountItems.map((item) => {
                      const Icon = item.icon;
                      if (item.danger) {
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={handleLogout}
                            className={`${menuButtonClass(null, 'danger')} mt-1 border-t border-slate-100 pt-3 dark:border-slate-700`}
                          >
                            <Icon size={15} />
                            {item.label}
                          </button>
                        );
                      }

                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => navigateFromMenu(item.path)}
                          className={menuButtonClass(item.path)}
                        >
                          <Icon size={15} className={iconClass(item.path)} />
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <>
                    <div className="px-4 pb-1 pt-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      {t('dropdown.navigation')}
                    </div>
                    {navigationItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => navigateFromMenu(item.path)}
                          className={menuButtonClass(item.path)}
                        >
                          <Icon size={15} className={iconClass(item.path)} />
                          {item.label}
                        </button>
                      );
                    })}

                    <div className="my-1 border-t border-slate-100 dark:border-slate-700" />
                    <div className="px-4 pb-1 pt-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      {t('dropdown.account')}
                    </div>
                    {accountItems.map((item) => {
                      const Icon = item.icon;
                      if (item.danger) {
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={handleLogout}
                            className={menuButtonClass(null, 'danger')}
                          >
                            <Icon size={15} />
                            {item.label}
                          </button>
                        );
                      }

                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => navigateFromMenu(item.path)}
                          className={menuButtonClass(item.path)}
                        >
                          <Icon size={15} className={iconClass(item.path)} />
                          {item.label}
                        </button>
                      );
                    })}
                  </>
                )}
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={handleLogin}
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2.5 sm:px-4 text-[13px] font-bold text-slate-700 shadow-[0_2px_5px_rgba(0,0,0,0.02)] transition-colors hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <LogIn size={16} className="text-slate-400" />
            <span className="hidden sm:inline">{t('home.btnLogin')}</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
