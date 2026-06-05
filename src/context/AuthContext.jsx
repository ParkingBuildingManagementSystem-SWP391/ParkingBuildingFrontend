import React, { createContext, useContext, useState, useEffect } from 'react';
import { PRESET_USERS } from '../services/mockData';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('spotflow_user');
      const savedRole = localStorage.getItem('spotflow_role');
      
      if (savedUser && savedUser !== "undefined" && savedRole && savedRole !== "undefined") {
        setUser(JSON.parse(savedUser));
        setRole(savedRole);
      } else {
        setUser(null);
        setRole(null);
      }
    } catch (e) {
      console.error("Lỗi đọc session cũ, đang clear cache...", e);
      localStorage.clear();
    } finally {
      setLoading(false);
    }
  }, []);

  /**
<<<<<<< Updated upstream
   * Thiết lập phiên đăng nhập sau khi nhận được thông tin xác thực từ server
   */
  const loginWithUserData = (data) => {
    const rawRole = data.RoleName || data.roleName || data.Role || data.role || "User";
    const matchedUser = {
      username: data.Username || data.username || data.Email || "User",
      role: rawRole
    };

    // Cập nhật State cho toàn bộ ứng dụng Frontend
    setUser(matchedUser);
    setRole(matchedUser.role);

    // Lưu Token và thông tin User một cách an toàn vào localStorage
    const tokenString = data.Token || data.token;
    if (tokenString) {
      localStorage.setItem('token', tokenString);
    }
    localStorage.setItem('spotflow_user', JSON.stringify(matchedUser));
    localStorage.setItem('spotflow_role', matchedUser.role);
    localStorage.setItem('spotflow_guest_isAuthenticated', 'true');

    return matchedUser;
  };

  /**
   * Hàm Login kết nối trực tiếp với API Backend thật (.NET)
   */
  const login = async (usernameOrEmail, password) => {
    try {
      // ĐÃ SỬA: Gửi đúng key 'usernameOrEmail' đồng bộ với authService
      const data = await authService.login({ 
        usernameOrEmail: usernameOrEmail, 
        password: password 
      });
      
      if (!data) {
        throw new Error("Không nhận được phản hồi hợp lệ từ máy chủ.");
      }
      
      const matchedUser = loginWithUserData(data);
      return { success: true, user: matchedUser };

    } catch (error) {
      console.error("Quá trình đăng nhập xảy ra lỗi:", error);
      return { success: false, message: error || "Đăng nhập thất bại!" };
    }
=======
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
        username: data.username || data.Username || usernameOrEmail.split('@')[0],
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

      return { success: true, user: matchedUser };

    } catch (error) {
      console.error("Quá trình đăng nhập xảy ra lỗi:", error);
      return { success: false, message: error || "Đăng nhập thất bại!" };
    }
  };

  /**
   * Hàm hỗ trợ đăng nhập trực tiếp từ dữ liệu trả về sau khi OTP thành công
   */
  const loginWithUserData = (data) => {
    if (!data) return;
    
    const rawRole = data.roleName || data.RoleName || data.role || data.Role || "Member";
    const matchedUser = {
      username: data.username || data.Username || data.email?.split('@')[0] || "User",
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
>>>>>>> Stashed changes
  };

  /**
   * Đăng xuất xóa sạch token và toàn bộ trạng thái trong ứng dụng
   */
  const logout = () => {
    setUser(null);
    setRole(null);
    authService.logout();
<<<<<<< Updated upstream
=======
  };

  // Giữ nguyên phục vụ mục đích demo/presentation khi mất mạng công cộng
  const switchRole = (newRole) => {
    const matchedUser = PRESET_USERS[newRole];
    if (matchedUser) {
      setUser(matchedUser);
      setRole(matchedUser.role);
      localStorage.setItem('spotflow_user', JSON.stringify(matchedUser));
      localStorage.setItem('spotflow_role', matchedUser.role);
      window.dispatchEvent(new Event('storage'));
      return true;
    }
    return false;
>>>>>>> Stashed changes
  };

  const updateUser = (updatedFields) => {
    setUser(prev => {
      if (!prev) return null;
      const newUser = { ...prev, ...updatedFields };
      localStorage.setItem('spotflow_user', JSON.stringify(newUser));
      return newUser;
    });
  };

<<<<<<< Updated upstream
  const value = { user, role, loading, login, logout, updateUser, loginWithUserData };
=======
  const value = { user, role, loading, login, loginWithUserData, logout, switchRole, updateUser };
>>>>>>> Stashed changes

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