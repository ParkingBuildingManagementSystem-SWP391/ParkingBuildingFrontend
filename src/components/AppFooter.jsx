import React from 'react';
import Logo from './Logo';
import { useTranslation } from 'react-i18next';

const AppFooter = () => {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-slate-200 bg-white select-none">
      <div className="max-w-[1600px] mx-auto w-full px-6 py-3 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-medium text-slate-500">
        <div className="flex items-center gap-3">
          <Logo
            size="small"
          />
          <span className="text-sm text-slate-800 font-bold">
            {t('footer.systemName')}
          </span>
        </div>
        <div className="flex flex-col sm:items-end text-center sm:text-right leading-relaxed">
          <span>{t('footer.copyright')}</span>
          <span className="text-[10px] tracking-wider mt-0.5 text-slate-400">{t('footer.version')}</span>
        </div>
      </div>
    </footer>
  );
};

export default AppFooter;
