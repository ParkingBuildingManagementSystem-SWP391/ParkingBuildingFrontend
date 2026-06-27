import React from 'react';
import { useTranslation } from 'react-i18next';
import parkingLogo from '../assets/logo/parking-building-logo.svg';

const sizeClasses = {
  small: {
    icon: 'h-8 w-12',
    title: 'text-[10px] tracking-[0.1em]',
    subtitle: 'text-[9px]',
    gap: 'gap-2'
  },
  default: {
    icon: 'h-10 w-14',
    title: 'text-[12px] tracking-[0.12em]',
    subtitle: 'text-[11px]',
    gap: 'gap-3'
  }
};

const Logo = ({ className = '', size = 'default', showText = true }) => {
  const { t } = useTranslation();
  const classes = sizeClasses[size] || sizeClasses.default;

  return (
    <div className={`flex items-center ${classes.gap} ${className}`}>
      <img
        src={parkingLogo}
        alt={t('sidebar.systemName')}
        className={`shrink-0 object-contain transition-all duration-300 dark:invert ${classes.icon}`}
      />
      {showText && (
        <div className="text-left leading-tight">
          <p className={`font-black uppercase text-slate-950 dark:text-slate-100 ${classes.title}`}>
            {t('sidebar.systemName')}
          </p>
          <p className={`font-extrabold uppercase tracking-tight text-slate-500 dark:text-slate-400 ${classes.subtitle}`}>
            {t('sidebar.systemDesc')}
          </p>
        </div>
      )}
    </div>
  );
};

export default Logo;
