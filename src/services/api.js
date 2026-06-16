import axios from 'axios';

// src/services/api.js
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});


// ==========================================
// 1. INTERCEPTOR CHO REQUEST (Đầu đi)
// ==========================================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ==========================================
// 2. INTERCEPTOR CHO RESPONSE (Đầu về)
// ==========================================
api.interceptors.response.use(
  (response) => {
    // Nếu request thành công, giữ nguyên response để xử lý ở tầng service
    return response;
  },
  (error) => {
    // Kiểm tra xem lỗi có phản hồi từ server không
    if (error.response) {
      const { status } = error.response;

      switch (status) {
        case 401:
          console.warn("Token không hợp lệ hoặc đã hết hạn. Đang đăng xuất...");
          localStorage.removeItem('token');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          break;

        case 403:
          console.error("Bạn không có quyền truy cập vào tài nguyên này (403 Forbidden).");
          break;

        case 500:
          console.error("Lỗi hệ thống từ phía Server (500 Internal Server Error).");
          break;

        default:
          console.error(`Lỗi hệ thống: ${status}`);
      }
    } else if (error.request) {
      console.error("Không thể kết nối đến Server bãi đỗ xe. Vui lòng kiểm tra lại Backend!");
    } else {
      console.error("Lỗi cấu hình request:", error.message);
    }

    return Promise.reject(error);
  }
);

export default api;