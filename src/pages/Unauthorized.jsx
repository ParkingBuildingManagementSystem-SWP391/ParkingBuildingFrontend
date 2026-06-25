import React from 'react';
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Unauthorized = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-100 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.25)] p-8 sm:p-10 text-center">
        <div className="flex justify-center mb-6">
          <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-indigo-50 to-rose-50 border border-indigo-100">
            <span className="absolute inset-0 rounded-full bg-rose-500/10 animate-ping" />
            <ShieldAlert size={44} className="relative text-rose-500" strokeWidth={2.2} />
          </div>
        </div>

        <p className="text-sm font-bold tracking-[0.2em] text-indigo-600 uppercase mb-2">
          403
        </p>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          {t('unauthorized.title')}
        </h1>

        <p className="mt-3 text-slate-500 max-w-sm mx-auto leading-relaxed">
          {t('unauthorized.subTitle')}
        </p>

        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="mt-8 inline-flex items-center justify-center w-full rounded-[14px] bg-gradient-to-br from-indigo-500 to-indigo-600 text-white font-bold px-6 py-3 shadow-lg shadow-indigo-600/25 transition-transform duration-150 hover:-translate-y-0.5"
        >
          {t('unauthorized.btnBack')}
        </button>
      </div>
    </div>
  );
};

export default Unauthorized;
