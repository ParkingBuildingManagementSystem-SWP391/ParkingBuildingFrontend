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
  const { user, role, updateUser } = useAuth();
  const navigate = useNavigate();

  // Profile fields state
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleType, setVehicleType] = useState('Car');

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
