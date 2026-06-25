import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Building2, ArrowRight, Languages } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useTranslation } from 'react-i18next';

const Login = () => {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Điều hướng theo vai trò sau khi đăng nhập (giữ nguyên logic cũ)
  const redirectByRole = (userRole) => {
    if (userRole === 'Admin') {
      navigate('/accounts');
    } else if (userRole === 'Manager') {
      navigate('/dashboard');
    } else if (userRole === 'Staff') {
      navigate('/checkin-checkout');
    } else {
      navigate('/parking-map');
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!usernameOrEmail || !password) {
      setErrorMsg(t('login.errorEmptyFields'));
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const res = await login(usernameOrEmail, password);
    setLoading(false);

    if (res.success) {
      localStorage.setItem('spotflow_guest_isAuthenticated', 'true');
      redirectByRole(res.user.role);
    } else {
      setErrorMsg(res.message || t('login.errorAuth'));
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setErrorMsg('');

    const res = await loginWithGoogle(credentialResponse.credential);
    setLoading(false);

    if (res.success) {
      redirectByRole(res.user.role);
    } else {
      setErrorMsg(res.message || t('login.errorGoogleAuth'));
    }
  };

  const handleGoogleError = () => {
    setErrorMsg(t('login.errorGoogleLogin'));
  };

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'vi' ? 'en' : 'vi');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-4 sm:p-6 font-sans selection:bg-indigo-100">
      <div className="grid w-full max-w-[1040px] grid-cols-1 overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-[0_30px_80px_-30px_rgba(15,23,42,0.25)] lg:grid-cols-[1.05fr_0.95fr] lg:min-h-[620px]">

        {/* ============ Brand panel (trái) ============ */}
        <div className="relative hidden flex-col justify-between overflow-hidden p-12 text-white lg:flex"
             style={{ background: 'radial-gradient(120% 120% at 0% 0%, #6366f1 0%, #4f46e5 45%, #3730a3 100%)' }}>
          {/* Vòng tròn trang trí */}
          <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-white/[0.06]" />
          <div className="pointer-events-none absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-white/[0.08]" />

          <div className="relative z-10 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[13px] border border-white/25 bg-white/[0.16] backdrop-blur-sm">
              <Building2 size={22} strokeWidth={2.2} />
            </div>
            <h2 className="text-[15px] font-bold leading-tight tracking-wide">{t('login.brandName')}</h2>
          </div>

          <div className="relative z-10">
            <span className="mb-5 inline-block rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[1.5px]">
              {t('login.brandTagline')}
            </span>
            <h1 className="mb-4 max-w-[320px] text-[34px] font-extrabold leading-[1.2]">
              {t('login.brandTitle')}
            </h1>
            <p className="max-w-[330px] text-sm leading-[1.7] text-white/80">
              {t('login.brandDesc')}
            </p>
          </div>

          <div className="relative z-10 flex gap-7">
            <div>
              <div className="text-2xl font-extrabold">1.2K+</div>
              <div className="text-[11px] font-semibold tracking-wide text-white/75">{t('login.statVehicles')}</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold">98%</div>
              <div className="text-[11px] font-semibold tracking-wide text-white/75">{t('login.statOccupancy')}</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold">24/7</div>
              <div className="text-[11px] font-semibold tracking-wide text-white/75">{t('login.statMonitor')}</div>
            </div>
          </div>
        </div>

        {/* ============ Form panel (phải) ============ */}
        <div className="relative flex flex-col justify-center px-7 py-12 sm:px-14">

          {/* Chuyển ngôn ngữ */}
          <button
            type="button"
            onClick={toggleLanguage}
            className="absolute right-6 top-6 flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-500 transition-colors hover:bg-slate-100"
            title={i18n.language === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
          >
            <Languages size={14} />
            <span className="text-indigo-600">{i18n.language.toUpperCase()}</span>
          </button>

          <div className="mb-8">
            <h3 className="text-[26px] font-extrabold tracking-tight text-slate-900">{t('login.welcomeTitle')}</h3>
            <p className="mt-1.5 text-sm text-slate-500">{t('login.subtitle')}</p>
          </div>

          {/* Thông báo lỗi */}
          {errorMsg && (
            <div className="mb-5 flex items-center gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-[18px]">
            {/* Email / username */}
            <div>
              <label className="mb-2 block text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                {t('login.emailPlaceholder')}
              </label>
              <div className="relative">
                <Mail size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={t('login.emailPlaceholder')}
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  disabled={loading}
                  className="h-[52px] w-full rounded-[14px] border-[1.5px] border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition-all placeholder:font-normal placeholder:text-slate-400 focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-600/10 disabled:opacity-60"
                />
              </div>
            </div>

            {/* Mật khẩu */}
            <div>
              <label className="mb-2 block text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                {t('login.passwordPlaceholder')}
              </label>
              <div className="relative">
                <Lock size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('login.passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="h-[52px] w-full rounded-[14px] border-[1.5px] border-slate-200 bg-slate-50 pl-11 pr-11 text-sm font-medium text-slate-900 outline-none transition-all placeholder:font-normal placeholder:text-slate-400 focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-600/10 disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-indigo-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Quên mật khẩu */}
            <div className="flex justify-end">
              <a href="#" className="text-[13px] font-bold text-indigo-600 transition-colors hover:text-indigo-700">
                {t('login.forgotPassword')}
              </a>
            </div>

            {/* Nút đăng nhập */}
            <button
              type="submit"
              disabled={loading}
              className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[14px] bg-gradient-to-br from-indigo-500 to-indigo-600 text-[15px] font-bold text-white shadow-[0_12px_24px_-10px_rgba(79,70,229,0.7)] transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_30px_-10px_rgba(79,70,229,0.75)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  {t('login.loginButton')}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3.5 text-xs font-semibold text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            {t('login.orContinueWith')}
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          {/* Đăng nhập Google */}
          <div className="relative">
            <button
              type="button"
              className="flex h-[50px] w-full items-center justify-center gap-2.5 rounded-[14px] border-[1.5px] border-slate-200 bg-white text-sm font-bold text-slate-700 transition-all hover:border-slate-400 hover:bg-slate-50"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>
            {/* GoogleLogin thật phủ trong suốt lên nút để giữ nguyên luồng xác thực */}
            <div className="absolute inset-0 cursor-pointer opacity-[0.001]">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                width="100%"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="mt-7 text-center text-[13px] text-slate-500">
            {t('login.noAccount')}{' '}
            <Link to="/register" className="font-bold text-indigo-600 transition-colors hover:text-indigo-700">
              {t('login.register')}
            </Link>
            <Link
              to="/parking-map"
              onClick={() => localStorage.setItem('spotflow_guest_isAuthenticated', 'true')}
              className="mt-3 block font-semibold text-slate-400 underline decoration-slate-300 underline-offset-4 transition-colors hover:text-indigo-600"
            >
              {t('login.continueAsGuest')}
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;
