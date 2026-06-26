import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import { managerService } from '../../services/managerService';
import api from '../../services/api';
import carIcon from '../../assets/vehicles/car.png';
import motorbikeIcon from '../../assets/vehicles/motorbike.png';
import i18n from '../../i18n';
import { useTranslation } from 'react-i18next';



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

const vehicleIconMap = {
  car: carIcon,
  motorbike: motorbikeIcon,
  bicycle: motorbikeIcon,
};

const statusStyleMap = {
  available: 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:border-emerald-500 hover:-translate-y-1 hover:shadow-md hover:shadow-emerald-500/10 hover:scale-105',
  occupied: 'bg-rose-50 text-rose-900 border-rose-200 hover:border-rose-400 hover:-translate-y-0.5 hover:shadow-sm',
  reserved: 'bg-amber-50 text-amber-900 border-amber-200 hover:border-amber-400 hover:-translate-y-0.5 hover:shadow-sm',
};

const normalizeStatus = (status) => {
  const value = String(status ?? '').trim().toLowerCase();
  if (value === '1' || value === 'occupied') return 'occupied';
  if (value === '2' || value === 'reserved') return 'reserved';
  return 'available';
};

const normalizeVehicleType = (type) => {
  const value = String(type ?? '').trim().toLowerCase();
  if (value === 'car') return 'car';
  if (value === 'motorbike' || value === 'motorcycle') return 'motorbike';
  if (value === 'bicycle' || value === 'bike') return 'bicycle';
  return value;
};

const canonicalStatusLabel = {
  available: 'Available',
  occupied: 'Occupied',
  reserved: 'Reserved',
};

const getSlotVehicleIcon = (slot) => {
  const typeId = Number(slot?.typeId);
  if (typeId === 3) return carIcon;
  if (typeId === 1 || typeId === 2) return motorbikeIcon;
  return vehicleIconMap[normalizeVehicleType(slot?.type)] || null;
};

const getSlotVehicleAlt = (slot) => {
  const typeId = Number(slot?.typeId);
  if (typeId === 3 || normalizeVehicleType(slot?.type) === 'car') return 'Car';
  return 'Motorbike';
};

const getStatusLabel = (status) => {
  switch (status) {
    case 'Available':
      return i18n.t('parkingMap.available').replace(':', '');
    case 'Occupied':
      return i18n.t('parkingMap.occupied').replace(':', '');
    case 'Reserved':
      return i18n.t('parkingMap.reserved').replace(':', '');
    case 'Maintenance':
      return i18n.t('parkingMap.maintenance').replace(':', '');
    default:
      return status;
  }
};

const getFloorDisplayName = (floorName) => {
  if (!floorName) return '';
  return String(floorName).replace(/^Floor\s*/i, `${i18n.t('parkingMap.floor')} `);
};

const getFloorDescriptionLabel = (description) => {
  const value = String(description || '').trim().toLowerCase();
  if (value === 'motorbike & bicycle parking') return i18n.t('parkingMap.bikes');
  if (value === 'car parking only') return i18n.t('parkingMap.cars');
  return description;
};

const getVehicleTypeLabel = (type) => {
  switch (type) {
    case 'Bicycle':
    case 'Motorcycle':
      return i18n.t('parkingMap.bikes').split(' & ')[0];
    case 'Car':
      return i18n.t('parkingMap.cars');
    default:
      return type;
  }
};

const getZoneDisplayName = (zoneName) => {
  if (!zoneName) return '';
  return `${i18n.t('parkingMap.zone')} ${zoneName}`;
};

const getDerivedZoneName = (slot, index) => {
  const explicitZone = slot?.zoneName || slot?.zone || slot?.area;
  if (explicitZone && !['car', 'motorcycle', 'bicycle'].includes(String(explicitZone).trim().toLowerCase())) {
    return String(explicitZone).trim().replace(/^zone\s+/i, '').toUpperCase();
  }

  const slotId = String(slot?.id || slot?.slotName || '').trim();
  const match = slotId.match(/^([A-Z]\d+)[-_\s]/i);
  if (match) return match[1].toUpperCase();

  const sectionIndex = Math.floor(index / 20);
  const prefix = sectionIndex < 3 ? 'A' : 'B';
  const number = sectionIndex < 3 ? sectionIndex + 1 : sectionIndex - 2;
  return `${prefix}${number}`;
};

const chunkSlots = (slots, size) => {
  const chunks = [];
  for (let i = 0; i < slots.length; i += size) {
    chunks.push(slots.slice(i, i + size));
  }
  return chunks;
};

const getDefaultExpectedCheckInTimeParts = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() + 30); // Default to 30 mins in the future, not realtime
  return {
    hour: d.getHours(),
    minute: d.getMinutes(),
  };
};

const ParkingLotMap = () => {
  const { role, user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [searchParams] = useSearchParams();
  const highlightFloorId = searchParams.get('floorId');
  const highlightSlotName = searchParams.get('slotName');

  const [activeFloorId, setActiveFloorId] = useState(3); // Default to Floor G (FloorId = 3)

  // Auto switch floor if highlighted from LocateVehicle
  useEffect(() => {
    if (highlightFloorId) {
      setActiveFloorId(parseInt(highlightFloorId, 10));
    }
  }, [highlightFloorId]);
  const [searchQuery, setSearchQuery] = useState('');
  const [zoomLevel, setZoomLevel] = useState(100);
  const [loadingMap, setLoadingMap] = useState(false);
  const [errorMap, setErrorMap] = useState('');

  // Guest view states
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingBookingSlot, setPendingBookingSlot] = useState(null);

  // Stateful slots
  const [authSlots, setAuthSlots] = useState([]);

  // Floors state initialized strictly to DB_FLOORS
  const [floors, setFloors] = useState(DB_FLOORS);

  // Available free slots count for sidebar badges
  const [floorAvailableCounts, setFloorAvailableCounts] = useState({});

  // Modal triggers
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Slot details state
  const [fetchingDetail, setFetchingDetail] = useState(false);
  const [slotDetail, setSlotDetail] = useState(null);

  const fetchSlotDetail = async (slotId) => {
    setFetchingDetail(true);
    setSlotDetail(null);
    try {
      const detail = await managerService.getSlotDetail(slotId);
      setSlotDetail(detail);
    } catch (err) {
      console.error("Failed to fetch slot detail:", err);
    } finally {
      setFetchingDetail(false);
    }
  };


  // Form states for booking
  const [bookingVehicleType, setBookingVehicleType] = useState('Motorcycle');
  const [bookingPlate, setBookingPlate] = useState('');
  const [expectedHour, setExpectedHour] = useState(() => getDefaultExpectedCheckInTimeParts().hour);
  const [expectedMinute, setExpectedMinute] = useState(() => getDefaultExpectedCheckInTimeParts().minute);

  // Form states for Manager/Admin reservation
  const [adminPlate, setAdminPlate] = useState('');

  const [alertBanner, setAlertBanner] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Zone navigation for high density floors
  const [currentPage, setCurrentPage] = useState(1);

  // Active floor metadata selector
  const activeFloor = useMemo(() => {
    return floors.find(f => f.id === activeFloorId) || floors[0];
  }, [activeFloorId, floors]);

  // Helper: map database response to UI structure
  const mapBackendSlotsToUI = (backendSlots, floorId, floorName) => {
    const sortedBackendSlots = [...backendSlots].sort((a, b) => a.slotName.localeCompare(b.slotName));
    const startSlotId = floorId === 3 ? 155 : floorId === 1 ? 5 : 2000;

    return sortedBackendSlots.map((s, index) => {
      const slotId = s.slotId || (startSlotId + index);
      const slotName = s.slotName || '';

      let type = 'Car';
      if (s.typeId === 1 || slotName.startsWith('B-')) type = 'Bicycle';
      else if (s.typeId === 2 || slotName.startsWith('M-')) type = 'Motorcycle';

      let zone = 'Car';
      if (type === 'Bicycle') zone = 'Bicycle';
      else if (type === 'Motorcycle') zone = 'Motorcycle';

      const normalizedStatus = normalizeStatus(s.slotStatus);

      return {
        id: s.slotName,
        dbSlotId: slotId,
        slotId: slotId,
        floorId: floorId,
        floor: floorName,
        zone: zone,
        type: type,
        status: canonicalStatusLabel[normalizedStatus],
        typeId: s.typeId,
        occupiedBy: normalizedStatus !== 'available' ? {
          plate: type === 'Bicycle' ? 'BicycleEntry' : 'Unknown',
          checkInTime: new Date().toISOString(),
          type: type
        } : null
      };
    });
  };

  const getAvailableSlotCount = (slots) => {
    return slots.filter(s => s.status === 'Available').length;
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
        const availCount = getAvailableSlotCount(mapped);
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
      setErrorMap('Không thể tải dữ liệu chỗ đỗ từ backend.');
    } finally {
      setLoadingMap(false);
    }
  };

  // Trigger initial fetch when component mounts or dynamic floors are loaded
  useEffect(() => {
    const loadInitialFloorData = async () => {
      let floorList = DB_FLOORS;

      try {
        const data = await parkingService.getFloors();
        if (data && data.length > 0) {
          floorList = data.map(f => ({
            id: f.floorId || f.id,
            name: f.floorName || f.name,
            capacity: f.capacity || 0,
            desc: f.description || f.Description || ''
          }));
          setFloors(floorList);
        }
      } catch (e) {
        console.warn("Failed to fetch dynamic floors.", e);
      }

      setLoadingMap(true);
      setErrorMap('');

      try {
        const summaries = await Promise.all(
          floorList.map(async (floor) => {
            try {
              const data = await parkingService.getSlotsByFloor(floor.id);
              const mapped = Array.isArray(data) ? mapBackendSlotsToUI(data, floor.id, floor.name) : [];
              return {
                floorId: floor.id,
                mapped,
                availCount: getAvailableSlotCount(mapped)
              };
            } catch (err) {
              console.error(`Failed to fetch floor ${floor.id}:`, err);
              return {
                floorId: floor.id,
                mapped: null,
                availCount: undefined
              };
            }
          })
        );

        const successfulSummaries = summaries.filter(summary => Array.isArray(summary.mapped));
        setFloorAvailableCounts(prev => ({
          ...prev,
          ...Object.fromEntries(successfulSummaries.map(summary => [summary.floorId, summary.availCount]))
        }));

        setAuthSlots(prev => {
          const fetchedFloorIds = new Set(successfulSummaries.map(summary => summary.floorId));
          const existingSlots = prev.filter(slot => !fetchedFloorIds.has(slot.floorId));
          const fetchedSlots = successfulSummaries.flatMap(summary => summary.mapped);
          return [...existingSlots, ...fetchedSlots];
        });

        if (successfulSummaries.length < floorList.length) {
          setErrorMap('Một số tầng chưa tải được dữ liệu từ backend.');
        }
      } finally {
        setLoadingMap(false);
      }
    };

    loadInitialFloorData();
  }, []);

  // Synchronize dynamic booking form selection on floor/slot updates
  useEffect(() => {
    if (activeFloorId === 3) {
      setBookingVehicleType('Motorcycle');
    } else {
      setBookingVehicleType('Car');
    }
    setBookingPlate('');
    const defaultExpectedTime = getDefaultExpectedCheckInTimeParts();
    setExpectedHour(defaultExpectedTime.hour);
    setExpectedMinute(defaultExpectedTime.minute);
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

  const filteredSlots = useMemo(() => {
    return [...filteredBicycles, ...filteredMotorcycles, ...filteredCars];
  }, [filteredBicycles, filteredMotorcycles, filteredCars]);

  const zoneSections = useMemo(() => {
    if (activeFloorId !== 3) {
      const zoneNames = ['A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'B3', 'B4', 'C1', 'C2'];
      return chunkSlots(filteredSlots, 6).map((slots, index) => ({
        key: `car-${zoneNames[index] || `Z${index + 1}`}`,
        title: zoneNames[index] || `Z${index + 1}`,
        slots,
      }));
    }

    const grouped = new Map();

    filteredSlots.forEach((slot, index) => {
      const zoneName = getDerivedZoneName(slot, index);
      if (!grouped.has(zoneName)) grouped.set(zoneName, []);
      grouped.get(zoneName).push(slot);
    });

    return Array.from(grouped.entries()).map(([zoneName, slots]) => ({
      key: zoneName,
      title: zoneName,
      slots: slots.slice(0, 20),
    }));
  }, [activeFloorId, filteredSlots]);

  const zonesPerPage = 4;
  const totalPages = Math.ceil(zoneSections.length / zonesPerPage) || 1;
  const visibleZoneStartIndex = (currentPage - 1) * zonesPerPage;
  const visibleZoneEndIndex = Math.min(visibleZoneStartIndex + zonesPerPage, zoneSections.length);
  const visibleZones = zoneSections.slice(visibleZoneStartIndex, visibleZoneEndIndex);
  const showingZoneText = zoneSections.length > 0
    ? `${t('parkingMap.showingZone')} ${visibleZoneStartIndex + 1}-${visibleZoneEndIndex} / ${zoneSections.length}`
    : '';

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

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
        navigate('/login');
      }
      return;
    }

    setSelectedSlot(slot);
    setSlotDetail(null);
    if (slot.status === 'Available') {
      if (role === 'Registered_Driver' || role === 'Driver') {
        setIsBookingModalOpen(true);
      } else {
        setIsDetailsModalOpen(true);
      }
    } else {
      if (role !== 'Registered_Driver' && role !== 'Driver') {
        setIsDetailsModalOpen(true);
        fetchSlotDetail(slot.slotId);
      } else {
        message.info("This slot is currently occupied or reserved.");
      }
    }
  };

  const clampTimePart = (value, min, max) => {
    const numberValue = Number(value);
    if (Number.isNaN(numberValue)) return min;
    return Math.min(max, Math.max(min, numberValue));
  };

  const buildExpectedCheckInIso = () => {
    const expectedDate = new Date();
    expectedDate.setHours(expectedHour, expectedMinute, 0, 0);

    if (expectedDate <= new Date()) {
      expectedDate.setDate(expectedDate.getDate() + 1);
    }

    // Send the standard UTC ISO string. The backend treats it as UTC and computes the time diff correctly.
    return expectedDate.toISOString();
  };


  const getEstimatedDeposit = () => {
    // Lấy cấu hình giá từ loại xe đang chọn.
    // Giả định mức giá mặc định nếu chưa lấy được từ DB:
    const rates = {
      Car: { day: 20000, night: 30000 },
      Motorcycle: { day: 4000, night: 6000 },
      Bicycle: { day: 2000, night: 3000 }
    };

    const currentVehicleRates = rates[bookingVehicleType] || { day: 0, night: 0 };

    // Kiểm tra ca hẹn đến dựa trên giờ đã chọn (Expected Hour)
    const isNightShift = expectedHour >= 18 || expectedHour < 6;

    const estimatedAmount = isNightShift ? currentVehicleRates.night : currentVehicleRates.day;
    const shiftText = isNightShift ? "Ca Đêm (18:00 - 06:00)" : "Ca Ngày (06:00 - 18:00)";

    return { estimatedAmount, shiftText };
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

    // Guard: ensure user is authorized to book (roleId === 4)
    if (user && user.roleId !== undefined && Number(user.roleId) !== 4) {
      message.error("Access denied. Only registered drivers can book slots.");
      return;
    }

    setSubmitting(true);
    try {
      // 1. STRICT DATA TYPE SANITIZATION
      // Strip spaces, dashes, and special characters from the plate
      const rawPlate = bookingVehicleType === 'Bicycle' ? 'BicycleEntry' : bookingPlate;
      const cleanPlate = rawPlate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().trim();

      // Determine vehicle type ID from form selection (bookingVehicleType)
      let vehicleTypeId = 3; // Default to Car
      const cleanVehicleType = String(bookingVehicleType || '').trim().toLowerCase();
      if (cleanVehicleType === 'bicycle') {
        vehicleTypeId = 1;
      } else if (cleanVehicleType === 'motorcycle') {
        vehicleTypeId = 2;
      } else {
        vehicleTypeId = 3;
      }

      // Robust fallback mapping mechanism for typeId (if somehow selectedSlot.typeId is missing/undefined)
      let finalVehicleTypeId = Number(vehicleTypeId);
      if (!finalVehicleTypeId) {
        const fallbackTypeId = selectedSlot.typeId !== undefined && selectedSlot.typeId !== null
          ? Number(selectedSlot.typeId)
          : (String(selectedSlot.type || '').trim().toLowerCase() === 'bicycle' ? 1 : String(selectedSlot.type || '').trim().toLowerCase() === 'motorcycle' ? 2 : 3);
        finalVehicleTypeId = fallbackTypeId;
      }

      const expectedCheckInTime = buildExpectedCheckInIso();

      const response = await parkingService.bookSlot({
        slotId: selectedSlot.slotId,
        vehicleTypeId: finalVehicleTypeId,
        licenseVehicle: cleanPlate,
        expectedCheckInTime,
        paymentMethod: 'VNPAY'
      });

      const responseData = response?.data || response || {};
      const requiresPayment = Boolean(
        responseData.requiresPayment ??
        responseData.RequiresPayment ??
        responseData.requiresDeposit ??
        responseData.RequiresDeposit
      );
      const paymentUrl = responseData.paymentUrl || responseData.PaymentUrl || responseData.vnpayUrl || responseData.VnPayUrl;
      const depositAmount = responseData.depositAmount ?? responseData.DepositAmount ?? responseData.amount ?? responseData.Amount;
      const paymentStatus = responseData.paymentStatus || responseData.PaymentStatus;

      setIsBookingModalOpen(false);
      if (requiresPayment && paymentUrl) {
        const depositText = depositAmount ? ` Tiền cọc: ${Number(depositAmount).toLocaleString('vi-VN')} VND.` : '';
        setAlertBanner((responseData.message || responseData.Message || 'Cần thanh toán tiền cọc để hoàn tất đặt chỗ.') + depositText);
        window.location.href = paymentUrl;
      } else if (requiresPayment) {
        setAlertBanner(responseData.message || responseData.Message || `Đã giữ chỗ ${selectedSlot.id}. Thanh toán tiền cọc đang chờ xử lý.`);
      } else {
        setAlertBanner(responseData.message || responseData.Message || `Đặt chỗ ${selectedSlot.id} thành công!`);
      }
      if (paymentStatus) {
        console.info('Booking payment status:', paymentStatus);
      }
      setTimeout(() => {
        setAlertBanner(null);
      }, 4000);

      onFloorChange(activeFloorId);
    } catch (err) {
      console.error("Booking Error Response:", err);
      // Bắt chi tiết lỗi từ Backend
      const errMsg = err.response?.data?.message || err.response?.data?.error || err || "Đặt chỗ thất bại.";

      // Hiển thị dạng modal alert hoặc toast chuyên nghiệp
      message.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Admin/Staff manual check-in (Walk-in bypass)
  const handleAdminReserveSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSlot) return;

    // Guard: ensure JWT bearer token is fully authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      message.error("Authentication session expired. Please log in again to check in.");
      return;
    }

    // Guard: ensure user is authorized for staff check-in (Staff = 2, Admin = 1)
    if (user && user.roleId !== undefined && Number(user.roleId) !== 1 && Number(user.roleId) !== 2) {
      message.error("Access denied. Only staff or admins can perform walk-in check-ins.");
      return;
    }

    setSubmitting(true);
    try {
      // Làm sạch biển số xe
      let cleanPlate = adminPlate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().trim();

      const isBikeSlot = selectedSlot.type === 'Bicycle' || Number(selectedSlot.typeId) === 1;

      if (isBikeSlot) {
        // Xe đạp: tự sinh biển ảo nếu để trống
        if (!cleanPlate) {
          cleanPlate = `BIKE_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
        }
      } else {
        // Xe cơ giới: bắt buộc 7-9 ký tự
        if (cleanPlate.length < 7 || cleanPlate.length > 9) {
          message.warning("Biển số xe không hợp lệ. Vui lòng nhập từ 7 đến 9 ký tự chữ và số.");
          setSubmitting(false);
          return;
        }
      }

      // Robust fallback mapping mechanism for typeId (force map if undefined/null/NaN/0)
      let vehicleTypeId = selectedSlot.typeId;
      if (vehicleTypeId === undefined || vehicleTypeId === null || isNaN(Number(vehicleTypeId)) || Number(vehicleTypeId) === 0) {
        const slotType = String(selectedSlot.type || '').trim().toLowerCase();
        if (slotType === 'bicycle') {
          vehicleTypeId = 1;
        } else if (slotType === 'motorcycle') {
          vehicleTypeId = 2;
        } else {
          vehicleTypeId = 3;
        }
      }
      vehicleTypeId = Number(vehicleTypeId);

      // Gọi qua phương thức của parkingService đã được định dạng bằng FormData
      const response = await parkingService.walkInCheckIn(cleanPlate, vehicleTypeId, null);

      setIsDetailsModalOpen(false);

      const successMsg = response?.message || `Chỗ ${selectedSlot.id} hiện đã được xe ${cleanPlate} sử dụng.`;
      setAlertBanner(successMsg);

      setTimeout(() => {
        setAlertBanner(null);
      }, 4000);

      // Load lại sơ đồ bãi xe để cập nhật màu Đỏ (Occupied)
      onFloorChange(activeFloorId);
    } catch (err) {
      console.error("Walk-in Check-in Error Response:", err.response?.data || err);
      const errMsg = err.response?.data?.message || err.response?.data?.error || "Check-in thất bại. Vui lòng kiểm tra lại quyền.";
      message.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Admin/Staff check-out (Release slot and process fee)
  const handleForceCheckout = async () => {
    if (!selectedSlot) return;

    setSubmitting(true);
    try {
      const plate = slotDetail?.activeSession?.licenseVehicle || selectedSlot.occupiedBy?.plate || 'Unknown';
      const cleanPlate = plate !== 'Unknown' ? plate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : null;

      const response = await parkingService.checkOutVehicle(
        null,
        cleanPlate,
        null,
        null
      );


      setIsDetailsModalOpen(false);
      const invoiceText = response.totalAmount !== undefined
        ? ` Phí đã xử lý: ${response.totalAmount.toLocaleString('vi-VN')} đ.`
        : '';

      setAlertBanner((response.message || `Chỗ ${selectedSlot.id} đã được giải phóng thành công.`) + invoiceText);
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

  const renderSlotTile = (slot) => {
    const vehicleIcon = getSlotVehicleIcon(slot);
    const normalizedStatus = normalizeStatus(slot.status);
    const isCar = normalizeVehicleType(slot.type) === 'car';
    const slotSizeClass = isCar ? 'h-[116px] min-w-[112px]' : 'h-[88px] min-w-[82px]';
    const iconSizeClass = isCar ? 'h-14 w-16' : 'h-10 w-12';

    // Highlight user's vehicle slot
    const isUserCar = highlightSlotName &&
      slot.id.replace(/\s/g, '').toUpperCase() === highlightSlotName.replace(/\s/g, '').toUpperCase();

    const highlightClasses = isUserCar
      ? 'animate-pulse border-amber-400 ring-4 ring-amber-500/60 scale-105 z-20 bg-slate-900 shadow-2xl shadow-amber-500/40 text-amber-400 font-extrabold'
      : statusStyleMap[normalizedStatus];

    return (
      <div key={slot.id} className="relative group">
        <div
          onClick={() => handleSlotClick(slot)}
          className={`${slotSizeClass} rounded-2xl flex flex-col items-center justify-center gap-2 px-3 py-2 border-[1.5px] transition-all duration-200 cursor-pointer font-bold ${highlightClasses}`}
        >
          {isUserCar && (
            <span className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 bg-amber-500 text-slate-950 font-black text-[9px] px-2.5 py-1 rounded-full shadow-lg whitespace-nowrap animate-bounce border border-slate-900 tracking-wider z-30">
              🚗 VỊ TRÍ XE CỦA BẠN
            </span>
          )}

          <div className={`${isCar ? 'h-14' : 'h-10'} w-full flex items-center justify-center`}>
            {vehicleIcon ? (
              <img
                src={vehicleIcon}
                alt={getSlotVehicleAlt(slot)}
                className={`${iconSizeClass} object-contain`}
              />
            ) : null}
          </div>
          <span className="max-w-full truncate text-xs font-mono font-extrabold tracking-wide text-center leading-tight">
            {slot.id}
          </span>
        </div>

        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block bg-slate-900 text-white text-[9px] font-bold py-1 px-2 rounded-lg shadow-lg whitespace-nowrap z-30 pointer-events-none transition-all">
          Trạng thái: {getStatusLabel(slot.status)} ({getVehicleTypeLabel(slot.type)})
        </div>
      </div>
    );
  };

  const renderSlotGroup = (slots, key, className = '', columns = activeFloorId === 3 ? 5 : 3) => (
    <div key={key} className={`relative z-20 grid ${columns === 5 ? 'grid-cols-5' : 'grid-cols-3'} gap-3 ${columns === 5 ? 'min-w-[440px]' : 'min-w-[360px]'} ${className}`}>
      {slots.map(renderSlotTile)}
      {Array.from({ length: Math.max(0, columns - slots.length) }).map((_, index) => (
        <div key={`empty-${key}-${index}`} className={activeFloorId === 3 ? 'h-[88px] min-w-[82px]' : 'h-[116px] min-w-[112px]'} />
      ))}
    </div>
  );

  const DrivewayIntersection = ({
    className = '',
    verticalWidthClass = 'w-[76px]',
    horizontalHeightClass = 'h-14',
  }) => (
    <div className={`pointer-events-none relative z-0 overflow-hidden ${className}`}>
      <div className={`absolute left-1/2 top-0 bottom-0 -translate-x-1/2 ${verticalWidthClass} rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800`} />
      <div className={`absolute left-0 right-0 top-1/2 -translate-y-1/2 ${horizontalHeightClass} rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800`} />
      <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ${verticalWidthClass} ${horizontalHeightClass} bg-slate-100 dark:bg-slate-800`} />
      <div className="absolute left-1/2 top-5 bottom-5 -translate-x-1/2 border-l-2 border-dashed border-white" />
      <div className="absolute left-7 right-7 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-white" />
    </div>
  );

  const renderZoneSection = (section) => {
    const leftTop = section.slots.slice(0, 5);
    const rightTop = section.slots.slice(5, 10);
    const leftBottom = section.slots.slice(10, 15);
    const rightBottom = section.slots.slice(15, 20);

    const isBicycleZone = section.slots.some(s => normalizeVehicleType(s.type) === 'bicycle');

    return (
      <section key={section.key} className="rounded-2xl border border-slate-100 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900/70">
        <div className="mb-4 flex items-center gap-2">
          {activeFloorId === 3 ? (
            isBicycleZone ? <Bike size={18} className="text-indigo-600" /> : <Motorcycle size={18} className="text-indigo-600" />
          ) : (
            <Car size={18} className="text-indigo-600" />
          )}
          <h3 className="text-sm font-extrabold uppercase tracking-tight text-slate-900 dark:text-slate-100">
            {getZoneDisplayName(section.title)}
          </h3>
        </div>

        <div className={`relative grid ${activeFloorId === 3 ? 'grid-cols-[minmax(440px,1fr)_76px_minmax(440px,1fr)]' : 'grid-cols-[minmax(590px,1fr)_76px_minmax(590px,1fr)]'} grid-rows-[auto_56px_auto] items-stretch gap-4`}>
          <DrivewayIntersection className="col-start-1 col-span-3 row-start-1 row-span-3" />
          {renderSlotGroup(leftTop, `${section.key}-left-top`, 'col-start-1 row-start-1')}
          {renderSlotGroup(rightTop, `${section.key}-right-top`, 'col-start-3 row-start-1')}
          {renderSlotGroup(leftBottom, `${section.key}-left-bottom`, 'col-start-1 row-start-3')}
          {renderSlotGroup(rightBottom, `${section.key}-right-bottom`, 'col-start-3 row-start-3')}
        </div>
      </section>
    );
  };

  const renderCarZonePair = (topZone, bottomZone, pairIndex) => {
    const topLeft = topZone?.slots.slice(0, 3) || [];
    const topRight = topZone?.slots.slice(3, 6) || [];
    const bottomLeft = bottomZone?.slots.slice(0, 3) || [];
    const bottomRight = bottomZone?.slots.slice(3, 6) || [];
    const title = bottomZone ? `${topZone.title} / ${bottomZone.title}` : topZone.title;

    return (
      <section key={`${topZone.key}-${bottomZone?.key || 'single'}`} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/70">
        <div className="mb-3 flex items-center gap-2">
          <Car size={18} className="text-indigo-600" />
          <h3 className="text-sm font-extrabold uppercase tracking-tight text-slate-900 dark:text-slate-100">
            {getZoneDisplayName(title)}
          </h3>
        </div>
        <div className="relative grid grid-cols-[minmax(360px,1fr)_76px_minmax(360px,1fr)] grid-rows-[auto_56px_auto] items-stretch gap-4">
          <DrivewayIntersection className="col-start-1 col-span-3 row-start-1 row-span-3" />
          {renderSlotGroup(topLeft, `${topZone.key}-top-left`, 'col-start-1 row-start-1', 3)}
          {renderSlotGroup(topRight, `${topZone.key}-top-right`, 'col-start-3 row-start-1', 3)}
          {renderSlotGroup(bottomLeft, `${bottomZone?.key || `empty-${pairIndex}`}-bottom-left`, 'col-start-1 row-start-3', 3)}
          {renderSlotGroup(bottomRight, `${bottomZone?.key || `empty-${pairIndex}`}-bottom-right`, 'col-start-3 row-start-3', 3)}
        </div>
      </section>
    );
  };

  const renderCarFloorSection = () => (
    <section className="rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <div className="space-y-4">
        {chunkSlots(visibleZones, 2).map(([topZone, bottomZone], index) => renderCarZonePair(topZone, bottomZone, index))}
      </div>
    </section>
  );

  return (
    <div className="space-y-6 relative select-none">
      {/* Floating Success Alert Toast */}
      {alertBanner && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white font-extrabold text-xs sm:text-sm px-6 py-3.5 rounded-[14px] shadow-lg shadow-emerald-500/20 z-50 flex items-center gap-2 border border-emerald-400 animate-bounce">
          <CheckCircle size={18} className="text-white" />
          <span>{alertBanner}</span>
        </div>
      )}

      {/* 1. Sub-Header Section (Legends) */}
      <div className="space-y-3">
        {/* Title has been moved to Header.jsx */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-[14px] bg-emerald-50 border border-emerald-100 text-sm font-semibold text-slate-600 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-slate-300">
              <span className="w-2.5 h-2.5 rounded-md bg-emerald-500"></span>
              {t('parkingMap.available')} <span className="text-emerald-600 font-extrabold">{availableCount}</span>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-[14px] bg-rose-50 border border-rose-100 text-sm font-semibold text-slate-600 dark:border-rose-500/40 dark:bg-rose-500/15 dark:text-slate-300">
              <span className="w-2.5 h-2.5 rounded-md bg-rose-500"></span>
              {t('parkingMap.occupied')} <span className="text-rose-600 font-extrabold">{occupiedCount}</span>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-[14px] bg-amber-50 border border-amber-100 text-sm font-semibold text-slate-600 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-slate-300">
              <span className="w-2.5 h-2.5 rounded-md bg-amber-500"></span>
              {t('parkingMap.reserved')} <span className="text-amber-500 font-extrabold">{reservedCount}</span>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-[14px] bg-slate-100 border border-slate-200 text-sm font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <span className="w-2.5 h-2.5 rounded-md bg-slate-500"></span>
              {t('parkingMap.maintenance')} <span className="text-slate-600 font-extrabold">0</span>
            </div>
          </div>
          <div className="flex items-center px-4 py-1.5 rounded-[14px] bg-white border border-slate-200 text-sm font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            {t('parkingMap.totalSlots')} <span className="text-slate-900 font-extrabold ml-1 dark:text-slate-100">{totalCount}</span>
          </div>
        </div>
      </div>

      {/* Error / Offline Banner */}
      {errorMap && (
        <div className="bg-amber-50 border border-amber-100 text-amber-800 text-xs font-semibold p-3.5 rounded-[14px] flex items-center gap-2.5 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-300">
          <AlertTriangle size={16} className="text-amber-600 shrink-0" />
          <span>{errorMap}</span>
        </div>
      )}

      {/* 2. Main Two-Column Layout Panel */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">



        {/* Main Map Block (Full width) */}
        <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm min-h-0 w-full font-sans relative dark:border-slate-700 dark:bg-slate-900">

          {/* Top Search Bar & Controls */}
          <div className="p-4 border-b border-slate-100 bg-white flex flex-col xl:flex-row items-center justify-between gap-4 z-10 rounded-t-2xl dark:border-slate-700 dark:bg-slate-900">

            {/* Horizontal Floor Pills */}
            <div className="flex items-center gap-3 overflow-x-auto w-full xl:w-auto scrollbar-hide">
              {floors.map((f) => {
                const isSelected = activeFloorId === f.id;
                const freeCount = floorAvailableCounts[f.id] !== undefined ? floorAvailableCounts[f.id] : '...';
                return (
                  <button
                    key={f.id}
                    onClick={() => onFloorChange(f.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-[14px] border-[1.5px] text-sm transition-all duration-200 whitespace-nowrap ${isSelected
                      ? 'bg-indigo-50 border-indigo-600 text-indigo-700 font-bold shadow-sm dark:bg-indigo-500/15 dark:text-indigo-300'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-white hover:border-slate-300 font-semibold dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                      }`}
                  >
                    <span>{getFloorDisplayName(f.name)}</span>
                    <span className={`text-xs ${isSelected ? 'text-indigo-500 font-semibold dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400'}`}>
                      ({freeCount} {t('parkingMap.availableSuffix')})
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-4 w-full xl:w-auto justify-end xl:ml-auto shrink-0">
              {/* Search bar */}
              <div className="relative w-full sm:w-[240px]">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={t('parkingMap.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 bg-slate-50 border-[1.5px] border-slate-200 text-sm rounded-[14px] placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 focus:bg-white transition-all font-mono dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-800"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleZoomOut}
                  className="h-10 w-10 border-[1.5px] border-slate-200 hover:bg-slate-50 flex items-center justify-center rounded-[14px] text-slate-500 transition-all active:scale-95 bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  <Minus size={16} />
                </button>
                <span className="text-xs font-mono font-bold text-slate-600 min-w-[48px] text-center bg-slate-50 border-[1.5px] border-slate-200 py-2.5 px-3 rounded-[14px] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {zoomLevel}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className="h-10 w-10 border-[1.5px] border-slate-200 hover:bg-slate-50 flex items-center justify-center rounded-[14px] text-slate-500 transition-all active:scale-95 bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  <Plus size={16} />
                </button>
              </div>

            </div>
          </div>



          {/* Scrollable Maps Zone */}
          <div className="flex-1 overflow-auto p-4 bg-slate-50 relative dark:bg-slate-950">
            {loadingMap && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center z-10 dark:bg-slate-950/70">
                <div className="flex flex-col items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Đang tải chỗ đỗ từ cơ sở dữ liệu...</span>
                </div>
              </div>
            )}

            {filteredSlots.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[260px] text-slate-400 gap-2 dark:text-slate-500">
                <Info size={24} />
                <span className="text-sm font-medium">Không tìm thấy chỗ đỗ trên {getFloorDisplayName(activeFloor.name)}.</span>
              </div>
            ) : (
              <div
                className="transition-transform duration-200 origin-top-left"
                style={{ transform: `scale(${zoomLevel / 100})` }}
              >
                <div className="w-full min-w-0 overflow-x-auto rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                  <div className={activeFloorId === 3 ? 'min-w-[1010px]' : 'min-w-[860px]'}>
                    <div className="mb-3 flex items-center justify-between gap-4 border-b border-slate-100 pb-3 dark:border-slate-700">
                      <div className="flex items-center gap-2">
                        {activeFloorId === 3 ? (
                          <div className="flex items-center gap-1"><Motorcycle size={18} className="text-indigo-600" /><Bike size={18} className="text-indigo-600" /></div>
                        ) : <Car size={18} className="text-indigo-600" />}
                        <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-tight dark:text-slate-100">
                          {t('parkingMap.floorMap')} {getFloorDisplayName(activeFloor.name).split(' ').slice(1).join(' ')} ({getFloorDescriptionLabel(activeFloor.desc)})
                        </h3>
                      </div>
                      <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-extrabold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                        {showingZoneText}
                      </span>
                    </div>

                    {activeFloorId === 3 ? (
                      <div className="space-y-5">
                        {visibleZones.map(renderZoneSection)}
                      </div>
                    ) : (
                      renderCarFloorSection()
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Zone Navigation */}
          <div className="p-4 bg-white border-t border-slate-100 flex flex-col gap-3 rounded-b-2xl dark:border-slate-700 dark:bg-slate-900">

            {/* Zone Controls */}
            {totalPages > 1 && (
              <div className="flex w-full items-center justify-center gap-3">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="h-9 px-3 flex items-center gap-1.5 justify-center rounded-[14px] border-[1.5px] border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-95 disabled:opacity-40 transition-all dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  <ChevronLeft size={16} />
                  {t('parkingMap.prev')}
                </button>
                <span className="min-w-[160px] text-center text-xs font-extrabold text-slate-600 dark:text-slate-300">
                  {showingZoneText}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="h-9 px-3 flex items-center gap-1.5 justify-center rounded-[14px] border-[1.5px] border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-95 disabled:opacity-40 transition-all dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  {t('parkingMap.next')}
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

            <div className="w-full bg-gradient-to-br from-indigo-500 to-indigo-600 text-white font-bold text-center text-xs sm:text-sm px-4 py-3 rounded-[14px] shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 leading-relaxed">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white animate-pulse"></span>
              <span className="min-w-0 break-words">{t('parkingMap.bookingInstruction', { count: availableCount })}</span>
            </div>
          </div>

        </div>

      </div>

      {/* 3. CREATE BOOKING MODAL (Drivers Only) */}
      {isBookingModalOpen && selectedSlot && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[95vh] overflow-y-auto border border-slate-100 animate-scale-in relative font-sans dark:border-slate-700 dark:bg-slate-900">

            <button
              onClick={() => setIsBookingModalOpen(false)}
              className="absolute top-4 right-4 h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-50 flex items-center justify-center rounded-[14px] transition-all dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <X size={18} />
            </button>

            <div className="p-5 sm:p-6 space-y-4">

              <div className="space-y-1">
                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight dark:text-slate-100">Đặt chỗ đỗ xe</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Cấu hình phiên đặt chỗ trong cơ sở dữ liệu thực</p>
              </div>

              <div className="bg-indigo-50 border border-indigo-100 rounded-[14px] p-3.5 text-slate-600 text-xs font-semibold flex items-start gap-2.5 dark:border-indigo-500/40 dark:bg-indigo-500/15 dark:text-slate-300">
                <Info size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <span>Bạn đang đặt chỗ: </span>
                  <span className="font-mono font-extrabold text-indigo-600">{selectedSlot.id}</span>
                  <span> tại </span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{getFloorDisplayName(activeFloor.name)}</span>
                  <span className="text-slate-500 font-medium block mt-0.5 dark:text-slate-400">
                    Phân loại chỗ đã chọn: {getVehicleTypeLabel(selectedSlot.type)} (Mã chỗ DB: {selectedSlot.slotId || selectedSlot.dbSlotId})
                  </span>
                </div>
              </div>

              <form onSubmit={handleConfirmBookingSubmit} className="space-y-3">

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider dark:text-slate-400">Loại xe</label>
                  <select
                    value={bookingVehicleType}
                    onChange={(e) => setBookingVehicleType(e.target.value)}
                    className="w-full h-11 px-3.5 bg-slate-50 border-[1.5px] border-slate-200 text-sm rounded-[14px] focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 focus:bg-white transition-all font-medium dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-800"
                  >
                    {activeFloorId === 3 ? (
                      <>
                        <option value="Motorcycle">Xe máy</option>
                        <option value="Bicycle">Xe đạp</option>
                      </>
                    ) : (
                      <option value="Car">Ô tô</option>
                    )}
                  </select>
                </div>

                {bookingVehicleType !== 'Bicycle' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider dark:text-slate-400">Biển số xe</label>
                    <div className="relative">
                      <Car size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="e.g., 29A-12345"
                        value={bookingPlate}
                        onChange={(e) => setBookingPlate(e.target.value)}
                        className="w-full h-11 pl-10 pr-4 bg-slate-50 border-[1.5px] border-slate-200 text-sm rounded-[14px] focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 focus:bg-white transition-all uppercase font-mono font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-800"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider dark:text-slate-400">Thời gian dự kiến vào bãi</label>
                  <div className="flex items-start justify-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/60 px-3 py-3 dark:border-indigo-500/40 dark:bg-indigo-500/15">
                    <div className="flex flex-col items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        max="23"
                        value={String(expectedHour).padStart(2, '0')}
                        onChange={(e) => setExpectedHour(clampTimePart(e.target.value, 0, 23))}
                        onBlur={(e) => setExpectedHour(clampTimePart(e.target.value, 0, 23))}
                        className="h-12 w-16 rounded-[14px] border-2 border-indigo-200 bg-white text-center text-xl font-extrabold text-indigo-700 shadow-sm outline-none transition-all focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 dark:border-indigo-500/50 dark:bg-slate-800 dark:text-indigo-300"
                      />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Giờ</span>
                    </div>

                    <span className="pt-2 text-2xl font-extrabold text-indigo-500">:</span>

                    <div className="flex flex-col items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={String(expectedMinute).padStart(2, '0')}
                        onChange={(e) => setExpectedMinute(clampTimePart(e.target.value, 0, 59))}
                        onBlur={(e) => setExpectedMinute(clampTimePart(e.target.value, 0, 59))}
                        className="h-12 w-16 rounded-[14px] border-2 border-indigo-200 bg-white text-center text-xl font-extrabold text-indigo-700 shadow-sm outline-none transition-all focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 dark:border-indigo-500/50 dark:bg-slate-800 dark:text-indigo-300"
                      />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Phút</span>
                    </div>
                  </div>

                  {/* Preview Tiền cọc động */}
                  {bookingVehicleType !== 'Bicycle' && (
                    <div className="mt-2 p-2.5 bg-amber-50 border border-amber-100 rounded-[14px] flex items-center justify-between text-xs text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-300">
                      <div>
                        <span className="font-semibold block">Tiền cọc giữ chỗ ước tính:</span>
                        <span className="text-[10px] text-amber-600 font-medium dark:text-amber-300">({getEstimatedDeposit().shiftText})</span>
                      </div>
                      <span className="text-sm font-extrabold text-amber-700">
                        {getEstimatedDeposit().estimatedAmount.toLocaleString('vi-VN')} VND
                      </span>
                    </div>
                  )}

                  <p className="rounded-[14px] border border-orange-100 bg-orange-50 px-3 py-2 text-[11px] font-semibold leading-relaxed text-orange-700 dark:border-orange-500/40 dark:bg-orange-500/15 dark:text-orange-300">
                    ⚠️ Lưu ý: Lịch đặt chỗ sẽ tự động bị hủy nếu bạn không check-in tại cổng trong vòng 15 phút sau thời gian dự kiến.
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-3 font-sans">
                  <button
                    type="button"
                    onClick={() => setIsBookingModalOpen(false)}
                    className="flex-1 h-11 border-[1.5px] border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-800 font-bold rounded-[14px] transition-all text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                  >
                    Hủy
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 h-11 bg-gradient-to-br from-indigo-500 to-indigo-600 hover:-translate-y-0.5 text-white font-bold rounded-[14px] transition-all shadow-md shadow-indigo-500/20 flex items-center justify-center gap-1.5 text-sm disabled:opacity-60 disabled:hover:translate-y-0"
                  >
                    {submitting ? 'Đang xử lý...' : 'Xác nhận đặt chỗ'}
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
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-scale-in relative font-sans dark:border-slate-700 dark:bg-slate-900">

            <button
              onClick={() => setIsDetailsModalOpen(false)}
              className="absolute top-4 right-4 h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-50 flex items-center justify-center rounded-[14px] transition-all dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <X size={18} />
            </button>

            <div className="p-6 sm:p-8 space-y-6">

              <div className="space-y-1">
                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2 dark:text-slate-100">
                  {selectedSlot.type === 'Bicycle' && <Bike className="text-indigo-600" size={20} />}
                  {selectedSlot.type === 'Motorcycle' && <Motorcycle className="text-indigo-600" size={20} />}
                  {selectedSlot.type === 'Car' && <Car className="text-indigo-600" size={20} />}
                  <span>Điều khiển chỗ: {selectedSlot.id}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Bảng điều khiển vận hành cho nhân viên quản lý</p>
              </div>

              {/* General Metadata Panel */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2 text-xs dark:border-slate-700 dark:bg-slate-800/70">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-semibold dark:text-slate-400">Tầng</span>
                  <span className="font-extrabold text-slate-900 dark:text-slate-100">{getFloorDisplayName(selectedSlot.floor)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-semibold dark:text-slate-400">Phân loại</span>
                  <span className="font-extrabold text-slate-900 capitalize dark:text-slate-100">Chỗ {getVehicleTypeLabel(selectedSlot.type)}</span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500 font-semibold dark:text-slate-400">Trạng thái hiện tại</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${selectedSlot.status === 'Available'
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                    : selectedSlot.status === 'Occupied'
                      ? 'bg-rose-50 text-rose-600 border border-rose-100'
                      : 'bg-amber-50 text-amber-600 border border-amber-100'
                    }`}>
                    {getStatusLabel(selectedSlot.status)}
                  </span>
                </div>
              </div>

              {/* Conditional Actions based on current status */}

              {/* STATUS: OCCUPIED / RESERVED */}
              {(selectedSlot.status === 'Occupied' || selectedSlot.status === 'Reserved') && (
                <div className="space-y-4">
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3 dark:border-slate-700 dark:bg-slate-800/70">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider dark:text-slate-400">Trạng thái sử dụng</span>
                      <span className="font-mono text-xs text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200 font-extrabold shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">{getStatusLabel(selectedSlot.status)}</span>
                    </div>

                    {fetchingDetail ? (
                      <div className="flex items-center justify-center py-4 gap-2">
                        <div className="w-5 h-5 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin"></div>
                        <span className="text-xs text-slate-500 font-medium dark:text-slate-400">Đang tải chi tiết từ cơ sở dữ liệu...</span>
                      </div>
                    ) : slotDetail?.activeSession ? (
                      <div className="space-y-2.5 pt-1 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-medium dark:text-slate-400">Biển số xe:</span>
                          <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100 text-sm dark:border-indigo-500/40 dark:bg-indigo-500/15 dark:text-indigo-300">{slotDetail.activeSession.licenseVehicle}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-medium dark:text-slate-400">Loại xe:</span>
                          <span className="font-semibold text-slate-700 capitalize dark:text-slate-300">{getVehicleTypeLabel(slotDetail.activeSession.vehicleTypeName)}</span>
                        </div>
                        {slotDetail.activeSession.checkInTime && (
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500 font-medium dark:text-slate-400">Thời gian vào thực tế:</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{new Date(slotDetail.activeSession.checkInTime).toLocaleString('vi-VN')}</span>
                          </div>
                        )}
                        {slotDetail.activeSession.bookingTime && (
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500 font-medium dark:text-slate-400">Thời gian đặt trước:</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{new Date(slotDetail.activeSession.bookingTime).toLocaleString('vi-VN')}</span>
                          </div>
                        )}
                        {slotDetail.activeSession.customer && (
                          <div className="pt-2 border-t border-dashed border-slate-200 space-y-2 dark:border-slate-700">
                            <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Hồ sơ khách hàng</div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500 font-medium dark:text-slate-400">Họ tên:</span>
                              <span className="font-bold text-slate-900 dark:text-slate-100">{slotDetail.activeSession.customer.username}</span>
                            </div>
                            {slotDetail.activeSession.customer.email && (
                              <div className="flex justify-between items-center">
                                <span className="text-slate-500 font-medium dark:text-slate-400">Email:</span>
                                <span className="font-semibold text-slate-700 dark:text-slate-300">{slotDetail.activeSession.customer.email}</span>
                              </div>
                            )}
                            {slotDetail.activeSession.customer.phoneNumber && (
                              <div className="flex justify-between items-center">
                                <span className="text-slate-500 font-medium dark:text-slate-400">Số điện thoại:</span>
                                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{slotDetail.activeSession.customer.phoneNumber}</span>
                              </div>
                            )}
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500 font-medium dark:text-slate-400">Hạng thành viên:</span>
                              <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-300">{slotDetail.activeSession.customer.customerType || "Registered Driver"}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center text-slate-400 py-3 text-xs font-medium dark:text-slate-500">
                        Chưa lấy được thông tin người sử dụng chỗ.
                      </div>
                    )}
                  </div>


                  {(role === 'Admin' || role === 'Staff') && (
                    <button
                      onClick={handleForceCheckout}
                      disabled={submitting}
                      className="w-full h-11 bg-gradient-to-br from-rose-500 to-rose-600 hover:-translate-y-0.5 text-white font-bold rounded-[14px] flex items-center justify-center gap-2 shadow-md shadow-rose-500/20 text-sm transition-all disabled:opacity-60 disabled:hover:translate-y-0"
                    >
                      <UserCheck size={16} />
                      {submitting ? 'Đang giải phóng...' : 'Cho xe ra & giải phóng chỗ'}
                    </button>
                  )}
                </div>
              )}

              {/* STATUS: AVAILABLE */}
              {selectedSlot.status === 'Available' && (
                <div className="space-y-4">
                  <form onSubmit={handleAdminReserveSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider dark:text-slate-400">
                        {selectedSlot.type === 'Bicycle'
                          ? 'Biển số xe đạp (Không bắt buộc)'
                          : 'Nhập biển số xe vãng lai'}
                      </label>
                      <input
                        type="text"
                        required={selectedSlot.type !== 'Bicycle'}
                        placeholder={selectedSlot.type === 'Bicycle'
                          ? 'Để trống → Tự tạo biển số ảo BIKE_XXXXXXXX'
                          : 'e.g. 29A-888.88'}
                        value={adminPlate}
                        onChange={(e) => setAdminPlate(e.target.value)}
                        className="w-full h-11 px-3.5 bg-slate-50 border-[1.5px] border-slate-200 text-sm rounded-[14px] focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 focus:bg-white transition-all uppercase font-mono font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-800"
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="flex-1 h-11 bg-gradient-to-br from-indigo-500 to-indigo-600 hover:-translate-y-0.5 text-white font-bold rounded-[14px] transition-all shadow-md shadow-indigo-500/20 text-sm disabled:opacity-60 disabled:hover:translate-y-0"
                      >
                        {submitting ? 'Đang xử lý...' : 'Cho xe vào'}
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
