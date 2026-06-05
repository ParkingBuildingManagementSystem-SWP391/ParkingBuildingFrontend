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
  AlertTriangle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { message } from 'antd';
import { parkingService } from '../../services/parkingService';

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
  
<<<<<<< Updated upstream
  // Floor G (Bicycle - 45 spots, Motorcycle - 105 spots) -> Total 150 spots
  // Stats Floor G: Total 150. Available: 22. Occupied: 85. Reserved: 43.
  let f1BikeAvail = 5, f1BikeOcc = 27, f1BikeRes = 13;
=======
  // Simulated Fallback Data (Floor 1)
>>>>>>> Stashed changes
  for (let i = 1; i <= 45; i++) {
    slots.push({
      id: `F1-B-${String(i).padStart(3, '0')}`,
<<<<<<< Updated upstream
      floor: 'Floor G',
=======
      dbSlotId: 1000 + i,
      floor: 'Floor 1',
>>>>>>> Stashed changes
      zone: 'Bicycle',
      type: 'Bicycle',
      status: 'Available',
      typeId: 1
    });
  }
  for (let i = 1; i <= 105; i++) {
    slots.push({
      id: `F1-M-${String(i).padStart(3, '0')}`,
<<<<<<< Updated upstream
      floor: 'Floor G',
=======
      dbSlotId: 1100 + i,
      floor: 'Floor 1',
>>>>>>> Stashed changes
      zone: 'Motorcycle',
      type: 'Motorcycle',
      status: i % 5 === 0 ? 'Occupied' : 'Available',
      typeId: 2
    });
  }

<<<<<<< Updated upstream
  // Basement 1 (Car zone ONLY -> Total 150 spots, 28 free)
  let f2Avail = 28, f2Occ = 80, f2Res = 42;
=======
  // Simulated Fallback Data (Floor 2)
>>>>>>> Stashed changes
  for (let i = 1; i <= 150; i++) {
    slots.push({
      id: `F2-C-${String(i).padStart(3, '0')}`,
<<<<<<< Updated upstream
      floor: 'Basement 1',
=======
      dbSlotId: 5 + i,
      floor: 'Floor 2',
>>>>>>> Stashed changes
      zone: 'Car',
      type: 'Car',
      status: i % 8 === 0 ? 'Reserved' : i % 5 === 0 ? 'Occupied' : 'Available',
      typeId: 3
    });
  }

<<<<<<< Updated upstream
  // Basement 2 (Car zone ONLY -> Total 150 spots, 5 free)
  let bsAvail = 5, bsOcc = 103, bsRes = 42;
=======
  // Simulated Fallback Data (Basement)
>>>>>>> Stashed changes
  for (let i = 1; i <= 150; i++) {
    slots.push({
      id: `B-C-${String(i).padStart(3, '0')}`,
<<<<<<< Updated upstream
      floor: 'Basement 2',
=======
      dbSlotId: 2000 + i,
      floor: 'Basement',
>>>>>>> Stashed changes
      zone: 'Car',
      type: 'Car',
      status: i % 10 === 0 ? 'Occupied' : 'Available',
      typeId: 3
    });
  }

  return slots;
};

const floorMapping = {
  'Floor 1': 3, // Floor G (Motorbike/Bicycle)
  'Floor 2': 1, // Floor B1 (Car)
  'Basement': 2 // Floor B2 (Empty/Car)
};

const ParkingLotMap = () => {
  const { role, user } = useAuth();

  const [activeFloor, setActiveFloor] = useState('Floor G');
  const [searchQuery, setSearchQuery] = useState('');
  const [zoomLevel, setZoomLevel] = useState(100);
  const [loadingMap, setLoadingMap] = useState(false);
  const [errorMap, setErrorMap] = useState('');
  
  // Guest view states
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingBookingSlot, setPendingBookingSlot] = useState(null);
  
<<<<<<< Updated upstream
  // Stateful slots
  const [authSlots, setAuthSlots] = useState(() => {
    const saved = localStorage.getItem('spotflow_auth_map_slots');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.some(s => s.floor === 'Floor 1' || s.floor === 'Floor 2' || s.floor === 'Basement')) {
        return initAuthParkingMap();
      }
      return parsed;
    }
    return initAuthParkingMap();
  });

  useEffect(() => {
    localStorage.setItem('spotflow_auth_map_slots', JSON.stringify(authSlots));
  }, [authSlots]);
=======
  // Stateful slots (Merged with Database loading)
  const [authSlots, setAuthSlots] = useState(() => initAuthParkingMap());
>>>>>>> Stashed changes

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
  const [submitting, setSubmitting] = useState(false);

  // Pagination for high slot density floors (e.g. Floor G has 1200 slots)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 120;

  // Helper: map database response to UI structure
  const mapBackendSlotsToUI = (backendSlots, floorName) => {
    // Sort slots by name to assign deterministic IDs matching the seed pattern
    const sortedBackendSlots = [...backendSlots].sort((a, b) => a.slotName.localeCompare(b.slotName));
    const floorId = floorMapping[floorName];
    const startSlotId = floorId === 3 ? 155 : floorId === 1 ? 5 : 2000;

    return sortedBackendSlots.map((s, index) => {
      const slotId = startSlotId + index;
      let type = 'Car';
      if (s.typeId === 1) type = 'Bicycle';
      else if (s.typeId === 2) type = 'Motorcycle';
      
      let zone = 'Car';
      if (type === 'Bicycle') zone = 'Bicycle';
      else if (type === 'Motorcycle') zone = 'Motorcycle';

      return {
        id: s.slotName,
        dbSlotId: slotId,
        floor: floorName,
        zone: zone,
        type: type,
        status: s.slotStatus ? s.slotStatus.trim() : 'Available',
        typeId: s.typeId,
        occupiedBy: s.slotStatus.trim() !== 'Available' ? {
          plate: type === 'Bicycle' ? 'Bicycle Entry' : 'Unknown',
          checkInTime: new Date().toISOString(),
          type: type
        } : null
      };
    });
  };

  // Fetch slots from backend database
  const fetchParkingSlots = async () => {
    setLoadingMap(true);
    setErrorMap('');
    try {
      const floorId = floorMapping[activeFloor];
      const data = await parkingService.getSlotsByFloor(floorId);
      
      if (data && data.length > 0) {
        const mapped = mapBackendSlotsToUI(data, activeFloor);
        setAuthSlots(prev => {
          const otherFloorSlots = prev.filter(s => s.floor !== activeFloor);
          return [...otherFloorSlots, ...mapped];
        });
      } else {
        // If the floor is empty in DB, clear its slots
        setAuthSlots(prev => prev.filter(s => s.floor !== activeFloor));
      }
    } catch (err) {
      console.error(err);
      setErrorMap('Offline Mode: Displaying simulated parking layout.');
    } finally {
      setLoadingMap(false);
    }
  };

  // Trigger fetch when floor changes
  useEffect(() => {
    fetchParkingSlots();
    setCurrentPage(1);
  }, [activeFloor]);

  // Synchronize dynamic booking form selection on floor/slot updates
  useEffect(() => {
<<<<<<< Updated upstream
    if (activeFloor === 'Floor G') {
      setBookingVehicleType('Bicycle');
=======
    if (activeFloor === 'Floor 1') {
      setBookingVehicleType('Motorcycle');
>>>>>>> Stashed changes
    } else {
      setBookingVehicleType('Car');
    }
    setBookingPlate('');
    setBookingDuration('1 Hour');
    setAdminPlate('');
  }, [activeFloor, selectedSlot]);

  // Automatically open booking modal if user gets authenticated and has a pending slot
  useEffect(() => {
    if (user && (role === 'Registered_Driver' || role === 'Driver')) {
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
  
  // Counts & Progress computed based on active floor slots
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

  const totalCount = useMemo(() => {
    return currentFloorSlots.length || 150;
  }, [currentFloorSlots]);

<<<<<<< Updated upstream
  // Available free slots for floor indicators
  const floorGAvailable = useMemo(() => {
    return authSlots.filter(s => s.floor === 'Floor G' && s.status === 'Available').length;
=======
  const occupancyRate = useMemo(() => {
    if (totalCount === 0) return 0;
    return Math.round(((occupiedCount + reservedCount) / totalCount) * 100);
  }, [occupiedCount, reservedCount, totalCount]);

  // Count available slots globally for sidebar badges
  const floor1Available = useMemo(() => {
    return authSlots.filter(s => s.floor === 'Floor 1' && s.status === 'Available').length;
>>>>>>> Stashed changes
  }, [authSlots]);

  const basement1Available = useMemo(() => {
    return authSlots.filter(s => s.floor === 'Basement 1' && s.status === 'Available').length;
  }, [authSlots]);

  const basement2Available = useMemo(() => {
    return authSlots.filter(s => s.floor === 'Basement 2' && s.status === 'Available').length;
  }, [authSlots]);

  // Query filter
  const filterQuery = (s) => {
    if (!searchQuery) return true;
    return s.id.toLowerCase().includes(searchQuery.toLowerCase());
  };

  const bicycleSlots = useMemo(() => currentFloorSlots.filter(s => s.type === 'Bicycle'), [currentFloorSlots]);
  const motorcycleSlots = useMemo(() => currentFloorSlots.filter(s => s.type === 'Motorcycle'), [currentFloorSlots]);
  const carSlots = useMemo(() => currentFloorSlots.filter(s => s.type === 'Car'), [currentFloorSlots]);

  // Paginated grids to prevent DOM lagging on heavy slot datasets
  const filteredBicycles = useMemo(() => bicycleSlots.filter(filterQuery), [bicycleSlots, searchQuery]);
  const filteredMotorcycles = useMemo(() => motorcycleSlots.filter(filterQuery), [motorcycleSlots, searchQuery]);
  const filteredCars = useMemo(() => carSlots.filter(filterQuery), [carSlots, searchQuery]);

  const totalFilteredCount = useMemo(() => {
    return filteredBicycles.length + filteredMotorcycles.length + filteredCars.length;
  }, [filteredBicycles, filteredMotorcycles, filteredCars]);

  const totalPages = useMemo(() => {
    return Math.ceil(totalFilteredCount / itemsPerPage) || 1;
  }, [totalFilteredCount]);

  const paginatedSlots = useMemo(() => {
    const allFiltered = [...filteredBicycles, ...filteredMotorcycles, ...filteredCars];
    const startIndex = (currentPage - 1) * itemsPerPage;
    return allFiltered.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredBicycles, filteredMotorcycles, filteredCars, currentPage]);

  // Zoom handlers
  const handleZoomIn = () => {
    if (zoomLevel < 150) setZoomLevel(prev => prev + 10);
  };
  const handleZoomOut = () => {
    if (zoomLevel > 70) setZoomLevel(prev => prev - 10);
  };

  // Slot click handler
  const handleSlotClick = (slot) => {
    // If guest clicks an Available slot, prompt authentication
    if (!user) {
      if (slot.status === 'Available') {
        sessionStorage.setItem('spotflow_pending_booking_slot', slot.id);
        setPendingBookingSlot(slot.id);
        setIsAuthModalOpen(true);
      }
      return;
    }

    setSelectedSlot(slot);
    if (slot.status === 'Available') {
      if (role === 'Registered_Driver' || role === 'Driver') {
        setIsBookingModalOpen(true);
      } else {
        setIsDetailsModalOpen(true); // Staff/Admin manual reservation
      }
    } else {
      if (role !== 'Registered_Driver' && role !== 'Driver') {
        setIsDetailsModalOpen(true); // Staff/Admin releasing slot
      } else {
        message.info("This slot is currently occupied or reserved.");
      }
    }
  };

  // Driver Booking Submit
  const handleConfirmBookingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSlot) return;

    setSubmitting(true);
    try {
      const plate = bookingVehicleType === 'Bicycle' ? 'Bicycle Entry' : bookingPlate;
      
      const response = await parkingService.bookSlot(
        selectedSlot.dbSlotId,
        plate,
        selectedSlot.typeId
      );

      setIsBookingModalOpen(false);
      setAlertBanner(response.message || `Booking confirmed successfully for Slot ${selectedSlot.id}!`);
      setTimeout(() => {
        setAlertBanner(null);
      }, 4000);

      // Reload slots from backend database
      fetchParkingSlots();
    } catch (err) {
      console.error(err);
      message.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Admin/Staff manual check-in (Walk-in bypass)
  const handleAdminReserveSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSlot) return;

    setSubmitting(true);
    try {
      const response = await parkingService.walkInCheckIn(
        adminPlate,
        selectedSlot.typeId,
        null // optional checkInImageUrl
      );

      setIsDetailsModalOpen(false);
      setAlertBanner(response.message || `Slot ${selectedSlot.id} is now occupied by ${adminPlate}.`);
      setTimeout(() => {
        setAlertBanner(null);
      }, 4000);

      // Reload slots
      fetchParkingSlots();
    } catch (err) {
      console.error(err);
      message.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Admin/Staff check-out (Release slot and process fee)
  const handleForceCheckout = async () => {
    if (!selectedSlot) return;

    setSubmitting(true);
    try {
      const plate = selectedSlot.occupiedBy?.plate || 'Unknown';
      const response = await parkingService.checkOutVehicle(
        null, // ticketCode
        plate !== 'Unknown' ? plate : null,
        null, // checkOutImageUrl
        null  // sessionId
      );

      setIsDetailsModalOpen(false);
      const invoiceText = response.totalAmount !== undefined 
        ? ` Fee processed: ${response.totalAmount.toLocaleString('vi-VN')} đ.` 
        : '';
      
      setAlertBanner((response.message || `Slot ${selectedSlot.id} released successfully.`) + invoiceText);
      setTimeout(() => {
        setAlertBanner(null);
      }, 5000);

      // Reload slots
      fetchParkingSlots();
    } catch (err) {
      console.error(err);
      message.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Hourly Rate display helper
  const hourlyRateLabel = (type) => {
    if (type === 'Bicycle') return '2.000 đ';
    if (type === 'Motorcycle') return '20.000 đ';
    return '5.000 đ';
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
          <p className="text-sm text-slate-500">Real-time slot availability from SQL Server database — click any slot to manage</p>
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

      {/* Error / Offline Banner */}
      {errorMap && (
        <div className="bg-amber-50 border border-amber-100 text-amber-800 text-xs font-semibold p-3.5 rounded-xl flex items-center gap-2.5">
          <AlertTriangle size={16} className="text-amber-600 shrink-0" />
          <span>{errorMap}</span>
        </div>
      )}

      {/* 2. Main Two-Column Layout Panel */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* Left Side Block (Floor Manager - 30% width) */}
        <div className="w-full lg:w-[30%] flex flex-col gap-6 shrink-0 font-sans">
          
          {/* Select Floor Stack */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
            <h2 className="text-xs font-extrabold text-slate-400 tracking-widest uppercase">Select Parking Level</h2>
            <div className="flex flex-col gap-3">
              
              {/* Floor G Selector Button */}
              <button
                onClick={() => { setActiveFloor('Floor G'); setSearchQuery(''); }}
                className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all duration-200 ${
                  activeFloor === 'Floor G'
                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/10 font-bold scale-[1.01]'
                    : 'bg-white border-slate-100 hover:border-blue-400 hover:bg-slate-50/55 font-medium'
                }`}
              >
                <div className="flex flex-col gap-0.5">
<<<<<<< Updated upstream
                  <span className="text-sm font-semibold">Floor G</span>
                  <span className={`text-[11px] ${activeFloor === 'Floor G' ? 'text-blue-100' : 'text-slate-500'}`}>Bicycle & Motorcycle</span>
=======
                  <span className="text-sm font-semibold">Floor 1</span>
                  <span className={`text-[11px] ${activeFloor === 'Floor 1' ? 'text-blue-100' : 'text-slate-500'}`}>Motorbike & Bicycle</span>
>>>>>>> Stashed changes
                </div>
                <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${
                  activeFloor === 'Floor G'
                    ? 'bg-white/20 text-white'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                }`}>
                  {floorGAvailable} free
                </span>
              </button>

              {/* Basement 1 Selector Button */}
              <button
                onClick={() => { setActiveFloor('Basement 1'); setSearchQuery(''); }}
                className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all duration-200 ${
                  activeFloor === 'Basement 1'
                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/10 font-bold scale-[1.01]'
                    : 'bg-white border-slate-100 hover:border-blue-400 hover:bg-slate-50/55 font-medium'
                }`}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold">Basement 1 (B1)</span>
                  <span className={`text-[11px] ${activeFloor === 'Basement 1' ? 'text-blue-100' : 'text-slate-500'}`}>Car Parking Only</span>
                </div>
                <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${
                  activeFloor === 'Basement 1'
                    ? 'bg-white/20 text-white'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                }`}>
                  {basement1Available} free
                </span>
              </button>

              {/* Basement 2 Selector Button */}
              <button
                onClick={() => { setActiveFloor('Basement 2'); setSearchQuery(''); }}
                className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all duration-200 ${
                  activeFloor === 'Basement 2'
                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/10 font-bold scale-[1.01]'
                    : 'bg-white border-slate-100 hover:border-blue-400 hover:bg-slate-50/55 font-medium'
                }`}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold">Basement 2 (B2)</span>
                  <span className={`text-[11px] ${activeFloor === 'Basement 2' ? 'text-blue-100' : 'text-slate-500'}`}>Car Parking Only</span>
                </div>
                <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${
                  activeFloor === 'Basement 2'
                    ? 'bg-white/20 text-white'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                }`}>
                  {basement2Available} free
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
                <span className="text-slate-500 font-medium">Total Slots</span>
                <span className="font-bold text-slate-800">{totalCount}</span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00C853] inline-block"></span>
                  Available
                </span>
                <span className="font-bold text-emerald-650">{availableCount}</span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF1744] inline-block"></span>
                  Occupied
                </span>
                <span className="font-bold text-rose-600">{occupiedCount}</span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium flex items-center gap-2">
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
                className="h-10 w-10 border border-slate-200 hover:bg-slate-50 flex items-center justify-center rounded-lg text-slate-500 transition-all active:scale-95 bg-white"
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
<<<<<<< Updated upstream
          <div className="flex-1 overflow-auto p-6 bg-slate-50/20">
            <div 
              className="space-y-8 transition-transform duration-200 origin-top-left"
              style={{ transform: `scale(${zoomLevel / 100})` }}
            >
              
              {activeFloor === 'Floor G' ? (
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

=======
          <div className="flex-1 overflow-auto p-6 bg-slate-50/20 relative">
            {loadingMap && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center z-10">
                <div className="flex flex-col items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
                  <span className="text-xs font-semibold text-slate-555">Loading slots from Database...</span>
>>>>>>> Stashed changes
                </div>
              </div>
            )}

            {paginatedSlots.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[300px] text-slate-400 gap-2">
                <Info size={24} />
                <span className="text-sm font-medium">No slots found on this floor.</span>
              </div>
            ) : (
              <div 
                className="space-y-8 transition-transform duration-200 origin-top-left"
                style={{ transform: `scale(${zoomLevel / 100})` }}
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                    {activeFloor === 'Floor 1' ? <Motorcycle size={18} className="text-indigo-650" /> : <Car size={18} className="text-blue-600" />}
                    <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">
                      {activeFloor === 'Floor 1' ? 'Motorbike & Bicycle Parking' : 'Car Parking Area'}
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3.5">
                    {paginatedSlots.map((slot) => (
                      <div key={slot.id} className="relative group">
                        <div
                          onClick={() => handleSlotClick(slot)}
                          className={`aspect-square rounded-xl flex flex-col justify-between p-3 border transition-all duration-200 ${
                            slot.status === 'Available'
                              ? 'bg-[#00C853] text-white border-[#00B24A] hover:-translate-y-1 hover:shadow-md cursor-pointer hover:scale-102 font-bold'
                              : slot.status === 'Occupied'
                              ? 'bg-[#FF1744] text-white border-[#E0143C] opacity-90 cursor-pointer hover:-translate-y-0.5 hover:shadow-sm font-bold'
                              : 'bg-[#FFC107] text-white border-[#E0A800] opacity-90 cursor-pointer hover:-translate-y-0.5 hover:shadow-sm font-bold'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <span className="text-[8px] font-extrabold opacity-75 uppercase tracking-wide">
                              {slot.type === 'Bicycle' ? 'BIKE' : slot.type === 'Motorcycle' ? 'MOTO' : 'CAR'}
                            </span>
                            {slot.type === 'Bicycle' ? <Bike size={14} /> : slot.type === 'Motorcycle' ? <Motorcycle size={14} /> : <Car size={14} />}
                          </div>
                          <span className="text-xs font-mono font-extrabold tracking-wide mt-2">{slot.id}</span>
                        </div>

                        {/* Tooltip on hover */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block bg-slate-900 text-white text-[9px] font-bold py-1 px-2 rounded shadow-lg whitespace-nowrap z-30 pointer-events-none transition-all">
                          Status: {slot.status} ({slot.type})
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sticky Bottom Ribbon + Pagination */}
          <div className="p-4 bg-white border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5 mx-auto sm:mx-0">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 active:scale-95 disabled:opacity-40 transition-all"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-semibold text-slate-600 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 active:scale-95 disabled:opacity-40 transition-all"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

            <div className="flex-1 bg-[#1A62FF] text-white font-medium text-center text-xs py-3 rounded-xl shadow-md flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
              <span>{availableCount} slots available right now — click any green slot to book your space</span>
            </div>
          </div>

        </div>

      </div>

      {/* 3. CREATE BOOKING MODAL (Drivers Only) */}
      {isBookingModalOpen && selectedSlot && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-scale-in relative font-sans">
            
            <button 
              onClick={() => setIsBookingModalOpen(false)}
              className="absolute top-4 right-4 h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-50 flex items-center justify-center rounded-lg transition-all"
            >
              <X size={18} />
            </button>

            <div className="p-6 sm:p-8 space-y-6">
              
              <div className="space-y-1">
                <h3 className="text-xl font-extrabold text-slate-800">Book Parking Slot</h3>
                <p className="text-xs text-slate-500">Configure your reservation session in the real database</p>
              </div>

              <div className="bg-sky-50 border border-sky-100 rounded-xl p-3.5 text-sky-800 text-xs font-semibold flex items-start gap-2.5">
                <Info size={16} className="text-sky-600 shrink-0 mt-0.5" />
                <div>
                  <span>You are reserving Slot: </span>
                  <span className="font-mono font-extrabold text-blue-600">{selectedSlot.id}</span>
                  <span> on </span>
                  <span className="font-bold text-slate-800">{activeFloor}</span>
                  <span className="text-sky-600 font-medium block mt-0.5">
                    Selected slot classification: {selectedSlot.type} (DB Slot ID: {selectedSlot.dbSlotId})
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
                    {activeFloor === 'Floor G' ? (
                      <>
                        <option value="Motorcycle">Motorcycle</option>
                        <option value="Bicycle">Bicycle</option>
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
                            : 'bg-slate-50/50 border-slate-200 hover:bg-slate-55 text-slate-555 hover:text-slate-850'
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
                    disabled={submitting}
                    className="flex-1 h-11 bg-blue-600 hover:bg-blue-550 text-white font-bold rounded-xl transition-all shadow-md shadow-blue-500/10 flex items-center justify-center gap-1.5 text-sm"
                  >
                    {submitting ? 'Processing...' : 'Confirm Booking'}
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
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-scale-in relative font-sans">
            
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
              
              {/* STATUS: OCCUPIED / RESERVED */}
              {(selectedSlot.status === 'Occupied' || selectedSlot.status === 'Reserved') && (
                <div className="space-y-4">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Occupancy Mode</span>
                      <span className="font-mono text-xs text-slate-800 bg-white px-2.5 py-1 rounded border border-slate-200 font-extrabold shadow-sm">{selectedSlot.status}</span>
                    </div>
                  </div>

                  {(role === 'Admin' || role === 'Staff') && (
                    <button
                      onClick={handleForceCheckout}
                      disabled={submitting}
                      className="w-full h-11 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-rose-500/10 text-sm transition-all"
                    >
                      <UserCheck size={16} />
                      {submitting ? 'Releasing...' : 'Check-out Vehicle & Clear Slot'}
                    </button>
                  )}
                </div>
              )}

              {/* STATUS: AVAILABLE */}
              {selectedSlot.status === 'Available' && (
                <div className="space-y-4">
                  <form onSubmit={handleAdminReserveSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Assign License Plate (Walk-in)</label>
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
                        disabled={submitting}
                        className="flex-1 h-11 bg-blue-600 hover:bg-blue-550 text-white font-bold rounded-xl transition-all shadow-md text-sm"
                      >
                        {submitting ? 'Processing...' : 'Check-in Vehicle'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default ParkingLotMap;
