import React, { useState } from 'react';
import { UserPlus, Mail, Phone, Lock, Shield, CheckCircle, AlertCircle, X, User } from 'lucide-react';
import { adminService } from '../services/adminService';
import { useTranslation } from 'react-i18next';

const CreateAccount = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phoneNumber: '',
    password: '',
    roleName: 'Staff'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const roles = ['Admin', 'Manager', 'Staff', 'Registered_Driver'];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleChange = (role) => {
    setFormData({ ...formData, roleName: role });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Endpoint: POST /api/Admin/create-user (moved to adminService)
      const response = await adminService.createUser(formData);
      // Depending on API structure, 200/201 success or success property
      if (response.status === 200 || response.status === 201 || response.data?.success) {
        setSuccess(t('createAccount.successCreated', { username: formData.username }));
        // Reset form
        setFormData({
          username: '',
          email: '',
          phoneNumber: '',
          password: '',
          roleName: 'Staff'
        });
      }
    } catch (err) {
      console.error('Create account error:', err);
      let errorMsg = t('createAccount.errCreate');
      if (err.response?.data) {
        const data = err.response.data;
        if (data.message) errorMsg = data.message;
        else if (data.error) errorMsg = data.error;
        else if (data.errors) {
          errorMsg = Object.entries(data.errors)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
            .join('\n');
        }
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-sans select-none pb-12">
      <div className="max-w-3xl mx-auto space-y-8">

        {/* PAGE HEADER */}
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            {t('createAccount.pageTitle')}
          </h1>
          <p className="text-sm text-slate-500">
            {t('createAccount.pageSubtitle')}
          </p>
        </div>

        {/* FORM CARD */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Status Messages */}
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-[14px] flex items-start gap-3">
                <AlertCircle className="shrink-0 mt-0.5" size={20} />
                <div className="flex-1">
                  <h4 className="font-bold text-sm">{t('createAccount.actionFailed')}</h4>
                  <p className="text-sm text-rose-600 mt-0.5 whitespace-pre-line">{error}</p>
                </div>
                <button type="button" onClick={() => setError('')} className="p-1 hover:bg-rose-100 rounded-lg transition-colors">
                  <X size={16} />
                </button>
              </div>
            )}

            {success && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-[14px] flex items-start gap-3">
                <CheckCircle className="shrink-0 mt-0.5" size={20} />
                <div className="flex-1">
                  <h4 className="font-bold text-sm">{t('createAccount.actionSuccess')}</h4>
                  <p className="text-sm text-emerald-600 mt-0.5">{success}</p>
                </div>
                <button type="button" onClick={() => setSuccess('')} className="p-1 hover:bg-emerald-100 rounded-lg transition-colors">
                  <X size={16} />
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Username */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 ml-1">{t('createAccount.labelUsername')}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User size={18} className="text-slate-400" />
                  </div>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    placeholder={t('createAccount.phUsername')}
                    className="w-full h-[52px] bg-slate-50 border-[1.5px] border-slate-200 text-slate-800 text-sm rounded-[14px] focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 focus:bg-white block pl-11 pr-4 transition-all outline-none"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 ml-1">{t('createAccount.labelEmail')}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail size={18} className="text-slate-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder={t('createAccount.phEmail')}
                    className="w-full h-[52px] bg-slate-50 border-[1.5px] border-slate-200 text-slate-800 text-sm rounded-[14px] focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 focus:bg-white block pl-11 pr-4 transition-all outline-none"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 ml-1">{t('createAccount.labelPhone')}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Phone size={18} className="text-slate-400" />
                  </div>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    required
                    placeholder={t('createAccount.phPhone')}
                    className="w-full h-[52px] bg-slate-50 border-[1.5px] border-slate-200 text-slate-800 text-sm rounded-[14px] focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 focus:bg-white block pl-11 pr-4 transition-all outline-none"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 ml-1">{t('createAccount.labelTempPwd')}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock size={18} className="text-slate-400" />
                  </div>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder={t('createAccount.phTempPwd')}
                    className="w-full h-[52px] bg-slate-50 border-[1.5px] border-slate-200 text-slate-800 text-sm rounded-[14px] focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 focus:bg-white block pl-11 pr-4 transition-all outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Role Selection */}
            <div className="space-y-3 pt-2">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 ml-1">{t('createAccount.labelSysRole')}</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {roles.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleRoleChange(role)}
                    className={`relative flex flex-col items-center justify-center p-4 rounded-[14px] border-[1.5px] transition-all duration-200 ${
                      formData.roleName === role
                        ? 'bg-indigo-50 border-indigo-600 shadow-sm z-10'
                        : 'bg-white border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
                    }`}
                  >
                    {formData.roleName === role && (
                      <div className="absolute top-2 right-2 text-indigo-600">
                        <CheckCircle size={14} className="fill-indigo-100" />
                      </div>
                    )}
                    <Shield size={24} className={`mb-2 ${formData.roleName === role ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span className={`text-sm font-bold text-center ${formData.roleName === role ? 'text-indigo-900' : 'text-slate-600'}`}>
                      {role.replace('_', ' ')}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6 mt-6 border-t border-slate-100">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-[52px] rounded-[14px] bg-gradient-to-br from-indigo-500 to-indigo-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-[0_12px_24px_-10px_rgba(79,70,229,0.7)] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <UserPlus size={18} />
                    {t('createAccount.btnCreateAcc')}
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateAccount;
