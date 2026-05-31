import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Bike, 
  Car, 
  Info, 
  X, 
  Search, 
  Plus, 
  Minus, 
  CheckCircle, 
  Coins, 
  ShieldCheck, 
  UserCheck, 
  AlertTriangle 
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

const initAuthParkingMap = () => {
  const slots = [];
  
  // Floor 1 (Bicycle - 45 spots, Motorcycle - 105 spots) -> Total 150 spots
  // Stats Floor 1: Total 150. Available: 24. Occupied: 83. Reserved: 43.
  let f1BikeAvail = 7, f1BikeOcc = 25, f1BikeRes = 13;
  for (let i = 1; i <= 45; i++) {
    let status = 'Occupied';
    if (i <= f1BikeAvail) status = 'Available';
    else if (i > f1BikeAvail + f1BikeOcc) status = 'Reserved';
    slots.push({
      id: `F1-B-${String(i).padStart(3, '0')}`,
      floor: 'Floor 1',
      zone: 'Bicycle',
      type: 'Bicycle',
      status: status
    });
  }
  
  let f1MotorAvail = 17, f1MotorOcc = 58, f1MotorRes = 30;
  for (let i = 1; i <= 105; i++) {
    let status = 'Occupied';
    if (i <= f1MotorAvail) status = 'Available';
    else if (i > f1MotorAvail + f1MotorOcc) status = 'Reserved';
    slots.push({
      id: `F1-M-${String(i).padStart(3, '0')}`,
      floor: 'Floor 1',
      zone: 'Motorcycle',
      type: 'Motorcycle',
      status: status
    });
  }

  // Floor 2 (Car zone ONLY -> Total 150 spots, 20 free)
  let f2Avail = 20, f2Occ = 88, f2Res = 42;
  for (let i = 1; i <= 150; i++) {
    let status = 'Occupied';
    if (i <= f2Avail) status = 'Available';
    else if (i > f2Avail + f2Occ) status = 'Reserved';
    slots.push({
      id: `F2-C-${String(i).padStart(3, '0')}`,
      floor: 'Floor 2',
      zone: 'Car',
      type: 'Car',
      status: status
    });
  }

  // Basement (Car zone ONLY -> Total 150 spots, 5 free)
  let bsAvail = 5, bsOcc = 103, bsRes = 42;
  for (let i = 1; i <= 150; i++) {
    let status = 'Occupied';
    if (i <= bsAvail) status = 'Available';
    else if (i > bsAvail + bsOcc) status = 'Reserved';
    slots.push({
      id: `B-C-${String(i).padStart(3, '0')}`,
      floor: 'Basement',
      zone: 'Car',
      type: 'Car',
      status: status
    });
  }

  return slots;
};

const ParkingLotMap = () => {
  const { role, user, login } = useAuth();

  const [activeFloor, setActiveFloor] = useState('Floor 1');
  const [searchQuery, setSearchQuery] = useState('');
  const [zoomLevel, setZoomLevel] = useState(100);
  
  // Guest view states
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingBookingSlot, setPendingBookingSlot] = useState(null);
  const [authPhone, setAuthPhone] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  
  // Stateful slots
  const [authSlots, setAuthSlots] = useState(() => {
    const saved = localStorage.getItem('spotflow_auth_map_slots');
    return saved ? JSON.parse(saved) : initAuthParkingMap();
  });

  useEffect(() => {
    localStorage.setItem('spotflow_auth_map_slots', JSON.stringify(authSlots));
  }, [authSlots]);

  // Modal triggers
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Form states for booking
  const [bookingVehicleType, setBookingVehicleType] = useState('Bicycle');
  const [bookingPlate, setBookingPlate] = useState('');
  const [bookingDuration, setBookingDuration] = useState('1 Hour');

  // Form states for Manager/Admin reservation
  const [adminPlate, setAdminPlate] = useState('');

  const [alertBanner, setAlertBanner] = useState(null);

  // Synchronize dynamic booking form selection on floor/slot updates
  useEffect(() => {
    if (activeFloor === 'Floor 1') {
      setBookingVehicleType('Bicycle');
    } else {
      setBookingVehicleType('Car');
    }
    setBookingPlate('');
    setBookingDuration('1 Hour');
    setAdminPlate('');
  }, [activeFloor, selectedSlot]);

  // Automatically open booking modal if user gets authenticated and has a pending slot
  useEffect(() => {
    if (user && role === 'driver') {
      const pendingSlotId = pendingBookingSlot || sessionStorage.getItem('spotflow_pending_booking_slot');
      if (pendingSlotId) {
        const slot = authSlots.find(s => s.id === pendingSlotId);
        if (slot && slot.status === 'Available') {
          setSelectedSlot(slot);
          setIsBookingModalOpen(true);
        }
        setPendingBookingSlot(null);
        sessionStorage.removeItem('spotflow_pending_booking_slot');
        setIsAuthModalOpen(false);
      }
    }
  }, [user, role, authSlots, pendingBookingSlot]);
  
  // Counts & Progress
  const currentFloorSlots = useMemo(() => {
    return authSlots.filter(s => s.floor === activeFloor);
  }, [authSlots, activeFloor]);

  const availableCount = useMemo(() => {
    return currentFloorSlots.filter(s => s.status === 'Available').length;
  }, [currentFloorSlots]);

  const occupiedCount = useMemo(() => {
    return currentFloorSlots.filter(s => s.status === 'Occupied').length;
  }, [currentFloorSlots]);

  const reservedCount = useMemo(() => {
    return currentFloorSlots.filter(s => s.status === 'Reserved').length;
  }, [currentFloorSlots]);

  const totalCount = 150;
  const occupancyRate = useMemo(() => {
    return Math.round(((occupiedCount + reservedCount) / totalCount) * 100);
  }, [occupiedCount, reservedCount]);

  // Available free slots for floor indicators
  const floor1Available = useMemo(() => {
    return authSlots.filter(s => s.floor === 'Floor 1' && s.status === 'Available').length;
  }, [authSlots]);

  const floor2Available = useMemo(() => {
    return authSlots.filter(s => s.floor === 'Floor 2' && s.status === 'Available').length;
  }, [authSlots]);

  const basementAvailable = useMemo(() => {
    return authSlots.filter(s => s.floor === 'Basement' && s.status === 'Available').length;
  }, [authSlots]);

  // Query filter
  const filterQuery = (s) => {
    if (!searchQuery) return true;
    return s.id.toLowerCase().includes(searchQuery.toLowerCase());
  };

  const bicycleSlots = useMemo(() => currentFloorSlots.filter(s => s.type === 'Bicycle'), [currentFloorSlots]);
  const motorcycleSlots = useMemo(() => currentFloorSlots.filter(s => s.type === 'Motorcycle'), [currentFloorSlots]);
  const carSlots = useMemo(() => currentFloorSlots.filter(s => s.type === 'Car'), [currentFloorSlots]);

  // Zoom handlers
  const handleZoomIn = () => {
    if (zoomLevel < 150) setZoomLevel(prev => prev + 10);
  };
  const handleZoomOut = () => {
    if (zoomLevel > 70) setZoomLevel(prev => prev - 10);
  };

  // Slot click handler
  const handleSlotClick = (slot) => {
    // If not logged in, intercept Available (green) clicks
    if (!user) {
      if (slot.status === 'Available') {
        sessionStorage.setItem('spotflow_pending_booking_slot', slot.id);
        setPendingBookingSlot(slot.id);
        setIsAuthModalOpen(true);
      }
      return; // Do nothing for occupied/reserved slots in guest public view
    }

    setSelectedSlot(slot);
    if (slot.status === 'Available') {
      if (role === 'driver') {
        setIsBookingModalOpen(true);
      } else {
        setIsDetailsModalOpen(true);
      }
    } else {
      if (role !== 'driver') {
        setIsDetailsModalOpen(true);
      }
    }
  };

  // Booking confirm submission
  const handleConfirmBookingSubmit = (e) => {
    e.preventDefault();
    if (!selectedSlot) return;

    const slotId = selectedSlot.id;

    // Mutate slot state
    setAuthSlots(prevSlots => 
      prevSlots.map(s => 
        s.id === slotId 
          ? { 
              ...s, 
              status: 'Reserved', 
              occupiedBy: { 
                plate: bookingPlate || 'Bicycle Entry', 
                checkInTime: new Date().toISOString(), 
                type: bookingVehicleType 
              } 
            } 
          : s
      )
    );

    // Save ticket into bookings list
    const newBooking = {
      id: Date.now(),
      ticketId: 'TKT-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
      vehicleType: bookingVehicleType,
      status: 'Active',
      location: `${activeFloor} - ${slotId.split('-')[2] || slotId}`,
      bookedDate: '29/05/2026',
      bookedTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      deadlineTime: new Date(Date.now() + 30 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      contact: '1 - 1'
    };

    const currentBookings = JSON.parse(localStorage.getItem('spotflow_driver_bookings') || '[]');
    currentBookings.push(newBooking);
    localStorage.setItem('spotflow_driver_bookings', JSON.stringify(currentBookings));

    setIsBookingModalOpen(false);

    setAlertBanner(`Booking confirmed successfully for Slot ${slotId}!`);
    setTimeout(() => {
      setAlertBanner(null);
    }, 3500);
  };

  // Admin/Staff/Manager reservation handler
  const handleAdminReserveSubmit = (e) => {
    e.preventDefault();
    if (!selectedSlot) return;

    const slotId = selectedSlot.id;

    setAuthSlots(prevSlots => 
      prevSlots.map(s => 
        s.id === slotId 
          ? { 
              ...s, 
              status: 'Occupied', 
              occupiedBy: { 
                plate: adminPlate || '29A-888.88', 
                checkInTime: new Date().toISOString(), 
                type: s.type 
              } 
            } 
          : s
      )
    );

    setIsDetailsModalOpen(false);

    setAlertBanner(`Slot ${slotId} is now marked as Occupied by ${adminPlate || 'assigned vehicle'}.`);
    setTimeout(() => {
      setAlertBanner(null);
    }, 3500);
  };

  // Force checkout/release handler
  const handleForceCheckout = () => {
    if (!selectedSlot) return;

    const slotId = selectedSlot.id;
    const occupant = selectedSlot.occupiedBy;
    let chargeText = '';

    if (occupant) {
      const checkInTime = new Date(occupant.checkInTime);
      const now = new Date();
      const diffMs = now - checkInTime;
      const diffHours = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60)));
      
      let rate = 15000;
      if (selectedSlot.type === 'Bicycle') rate = 2000;
      else if (selectedSlot.type === 'Motorcycle') rate = 5000;
      
      const totalFee = diffHours * rate;
      chargeText = ` Fee processed: ${totalFee.toLocaleString('vi-VN')} đ.`;
    }

    setAuthSlots(prevSlots => 
      prevSlots.map(s => 
        s.id === slotId 
          ? { ...s, status: 'Available', occupiedBy: null } 
          : s
      )
    );

    setIsDetailsModalOpen(false);

    setAlertBanner(`Slot ${slotId} released successfully.${chargeText}`);
    setTimeout(() => {
      setAlertBanner(null);
    }, 4000);
  };

  // Suspend slot (Maintenance)
  const handleSuspendSlot = () => {
    if (!selectedSlot) return;

    setAuthSlots(prevSlots => 
      prevSlots.map(s => 
        s.id === selectedSlot.id 
          ? { ...s, status: 'Maintenance', occupiedBy: null } 
          : s
      )
    );

    setIsDetailsModalOpen(false);

    setAlertBanner(`Slot ${selectedSlot.id} is now suspended (Maintenance).`);
    setTimeout(() => {
      setAlertBanner(null);
    }, 3500);
  };

  // Restore slot from maintenance
  const handleRestoreSlot = () => {
    if (!selectedSlot) return;

    setAuthSlots(prevSlots => 
      prevSlots.map(s => 
        s.id === selectedSlot.id 
          ? { ...s, status: 'Available', occupiedBy: null } 
          : s
      )
    );

    setIsDetailsModalOpen(false);

    setAlertBanner(`Slot ${selectedSlot.id} restored back to service.`);
    setTimeout(() => {
      setAlertBanner(null);
    }, 3500);
  };

  // Submit handler for inline Guest Auth Modal
  const handleAuthModalSubmit = (e) => {
    e.preventDefault();
    if (!authPhone || !authPassword) {
      setAuthError('Please enter phone number and password.');
      return;
    }
    setAuthLoading(true);
    setAuthError('');

    setTimeout(() => {
      const res = login('driver');
      setAuthLoading(false);
      if (res.success) {
        localStorage.setItem('spotflow_guest_isAuthenticated', 'true');
        localStorage.setItem('spotflow_guest_user', JSON.stringify({
          phone: authPhone,
          role: 'Driver',
          avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=DriverFlow'
        }));
      } else {
        setAuthError('Authentication failed. Use the quick demo registration.');
      }
    }, 500);
  };

  // Quick Demo Bypass Sign Up for Guest Auth Modal
  const handleQuickGuestSignUp = () => {
    setAuthLoading(true);
    setTimeout(() => {
      const res = login('driver');
      setAuthLoading(false);
      if (res.success) {
        localStorage.setItem('spotflow_guest_isAuthenticated', 'true');
        localStorage.setItem('spotflow_guest_user', JSON.stringify({
          phone: '0915277878',
          role: 'Driver',
          avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=DriverFlow'
        }));
      }
    }, 300);
  };

  // Format dynamic details for modal occupancy view
  const occupantInfo = useMemo(() => {
    if (!selectedSlot || !selectedSlot.occupiedBy) return null;
    const occupant = selectedSlot.occupiedBy;
    const checkInTime = new Date(occupant.checkInTime);
    const now = new Date();
    const diffMs = now - checkInTime;
    const diffHours = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60)));
    
    let rate = 15000;
    if (selectedSlot.type === 'Bicycle') rate = 2000;
    else if (selectedSlot.type === 'Motorcycle') rate = 5000;

    return {
      plate: occupant.plate,
      type: occupant.type,
      time: checkInTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' (' + checkInTime.toLocaleDateString() + ')',
      duration: `${diffHours} Hour${diffHours > 1 ? 's' : ''}`,
      fee: `${(diffHours * rate).toLocaleString('vi-VN')} đ`
    };
  }, [selectedSlot]);

  // Hourly Rate display helper
  const hourlyRateLabel = (type) => {
    if (type === 'Bicycle') return '2.000 đ';
    if (type === 'Motorcycle') return '5.000 đ';
    return '15.000 đ';
  };

  return (
    <div className="space-y-6 relative select-none">
      {/* Floating Success Alert Toast */}
      {alertBanner && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-emerald-600 text-white font-extrabold text-xs sm:text-sm px-6 py-3.5 rounded-xl shadow-xl shadow-emerald-500/10 z-50 flex items-center gap-2 border border-emerald-500 animate-bounce">
          <CheckCircle size={18} className="text-white" />
          <span>{alertBanner}</span>
        </div>
      )}

      {/* 1. Sub-Header Section */}
      <div className="space-y-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">Interactive Parking Map</h1>
          <p className="text-sm text-slate-500">Real-time slot availability — click any slot for details</p>
        </div>
        
        {/* Status Legends Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-5">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <span className="w-3 h-3 rounded-full bg-[#00C853] inline-block shadow-sm"></span>
              <span>Available ({availableCount})</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <span className="w-3 h-3 rounded-full bg-[#FF1744] inline-block shadow-sm"></span>
              <span>Occupied ({occupiedCount})</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <span className="w-3 h-3 rounded-full bg-[#FFC107] inline-block shadow-sm"></span>
              <span>Reserved ({reservedCount})</span>
            </div>
          </div>
          
          {/* Status filters on right */}
          <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
            <span className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200">Car</span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200">Motorbike</span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200">Bicycle</span>
          </div>
        </div>
      </div>

      {/* 2. Main Two-Column Layout Panel */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* Left Side Block (Floor Manager - 30% width) */}
        <div className="w-full lg:w-[30%] flex flex-col gap-6 shrink-0 font-sans">
          
          {/* Select Floor Stack */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
            <h2 className="text-xs font-extrabold text-slate-400 tracking-widest uppercase">Select Parking Level</h2>
            <div className="flex flex-col gap-3">
              
              {/* Floor 1 Selector Button */}
              <button
                onClick={() => { setActiveFloor('Floor 1'); setSearchQuery(''); }}
                className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all duration-200 ${
                  activeFloor === 'Floor 1'
                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/10 font-bold scale-[1.01]'
                    : 'bg-white border-slate-100 hover:border-blue-400 hover:bg-slate-50/55 font-medium'
                }`}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold">Floor 1</span>
                  <span className={`text-[11px] ${activeFloor === 'Floor 1' ? 'text-blue-100' : 'text-slate-500'}`}>Bicycle & Motorcycle</span>
                </div>
                <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${
                  activeFloor === 'Floor 1'
                    ? 'bg-white/20 text-white'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                }`}>
                  {floor1Available} free
                </span>
              </button>

              {/* Floor 2 Selector Button */}
              <button
                onClick={() => { setActiveFloor('Floor 2'); setSearchQuery(''); }}
                className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all duration-200 ${
                  activeFloor === 'Floor 2'
                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/10 font-bold scale-[1.01]'
                    : 'bg-white border-slate-100 hover:border-blue-400 hover:bg-slate-50/55 font-medium'
                }`}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold">Floor 2</span>
                  <span className={`text-[11px] ${activeFloor === 'Floor 2' ? 'text-blue-100' : 'text-slate-500'}`}>Car Parking Only</span>
                </div>
                <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${
                  activeFloor === 'Floor 2'
                    ? 'bg-white/20 text-white'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                }`}>
                  {floor2Available} free
                </span>
              </button>

              {/* Basement Selector Button */}
              <button
                onClick={() => { setActiveFloor('Basement'); setSearchQuery(''); }}
                className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all duration-200 ${
                  activeFloor === 'Basement'
                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/10 font-bold scale-[1.01]'
                    : 'bg-white border-slate-100 hover:border-blue-400 hover:bg-slate-50/55 font-medium'
                }`}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold">Basement</span>
                  <span className={`text-[11px] ${activeFloor === 'Basement' ? 'text-blue-100' : 'text-slate-500'}`}>Car Parking Only</span>
                </div>
                <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${
                  activeFloor === 'Basement'
                    ? 'bg-white/20 text-white'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                }`}>
                  {basementAvailable} free
                </span>
              </button>

            </div>
          </div>

          {/* Floor Stats Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-5 w-full">
            <div className="flex items-center justify-between pb-1">
              <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">FLOOR STATS</h2>
              <Info size={14} className="text-slate-400" />
            </div>

            <div className="space-y-3.5">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-555 text-slate-500 font-medium">Total Slots</span>
                <span className="font-bold text-slate-800">{totalCount}</span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-555 text-slate-500 font-medium flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00C853] inline-block"></span>
                  Available
                </span>
                <span className="font-bold text-emerald-650">{availableCount}</span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-555 text-slate-500 font-medium flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF1744] inline-block"></span>
                  Occupied
                </span>
                <span className="font-bold text-rose-600">{occupiedCount}</span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-555 text-slate-500 font-medium flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FFC107] inline-block"></span>
                  Reserved
                </span>
                <span className="font-bold text-amber-500">{reservedCount}</span>
              </div>
            </div>

            {/* Progress Bar occupancy */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-500">Occupancy Rate</span>
                <span className="text-blue-600">{occupancyRate}%</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 rounded-full transition-all duration-500" 
                  style={{ width: `${occupancyRate}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Quick Demo Info Box */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-2.5 text-xs text-slate-500 leading-normal">
            <span className="font-bold text-slate-700 block uppercase tracking-wider text-[10px]">Portal Info</span>
            <p>Click any green (Available) space on the map grid to lock your reservation. Your pass billing updates instantly.</p>
          </div>

        </div>

        {/* Right Side Block (Map Interactive Grid - 70% width) */}
        <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden min-h-[600px] w-full font-sans">
          
          {/* Top Search Bar & Controls */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            
            {/* Search bar */}
            <div className="relative w-full sm:max-w-xs">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search by slot ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 bg-white border border-slate-200 text-sm rounded-lg placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-3">
              <button 
                onClick={handleZoomOut} 
                className="h-10 w-10 border border-slate-200 hover:bg-slate-55 flex items-center justify-center rounded-lg text-slate-500 transition-all active:scale-95 bg-white"
              >
                <Minus size={16} />
              </button>
              <span className="text-xs font-mono font-bold text-slate-600 min-w-[48px] text-center bg-white border border-slate-200 py-2.5 px-3 rounded-lg">
                {zoomLevel}%
              </span>
              <button 
                onClick={handleZoomIn} 
                className="h-10 w-10 border border-slate-200 hover:bg-slate-55 flex items-center justify-center rounded-lg text-slate-500 transition-all active:scale-95 bg-white"
              >
                <Plus size={16} />
              </button>
            </div>

          </div>

          {/* Scrollable Maps Zone */}
          <div className="flex-1 overflow-auto p-6 bg-slate-50/20">
            <div 
              className="space-y-8 transition-transform duration-200 origin-top-left"
              style={{ transform: `scale(${zoomLevel / 100})` }}
            >
              
              {activeFloor === 'Floor 1' ? (
                <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
                  
                  {/* Bicycle Area */}
                  <div className="lg:col-span-3 space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                      <Bike size={18} className="text-blue-600" />
                      <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Bicycle Zone (30%)</h3>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5">
                      {bicycleSlots.filter(filterQuery).map((slot) => (
                        <div key={slot.id} className="relative group">
                          <div
                            onClick={() => handleSlotClick(slot)}
                            className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-1 border transition-all duration-200 ${
                              slot.status === 'Available'
                                ? 'bg-[#00C853] text-white border-[#00B24A] hover:-translate-y-1 hover:shadow-md cursor-pointer hover:scale-105'
                                : slot.status === 'Occupied'
                                ? 'bg-[#FF1744] text-white border-[#E0143C] opacity-90 cursor-not-allowed'
                                : 'bg-[#FFC107] text-white border-[#E0A800] opacity-90 cursor-not-allowed'
                            }`}
                          >
                            <Bike size={18} />
                            <span className="text-[10px] font-mono font-bold">{slot.id.split('-')[2]}</span>
                          </div>
                          
                          {/* Tooltip on hover for Occupied slots */}
                          {slot.status === 'Occupied' && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block bg-slate-900 text-white text-[9px] font-bold py-1 px-2 rounded shadow-lg whitespace-nowrap z-30 pointer-events-none transition-all">
                              Not Available
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Motorcycle Area */}
                  <div className="lg:col-span-7 space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                      <Motorcycle size={18} className="text-indigo-600" />
                      <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Motorcycle Zone (70%)</h3>
                    </div>

                    <div className="grid grid-cols-5 sm:grid-cols-7 gap-2.5">
                      {motorcycleSlots.filter(filterQuery).map((slot) => (
                        <div key={slot.id} className="relative group">
                          <div
                            onClick={() => handleSlotClick(slot)}
                            className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-1 border transition-all duration-200 ${
                              slot.status === 'Available'
                                ? 'bg-[#00C853] text-white border-[#00B24A] hover:-translate-y-1 hover:shadow-md cursor-pointer hover:scale-105'
                                : slot.status === 'Occupied'
                                ? 'bg-[#FF1744] text-white border-[#E0143C] opacity-90 cursor-not-allowed'
                                : 'bg-[#FFC107] text-white border-[#E0A800] opacity-90 cursor-not-allowed'
                            }`}
                          >
                            <Motorcycle size={18} />
                            <span className="text-[10px] font-mono font-bold">{slot.id.split('-')[2]}</span>
                          </div>

                          {/* Tooltip on hover for Occupied slots */}
                          {slot.status === 'Occupied' && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block bg-slate-900 text-white text-[9px] font-bold py-1 px-2 rounded shadow-lg whitespace-nowrap z-30 pointer-events-none transition-all">
                              Not Available
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              ) : (
                // FLOOR 2 & BASEMENT: Larger slots for Cars
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                    <Car size={18} className="text-blue-600" />
                    <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Car Parking Area (Only)</h3>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                    {carSlots.filter(filterQuery).map((slot) => (
                      <div key={slot.id} className="relative group">
                        <div
                          onClick={() => handleSlotClick(slot)}
                          className={`aspect-[4/3] rounded-xl flex flex-col justify-between p-3 border transition-all duration-200 ${
                            slot.status === 'Available'
                              ? 'bg-[#00C853] text-white border-[#00B24A] hover:-translate-y-1 hover:shadow-md cursor-pointer hover:scale-102'
                              : slot.status === 'Occupied'
                              ? 'bg-[#FF1744] text-white border-[#E0143C] opacity-90 cursor-not-allowed'
                              : 'bg-[#FFC107] text-white border-[#E0A800] opacity-90 cursor-not-allowed'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <span className="text-[9px] font-extrabold opacity-75 uppercase tracking-wide">CAR</span>
                            <Car size={16} />
                          </div>
                          <span className="text-xs font-mono font-extrabold tracking-wide mt-2">{slot.id.split('-')[2]}</span>
                        </div>

                        {/* Tooltip on hover for Occupied slots */}
                        {slot.status === 'Occupied' && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block bg-slate-900 text-white text-[9px] font-bold py-1 px-2 rounded shadow-lg whitespace-nowrap z-30 pointer-events-none transition-all">
                            Not Available
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Sticky Bottom Ribbon */}
          <div className="p-4 bg-white border-t border-slate-100">
            <div className="w-full bg-[#1A62FF] text-white font-medium text-center text-sm py-3 rounded-xl shadow-md mt-4 flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
              <span>{availableCount} slots available right now — click any green slot to book your space</span>
            </div>
          </div>

        </div>

      </div>

      {/* 3. CREATE BOOKING MODAL (Drivers Only) */}
      {isBookingModalOpen && selectedSlot && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-205 animate-scale-in relative font-sans">
            
            <button 
              onClick={() => setIsBookingModalOpen(false)}
              className="absolute top-4 right-4 h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-50 flex items-center justify-center rounded-lg transition-all"
            >
              <X size={18} />
            </button>

            <div className="p-6 sm:p-8 space-y-6">
              
              <div className="space-y-1">
                <h3 className="text-xl font-extrabold text-slate-800">Book Parking Slot</h3>
                <p className="text-xs text-slate-500">Configure your reservation session</p>
              </div>

              <div className="bg-sky-50 border border-sky-100 rounded-xl p-3.5 text-sky-800 text-xs font-semibold flex items-start gap-2.5">
                <Info size={16} className="text-sky-600 shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <span>You are reserving Slot: </span>
                  <span className="font-mono font-extrabold text-blue-600">{selectedSlot.id}</span>
                  <span> on </span>
                  <span className="font-bold text-slate-800">{activeFloor}</span>
                  <span className="text-sky-600 font-medium block mt-0.5">
                    Selected slot classification: {selectedSlot.type}
                  </span>
                </div>
              </div>

              <form onSubmit={handleConfirmBookingSubmit} className="space-y-4">
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Vehicle Type</label>
                  <select
                    value={bookingVehicleType}
                    onChange={(e) => setBookingVehicleType(e.target.value)}
                    className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 text-sm rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
                  >
                    {activeFloor === 'Floor 1' ? (
                      <>
                        <option value="Bicycle">Bicycle</option>
                        <option value="Motorcycle">Motorcycle</option>
                      </>
                    ) : (
                      <option value="Car">Car</option>
                    )}
                  </select>
                </div>

                {bookingVehicleType !== 'Bicycle' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">License Plate Number</label>
                    <div className="relative">
                      <Car size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text"
                        required
                        placeholder="e.g., 29A-12345"
                        value={bookingPlate}
                        onChange={(e) => setBookingPlate(e.target.value)}
                        className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 text-sm rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white transition-all uppercase font-mono font-bold"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Estimated Duration</label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {['1 Hour', '2 Hours', 'Full Day'].map((duration) => (
                      <button
                        key={duration}
                        type="button"
                        onClick={() => setBookingDuration(duration)}
                        className={`py-3.5 px-3 rounded-xl border text-center transition-all text-xs font-bold leading-tight ${
                          bookingDuration === duration
                            ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm'
                            : 'bg-slate-50/50 border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-850'
                        }`}
                      >
                        {duration}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4 font-sans">
                  <button
                    type="button"
                    onClick={() => setIsBookingModalOpen(false)}
                    className="flex-1 h-11 border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-800 font-bold rounded-xl transition-all text-sm"
                  >
                    Cancel
                  </button>
                  
                  <button
                    type="submit"
                    className="flex-1 h-11 bg-blue-600 hover:bg-blue-550 text-white font-bold rounded-xl transition-all shadow-md shadow-blue-500/10 flex items-center justify-center gap-1.5 text-sm"
                  >
                    Confirm Booking
                  </button>
                </div>

              </form>

            </div>

          </div>
        </div>
      )}

      {/* 4. SPACE OPERATIONAL DETAILS MODAL (Staff, Managers, Admins) */}
      {isDetailsModalOpen && selectedSlot && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-205 animate-scale-in relative font-sans">
            
            <button 
              onClick={() => setIsDetailsModalOpen(false)}
              className="absolute top-4 right-4 h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-50 flex items-center justify-center rounded-lg transition-all"
            >
              <X size={18} />
            </button>

            <div className="p-6 sm:p-8 space-y-6">
              
              <div className="space-y-1">
                <h3 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                  {selectedSlot.type === 'Bicycle' && <Bike className="text-blue-500" size={20} />}
                  {selectedSlot.type === 'Motorcycle' && <Motorcycle className="text-indigo-500" size={20} />}
                  {selectedSlot.type === 'Car' && <Car className="text-indigo-650" size={20} />}
                  <span>Slot Control: {selectedSlot.id}</span>
                </h3>
                <p className="text-xs text-slate-500">Supervisor workspace management terminal</p>
              </div>

              {/* General Metadata Panel */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-semibold">Location Floor</span>
                  <span className="font-extrabold text-slate-700">{selectedSlot.floor}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-semibold">Classification Type</span>
                  <span className="font-extrabold text-slate-700 capitalize">{selectedSlot.type} Slot</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-semibold">Hourly Base Rate</span>
                  <span className="font-extrabold text-slate-700">{hourlyRateLabel(selectedSlot.type)}/hr</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <span className="text-slate-400 font-semibold">Current State</span>
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                    selectedSlot.status === 'Available'
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      : selectedSlot.status === 'Occupied'
                      ? 'bg-rose-50 text-rose-600 border border-rose-100'
                      : 'bg-amber-50 text-amber-600 border border-amber-100'
                  }`}>
                    {selectedSlot.status}
                  </span>
                </div>
              </div>

              {/* Conditional Actions based on current status */}
              
              {/* STATUS: OCCUPIED */}
              {selectedSlot.status === 'Occupied' && (
                <div className="space-y-4">
                  {occupantInfo && (
                    <div className="bg-slate-50 border border-slate-205 rounded-xl p-4 space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                        <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">License Plate</span>
                        <span className="font-mono text-xs text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-350 font-extrabold shadow-sm">{occupantInfo.plate}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">Category Type</span>
                        <span className="text-slate-800 font-bold capitalize">{occupantInfo.type}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">Check-in Time</span>
                        <span className="text-slate-700 font-semibold">{occupantInfo.time}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">Hours Elapsed</span>
                        <span className="text-slate-700 font-semibold">{occupantInfo.duration}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1"><Coins size={14}/> Total Surcharge</span>
                        <span className="text-base font-extrabold text-emerald-600">{occupantInfo.fee}</span>
                      </div>
                    </div>
                  )}

                  {(role === 'admin' || role === 'staff') && (
                    <button
                      onClick={handleForceCheckout}
                      className="w-full h-11 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-rose-500/10 text-sm transition-all"
                    >
                      <UserCheck size={16} />
                      Release Slot & Process Exit
                    </button>
                  )}
                </div>
              )}

              {/* STATUS: RESERVED */}
              {selectedSlot.status === 'Reserved' && (
                <div className="space-y-4">
                  {occupantInfo && (
                    <div className="bg-slate-50 border border-slate-205 rounded-xl p-4 space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                        <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">License Plate</span>
                        <span className="font-mono text-xs text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-350 font-extrabold shadow-sm">{occupantInfo.plate}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">Reserved Time</span>
                        <span className="text-slate-700 font-semibold">{occupantInfo.time}</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="bg-sky-50 border border-sky-100 rounded-xl p-3 text-sky-800 text-xs font-semibold flex items-start gap-2">
                    <Info size={16} className="text-sky-600 shrink-0 mt-0.5" />
                    <span>This spot is reserved. Pre-booked by system users or checked in by supervisors.</span>
                  </div>

                  {(role === 'admin' || role === 'staff') && (
                    <button
                      onClick={handleForceCheckout}
                      className="w-full h-11 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-rose-500/10 text-sm transition-all"
                    >
                      Cancel Booking & Release Slot
                    </button>
                  )}
                </div>
              )}

              {/* STATUS: MAINTENANCE */}
              {selectedSlot.status === 'Maintenance' && (
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-amber-800 text-xs font-semibold flex items-start gap-2.5">
                    <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Spot Suspended</span>
                      <span className="text-amber-600 font-medium">Currently out of service for cleanups, operations testing, or charging snoop.</span>
                    </div>
                  </div>

                  {role === 'admin' && (
                    <button
                      onClick={handleRestoreSlot}
                      className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/10 text-sm transition-all"
                    >
                      <ShieldCheck size={16} />
                      Restore Space to Service
                    </button>
                  )}
                </div>
              )}

              {/* STATUS: AVAILABLE */}
              {selectedSlot.status === 'Available' && (
                <div className="space-y-4">
                  <form onSubmit={handleAdminReserveSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Assign License Plate</label>
                      <input 
                        type="text"
                        required
                        placeholder="e.g. 29A-888.88"
                        value={adminPlate}
                        onChange={(e) => setAdminPlate(e.target.value)}
                        className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 text-sm rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white transition-all uppercase font-mono font-bold"
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="submit"
                        className="flex-1 h-11 bg-blue-600 hover:bg-blue-550 text-white font-bold rounded-xl transition-all shadow-md text-sm"
                      >
                        Reserve Spot
                      </button>
                      
                      <button
                        type="button"
                        onClick={handleSuspendSlot}
                        className="px-4 h-11 border border-amber-500 text-amber-600 hover:bg-amber-500 hover:text-white rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-1"
                      >
                        Suspend Slot
                      </button>
                    </div>
                  </form>
                </div>
              )}

            </div>

          </div>
        </div>
      )}

      {/* 5. GUEST LOGIN / SIGN UP MODAL (Auth Form) */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-scale-in relative font-sans p-6 sm:p-8 space-y-6">
            
            <button 
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-4 right-4 h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-50 flex items-center justify-center rounded-lg transition-all"
            >
              <X size={18} />
            </button>

            <div className="space-y-2">
              <div className="w-12 h-12 rounded-xl bg-[#2563EB] flex items-center justify-center text-white font-extrabold text-xl shadow-md shadow-blue-500/10">
                P
              </div>
              <h3 className="text-xl font-extrabold text-slate-800 mt-2">Sign in to reserve</h3>
              <p className="text-xs text-slate-500 font-medium">Authentication is required to book Slot <span className="font-mono text-[#2563EB] font-extrabold">{pendingBookingSlot || sessionStorage.getItem('spotflow_pending_booking_slot')}</span></p>
            </div>

            {authError && (
              <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold p-3.5 rounded-xl flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full shrink-0"></span>
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleAuthModalSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">Phone Number</label>
                <input 
                  type="text" 
                  required
                  placeholder="Enter your phone number"
                  value={authPhone}
                  onChange={(e) => setAuthPhone(e.target.value)}
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 text-sm rounded-xl focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] focus:bg-white transition-all font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">Password</label>
                <input 
                  type="password" 
                  required
                  placeholder="Enter your password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 text-sm rounded-xl focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] focus:bg-white transition-all font-semibold"
                />
              </div>

              <button 
                type="submit"
                disabled={authLoading}
                className="w-full h-11 bg-[#2563EB] hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold rounded-xl transition-all shadow-md shadow-blue-500/10 flex items-center justify-center gap-1.5 text-sm mt-6"
              >
                {authLoading ? 'Logging in...' : 'Login & Continue'}
              </button>
            </form>

            <div className="text-center pt-2">
              <span className="text-xs text-slate-500">
                Don't have an account?{' '}
                <button 
                  type="button"
                  onClick={handleQuickGuestSignUp}
                  className="text-[#2563EB] font-bold hover:underline"
                >
                  Quick Sign Up
                </button>
              </span>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default ParkingLotMap;
