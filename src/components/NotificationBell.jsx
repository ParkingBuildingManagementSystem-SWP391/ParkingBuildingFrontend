import React, { useState, useEffect, useRef, useContext } from 'react';
import { Bell } from 'lucide-react';
import { NotificationContext } from '../context/NotificationContext';
import { formatDateTimeVN } from '../utils/dateTime';

const NotificationBell = () => {
  // 1. Tiêu thụ Context: Sử dụng useContext(NotificationContext)
  const context = useContext(NotificationContext);
  if (!context) {
    return (
      <button
        type="button"
        className="flex w-10 h-10 rounded-full items-center justify-center bg-white border border-slate-200 text-slate-500 relative dark:bg-slate-800 dark:border-slate-700"
      >
        <Bell size={18} strokeWidth={2} />
      </button>
    );
  }

  const { notifications, latestNotification, markAllAsRead } = context;

  // 2. Quản lý trạng thái Dropdown
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Toggle Dropdown đóng mở và ngăn chặn nổi bọt sự kiện
  const toggleDropdown = (e) => {
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  };

  // Lắng nghe sự kiện click outside để tự động đóng dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      // Giải phóng bộ nhớ khi component unmount
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 3. Hiển thị dữ liệu & Đồng bộ Badge
  // Tính toán số lượng chưa đọc:
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="relative" ref={containerRef}>
      {/* Button chiếc chuông */}
      <button
        type="button"
        onClick={toggleDropdown} // Gán onClick xử lý đóng mở
        className="flex w-10 h-10 rounded-full items-center justify-center bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors shadow-[0_2px_5px_rgba(0,0,0,0.02)] relative dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
        aria-label="Thông báo"
      >
        <Bell size={18} strokeWidth={2} />

        {/* Nếu unreadCount > 0, hiển thị Badge màu đỏ bg-[#FF3B30] */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-[18px] h-[18px] bg-[#FF3B30] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Menu dropdown thả xuống */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-80 sm:w-96 origin-top-right rounded-2xl border border-slate-100 bg-white shadow-xl focus:outline-none dark:border-slate-800 dark:bg-slate-900 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5 dark:border-slate-800">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Thông báo mới</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead} // Gọi hàm markAllAsRead để xóa ngay Badge số lượng
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                Đánh dấu đã đọc
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800/50">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs font-semibold text-slate-400">
                Không có thông báo nào.
              </div>
            ) : (
              notifications.map((item, index) => {
                const id = item.id || index;
                const title = item.title || 'Thông báo';
                const content = item.content || '';
                const createdAt = item.createdAt;
                const isRead = item.isRead;

                return (
                  <div
                    key={id}
                    className={`flex flex-col gap-1 p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                      !isRead ? 'bg-indigo-50/30 dark:bg-indigo-950/10' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`text-[13px] font-extrabold leading-tight ${
                          !isRead ? 'text-slate-950 dark:text-white' : 'text-slate-700 dark:text-slate-350'
                        }`}
                      >
                        {title}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap">
                        {createdAt ? formatDateTimeVN(createdAt, 'Mới đây') : 'N/A'}
                      </span>
                    </div>
                    <p className="text-[12px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      {content}
                    </p>
                  </div>
                );
              })
            )}
          </div>

          <div className="border-t border-slate-100 p-2.5 text-center dark:border-slate-800">
            <button
              type="button"
              className="w-full rounded-xl py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Xem tất cả thông báo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
