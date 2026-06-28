import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Khởi tạo và kiểm tra dữ liệu đăng nhập cũ khi tải lại trang (F5)
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const savedUser = localStorage.getItem('spotflow_user');
        const savedRole = localStorage.getItem('spotflow_role');

        if (savedUser && savedUser !== "undefined" && savedRole && savedRole !== "undefined") {
          try {
            // Khối catch riêng biệt để xử lý nếu chuỗi JSON bị lỗi cấu trúc, tránh làm sập app
            const parsedUser = JSON.parse(savedUser);
            setUser(parsedUser);
            setRole(savedRole);
          } catch (jsonError) {
            console.error("Dữ liệu JSON lưu trữ bị lỗi cấu trúc, tiến hành dọn dẹp...", jsonError);
            handleInitialClear();
          }
        } else {
          handleInitialClear();
        }
      } catch (e) {
        console.error("Lỗi hệ thống khi đọc session cũ:", e);
        handleInitialClear();
      } finally {
        setLoading(false);
      }
    };

    const handleInitialClear = () => {
      setUser(null);
      setRole(null);
      localStorage.removeItem('spotflow_user');
      localStorage.removeItem('spotflow_role');
      localStorage.removeItem('token');
      localStorage.removeItem('spotflow_guest_isAuthenticated');
    };

    initializeAuth();
  }, []);



  const loginWithGoogle = async (googleIdToken) => {
    try {
      const data = await authService.loginWithGoogle(googleIdToken);

      if (!data) {
        throw new Error("Không nhận được phản hồi hợp lệ từ máy chủ.");
      }

      const rawRole = data.roleName || data.RoleName || "Registered_Driver";
      const matchedUser = {
        username: data.username || data.Username || "Google User",
        email: data.email || data.Email || '',
        phoneNumber: data.phoneNumber || data.PhoneNumber || '',
        role: rawRole
      };

      // Cập nhật State cho Frontend
      setUser(matchedUser);
      setRole(matchedUser.role);

      // Lưu trữ thông tin
      const tokenString = data.token || data.Token;
      if (tokenString) {
        localStorage.setItem('token', tokenString);
      }
      localStorage.setItem('spotflow_user', JSON.stringify(matchedUser));
      localStorage.setItem('spotflow_role', matchedUser.role);
      localStorage.setItem('spotflow_guest_isAuthenticated', 'true');

      return { success: true, user: matchedUser };
    } catch (error) {
      console.error("Lỗi xác thực Google SSO:", error);
      return { success: false, message: error || "Đăng nhập Google thất bại!" };
    }
  };

  /**
   * Hàm Login kết nối trực tiếp với API Backend thật (.NET)
   */
  const login = async (usernameOrEmail, password) => {
    try {
      const data = await authService.login({
        usernameOrEmail: usernameOrEmail,
        password: password
      });

      if (!data) {
        throw new Error("Không nhận được phản hồi hợp lệ từ máy chủ.");
      }

      const rawRole = data.roleName || data.RoleName || data.role || data.Role || "Member";
      const matchedUser = {
        username: data.username || data.Username || (typeof usernameOrEmail === 'string' ? usernameOrEmail.split('@')[0] : "User"),
        email: data.email || data.Email || '',
        phoneNumber: data.phoneNumber || data.PhoneNumber || '',
        role: rawRole
      };

      // Cập nhật State cho toàn bộ ứng dụng Frontend
      setUser(matchedUser);
      setRole(matchedUser.role);

      // Lưu Token và thông tin User một cách an toàn vào localStorage
      const tokenString = data.token || data.Token;
      if (tokenString) {
        localStorage.setItem('token', tokenString);
      }
      localStorage.setItem('spotflow_user', JSON.stringify(matchedUser));
      localStorage.setItem('spotflow_role', matchedUser.role);
      localStorage.setItem('spotflow_guest_isAuthenticated', 'true');

      return { success: true, user: matchedUser };

    } catch (error) {
      console.error("Quá trình đăng nhập xảy ra lỗi:", error);
      return { success: false, message: error || "Đăng nhập thất bại!" };
    }
  };

  /**
   * Hàm hỗ trợ đăng nhập trực tiếp từ dữ liệu trả về sau khi xác thực OTP thành công
   */
  const loginWithUserData = (data) => {
    if (!data) return;

    const rawRole = data.roleName || data.RoleName || data.role || data.Role || "Member";
    const matchedUser = {
      username: data.username || data.Username || data.email?.split('@')[0] || "User",
      email: data.email || data.Email || '',
      phoneNumber: data.phoneNumber || data.PhoneNumber || '',
      role: rawRole
    };

    setUser(matchedUser);
    setRole(matchedUser.role);

    const tokenString = data.token || data.Token;
    if (tokenString) {
      localStorage.setItem('token', tokenString);
    }
    localStorage.setItem('spotflow_user', JSON.stringify(matchedUser));
    localStorage.setItem('spotflow_role', matchedUser.role);
    localStorage.setItem('spotflow_guest_isAuthenticated', 'true');
  };

  /**
   * Đăng xuất xóa sạch token và toàn bộ trạng thái trong ứng dụng
   */
  const logout = () => {
    setUser(null);
    setRole(null);
    authService.logout();
  };

  const updateUser = (updatedFields) => {
    setUser(prev => {
      if (!prev) return null;
      const newUser = { ...prev, ...updatedFields };
      localStorage.setItem('spotflow_user', JSON.stringify(newUser));
      return newUser;
    });
  };

  const value = { user, role, loading, login, loginWithGoogle, loginWithUserData, logout, updateUser };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
