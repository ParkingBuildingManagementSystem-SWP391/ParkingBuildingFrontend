import api from './api';

export const authService = {
  login: async (usernameOrEmail, password) => {
    try {
      let payload = {};

      // Nếu tham số là một Object (do Formik/React Hook Form truyền cả cục)
      if (typeof usernameOrEmail === 'object' && usernameOrEmail !== null) {
        payload = {
          email: usernameOrEmail.usernameOrEmail || usernameOrEmail.email || usernameOrEmail.Username,
          password: usernameOrEmail.password || usernameOrEmail.Password
        };
      } else {
        // Nếu truyền tham số rời
        payload = {
          email: usernameOrEmail,
          password: password
        };
      }

      // Gửi request lên Backend
      const response = await api.post('/Auth/login', payload);
      return response.data;
    } catch (error) {
      // Trích xuất lỗi từ Backend (.NET Validation trả về title hoặc error)
      const serverMessage = error.response?.data?.error || error.response?.data?.title || error.response?.data?.message;
      throw serverMessage || "Đăng nhập thất bại. Vui lòng kiểm tra lại!";
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('spotflow_user');
    localStorage.removeItem('spotflow_role');
    window.location.href = '/login';
  }
};