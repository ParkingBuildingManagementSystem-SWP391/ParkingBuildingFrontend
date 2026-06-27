import React from 'react';
import { useTranslation } from 'react-i18next';
import Logo from './Logo';

const AppFooter = () => {
  const { t } = useTranslation();
  return (
    <footer className="w-full max-w-full overflow-x-hidden border-t border-slate-200 bg-white select-none transition-colors duration-300 dark:bg-slate-900 dark:border-slate-800">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col items-center justify-between gap-3 px-4 py-4 text-center text-xs font-medium text-slate-500 dark:text-slate-400 sm:flex-row sm:px-6 sm:py-3 sm:text-left md:px-8">
        <div className="min-w-0">
          <Logo size="small" />
          <span className="sr-only">{t('footer.systemName')}</span>
        </div>
        <div className="flex min-w-0 flex-col leading-relaxed sm:items-end sm:text-right">
          <span>{t('footer.copyright')}</span>
          <span className="text-[10px] tracking-wider mt-0.5 text-slate-400">{t('footer.version')}</span>
        </div>
      </div>
    </footer>
  );
};

export default AppFooter;
