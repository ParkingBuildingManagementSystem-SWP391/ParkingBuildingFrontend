import React from 'react';
import Logo from './Logo';

const AppFooter = () => {
  return (
    <footer className="border-t border-slate-200 bg-white select-none">
      <div className="max-w-[1600px] mx-auto w-full px-6 py-3 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-medium text-slate-500">
        <div className="flex items-center gap-3">
          <Logo
            size="small"
          />
        </div>
        <div className="flex flex-col sm:items-end text-center sm:text-right leading-relaxed">
          <span>© 2026 Parking Building System. All rights reserved.</span>
          <span className="text-[10px] tracking-wider mt-0.5 text-slate-400">Phiên bản 3.1.2 · Phát triển bởi Nhóm 5</span>
        </div>
      </div>
    </footer>
  );
};

export default AppFooter;
