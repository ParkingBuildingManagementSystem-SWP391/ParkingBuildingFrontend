<<<<<<< Updated upstream
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Mail, Phone, KeyRound, Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react';
import { message } from 'antd';
import api from '../services/api';
=======
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Mail, Phone, Eye, EyeOff, ArrowRight, ArrowLeft, KeyRound } from 'lucide-react';
import { message } from 'antd';
import { authService } from '../services/authService';
>>>>>>> Stashed changes

const Register = () => {
  const { loginWithUserData } = useAuth();
  const navigate = useNavigate();

<<<<<<< Updated upstream
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
=======
  // Multi-step state: 1 = Register Info, 2 = OTP Verification
  const [step, setStep] = useState(1);

  // Step 1 Form States
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(''); // Optional, kept in local state
  const [showPassword, setShowPassword] = useState(false);

  // Step 2 OTP State (6 separate boxes for premium UX)
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const otpInputsRef = useRef([]);

  // General States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Handle auto-focus and navigation for OTP inputs
  const handleOtpChange = (index, val) => {
    if (isNaN(val)) return; // Only allow numbers

    const newValues = [...otpValues];
    newValues[index] = val.slice(-1); // Keep last char
    setOtpValues(newValues);
    setErrorMsg('');

    // Advance focus if value is entered
    if (val !== '' && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    // Backspace to delete and focus previous
    if (e.key === 'Backspace') {
      if (otpValues[index] === '' && index > 0) {
        const newValues = [...otpValues];
        newValues[index - 1] = '';
        setOtpValues(newValues);
        otpInputsRef.current[index - 1]?.focus();
      } else {
        const newValues = [...otpValues];
        newValues[index] = '';
        setOtpValues(newValues);
      }
      setErrorMsg('');
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (pastedData.length === 6 && /^\d+$/.test(pastedData)) {
      const newValues = pastedData.split('');
      setOtpValues(newValues);
      otpInputsRef.current[5]?.focus();
    }
  };

  // Submit Step 1: Account Info
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!username || !email || !password) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
>>>>>>> Stashed changes
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
<<<<<<< Updated upstream
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
=======
      // Send payload using authService
      const data = await authService.register(username, email, password);

      setLoading(false);
      
      // Read success message from response
      const successMsg = data?.message || 'Registration successful! Verification OTP sent.';
      message.success(successMsg);

      // Advance to OTP step
      setStep(2);
    } catch (error) {
      setLoading(false);
      console.error('Registration failed:', error);
      setErrorMsg(error);
      message.error(error);
    }
  };

  // Submit Step 2: OTP Verification
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const otpCode = otpValues.join('');
    if (otpCode.length < 6) {
      setErrorMsg('Please enter the complete 6-digit OTP code.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const userData = await authService.verifyOtp(email, otpCode);

      setLoading(false);
      message.success('Account verified successfully!');

      // Save token and user details to context and localStorage
      loginWithUserData(userData);

      // Redirect user to dashboard
      navigate('/dashboard');
    } catch (error) {
      setLoading(false);
      console.error('OTP Verification failed:', error);
      setErrorMsg(error);
      message.error(error);
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
      {/* 2. THE CARD CONTAINER */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 sm:p-10 border border-slate-100 z-10 animate-scale-in">
        
        {/* Header Block with stylized Brand logo */}
        <div className="flex items-center gap-4 mb-8">
=======
      {/* 2. THE REGISTER CARD CONTAINER */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 sm:p-10 border border-slate-100 z-10 animate-scale-in">
        
        {/* Header Block with stylized Brand logo */}
        <div className="flex items-center gap-4 mb-6">
>>>>>>> Stashed changes
          <div className="w-12 h-12 rounded-xl bg-[#1A62FF] flex items-center justify-center text-white font-extrabold text-2xl shadow-md shadow-blue-500/20 shrink-0">
            P
          </div>
          <div className="space-y-0.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight leading-snug">
<<<<<<< Updated upstream
              {step === 1 ? 'Create an account' : 'Verify Email Address'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              {step === 1 ? 'Sign up to access smart parking slots' : 'Enter the verification OTP code'}
=======
              {step === 1 ? 'Create an account' : 'Verify your email'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              {step === 1 ? 'Sign up for a driver account' : 'Enter the OTP code sent to your inbox'}
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
        {/* CONDITIONAL RENDERING: STEP 1 (Account Info Inputs) */}
        {step === 1 && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            
            {/* Username Input Group */}
=======
        {/* STEP 1: Account Info Form */}
        {step === 1 && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            
            {/* Username Input */}
>>>>>>> Stashed changes
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">Username <span className="text-rose-500">*</span></label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
<<<<<<< Updated upstream
                  required
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
=======
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setErrorMsg(''); }}
                  required
>>>>>>> Stashed changes
                  className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 text-sm rounded-xl focus:outline-none focus:border-[#1A62FF] focus:ring-1 focus:ring-[#1A62FF] focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

<<<<<<< Updated upstream
            {/* Email Input Group */}
=======
            {/* Email Input */}
>>>>>>> Stashed changes
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">Email Address <span className="text-rose-500">*</span></label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="email" 
<<<<<<< Updated upstream
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
=======
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrorMsg(''); }}
                  required
>>>>>>> Stashed changes
                  className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 text-sm rounded-xl focus:outline-none focus:border-[#1A62FF] focus:ring-1 focus:ring-[#1A62FF] focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

<<<<<<< Updated upstream
            {/* Phone Number Input Group */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">Phone Number (Optional)</label>
=======
            {/* Phone Number Input (Optional) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">Phone Number <span className="text-slate-400 font-normal">(Optional)</span></label>
>>>>>>> Stashed changes
              <div className="relative">
                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="tel" 
<<<<<<< Updated upstream
                  placeholder="e.g. 0901234567"
=======
                  placeholder="Enter your phone number"
>>>>>>> Stashed changes
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 text-sm rounded-xl focus:outline-none focus:border-[#1A62FF] focus:ring-1 focus:ring-[#1A62FF] focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

<<<<<<< Updated upstream
            {/* Password Input Group */}
=======
            {/* Password Input */}
>>>>>>> Stashed changes
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">Password <span className="text-rose-500">*</span></label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type={showPassword ? 'text' : 'password'} 
<<<<<<< Updated upstream
                  required
                  minLength={6}
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
=======
                  placeholder="Create a password (min. 6 characters)"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrorMsg(''); }}
                  required
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
            {/* Submit Register Button */}
=======
            {/* Submit Button */}
>>>>>>> Stashed changes
            <button 
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[#1A62FF] hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold rounded-xl transition-all shadow-md shadow-blue-500/10 active:scale-98 flex items-center justify-center gap-1.5 text-sm mt-6"
            >
<<<<<<< Updated upstream
              {loading ? 'Creating account...' : 'Sign Up & Send OTP'}
=======
              {loading ? 'Sending OTP...' : 'Register & Verify'}
>>>>>>> Stashed changes
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>
        )}

<<<<<<< Updated upstream
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
=======
        {/* STEP 2: OTP Verification Form */}
        {step === 2 && (
          <form onSubmit={handleOtpSubmit} className="space-y-6">
            
            {/* Read-only Email display */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">Verification Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  value={email}
                  readOnly
                  className="w-full h-11 pl-10 pr-4 bg-slate-100 border border-slate-200 text-sm rounded-xl text-slate-500 focus:outline-none cursor-not-allowed font-medium"
>>>>>>> Stashed changes
                />
              </div>
            </div>

<<<<<<< Updated upstream
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
=======
            {/* OTP Code Blocks */}
            <div className="space-y-2.5">
              <label className="text-xs font-semibold text-slate-700 block text-center">6-Digit OTP Code</label>
              
              <div className="flex justify-between gap-2 max-w-xs mx-auto" onPaste={handleOtpPaste}>
                {otpValues.map((val, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpInputsRef.current[idx] = el)}
                    type="text"
                    maxLength={1}
                    value={val}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-11 h-12 text-center text-lg font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#1A62FF] focus:ring-1 focus:ring-[#1A62FF] focus:bg-white transition-all font-mono"
                  />
                ))}
              </div>
            </div>

            {/* Actions button */}
            <div className="space-y-3 pt-2">
              <button 
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-[#1A62FF] hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold rounded-xl transition-all shadow-md shadow-blue-500/10 active:scale-98 flex items-center justify-center gap-1.5 text-sm"
              >
                {loading ? 'Verifying...' : 'Verify Code & Sign In'}
                {!loading && <KeyRound size={16} />}
              </button>

              <button 
                type="button"
                onClick={() => { setStep(1); setErrorMsg(''); }}
                className="w-full h-11 bg-transparent hover:bg-slate-55 text-slate-600 font-semibold rounded-xl border border-slate-200 transition-all active:scale-98 flex items-center justify-center gap-1.5 text-sm"
              >
                <ArrowLeft size={16} />
                Back to Registration
>>>>>>> Stashed changes
              </button>
            </div>
          </form>
        )}

        {/* Footer sign in link */}
<<<<<<< Updated upstream
        <div className="text-center mt-6">
=======
        <div className="text-center mt-6 pt-4 border-t border-slate-100">
>>>>>>> Stashed changes
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
