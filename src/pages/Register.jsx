import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Mail, Phone, Eye, EyeOff, ArrowRight, ArrowLeft, KeyRound } from 'lucide-react';
import { message } from 'antd';
import { authService } from '../services/authService';

const Register = () => {
  const { loginWithUserData } = useAuth();
  const navigate = useNavigate();

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
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
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

      {/* 2. THE REGISTER CARD CONTAINER */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 sm:p-10 border border-slate-100 z-10 animate-scale-in">
        
        {/* Header Block with stylized Brand logo */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-[#1A62FF] flex items-center justify-center text-white font-extrabold text-2xl shadow-md shadow-blue-500/20 shrink-0">
            P
          </div>
          <div className="space-y-0.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight leading-snug">
              {step === 1 ? 'Create an account' : 'Verify your email'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              {step === 1 ? 'Sign up for a driver account' : 'Enter the OTP code sent to your inbox'}
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

        {/* STEP 1: Account Info Form */}
        {step === 1 && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            
            {/* Username Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">Username <span className="text-rose-500">*</span></label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setErrorMsg(''); }}
                  required
                  className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 text-sm rounded-xl focus:outline-none focus:border-[#1A62FF] focus:ring-1 focus:ring-[#1A62FF] focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">Email Address <span className="text-rose-500">*</span></label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="email" 
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrorMsg(''); }}
                  required
                  className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 text-sm rounded-xl focus:outline-none focus:border-[#1A62FF] focus:ring-1 focus:ring-[#1A62FF] focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            {/* Phone Number Input (Optional) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">Phone Number <span className="text-slate-400 font-normal">(Optional)</span></label>
              <div className="relative">
                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="tel" 
                  placeholder="Enter your phone number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 text-sm rounded-xl focus:outline-none focus:border-[#1A62FF] focus:ring-1 focus:ring-[#1A62FF] focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">Password <span className="text-rose-500">*</span></label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="Create a password (min. 6 characters)"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrorMsg(''); }}
                  required
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

            {/* Submit Button */}
            <button 
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[#1A62FF] hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold rounded-xl transition-all shadow-md shadow-blue-500/10 active:scale-98 flex items-center justify-center gap-1.5 text-sm mt-6"
            >
              {loading ? 'Sending OTP...' : 'Register & Verify'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>
        )}

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
                />
              </div>
            </div>

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
              </button>
            </div>
          </form>
        )}

        {/* Footer sign in link */}
        <div className="text-center mt-6 pt-4 border-t border-slate-100">
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