import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home, LogOut, Sun, Moon, Bell, Settings, ChevronDown, LogIn
} from 'lucide-react';

const Header = () => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const userMenuRef = useRef(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

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
    switch (location.pathname) {
      case '/parking-map': return 'Bản đồ trực tiếp';
      case '/dashboard': return 'Bảng điều khiển quản lý';
      case '/live-status': return 'Trạng thái trực tiếp';
      case '/incidents': return 'Sự cố';
      case '/analytics': return 'Phân tích';
      case '/slot-management': return 'Quản lý chỗ đỗ';
      case '/pricing': return 'Bảng giá';
      case '/staff-logs': return 'Nhật ký nhân viên';
      case '/accounts': return 'Quản lý người dùng';
      case '/create-account': return 'Tạo tài khoản';
      case '/my-bookings': return 'Lịch đặt chỗ của tôi';
      case '/checkin-checkout': return 'Điều khiển cổng';
      case '/settings': return 'Cài đặt tài khoản';
      default: return 'Quản lý người dùng'; // Defaulting to the mockup title
    }
  };

  const getPageSubtitle = () => {
    if (location.pathname === '/dashboard') {
      return getFormattedDate();
    }
    if (location.pathname === '/parking-map') {
      return 'Bản đồ tình trạng chỗ đỗ xe theo thời gian thực';
    }
    if (location.pathname === '/live-status') {
      return 'Theo dõi trạng thái chỗ đỗ theo thời gian thực';
    }
    if (location.pathname === '/incidents') {
      return 'Theo dõi cảnh báo và sự cố vận hành';
    }
    if (location.pathname === '/analytics') {
      return 'Phân tích lưu lượng xe và doanh thu';
    }
    if (location.pathname === '/slot-management') {
      return 'Không gian quản lý trạng thái và điều phối chỗ đỗ';
    }
    if (location.pathname === '/pricing') {
      return 'Cấu hình bảng giá theo loại xe';
    }
    if (location.pathname === '/staff-logs') {
      return 'Theo dõi nhật ký hoạt động của nhân viên';
    }
    if (location.pathname === '/accounts') {
      return 'Quản lý tài khoản người dùng và quyền truy cập hệ thống';
    }
    if (location.pathname === '/settings') {
      return 'Cấu hình hồ sơ cá nhân, tùy chọn hệ thống và công cụ quản trị';
    }
    if (location.pathname === '/checkin-checkout') {
      return 'Trung tâm điều phối làn vào và làn ra';
    }
    if (location.pathname === '/create-account') {
      return 'Tạo người dùng mới và cấp quyền truy cập hệ thống';
    }
    if (location.pathname === '/my-bookings') {
      return 'Quản lý lịch đặt chỗ và lịch sử gửi xe của bạn';
    }
    return 'Quản lý tài khoản người dùng và quyền truy cập hệ thống';
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
          <span className="text-[13px] font-bold text-slate-800">3 <span className="font-medium text-slate-500">đang hoạt động</span></span>
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

        {user ? (
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
              className="flex items-center gap-3 rounded-full border border-slate-200 bg-white py-1.5 pl-1.5 pr-3 text-left shadow-[0_2px_5px_rgba(0,0,0,0.02)] transition-colors hover:bg-slate-50"
            >
              <div className="w-9 h-9 rounded-full bg-[#FF4B6E] flex items-center justify-center text-white text-[11px] font-bold shadow-sm">
                {getInitials(getDisplayName())}
              </div>
              <div className="hidden lg:flex flex-col leading-tight">
                <span className="max-w-[120px] truncate text-[13px] font-bold text-slate-900">
                  {getDisplayName()}
                </span>
                <span className="max-w-[120px] truncate text-[11px] font-medium text-slate-500">
                  {getDisplayRole()}
                </span>
              </div>
              <ChevronDown size={15} className={`text-slate-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-slate-100 bg-white py-1.5 shadow-lg">
                <button
                  onClick={handleGoHome}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-[13px] font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <Home size={15} className="text-slate-400" />
                  Trang chủ
                </button>
                <button
                  onClick={handleGoToProfile}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-[13px] font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <Settings size={15} className="text-slate-400" />
                  Tài khoản của tôi
                </button>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-[13px] font-semibold text-rose-600 transition-colors hover:bg-rose-50"
                >
                  <LogOut size={15} />
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={handleLogin}
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-bold text-slate-700 shadow-[0_2px_5px_rgba(0,0,0,0.02)] transition-colors hover:bg-slate-50"
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
