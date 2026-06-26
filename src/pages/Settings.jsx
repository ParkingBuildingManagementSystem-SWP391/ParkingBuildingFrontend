import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  ShieldAlert,
  CheckCircle,
  Save,
  Car,
  Bike,
  Sparkles,
  X,
  CreditCard,
  UserCheck,
  Check
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Motorcycle = ({ size = 18, className = '' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="5" cy="18" r="3" />
    <circle cx="19" cy="18" r="3" />
    <path d="M12 18V12H17L19 9" />
    <path d="M7.5 14H16.5" />
    <path d="M12 12L9 6H5" />
  </svg>
);

const Settings = () => {
  const { t } = useTranslation();
  const { user, role, updateUser } = useAuth();
  const navigate = useNavigate();

  // Profile fields state
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleType, setVehicleType] = useState('Car');

  // Alert/Toast states
  const [alertMsg, setAlertMsg] = useState(null);
  const [alertType, setAlertType] = useState('success'); // 'success' | 'info'

  // Initialize fields on load or when user object changes
  useEffect(() => {
    if (user) {
      let displayUsername = user.username || 'driver_account';
      // Sanitizer: if the loaded username is simply the role identifier, output a proper unique username
      if (displayUsername === 'driver') displayUsername = 'david_miller';
      if (displayUsername === 'staff') displayUsername = 'sarah_connor';
      if (displayUsername === 'admin') displayUsername = 'alex_johnson';
      if (displayUsername === 'manager') displayUsername = 'robert_vance';

      setUsername(displayUsername);
      setFullName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || user.vehiclePlate || '0915277878');
      setVehicleType(user.vehicleType || 'Car');
    }
  }, [user, role]);

  // Handle profile changes save
  const handleSaveProfile = (e) => {
    e.preventDefault();

    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      setAlertType('info');
      setAlertMsg(t('settings.errFillFields'));
      setTimeout(() => setAlertMsg(null), 3000);
      return;
    }

    // Call context updater to save session data in localStorage & state
    updateUser({
      name: fullName,
      email: email,
      phone: phone,
      vehicleType: vehicleType
    });

    setAlertType('success');
    setAlertMsg(t('settings.successUpdate'));
    setTimeout(() => setAlertMsg(null), 3500);
  };

  // Reset form to original values
  const handleCancelChanges = () => {
    if (user) {
      setFullName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || user.vehiclePlate || '0915277878');
      setVehicleType(user.vehicleType || 'Car');
    }
    setAlertType('info');
    setAlertMsg(t('settings.infoDiscard'));
    setTimeout(() => setAlertMsg(null), 3000);
  };


  const getVehicleIcon = (type) => {
    if (type === 'Bicycle') return <Bike size={18} className="text-blue-500" />;
    if (type === 'Motorcycle') return <Motorcycle size={18} className="text-indigo-500" />;
    return <Car size={18} className="text-indigo-650" />;
  };

  const displayRoleName = (r) => {
    if (r === 'driver') return 'Driver';
    if (r === 'staff') return 'Parking Staff';
    if (r === 'manager') return 'Parking Manager';
    if (r === 'admin') return 'System Admin';
    return r;
  };

  return (
    <div className="space-y-6 relative font-sans max-w-6xl mx-auto">

      {/* Toast Notification Banner */}
      {alertMsg && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 px-6 py-3.5 rounded-[14px] shadow-lg z-50 flex items-center gap-2.5 text-white font-bold text-xs sm:text-sm ${
          alertType === 'success'
            ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-[0_12px_24px_-10px_rgba(16,185,129,0.7)]'
            : 'bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-[0_12px_24px_-10px_rgba(79,70,229,0.7)]'
        }`}>
          <CheckCircle size={18} className="text-white" />
          <span>{alertMsg}</span>
        </div>
      )}

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight dark:text-slate-100">{t('settings.titlePersonalInfo')}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('settings.descPersonalInfo')}</p>
      </div>

      {/* Main Form Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* User Profile Form Column (Left - occupies 2/3 wide on large displays) */}
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

          <form onSubmit={handleSaveProfile} className="p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {/* Username Input (Disabled based on best practices) */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">{t('settings.labelUsername')}</label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input
                    type="text"
                    disabled
                    value={username}
                    className="h-12 w-full cursor-not-allowed select-none rounded-[14px] border-[1.5px] border-slate-200 bg-slate-100 pl-12 pr-4 text-sm font-semibold text-slate-500 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500"
                  />
                </div>
                <span className="block pl-1 text-[11px] font-medium text-slate-400 dark:text-slate-500">{t('settings.hintUsername')}</span>
              </div>

              {/* Full Name Input */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">{t('settings.labelFullName')}</label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder={t('settings.phFullName')}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-12 w-full rounded-[14px] border-[1.5px] border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-semibold text-slate-900 transition-all placeholder:text-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-600/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-800"
                  />
                </div>
              </div>

              {/* Email Address Input */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">{t('settings.labelEmail')}</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder={t('settings.phEmail')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 w-full rounded-[14px] border-[1.5px] border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-semibold text-slate-900 transition-all placeholder:text-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-600/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-800"
                  />
                </div>
              </div>

              {/* Phone Number Input */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">{t('settings.labelPhone')}</label>
                <div className="relative">
                  <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder={t('settings.phPhone')}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-12 w-full rounded-[14px] border-[1.5px] border-slate-200 bg-slate-50 pl-12 pr-4 font-mono text-sm font-bold text-slate-900 transition-all placeholder:text-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-600/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-800"
                  />
                </div>
              </div>

              {/* Vehicle Type Dropdown */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">{t('settings.labelVehicle')}</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    {getVehicleIcon(vehicleType)}
                  </div>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="h-12 w-full cursor-pointer appearance-none rounded-[14px] border-[1.5px] border-slate-200 bg-slate-50 pl-12 pr-10 text-sm font-semibold text-slate-900 transition-all focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-600/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-800"
                  >
                    <option value="Car">{t('settings.optCar')}</option>
                    <option value="Motorbike">{t('settings.optMoto')}</option>
                    <option value="Bicycle">{t('settings.optBike')}</option>
                  </select>
                  <svg className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </div>
              </div>

            </div>

            {/* Save Profile CTA buttons */}
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
                className="w-full sm:w-auto px-8 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white font-bold rounded-[14px] transition-all shadow-[0_12px_24px_-10px_rgba(79,70,229,0.7)] hover:-translate-y-0.5 flex items-center justify-center gap-2 text-sm"
              >
                <Save size={16} />
                {t('settings.btnSave')}
              </button>
            </div>

          </form>
        </div>

        {/* Right Side Column: Stats or Admin Panel */}
        <div className="space-y-6 w-full">



          {/* Account Status / Overview Widget (Renders for everyone, providing nice context) */}
          <div className="space-y-5 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">{t('settings.titleAccountOverview')}</h3>

            <div className="space-y-1 text-sm leading-normal">

              <div className="flex justify-between items-center py-2.5">
                <span className="font-semibold text-slate-500 dark:text-slate-400">{t('settings.lblVerifyBadge')}</span>
                <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
                  <Check size={16} className="rounded-full bg-emerald-100 p-0.5 dark:bg-emerald-500/20" />
                  {t('settings.valVerified')}
                </span>
              </div>


              <div className="flex items-center justify-between border-t border-slate-100 py-2.5 dark:border-slate-700">
                <span className="font-semibold text-slate-500 dark:text-slate-400">{t('settings.lblAccountStatus')}</span>
                <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block animate-pulse"></span>
                  {t('settings.valActiveSession')}
                </span>
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
