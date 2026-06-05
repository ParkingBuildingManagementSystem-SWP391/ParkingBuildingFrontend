import React from 'react';
import { Layout, Select, Avatar, Dropdown, Space, message } from 'antd';
import { useAuth } from '../context/AuthContext';
import { 
  ChevronDown, 
  LogOut, 
  User, 
  ShieldCheck, 
  UserCheck, 
  Contact,
  Map,
  Calendar as CalendarIcon,
  LayoutDashboard,
  Users,
  Settings,
  ScanLine,
  CreditCard,
  UserCog
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import logoImg from '../imports/image.png';

const { Header: AntHeader } = Layout;

const Header = () => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogoutClick = () => {
    logout();
    message.info('Logged out of system successfully');
    navigate('/login');
  };

  const getRoleBadge = (userRole) => {
    const baseClass = "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all duration-200 shadow-sm";
    switch (userRole?.toLowerCase()) {
      case 'admin':
        return (
          <span className={`${baseClass} bg-rose-50 text-rose-600 border-rose-200`}>
            <ShieldCheck size={12} className="text-rose-500 shrink-0" />
            Admin
          </span>
        );
      case 'manager':
        return (
          <span className={`${baseClass} bg-purple-50 text-purple-600 border-purple-200`}>
            <ShieldCheck size={12} className="text-purple-500 shrink-0" />
            Manager
          </span>
        );
      case 'staff':
        return (
          <span className={`${baseClass} bg-indigo-50 text-indigo-600 border-indigo-200`}>
            <UserCheck size={12} className="text-indigo-500 shrink-0" />
            Staff
          </span>
        );
      case 'driver':
      case 'member':
      case 'registered_driver':
      case 'customer':
        return (
          <span className={`${baseClass} bg-emerald-50 text-emerald-700 border-emerald-200`}>
            <Contact size={12} className="text-emerald-600 shrink-0" />
            Driver
          </span>
        );
      default:
        return null;
    }
  };

  // Profile menu items dropdown
  const profileMenuItems = [
    {
      key: 'profile',
      label: <span className="text-slate-600 font-medium">My Account Settings</span>,
      icon: <User size={14} className="text-slate-400" />,
      onClick: () => navigate('/settings')
    },
    ...((role && ['driver', 'member', 'registered_driver', 'customer'].includes(role.toLowerCase())) ? [{
      key: 'monthly-pass',
      label: <span className="text-slate-600 font-medium">Monthly Pass Card</span>,
      icon: <CreditCard size={14} className="text-slate-400" />,
      onClick: () => navigate('/monthly-pass')
    }] : []),
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: <span className="text-slate-500 font-normal">Sign Out</span>,
      icon: <LogOut size={14} className="text-slate-400" />,
      onClick: handleLogoutClick,
    },
  ];

  // Dynamic horizontal tab selector based on active role
  const getTabs = () => {
    const commonTabClass = "px-4 py-2 font-medium flex items-center gap-2 text-sm transition-all duration-200 rounded-lg";
    const activeTabClass = user
      ? `${commonTabClass} bg-white text-[#2563EB] shadow-sm font-bold`
      : `${commonTabClass} bg-[#2563EB] text-white shadow-sm font-bold`;
    const inactiveTabClass = user
      ? `${commonTabClass} bg-transparent text-white/80 hover:text-white hover:bg-white/10`
      : `${commonTabClass} bg-transparent text-slate-600 hover:text-[#2563EB] hover:bg-slate-100`;

    const currentPath = location.pathname;
    const lowerRole = role?.toLowerCase();

    // Guest view: only Parking Map is allowed
    if (!user) {
      return (
        <div className="flex items-center gap-1.5 bg-slate-100/50 border border-slate-200/50 rounded-xl p-1">
          <button
            onClick={() => navigate('/parking-map')}
            className={currentPath === '/parking-map' ? activeTabClass : inactiveTabClass}
          >
            <Map size={16} />
            Parking Map
          </button>
        </div>
      );
    }

    // Role 1: "Driver" (Driver View) -> Allowed Tabs: Parking Map, My Bookings
    if (lowerRole && ['driver', 'member', 'registered_driver', 'customer'].includes(lowerRole)) {
      return (
        <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl p-1">
          <button
            onClick={() => navigate('/parking-map')}
            className={currentPath === '/parking-map' ? activeTabClass : inactiveTabClass}
          >
            <Map size={16} />
            Parking Map
          </button>
          <button
            onClick={() => navigate('/my-bookings')}
            className={currentPath === '/my-bookings' ? activeTabClass : inactiveTabClass}
          >
            <CalendarIcon size={16} />
            My Bookings
          </button>
        </div>
      );
    }

    // Role 2: "Parking Staff" -> Allowed Tabs: Parking Map, My Bookings, Operations
    if (lowerRole === 'staff') {
      return (
        <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl p-1">
          <button
            onClick={() => navigate('/parking-map')}
            className={currentPath === '/parking-map' ? activeTabClass : inactiveTabClass}
          >
            <Map size={16} />
            Parking Map
          </button>
          <button
            onClick={() => navigate('/my-bookings')}
            className={currentPath === '/my-bookings' ? activeTabClass : inactiveTabClass}
          >
            <CalendarIcon size={16} />
            My Bookings
          </button>
          <button
            onClick={() => navigate('/checkin-checkout')}
            className={currentPath === '/checkin-checkout' ? activeTabClass : inactiveTabClass}
          >
            <ScanLine size={16} />
            Operations
          </button>
        </div>
      );
    }

    // Role 3: "Parking Manager" & Role 4: "System Admin" -> Allowed Tabs: Dashboard, Operations, Parking Map
    if (lowerRole === 'manager' || lowerRole === 'admin') {
      return (
        <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl p-1">
          <button
            onClick={() => navigate('/dashboard')}
            className={currentPath === '/dashboard' ? activeTabClass : inactiveTabClass}
          >
            <LayoutDashboard size={16} />
            Dashboard
          </button>
          <button
            onClick={() => navigate('/checkin-checkout')}
            className={currentPath === '/checkin-checkout' ? activeTabClass : inactiveTabClass}
          >
            <ScanLine size={16} />
            Operations
          </button>
          <button
            onClick={() => navigate('/parking-map')}
            className={currentPath === '/parking-map' ? activeTabClass : inactiveTabClass}
          >
            <Map size={16} />
            Parking Map
          </button>
          {lowerRole === 'admin' && (
            <button
              onClick={() => navigate('/accounts')}
              className={currentPath === '/accounts' ? activeTabClass : inactiveTabClass}
            >
              <UserCog size={16} />
              Account Management
            </button>
          )}
        </div>
      );
    }

    return null;
  };

  const getInitials = (name) => {
    if (!name) return 'US';
    const cleanName = name.replace(/\s+/g, ' ').trim();
    const parts = cleanName.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const roleLabels = {
    driver: 'Driver',
    member: 'Driver',
    registered_driver: 'Driver',
    customer: 'Driver',
    staff: 'Parking Staff',
    manager: 'Parking Manager',
    admin: 'System Admin'
  };



  return (
    <AntHeader 
      className={`w-full px-6 py-4 flex items-center justify-between h-16 sticky top-0 z-50 shadow-md select-none border-none ${
        !user ? 'bg-white border-b border-slate-100' : ''
      }`}
      style={{ backgroundColor: user ? '#2563EB' : '#FFFFFF', padding: '0 24px', lineHeight: 'normal' }}
    >
      
      {/* Left Side (Brand Logo & Navigation Tabs) */}
      <div className="flex items-center gap-6">
        
        {/* Brand Logo Layout */}
        <div 
          className="flex items-center gap-3 shrink-0 cursor-pointer" 
          onClick={() => navigate(user ? '/dashboard' : '/parking-map')}
        >
          <LayoutDashboard className={`w-6 h-6 ${user ? 'text-white' : 'text-[#2563EB]'}`} />
          <span className={`font-bold text-lg tracking-wide ${user ? 'text-white' : 'text-slate-800'}`}>Smart Parking System</span>
        </div>

        {/* Vertical Divider */}
        <div className={`h-6 w-px hidden md:block ${user ? 'bg-white/20' : 'bg-slate-200'}`}></div>

        {/* Horizontal Navigation Tabs Selector */}
        <div className="hidden md:block">
          {getTabs()}
        </div>

      </div>

      {/* Right Side (User Profile & Presentation Switcher / Guest Public View Header) */}
      <div className="flex items-center gap-4">
        
        {user ? (
          <>
            {/* Static Role Display Badge */}
            <div className="flex items-center gap-1.5 bg-white/10 text-white font-semibold text-xs px-3.5 py-2 rounded-xl border border-white/10 select-none">
              <span>{roleLabels[role?.toLowerCase()] || role}</span>
            </div>

            {/* Circular Avatar Initials */}
            <div className="flex items-center pl-3 border-l border-white/20">
              <Dropdown menu={{ items: profileMenuItems }} trigger={['click']} placement="bottomRight">
                <div className="cursor-pointer group flex items-center hover:opacity-90 transition-all select-none">
                  <div className="w-9 h-9 rounded-full bg-white text-[#2563EB] font-bold flex items-center justify-center text-sm border border-white/20 shadow-md shrink-0 transition-transform group-hover:scale-105">
                    {getInitials(user.name)}
                  </div>
                </div>
              </Dropdown>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-4">
            {/* Public view warning banner */}
            <div className="flex items-center gap-2 text-slate-555 text-slate-500 font-medium text-xs sm:text-sm bg-slate-50 border border-slate-100 py-1.5 px-3 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>Public view — read only</span>
            </div>
            
            {/* Royal blue Sign In button */}
            <button 
              onClick={() => navigate('/login')}
              className="bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-xl transition-all shadow-md shadow-blue-500/10 active:scale-98"
            >
              Sign In
            </button>
          </div>
        )}

      </div>

    </AntHeader>
  );
};

export default Header;
