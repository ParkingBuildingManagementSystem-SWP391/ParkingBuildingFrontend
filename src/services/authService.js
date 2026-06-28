import api from './api';

export const authService = {
  // 1. Hàm Đăng nhập - Ép chuẩn gửi bằng Email sang Backend .NET
  login: async (usernameOrEmail, password) => {
    try {
      let emailValue = '';
      let passwordValue = '';

      // Trường hợp AuthContext truyền vào cả cụm Object { usernameOrEmail, password }
      if (typeof usernameOrEmail === 'object' && usernameOrEmail !== null) {
        emailValue = usernameOrEmail.usernameOrEmail || usernameOrEmail.email || usernameOrEmail.Username || usernameOrEmail.Email;
        passwordValue = usernameOrEmail.password || usernameOrEmail.Password;
      } else {
        // Trường hợp truyền tham số rời rạc
        emailValue = usernameOrEmail;
        passwordValue = password;
      }

      // Đảm bảo loại bỏ khoảng trắng rác ở email
      emailValue = typeof emailValue === 'string' ? emailValue.trim() : emailValue;

      // ĐÓNG GÓI PAYLOAD: Gửi đồng thời cả 'email' và 'usernameOrEmail' để thỏa mãn mọi kiểu Validate của Backend
      const payload = {
        email: emailValue,
        Email: emailValue,
        usernameOrEmail: emailValue,
        UsernameOrEmail: emailValue,
        password: passwordValue,
        Password: passwordValue
      };

      // Gửi request lên Backend
      const response = await api.post('/Auth/login', payload);

      const data = response.data;
      return {
        token: data.token || data.Token,
        username: data.username || data.Username,
        email: data.email || data.Email,
        phoneNumber: data.phoneNumber || data.PhoneNumber,
        roleName: data.roleName || data.RoleName
      };
    } catch (error) {
      // Bóc tách chi tiết lỗi Validation trả về từ .NET (nếu có)
      const serverMessage = error.response?.data?.error ||
        error.response?.data?.title ||
        error.response?.data?.message ||
        (error.response?.data?.errors ? Object.values(error.response.data.errors).flat().join(', ') : null);
      throw serverMessage || "Đăng nhập thất bại. Vui lòng kiểm tra lại!";
    }
  },

  // 2. Hàm Đăng ký tài khoản mới
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
      const serverMessage = error.response?.data?.error || error.response?.data?.message || error.response?.data?.title;
      throw serverMessage || "Đăng ký thất bại. Vui lòng thử lại!";
    }
  },

  // 3. Hàm Xác thực mã OTP
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
        phoneNumber: data.phoneNumber || data.PhoneNumber,
        roleName: data.roleName || data.RoleName
      };
    } catch (error) {
      const serverMessage = error.response?.data?.error || error.response?.data?.message || error.response?.data?.title;
      throw serverMessage || "Xác thực OTP thất bại!";
    }
  },

  // 4. Hàm Đăng nhập bằng Google
  loginWithGoogle: async (idToken) => {
    try {
      const payload = {
        idToken: idToken,
        IdToken: idToken,
        token: idToken,
        Token: idToken,
        credential: idToken,
        Credential: idToken
      };
      
      const response = await api.post('/Auth/google', payload);
      const data = response.data;
      
      return {
        token: data.token || data.Token,
        username: data.username || data.Username,
        email: data.email || data.Email,
        phoneNumber: data.phoneNumber || data.PhoneNumber,
        roleName: data.roleName || data.RoleName
      };
    } catch (error) {
      const serverMessage = error.response?.data?.error || 
                            error.response?.data?.message || 
                            error.response?.data?.title;
      throw serverMessage || "Đăng nhập Google thất bại. Vui lòng thử lại!";
    }
  },

  // 5. Hàm Đăng xuất
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('spotflow_user');
    localStorage.removeItem('spotflow_role');
    localStorage.removeItem('spotflow_guest_isAuthenticated');
    window.location.href = '/login';
  }
};
