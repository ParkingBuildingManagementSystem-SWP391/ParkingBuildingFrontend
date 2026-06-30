import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  AlertCircle,
  Check,
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
  username: getUserValue(user, 'email', 'Email'), // Hiển thị Email đăng nhập ở ô đầu tiên bị khóa
  fullName: getUserValue(user, 'username', 'Username'), // Hiển thị Họ Tên ở ô thứ hai cho sửa
  email: getUserValue(user, 'email', 'Email'),
  phoneNumber: getUserValue(user, 'phoneNumber', 'PhoneNumber', 'phone', 'Phone')
});

const Settings = () => {
  const { t } = useTranslation();
  const { user, role, updateUser } = useAuth();
  const isAdmin = String(role || '').toLowerCase() === 'admin';

  const initialProfile = useMemo(() => normalizeProfile(user), [user]);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setUsername(initialProfile.username);
    setFullName(initialProfile.fullName);
    setEmail(initialProfile.email);
    setPhoneNumber(initialProfile.phoneNumber);
    setErrors({});
  }, [initialProfile]);

  const displayRoleName = (value) => {
    const normalizedRole = String(value || '').toLowerCase();
    if (normalizedRole === 'registered_driver' || normalizedRole === 'driver') return 'Registered Driver';
    if (normalizedRole === 'staff') return 'Parking Staff';
    if (normalizedRole === 'manager') return 'Parking Manager';
    if (normalizedRole === 'admin') return 'System Admin';
    return value || 'Không xác định';
  };

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
        username: fullName.trim(), // Giao diện 'Họ và tên' -> Backend 'username'
        email: email.trim(),
        phoneNumber: phoneNumber.trim()
      };

      // Gọi API đặt lại thông tin cá nhân của Backend
      await updateProfile(payload);

      // Cập nhật lại Auth Context ở Client để header & sidebar thay đổi tức thì
      if (updateUser) {
        updateUser({
          username: fullName.trim(),
          email: email.trim(),
          phoneNumber: phoneNumber.trim()
        });
      }

      message.success('Cập nhật thông tin cá nhân thành công!');
    } catch (err) {
      console.error(err);
      message.error(err.response?.data?.error || 'Đã xảy ra lỗi khi lưu thông tin.');
    }
  };

  const handleCancelChanges = () => {
    setFullName(initialProfile.fullName);
    setEmail(initialProfile.email);
    setPhoneNumber(initialProfile.phoneNumber);
    setErrors({});
    message.info(t('settings.infoDiscard'));
  };

  return (
    <div className="relative mx-auto max-w-6xl space-y-6 font-sans">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">{t('settings.titlePersonalInfo')}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('settings.descPersonalInfo')}</p>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 dark:border-slate-700 sm:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-[0_12px_24px_-10px_rgba(79,70,229,0.7)]">
                <UserCheck size={20} />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">{t('settings.titlePersonalInfo')}</h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{t('settings.descPersonalInfo')}</p>
              </div>
            </div>
            <Sparkles size={18} className="text-indigo-600" />
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-6 p-6 sm:p-8">
            {!user && (
              <div className="flex items-start gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">
                <ShieldAlert size={18} className="mt-0.5 shrink-0" />
                <span>Không tải được thông tin tài khoản. Vui lòng đăng nhập lại.</span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">Tài khoản đăng nhập (Email)</label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input
                    type="text"
                    disabled
                    value={username}
                    placeholder="Không tải được username"
                    className="h-12 w-full cursor-not-allowed select-none rounded-[14px] border-[1.5px] border-slate-200 bg-slate-100 pl-12 pr-4 text-sm font-semibold text-slate-500 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500"
                  />
                </div>
                <span className="block pl-1 text-[11px] font-medium text-slate-400 dark:text-slate-500">Tên đăng nhập bằng Email không thể thay đổi</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">{t('settings.labelFullName')}</label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    maxLength={100}
                    placeholder={t('settings.phFullName')}
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    className="h-12 w-full rounded-[14px] border-[1.5px] border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-semibold text-slate-900 transition-all placeholder:text-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-600/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-800"
                  />
                </div>
                {errors.fullName && <p className="pl-1 text-xs font-semibold text-rose-600">{errors.fullName}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">{t('settings.labelEmail')}</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    placeholder={t('settings.phEmail')}
                    value={email}
                    disabled={!isAdmin}
                    onChange={(event) => setEmail(event.target.value)}
                    className={`h-12 w-full rounded-[14px] border-[1.5px] pl-12 pr-4 text-sm font-semibold transition-all placeholder:text-slate-400 focus:outline-none outline-none ${!isAdmin ? 'border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed select-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500' : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-600/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-800'}`}
                  />
                </div>
                {errors.email && <p className="pl-1 text-xs font-semibold text-rose-600">{errors.email}</p>}
                {!isAdmin && <span className="block pl-1 text-[11px] font-medium text-slate-400 dark:text-slate-500">Chỉ Quản trị viên (Admin) mới có quyền đổi Email</span>}
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">{t('settings.labelPhone')}</label>
                <div className="relative">
                  <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder={t('settings.phPhone')}
                    value={phoneNumber}
                    disabled={!isAdmin}
                    onChange={(event) => setPhoneNumber(event.target.value)}
                    className={`h-12 w-full rounded-[14px] border-[1.5px] pl-12 pr-4 font-mono text-sm font-bold transition-all placeholder:text-slate-400 focus:outline-none outline-none ${!isAdmin ? 'border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed select-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500' : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-600/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-800'}`}
                  />
                </div>
                {errors.phoneNumber && <p className="pl-1 text-xs font-semibold text-rose-600">{errors.phoneNumber}</p>}
                {!isAdmin && <span className="block pl-1 text-[11px] font-medium text-slate-400 dark:text-slate-500">Chỉ Quản trị viên (Admin) mới có quyền đổi Số điện thoại</span>}
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span>Frontend chưa tìm thấy API cập nhật profile cá nhân cho Driver. Các thay đổi sẽ không được lưu cho đến khi backend cung cấp endpoint dùng token hiện tại.</span>
            </div>

            <div className="flex flex-col-reverse items-center gap-3 border-t border-slate-100 pt-5 dark:border-slate-700 sm:flex-row">
              <button
                type="button"
                onClick={handleCancelChanges}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-slate-200 bg-white px-6 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 sm:w-auto"
              >
                <X size={16} />
                {t('settings.btnCancel')}
              </button>

              <button
                type="submit"
                className="flex h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-gradient-to-br from-indigo-500 to-indigo-600 px-8 text-sm font-bold text-white shadow-[0_12px_24px_-10px_rgba(79,70,229,0.7)] transition-all hover:-translate-y-0.5 sm:w-auto"
              >
                <Save size={16} />
                {t('settings.btnSave')}
              </button>
            </div>
          </form>
        </div>

        <div className="w-full space-y-6">
          <div className="space-y-5 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">{t('settings.titleAccountOverview')}</h3>

            <div className="space-y-1 text-sm leading-normal">
              <div className="flex items-center justify-between py-2.5">
                <span className="font-semibold text-slate-500 dark:text-slate-400">Vai trò</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">{displayRoleName(role || user?.role)}</span>
              </div>


              {user && user.balance !== undefined && (
                <div className="flex items-center justify-between border-t border-slate-100 py-2.5 dark:border-slate-700">
                  <span className="font-semibold text-slate-500 dark:text-slate-400">{t('settings.lblCardBalance')}</span>
                  <span className="font-extrabold text-indigo-600">
                    {user.balance.toLocaleString('vi-VN')} đ
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
