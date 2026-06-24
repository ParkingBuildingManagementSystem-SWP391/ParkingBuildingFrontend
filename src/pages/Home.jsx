import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ChevronDown, Clock3, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logoImage from '../assets/logo/parking-building-logo.png';
import heroImage from '../assets/logo/ảnh cho trang chủ.webp';

const Home = () => {
  const { user, role } = useAuth();
  const displayName = user?.username || 'hi';
  const displayRole = role || 'Manager';

  const trustItems = ['Đặt chỗ tức thì', 'Không phí ẩn', 'Bảo mật an toàn'];

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-950">
      <header className="border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-[76px] max-w-7xl items-center justify-between gap-5 px-5 py-3 lg:px-8">
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <img
              src={logoImage}
              alt="Parking Building System"
              className="h-11 w-11 rounded-2xl object-contain"
            />
            <div className="leading-tight">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-600">
                HỆ THỐNG
              </p>
              <p className="text-sm font-extrabold text-slate-900 sm:text-base">
                Quản lí bãi đỗ xe
              </p>
            </div>
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
            <a className="transition-colors hover:text-blue-600" href="#contact">
              Liên hệ
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/parking-map"
              className="hidden rounded-2xl bg-blue-600 px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 sm:inline-flex"
            >
              Đặt chỗ
            </Link>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-black text-white">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden leading-tight sm:block">
                <p className="text-sm font-extrabold text-slate-900">{displayName}</p>
                <p className="text-xs font-semibold text-slate-400">{displayRole}</p>
              </div>
              <ChevronDown size={16} className="text-slate-400" />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-5 py-14 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-20">
        <section className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-sm font-extrabold text-blue-700 shadow-sm">
            <Sparkles size={16} />
            Hệ thống thông minh · Hoạt động 24/7
          </div>

          <div className="space-y-5">
            <h1 className="text-5xl font-black leading-[1.05] tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
              <span className="block">Đặt chỗ nhanh</span>
              <span className="block text-blue-600">Gửi xe tiện</span>
              <span className="block">Di chuyển an tâm</span>
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

      <section id="contact" className="mx-auto max-w-7xl px-5 pb-12 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-5 text-center text-sm font-semibold text-slate-500 shadow-sm">
          Cần hỗ trợ đặt chỗ? Liên hệ đội ngũ vận hành để được tư vấn nhanh và chính xác.
        </div>
      </section>
    </div>
  );
};

export default Home;
