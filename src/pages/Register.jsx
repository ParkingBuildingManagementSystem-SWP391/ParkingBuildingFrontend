import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Mail, Phone, KeyRound, Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react';
import { message } from 'antd';
import api from '../services/api';

const Register = () => {
  const { loginWithUserData } = useAuth();
  const navigate = useNavigate();

  // Multi-step states
  const [step, setStep] = useState(1);

  // Controlled component states for Step 1
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  // Controlled component states for Step 2
  const [otpCode, setOtpCode] = useState('');

  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // STEP 1: Registration Form Submission
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!username || !email || !password) {
      setErrorMsg('Please fill in all required fields (Username, Email, and Password).');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      // Gửi thông tin đăng ký lên Backend (loại bỏ phoneNumber vì backend DTO chỉ nhận Username, Email, Password)
      const payload = {
        username: username.trim(),
        email: email.trim(),
        password: password
      };

      const response = await api.post('/Auth/register', payload);
      setLoading(false);

      // Đọc message thành công và hiển thị toast banner
      const successMessage = response.data?.message || 'Verification OTP code has been sent to your email!';
      message.success(successMessage);

      // Chuyển sang Bước 2 (Xác thực OTP)
      setStep(2);
    } catch (error) {
      setLoading(false);
      console.error("Lỗi đăng ký:", error);
      // Hiển thị lỗi trả về từ Backend
      const serverError = error.response?.data?.error || error.response?.data?.message || 'Registration failed. Please check your inputs.';
      setErrorMsg(serverError);
      message.error(serverError);
    }
  };

  // STEP 2: OTP Verification Submission
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      setErrorMsg('Please enter a valid 6-digit OTP code.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const payload = {
        email: email.trim(),
        otpCode: otpCode.trim()
      };

      const response = await api.post('/Auth/verify-otp', payload);
      setLoading(false);

      // Thành công, lấy dữ liệu AuthResponse (Token, Username, Email, RoleName)
      const authData = response.data;
      
      // Đồng bộ thông tin đăng nhập vào AuthContext & localStorage
      const userObj = loginWithUserData(authData);
      
      message.success('Account verified and registered successfully!');

      // Chuyển hướng về trang tương ứng
      if (userObj.role === 'Admin') {
        navigate('/dashboard');
      } else if (userObj.role === 'Staff') {
        navigate('/checkin-checkout');
      } else {
        navigate('/parking-map'); // Driver / Member mặc định chuyển về trang bản đồ
      }
    } catch (error) {
      setLoading(false);
      console.error("Lỗi xác thực OTP:", error);
      const serverError = error.response?.data?.error || error.response?.data?.message || 'OTP verification failed. Please try again.';
      setErrorMsg(serverError);
      message.error(serverError);
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

      {/* 2. THE CARD CONTAINER */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 sm:p-10 border border-slate-100 z-10 animate-scale-in">
        
        {/* Header Block with stylized Brand logo */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#1A62FF] flex items-center justify-center text-white font-extrabold text-2xl shadow-md shadow-blue-500/20 shrink-0">
            P
          </div>
          <div className="space-y-0.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight leading-snug">
              {step === 1 ? 'Create an account' : 'Verify Email Address'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              {step === 1 ? 'Sign up to access smart parking slots' : 'Enter the verification OTP code'}
            </p>
          </div>
        </div>

        {/* Dynamic validation error block */}
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold p-3.5 rounded-xl flex items-center gap-2 mb-5">
            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full shrink-0"></span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* CONDITIONAL RENDERING: STEP 1 (Account Info Inputs) */}
        {step === 1 && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            
            {/* Username Input Group */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">Username <span className="text-rose-500">*</span></label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  required
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 text-sm rounded-xl focus:outline-none focus:border-[#1A62FF] focus:ring-1 focus:ring-[#1A62FF] focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            {/* Email Input Group */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">Email Address <span className="text-rose-500">*</span></label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="email" 
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 text-sm rounded-xl focus:outline-none focus:border-[#1A62FF] focus:ring-1 focus:ring-[#1A62FF] focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            {/* Phone Number Input Group */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">Phone Number (Optional)</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="tel" 
                  placeholder="e.g. 0901234567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 text-sm rounded-xl focus:outline-none focus:border-[#1A62FF] focus:ring-1 focus:ring-[#1A62FF] focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            {/* Password Input Group */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">Password <span className="text-rose-500">*</span></label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  required
                  minLength={6}
                  placeholder="Min 6 characters"
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

            {/* Submit Register Button */}
            <button 
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[#1A62FF] hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold rounded-xl transition-all shadow-md shadow-blue-500/10 active:scale-98 flex items-center justify-center gap-1.5 text-sm mt-6"
            >
              {loading ? 'Creating account...' : 'Sign Up & Send OTP'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>
        )}

        {/* CONDITIONAL RENDERING: STEP 2 (OTP Verification Inputs) */}
        {step === 2 && (
          <form onSubmit={handleOtpSubmit} className="space-y-5">
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs text-slate-600 leading-relaxed">
              We have sent a verification code to <span className="font-semibold text-slate-800">{email}</span>. Please check your inbox.
            </div>

            {/* Read-Only Email Display Group */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 block">Registered Email</label>
              <div className="relative opacity-70">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  readOnly 
                  value={email}
                  className="w-full h-11 pl-10 pr-4 bg-slate-100 border border-slate-200 text-sm rounded-xl outline-none font-medium cursor-not-allowed text-slate-500"
                />
              </div>
            </div>

            {/* Active OTP Code Input Group */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">6-Digit OTP Code <span className="text-rose-500">*</span></label>
              <div className="relative">
                <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1A62FF]" />
                <input 
                  type="text" 
                  required
                  maxLength={6}
                  pattern="\d{6}"
                  placeholder="Enter 6-digit OTP code"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-[#1A62FF] text-sm rounded-xl focus:outline-none focus:ring-1 focus:ring-[#1A62FF] focus:bg-white tracking-widest font-mono text-center font-bold text-lg text-slate-800"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              {/* Back Button */}
              <button 
                type="button"
                onClick={() => {
                  setStep(1);
                  setErrorMsg('');
                  setOtpCode('');
                }}
                className="w-1/3 h-11 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5 text-sm"
              >
                <ArrowLeft size={16} />
                Back
              </button>

              {/* Submit Verification Button */}
              <button 
                type="submit"
                disabled={loading}
                className="w-2/3 h-11 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-semibold rounded-xl transition-all shadow-md shadow-emerald-500/10 active:scale-98 flex items-center justify-center gap-1.5 text-sm"
              >
                {loading ? 'Verifying OTP...' : 'Verify & Register'}
                {!loading && <ArrowRight size={16} />}
              </button>
            </div>
          </form>
        )}

        {/* Footer sign in link */}
        <div className="text-center mt-6">
          <span className="text-xs text-slate-500">
            Already have an account?{' '}
            <button 
              type="button"
              onClick={() => navigate('/login')}
              className="text-[#1A62FF] font-bold hover:underline"
            >
              Sign In
            </button>
          </span>
        </div>

      </div>
    </div>
  );
};

export default Register;
