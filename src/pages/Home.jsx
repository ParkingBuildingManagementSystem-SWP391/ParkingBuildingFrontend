import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronDown, LogOut, Settings, Map, Zap, ShieldCheck, CreditCard,
  Search, CalendarCheck, CarFront, ArrowRight, Star, Users, Clock, Activity,
  Sun, Moon, Languages
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AppFooter from '../components/AppFooter';
import Logo from '../components/Logo';
import heroImage from '../assets/logo/parking-hero.png';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
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
  const { t, i18n } = useTranslation();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const userMenuRef = useRef(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const displayName = user?.fullName || user?.name || user?.username || user?.email || t('home.defaultAccount');
  const displayRole = user?.role || user?.userRole || user?.roles?.[0] || role || t('header.userRole');

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

  const toggleLanguage = () => {
    const newLang = i18n.language === 'vi' ? 'en' : 'vi';
    i18n.changeLanguage(newLang);
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
    <div className="flex min-h-screen w-full max-w-full flex-col overflow-x-hidden bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
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
      <header className="sticky top-0 z-50 w-full max-w-full border-b border-slate-100 bg-white/80 backdrop-blur-xl transition-colors duration-300 dark:border-slate-800 dark:bg-slate-950/85">
        <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between gap-2 px-4 sm:gap-3 sm:px-6 lg:px-8">
          <Link to="/" className="flex min-w-0 flex-1 items-center">
            <Logo className="max-w-[210px] sm:max-w-[250px]" />
          </Link>

          <nav className="hidden items-center gap-8 text-[13px] font-bold text-slate-500 dark:text-slate-300 md:flex">
            <Link className="text-indigo-600" to="/">{t('home.navHome')}</Link>
            <Link className="transition-colors hover:text-indigo-600 dark:hover:text-indigo-300" to="/parking-map">{t('home.navBook')}</Link>
            <a className="transition-colors text-indigo-600 hover:text-indigo-700 flex items-center gap-1" href="/#locate-vehicle">
              <Search size={14} /> {t('home.navLocate')}
            </a>
            <Link className="transition-colors hover:text-indigo-600 dark:hover:text-indigo-300" to="/pricing">{t('home.navPricing')}</Link>
            <a   className="transition-colors hover:text-indigo-600 dark:hover:text-indigo-300" href="#contact">{t('home.navContact')}</a>
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border-[1.5px] border-slate-200 bg-white text-amber-500 shadow-sm transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
              aria-label={t('home.toggleTheme')}
              title={t('home.toggleTheme')}
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button
              type="button"
              onClick={toggleLanguage}
              className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border-[1.5px] border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              aria-label={t('home.toggleLanguage')}
              title={t('home.toggleLanguage')}
            >
              <Languages size={18} />
              <span className="absolute -bottom-1 -right-1 rounded-sm border border-white bg-indigo-100 px-1 text-[9px] font-bold text-indigo-700 dark:border-slate-900 dark:bg-indigo-500/20 dark:text-indigo-200">
                {i18n.language.toUpperCase()}
              </span>
            </button>

            <Link
              to="/parking-map"
              className="hidden shrink-0 rounded-[14px] bg-gradient-to-br from-indigo-500 to-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-[0_12px_24px_-10px_rgba(79,70,229,0.7)] transition-all hover:-translate-y-0.5 sm:inline-flex"
            >
              {t('home.btnBook')}
            </Link>

            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen((p) => !p)}
                  className="flex min-w-0 items-center gap-2 rounded-[14px] border-[1.5px] border-slate-200 bg-white px-2.5 py-2 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 sm:gap-2.5 sm:px-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 text-xs font-black text-white">
                    {getInitials(displayName)}
                  </div>
                  <div className="hidden leading-tight sm:block">
                    <p className="max-w-[120px] truncate text-sm font-bold text-slate-900 dark:text-slate-100">{displayName}</p>
                    <p className="max-w-[120px] truncate text-[11px] font-semibold text-slate-400 dark:text-slate-400">{displayRole}</p>
                  </div>
                  <ChevronDown size={14} className={`text-slate-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-52 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-100 bg-white py-1 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                    <Link to="/settings" onClick={() => setIsUserMenuOpen(false)}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800">
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
                className="shrink-0 rounded-[14px] border-[1.5px] border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 sm:px-4"
              >
                {t('home.btnLogin')}
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ══════════════════ HERO ══════════════════ */}
      <section className="relative w-full max-w-full overflow-hidden">
        {/* decorative blobs */}
        <div className="pointer-events-none absolute left-1/2 top-[-8rem] h-72 w-72 -translate-x-1/2 rounded-full bg-indigo-400/10 blur-3xl dark:bg-indigo-500/15 sm:-left-32 sm:top-[-8rem] sm:h-[500px] sm:w-[500px] sm:translate-x-0" />
        <div className="pointer-events-none absolute bottom-[-8rem] right-[-6rem] h-80 w-80 rounded-full bg-indigo-400/10 blur-3xl dark:bg-violet-500/15 sm:-bottom-40 sm:-right-40 sm:h-[600px] sm:w-[600px]" />

        <div className="relative mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-10 px-4 py-16 sm:px-6 md:py-20 lg:grid-cols-2 lg:gap-14 lg:px-8 lg:py-24">
          {/* ── text ── */}
          <div className="min-w-0 max-w-2xl anim-fade-up">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-600 dark:border-indigo-400/20 dark:bg-indigo-500/10 dark:text-indigo-300">
              <Star size={15} className="text-amber-500" />
              {t('home.badge')}
            </div>

            <h1 className="mb-6 max-w-2xl break-words pb-2 text-4xl font-extrabold leading-[1.1] tracking-tight md:text-5xl lg:text-6xl xl:text-6xl">
              <span className="block pb-1 text-slate-900 dark:text-slate-50">{t('home.hero1')}</span>
              <span className="block pb-1 bg-gradient-to-r from-indigo-500 to-indigo-600 bg-clip-text text-transparent">{t('home.hero2')}</span>
            </h1>

            <p className="max-w-xl text-base leading-relaxed text-slate-500 font-medium dark:text-slate-300 md:text-lg">
              {t('home.heroDesc')}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/parking-map"
                className="group inline-flex w-full items-center justify-center gap-2 rounded-[14px] bg-gradient-to-br from-indigo-500 to-indigo-600 px-7 py-4 text-sm font-bold text-white shadow-[0_12px_24px_-10px_rgba(79,70,229,0.7)] transition-all hover:-translate-y-0.5 sm:w-auto"
              >
                {t('home.btnBook')}
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/parking-map"
                className="inline-flex w-full items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-slate-200 bg-white px-7 py-4 text-sm font-bold text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 sm:w-auto"
              >
                {t('home.btnViewMap')}
              </Link>
            </div>
          </div>

          {/* ── image ── */}
          <div className="relative mx-auto w-full max-w-xl overflow-hidden rounded-3xl anim-fade-up delay-2 lg:max-w-none">
            <div className="relative overflow-hidden rounded-3xl shadow-2xl shadow-indigo-950/15 ring-1 ring-slate-200/60 dark:ring-slate-700">
              <img
                src={heroImage}
                alt={t('home.altHeroImg')}
                className="h-auto w-full max-w-full object-cover sm:h-[380px] lg:h-[430px]"
              />
              {/* overlay gradient */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/30 via-transparent to-transparent" />
            </div>

            {/* floating stat card */}
            <div className="anim-float absolute bottom-3 left-3 max-w-[calc(100%-24px)] rounded-2xl border border-slate-100 bg-white/95 px-4 py-3 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 sm:bottom-6 sm:left-6 sm:px-5 sm:py-4">
              <p className="text-2xl font-extrabold text-indigo-600 leading-none sm:text-3xl">
                <AnimatedNumber target="1500" suffix="+" />
              </p>
              <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-300 sm:text-sm">{t('home.statSlotsLabel')}</p>
            </div>

            {/* floating badge top-right */}
            <div className="anim-float absolute right-3 top-3 flex max-w-[calc(100%-24px)] items-center gap-2 rounded-xl border border-slate-100 bg-white/95 px-3 py-2 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 sm:right-6 sm:top-6 sm:px-4 sm:py-2.5" style={{ animationDelay: '1s' }}>
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" style={{ animation: 'pulse-ring 2s infinite' }} />
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{t('home.online')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ STATS BAR ══════════════════ */}
      <section className="relative mx-auto mb-8 mt-[-0.5rem] w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:grid-cols-4 sm:gap-0 sm:divide-x sm:divide-slate-100 dark:sm:divide-slate-700 sm:p-0">
          {stats.map((s, i) => (
            <div key={i} className="flex flex-col items-center py-5 sm:py-6">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                <s.icon size={20} />
              </div>
              <p className="text-xl font-extrabold text-slate-900 dark:text-slate-100 sm:text-2xl">{s.value}</p>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════ FEATURES ══════════════════ */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="text-center space-y-3 mb-14">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">{t('home.featTitle')}</h2>
          <p className="mx-auto max-w-xl text-base text-slate-500 font-medium dark:text-slate-300">{t('home.featDesc')}</p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <div
              key={i}
              className={`anim-fade-up delay-${i + 1} group relative rounded-2xl border border-slate-100 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-indigo-900/5 cursor-pointer dark:border-slate-700 dark:bg-slate-900`}
            >
              <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${f.color} text-white shadow-lg shadow-indigo-600/10 transition-transform group-hover:scale-110`}>
                <f.icon size={22} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">{f.title}</h3>
              <p className="text-sm leading-relaxed text-slate-500 font-medium dark:text-slate-300">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════ HOW IT WORKS ══════════════════ */}
      <section className="w-full max-w-full overflow-hidden bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="text-center space-y-3 mb-14">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">{t('home.howTitle')}</h2>
            <p className="text-base text-slate-500 font-medium dark:text-slate-300">{t('home.howDesc')}</p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {steps.map((s, i) => (
              <div key={i} className={`anim-fade-up delay-${i + 1} relative rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900`}>
                {/* step number */}
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                  <s.icon size={26} strokeWidth={2} />
                </div>
                <span className="inline-block rounded-full bg-indigo-600 px-3 py-1 text-[11px] font-black text-white mb-3">
                  {s.num}
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">{s.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500 font-medium dark:text-slate-300">{s.desc}</p>

                {/* connector arrow (not on last) */}
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 z-10">
                    <ArrowRight size={20} className="text-indigo-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ CTA ══════════════════ */}
      <section id="contact" className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div
          className="relative max-w-full overflow-hidden rounded-3xl px-6 py-14 text-center shadow-2xl sm:px-14 sm:py-20"
          style={{ background: 'radial-gradient(120% 120% at 0% 0%, #6366f1 0%, #4f46e5 45%, #3730a3 100%)' }}
        >
          {/* decorative */}
          <div className="pointer-events-none absolute right-0 top-[-5rem] h-52 w-52 rounded-full bg-white/10 blur-3xl sm:-right-20 sm:h-64 sm:w-64" />
          <div className="pointer-events-none absolute bottom-[-4rem] left-0 h-48 w-48 rounded-full bg-white/10 blur-3xl sm:-left-16 sm:h-56 sm:w-56" />

          <div className="relative z-10 space-y-6">
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{t('home.ctaTitle')}</h2>
            <p className="mx-auto max-w-xl text-base font-medium text-indigo-100/90">{t('home.ctaDesc')}</p>
            <div className="flex flex-col items-center justify-center gap-4 pt-2 sm:flex-row">
              <Link
                to="/register"
                className="inline-flex w-full items-center justify-center gap-2 rounded-[14px] bg-white px-8 py-4 text-sm font-bold text-indigo-600 shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl sm:w-auto"
              >
                {t('home.ctaBtn')}
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/login"
                className="inline-flex w-full items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-white/30 px-6 py-4 text-sm font-bold text-white transition-all hover:bg-white/10 sm:w-auto"
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
