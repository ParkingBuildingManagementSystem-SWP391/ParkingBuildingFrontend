import React, { createContext, useContext, useEffect, useState } from 'react';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { useAuth } from './AuthContext';

export const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [connection, setConnection] = useState(null);
  
  // 1. Khai báo thêm 2 state: notifications và latestNotification (lấy từ localStorage nếu có để tránh mất khi F5)
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('notifications');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Lỗi phân tích cú pháp notifications từ localStorage', e);
      }
    }
    return [];
  });
  const [latestNotification, setLatestNotification] = useState(null);

  // Hàm phụ trợ trích xuất linh hoạt giá trị thuộc tính viết hoa/thường từ backend
  const getField = (data, propName) => {
    if (!data) return undefined;
    const capitalized = propName.charAt(0).toUpperCase() + propName.slice(1);
    return data[propName] !== undefined ? data[propName] : data[capitalized];
  };

  useEffect(() => {
    // Chỉ kết nối khi user đã đăng nhập
    if (!user) {
      if (connection) {
        connection.stop()
          .then(() => console.log('[SignalR] Connection stopped.'))
          .catch(err => console.error('[SignalR] Error stopping connection:', err));
        setConnection(null);
      }
      setNotifications([]);
      setLatestNotification(null);
      localStorage.removeItem('notifications'); // Xóa cache thông báo khi logout bảo mật
      return;
    }

    const token = localStorage.getItem('token');
    
    // Cấu hình kết nối SignalR Hub
    const newConnection = new HubConnectionBuilder()
      .withUrl('/hubs/driver-notifications', {
        accessTokenFactory: () => token || ''
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build();

    setConnection(newConnection);

    // Bắt đầu kết nối
    newConnection.start()
      .then(() => {
        console.log('[SignalR] Connected to Hub successfully!');
        
        // 2. Lắng nghe sự kiện ReceiveNotification
        newConnection.on('ReceiveNotification', (data) => {
          console.log('[SignalR] Received notification data:', data);
          
          // Định dạng tiền tệ VNĐ chạy ngầm
          const formatCurrency = (value) => {
            if (value === undefined || value === null) return '0đ';
            return `${Number(value).toLocaleString('vi-VN')}đ`;
          };

          const vehicleType = getField(data, 'vehicleType') || getField(data, 'vehicleTypeName') || '';
          const oldPrice = getField(data, 'oldPrice');
          const newPrice = getField(data, 'newPrice');
          const notificationType = getField(data, 'notificationType') || 'General';

          let finalContent = getField(data, 'content') || '';
          const finalTitle = getField(data, 'title') || 'Thông báo mới';

          // Nếu là thông báo cập nhật giá đỗ xe và có đủ thông tin giá cũ/giá mới
          if (
            (notificationType === 'BookingPriceUpdate' || notificationType === 'ShiftParkingPriceUpdate') &&
            vehicleType &&
            oldPrice !== undefined &&
            newPrice !== undefined
          ) {
            finalContent = `Biểu phí đỗ xe cho loại xe ${vehicleType} đã thay đổi từ ${formatCurrency(oldPrice)} thành ${formatCurrency(newPrice)} áp dụng từ thời điểm này.`;
          }
          
          // Định dạng dữ liệu linh hoạt chống lỗi viết hoa/thường từ Backend
          const formattedData = {
            id: getField(data, 'id') || getField(data, 'notificationId') || Date.now(),
            title: finalTitle,
            content: finalContent,
            isRead: getField(data, 'isRead') !== undefined 
              ? (getField(data, 'isRead') === true || getField(data, 'isRead') === 1) 
              : false, // Tự động gán false nếu chưa có trạng thái đọc
            notificationType: notificationType,
            createdAt: getField(data, 'createdAt') || new Date().toISOString()
          };

          // Cập nhật thông báo mới vào đầu mảng và lưu vào localStorage
          setNotifications((prev) => {
            const updated = [formattedData, ...prev];
            localStorage.setItem('notifications', JSON.stringify(updated));
            return updated;
          });
          // Cập nhật thông báo mới nhất
          setLatestNotification(formattedData);
        });
      })
      .catch((error) => {
        console.error('[SignalR] Connection error:', error);
      });

    return () => {
      newConnection.stop()
        .then(() => console.log('[SignalR] Connection stopped during cleanup.'))
        .catch(err => console.error('[SignalR] Error stopping connection:', err));
    };
  }, [user]);

  // 3. Viết thêm hàm markAllAsRead và đồng bộ vào localStorage
  const markAllAsRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({
        ...n,
        isRead: true
      }));
      localStorage.setItem('notifications', JSON.stringify(updated));
      return updated;
    });
  };

  // 4. Export các giá trị qua thẻ Provider
  const value = {
    connection,
    notifications,
    latestNotification,
    markAllAsRead,
    setNotifications,
    setLatestNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
