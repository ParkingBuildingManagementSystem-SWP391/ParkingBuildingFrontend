import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Mail, Phone, Eye, EyeOff, AlertCircle, Building2, ShieldCheck, Sparkles, ArrowLeft } from 'lucide-react';
import { authService } from '../services/authService';
import { GoogleLogin } from '@react-oauth/google';
import { useTranslation } from 'react-i18next';

const Register = () => {
  const { loginWithUserData, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Multi-step state: 1 = Register Info, 2 = OTP Verification
  const [step, setStep] = useState(1);

  // Step 1 Form States
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(''); // Optional
  const [showPassword, setShowPassword] = useState(false);

  // Step 2 OTP State
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const otpInputsRef = useRef([]);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleOtpChange = (index, val) => {
    if (isNaN(val)) return;

    const newValues = [...otpValues];
    newValues[index] = val.slice(-1);
    setOtpValues(newValues);
    setErrorMsg('');

    if (val !== '' && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (otpValues[index] === '' && index > 0) {
        const newValues = [...otpValues];
        newValues[index - 1] = '';
        setOtpValues(newValues);
        otpInputsRef.current[index - 1]?.focus();
      } else {
        const newValues = [...otpValues];
        newValues[index] = '';
        setOtpValues(newValues);
      }
      setErrorMsg('');
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!username || !email || !password) {
      setErrorMsg(t('register.errorEmptyFields'));
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      await authService.register({
        username,
        email,
        password,
        phoneNumber: phoneNumber || null
      });

      // Success -> Move to OTP Step
      setStep(2);
      setLoading(false);
    } catch (err) {
      console.error("Register err:", err);
      setErrorMsg(err.message || t('register.errorRegister'));
      setLoading(false);
    }
  };

  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    const otpString = otpValues.join('');
    if (otpString.length < 6) {
      setErrorMsg(t('register.errorOtpFormat'));
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const verifyRes = await authService.verifyEmail(email, otpString);

      if (verifyRes) {
        const loginRes = await authService.login(email, password);

        loginWithUserData(loginRes.user);
        localStorage.setItem('token', loginRes.token);
        localStorage.setItem('spotflow_guest_isAuthenticated', 'true');

        navigate('/parking-map');
      }
    } catch (err) {
      console.error("OTP Verify err:", err);
      setErrorMsg(err.message || t('register.errorOtpVerify'));
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setErrorMsg('');

    const res = await loginWithGoogle(credentialResponse.credential);
    setLoading(false);

    if (res.success) {
      if (res.user.role === 'Admin') {
        navigate('/accounts');
      } else if (res.user.role === 'Manager') {
        navigate('/dashboard');
      } else if (res.user.role === 'Staff') {
        navigate('/checkin-checkout');
      } else {
        navigate('/parking-map');
      }
    } else {
      setErrorMsg(res.message || t('register.errorGoogleAuth'));
    }
  };

  const handleGoogleError = () => {
    setErrorMsg(t('register.errorGoogleLogin'));
  };

  return (
    <div className="flex min-h-dvh w-full overflow-y-auto bg-slate-50 font-sans dark:bg-slate-950 lg:h-dvh lg:overflow-hidden">

      {/* Left Brand / Gradient Panel */}
      <div
        className="relative hidden overflow-hidden text-white lg:flex lg:h-dvh lg:w-1/2 lg:flex-col lg:justify-between lg:p-8 xl:p-10"
        style={{ background: 'radial-gradient(120% 120% at 0% 0%, #6366f1 0%, #4f46e5 45%, #3730a3 100%)' }}
      >
        {/* Faint decorative circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute top-1/3 -right-32 w-[28rem] h-[28rem] rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-32 left-1/4 w-80 h-80 rounded-full bg-white/10 pointer-events-none" />

        {/* Brand */}
        <Link to="/" aria-label="Về trang chủ" className="relative z-10 flex items-center gap-3 rounded-xl transition-opacity hover:opacity-80">
          <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
            <Building2 size={24} className="text-white" />
          </div>
          <span className="text-xl font-extrabold tracking-tight">{t('register.brandName')}</span>
        </Link>

        {/* Hero copy */}
        <div className="relative z-10 max-w-md">
          <h2 className="mb-3 text-3xl font-extrabold leading-tight tracking-tight xl:text-4xl">
            {t('register.heroTitle')}
          </h2>
          <p className="text-white/70 text-base leading-relaxed">
            {t('register.heroSubtitle')}
          </p>

          <div className="mt-7 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                <ShieldCheck size={20} className="text-white" />
              </div>
              <span className="text-sm font-medium text-white/85">{t('register.heroFeatureSecure')}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                <Sparkles size={20} className="text-white" />
              </div>
              <span className="text-sm font-medium text-white/85">{t('register.heroFeatureSmart')}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-xs text-white/50 font-medium">
          {t('register.brandTagline')}
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex min-h-dvh min-w-0 flex-1 items-center justify-center overflow-y-auto p-4 lg:h-dvh lg:min-h-0 lg:overflow-hidden lg:p-6">
        <div className="w-full max-w-[440px] rounded-[20px] border border-slate-100 bg-white p-5 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.25)] dark:border-slate-800 dark:bg-slate-900 sm:p-7 lg:max-h-[calc(100dvh-32px)] lg:overflow-y-auto">

          {step === 1 && (
            <>
              <div className="mb-5">
                <h1 className="mb-2 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">{t('register.title')}</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">{t('register.subtitle')}</p>
              </div>

              {errorMsg && (
                <div className="mb-4 flex min-w-0 items-center gap-2 rounded-[14px] border border-rose-100 bg-rose-50 px-4 py-2.5 text-sm text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
                  <AlertCircle size={16} />
                  <span className="font-medium">{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="space-y-3">

                <div className="flex flex-col">
                  <label className="mb-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">{t('register.usernamePlaceholder')}</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                      <User size={18} />
                    </div>
                    <input
                      type="text"
                      placeholder={t('register.usernamePlaceholder')}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={loading}
                      className="h-[46px] w-full rounded-[14px] border-[1.5px] border-slate-200 bg-slate-50 pl-12 pr-4 text-sm text-slate-900 outline-none transition-all placeholder-slate-400 focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-600/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-800"
                    />
                  </div>
                  <p className="ml-1 mt-1 text-[11px] font-medium tracking-wide text-slate-400 dark:text-slate-500">{t('register.usernameHint')}</p>
                </div>

                <div className="flex flex-col">
                  <label className="mb-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">{t('register.emailPlaceholder')}</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      placeholder={t('register.emailPlaceholder')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      className="h-[46px] w-full rounded-[14px] border-[1.5px] border-slate-200 bg-slate-50 pl-12 pr-4 text-sm text-slate-900 outline-none transition-all placeholder-slate-400 focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-600/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-800"
                    />
                  </div>
                  <p className="ml-1 mt-1 text-[11px] font-medium tracking-wide text-slate-400 dark:text-slate-500">{t('register.emailHint')}</p>
                </div>

                <div className="flex flex-col">
                  <label className="mb-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">{t('register.phonePlaceholder')}</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                      <Phone size={18} />
                    </div>
                    <input
                      type="tel"
                      placeholder={t('register.phonePlaceholder')}
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      disabled={loading}
                      className="h-[46px] w-full rounded-[14px] border-[1.5px] border-slate-200 bg-slate-50 pl-12 pr-4 text-sm text-slate-900 outline-none transition-all placeholder-slate-400 focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-600/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-800"
                    />
                  </div>
                  <p className="ml-1 mt-1 text-[11px] font-medium tracking-wide text-slate-400 dark:text-slate-500">{t('register.phoneHint')}</p>
                </div>

                <div className="flex flex-col">
                  <label className="mb-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">{t('register.passwordPlaceholder')}</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                      <Lock size={18} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder={t('register.passwordPlaceholder')}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      className="h-[46px] w-full rounded-[14px] border-[1.5px] border-slate-200 bg-slate-50 pl-12 pr-12 text-sm text-slate-900 outline-none transition-all placeholder-slate-400 focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-600/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-indigo-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <p className="ml-1 mt-1 text-[11px] font-medium tracking-wide text-slate-400 dark:text-slate-500">{t('register.passwordHint')}</p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-1 flex h-[48px] w-full items-center justify-center rounded-[14px] bg-gradient-to-br from-indigo-500 to-indigo-600 text-[15px] font-bold text-white shadow-[0_12px_24px_-10px_rgba(79,70,229,0.7)] transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : t('register.signUpButton')}
                </button>
              </form>

              {/* Divider */}
              <div className="relative mb-4 mt-5 flex items-center justify-center">
                <div className="absolute h-px w-full bg-slate-100 dark:bg-slate-800"></div>
                <span className="relative bg-white px-4 text-xs font-medium text-slate-400 dark:bg-slate-900 dark:text-slate-500">{t('register.orContinueWith')}</span>
              </div>

              {/* Social Buttons */}
              <div className="mb-4 flex justify-center">
                {/* Custom Google Button Wrapper */}
                <div className="relative flex h-[48px] w-full cursor-pointer items-center justify-center gap-3 rounded-[14px] border-[1.5px] border-slate-200 bg-white transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700">
                  <div className="absolute inset-0 z-10 opacity-[0.01] flex items-center justify-center cursor-pointer">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={handleGoogleError}
                      type="icon"
                      shape="circle"
                    />
                  </div>
                  {/* Visual Icon */}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span className="relative text-sm font-bold text-slate-700 dark:text-slate-200">{t('register.googleButton')}</span>
                </div>
              </div>

              <div className="text-center">
                <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400">{t('register.alreadyHaveAccount')} </span>
                <Link to="/login" className="text-[13px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors tracking-wide">
                  {t('register.logIn')}
                </Link>
              </div>
            </>
          )}

          {step === 2 && (
            <div className="flex flex-col items-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                <Mail size={32} />
              </div>

              <h1 className="mb-2 text-center text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">{t('register.verifyEmailTitle')}</h1>
              <p className="mb-8 text-center text-sm text-slate-500 dark:text-slate-400">
                {t('register.verifyEmailDesc')} <br/> <span className="break-all font-bold text-slate-900 dark:text-slate-100">{email}</span>
              </p>

              {errorMsg && (
                <div className="mb-6 flex w-full min-w-0 items-center gap-2 rounded-[14px] border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
                  <AlertCircle size={16} />
                  <span className="font-medium">{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleVerifyOtpSubmit} className="w-full flex flex-col items-center">
                <div className="mb-8 flex w-full justify-center gap-1.5 sm:gap-3">
                  {otpValues.map((val, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpInputsRef.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={val}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      disabled={loading}
                      className="h-11 w-9 rounded-[12px] border-[1.5px] border-slate-200 bg-slate-50 text-center text-lg font-bold text-slate-900 outline-none transition-all focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-600/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-800 sm:h-14 sm:w-12 sm:rounded-[14px] sm:text-xl"
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={loading || otpValues.join('').length < 6}
                  className="w-full h-[52px] rounded-[14px] bg-gradient-to-br from-indigo-500 to-indigo-600 text-white font-bold text-[15px] shadow-[0_12px_24px_-10px_rgba(79,70,229,0.7)] hover:-translate-y-0.5 transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : t('register.verifyLoginButton')}
                </button>
              </form>

              <button
                onClick={() => setStep(1)}
                disabled={loading}
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft size={16} />
                {t('register.backToSignUp')}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Register;
