import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, ChevronDown, Clock3, LogOut, Settings, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AppFooter from '../components/AppFooter';
import Logo from '../components/Logo';
import heroImage from '../assets/logo/ảnh cho trang chủ.webp';

const Home = () => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const userMenuRef = useRef(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const displayName = user?.fullName || user?.name || user?.username || user?.email || 'Tài khoản';
  const displayRole = user?.role || user?.userRole || user?.roles?.[0] || role || 'Người dùng';

  const trustItems = ['Đặt chỗ tức thì', 'Không phí ẩn', 'Bảo mật an toàn'];

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
    const cleanName = name.replace(/\s+/g, ' ').trim();
    const parts = cleanName.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return cleanName[0]?.toUpperCase() || 'TK';
  };

  const handleLogout = () => {
    setIsUserMenuOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f7fb] text-slate-950">
      <header className="h-[96px] border-b border-slate-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-full max-w-[1600px] items-center justify-between gap-6 px-6 md:px-8">
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <Logo />
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-bold text-slate-600 md:flex">
            <Link className="text-blue-600" to="/">
              Trang chủ
            </Link>
            <Link className="transition-colors hover:text-blue-600" to="/parking-map">
              Đặt chỗ
            </Link>
            <Link className="transition-colors hover:text-blue-600" to="/pricing">
              Bảng giá
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/parking-map"
              className="hidden rounded-2xl bg-blue-600 px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 sm:inline-flex"
            >
              Đặt chỗ
            </Link>
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen((prev) => !prev)}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition-colors hover:bg-slate-50"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-black text-white">
                    {getInitials(displayName)}
                  </div>
                  <div className="hidden leading-tight sm:block">
                    <p className="text-sm font-extrabold text-slate-900">{displayName}</p>
                    <p className="text-xs font-semibold text-slate-400">{displayRole}</p>
                  </div>
                  <ChevronDown size={16} className={`text-slate-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-slate-100 bg-white py-1.5 shadow-lg">
                    <Link
                      to="/"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-[13px] font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      Trang chủ
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-[13px] font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      <Settings size={15} className="text-slate-400" />
                      Tài khoản của tôi
                    </Link>
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
              <Link
                to="/login"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-extrabold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-[1360px] flex-1 grid-cols-1 items-center gap-12 px-5 py-14 sm:px-8 lg:grid-cols-[minmax(0,0.98fr)_minmax(0,1.02fr)] lg:gap-16 lg:px-14 lg:py-20 xl:px-16">
        <section className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-sm font-extrabold text-blue-700 shadow-sm">
            <Sparkles size={16} />
            Hệ thống thông minh · Hoạt động 24/7
          </div>

          <div className="space-y-5">
            <h1 className="text-5xl font-black leading-[1.05] tracking-tight text-slate-950 sm:text-6xl lg:text-[68px] xl:text-[76px]">
              <span className="block">Đặt chỗ nhanh</span>
              <span className="block text-blue-600">Gửi xe tiện</span>
              <span className="block lg:whitespace-nowrap">Di chuyển an tâm</span>
            </h1>
            <p className="max-w-xl text-base font-medium leading-8 text-slate-600 sm:text-lg">
              Tìm và đặt chỗ đậu xe phù hợp chỉ trong vài thao tác, giúp bạn tiết kiệm thời gian và an tâm hơn khi di chuyển.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/parking-map"
              className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-7 py-4 text-sm font-extrabold text-white shadow-xl shadow-blue-600/20 transition hover:bg-blue-700"
            >
              Đặt chỗ
            </Link>
            <Link
              to="/parking-map"
              className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-7 py-4 text-sm font-extrabold text-white shadow-xl shadow-slate-950/10 transition hover:bg-slate-800"
            >
              Xem sơ đồ bãi xe
            </Link>
          </div>

          <div className="flex flex-wrap gap-4 pt-2">
            {trustItems.map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm font-bold text-slate-600">
                <CheckCircle2 size={18} className="text-blue-600" />
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="relative">
          <div className="relative overflow-hidden rounded-[24px] bg-white p-3 shadow-2xl shadow-blue-950/10">
            <img
              src={heroImage}
              alt="Hệ thống bãi đỗ xe thông minh"
              className="h-[360px] w-full rounded-[20px] object-cover sm:h-[470px] lg:h-[540px]"
            />

            <div className="absolute right-6 top-6 flex items-center gap-2 rounded-2xl bg-white/95 px-4 py-3 text-sm font-extrabold text-slate-800 shadow-xl shadow-slate-950/10 backdrop-blur">
              <Clock3 size={17} className="text-blue-600" />
              Cập nhật theo thời gian thực
            </div>

            <div className="absolute bottom-6 left-6 rounded-3xl bg-slate-950 px-5 py-4 text-white shadow-xl shadow-slate-950/20">
              <p className="text-3xl font-black leading-none">1.500+</p>
              <p className="mt-1 text-sm font-bold text-slate-300">Chỗ đỗ sẵn sàng</p>
            </div>
          </div>
        </section>
      </main>

      <AppFooter />
    </div>
  );
};

export default Home;
