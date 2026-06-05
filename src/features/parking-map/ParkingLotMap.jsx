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

// Define DB Floor Structure
const DB_FLOORS = [
  { id: 3, name: "Floor G", capacity: 1200, desc: "Motorbike & Bicycle Parking" },
  { id: 1, name: "Floor B1", capacity: 100, desc: "Car Parking Only" },
  { id: 2, name: "Floor B2", capacity: 100, desc: "Car Parking Only" }
];

const initAuthParkingMap = () => {
  const slots = [];
  
  // Simulated Fallback Data (Floor G - FloorId 3)
  for (let i = 1; i <= 60; i++) {
    slots.push({
      id: `G-M-${String(i).padStart(3, '0')}`,
      dbSlotId: 154 + i,
      slotId: 154 + i,
      floorId: 3,
      floor: 'Floor G',
      zone: 'Motorcycle',
      type: 'Motorcycle',
      status: 'Available',
      typeId: 2
    });
  }

  // Simulated Fallback Data (Floor B1 - FloorId 1)
  for (let i = 1; i <= 40; i++) {
    slots.push({
      id: `B1-C-${String(i).padStart(3, '0')}`,
      dbSlotId: 4 + i,
      slotId: 4 + i,
      floorId: 1,
      floor: 'Floor B1',
      zone: 'Car',
      type: 'Car',
      status: 'Available',
      typeId: 3
    });
  }

  // Simulated Fallback Data (Floor B2 - FloorId 2)
  for (let i = 1; i <= 20; i++) {
    slots.push({
      id: `B2-C-${String(i).padStart(3, '0')}`,
      dbSlotId: 2000 + i,
      slotId: 2000 + i,
      floorId: 2,
      floor: 'Floor B2',
      zone: 'Car',
      type: 'Car',
      status: 'Available',
      typeId: 3
    });
  }

  return slots;
};

const ParkingLotMap = () => {
  const { role, user } = useAuth();

  const [activeFloorId, setActiveFloorId] = useState(3); // Default to Floor G (FloorId = 3)
  const [searchQuery, setSearchQuery] = useState('');
  const [zoomLevel, setZoomLevel] = useState(100);
  const [loadingMap, setLoadingMap] = useState(false);
  const [errorMap, setErrorMap] = useState('');
  
  // Guest view states
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingBookingSlot, setPendingBookingSlot] = useState(null);
  
  // Stateful slots
  const [authSlots, setAuthSlots] = useState(() => initAuthParkingMap());

  // Floors state initialized strictly to DB_FLOORS
  const [floors, setFloors] = useState(DB_FLOORS);

  // Available free slots count for sidebar badges
  const [floorAvailableCounts, setFloorAvailableCounts] = useState({
    3: 1200,
    1: 100,
    2: 100
  });

  // Modal triggers
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Form states for booking
  const [bookingVehicleType, setBookingVehicleType] = useState('Motorcycle');
  const [bookingPlate, setBookingPlate] = useState('');
  const [bookingDuration, setBookingDuration] = useState('1 Hour');

  // Form states for Manager/Admin reservation
  const [adminPlate, setAdminPlate] = useState('');

  const [alertBanner, setAlertBanner] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Pagination for high density floors
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 120;

  // Active floor metadata selector
  const activeFloor = useMemo(() => {
    return floors.find(f => f.id === activeFloorId) || floors[0];
  }, [activeFloorId, floors]);

  // Helper: map database response to UI structure
  const mapBackendSlotsToUI = (backendSlots, floorId, floorName) => {
    const sortedBackendSlots = [...backendSlots].sort((a, b) => a.slotName.localeCompare(b.slotName));
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
        slotId: slotId,
        floorId: floorId,
        floor: floorName,
        zone: zone,
        type: type,
        status: s.slotStatus ? s.slotStatus.trim() : 'Available',
        typeId: s.typeId,
        occupiedBy: s.slotStatus.trim() !== 'Available' ? {
          plate: type === 'Bicycle' ? 'BicycleEntry' : 'Unknown',
          checkInTime: new Date().toISOString(),
          type: type
        } : null
      };
    });
  };

  // Implement explicit onFloorChange event handler executing API with DB Floor ID
  const onFloorChange = async (floorId) => {
    setActiveFloorId(floorId);
    setSearchQuery('');
    setCurrentPage(1);
    setLoadingMap(true);
    setErrorMap('');
    try {
      const data = await parkingService.getSlotsByFloor(floorId);
      const floorMeta = floors.find(f => f.id === floorId) || floors[0];
      
      if (data && data.length > 0) {
        const mapped = mapBackendSlotsToUI(data, floorId, floorMeta.name);
        
        // Compute available count
        const availCount = mapped.filter(s => s.status === 'Available').length;
        setFloorAvailableCounts(prev => ({
          ...prev,
          [floorId]: availCount
        }));

        setAuthSlots(prev => {
          const otherFloorSlots = prev.filter(s => s.floorId !== floorId);
          return [...otherFloorSlots, ...mapped];
        });
      } else {
        // If floor empty, clear
        setFloorAvailableCounts(prev => ({
          ...prev,
          [floorId]: 0
        }));
        setAuthSlots(prev => prev.filter(s => s.floorId !== floorId));
      }
    } catch (err) {
      console.error(err);
      setErrorMap('Offline Mode: Displaying simulated offline layout.');
    } finally {
      setLoadingMap(false);
    }
  };

  // Trigger initial fetch when component mounts or dynamic floors are loaded
  useEffect(() => {
    // Try to load dynamic floors if API exists (otherwise fallback is already set to DB_FLOORS)
    const loadDynamicFloors = async () => {
      if (typeof parkingService.getFloors === 'function') {
        try {
          const data = await parkingService.getFloors();
          if (data && data.length > 0) {
            setFloors(data.map(f => ({
              id: f.floorId || f.id,
              name: f.floorName || f.name,
              capacity: f.capacity || 100,
              desc: (f.floorId || f.id) === 3 ? "Motorbike & Bicycle Parking" : "Car Parking Only"
            })));
          }
        } catch (e) {
          console.warn("Failed to fetch dynamic floors, using static mapping.", e);
        }
      }
    };
    loadDynamicFloors();
    onFloorChange(activeFloorId);
  }, []);

  // Synchronize dynamic booking form selection on floor/slot updates
  useEffect(() => {
    if (activeFloorId === 3) {
      setBookingVehicleType('Motorcycle');
    } else {
      setBookingVehicleType('Car');
    }
    setBookingPlate('');
    setBookingDuration('1 Hour');
    setAdminPlate('');
  }, [activeFloorId, selectedSlot]);

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
  
  // Counts & Progress computed dynamically based on actual database slots
  const currentFloorSlots = useMemo(() => {
    return authSlots.filter(s => s.floorId === activeFloorId);
  }, [authSlots, activeFloorId]);

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
    return currentFloorSlots.length; // based on actual array lengths returned by database response
  }, [currentFloorSlots]);

  const occupancyRate = useMemo(() => {
    if (totalCount === 0) return 0;
    return Math.round(((occupiedCount + reservedCount) / totalCount) * 100);
  }, [occupiedCount, reservedCount, totalCount]);

  // Query filter
  const filterQuery = (s) => {
    if (!searchQuery) return true;
    return s.id.toLowerCase().includes(searchQuery.toLowerCase());
  };

  const bicycleSlots = useMemo(() => currentFloorSlots.filter(s => s.type === 'Bicycle'), [currentFloorSlots]);
  const motorcycleSlots = useMemo(() => currentFloorSlots.filter(s => s.type === 'Motorcycle'), [currentFloorSlots]);
  const carSlots = useMemo(() => currentFloorSlots.filter(s => s.type === 'Car'), [currentFloorSlots]);

  // Paginated slots array
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
        setIsDetailsModalOpen(true);
      }
    } else {
      if (role !== 'Registered_Driver' && role !== 'Driver') {
        setIsDetailsModalOpen(true);
      } else {
        message.info("This slot is currently occupied or reserved.");
      }
    }
  };

  // Driver Booking Submit
  const handleConfirmBookingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSlot) return;

    // Guard: ensure JWT bearer token is fully authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      message.error("Authentication session expired. Please log in again to book a slot.");
      return;
    }

    setSubmitting(true);
    try {
      // 1. STRICT DATA TYPE SANITIZATION
      // Strip spaces, dashes, and special characters from the plate
      const rawPlate = bookingVehicleType === 'Bicycle' ? 'BicycleEntry' : bookingPlate;
      const cleanPlate = rawPlate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

      let vehicleTypeId = 3; // Default to Car (3)
      if (bookingVehicleType === 'Bicycle') vehicleTypeId = 1;
      else if (bookingVehicleType === 'Motorcycle') vehicleTypeId = 2;

      // Explicitly convert payload slotId and typeId to numbers
      const response = await parkingService.bookSlot(
        Number(selectedSlot.slotId),
        cleanPlate,
        Number(vehicleTypeId)
      );

      setIsBookingModalOpen(false);
      setAlertBanner(response.message || `Booking confirmed successfully for Slot ${selectedSlot.id}!`);
      setTimeout(() => {
        setAlertBanner(null);
      }, 4000);

      onFloorChange(activeFloorId);
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
      // Strip spaces, dashes, and special characters from the admin check-in plate
      const cleanPlate = adminPlate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

      const response = await parkingService.walkInCheckIn(
        cleanPlate,
        Number(selectedSlot.typeId),
        null
      );

      setIsDetailsModalOpen(false);
      setAlertBanner(response.message || `Slot ${selectedSlot.id} is now occupied by ${cleanPlate}.`);
      setTimeout(() => {
        setAlertBanner(null);
      }, 4000);

      onFloorChange(activeFloorId);
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
      const cleanPlate = plate !== 'Unknown' ? plate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : null;
      
      const response = await parkingService.checkOutVehicle(
        null,
        cleanPlate,
        null,
        null
      );

      setIsDetailsModalOpen(false);
      const invoiceText = response.totalAmount !== undefined 
        ? ` Fee processed: ${response.totalAmount.toLocaleString('vi-VN')} đ.` 
        : '';
      
      setAlertBanner((response.message || `Slot ${selectedSlot.id} released successfully.`) + invoiceText);
      setTimeout(() => {
        setAlertBanner(null);
      }, 5000);

      onFloorChange(activeFloorId);
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
            <div className="flex items-center gap-2 text-sm font-medium text-slate-655">
              <span className="w-3 h-3 rounded-full bg-[#00C853] inline-block shadow-sm"></span>
              <span>Available ({availableCount})</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-655">
              <span className="w-3 h-3 rounded-full bg-[#FF1744] inline-block shadow-sm"></span>
              <span>Occupied ({occupiedCount})</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-655">
              <span className="w-3 h-3 rounded-full bg-[#FFC107] inline-block shadow-sm"></span>
              <span>Reserved ({reservedCount})</span>
            </div>
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
            <h2 className="text-xs font-extrabold text-slate-404 tracking-widest uppercase">Select Parking Level</h2>
            <div className="flex flex-col gap-3">
              {floors.map((f) => (
                <button
                  key={f.id}
                  onClick={() => onFloorChange(f.id)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all duration-200 ${
                    activeFloorId === f.id
                      ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/10 font-bold scale-[1.01]'
                      : 'bg-white border-slate-100 hover:border-blue-400 hover:bg-slate-50/55 font-medium'
                  }`}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold">{f.name}</span>
                    <span className={`text-[11px] ${activeFloorId === f.id ? 'text-blue-100' : 'text-slate-500'}`}>{f.desc}</span>
                  </div>
                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${
                    activeFloorId === f.id
                      ? 'bg-white/20 text-white'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                  }`}>
                    {floorAvailableCounts[f.id] !== undefined ? floorAvailableCounts[f.id] : 0} free
                  </span>
                </button>
              ))}
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
                <span className="text-slate-505 font-medium flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00C853] inline-block"></span>
                  Available
                </span>
                <span className="font-bold text-emerald-600">{availableCount}</span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-505 font-medium flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF1744] inline-block"></span>
                  Occupied
                </span>
                <span className="font-bold text-rose-600">{occupiedCount}</span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-555 font-medium flex items-center gap-2">
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
              <span className="text-xs font-mono font-bold text-slate-650 min-w-[48px] text-center bg-white border border-slate-200 py-2.5 px-3 rounded-lg">
                {zoomLevel}%
              </span>
              <button 
                onClick={handleZoomIn} 
                className="h-10 w-10 border border-slate-200 hover:bg-slate-50 flex items-center justify-center rounded-lg text-slate-500 transition-all active:scale-95 bg-white"
              >
                <Plus size={16} />
              </button>
            </div>

          </div>

          {/* Scrollable Maps Zone */}
          <div className="flex-1 overflow-auto p-6 bg-slate-50/20 relative">
            {loadingMap && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center z-10">
                <div className="flex flex-col items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
                  <span className="text-xs font-semibold text-slate-500">Loading slots from Database...</span>
                </div>
              </div>
            )}

            {paginatedSlots.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[300px] text-slate-400 gap-2">
                <Info size={24} />
                <span className="text-sm font-medium">No slots found on {activeFloor.name}.</span>
              </div>
            ) : (
              <div 
                className="space-y-8 transition-transform duration-200 origin-top-left"
                style={{ transform: `scale(${zoomLevel / 100})` }}
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                    {activeFloorId === 3 ? <Motorcycle size={18} className="text-indigo-650" /> : <Car size={18} className="text-blue-600" />}
                    <h3 className="font-extrabold text-slate-808 text-xs uppercase tracking-wider">
                      {activeFloor.name} Layout ({activeFloor.desc})
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
                <span className="text-xs font-semibold text-slate-655 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-55 active:scale-95 disabled:opacity-40 transition-all"
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
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-105 animate-scale-in relative font-sans">
            
            <button 
              onClick={() => setIsBookingModalOpen(false)}
              className="absolute top-4 right-4 h-8 w-8 text-slate-400 hover:text-slate-650 hover:bg-slate-50 flex items-center justify-center rounded-lg transition-all"
            >
              <X size={18} />
            </button>

            <div className="p-6 sm:p-8 space-y-6">
              
              <div className="space-y-1">
                <h3 className="text-xl font-extrabold text-slate-805">Book Parking Slot</h3>
                <p className="text-xs text-slate-500">Configure your reservation session in the real database</p>
              </div>

              <div className="bg-sky-50 border border-sky-100 rounded-xl p-3.5 text-sky-850 text-xs font-semibold flex items-start gap-2.5">
                <Info size={16} className="text-sky-600 shrink-0 mt-0.5" />
                <div>
                  <span>You are reserving Slot: </span>
                  <span className="font-mono font-extrabold text-blue-600">{selectedSlot.id}</span>
                  <span> on </span>
                  <span className="font-bold text-slate-800">{activeFloor.name}</span>
                  <span className="text-sky-655 font-medium block mt-0.5">
                    Selected slot classification: {selectedSlot.type} (DB Slot ID: {selectedSlot.slotId || selectedSlot.dbSlotId})
                  </span>
                </div>
              </div>

              <form onSubmit={handleConfirmBookingSubmit} className="space-y-4">
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-slate-450 tracking-wider">Vehicle Type</label>
                  <select
                    value={bookingVehicleType}
                    onChange={(e) => setBookingVehicleType(e.target.value)}
                    className="w-full h-11 px-3.5 bg-slate-50 border border-slate-205 text-sm rounded-xl focus:outline-none focus:border-blue-505 focus:bg-white transition-all font-medium"
                  >
                    {activeFloorId === 3 ? (
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
                    <label className="text-[10px] font-extrabold uppercase text-slate-450 tracking-wider">License Plate Number</label>
                    <div className="relative">
                      <Car size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text"
                        required
                        placeholder="e.g., 29A-12345"
                        value={bookingPlate}
                        onChange={(e) => setBookingPlate(e.target.value)}
                        className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-205 text-sm rounded-xl focus:outline-none focus:border-blue-550 focus:bg-white transition-all uppercase font-mono font-bold"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold uppercase text-slate-455 tracking-wider">Estimated Duration</label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {['1 Hour', '2 Hours', 'Full Day'].map((duration) => (
                      <button
                        key={duration}
                        type="button"
                        onClick={() => setBookingDuration(duration)}
                        className={`py-3.5 px-3 rounded-xl border text-center transition-all text-xs font-bold leading-tight ${
                          bookingDuration === duration
                            ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm'
                            : 'bg-slate-50/50 border-slate-205 hover:bg-slate-50 text-slate-500 hover:text-slate-800'
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
                    className="flex-1 h-11 border border-slate-200 hover:bg-slate-55 text-slate-600 hover:text-slate-800 font-bold rounded-xl transition-all text-sm"
                  >
                    Cancel
                  </button>
                  
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 h-11 bg-blue-600 hover:bg-blue-750 text-white font-bold rounded-xl transition-all shadow-md shadow-blue-500/10 flex items-center justify-center gap-1.5 text-sm"
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
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-105 animate-scale-in relative font-sans">
            
            <button 
              onClick={() => setIsDetailsModalOpen(false)}
              className="absolute top-4 right-4 h-8 w-8 text-slate-404 hover:text-slate-655 hover:bg-slate-50 flex items-center justify-center rounded-lg transition-all"
            >
              <X size={18} />
            </button>

            <div className="p-6 sm:p-8 space-y-6">
              
              <div className="space-y-1">
                <h3 className="text-xl font-extrabold text-slate-808 flex items-center gap-2">
                  {selectedSlot.type === 'Bicycle' && <Bike className="text-blue-505" size={20} />}
                  {selectedSlot.type === 'Motorcycle' && <Motorcycle className="text-indigo-505" size={20} />}
                  {selectedSlot.type === 'Car' && <Car className="text-indigo-650" size={20} />}
                  <span>Slot Control: {selectedSlot.id}</span>
                </h3>
                <p className="text-xs text-slate-505">Supervisor workspace management terminal</p>
              </div>

              {/* General Metadata Panel */}
              <div className="bg-slate-50 border border-slate-205 rounded-xl p-4 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-semibold">Location Floor</span>
                  <span className="font-extrabold text-slate-700">{selectedSlot.floor}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-semibold">Classification Type</span>
                  <span className="font-extrabold text-slate-700 capitalize">{selectedSlot.type} Slot</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-450 font-semibold">Hourly Base Rate</span>
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
                  <div className="bg-slate-50 border border-slate-205 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Occupancy Mode</span>
                      <span className="font-mono text-xs text-slate-800 bg-white px-2.5 py-1 rounded border border-slate-205 font-extrabold shadow-sm">{selectedSlot.status}</span>
                    </div>
                  </div>

                  {(role === 'Admin' || role === 'Staff') && (
                    <button
                      onClick={handleForceCheckout}
                      disabled={submitting}
                      className="w-full h-11 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-rose-500/10 text-sm transition-all"
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
                      <label className="text-[10px] font-extrabold uppercase text-slate-455 tracking-wider">Assign License Plate (Walk-in)</label>
                      <input 
                        type="text"
                        required
                        placeholder="e.g. 29A-888.88"
                        value={adminPlate}
                        onChange={(e) => setAdminPlate(e.target.value)}
                        className="w-full h-11 px-3.5 bg-slate-50 border border-slate-205 text-sm rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white transition-all uppercase font-mono font-bold"
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md text-sm"
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