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
  const { user, role, switchRole, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleRoleChange = (value) => {
    switchRole(value);
    message.success(`Switched workspace view to: ${value.toUpperCase()}`);
    // Navigate to dashboard automatically to refresh context
    navigate('/dashboard');
  };

  const handleLogoutClick = () => {
    logout();
    message.info('Logged out of system successfully');
    navigate('/login');
  };

  const getRoleBadge = (userRole) => {
    switch (userRole) {
      case 'admin':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
            <ShieldCheck size={10} />
            Admin
          </span>
        );
      case 'manager':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-600 border border-purple-200">
            <ShieldCheck size={10} />
            Manager
          </span>
        );
      case 'staff':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-200">
            <UserCheck size={10} />
            Staff
          </span>
        );
      case 'driver':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Contact size={10} />
            User
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
    },
    ...(role === 'driver' ? [{
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
    const commonTabClass = "px-4 py-2 font-medium flex items-center gap-2 text-sm transition-all duration-200 rounded-xl";
    const activeTabClass = `${commonTabClass} bg-[#1A62FF] text-white shadow-sm shadow-blue-500/10`;
    const inactiveTabClass = `${commonTabClass} bg-transparent text-slate-600 hover:text-slate-900`;

    const currentPath = location.pathname;

    // Role 1: "User" (Driver View) -> Allowed Tabs: Parking Map, My Bookings
    if (role === 'driver') {
      return (
        <div className="flex items-center gap-2 border border-slate-100 rounded-2xl p-1 bg-slate-50/50">
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
    if (role === 'staff') {
      return (
        <div className="flex items-center gap-2 border border-slate-100 rounded-2xl p-1 bg-slate-50/50">
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
    if (role === 'manager' || role === 'admin') {
      return (
        <div className="flex items-center gap-2 border border-slate-100 rounded-2xl p-1 bg-slate-50/50">
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
          {role === 'admin' && (
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

  return (
    <AntHeader className="w-full bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between h-16 sticky top-0 z-50 shadow-sm select-none">
      
      {/* Left Side (Brand Logo & Navigation Tabs) */}
      <div className="flex items-center gap-6">
        
        {/* Brand Logo Layout */}
        <div className="flex items-center gap-3 shrink-0 cursor-pointer" onClick={() => navigate('/dashboard')}>
          <img src={logoImg} alt="SpotFlow Logo" className="w-8 h-8 rounded object-contain" />
          <div className="flex flex-col">
            <span className="font-bold text-slate-800 text-sm tracking-wide leading-none">SpotFlow</span>
            <span className="text-[10px] text-indigo-650 mt-1 font-bold tracking-wider uppercase leading-none">Parking Building</span>
          </div>
        </div>

        {/* Vertical Divider */}
        <div className="h-6 w-px bg-slate-200 hidden md:block"></div>

        {/* Horizontal Navigation Tabs Selector */}
        <div className="hidden md:block">
          {getTabs()}
        </div>

      </div>

      {/* Right Side (User Profile & Presentation Switcher) */}
      <div className="flex items-center gap-5">
        
        {/* Dynamic Presentation Role Switcher Dropdown */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1 shadow-sm">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider hidden sm:inline-block">Role Switcher:</span>
          <Select
            value={role}
            onChange={handleRoleChange}
            variant="borderless"
            className="w-36 text-indigo-600 font-bold text-xs"
            dropdownStyle={{ background: '#ffffff' }}
            options={[
              { value: 'driver', label: 'User' },
              { value: 'staff', label: 'Parking Staff' },
              { value: 'manager', label: 'Parking Manager' },
              { value: 'admin', label: 'System Admin' },
            ]}
          />
        </div>

        {/* Profile Card & User Badge */}
        {user && (
          <div className="flex items-center gap-3 pl-2 border-l border-slate-100">
            
            {/* 1 User Badge */}
            {role === 'driver' && (
              <span className="hidden sm:inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-100">
                1 User
              </span>
            )}

            <div className="flex flex-col items-end hidden lg:flex">
              <span className="text-xs font-extrabold text-slate-800 leading-none">{user.name}</span>
              <span className="mt-1">{getRoleBadge(role)}</span>
            </div>
            
            <Dropdown menu={{ items: profileMenuItems }} trigger={['click']} placement="bottomRight">
              <Space className="cursor-pointer group">
                <Avatar 
                  src={user.avatar} 
                  alt={user.name} 
                  size={36}
                  className="ring-2 ring-indigo-600/10 group-hover:ring-indigo-600/30 transition-all shadow-sm bg-slate-100"
                />
                <ChevronDown size={14} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
              </Space>
            </Dropdown>

          </div>
        )}

      </div>

    </AntHeader>
  );
};

export default Header;
