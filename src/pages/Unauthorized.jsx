import React from 'react';
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Unauthorized = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-transparent">
      <div className="glass-panel max-w-lg w-full p-8 rounded-2xl border border-slate-800 text-center shadow-xl">
        <Result
          status="403"
          icon={
            <div className="flex justify-center mb-2">
              <div className="p-4 bg-rose-500/10 rounded-full text-rose-400 border border-rose-500/20">
                <ShieldAlert size={48} className="animate-pulse" />
              </div>
            </div>
          }
          title={<span className="text-white text-2xl font-bold">{t('unauthorized.title')}</span>}
          subTitle={
            <p className="text-slate-400 mt-2 max-w-sm mx-auto">
              {t('unauthorized.subTitle')}
            </p>
          }
          extra={
            <Button 
              type="primary" 
              onClick={() => navigate('/dashboard')}
              className="bg-indigo-600 hover:bg-indigo-500 border-none px-6 h-10 font-medium rounded-lg"
            >
              {t('unauthorized.btnBack')}
            </Button>
          }
        />
      </div>
    </div>
  );
};

export default Unauthorized;
