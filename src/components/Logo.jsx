import React from 'react';

const sizeClasses = {
  small: {
    icon: 'h-8 w-8 rounded-[9px] text-base',
    title: 'text-[10px] tracking-[0.1em]',
    subtitle: 'text-[9px]',
    gap: 'gap-2'
  },
  default: {
    icon: 'h-10 w-10 rounded-[11px] text-xl',
    title: 'text-[12px] tracking-[0.12em]',
    subtitle: 'text-[11px]',
    gap: 'gap-3'
  }
};

const Logo = ({ className = '', size = 'default', showText = true }) => {
  const classes = sizeClasses[size] || sizeClasses.default;

  return (
    <div className={`flex items-center ${classes.gap} ${className}`}>
      <div className={`flex shrink-0 items-center justify-center bg-gradient-to-br from-[#2563eb] via-[#4f46e5] to-[#7c3aed] font-black text-white shadow-[0_8px_20px_rgba(37,99,235,0.28)] ${classes.icon}`}>
        P
      </div>
      {showText && (
        <div className="text-left leading-tight">
          <p className={`font-black uppercase text-slate-950 ${classes.title}`}>
            HỆ THỐNG
          </p>
          <p className={`font-extrabold uppercase tracking-tight text-slate-500 ${classes.subtitle}`}>
            QUẢN LÍ BÃI ĐỖ XE
          </p>
        </div>
      )}
    </div>
  );
};

export default Logo;
