import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Lock,
  Mail,
  Phone,
  Save,
  ShieldAlert,
  Sparkles,
  User,
  UserCheck,
  X
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast as message } from '../components/ToastProvider';
import { updateProfile } from '../services/authService';

const getUserValue = (user, ...keys) => {
  for (const key of keys) {
    const value = user?.[key];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return '';
};

const normalizeProfile = (user) => ({
  username: getUserValue(user, 'email', 'Email'),
  fullName: getUserValue(user, 'username', 'Username'),
  email: getUserValue(user, 'email', 'Email'),
  phoneNumber: getUserValue(user, 'phoneNumber', 'PhoneNumber', 'phone', 'Phone')
});

const getErrorMessage = (error, fallback) => (
  error?.response?.data?.error
  || error?.response?.data?.message
  || error?.response?.data?.title
  || (typeof error?.response?.data === 'string' ? error.response.data : null)
  || error?.message
  || (typeof error === 'string' ? error : null)
  || fallback
);

const Settings = () => {
  const { t } = useTranslation();
  const { user, role, updateUser } = useAuth();
  const isAdmin = String(role || '').toLowerCase() === 'admin';

  const initialProfile = useMemo(() => normalizeProfile(user), [user]);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setUsername(initialProfile.username);
    setFullName(initialProfile.fullName);
    setEmail(initialProfile.email);
    setPhoneNumber(initialProfile.phoneNumber);
    setOldPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setShowPasswordSection(false);
    setErrors({});
  }, [initialProfile]);

  const handleTogglePasswordSection = () => {
    setShowPasswordSection(prev => {
      const next = !prev;
      if (!next) {
        setOldPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setShowPasswords(false);
        setErrors(prevErrors => {
          const { oldPassword, newPassword, confirmNewPassword, ...rest } = prevErrors;
          return rest;
        });
      }
      return next;
    });
  };

  const inputClass = 'h-12 w-full rounded-[14px] border-[1.5px] border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-semibold text-slate-900 transition-all placeholder:text-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-600/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-800';
  const passwordInputClass = 'h-12 w-full rounded-[14px] border-[1.5px] border-slate-200 bg-white pl-12 pr-4 text-sm font-semibold text-slate-900 transition-all placeholder:text-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-600/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500';
  const disabledInputClass = 'h-12 w-full cursor-not-allowed select-none rounded-[14px] border-[1.5px] border-slate-200 bg-slate-100 pl-12 pr-4 text-sm font-semibold text-slate-500 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500';
  const labelClass = 'block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500';
  const iconClass = 'absolute left-4 top-1/2 -translate-y-1/2 text-slate-400';

  const validateForm = () => {
    const nextErrors = {};
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phoneNumber.trim();

    if (trimmedName.length > 100) {
      nextErrors.fullName = 'Họ tên không được vượt quá 100 ký tự.';
    }

    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      nextErrors.email = 'Email không đúng định dạng.';
    }

    if (trimmedPhone && !/^[0-9+\-\s()]{8,20}$/.test(trimmedPhone)) {
      nextErrors.phoneNumber = 'Số điện thoại không đúng định dạng cơ bản.';
    }

    if (showPasswordSection) {
      const wantsPasswordChange = [oldPassword, newPassword, confirmNewPassword]
        .some((value) => value.trim() !== '');

      if (wantsPasswordChange) {
        if (!oldPassword.trim()) {
          nextErrors.oldPassword = 'Vui lòng nhập mật khẩu hiện tại.';
        }

        if (newPassword.length < 6) {
          nextErrors.newPassword = 'Mật khẩu mới phải từ 6 ký tự trở lên.';
        }

        if (confirmNewPassword !== newPassword) {
          nextErrors.confirmNewPassword = 'Xác nhận mật khẩu mới không khớp.';
        }
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      message.error('Vui lòng kiểm tra lại thông tin tài khoản.');
      return;
    }

    try {
      const payload = {
        username: fullName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim()
      };

      const wantsPasswordChange = showPasswordSection && [oldPassword, newPassword, confirmNewPassword]
        .some((value) => value.trim() !== '');

      if (wantsPasswordChange) {
        payload.oldPassword = oldPassword;
        payload.newPassword = newPassword;
      }

      const result = await updateProfile(payload);

      if (updateUser) {
        updateUser({
          username: fullName.trim(),
          email: email.trim(),
          phoneNumber: phoneNumber.trim()
        });
      }

      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setErrors({});
      if (wantsPasswordChange) {
        setShowPasswordSection(false);
      }
      message.success(result?.message || (wantsPasswordChange
        ? 'Cập nhật hồ sơ và đổi mật khẩu thành công!'
        : 'Cập nhật thông tin cá nhân thành công!'));
    } catch (err) {
      console.error(err);
      message.error(getErrorMessage(err, 'Đã xảy ra lỗi khi lưu thông tin.'));
    }
  };

  const handleCancelChanges = () => {
    setFullName(initialProfile.fullName);
    setEmail(initialProfile.email);
    setPhoneNumber(initialProfile.phoneNumber);
    setOldPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setShowPasswordSection(false);
    setErrors({});
    message.info('Đã hủy bỏ các thay đổi.');
  };

  return (
    <div className="relative mx-auto max-w-4xl space-y-6 font-sans">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          Cài đặt tài khoản
        </h1>
        <p className="mt-1 text-sm text-slate-550 dark:text-slate-400 font-medium">
          Quản lý thông tin cá nhân và thiết lập bảo mật của bạn
        </p>
      </div>

      <div className="w-full">
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 dark:border-slate-700 sm:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-[0_12px_24px_-10px_rgba(79,70,229,0.7)]">
                <UserCheck size={20} />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                  Thông tin cá nhân
                </h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Cập nhật các thông tin cơ bản về tài khoản
                </p>
              </div>
            </div>
            <Sparkles size={18} className="text-indigo-600" />
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-6 p-6 sm:p-8">
            {!user && (
              <div className="flex items-start gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
                <ShieldAlert size={18} className="mt-0.5 shrink-0" />
                <span>Không tải được thông tin tài khoản. Vui lòng đăng nhập lại.</span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className={labelClass}>Tài khoản đăng nhập (Email)</label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input
                    type="text"
                    disabled
                    value={username}
                    placeholder="Không tải được username"
                    className={disabledInputClass}
                  />
                </div>
                <span className="block pl-1 text-[11px] font-medium text-slate-400 dark:text-slate-500">
                  Tên đăng nhập bằng Email không thể thay đổi
                </span>
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>{t('settings.labelFullName')}</label>
                <div className="relative">
                  <User size={18} className={iconClass} />
                  <input
                    type="text"
                    maxLength={100}
                    placeholder={t('settings.phFullName')}
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    className={inputClass}
                  />
                </div>
                {errors.fullName && <p className="pl-1 text-xs font-semibold text-rose-600">{errors.fullName}</p>}
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>{t('settings.labelEmail')}</label>
                <div className="relative">
                  <Mail size={18} className={iconClass} />
                  <input
                    type="email"
                    placeholder={t('settings.phEmail')}
                    value={email}
                    disabled={!isAdmin}
                    onChange={(event) => setEmail(event.target.value)}
                    className={!isAdmin ? disabledInputClass : inputClass}
                  />
                </div>
                {errors.email && <p className="pl-1 text-xs font-semibold text-rose-600">{errors.email}</p>}
                {!isAdmin && (
                  <span className="block pl-1 text-[11px] font-medium text-slate-400 dark:text-slate-500">
                    Chỉ Quản trị viên (Admin) mới có quyền đổi Email
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>{t('settings.labelPhone')}</label>
                <div className="relative">
                  <Phone size={18} className={iconClass} />
                  <input
                    type="text"
                    placeholder={t('settings.phPhone')}
                    value={phoneNumber}
                    disabled={!isAdmin}
                    onChange={(event) => setPhoneNumber(event.target.value)}
                    className={!isAdmin ? disabledInputClass : inputClass.replace('text-sm font-semibold', 'font-mono text-sm font-bold')}
                  />
                </div>
                {errors.phoneNumber && <p className="pl-1 text-xs font-semibold text-rose-600">{errors.phoneNumber}</p>}
                {!isAdmin && (
                  <span className="block pl-1 text-[11px] font-medium text-slate-400 dark:text-slate-500">
                    Chỉ Quản trị viên (Admin) mới có quyền đổi Số điện thoại
                  </span>
                )}
              </div>
            </div>

            {!showPasswordSection ? (
              <div className="rounded-2xl border border-slate-150 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/40">
                <button
                  type="button"
                  onClick={handleTogglePasswordSection}
                  className="flex w-full items-center justify-between text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-white text-indigo-600 shadow-sm border border-slate-100 dark:bg-slate-900 dark:text-indigo-300 dark:border-slate-800">
                      <Lock size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 transition-colors">
                        Thay đổi mật khẩu
                      </h3>
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                        Cập nhật mật khẩu đăng nhập tài khoản
                      </p>
                    </div>
                  </div>
                  <div className="text-xs font-bold text-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100/50 dark:border-indigo-900/30 px-3.5 py-2 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    Thay đổi
                  </div>
                </button>
              </div>
            ) : (
              <div className="space-y-4 rounded-2xl border border-slate-150 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/45 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-white text-indigo-600 shadow-sm border border-slate-100 dark:bg-slate-900 dark:text-indigo-300 dark:border-slate-800">
                      <Lock size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                        Thay đổi mật khẩu tài khoản
                      </h3>
                      <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500 font-medium">
                        Cập nhật mật khẩu đăng nhập tài khoản
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowPasswords((prev) => !prev)}
                      className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-[11px] font-extrabold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      {showPasswords ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    </button>
                    <button
                      type="button"
                      onClick={handleTogglePasswordSection}
                      className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-[11px] font-extrabold text-slate-500 hover:text-rose-600 hover:border-rose-200 transition-colors dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
                    >
                      Đóng lại
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className={labelClass}>Mật khẩu hiện tại</label>
                      <Link to="/forgot-password" className="text-[10px] font-extrabold text-indigo-600 hover:underline">
                        Quên mật khẩu?
                      </Link>
                    </div>
                    <div className="relative">
                      <Lock size={18} className={iconClass} />
                      <input
                        type={showPasswords ? 'text' : 'password'}
                        autoComplete="current-password"
                        value={oldPassword}
                        onChange={(event) => setOldPassword(event.target.value)}
                        className={passwordInputClass}
                      />
                    </div>
                    {errors.oldPassword && <p className="pl-1 text-xs font-semibold text-rose-600">{errors.oldPassword}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className={labelClass}>Mật khẩu mới</label>
                    <div className="relative">
                      <Lock size={18} className={iconClass} />
                      <input
                        type={showPasswords ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                        className={passwordInputClass}
                      />
                    </div>
                    {errors.newPassword && <p className="pl-1 text-xs font-semibold text-rose-600">{errors.newPassword}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className={labelClass}>Xác nhận mật khẩu mới</label>
                    <div className="relative">
                      <Lock size={18} className={iconClass} />
                      <input
                        type={showPasswords ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={confirmNewPassword}
                        onChange={(event) => setConfirmNewPassword(event.target.value)}
                        className={passwordInputClass}
                      />
                    </div>
                    {errors.confirmNewPassword && <p className="pl-1 text-xs font-semibold text-rose-600">{errors.confirmNewPassword}</p>}
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col-reverse items-center gap-3 border-t border-slate-100 pt-5 dark:border-slate-700 sm:flex-row">
              <button
                type="button"
                onClick={handleCancelChanges}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-slate-200 bg-white px-6 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 sm:w-auto"
              >
                <X size={16} />
                Hủy thay đổi
              </button>

              <button
                type="submit"
                className="flex h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-gradient-to-br from-indigo-500 to-indigo-600 px-8 text-sm font-bold text-white shadow-[0_12px_24px_-10px_rgba(79,70,229,0.7)] transition-all hover:-translate-y-0.5 sm:w-auto"
              >
                <Save size={16} />
                Lưu thay đổi
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;
