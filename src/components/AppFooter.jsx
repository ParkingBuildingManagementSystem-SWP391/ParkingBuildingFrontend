import React from 'react';
import Logo from './Logo';

const AppFooter = () => {
  return (
    <footer className="border-t border-border bg-background/90 backdrop-blur-sm transition-colors duration-500 select-none">
      <div className="max-w-[1600px] mx-auto w-full px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-medium text-muted-foreground">
        <Logo
          imageClassName="h-7 sm:h-8 drop-shadow-sm transition-transform hover:scale-105"
          textClassName="text-sm text-foreground font-bold transition-colors"
        />
        <div className="flex flex-col sm:items-end text-center sm:text-right leading-relaxed">
          <span>© 2026 Hệ thống quản lý bãi đỗ xe. Mọi quyền được bảo lưu.</span>
          <span className="text-[10px] uppercase tracking-wider mt-0.5 opacity-70">Phiên bản 1.0.0 · Phát triển bởi Nhóm 5</span>
        </div>
      </div>
    </footer>
  );
};

export default AppFooter;
