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
    <div className="space-y-8 font-sans select-none pb-12 max-w-3xl mx-auto mt-6">

      {/* FORM CARD */}
      <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 rounded-full bg-blue-500/5 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-12 -mb-12 w-48 h-48 rounded-full bg-indigo-500/5 blur-3xl"></div>

        <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
          
          {/* Status Messages */}
          {error && (
            <div className="bg-rose-50/80 backdrop-blur-md border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl flex items-start gap-3 shadow-sm animate-fade-in">
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
            <div className="bg-emerald-50/80 backdrop-blur-md border border-emerald-200 text-emerald-700 px-4 py-3 rounded-2xl flex items-start gap-3 shadow-sm animate-fade-in">
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
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">{t('createAccount.labelUsername')}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User size={18} className="text-slate-400" />
                </div>
                <input 
                  type="text" 
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  placeholder={t('createAccount.phUsername')}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 block pl-10 p-3 transition-all outline-none"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">{t('createAccount.labelEmail')}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail size={18} className="text-slate-400" />
                </div>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder={t('createAccount.phEmail')}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 block pl-10 p-3 transition-all outline-none"
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">{t('createAccount.labelPhone')}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Phone size={18} className="text-slate-400" />
                </div>
                <input 
                  type="tel" 
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  required
                  placeholder={t('createAccount.phPhone')}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 block pl-10 p-3 transition-all outline-none"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">{t('createAccount.labelTempPwd')}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock size={18} className="text-slate-400" />
                </div>
                <input 
                  type="password" 
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder={t('createAccount.phTempPwd')}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 block pl-10 p-3 transition-all outline-none"
                />
              </div>
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-3 pt-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">{t('createAccount.labelSysRole')}</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {roles.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleRoleChange(role)}
                  className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-200 ${
                    formData.roleName === role 
                      ? 'bg-indigo-50 border-indigo-500 shadow-md shadow-indigo-500/10 z-10' 
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
              className="w-full h-12 bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-500 hover:to-blue-400 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
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
  );
};

export default CreateAccount;
