import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Phone, 
  ShieldAlert, 
  CheckCircle, 
  Save, 
  Car, 
  Bike,
  Sparkles, 
  X,
  CreditCard,
  UserCheck,
  Check
} from 'lucide-react';

const Motorcycle = ({ size = 18, className = '' }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="5" cy="18" r="3" />
    <circle cx="19" cy="18" r="3" />
    <path d="M12 18V12H17L19 9" />
    <path d="M7.5 14H16.5" />
    <path d="M12 12L9 6H5" />
  </svg>
);

const Settings = () => {
  const { user, role, switchRole, updateUser } = useAuth();
  const navigate = useNavigate();

  // Profile fields state
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleType, setVehicleType] = useState('Car');

  // Admin section role switcher state
  const [selectedNewRole, setSelectedNewRole] = useState('driver');

  // Alert/Toast states
  const [alertMsg, setAlertMsg] = useState(null);
  const [alertType, setAlertType] = useState('success'); // 'success' | 'info'

  // Initialize fields on load or when user object changes
  useEffect(() => {
    if (user) {
      let displayUsername = user.username || 'driver_account';
      // Sanitizer: if the loaded username is simply the role identifier, output a proper unique username
      if (displayUsername === 'driver') displayUsername = 'david_miller';
      if (displayUsername === 'staff') displayUsername = 'sarah_connor';
      if (displayUsername === 'admin') displayUsername = 'alex_johnson';
      if (displayUsername === 'manager') displayUsername = 'robert_vance';

      setUsername(displayUsername);
      setFullName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || user.vehiclePlate || '0915277878');
      setVehicleType(user.vehicleType || 'Car');
    }
    if (role) {
      setSelectedNewRole(role);
    }
  }, [user, role]);

  // Handle profile changes save
  const handleSaveProfile = (e) => {
    e.preventDefault();

    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      setAlertType('info');
      setAlertMsg('Please fill in all profile fields.');
      setTimeout(() => setAlertMsg(null), 3000);
      return;
    }

    // Call context updater to save session data in localStorage & state
    updateUser({
      name: fullName,
      email: email,
      phone: phone,
      vehicleType: vehicleType
    });

    setAlertType('success');
    setAlertMsg('Account settings updated successfully!');
    setTimeout(() => setAlertMsg(null), 3500);
  };

  // Reset form to original values
  const handleCancelChanges = () => {
    if (user) {
      setFullName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || user.vehiclePlate || '0915277878');
      setVehicleType(user.vehicleType || 'Car');
    }
    setAlertType('info');
    setAlertMsg('Form edits have been discarded.');
    setTimeout(() => setAlertMsg(null), 3000);
  };

  // Handle Admin Switch Role Session promotion
  const handleAdminRolePromotion = (e) => {
    e.preventDefault();
    const success = switchRole(selectedNewRole);

    if (success) {
      setAlertType('success');
      setAlertMsg(`Role switched successfully to: ${selectedNewRole.toUpperCase()}`);
      setTimeout(() => {
        setAlertMsg(null);
        navigate('/dashboard');
      }, 1500);
    } else {
      setAlertType('info');
      setAlertMsg('Failed to switch roles. Please select a valid configuration.');
      setTimeout(() => setAlertMsg(null), 3000);
    }
  };

  const getVehicleIcon = (type) => {
    if (type === 'Bicycle') return <Bike size={18} className="text-blue-500" />;
    if (type === 'Motorcycle') return <Motorcycle size={18} className="text-indigo-500" />;
    return <Car size={18} className="text-indigo-650" />;
  };

  const displayRoleName = (r) => {
    if (r === 'driver') return 'Driver';
    if (r === 'staff') return 'Parking Staff';
    if (r === 'manager') return 'Parking Manager';
    if (r === 'admin') return 'System Admin';
    return r;
  };

  return (
    <div className="space-y-6 relative font-sans max-w-6xl mx-auto">
      
      {/* Toast Notification Banner */}
      {alertMsg && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 px-6 py-3.5 rounded-xl shadow-xl z-50 flex items-center gap-2 border animate-bounce text-white font-extrabold text-xs sm:text-sm ${
          alertType === 'success' 
            ? 'bg-emerald-600 border-emerald-500 shadow-emerald-500/10' 
            : 'bg-blue-600 border-blue-500 shadow-blue-500/10'
        }`}>
          <CheckCircle size={18} className="text-white" />
          <span>{alertMsg}</span>
        </div>
      )}

      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Account Settings</h1>
        <p className="text-sm text-slate-500">Configure your personal profile details, system preferences, and administrative tools</p>
      </div>

      {/* Main Form Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* User Profile Form Column (Left - occupies 2/3 wide on large displays) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-800 tracking-wide uppercase text-[11px]">Personal Information</h2>
              <p className="text-xs text-slate-400 mt-0.5">Edit your contact details and active vehicle profile</p>
            </div>
            <Sparkles size={16} className="text-[#2563EB] animate-pulse" />
          </div>

          <form onSubmit={handleSaveProfile} className="p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Username Input (Disabled based on best practices) */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Username</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-350" />
                  <input 
                    type="text" 
                    disabled
                    value={username}
                    className="w-full h-11 pl-10 pr-4 bg-slate-100/70 border border-slate-200 text-sm rounded-xl text-slate-450 font-semibold cursor-not-allowed select-none outline-none text-slate-500"
                  />
                </div>
                <span className="text-[10px] text-slate-400 font-medium block pl-1">Unique login key (cannot be modified)</span>
              </div>

              {/* Full Name Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Full Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 animate-pulse" />
                  <input 
                    type="text" 
                    required
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 text-sm rounded-xl focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] focus:bg-white transition-all font-semibold text-slate-800"
                  />
                </div>
              </div>

              {/* Email Address Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="email" 
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 text-sm rounded-xl focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] focus:bg-white transition-all font-semibold text-slate-800"
                  />
                </div>
              </div>

              {/* Phone Number Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Phone Number</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. 0915277878"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 text-sm rounded-xl focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] focus:bg-white transition-all font-mono font-bold text-slate-800"
                  />
                </div>
              </div>

              {/* Vehicle Type Dropdown */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Vehicle Preference</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                    {getVehicleIcon(vehicleType)}
                  </div>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 text-sm rounded-xl focus:outline-none focus:border-[#2563EB] focus:bg-white transition-all font-semibold text-slate-800 cursor-pointer"
                  >
                    <option value="Car">Car</option>
                    <option value="Motorbike">Motorbike</option>
                    <option value="Bicycle">Bicycle</option>
                  </select>
                </div>
              </div>

            </div>

            {/* Save Profile CTA buttons */}
            <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCancelChanges}
                className="flex-1 sm:flex-initial px-6 h-11 border border-slate-200 hover:bg-slate-55 hover:bg-slate-50 text-slate-600 hover:text-slate-800 font-bold rounded-xl transition-all text-sm flex items-center justify-center gap-1 bg-white"
              >
                <X size={15} />
                Cancel
              </button>
              
              <button
                type="submit"
                className="flex-1 sm:flex-initial px-8 h-11 bg-[#2563EB] hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md shadow-blue-500/10 flex items-center justify-center gap-1.5 text-sm"
              >
                <Save size={15} />
                Save Changes
              </button>
            </div>

          </form>
        </div>

        {/* Right Side Column: Stats or Admin Panel */}
        <div className="space-y-6 w-full">
          
          {/* Conditional Administrative Portal Action Box */}
          {role === 'admin' && (
            <div className="bg-white rounded-2xl border border-rose-100 shadow-md shadow-rose-50/10 overflow-hidden">
              
              {/* Header Header */}
              <div className="p-5 border-b border-rose-50 bg-rose-50/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="text-rose-500 shrink-0" size={16} />
                  <span className="text-[10px] font-extrabold text-rose-600 uppercase tracking-widest">Admin Portal Only</span>
                </div>
                <span className="bg-rose-100 text-rose-700 text-[9px] font-extrabold px-2 py-0.5 rounded-full border border-rose-200">
                  Access Granted
                </span>
              </div>

              {/* Body */}
              <form onSubmit={handleAdminRolePromotion} className="p-5 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-850 text-slate-800">Switch Session Role</h3>
                  <p className="text-xs text-slate-400 mt-0.5 leading-normal">
                    Change your current active role session to test different workflows and view permissions instantly.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-xs text-slate-600 flex justify-between items-center">
                  <span className="font-semibold text-slate-400">Current Role</span>
                  <span className="font-extrabold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-lg border border-rose-100 uppercase tracking-wider text-[10px]">
                    {displayRoleName(role)}
                  </span>
                </div>

                {/* Role Switcher Option Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Select Session Role</label>
                  <div className="relative">
                    <UserCheck size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select
                      value={selectedNewRole}
                      onChange={(e) => setSelectedNewRole(e.target.value)}
                      className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 text-xs rounded-xl focus:outline-none focus:border-rose-500 focus:bg-white transition-all font-bold text-slate-700 cursor-pointer"
                    >
                      <option value="driver">Driver</option>
                      <option value="staff">Parking Staff</option>
                      <option value="manager">Parking Manager</option>
                      <option value="admin">System Admin</option>
                    </select>
                  </div>
                </div>

                {/* Action button */}
                <button
                  type="submit"
                  className="w-full h-11 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-md shadow-rose-500/10 flex items-center justify-center gap-1.5 text-xs transition-all border border-rose-500 hover:scale-[1.01]"
                >
                  <ShieldAlert size={14} />
                  Update Role & Reload View
                </button>
              </form>

            </div>
          )}

          {/* Account Status / Overview Widget (Renders for everyone, providing nice context) */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
            <h3 className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Account Overview</h3>
            
            <div className="space-y-3 text-xs leading-normal">
              
              <div className="flex justify-between items-center py-0.5">
                <span className="text-slate-400 font-semibold">Verification Badge</span>
                <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
                  <Check size={14} className="bg-emerald-100 p-0.5 rounded-full" />
                  Verified Profile
                </span>
              </div>

              <div className="flex justify-between items-center py-0.5 border-t border-slate-50 pt-3">
                <span className="text-slate-400 font-semibold">System Tier</span>
                <span className="font-bold text-slate-750 text-slate-800 flex items-center gap-1">
                  <CreditCard size={14} className="text-[#2563EB]" />
                  Monthly Member
                </span>
              </div>

              <div className="flex justify-between items-center py-0.5 border-t border-slate-50 pt-3">
                <span className="text-slate-400 font-semibold">Account Status</span>
                <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
                  <span className="w-1.5 h-1.5 bg-[#00C853] rounded-full inline-block animate-pulse"></span>
                  Active Session
                </span>
              </div>

              {user && user.balance !== undefined && (
                <div className="flex justify-between items-center py-0.5 border-t border-slate-50 pt-3">
                  <span className="text-slate-400 font-semibold">Card Balance</span>
                  <span className="font-extrabold text-[#2563EB]">
                    {user.balance.toLocaleString('vi-VN')} đ
                  </span>
                </div>
              )}

            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default Settings;
