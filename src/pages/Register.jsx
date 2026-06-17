import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Mail, Phone, Eye, EyeOff, ArrowRight, ArrowLeft, KeyRound, ChevronRight } from 'lucide-react';
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

      {/* 2. THE REGISTER CARD CONTAINER */}
      <div className="w-full max-w-[420px] bg-white/70 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_10px_40px_-10px_rgba(31,38,135,0.2)] p-8 sm:p-10 border border-white/80 z-10 animate-scale-in relative">
        
        {/* Header Block */}
        <div className="space-y-1.5 mb-8 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-[#2D3150]">
            {step === 1 ? 'Create an account' : 'Verify your email'}
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            {step === 1 ? 'Sign up for a driver account' : 'Enter the OTP code sent to your inbox'}
          </p>
        </div>

        {/* Dynamic validation error block */}
        {errorMsg && (
          <div className="bg-rose-50/80 backdrop-blur-sm border border-rose-200 text-rose-700 text-xs font-semibold p-3.5 rounded-2xl flex items-center gap-2 mb-6 shadow-sm">
            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full shrink-0"></span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: Account Info Form */}
        {step === 1 && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            
            {/* Username Input */}
            <div className="relative">
              <User size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Username *"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setErrorMsg(''); }}
                required
                className="w-full h-14 pl-14 pr-6 bg-white border-0 text-sm text-slate-800 placeholder-slate-400 rounded-full focus:outline-none focus:ring-2 focus:ring-[#9D95F5] transition-all font-medium shadow-[0_4px_14px_0_rgba(0,0,0,0.05)]"
              />
            </div>

            {/* Email Input */}
            <div className="relative">
              <Mail size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="email" 
                placeholder="Email Address *"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrorMsg(''); }}
                required
                className="w-full h-14 pl-14 pr-6 bg-white border-0 text-sm text-slate-800 placeholder-slate-400 rounded-full focus:outline-none focus:ring-2 focus:ring-[#9D95F5] transition-all font-medium shadow-[0_4px_14px_0_rgba(0,0,0,0.05)]"
              />
            </div>

            {/* Phone Number Input (Optional) */}
            <div className="relative">
              <Phone size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="tel" 
                placeholder="Phone Number (Optional)"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full h-14 pl-14 pr-6 bg-white border-0 text-sm text-slate-800 placeholder-slate-400 rounded-full focus:outline-none focus:ring-2 focus:ring-[#9D95F5] transition-all font-medium shadow-[0_4px_14px_0_rgba(0,0,0,0.05)]"
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <Lock size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type={showPassword ? 'text' : 'password'} 
                placeholder="Password (min. 6 chars) *"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrorMsg(''); }}
                required
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

            {/* Submit Button */}
            <div className="pt-2">
              <button 
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-[#656BE5] hover:bg-[#5258D6] disabled:opacity-50 text-white font-bold rounded-full transition-all shadow-[0_8px_20px_-6px_rgba(101,107,229,0.6)] active:scale-[0.98] flex items-center justify-center text-lg tracking-wide"
              >
                {loading ? 'Sending OTP...' : 'Sign Up'}
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: OTP Verification Form */}
        {step === 2 && (
          <form onSubmit={handleOtpSubmit} className="space-y-6">
            
            {/* Read-only Email display */}
            <div className="relative">
              <Mail size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                value={email}
                readOnly
                className="w-full h-14 pl-14 pr-6 bg-slate-50 border-0 text-sm rounded-full text-slate-500 focus:outline-none cursor-not-allowed font-medium shadow-inner"
              />
            </div>

            {/* OTP Code Blocks */}
            <div className="space-y-4 pt-2">
              <div className="flex justify-between gap-2 max-w-[280px] mx-auto" onPaste={handleOtpPaste}>
                {otpValues.map((val, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpInputsRef.current[idx] = el)}
                    type="text"
                    maxLength={1}
                    value={val}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-11 h-14 text-center text-xl font-bold bg-white border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#9D95F5] transition-all font-mono shadow-[0_4px_14px_0_rgba(0,0,0,0.05)] text-slate-800"
                  />
                ))}
              </div>
            </div>

            {/* Actions button */}
            <div className="pt-6 space-y-3">
              <button 
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-[#656BE5] hover:bg-[#5258D6] disabled:opacity-50 text-white font-bold rounded-full transition-all shadow-[0_8px_20px_-6px_rgba(101,107,229,0.6)] active:scale-[0.98] flex items-center justify-center text-lg tracking-wide"
              >
                {loading ? 'Verifying...' : 'Verify Code & Sign In'}
              </button>

              <button 
                type="button"
                onClick={() => { setStep(1); setErrorMsg(''); }}
                className="w-full h-12 bg-white hover:bg-slate-50 text-[#2D3150] font-bold rounded-full transition-all shadow-[0_4px_14px_0_rgba(0,0,0,0.05)] active:scale-[0.98] flex items-center justify-center text-sm tracking-wide"
              >
                <ArrowLeft size={16} className="mr-2" />
                Back to Registration
              </button>
            </div>
          </form>
        )}

        {/* Footer sign in link */}
        <div className="text-center mt-8">
          <span className="text-[13px] font-medium text-slate-500 flex items-center justify-center">
            Already have an account?{' '}
            <button 
              type="button"
              onClick={() => navigate('/login')}
              className="text-[#656BE5] font-bold hover:text-[#454ACC] transition-colors ml-1 flex items-center"
            >
              Log In <ChevronRight size={14} className="ml-0.5" />
            </button>
          </span>
        </div>

      </div>
    </div>
  );
};

export default Register;