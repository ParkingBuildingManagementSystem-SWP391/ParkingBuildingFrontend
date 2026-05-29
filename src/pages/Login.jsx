import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Phone, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Controlled component states
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Form submit handler
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!phoneNumber || !password) {
      setErrorMsg('Please enter both phone number and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    // Simulate network authentication latency
    setTimeout(() => {
      // Map mock credentials to auth flow helper in AuthContext
      const res = login('driver');
      setLoading(false);
      
      if (res.success) {
        // Save guest map sync states persistently
        localStorage.setItem('spotflow_guest_isAuthenticated', 'true');
        localStorage.setItem('spotflow_guest_user', JSON.stringify({
          phone: phoneNumber,
          role: 'User',
          avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=UserFlow'
        }));
        
        // Push user to main dashboard
        navigate('/dashboard');
      } else {
        setErrorMsg('Authentication error. Please try again.');
      }
    }, 500);
  };

  // Demo bypass triggers for validation and fast reviews
  const handleQuickDemoLogin = (roleName) => {
    setLoading(true);
    setTimeout(() => {
      const res = login(roleName);
      setLoading(false);
      if (res.success) {
        localStorage.setItem('spotflow_guest_isAuthenticated', 'true');
        localStorage.setItem('spotflow_guest_user', JSON.stringify({
          phone: roleName === 'admin' ? '0988888888' : roleName === 'staff' ? '0977777777' : '0915277878',
          role: roleName,
          avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${roleName}`
        }));
        navigate('/dashboard');
      }
    }, 300);
  };

  return (
    <div className="min-h-screen w-screen bg-[#F5F5F5] flex items-center justify-center relative overflow-hidden p-4 font-sans select-none">
      
      {/* 1. LAYOUT BACKGROUND ARCHITECTURE */}
      {/* Simulated floor plan grid lines */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{ 
          backgroundImage: 'radial-gradient(#1A62FF 2px, transparent 2px), linear-gradient(to right, #1A62FF 1px, transparent 1px), linear-gradient(to bottom, #1A62FF 1px, transparent 1px)',
          backgroundSize: '24px 24px, 72px 72px, 72px 72px' 
        }}
      />
      {/* Abstract blurred color gradients */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* 2. THE LOGIN CARD CONTAINER */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 sm:p-10 border border-slate-100 z-10 animate-scale-in">
        
        {/* Header Block with stylized Brand logo */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#1A62FF] flex items-center justify-center text-white font-extrabold text-2xl shadow-md shadow-blue-500/20 shrink-0">
            P
          </div>
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
          
          {/* Phone input group */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">Phone Number</label>
            <div className="relative">
              <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Enter your phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
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
              onClick={() => handleQuickDemoLogin('driver')}
              className="text-[#1A62FF] font-bold hover:underline"
            >
              Sign Up
            </button>
          </span>
        </div>

        {/* presentation bypass trigger card row */}
        <div className="mt-8 pt-6 border-t border-slate-100 space-y-3">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block text-center">Quick Presentation Demos</span>
          <div className="grid grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('admin')}
              className="py-2 h-9 rounded-lg border border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-slate-50 text-[10px] font-bold text-slate-600 transition-all active:scale-95"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('staff')}
              className="py-2 h-9 rounded-lg border border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-slate-50 text-[10px] font-bold text-slate-600 transition-all active:scale-95"
            >
              Staff
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('driver')}
              className="py-2 h-9 rounded-lg border border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-slate-50 text-[10px] font-bold text-slate-600 transition-all active:scale-95"
            >
              Driver
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
