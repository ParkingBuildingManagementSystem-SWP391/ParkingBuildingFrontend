import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { message } from 'antd';
import Logo from '../components/Logo';

const Login = () => {
  const { login } = useAuth(); // Hàm login này giờ đã là hàm async gọi API thật
  const navigate = useNavigate();

  // Controlled component states
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Đust CHUYỂN THÀNH HÀM ASYNC ĐỂ GỌI API THẬT
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!usernameOrEmail || !password) {
      setErrorMsg('Please enter both username or email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    // ĐÃ SỬA: Bỏ setTimeout, gọi trực tiếp API Backend thông qua AuthContext
    const res = await login(usernameOrEmail, password);
    setLoading(false);
    
    if (res.success) {
      // ĐĂ CẬP NHẬT: Lưu trạng thái đồng bộ khớp với DB
      localStorage.setItem('spotflow_guest_isAuthenticated', 'true');
      
      // Chuyển hướng người dùng dựa vào quyền (Role) trả về từ Database thật
      if (res.user.role === 'Admin') {
        navigate('/dashboard');
      } else if (res.user.role === 'Staff') {
        navigate('/staff-management');
      } else {
        navigate('/dashboard'); // Hoặc trang bản đồ /guest-parking-map tùy bạn phân phối
      }
    } else {
      // Hiển thị nội dung lỗi thật từ Backend (ví dụ: "Tài khoản hoặc mật khẩu không chính xác")
      setErrorMsg(res.message || 'Authentication error. Please try again.');
    }
  };


  return (
    <div className="min-h-screen w-screen bg-[#F5F5F5] flex items-center justify-center relative overflow-hidden p-4 font-sans select-none">
      
      {/* 1. LAYOUT BACKGROUND ARCHITECTURE */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{ 
          backgroundImage: 'radial-gradient(#1A62FF 2px, transparent 2px), linear-gradient(to right, #1A62FF 1px, transparent 1px), linear-gradient(to bottom, #1A62FF 1px, transparent 1px)',
          backgroundSize: '24px 24px, 72px 72px, 72px 72px' 
        }}
      />
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* 2. THE LOGIN CARD CONTAINER */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 sm:p-10 border border-slate-100 z-10 animate-scale-in">
        
        {/* Header Block with Brand logo */}
        <div className="space-y-5 mb-8">
          <Logo imageClassName="h-14" textClassName="text-sm text-slate-700" />
          <div className="space-y-0.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight leading-snug">Login to your account</h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">Access your parking bookings</p>
          </div>
        </div>

        {/* Dynamic validation error block */}
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold p-3.5 rounded-xl flex items-center gap-2 mb-5">
            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full shrink-0"></span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Input Form Elements */}
        <form onSubmit={handleFormSubmit} className="space-y-4">
          
          {/* Identifier input group (Username or Email) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">Username or Email</label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Enter your username or email"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 text-sm rounded-xl focus:outline-none focus:border-[#1A62FF] focus:ring-1 focus:ring-[#1A62FF] focus:bg-white transition-all font-medium"
              />
            </div>
          </div>

          {/* Password input group */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type={showPassword ? 'text' : 'password'} 
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 pl-10 pr-10 bg-slate-50 border border-slate-200 text-sm rounded-xl focus:outline-none focus:border-[#1A62FF] focus:ring-1 focus:ring-[#1A62FF] focus:bg-white transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Action CTAs */}
          <button 
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-[#1A62FF] hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold rounded-xl transition-all shadow-md shadow-blue-500/10 active:scale-98 flex items-center justify-center gap-1.5 text-sm mt-6"
          >
            {loading ? 'Logging in...' : 'Login & Continue'}
            {!loading && <ArrowRight size={16} />}
          </button>

        </form>

        {/* Footer sign up link */}
        <div className="text-center mt-6">
          <span className="text-xs text-slate-500">
            Don't have an account?{' '}
            <button 
              type="button"
              onClick={() => navigate('/register')}
              className="text-[#1A62FF] font-bold hover:underline"
            >
              Sign Up
            </button>
          </span>
        </div>

      </div>
    </div>
  );
};

export default Login;
