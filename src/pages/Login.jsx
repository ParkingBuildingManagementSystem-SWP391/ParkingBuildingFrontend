import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Eye, EyeOff, ArrowRight, ChevronRight } from 'lucide-react';
import { message } from 'antd';
import Logo from '../components/Logo';
import { GoogleLogin } from '@react-oauth/google';

const Login = () => {
  const { login, loginWithGoogle } = useAuth(); 
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
        navigate('/accounts');
      } else if (res.user.role === 'Manager') {
        navigate('/dashboard');
      } else if (res.user.role === 'Staff') {
        navigate('/checkin-checkout');
      } else {
        navigate('/parking-map');
      }
    } else {
      // Hiển thị nội dung lỗi thật từ Backend (ví dụ: "Tài khoản hoặc mật khẩu không chính xác")
      setErrorMsg(res.message || 'Authentication error. Please try again.');
    }
  };


  // 3. Viết hàm callback xử lý khi người dùng chọn tài khoản Google thành công
  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setErrorMsg('');
    
    // credentialResponse.credential chứa ID Token (JWT) được trả về từ Google
    const res = await loginWithGoogle(credentialResponse.credential);
    setLoading(false);
    
    if (res.success) {
      message.success('Đăng nhập qua Google thành công!');
      
      // Chuyển hướng người dùng dựa vào quyền (Role) trả về từ Database thật
      if (res.user.role === 'Admin') {
        navigate('/accounts');
      } else if (res.user.role === 'Manager') {
        navigate('/dashboard');
      } else if (res.user.role === 'Staff') {
        navigate('/checkin-checkout');
      } else {
        navigate('/parking-map');
      }
    } else {
      setErrorMsg(res.message || 'Lỗi xác thực Google. Vui lòng thử lại!');
    }
  };

  const handleGoogleError = () => {
    setErrorMsg('Đăng nhập bằng tài khoản Google thất bại!');
  };

  return (
    <div 
      className="min-h-screen w-screen flex items-center justify-center relative overflow-hidden p-4 font-sans select-none bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url('/images/light_blue_parking_map.png')` }}
    >
      <style>{`
        input[type="password"]::-ms-reveal,
        input[type="password"]::-ms-clear {
          display: none;
        }
      `}</style>
      {/* Light overlay to soften the background slightly */}
      <div className="absolute inset-0 bg-white/20 pointer-events-none" />
      
      {/* Neomorphic / Soft Card */}
      <div className="w-full max-w-[420px] bg-white/70 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_10px_40px_-10px_rgba(31,38,135,0.2)] p-8 sm:p-10 border border-white/80 z-10 animate-scale-in relative">
        
        {/* Header Block */}
        <div className="space-y-1.5 mb-10 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-[#2D3150]">Welcome Back!</h1>
          <p className="text-sm text-slate-500 font-medium">Login to continue</p>
        </div>

        {errorMsg && (
          <div className="bg-rose-50/80 backdrop-blur-sm border border-rose-200 text-rose-700 text-xs font-semibold p-3.5 rounded-2xl flex items-center gap-2 mb-6 shadow-sm">
            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full shrink-0"></span>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-4">
          {/* Email input */}
          <div className="relative">
            <User size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="email" 
              required
              placeholder="Email"
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              className="w-full h-14 pl-14 pr-6 bg-white border-0 text-sm text-slate-800 placeholder-slate-400 rounded-full focus:outline-none focus:ring-2 focus:ring-[#9D95F5] transition-all font-medium shadow-[0_4px_14px_0_rgba(0,0,0,0.05)]"
            />
          </div>

          {/* Password input */}
          <div className="relative">
            <Lock size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type={showPassword ? 'text' : 'password'} 
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-14 pl-14 pr-14 bg-white border-0 text-sm text-slate-800 placeholder-slate-400 rounded-full focus:outline-none focus:ring-2 focus:ring-[#9D95F5] transition-all font-mono shadow-[0_4px_14px_0_rgba(0,0,0,0.05)]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#2D3150] transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          
          <div className="flex justify-end pt-1 pb-3">
            <a href="#" className="text-xs font-semibold text-[#8B85E3] hover:text-[#6761C0] transition-colors">
              Forgot Password?
            </a>
          </div>

          <div>
            <button 
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-[#656BE5] hover:bg-[#5258D6] disabled:opacity-50 text-white font-bold rounded-full transition-all shadow-[0_8px_20px_-6px_rgba(101,107,229,0.6)] active:scale-[0.98] flex items-center justify-center text-lg tracking-wide"
            >
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </div>
        </form>

        {/* OR Divider */}
        <div className="relative mt-8 mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200/80"></div>
          </div>
          <div className="relative flex justify-center text-xs font-semibold text-slate-500">
            <span className="bg-[#f0f5fc] px-4 rounded-full">or continue with</span>
          </div>
        </div>

        {/* Google Login (Custom Circle Icon with Invisible Overlay) */}
        <div className="flex justify-center w-full mb-6">
          <div className="relative flex items-center justify-center bg-white rounded-full shadow-[0_4px_14px_0_rgba(0,0,0,0.05)] hover:shadow-[0_6px_20px_0_rgba(0,0,0,0.1)] transition-all w-[46px] h-[46px] cursor-pointer">
            {/* Custom SVG Logo (Guaranteed to render) */}
            <svg className="w-[22px] h-[22px]" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.9c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.13-10.36 7.13-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            
            {/* Invisible GoogleLogin on top to catch clicks */}
            <div className="absolute inset-0 z-10 opacity-[0.01] flex items-center justify-center overflow-hidden rounded-full">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                type="icon"
                shape="circle"
              />
            </div>
          </div>
        </div>

        <div className="text-center mt-6 flex flex-col items-center gap-4">
          <span className="text-[13px] font-medium text-slate-500 flex items-center justify-center">
            Don't have an account?{' '}
            <button 
              type="button"
              onClick={() => navigate('/register')}
              className="text-[#656BE5] font-bold hover:text-[#454ACC] transition-colors ml-1 flex items-center"
            >
              Sign Up <ChevronRight size={14} className="ml-0.5" />
            </button>
          </span>
          
          <button 
            type="button"
            onClick={() => navigate('/parking-map')}
            className="text-xs font-semibold text-slate-400 hover:text-[#2D3150] transition-colors flex items-center gap-1 mt-2"
          >
            Continue as Guest to View Map <ArrowRight size={14} />
          </button>
        </div>

      </div>
    </div>
  );
};

export default Login;
