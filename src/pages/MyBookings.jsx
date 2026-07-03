import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
  CreditCard,
  Wallet
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast as message } from '../components/ToastProvider';
import CreateIncidentModal from '../features/checkin-checkout/CreateIncidentModal';
import { formatVietnamDate, formatVietnamTime } from '../utils/dateTime';

const MyBookings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();

  // Active filter tab: 'All' | 'Active' | 'Expired'
  const [activeTab, setActiveTab] = useState('All');

  // Loading and Error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportSessionId, setReportSessionId] = useState(null);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [targetBookingId, setTargetBookingId] = useState(null);
  const [targetBooking, setTargetBooking] = useState(null);
  const [payingSessionId, setPayingSessionId] = useState(null);
  const [isIncidentOpen, setIsIncidentOpen] = useState(false);
  const [selectedLicenseVehicleForIncident, setSelectedLicenseVehicleForIncident] = useState('');

  const handlePayVNPay = async (booking) => {
    setPayingSessionId(booking.id);
    try {
      const response = await parkingService.createVnPayPayment(booking.id);
      if (response && response.success && response.paymentUrl) {
        const invoiceId = response.invoiceId || response.InvoiceId || response.data?.invoiceId || response.data?.InvoiceId;
        if (invoiceId) localStorage.setItem('pending_invoice_id', String(invoiceId));
        window.location.href = response.paymentUrl;
      } else {
        message.error(response?.message || t('myBookings.errVNPayCreate'));
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
      message.error(errorMsg);
    } finally {
      setPayingSessionId(null);
    }
  };

  const handlePayWallet = async (booking) => {
    if (!booking.invoiceId) {
      message.error('Khong tim thay hoa don dang cho thanh toan.');
      return;
    }

    setPayingSessionId(booking.id);
    try {
      const response = await parkingService.payPendingInvoiceWallet(booking.invoiceId);
      message.success(response?.message || 'Thanh toan tien coc bang vi thanh cong.');
      await fetchMyBookings();
      navigate(`/payment-success?type=booking&invoiceId=${booking.invoiceId}`);
    } catch (err) {
      const errorMessage = typeof err === 'string' ? err : err?.message || 'Thanh toan bang vi that bai.';
      message.error(errorMessage);
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
      // Map properties from .NET DTO response
      const dashboard = await parkingService.getMyBookings();
      const data = Array.isArray(dashboard)
        ? dashboard
        : dashboard?.bookingsList || dashboard?.data?.bookingsList || dashboard?.data || [];

      // Update statistics state
      setStats({
        totalBookings: dashboard?.totalBookings || dashboard?.data?.totalBookings || 0,
        activeBookings: dashboard?.activeBookings || dashboard?.data?.activeBookings || 0,
        completedBookings: dashboard?.completedBookings || dashboard?.data?.completedBookings || 0,
        canceledBookings: dashboard?.canceledBookings || dashboard?.data?.canceledBookings || 0,
        totalAmountSpent: dashboard?.totalAmountSpent || dashboard?.data?.totalAmountSpent || 0
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
          const bookingDate = raw.endsWith('Z') ? raw : raw + 'Z';
          bookedDate = formatVietnamDate(bookingDate);
          bookedTime = formatVietnamTime(bookingDate);
        }

        if (deadlineBaseTime) {
          const rawBase = String(deadlineBaseTime);
          const base = new Date(rawBase.endsWith('Z') ? rawBase : rawBase + 'Z');
          if (!isNaN(base.getTime())) {
            const deadline = new Date(base.getTime() + 15 * 60 * 1000);
            deadlineTime = formatVietnamTime(deadline);
          }
        }

        const normalizedTicketCode = String(item.ticketCode || item.TicketCode || '').toUpperCase();
        const isMembership = normalizedTicketCode.startsWith('MBC_') || normalizedTicketCode.startsWith('MCR_') || normalizedTicketCode.startsWith('MC_');
        const ticketType = isMembership ? 'Membership' : 'Booking';

        return {
          id: item.sessionId || item.SessionId || idx + 1,
          ticketId: item.ticketCode || item.TicketCode || item.ticket?.ticketCode || item.Ticket?.TicketCode || `TKT-${item.sessionId || item.SessionId || idx + 1}`,
          ticketType: ticketType, // <--- Trường phân loại mới
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
          invoiceId: item.invoiceId || item.InvoiceId || item.invoice?.invoiceId || item.Invoice?.InvoiceId,
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
  const isPaymentCompleted = (status) => ['success', 'paid', 'completed', 'deposited'].includes(normalizePaymentStatus(status));
  const isDepositPaymentDue = (booking) => (
    booking.sessionStatus === 'Reserved' &&
    String(booking.paymentMethod || '').toUpperCase() === 'VNPAY' &&
    normalizePaymentStatus(booking.paymentStatus) === 'pending'
  );
  const canPayPendingInvoiceWithWallet = (booking) => isDepositPaymentDue(booking) && Boolean(booking.invoiceId);
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
      try {
        // 1. Gọi API hủy đặt chỗ lên Backend
        const response = await parkingService.cancelBooking(targetBookingId);

        // 2. Đóng Modal xác nhận hủy
        setIsCancelConfirmOpen(false);
        message.success(response.message || t('myBookings.cancelSuccess'));

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
      } catch (err) {
        console.error("Cancel booking error:", err);
        const errorMessage = typeof err === 'string' ? err : t('myBookings.cancelFailed');
        setError(errorMessage);
        message.error(errorMessage);
        setIsCancelConfirmOpen(false);
        setTargetBookingId(null);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="space-y-8 font-sans select-none pb-12">

      {/* 2. OVERVIEW STATISTICS ROW (4 cards) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

        {/* Total Bookings Card */}
        <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{t('myBookings.totalBookings')}</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-indigo-100 bg-indigo-50 text-indigo-600 dark:border-indigo-500/40 dark:bg-indigo-500/15 dark:text-indigo-300">
              <Ticket size={18} />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">{totalBookings}</span>
          </div>
        </div>

        {/* Active Card */}
        <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{t('myBookings.active')}</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-600 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-300">
              <CheckCircle size={18} />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">{activeCount}</span>
            <span className="text-sm text-slate-400 font-bold mb-1">{t('myBookings.sessions')}</span>
          </div>
        </div>

        {/* Expired Card */}
        <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{t('myBookings.expired')}</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
              <XCircle size={18} />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">{expiredCount}</span>
          </div>
        </div>

        {/* Total Spent Card */}
        <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{t('myBookings.totalSpent')}</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-indigo-100 bg-indigo-50 text-indigo-600 dark:border-indigo-500/40 dark:bg-indigo-500/15 dark:text-indigo-300">
              <CreditCard size={18} />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-2xl xl:text-3xl font-extrabold text-indigo-600 tracking-tight">
              {totalSpent.toLocaleString('vi-VN')}
            </span>
            <span className="text-xs text-slate-400 font-bold mb-1.5">VND</span>
          </div>
        </div>

      </div>

      {/* 3. STATUS FILTER TABS (Segmented Control Design) */}
      <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800">
        <button
          onClick={() => setActiveTab('All')}
          className={`px-6 py-2 text-sm font-bold rounded-lg transition-all duration-300 ${
            activeTab === 'All'
              ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-300'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          {t('myBookings.all')}
        </button>
        <button
          onClick={() => setActiveTab('Active')}
          className={`px-6 py-2 text-sm font-bold rounded-lg transition-all duration-300 ${
            activeTab === 'Active'
              ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-300'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          {t('myBookings.active')}
        </button>
        <button
          onClick={() => setActiveTab('Expired')}
          className={`px-6 py-2 text-sm font-bold rounded-lg transition-all duration-300 ${
            activeTab === 'Expired'
              ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-300'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          {t('myBookings.expired')}
        </button>
      </div>

      {/* 4. BOOKING TICKET CONTAINER */}
      <div className="space-y-4">
        {/* Error Banner */}
        {error && (
          <div className="mb-4 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700 shadow-sm dark:border-rose-500/40 dark:bg-rose-500/15 dark:text-rose-300">
            <AlertCircle className="shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <h4 className="font-bold text-sm">{t('myBookings.actionFailed')}</h4>
              <p className="mt-0.5 text-sm text-rose-600 dark:text-rose-300">{error}</p>
            </div>
            <button onClick={() => setError('')} className="p-1 hover:bg-rose-100 rounded-lg transition-colors">
              <X size={16} />
            </button>
          </div>
        )}

        {/* List of Bookings */}
        {loading && bookings.length === 0 ? (
          <div className="rounded-2xl border border-slate-100 bg-white py-20 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="w-10 h-10 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin mx-auto mb-4"></div>
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">{t('myBookings.loadingRes')}</h3>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-slate-100 bg-white py-20 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-slate-100 bg-slate-50 text-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500">
              <QrCode size={40} />
            </div>
            <h3 className="mb-2 text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-100">{t('myBookings.noBookings')}</h3>
            <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
              {t('myBookings.noBookingsDesc')}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking, index) => (
              <div
                key={booking.id}
                className={`rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-900 border-l-4 ${
                  isActiveSession(booking.sessionStatus)
                    ? booking.sessionStatus === 'Reserved'
                      ? 'border-l-amber-400'
                      : 'border-l-emerald-500'
                    : 'border-l-slate-300'
                }`}
              >
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">

                  {/* Left: ID & Main Info */}
                  <div className="flex items-center gap-4 w-full lg:w-[320px] shrink-0">
                    <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl border border-indigo-100 bg-indigo-50 dark:border-indigo-500/40 dark:bg-indigo-500/15">
                      <span className="text-[10px] font-bold text-indigo-400">ID</span>
                      <span className="text-sm font-extrabold text-indigo-700">{index + 1}</span>
                    </div>

                    <div>
                      <div className="flex items-center flex-wrap gap-2 mb-1">
                        <span className="text-base font-extrabold text-slate-900 dark:text-slate-100">{booking.location}</span>
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {booking.vehicleType}
                        </span>
                        {/* Badge phân loại Membership / Đặt chỗ */}
                        {booking.ticketType === 'Membership' ? (
                          <span className="rounded-md bg-purple-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:bg-purple-500/15 dark:text-purple-300">
                            Membership
                          </span>
                        ) : (
                          <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                            Đặt Chỗ
                          </span>
                        )}
                        <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md ${
                          isActiveSession(booking.sessionStatus)
                            ? booking.sessionStatus === 'Reserved'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {booking.sessionStatus || booking.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1"><Ticket size={12} className="text-slate-400"/> {booking.ticketId}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300 hidden sm:block"></span>
                        <span className="flex items-center gap-1"><CalendarIcon size={12} className="text-slate-400"/> {booking.bookedDate} {booking.bookedTime}</span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Status Metrics */}
                  <div className="grid w-full flex-1 grid-cols-2 gap-4 rounded-xl border-x border-transparent bg-slate-50 p-3 dark:bg-slate-800/70 lg:bg-transparent lg:px-8 lg:p-0 lg:border-slate-100 dark:lg:border-slate-700 sm:grid-cols-3">

                    {/* Time Metric */}
                    <div className="flex flex-col items-start">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        {booking.sessionStatus === 'Reserved' ? t('myBookings.deadline') : t('myBookings.activity')}
                      </span>
                      {booking.sessionStatus === 'Reserved' ? (
                        <div className="flex flex-col items-start gap-1">
                          <span className="block text-sm font-bold leading-none text-slate-700 dark:text-slate-300">{booking.deadlineTime}</span>
                          <span className="inline-block animate-pulse rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                            {getRemainingMinutesText(booking.rawDeadlineBaseTime)}
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-0.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                          <div className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            In: {formatVietnamTime(booking.checkInTime)}
                          </div>
                          {booking.checkOutTime && (
                            <div className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                              Out: {formatVietnamTime(booking.checkOutTime)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Financial Metric */}
                    <div className="flex flex-col items-start">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{t('myBookings.billing')}</span>
                      {booking.ticketType === 'Membership' ? (
                        <div>
                          <span className="text-sm font-extrabold text-purple-600 block">
                            0 đ (Membership)
                          </span>
                          <span className="text-[10px] font-bold uppercase text-emerald-500">
                            Đã thanh toán gói
                          </span>
                        </div>
                      ) : booking.totalAmount !== null && booking.totalAmount !== undefined ? (
                        <div>
                          <span className="text-sm font-extrabold text-indigo-700 block">
                            {booking.totalAmount.toLocaleString('vi-VN')} đ
                          </span>
                          <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">
                            {booking.paymentMethod || 'CASH'} - {booking.paymentStatus || 'PENDING'}
                          </span>
                        </div>
                      ) : booking.depositAmount !== null && booking.depositAmount !== undefined ? (
                        <div>
                          <span className="text-sm font-extrabold text-amber-600 block">
                            {Number(booking.depositAmount).toLocaleString('vi-VN')} đ
                          </span>
                          <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">
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
                      <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-sm font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
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
                      className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-[14px] border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-sm transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-indigo-400 dark:hover:bg-indigo-500/15 dark:hover:text-indigo-300 lg:flex-none"
                    >
                      <QrCode size={14} /> {t('myBookings.viewQR')}
                    </button>

                    {/* Nút báo cáo sự cố (Chỉ hiển thị cho các lượt đỗ đang diễn ra hoặc đã kết thúc) */}
                    {booking.sessionStatus !== 'Canceled' && (
                      <button
                        onClick={() => {
                          setSelectedLicenseVehicleForIncident(booking.contact);
                          setIsIncidentOpen(true);
                        }}
                        className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-[14px] border border-orange-200 bg-white px-4 text-xs font-bold text-orange-600 shadow-sm transition-all hover:bg-orange-50 dark:border-orange-500/40 dark:bg-slate-800 dark:text-orange-300 dark:hover:bg-orange-500/15 lg:flex-none"
                      >
                        <AlertCircle size={14} /> {t('myBookings.reportIncident') || 'Báo cáo sự cố'}
                      </button>
                    )}

                    {booking.sessionStatus === 'Reserved' && (
                      <button
                         onClick={() => handleCancelClick(booking.id)}
                         className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-[14px] border border-rose-200 bg-white px-4 text-xs font-bold text-rose-600 shadow-sm transition-all hover:bg-rose-50 dark:border-rose-500/40 dark:bg-slate-800 dark:text-rose-300 dark:hover:bg-rose-500/15 lg:flex-none"
                      >
                        <X size={14} /> {t('myBookings.cancel')}
                      </button>
                    )}

                    {canPayPendingInvoiceWithWallet(booking) && (
                      <button
                         disabled={payingSessionId === booking.id}
                         onClick={() => handlePayWallet(booking)}
                         className="flex-1 lg:flex-none w-full sm:w-auto h-10 px-5 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-[14px] font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-300 dark:hover:bg-emerald-500/25"
                      >
                        {payingSessionId === booking.id ? (
                          <span className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                          <Wallet size={14} />
                        )}
                        Thanh toan vi
                      </button>
                    )}

                    {(isDepositPaymentDue(booking) || isParkingFeePaymentDue(booking)) && (
                      <button
                         disabled={payingSessionId === booking.id}
                         onClick={() => handlePayVNPay(booking)}
                         className="flex-1 lg:flex-none w-full sm:w-auto h-10 px-5 bg-gradient-to-br from-indigo-500 to-indigo-600 hover:-translate-y-0.5 text-white rounded-[14px] font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
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
          <div className="relative w-full max-w-sm rounded-2xl border border-slate-100 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <button
              onClick={() => setIsCancelConfirmOpen(false)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <X size={18} />
            </button>

            <div className="space-y-5 pt-2 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-rose-100 bg-rose-50 text-rose-600 dark:border-rose-500/40 dark:bg-rose-500/15 dark:text-rose-300">
                <AlertCircle size={28} />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-100">{t('myBookings.cancelTitle')}</h3>
                <p className="px-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  {t('myBookings.cancelDesc')}
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setIsCancelConfirmOpen(false)}
                  className="h-11 flex-1 rounded-[14px] border border-slate-200 bg-white text-sm font-bold text-slate-600 transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  {t('myBookings.btnNoKeep')}
                </button>
                <button
                  onClick={handleConfirmCancel}
                  className="flex-1 h-11 bg-gradient-to-br from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold rounded-[14px] text-sm transition-all shadow active:scale-[0.98]"
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
          <div className="relative w-full max-w-sm rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <button
              onClick={() => {
                setIsQrOpen(false);
                setTargetBooking(null);
              }}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <X size={18} />
            </button>

            <div className="space-y-5 pt-2">
              <div className="space-y-1.5">
                <h3 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-100">{t('myBookings.ticketTitle')}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t('myBookings.ticketDesc')}</p>
              </div>

              <div className="inline-block rounded-2xl border border-slate-100 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-800">
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
                <div className="text-xs font-mono font-extrabold text-indigo-700 tracking-widest uppercase">
                  ID: {targetBooking.ticketId}
                </div>
              </div>

              <button
                onClick={() => {
                  setIsQrOpen(false);
                  setTargetBooking(null);
                }}
                className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-[14px] text-sm transition-all shadow active:scale-[0.98]"
              >
                {t('myBookings.closeTicket')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL BÁO CÁO SỰ CỐ DÀNH CHO TÀI XẾ */}
      <CreateIncidentModal
        isOpen={isIncidentOpen}
        onClose={() => {
          setIsIncidentOpen(false);
          setSelectedLicenseVehicleForIncident('');
        }}
        licenseVehicle={selectedLicenseVehicleForIncident}
        onSuccess={() => {
          message.success(t('myBookings.reportIncidentSuccess') || 'Đã gửi báo cáo sự cố!');
          fetchMyBookings();
        }}
      />
    </div>
  );
};

export default MyBookings;
