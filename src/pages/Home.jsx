import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronDown, LogOut, Settings, Map, Zap, ShieldCheck, CreditCard,
  Search, CalendarCheck, CarFront, ArrowRight, Star, Users, Clock, Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AppFooter from '../components/AppFooter';
import Logo from '../components/Logo';
import heroImage from '../assets/logo/parking-hero.png';
import { useTranslation } from 'react-i18next';
import LocateVehicle from './LocateVehicle';

/* ── tiny animated counter ── */
const AnimatedNumber = ({ target, suffix = '' }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const num = parseInt(target.replace(/[^0-9]/g, ''), 10) || 0;
          const duration = 1600;
          const steps = 40;
          const increment = num / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= num) { setCount(num); clearInterval(timer); }
            else setCount(Math.floor(current));
          }, duration / steps);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  const formatted = count.toLocaleString();
  return <span ref={ref}>{formatted}{suffix}</span>;
};

const Home = () => {
  const { user, role, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const userMenuRef = useRef(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const displayName = user?.fullName || user?.name || user?.username || user?.email || 'Account';
  const displayRole = user?.role || user?.userRole || user?.roles?.[0] || role || 'User';

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
    const parts = name.replace(/\s+/g, ' ').trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0]?.[0]?.toUpperCase() || 'U';
  };

  const handleLogout = () => { setIsUserMenuOpen(false); logout(); navigate('/login'); };

  /* ── data arrays ── */
  const features = [
    { icon: Map,         title: t('home.feat1Title'), desc: t('home.feat1Desc'), color: 'from-blue-500 to-cyan-400' },
    { icon: Zap,         title: t('home.feat2Title'), desc: t('home.feat2Desc'), color: 'from-violet-500 to-purple-400' },
    { icon: ShieldCheck, title: t('home.feat3Title'), desc: t('home.feat3Desc'), color: 'from-emerald-500 to-teal-400' },
    { icon: CreditCard,  title: t('home.feat4Title'), desc: t('home.feat4Desc'), color: 'from-amber-500 to-orange-400' },
  ];

  const steps = [
    { icon: Search,        num: '01', title: t('home.step1Title'), desc: t('home.step1Desc') },
    { icon: CalendarCheck, num: '02', title: t('home.step2Title'), desc: t('home.step2Desc') },
    { icon: CarFront,      num: '03', title: t('home.step3Title'), desc: t('home.step3Desc') },
  ];

  const stats = [
    { icon: CarFront, value: t('home.statSlots'),   label: t('home.statSlotsLabel') },
    { icon: Activity, value: t('home.statUptime'),  label: t('home.statUptimeLabel') },
    { icon: Users,    value: t('home.statUsers'),   label: t('home.statUsersLabel') },
    { icon: Clock,    value: t('home.statSupport'), label: t('home.statSupportLabel') },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-950">
      {/* ─── inline keyframes ─── */}
      <style>{`
        @keyframes float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes fade-up  { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse-ring{ 0%{transform:scale(.9);opacity:.6} 50%{transform:scale(1.05);opacity:1} 100%{transform:scale(.9);opacity:.6} }
        .anim-float  { animation:float 6s ease-in-out infinite }
        .anim-fade-up{ animation:fade-up .7s ease-out both }
        .delay-1{animation-delay:.12s} .delay-2{animation-delay:.24s} .delay-3{animation-delay:.36s} .delay-4{animation-delay:.48s}
      `}</style>

      {/* ══════════════════ HEADER ══════════════════ */}
      <header className="sticky top-0 z-50 border-b border-slate-100/80 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <Logo />
          </Link>

          <nav className="hidden items-center gap-8 text-[13px] font-bold text-slate-500 md:flex">
            <Link className="text-blue-600" to="/">{t('home.navHome')}</Link>
            <Link className="transition-colors hover:text-blue-600" to="/parking-map">{t('home.navBook')}</Link>
            <a className="transition-colors text-blue-600 hover:text-blue-700 flex items-center gap-1" href="/#locate-vehicle">
              <Search size={14} /> {t('home.navLocate', 'Tìm Xe')}
            </a>
            <Link className="transition-colors hover:text-blue-600" to="/pricing">{t('home.navPricing')}</Link>
            <a   className="transition-colors hover:text-blue-600" href="#contact">{t('home.navContact')}</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/parking-map"
              className="hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition hover:shadow-blue-600/40 hover:-translate-y-0.5 sm:inline-flex"
            >
              {t('home.btnBook')}
            </Link>

            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen((p) => !p)}
                  className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition-colors hover:bg-slate-50"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-black text-white">
                    {getInitials(displayName)}
                  </div>
                  <div className="hidden leading-tight sm:block">
                    <p className="text-sm font-bold text-slate-800">{displayName}</p>
                    <p className="text-[11px] font-semibold text-slate-400">{displayRole}</p>
                  </div>
                  <ChevronDown size={14} className={`text-slate-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-slate-100 bg-white py-1 shadow-xl">
                    <Link to="/settings" onClick={() => setIsUserMenuOpen(false)}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50">
                      <Settings size={15} className="text-slate-400" />
                      {t('header.profile')}
                    </Link>
                    <button onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-[13px] font-semibold text-rose-600 hover:bg-rose-50">
                      <LogOut size={15} />
                      {t('header.logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                {t('home.btnLogin')}
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ══════════════════ HERO ══════════════════ */}
      <section className="relative overflow-hidden">
        {/* decorative blobs */}
        <div className="pointer-events-none absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-blue-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-indigo-400/8 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-5 py-16 lg:grid-cols-2 lg:gap-20 lg:px-8 lg:py-24">
          {/* ── text ── */}
          <div className="space-y-8 anim-fade-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/80 px-4 py-2 text-sm font-bold text-blue-700">
              <Star size={15} className="text-amber-500" />
              {t('home.badge')}
            </div>

            <h1 className="text-[clamp(2.5rem,5vw,4.5rem)] font-black leading-[1.08] tracking-tight">
              <span className="block text-slate-950">{t('home.hero1')}</span>
              <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{t('home.hero2')}</span>
            </h1>

            <p className="max-w-lg text-base leading-8 text-slate-500 font-medium sm:text-lg">
              {t('home.heroDesc')}
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to="/parking-map"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-7 py-4 text-sm font-bold text-white shadow-xl shadow-blue-600/25 transition hover:shadow-blue-600/40 hover:-translate-y-0.5"
              >
                {t('home.btnBook')}
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/parking-map"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-7 py-4 text-sm font-bold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
              >
                {t('home.btnViewMap')}
              </Link>
            </div>
          </div>

          {/* ── image ── */}
          <div className="relative anim-fade-up delay-2">
            <div className="relative overflow-hidden rounded-3xl shadow-2xl shadow-blue-950/15 ring-1 ring-slate-200/60">
              <img
                src={heroImage}
                alt={t('home.altHeroImg')}
                className="h-[340px] w-full object-cover sm:h-[420px] lg:h-[480px]"
              />
              {/* overlay gradient */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/30 via-transparent to-transparent" />
            </div>

            {/* floating stat card */}
            <div className="anim-float absolute -bottom-5 -left-4 rounded-2xl border border-white/20 bg-white/95 px-5 py-4 shadow-xl backdrop-blur sm:-left-8">
              <p className="text-3xl font-black text-blue-600 leading-none">
                <AnimatedNumber target="1500" suffix="+" />
              </p>
              <p className="mt-1 text-sm font-bold text-slate-500">{t('home.statSlotsLabel')}</p>
            </div>

            {/* floating badge top-right */}
            <div className="anim-float absolute -top-3 -right-3 flex items-center gap-2 rounded-xl border border-white/20 bg-white/95 px-4 py-2.5 shadow-xl backdrop-blur sm:-right-6" style={{ animationDelay: '1s' }}>
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" style={{ animation: 'pulse-ring 2s infinite' }} />
              <span className="text-sm font-bold text-slate-700">Online</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ STATS BAR ══════════════════ */}
      <section className="relative mx-auto w-full max-w-7xl px-5 lg:px-8 -mt-2 mb-8">
        <div className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-lg sm:grid-cols-4 sm:gap-0 sm:divide-x sm:divide-slate-100 sm:p-0">
          {stats.map((s, i) => (
            <div key={i} className="flex flex-col items-center py-5 sm:py-6">
              <s.icon size={20} className="mb-2 text-blue-600" />
              <p className="text-xl font-black text-slate-900 sm:text-2xl">{s.value}</p>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════ FEATURES ══════════════════ */}
      <section className="mx-auto w-full max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
        <div className="text-center space-y-3 mb-14">
          <h2 className="text-3xl font-black text-slate-900 sm:text-4xl">{t('home.featTitle')}</h2>
          <p className="mx-auto max-w-xl text-base text-slate-500 font-medium">{t('home.featDesc')}</p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <div
              key={i}
              className={`anim-fade-up delay-${i + 1} group relative rounded-2xl border border-slate-100 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-blue-900/5 cursor-pointer`}
            >
              <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${f.color} text-white shadow-lg shadow-blue-600/10 transition-transform group-hover:scale-110`}>
                <f.icon size={22} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">{f.title}</h3>
              <p className="text-sm leading-relaxed text-slate-500 font-medium">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════ HOW IT WORKS ══════════════════ */}
      <section className="bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
          <div className="text-center space-y-3 mb-14">
            <h2 className="text-3xl font-black text-slate-900 sm:text-4xl">{t('home.howTitle')}</h2>
            <p className="text-base text-slate-500 font-medium">{t('home.howDesc')}</p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {steps.map((s, i) => (
              <div key={i} className={`anim-fade-up delay-${i + 1} relative rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm`}>
                {/* step number */}
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <s.icon size={26} strokeWidth={2} />
                </div>
                <span className="inline-block rounded-full bg-blue-600 px-3 py-1 text-[11px] font-black text-white mb-3">
                  {s.num}
                </span>
                <h3 className="text-lg font-bold text-slate-800 mb-2">{s.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500 font-medium">{s.desc}</p>

                {/* connector arrow (not on last) */}
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 z-10">
                    <ArrowRight size={20} className="text-blue-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ CTA ══════════════════ */}
      <section id="contact" className="mx-auto w-full max-w-7xl px-5 py-12 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 px-8 py-14 text-center shadow-2xl sm:px-14 sm:py-20">
          {/* decorative */}
          <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-blue-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-indigo-500/15 blur-3xl" />

          <div className="relative z-10 space-y-6">
            <h2 className="text-3xl font-black text-white sm:text-4xl">{t('home.ctaTitle')}</h2>
            <p className="mx-auto max-w-xl text-base font-medium text-blue-100/80">{t('home.ctaDesc')}</p>
            <div className="flex flex-col items-center justify-center gap-4 pt-2 sm:flex-row">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-sm font-bold text-slate-900 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                {t('home.ctaBtn')}
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-6 py-4 text-sm font-bold text-white transition hover:bg-white/10"
              >
                {t('home.ctaLogin')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ LOCATE VEHICLE SECTION ══════════════════ */}
      <LocateVehicle />

      {/* ══════════════════ FOOTER ══════════════════ */}
      <AppFooter />
    </div>
  );
};

export default Home;
