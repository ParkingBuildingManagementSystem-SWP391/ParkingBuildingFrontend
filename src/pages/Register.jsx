import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Mail, Phone, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { authService } from '../services/authService';
import { GoogleLogin } from '@react-oauth/google';

const Register = () => {
  const { loginWithUserData, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  // Multi-step state: 1 = Register Info, 2 = OTP Verification
  const [step, setStep] = useState(1);

  // Step 1 Form States
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(''); // Optional
  const [showPassword, setShowPassword] = useState(false);

  // Step 2 OTP State
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const otpInputsRef = useRef([]);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleOtpChange = (index, val) => {
    if (isNaN(val)) return;

    const newValues = [...otpValues];
    newValues[index] = val.slice(-1);
    setOtpValues(newValues);
    setErrorMsg('');

    if (val !== '' && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
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

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!username || !email || !password) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      await authService.register({
        username,
        email,
        password,
        phoneNumber: phoneNumber || null
      });
      
      // Success -> Move to OTP Step
      setStep(2);
      setLoading(false);
    } catch (err) {
      console.error("Register err:", err);
      setErrorMsg(err.message || 'Failed to register. Username or email may already exist.');
      setLoading(false);
    }
  };

  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    const otpString = otpValues.join('');
    if (otpString.length < 6) {
      setErrorMsg('Please enter a valid 6-digit OTP.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const verifyRes = await authService.verifyEmail(email, otpString);
      
      if (verifyRes) {
        const loginRes = await authService.login(email, password);
        
        loginWithUserData(loginRes.user);
        localStorage.setItem('token', loginRes.token);
        localStorage.setItem('spotflow_guest_isAuthenticated', 'true');
        
        navigate('/parking-map');
      }
    } catch (err) {
      console.error("OTP Verify err:", err);
      setErrorMsg(err.message || 'Invalid or expired OTP code.');
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setErrorMsg('');
    
    const res = await loginWithGoogle(credentialResponse.credential);
    setLoading(false);
    
    if (res.success) {
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
      setErrorMsg(res.message || 'Google authentication failed.');
    }
  };

  const handleGoogleError = () => {
    setErrorMsg('Google login was unsuccessful.');
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-[#E6EFFF] via-[#F4F7FF] to-[#DCE6FA] font-sans select-none">
      
      {/* Background Soft Gradients */}
      <div className="absolute top-0 left-0 w-full h-[40vh] bg-gradient-to-b from-blue-100/60 to-transparent" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-200/40 blur-[120px] pointer-events-none" />

      {/* Main Card */}
      <div className="w-full max-w-[420px] mx-4 bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,30,100,0.08)] p-8 sm:p-10 relative z-10 border border-white">
        
        {step === 1 && (
          <>
            <div className="text-center mb-10">
              <h1 className="text-3xl font-extrabold text-[#2A2B4E] mb-2 font-sans tracking-tight">Create Account</h1>
              <p className="text-sm font-medium text-[#7A859E]">Sign up to get started</p>
            </div>

            {errorMsg && (
              <div className="mb-6 bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-2xl text-sm flex items-center gap-2">
                <AlertCircle size={16} />
                <span className="font-medium">{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              
              <div className="flex flex-col">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#9AA5BE] group-focus-within:text-blue-500 transition-colors">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                    className="w-full h-12 pl-12 pr-4 bg-[#F5F8FC] border border-transparent rounded-[1.25rem] text-sm text-[#2A2B4E] placeholder-[#9AA5BE] focus:bg-white focus:border-blue-200 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.1)] focus:outline-none transition-all shadow-inner"
                  />
                </div>
                <p className="text-[11px] text-[#7A859E] mt-1.5 ml-4 font-medium tracking-wide">e.g. giang</p>
              </div>

              <div className="flex flex-col">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#9AA5BE] group-focus-within:text-blue-500 transition-colors">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="w-full h-12 pl-12 pr-4 bg-[#F5F8FC] border border-transparent rounded-[1.25rem] text-sm text-[#2A2B4E] placeholder-[#9AA5BE] focus:bg-white focus:border-blue-200 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.1)] focus:outline-none transition-all shadow-inner"
                  />
                </div>
                <p className="text-[11px] text-[#7A859E] mt-1.5 ml-4 font-medium tracking-wide">e.g. nguyengiang14012005@gmail.com</p>
              </div>

              <div className="flex flex-col">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#9AA5BE] group-focus-within:text-blue-500 transition-colors">
                    <Phone size={18} />
                  </div>
                  <input
                    type="tel"
                    placeholder="Phone Number (Optional)"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={loading}
                    className="w-full h-12 pl-12 pr-4 bg-[#F5F8FC] border border-transparent rounded-[1.25rem] text-sm text-[#2A2B4E] placeholder-[#9AA5BE] focus:bg-white focus:border-blue-200 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.1)] focus:outline-none transition-all shadow-inner"
                  />
                </div>
                <p className="text-[11px] text-[#7A859E] mt-1.5 ml-4 font-medium tracking-wide">e.g. 0908231088</p>
              </div>

              <div className="flex flex-col">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#9AA5BE] group-focus-within:text-blue-500 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="w-full h-12 pl-12 pr-12 bg-[#F5F8FC] border border-transparent rounded-[1.25rem] text-sm text-[#2A2B4E] placeholder-[#9AA5BE] focus:bg-white focus:border-blue-200 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.1)] focus:outline-none transition-all shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#9AA5BE] hover:text-blue-500 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-[11px] text-[#7A859E] mt-1.5 ml-4 font-medium tracking-wide">e.g. Giang@2005</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 mt-6 bg-gradient-to-r from-[#60A5FA] to-[#3B82F6] hover:from-[#3B82F6] hover:to-[#2563EB] text-white font-bold text-[15px] rounded-[1.25rem] shadow-[0_8px_20px_rgba(59,130,246,0.3)] hover:shadow-[0_10px_25px_rgba(59,130,246,0.4)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Sign Up'}
              </button>
            </form>

            {/* Divider */}
            <div className="mt-8 mb-6 flex items-center justify-center relative">
              <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-[#E2E8F0] to-transparent"></div>
              <span className="relative bg-white px-4 text-xs font-medium text-[#9AA5BE]">or continue with</span>
            </div>

            {/* Social Buttons */}
            <div className="flex justify-center gap-4 mb-8">
              {/* Custom Google Button Wrapper */}
              <div className="w-12 h-12 rounded-full bg-white shadow-[0_4px_15px_rgba(0,0,0,0.05)] border border-[#F1F5F9] flex items-center justify-center hover:scale-105 transition-transform overflow-hidden relative">
                <div className="absolute inset-0 opacity-0 cursor-pointer">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    type="icon"
                    shape="circle"
                  />
                </div>
                {/* Visual Icon */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </div>
            </div>

            <div className="mt-8 text-center">
              <span className="text-[13px] text-[#7A859E] font-medium">Already have an account? </span>
              <Link to="/login" className="text-[13px] font-bold text-[#4B0082] hover:text-[#3B82F6] transition-colors tracking-wide">
                Log In
              </Link>
            </div>
          </>
        )}

        {step === 2 && (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mb-6">
              <Mail size={32} />
            </div>
            
            <h1 className="text-2xl font-extrabold text-[#2A2B4E] mb-2 font-sans tracking-tight">Verify Email</h1>
            <p className="text-sm font-medium text-[#7A859E] text-center mb-8">
              We've sent a 6-digit code to <br/> <span className="font-bold text-[#2A2B4E]">{email}</span>
            </p>

            {errorMsg && (
              <div className="w-full mb-6 bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-2xl text-sm flex items-center gap-2">
                <AlertCircle size={16} />
                <span className="font-medium">{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtpSubmit} className="w-full flex flex-col items-center">
              <div className="flex gap-2 sm:gap-3 mb-8 w-full justify-center">
                {otpValues.map((val, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpInputsRef.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={val}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    disabled={loading}
                    className="w-11 h-12 sm:w-12 sm:h-14 bg-[#F5F8FC] border border-transparent rounded-xl text-xl text-center font-bold text-[#2A2B4E] focus:bg-white focus:border-blue-200 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.1)] focus:outline-none transition-all shadow-inner"
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={loading || otpValues.join('').length < 6}
                className="w-full h-14 bg-gradient-to-r from-[#60A5FA] to-[#3B82F6] hover:from-[#3B82F6] hover:to-[#2563EB] text-white font-bold text-[15px] rounded-[1.25rem] shadow-[0_8px_20px_rgba(59,130,246,0.3)] hover:shadow-[0_10px_25px_rgba(59,130,246,0.4)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Verify & Login'}
              </button>
            </form>

            <button 
              onClick={() => setStep(1)}
              disabled={loading}
              className="mt-6 text-sm font-bold text-[#7A859E] hover:text-[#2A2B4E] transition-colors"
            >
              Back to Sign Up
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default Register;