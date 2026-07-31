import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, Key, ArrowLeft } from 'lucide-react';
import { forgotPassword, resetPassword } from '../services/authService';
import { toast as message } from '../components/ToastProvider';

const getErrorMessage = (error, fallback) => (
  error?.response?.data?.error
  || error?.response?.data?.message
  || error?.response?.data?.title
  || (typeof error?.response?.data === 'string' ? error.response.data : null)
  || error?.message
  || (typeof error === 'string' ? error : null)
  || fallback
);

const ForgotPassword = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [step, setStep] = useState(1); // Bước 1: nhập email, Bước 2: nhập OTP và mật khẩu mới
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Yêu cầu OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!email.trim()) return message.error(t('forgotPassword.errorEmailRequired'));

    setLoading(true);
    try {
      const data = await forgotPassword(email.trim());
      message.success(data.message || t('forgotPassword.otpSentSuccess'));
      setStep(2); // Chuyển sang bước nhập OTP
    } catch (err) {
      message.error(getErrorMessage(err, t('forgotPassword.errorSendFailed')));
    } finally {
      setLoading(false);
    }
  };

  // Đặt lại mật khẩu
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!otpCode.trim()) return message.error(t('forgotPassword.errorOtpRequired'));
    if (newPassword.length < 6) return message.error(t('forgotPassword.errorPasswordTooShort'));
    if (newPassword !== confirmPassword) return message.error(t('forgotPassword.errorPasswordMismatch'));

    setLoading(true);
    try {
      const data = await resetPassword(email.trim(), otpCode.trim(), newPassword);
      message.success(data.message || t('forgotPassword.resetSuccess'));
      navigate('/login'); // Chuyển hướng về trang đăng nhập
    } catch (err) {
      message.error(getErrorMessage(err, t('forgotPassword.errorResetFailed')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl p-8 shadow-md border border-slate-100">
        <button 
          onClick={() => navigate('/login')} 
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 mb-6"
        >
          <ArrowLeft size={14} /> {t('forgotPassword.backToLogin')}
        </button>

        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">{t('forgotPassword.title')}</h2>
        <p className="text-sm text-slate-500 mb-6">
          {step === 1
            ? t('forgotPassword.step1Desc')
            : t('forgotPassword.step2Desc')}
        </p>

        {step === 1 ? (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">{t('forgotPassword.emailLabel')}</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('forgotPassword.emailPlaceholder')}
                  className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl text-sm transition-all hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? t('forgotPassword.sending') : t('forgotPassword.sendOtpBtn')}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            {/* Mã OTP */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">{t('forgotPassword.otpLabel')}</label>
              <div className="relative">
                <Key size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="123456"
                  className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            {/* Mật khẩu mới */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">{t('forgotPassword.newPasswordLabel')}</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            {/* Xác nhận mật khẩu */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">{t('forgotPassword.confirmPasswordLabel')}</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl text-sm transition-all hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? t('forgotPassword.updating') : t('forgotPassword.confirmBtn')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
