import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { parkingService } from '../services/parkingService';

import { 
  MapPin, 
  Calendar as CalendarIcon, 
  Clock, 
  AlertCircle, 
  QrCode, 
  X, 
  Info, 
  CheckCircle, 
  XCircle,
  Ticket,
  CreditCard
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MyBookings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();

  // Active filter tab: 'All' | 'Active' | 'Expired'
  const [activeTab, setActiveTab] = useState('All');
  
  // Loading and Error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Ticking count state
  const [tick, setTick] = useState(0);

  // Dynamic state for bookings data
  const [bookings, setBookings] = useState(() => {
    const saved = localStorage.getItem('spotflow_driver_bookings');
    return saved ? JSON.parse(saved) : [];
  });

  // Dynamic state for statistics dashboard
  const [stats, setStats] = useState({
    totalBookings: 0,
    activeBookings: 0,
    completedBookings: 0,
    canceledBookings: 0,
    totalAmountSpent: 0
  });

  // Modal display states
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [targetBookingId, setTargetBookingId] = useState(null);
  const [targetBooking, setTargetBooking] = useState(null);
  const [payingSessionId, setPayingSessionId] = useState(null);

  const handlePayVNPay = async (booking) => {
    setPayingSessionId(booking.id);
    try {
      const response = await api.post('/Payments/vnpay/create', {
        sessionId: parseInt(booking.id),
        ipAddress: "127.0.0.1"
      });
      if (response.data && response.data.success && response.data.paymentUrl) {
        // Redirect to VNPay payment URL
        window.location.href = response.data.paymentUrl;
      } else {
        alert(response.data?.message || t('myBookings.errVNPayCreate'));
      }
    } catch (err) {
      console.error("VNPay payment creation error:", err);
      let errorMsg = t('myBookings.errTxFailed');
      if (err.response?.data) {
        const data = err.response.data;
        if (data.message) {
          errorMsg = data.message;
        } else if (data.error) {
          errorMsg = data.error;
        } else if (data.errors) {
          const validationErrors = Object.entries(data.errors)
            .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
            .join('\n');
          if (validationErrors) {
            errorMsg = `${t('myBookings.errSys')}${validationErrors}`;
          }
        }
      }
      alert(errorMsg);
    } finally {
      setPayingSessionId(null);
    }
  };

  // Helper to check if a session is active
  const isActiveSession = (status) => {
    const s = String(status || '').trim().toLowerCase();
    return s === 'reserved' || s === 'occupied' || s === 'inprogress' || s === 'active';
  };

  // Fetch bookings function
  const fetchMyBookings = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError(t('myBookings.errNoToken'));
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      // Add cache-buster to prevent browser/Cloudflare from returning stale 'Reserved' data
      const timestamp = new Date().getTime();
      const response = await api.get(`/Parking/my-bookings?t=${timestamp}`, config);
      
      // Map properties from .NET DTO response
      const dashboard = response.data || {};
      const data = dashboard.bookingsList || [];

      // Update statistics state
      setStats({
        totalBookings: dashboard.totalBookings || 0,
        activeBookings: dashboard.activeBookings || 0,
        completedBookings: dashboard.completedBookings || 0,
        canceledBookings: dashboard.canceledBookings || 0,
        totalAmountSpent: dashboard.totalAmountSpent || 0
      });
      
      const mapped = data.map((item, idx) => {
        let vehicleType = 'Car';
        if (item.typeId === 1) vehicleType = 'Bicycle';
        else if (item.typeId === 2) vehicleType = 'Motorcycle';

        // Parse bookedDate/bookedTime from bookingTime and deadline from expectedCheckInTime when available.
        let bookedDate = 'N/A';
        let bookedTime = 'N/A';
        let deadlineTime = 'N/A';
        const expectedCheckInTime = item.expectedCheckInTime || item.ExpectedCheckInTime;
        const deadlineBaseTime = expectedCheckInTime || item.bookingTime;

        if (item.bookingTime) {
          // BE sends UTC time. Ensure we append 'Z' if missing so JS parses it as UTC, converting to local VN time.
          const raw = String(item.bookingTime);
          const d = new Date(raw.endsWith('Z') ? raw : raw + 'Z');
          if (!isNaN(d.getTime())) {
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            bookedDate = `${day}/${month}/${year}`;

            const hours = String(d.getHours()).padStart(2, '0');
            const mins = String(d.getMinutes()).padStart(2, '0');
            bookedTime = `${hours}:${mins}`;

          }
        }

        if (deadlineBaseTime) {
          const rawBase = String(deadlineBaseTime);
          const base = new Date(rawBase.endsWith('Z') ? rawBase : rawBase + 'Z');
          if (!isNaN(base.getTime())) {
            const deadline = new Date(base.getTime() + 15 * 60 * 1000);
            const dlHours = String(deadline.getHours()).padStart(2, '0');
            const dlMins = String(deadline.getMinutes()).padStart(2, '0');
            deadlineTime = `${dlHours}:${dlMins}`;
          }
        }

        return {
          id: item.sessionId || item.SessionId || idx + 1,
          ticketId: item.ticketCode || item.TicketCode || item.ticket?.ticketCode || item.Ticket?.TicketCode || `TKT-${item.sessionId || item.SessionId || idx + 1}`,
          vehicleType: vehicleType,
          status: isActiveSession(item.sessionStatus || item.SessionStatus) ? 'Active' : 'Cancelled / Expired',
          sessionStatus: item.sessionStatus || item.SessionStatus || 'Expired',
          location: `${item.floorName || item.FloorName || item.slot?.floor?.floorName || 'Floor'} - ${item.slotName || item.SlotName || item.slot?.slotName || 'Slot'}`,
          bookedDate: bookedDate,
          bookedTime: bookedTime,
          deadlineTime: deadlineTime,
          contact: item.licenseVehicle || item.LicenseVehicle || 'N/A',
          rawBookingTime: item.bookingTime || item.BookingTime,
          checkInTime: item.checkInTime || item.CheckInTime,
          checkOutTime: item.checkOutTime || item.CheckOutTime,
          totalAmount: item.totalAmount || item.TotalAmount,
          paymentStatus: item.paymentStatus || item.PaymentStatus,
          paymentMethod: item.paymentMethod || item.PaymentMethod,
          expectedCheckInTime,
          depositAmount: item.depositAmount ?? item.DepositAmount,
          requiresDeposit: item.requiresDeposit ?? item.RequiresDeposit,
          rawDeadlineBaseTime: deadlineBaseTime
        };
      });

      setBookings(mapped);
      localStorage.setItem('spotflow_driver_bookings', JSON.stringify(mapped));
    } catch (err) {
      console.error("Fetch bookings error:", err.response?.data || err);
      setError(t('myBookings.errLoadRes'));
    } finally {
      setLoading(false);
    }
  };

  // Sync state changes with localStorage
  useEffect(() => {
    localStorage.setItem('spotflow_driver_bookings', JSON.stringify(bookings));
  }, [bookings]);

  // Fetch bookings on mount
  useEffect(() => {
    fetchMyBookings();
  }, []);

  // Tick-timer countdown interval
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Compute remaining minutes label dynamically based on expected check-in time when available.
  const getRemainingMinutesText = (deadlineBaseTime) => {
    if (!deadlineBaseTime) return '0m remaining';
    const now = new Date();
    const baseTime = new Date(deadlineBaseTime);
    if (isNaN(baseTime.getTime())) return '0m remaining';
    
    // 15 minutes limit
    const target = new Date(baseTime.getTime() + 15 * 60 * 1000);
    const diffSeconds = Math.floor((target - now) / 1000);
    if (diffSeconds <= 0) return '0m remaining';
    
    const minutes = Math.ceil(diffSeconds / 60);
    return `${minutes}m remaining`;
  };

  const normalizePaymentStatus = (status) => String(status || '').trim().toLowerCase();
  const isPaymentCompleted = (status) => ['success', 'paid', 'completed'].includes(normalizePaymentStatus(status));
  const isDepositPaymentDue = (booking) => (
    booking.sessionStatus === 'Reserved' &&
    String(booking.paymentMethod || '').toUpperCase() === 'VNPAY' &&
    normalizePaymentStatus(booking.paymentStatus) === 'pending'
  );
  const isParkingFeePaymentDue = (booking) => (
    (booking.sessionStatus === 'InProgress' || booking.sessionStatus === 'Occupied') &&
    !isPaymentCompleted(booking.paymentStatus)
  );
  const getVnPayPaymentLabel = (booking) => (
    isDepositPaymentDue(booking)
      ? t('myBookings.payDepositVNPay')
      : t('myBookings.payFeeVNPay')
  );

  // Metrics summary counts
  const totalBookings = stats.totalBookings || bookings.length;
  const activeCount = stats.activeBookings || bookings.filter(b => isActiveSession(b.sessionStatus)).length;
  const expiredCount = (stats.completedBookings + stats.canceledBookings) || bookings.filter(b => !isActiveSession(b.sessionStatus)).length;
  const totalSpent = stats.totalAmountSpent || 0;

  // QR Code URL configuration from Design/TicketModal.tsx logic
  const qrPayload = targetBooking ? encodeURIComponent(
    `SLOT:${targetBooking.location.split(' - ')[1] || targetBooking.location}|PLATE:${targetBooking.contact}|ID:${targetBooking.id}|TICKET:${targetBooking.ticketId}`
  ) : '';
  const qrUrl = targetBooking ? `https://api.qrserver.com/v1/create-qr-code/?size=160x160&ecc=M&data=${qrPayload}` : '';

  // Filter list items based on active tab selection
  const filteredBookings = bookings.filter(b => {
    if (activeTab === 'Active') return isActiveSession(b.sessionStatus);
    if (activeTab === 'Expired') return !isActiveSession(b.sessionStatus);
    return true;
  });

  // Trigger booking cancel popup
  const handleCancelClick = (id) => {
    setTargetBookingId(id);
    setIsCancelConfirmOpen(true);
  };

  // Confirm booking cancellation via Backend API
  const handleConfirmCancel = async () => {
    if (targetBookingId !== null) {
      setLoading(true);
      setError('');
      setSuccessMessage('');
      try {
        // 1. Gọi API hủy đặt chỗ lên Backend
        const response = await parkingService.cancelBooking(targetBookingId);
        
        // 2. Đóng Modal xác nhận hủy
        setIsCancelConfirmOpen(false);
        setSuccessMessage(response.message || t('myBookings.cancelSuccess'));

        // 3. OPTIMISTIC UI UPDATE: Cập nhật state trực tiếp để UI phản hồi ngay lập tức
        setBookings(prevBookings => prevBookings.map(booking => {
          if (booking.id === targetBookingId) {
            return {
              ...booking,
              sessionStatus: 'Canceled',
              status: 'Cancelled / Expired'
            };
          }
          return booking;
        }));
        setTargetBookingId(null);

        // 4. Gọi fetchMyBookings ngầm để đồng bộ dữ liệu chính xác (hóa đơn, trạng thái)
        await fetchMyBookings();
        
        // Tự động ẩn thông báo sau 5 giây
        setTimeout(() => setSuccessMessage(''), 5000);
      } catch (err) {
        console.error("Cancel booking error:", err);
        const errorMessage = typeof err === 'string' ? err : t('myBookings.cancelFailed');
        setError(errorMessage);
        setIsCancelConfirmOpen(false);
        setTargetBookingId(null);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="space-y-8 font-sans select-none pb-12">
      


      {/* 2. OVERVIEW STATISTICS ROW (4 Balanced Glassmorphism cards) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Total Bookings Card */}
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between relative overflow-hidden transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 rounded-full bg-blue-500/10 blur-2xl"></div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">{t('myBookings.totalBookings')}</span>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-400 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Ticket size={18} />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black text-slate-800 tracking-tight">{totalBookings}</span>
          </div>
        </div>

        {/* Active Card */}
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between relative overflow-hidden transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 rounded-full bg-emerald-500/10 blur-2xl"></div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">{t('myBookings.active')}</span>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <CheckCircle size={18} />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black text-slate-800 tracking-tight">{activeCount}</span>
            <span className="text-sm text-slate-400 font-bold mb-1">{t('myBookings.sessions')}</span>
          </div>
        </div>

        {/* Expired Card */}
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between relative overflow-hidden transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 rounded-full bg-slate-500/10 blur-2xl"></div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">{t('myBookings.expired')}</span>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-slate-400 to-slate-300 text-white flex items-center justify-center shadow-lg shadow-slate-400/20">
              <XCircle size={18} />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black text-slate-800 tracking-tight">{expiredCount}</span>
          </div>
        </div>

        {/* Total Spent Card */}
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between relative overflow-hidden transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 rounded-full bg-indigo-500/10 blur-2xl"></div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">{t('myBookings.totalSpent')}</span>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <CreditCard size={18} />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-2xl xl:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500 tracking-tight">
              {totalSpent.toLocaleString('vi-VN')}
            </span>
            <span className="text-xs text-slate-400 font-bold mb-1.5">VND</span>
          </div>
        </div>

      </div>

      {/* 3. STATUS FILTER TABS (Segmented Control Design) */}
      <div className="inline-flex items-center bg-slate-100/80 backdrop-blur-xl p-1 rounded-xl shadow-inner border border-slate-200/50">
        <button
          onClick={() => setActiveTab('All')}
          className={`px-6 py-2 text-sm font-bold rounded-lg transition-all duration-300 ${
            activeTab === 'All'
              ? 'bg-white text-indigo-600 shadow-[0_2px_8px_rgb(0,0,0,0.08)]'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {t('myBookings.all')}
        </button>
        <button
          onClick={() => setActiveTab('Active')}
          className={`px-6 py-2 text-sm font-bold rounded-lg transition-all duration-300 ${
            activeTab === 'Active'
              ? 'bg-white text-indigo-600 shadow-[0_2px_8px_rgb(0,0,0,0.08)]'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {t('myBookings.active')}
        </button>
        <button
          onClick={() => setActiveTab('Expired')}
          className={`px-6 py-2 text-sm font-bold rounded-lg transition-all duration-300 ${
            activeTab === 'Expired'
              ? 'bg-white text-indigo-600 shadow-[0_2px_8px_rgb(0,0,0,0.08)]'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {t('myBookings.expired')}
        </button>
      </div>

      {/* 4. BOOKING TICKET CONTAINER */}
      <div className="space-y-4">
        {/* Error Banner */}
        {error && (
          <div className="bg-rose-50/80 backdrop-blur-md border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl flex items-start gap-3 mb-4 shadow-sm animate-fade-in">
            <AlertCircle className="shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <h4 className="font-bold text-sm">{t('myBookings.actionFailed')}</h4>
              <p className="text-sm text-rose-600 mt-0.5">{error}</p>
            </div>
            <button onClick={() => setError('')} className="p-1 hover:bg-rose-100 rounded-lg transition-colors">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Success Banner */}
        {successMessage && (
          <div className="bg-emerald-50/80 backdrop-blur-md border border-emerald-200 text-emerald-700 px-4 py-3 rounded-2xl flex items-start gap-3 mb-4 shadow-sm animate-fade-in">
            <CheckCircle className="shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <h4 className="font-bold text-sm">{t('myBookings.actionSuccess')}</h4>
              <p className="text-sm text-emerald-600 mt-0.5">{successMessage}</p>
            </div>
            <button onClick={() => setSuccessMessage('')} className="p-1 hover:bg-emerald-100 rounded-lg transition-colors">
              <X size={16} />
            </button>
          </div>
        )}

        {/* List of Bookings */}
        {loading && bookings.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-md border border-white rounded-3xl py-20 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="w-10 h-10 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin mx-auto mb-4"></div>
            <h3 className="text-slate-700 font-bold text-base">{t('myBookings.loadingRes')}</h3>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-md border border-white rounded-3xl py-20 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col items-center">
            <div className="w-20 h-20 bg-slate-50 border border-slate-100 text-slate-300 rounded-full flex items-center justify-center mb-5 shadow-inner">
              <QrCode size={40} />
            </div>
            <h3 className="text-slate-800 font-extrabold text-lg mb-2">{t('myBookings.noBookings')}</h3>
            <p className="text-sm text-slate-500 max-w-sm">
              {t('myBookings.noBookingsDesc')}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking, index) => (
              <div 
                key={booking.id}
                className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white shadow-[0_4px_20px_rgb(0,0,0,0.03)] p-5 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-shadow"
              >
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                  
                  {/* Left: ID & Main Info */}
                  <div className="flex items-center gap-4 w-full lg:w-[320px] shrink-0">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex flex-col items-center justify-center shrink-0 shadow-inner">
                      <span className="text-[10px] font-bold text-indigo-400">ID</span>
                      <span className="text-sm font-black text-indigo-700">{index + 1}</span>
                    </div>
                    
                    <div>
                      <div className="flex items-center flex-wrap gap-2 mb-1">
                        <span className="font-extrabold text-slate-800 text-base">{booking.location}</span>
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-slate-100 text-slate-600">
                          {booking.vehicleType}
                        </span>
                        <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md ${
                          isActiveSession(booking.sessionStatus)
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {booking.sessionStatus || booking.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                        <span className="flex items-center gap-1"><Ticket size={12} className="text-slate-400"/> {booking.ticketId}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300 hidden sm:block"></span>
                        <span className="flex items-center gap-1"><CalendarIcon size={12} className="text-slate-400"/> {booking.bookedDate} {booking.bookedTime}</span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Status Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 flex-1 w-full bg-slate-50/50 p-3 lg:p-0 rounded-xl lg:bg-transparent lg:px-8 border-x border-transparent lg:border-slate-100/50">
                    
                    {/* Time Metric */}
                    <div className="flex flex-col items-start">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        {booking.sessionStatus === 'Reserved' ? t('myBookings.deadline') : t('myBookings.activity')}
                      </span>
                      {booking.sessionStatus === 'Reserved' ? (
                        <div className="flex flex-col items-start gap-1">
                          <span className="text-sm font-bold text-slate-700 block leading-none">{booking.deadlineTime}</span>
                          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-orange-100 text-orange-600 animate-pulse inline-block">
                            {getRemainingMinutesText(booking.rawDeadlineBaseTime)}
                          </span>
                        </div>
                      ) : (
                        <div className="text-xs font-semibold text-slate-600 space-y-0.5">
                          <div className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            In: {booking.checkInTime ? new Date(booking.checkInTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'}) : 'N/A'}
                          </div>
                          {booking.checkOutTime && (
                            <div className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                              Out: {new Date(booking.checkOutTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Financial Metric */}
                    <div className="flex flex-col items-start">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{t('myBookings.billing')}</span>
                      {booking.totalAmount !== null && booking.totalAmount !== undefined ? (
                        <div>
                          <span className="text-sm font-black text-indigo-700 block">
                            {booking.totalAmount.toLocaleString('vi-VN')} đ
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 uppercase">
                            {booking.paymentMethod || 'CASH'} - {booking.paymentStatus || 'PENDING'}
                          </span>
                        </div>
                      ) : booking.depositAmount !== null && booking.depositAmount !== undefined ? (
                        <div>
                          <span className="text-sm font-black text-amber-600 block">
                            {Number(booking.depositAmount).toLocaleString('vi-VN')} đ
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 uppercase">
                            DEP - {booking.paymentStatus || 'PENDING'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-slate-400">{t('myBookings.noInvoice')}</span>
                      )}
                    </div>
                    
                    {/* Plate Metric */}
                    <div className="flex flex-col items-start hidden sm:flex">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{t('myBookings.plate')}</span>
                      <span className="text-sm font-bold text-slate-700 bg-slate-200/50 px-2 py-0.5 rounded-md border border-slate-200">
                        {booking.contact}
                      </span>
                    </div>

                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-wrap items-center lg:justify-end gap-2 w-full lg:w-[220px] shrink-0 mt-2 lg:mt-0">
                    <button 
                      onClick={() => {
                        setTargetBooking(booking);
                        setIsQrOpen(true);
                      }}
                      className="flex-1 lg:flex-none h-10 px-4 bg-white border border-slate-200 text-slate-700 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
                    >
                      <QrCode size={14} /> {t('myBookings.viewQR')}
                    </button>

                    {booking.sessionStatus === 'Reserved' && (
                      <button 
                         onClick={() => handleCancelClick(booking.id)}
                         className="flex-1 lg:flex-none h-10 px-4 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
                      >
                        <X size={14} /> {t('myBookings.cancel')}
                      </button>
                    )}

                    {(isDepositPaymentDue(booking) || isParkingFeePaymentDue(booking)) && (
                      <button 
                         disabled={payingSessionId === booking.id}
                         onClick={() => handlePayVNPay(booking)}
                         className="flex-1 lg:flex-none w-full sm:w-auto h-10 px-5 bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-500 hover:to-blue-400 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {payingSessionId === booking.id ? (
                          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                          <CreditCard size={14} />
                        )}
                        {t('myBookings.payNow')}
                      </button>
                    )}
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. DYNAMIC CUSTOM REACTION CONFIRMATION MODAL OVERLAY */}
      {isCancelConfirmOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-[0_20px_60px_rgb(0,0,0,0.1)] max-w-sm w-full p-6 border border-white animate-scale-in relative">
            <button 
              onClick={() => setIsCancelConfirmOpen(false)}
              className="absolute top-4 right-4 h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center rounded-xl transition-all"
            >
              <X size={18} />
            </button>

            <div className="space-y-5 pt-2 text-center">
              <div className="w-14 h-14 bg-rose-50 border border-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <AlertCircle size={28} />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-extrabold text-slate-800">{t('myBookings.cancelTitle')}</h3>
                <p className="text-xs text-slate-500 leading-relaxed px-2">
                  {t('myBookings.cancelDesc')}
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setIsCancelConfirmOpen(false)}
                  className="flex-1 h-11 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl text-sm transition-all"
                >
                  {t('myBookings.btnNoKeep')}
                </button>
                <button
                  onClick={handleConfirmCancel}
                  className="flex-1 h-11 bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-rose-500/20 active:scale-[0.98]"
                >
                  {t('myBookings.btnYesCancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. DYNAMIC QR DISPLAY MODAL OVERLAY */}
      {isQrOpen && targetBooking && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-[0_20px_60px_rgb(0,0,0,0.1)] max-w-sm w-full p-6 border border-white animate-scale-in relative text-center">
            <button 
              onClick={() => {
                setIsQrOpen(false);
                setTargetBooking(null);
              }}
              className="absolute top-4 right-4 h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center rounded-xl transition-all"
            >
              <X size={18} />
            </button>

            <div className="space-y-5 pt-2">
              <div className="space-y-1.5">
                <h3 className="text-lg font-extrabold text-slate-800">{t('myBookings.ticketTitle')}</h3>
                <p className="text-xs text-slate-500">{t('myBookings.ticketDesc')}</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl inline-block shadow-inner">
                {/* Real thermal QR block */}
                <div className="w-40 h-40 bg-white border border-slate-200 rounded-xl p-2 mx-auto flex items-center justify-center shadow-sm">
                  <img
                    src={qrUrl}
                    alt={`QR Code for Ticket ${targetBooking.ticketId}`}
                    className="w-full h-full rounded-md object-contain"
                  />
                </div>
              </div>

              <div className="bg-indigo-50 border border-indigo-100 rounded-xl py-2 px-4 inline-block mx-auto">
                <div className="text-xs font-mono font-black text-indigo-700 tracking-widest uppercase">
                  ID: {targetBooking.ticketId}
                </div>
              </div>

              <button
                onClick={() => {
                  setIsQrOpen(false);
                  setTargetBooking(null);
                }}
                className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-slate-900/20 active:scale-[0.98]"
              >
                {t('myBookings.closeTicket')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MyBookings;
