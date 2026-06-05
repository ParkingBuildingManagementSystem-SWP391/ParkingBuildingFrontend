import api from './api';

export const authService = {
<<<<<<< Updated upstream
=======
  // Login method hitting POST /api/Auth/login
>>>>>>> Stashed changes
  login: async (usernameOrEmail, password) => {
    try {
      let payload = {};

<<<<<<< Updated upstream
      // Nếu tham số là một Object (do Formik/React Hook Form truyền cả cục)
=======
>>>>>>> Stashed changes
      if (typeof usernameOrEmail === 'object' && usernameOrEmail !== null) {
        payload = {
          email: usernameOrEmail.usernameOrEmail || usernameOrEmail.email || usernameOrEmail.Username,
          password: usernameOrEmail.password || usernameOrEmail.Password
        };
      } else {
<<<<<<< Updated upstream
        // Nếu truyền tham số rời
=======
>>>>>>> Stashed changes
        payload = {
          email: usernameOrEmail,
          password: password
        };
      }

<<<<<<< Updated upstream
      // Gửi request lên Backend
      const response = await api.post('/Auth/login', payload);
      return response.data;
    } catch (error) {
      // Trích xuất lỗi từ Backend (.NET Validation trả về title hoặc error)
=======
      // Gửi request lên Backend (baseURL is '/api', so '/Auth/login' targets '/api/Auth/login')
      const response = await api.post('/Auth/login', payload);
      
      // Standardize response fields (handle both CamelCase and PascalCase from EF Core)
      const data = response.data;
      return {
        token: data.token || data.Token,
        username: data.username || data.Username,
        email: data.email || data.Email,
        roleName: data.roleName || data.RoleName
      };
    } catch (error) {
>>>>>>> Stashed changes
      const serverMessage = error.response?.data?.error || error.response?.data?.title || error.response?.data?.message;
      throw serverMessage || "Đăng nhập thất bại. Vui lòng kiểm tra lại!";
    }
  },

<<<<<<< Updated upstream
=======
  // Register method hitting POST /api/Auth/register
  register: async (username, email, password) => {
    try {
      const payload = {
        username: username.trim(),
        email: email.trim(),
        password: password
      };
      const response = await api.post('/Auth/register', payload);
      return response.data;
    } catch (error) {
      const serverMessage = error.response?.data?.error || error.response?.data?.message;
      throw serverMessage || "Đăng ký thất bại. Vui lòng thử lại!";
    }
  },

  // OTP Verification hitting POST /api/Auth/verify-otp
  verifyOtp: async (email, otpCode) => {
    try {
      const payload = {
        email: email.trim(),
        otpCode: otpCode.trim()
      };
      const response = await api.post('/Auth/verify-otp', payload);
      
      const data = response.data;
      return {
        token: data.token || data.Token,
        username: data.username || data.Username,
        email: data.email || data.Email,
        roleName: data.roleName || data.RoleName
      };
    } catch (error) {
      const serverMessage = error.response?.data?.error || error.response?.data?.message;
      throw serverMessage || "Xác thực OTP thất bại!";
    }
  },

>>>>>>> Stashed changes
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('spotflow_user');
    localStorage.removeItem('spotflow_role');
<<<<<<< Updated upstream
=======
    localStorage.removeItem('spotflow_guest_isAuthenticated');
>>>>>>> Stashed changes
    window.location.href = '/login';
  }
};