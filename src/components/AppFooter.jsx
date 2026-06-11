import React from 'react';
import Logo from './Logo';

const AppFooter = () => {
  return (
    <footer className="border-t border-slate-200 bg-white/90">
      <div className="max-w-7xl mx-auto w-full px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
        <Logo
          imageClassName="h-7 sm:h-8"
          textClassName="text-xs text-slate-700"
        />
        <div className="flex flex-col sm:items-end text-center sm:text-right leading-relaxed">
          <span>© 2026 Parking Building Management System. All rights reserved.</span>
          <span>Version 1.0.0 · Developed by Team 5</span>
        </div>
      </div>
    </footer>
  );
};

export default AppFooter;
