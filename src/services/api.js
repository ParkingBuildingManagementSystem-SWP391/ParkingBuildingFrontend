import axios from 'axios';

const api = axios.create({
<<<<<<< Updated upstream
  // Đường dẫn tương đối dựa theo cấu hình Vite Proxy trong vite.config.js
=======
  // Đust CHUYỂN THÀNH: Đường dẫn tương đối dựa theo cấu hình Vite Proxy
  // Trình duyệt sẽ hiểu là gọi tới http://localhost:3000/api và không bị chặn CORS nữa
>>>>>>> Stashed changes
  baseURL: '/api', 
  headers: {
    'Content-Type': 'application/json',
  },
<<<<<<< Updated upstream
  timeout: 10000, // (Tùy chọn) Ngắt request nếu sau 10 giây Backend không phản hồi
});

// ==========================================
// 1. INTERCEPTOR CHO REQUEST (Đầu đi)
// ==========================================
=======
});

// Tự động thêm Token vào Header của mỗi Request (nếu có)
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
// ==========================================
// 2. INTERCEPTOR CHO RESPONSE (Đầu về)
// ==========================================
api.interceptors.response.use(
  (response) => {
    // Nếu request thành công, chỉ trả về dữ liệu (data) để phía FE dùng cho gọn
    return response;
  },
  (error) => {
    // Kiểm tra xem lỗi có phản hồi từ server không
    if (error.response) {
      const { status } = error.response;

      switch (status) {
        case 401:
          console.warn("Token không hợp lệ hoặc đã hết hạn. Đang đăng xuất...");
          // Xóa token khỏi localStorage
          localStorage.removeItem('token');
          // Chuyển hướng người dùng về trang login (nếu không dùng react-router trong file js được, có thể dùng window.location)
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          break;

        case 403:
          console.error("Bạn không có quyền truy cập vào tài nguyên này (403 Forbidden).");
          // Bạn có thể đẩy người dùng sang trang /unauthorized có sẵn trong project của bạn
          break;

        case 500:
          console.error("Lỗi hệ thống từ phía Server (500 Internal Server Error).");
          break;

        default:
          console.error(`Lỗi hệ thống: ${status}`);
      }
    } else if (error.request) {
      // Request đã gửi nhưng không nhận được phản hồi (Sai IP port, server sập...)
      console.error("Không thể kết nối đến Server bãi đỗ xe. Vui lòng kiểm tra lại Backend!");
    } else {
      console.error("Lỗi cấu hình request:", error.message);
    }

    return Promise.reject(error);
  }
);

=======
>>>>>>> Stashed changes
export default api;