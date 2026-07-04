import React from 'react';
import { useTranslation } from 'react-i18next';
import parkingLogo from '../assets/logo/parking-building-logo.svg';

const sizeClasses = {
  small: {
    icon: 'h-8 w-auto max-w-10',
    title: 'text-[10px] tracking-[0.03em]',
    subtitle: 'text-[9px]',
    gap: 'gap-2',
    text: 'max-w-[140px]'
  },
  default: {
    icon: 'h-10 w-auto max-w-12',
    title: 'text-[11px] tracking-[0.025em] sm:text-[12px] sm:tracking-[0.03em]',
    subtitle: 'text-[10px] sm:text-[11px]',
    gap: 'gap-2.5',
    text: 'max-w-[150px] sm:max-w-[190px]'
  }
};

const Logo = ({ className = '', size = 'default', showText = true }) => {
  const { t } = useTranslation();
  const classes = sizeClasses[size] || sizeClasses.default;

  return (
    <div className={`flex min-w-0 max-w-full items-center ${classes.gap} ${className}`}>
      <img
        src={parkingLogo}
        alt={t('sidebar.systemName')}
        className={`shrink-0 object-contain transition-all duration-300 dark:invert ${classes.icon}`}
      />
      {showText && (
        <div className={`min-w-0 text-left leading-[1.25] ${classes.text}`}>
          <p className={`max-w-full break-words font-black uppercase leading-[1.25] text-slate-950 dark:text-slate-100 ${classes.title}`}>
            {t('sidebar.systemName')}
          </p>
          <p className={`max-w-full break-words font-extrabold uppercase leading-[1.25] tracking-normal text-slate-500 dark:text-slate-400 ${classes.subtitle}`}>
            {t('sidebar.systemDesc')}
          </p>
        </div>
      )}
    </div>
  );
};

export default Logo;
