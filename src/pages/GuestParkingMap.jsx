import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Bike, 
  Search, 
  Plus, 
  Minus, 
  Eye, 
  EyeOff, 
  Phone, 
  Lock, 
  X, 
  Info,
  ShieldAlert,
  ArrowRight,
  CheckCircle,
  ChevronDown,
  LogOut,
  UserCheck
} from 'lucide-react';
import logoImg from '../imports/image.png';

// Dynamic mock generator for Guest Parking Slots
const initGuestParkingMapSlots = () => {
  const slots = [];
  
  // Floor 1 (Bicycle - 15 spots, Motorcycle - 35 spots)
  let f1BikeAvail = 8, f1BikeOcc = 5, f1BikeRes = 2;
  for (let i = 1; i <= 15; i++) {
    let status = 'Occupied';
    if (i <= f1BikeAvail) status = 'Available';
    else if (i > f1BikeAvail + f1BikeOcc) status = 'Reserved';
    slots.push({ id: `B-${String(i).padStart(3, '0')}`, floor: 'Floor 1', zone: 'Bicycle', type: 'Bicycle', status });
  }
  let f1MotorAvail = 17, f1MotorOcc = 13, f1MotorRes = 5;
  for (let i = 1; i <= 35; i++) {
    let status = 'Occupied';
    if (i <= f1MotorAvail) status = 'Available';
    else if (i > f1MotorAvail + f1MotorOcc) status = 'Reserved';
    slots.push({ id: `M-${String(i).padStart(3, '0')}`, floor: 'Floor 1', zone: 'Motorcycle', type: 'Motorcycle', status });
  }

  // Floor 2
  let f2BikeAvail = 9, f2BikeOcc = 4, f2BikeRes = 2;
  for (let i = 1; i <= 15; i++) {
    let status = 'Occupied';
    if (i <= f2BikeAvail) status = 'Available';
    else if (i > f2BikeAvail + f2BikeOcc) status = 'Reserved';
    slots.push({ id: `B-${String(i).padStart(3, '0')}`, floor: 'Floor 2', zone: 'Bicycle', type: 'Bicycle', status });
  }
  let f2MotorAvail = 20, f2MotorOcc = 10, f2MotorRes = 5;
  for (let i = 1; i <= 35; i++) {
    let status = 'Occupied';
    if (i <= f2MotorAvail) status = 'Available';
    else if (i > f2MotorAvail + f2MotorOcc) status = 'Reserved';
    slots.push({ id: `M-${String(i).padStart(3, '0')}`, floor: 'Floor 2', zone: 'Motorcycle', type: 'Motorcycle', status });
  }

  // Basement
  let bsBikeAvail = 1, bsBikeOcc = 12, bsBikeRes = 2;
  for (let i = 1; i <= 15; i++) {
    let status = 'Occupied';
    if (i <= bsBikeAvail) status = 'Available';
    else if (i > bsBikeAvail + bsBikeOcc) status = 'Reserved';
    slots.push({ id: `B-${String(i).padStart(3, '0')}`, floor: 'Basement', zone: 'Bicycle', type: 'Bicycle', status });
  }
  let bsMotorAvail = 4, bsMotorOcc = 26, bsMotorRes = 5;
  for (let i = 1; i <= 35; i++) {
    let status = 'Occupied';
    if (i <= bsMotorAvail) status = 'Available';
    else if (i > bsMotorAvail + bsMotorOcc) status = 'Reserved';
    slots.push({ id: `M-${String(i).padStart(3, '0')}`, floor: 'Basement', zone: 'Motorcycle', type: 'Motorcycle', status });
  }

  return slots;
};

const GuestParkingMap = () => {
  const navigate = useNavigate();

  // Authentication Local States
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('spotflow_guest_isAuthenticated') === 'true';
  });
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('spotflow_guest_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Map & Controls States
  const [activeFloor, setActiveFloor] = useState('Floor 1');
  const [searchQuery, setSearchQuery] = useState('');
  const [zoomLevel, setZoomLevel] = useState(100);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [alertBanner, setAlertBanner] = useState(null);

  // Login Modal Form States
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Persistent slots state
  const [mapSlots, setMapSlots] = useState(() => {
    const saved = localStorage.getItem('spotflow_guest_map_slots');
    return saved ? JSON.parse(saved) : initGuestParkingMapSlots();
  });

  // Save map states & auth states persistently
  useEffect(() => {
    localStorage.setItem('spotflow_guest_map_slots', JSON.stringify(mapSlots));
  }, [mapSlots]);

  useEffect(() => {
    localStorage.setItem('spotflow_guest_isAuthenticated', String(isAuthenticated));
    if (user) {
      localStorage.setItem('spotflow_guest_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('spotflow_guest_user');
    }
  }, [isAuthenticated, user]);

  // Handle floor switching
  const handleFloorChange = (floorName) => {
    setActiveFloor(floorName);
    setSearchQuery('');
  };

  // Get active floor slots
  const currentFloorSlots = mapSlots.filter(s => s.floor === activeFloor);
  const bicycleSlots = currentFloorSlots.filter(s => s.zone === 'Bicycle');
  const motorcycleSlots = currentFloorSlots.filter(s => s.zone === 'Motorcycle');

  // Calculate stats dynamically based on map slots mutations
  const getFloorStats = () => {
    let baseAvailable = 25;
    let baseOccupied = 83;
    let baseReserved = 42;
    
    if (activeFloor === 'Floor 2') {
      baseAvailable = 29;
      baseOccupied = 79;
      baseReserved = 42;
    } else if (activeFloor === 'Basement') {
      baseAvailable = 5;
      baseOccupied = 103;
      baseReserved = 42;
    }
    
    // Scale stats counts based on grid available slots decrement
    const initialAvailable = activeFloor === 'Floor 1' ? 25 : activeFloor === 'Floor 2' ? 29 : 5;
    const currentAvailable = mapSlots.filter(s => s.floor === activeFloor && s.status === 'Available').length;
    const bookingsCount = initialAvailable - currentAvailable;
    
    const displayAvailable = currentAvailable;
    const displayOccupied = baseOccupied;
    const displayReserved = baseReserved + bookingsCount;
    const displayRate = Math.round(((displayOccupied + displayReserved) / 150) * 100);
    
    return {
      total: 150,
      available: displayAvailable,
      occupied: displayOccupied,
      reserved: displayReserved,
      rate: displayRate
    };
  };

  const stats = getFloorStats();

  // Zoom handlers
  const handleZoomIn = () => {
    if (zoomLevel < 150) setZoomLevel(prev => prev + 10);
  };
  const handleZoomOut = () => {
    if (zoomLevel > 70) setZoomLevel(prev => prev - 10);
  };

  // Handle green slot clicks
  const handleSlotClick = (slot, zoneName) => {
    if (slot.status === 'Available') {
      if (!isAuthenticated) {
        setSelectedSlot({
          slotId: slot.id,
          zoneName: zoneName,
          type: slot.type
        });
        setIsModalOpen(true);
        setLoginError('');
      } else {
        // Authenticated direct booking workflow
        setMapSlots(prev => 
          prev.map(s => 
            s.id === slot.id && s.floor === activeFloor 
              ? { ...s, status: 'Reserved' } 
              : s
          )
        );
        
        // Show success alert toast
        setAlertBanner(`Booking confirmed successfully for Slot ${slot.id}!`);
        setTimeout(() => {
          setAlertBanner(null);
        }, 4000);
      }
    }
  };

  // Login submission logic
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!phoneNumber || !password) {
      setLoginError('Please enter phone number and password.');
      return;
    }

    // Authenticate and save user profile info
    setIsAuthenticated(true);
    setUser({
      phone: phoneNumber,
      role: 'User',
      avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=UserFlow'
    });

    // Reset login fields
    setPhoneNumber('');
    setPassword('');
    setLoginError('');
    setIsModalOpen(false);

    // If a slot was pending click selection, book it automatically
    if (selectedSlot) {
      setMapSlots(prev => 
        prev.map(s => 
          s.id === selectedSlot.slotId && s.floor === activeFloor 
            ? { ...s, status: 'Reserved' } 
            : s
        )
      );
      
      setAlertBanner(`Booking confirmed successfully for Slot ${selectedSlot.slotId}!`);
      setTimeout(() => {
        setAlertBanner(null);
      }, 4000);
      
      setSelectedSlot(null);
    }
  };

  // Sign out workflow
  const handleSignOut = () => {
    setIsAuthenticated(false);
    setUser(null);
    setIsDropdownOpen(false);
  };

  // Filters slot cards based on ID
  const filterSlot = (slot) => {
    if (!searchQuery) return true;
    return slot.id.toLowerCase().includes(searchQuery.toLowerCase());
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col font-sans text-slate-800 antialiased relative">
      
      {/* Dynamic Success Booking Toast */}
      {alertBanner && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-emerald-600 text-white font-extrabold text-xs sm:text-sm px-6 py-3.5 rounded-xl shadow-xl shadow-emerald-500/10 z-50 flex items-center gap-2 border border-emerald-500 animate-bounce">
          <CheckCircle size={18} className="text-white animate-pulse" />
          <span>{alertBanner}</span>
        </div>
      )}

      {/* 1. HEADER SECTION */}
      <header className="sticky top-0 bg-white border-b border-slate-200/80 z-40 px-6 h-16 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <img src={logoImg} alt="SpotFlow Logo" className="w-8 h-8 rounded object-contain animate-pulse" />
          <div className="flex flex-col">
            <span className="font-extrabold text-slate-800 text-sm tracking-wide leading-none">SpotFlow</span>
            <span className="text-[10px] text-indigo-600 mt-1 font-bold tracking-wider uppercase leading-none">Parking Building</span>
          </div>
        </div>

        {/* Dynamic Auth Header Info */}
        <div className="flex items-center gap-4">
          
          {isAuthenticated && user ? (
            // Authenticated User View: displays user phone/avatar & sign out dropdown
            <div className="relative">
              <div 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2.5 pl-3 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-all select-none"
              >
                <img 
                  src={user.avatar} 
                  alt="Profile Avatar" 
                  className="w-7 h-7 rounded-full bg-slate-200 ring-2 ring-[#1A62FF]/10 shadow-sm"
                />
                <span className="text-xs font-bold text-slate-700 hidden sm:inline-block font-mono">{user.phone}</span>
                <ChevronDown size={14} className="text-slate-400" />
              </div>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Session Profile</span>
                    <span className="text-xs font-bold text-slate-700 block mt-0.5 font-mono">{user.phone}</span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-4 py-3 text-xs font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors text-left"
                  >
                    <LogOut size={14} />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            // Guest View: displays "Public view" and "Sign In"
            <>
              <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
                <span className="w-1.5 h-1.5 bg-slate-500 rounded-full"></span>
                Public View - Read Only
              </span>
              <button 
                onClick={() => { setIsModalOpen(true); setLoginError(''); setSelectedSlot(null); }}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs h-10 px-4 rounded-lg shadow-md shadow-indigo-600/10 hover:-translate-y-0.5 transition-all duration-200"
              >
                Sign In
              </button>
            </>
          )}

        </div>
      </header>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-[1600px] w-full mx-auto p-4 lg:p-6 gap-6 overflow-hidden">
        
        {/* 2. SIDEBAR COMPONENT (Left - 30% width) */}
        <aside className="w-full lg:w-[30%] flex flex-col gap-6 shrink-0">
          
          {/* Floor Selector Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Select Parking Floor</h2>
            <div className="flex flex-col gap-3">
              
              {/* Floor 1 Option */}
              <button
                onClick={() => handleFloorChange('Floor 1')}
                className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all duration-200 ${
                  activeFloor === 'Floor 1'
                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/10 font-bold scale-[1.01]'
                    : 'bg-white border-slate-200 hover:border-blue-400 hover:bg-slate-50/50 font-medium'
                }`}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm">Floor 1 (Ground)</span>
                  <span className={`text-[11px] ${activeFloor === 'Floor 1' ? 'text-blue-100' : 'text-slate-500'}`}>VIP & EV Hub</span>
                </div>
                <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${
                  activeFloor === 'Floor 1'
                    ? 'bg-white/20 text-white'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                }`}>
                  {mapSlots.filter(s => s.floor === 'Floor 1' && s.status === 'Available').length} free
                </span>
              </button>

              {/* Floor 2 Option */}
              <button
                onClick={() => handleFloorChange('Floor 2')}
                className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all duration-200 ${
                  activeFloor === 'Floor 2'
                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/10 font-bold scale-[1.01]'
                    : 'bg-white border-slate-200 hover:border-blue-400 hover:bg-slate-50/50 font-medium'
                }`}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm">Floor 2</span>
                  <span className={`text-[11px] ${activeFloor === 'Floor 2' ? 'text-blue-100' : 'text-slate-500'}`}>Standard Spaces</span>
                </div>
                <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${
                  activeFloor === 'Floor 2'
                    ? 'bg-white/20 text-white'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                }`}>
                  {mapSlots.filter(s => s.floor === 'Floor 2' && s.status === 'Available').length} free
                </span>
              </button>

              {/* Basement Option */}
              <button
                onClick={() => handleFloorChange('Basement')}
                className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all duration-200 ${
                  activeFloor === 'Basement'
                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/10 font-bold scale-[1.01]'
                    : 'bg-white border-slate-200 hover:border-blue-400 hover:bg-slate-50/50 font-medium'
                }`}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm">Basement</span>
                  <span className={`text-[11px] ${activeFloor === 'Basement' ? 'text-blue-100' : 'text-slate-500'}`}>Compact & Motorbike</span>
                </div>
                <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${
                  activeFloor === 'Basement'
                    ? 'bg-white/20 text-white'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                }`}>
                  {mapSlots.filter(s => s.floor === 'Basement' && s.status === 'Available').length} free
                </span>
              </button>

            </div>
          </div>

          {/* Floor Stats Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-1">
              <h2 className="text-xs font-extrabold text-slate-400 tracking-widest uppercase">FLOOR STATS</h2>
              <Info size={14} className="text-slate-400" />
            </div>

            <div className="space-y-3.5">
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">Total Slots</span>
                <span className="font-bold text-slate-800">{stats.total}</span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00C853] inline-block"></span>
                  Available
                </span>
                <span className="font-bold text-emerald-600">{stats.available}</span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF1744] inline-block"></span>
                  Occupied
                </span>
                <span className="font-bold text-rose-600">{stats.occupied}</span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FFC107] inline-block"></span>
                  Reserved
                </span>
                <span className="font-bold text-amber-500">{stats.reserved}</span>
              </div>

            </div>

            {/* Linear Progress Bar */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-500">Occupancy Rate</span>
                <span className="text-blue-600">{stats.rate}%</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 rounded-full transition-all duration-500" 
                  style={{ width: `${stats.rate}%` }}
                ></div>
              </div>
            </div>

          </div>

          {/* Quick Info Box */}
          <div className="bg-slate-100 border border-slate-200 rounded-2xl p-5 space-y-2.5 text-xs text-slate-500 leading-normal">
            <span className="font-bold text-slate-700 block uppercase tracking-wider text-[10px]">Reservation Info</span>
            <p>Select any available green spot on the map to proceed. Bookings immediately lock slots in active state session.</p>
          </div>

        </aside>

        {/* 3. MAIN MAP AREA (Right - 70% width) */}
        <main className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[600px] w-full">
          
          {/* Map Top Bar */}
          <div className="p-4 border-b border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            
            {/* Search Input Bar */}
            <div className="relative w-full sm:max-w-xs">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-405 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search slot ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 bg-white border border-slate-200 text-sm rounded-lg placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Map Controls */}
            <div className="flex items-center gap-3">
              <button 
                onClick={handleZoomOut} 
                className="h-10 w-10 border border-slate-200 hover:bg-slate-50 flex items-center justify-center rounded-lg text-slate-500 transition-all active:scale-95"
              >
                <Minus size={16} />
              </button>
              <span className="text-xs font-mono font-bold text-slate-600 min-w-[48px] text-center bg-white border border-slate-200 py-2.5 px-3 rounded-lg">
                {zoomLevel}%
              </span>
              <button 
                onClick={handleZoomIn} 
                className="h-10 w-10 border border-slate-200 hover:bg-slate-50 flex items-center justify-center rounded-lg text-slate-500 transition-all active:scale-95"
              >
                <Plus size={16} />
              </button>
            </div>

          </div>

          {/* Zones Scrollable Grid */}
          <div className="flex-1 overflow-auto p-6 bg-slate-50/20">
            <div 
              className="space-y-8 transition-transform duration-200 origin-top-left"
              style={{ transform: `scale(${zoomLevel / 100})` }}
            >
              
              <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
                
                {/* A. BICYCLE ZONE (30% equivalent cols) */}
                <div className="lg:col-span-3 space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                    <Bike size={18} className="text-blue-600" />
                    <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Bicycle Area (30%)</h3>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    {bicycleSlots.filter(filterSlot).map((slot) => (
                      <div key={slot.id} className="relative group">
                        <div
                          onClick={() => handleSlotClick(slot, 'Bicycle')}
                          className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all border ${
                            slot.status === 'Available'
                              ? 'bg-[#00C853] text-white border-[#00B24A] hover:-translate-y-1 hover:shadow-md cursor-pointer hover:scale-105'
                              : slot.status === 'Occupied'
                              ? 'bg-[#FF1744] text-white border-[#E0143C] cursor-not-allowed opacity-90'
                              : 'bg-[#FFC107] text-white border-[#E0A800] cursor-not-allowed opacity-90'
                          }`}
                        >
                          <Bike size={20} />
                          <span className="text-[11px] font-mono font-bold">{slot.id.split('-')[1]}</span>
                        </div>
                        
                        {/* Subtle Not Available tooltip */}
                        {slot.status !== 'Available' && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block bg-slate-900 text-white text-[9px] font-bold py-1 px-2.5 rounded shadow-lg whitespace-nowrap z-30 pointer-events-none transition-all duration-200">
                            Not Available
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* B. MOTORCYCLE ZONE (70% equivalent cols) */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                    <Bike size={18} className="text-indigo-600" />
                    <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Motorcycle Area (70%)</h3>
                  </div>

                  <div className="grid grid-cols-5 sm:grid-cols-7 gap-2.5">
                    {motorcycleSlots.filter(filterSlot).map((slot) => (
                      <div key={slot.id} className="relative group">
                        <div
                          onClick={() => handleSlotClick(slot, 'Motorcycle')}
                          className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all border ${
                            slot.status === 'Available'
                              ? 'bg-[#00C853] text-white border-[#00B24A] hover:-translate-y-1 hover:shadow-md cursor-pointer hover:scale-105'
                              : slot.status === 'Occupied'
                              ? 'bg-[#FF1744] text-white border-[#E0143C] cursor-not-allowed opacity-90'
                              : 'bg-[#FFC107] text-white border-[#E0A800] cursor-not-allowed opacity-90'
                          }`}
                        >
                          <Bike size={20} />
                          <span className="text-[11px] font-mono font-bold">{slot.id.split('-')[1]}</span>
                        </div>
                        
                        {/* Subtle Not Available tooltip */}
                        {slot.status !== 'Available' && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block bg-slate-900 text-white text-[9px] font-bold py-1 px-2.5 rounded shadow-lg whitespace-nowrap z-30 pointer-events-none transition-all duration-200">
                            Not Available
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          </div>

          {/* Sticky Bottom Call-To-Action Banner */}
          <div className="p-4 bg-white border-t border-slate-200">
            <div className="w-full bg-blue-600 text-white font-bold text-xs sm:text-sm py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg tracking-wide shadow-blue-500/10 transition-colors">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
              {stats.available} slots available right now — click any green slot to book your space
            </div>
          </div>

        </main>

      </div>

      {/* 4. AUTH MODAL COMPONENT (Login Prompt Overlay matching Figma specifications) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border border-slate-100 animate-scale-in relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Exit Button */}
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 h-8 w-8 text-slate-400 hover:text-slate-600 flex items-center justify-center rounded-lg transition-all"
            >
              <X size={18} />
            </button>

            <div className="space-y-6">
              
              {/* Header block with stylized "P" logo */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#1A62FF] flex items-center justify-center text-white font-extrabold text-2xl shadow-md shadow-blue-500/20 shrink-0">
                  P
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-xl font-bold text-slate-800 leading-snug">Login to your account</h3>
                  <p className="text-xs text-slate-500 font-medium">Access your parking bookings</p>
                </div>
              </div>

              {/* Selected Slot Context Badge (only shows if selecting a slot triggered it) */}
              {selectedSlot && (
                <div className="bg-sky-50 border border-sky-100 rounded-xl p-3.5 text-sky-800 text-xs font-semibold flex items-start gap-2.5">
                  <Info size={16} className="text-sky-600 shrink-0 mt-0.5" />
                  <div>
                    Booking slot <span className="font-mono font-bold">{selectedSlot.slotId}</span>
                    <span className="text-sky-600 font-medium block mt-0.5">
                      {activeFloor} - {selectedSlot.zoneName} zone — login to continue
                    </span>
                  </div>
                </div>
              )}

              {/* Login Form Inputs */}
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                
                {loginError && (
                  <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold px-3.5 py-2.5 rounded-lg flex items-center gap-2">
                    <ShieldAlert size={15} />
                    <span>{loginError}</span>
                  </div>
                )}

                {/* Phone Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 block">Phone Number</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Enter your phone number"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 text-sm rounded-xl focus:outline-none focus:border-[#1A62FF] focus:ring-1 focus:ring-[#1A62FF] transition-all"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 block">Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-11 pl-10 pr-10 bg-slate-50 border border-slate-200 text-sm rounded-xl focus:outline-none focus:border-[#1A62FF] focus:ring-1 focus:ring-[#1A62FF] transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* CTA Button */}
                <button 
                  type="submit"
                  className="w-full h-11 bg-[#1A62FF] hover:bg-blue-600 text-white font-medium py-3.5 rounded-xl transition-colors font-bold shadow-md shadow-blue-500/10 active:scale-98 flex items-center justify-center gap-1.5 text-sm mt-5"
                >
                  Login & Continue
                </button>

              </form>

              {/* Sign up footer link */}
              <div className="text-center pt-2">
                <span className="text-xs text-slate-500">
                  Don't have an account?{' '}
                  <button 
                    type="button" 
                    onClick={() => { setIsModalOpen(false); navigate('/login'); }}
                    className="text-[#1A62FF] font-bold hover:underline"
                  >
                    Sign Up
                  </button>
                </span>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default GuestParkingMap;
