import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

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

const MyBookings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Active filter tab: 'All' | 'Active' | 'Expired'
  const [activeTab, setActiveTab] = useState('All');
  
  // Loading and Error states
  const [loading, setLoading] = useState(false);
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
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [targetBookingId, setTargetBookingId] = useState(null);
  const [targetBooking, setTargetBooking] = useState(null);

  // Helper to check if a session is active
  const isActiveSession = (status) => {
    const s = String(status || '').trim().toLowerCase();
    return s === 'reserved' || s === 'occupied' || s === 'inprogress' || s === 'active';
  };

  // Fetch bookings function
  const fetchMyBookings = async () => {
    // Structural validation check for driver role (target roleId === 4)
    if (user && user.roleId !== undefined && Number(user.roleId) !== 4) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError("No token found. Please log in.");
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
      
      const response = await api.get('/Parking/my-bookings', config);
      
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

        // Parse bookedDate and bookedTime from bookingTime DTO property
        let bookedDate = 'N/A';
        let bookedTime = 'N/A';
        let deadlineTime = 'N/A';

        if (item.bookingTime) {
          const d = new Date(item.bookingTime);
          if (!isNaN(d.getTime())) {
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            bookedDate = `${day}/${month}/${year}`;

            const hours = String(d.getHours()).padStart(2, '0');
            const mins = String(d.getMinutes()).padStart(2, '0');
            bookedTime = `${hours}:${mins}`;

            const deadline = new Date(d.getTime() + 15 * 60 * 1000);
            const dlHours = String(deadline.getHours()).padStart(2, '0');
            const dlMins = String(deadline.getMinutes()).padStart(2, '0');
            deadlineTime = `${dlHours}:${dlMins}`;
          }
        }

        return {
          id: item.sessionId || idx + 1,
          ticketId: item.ticketCode || item.ticket?.ticketCode || `TKT-${item.sessionId || idx + 1}`,
          vehicleType: vehicleType,
          status: isActiveSession(item.sessionStatus) ? 'Active' : 'Cancelled / Expired',
          sessionStatus: item.sessionStatus || 'Expired',
          location: `${item.floorName || item.slot?.floor?.floorName || 'Floor'} - ${item.slotName || item.slot?.slotName || 'Slot'}`,
          bookedDate: bookedDate,
          bookedTime: bookedTime,
          deadlineTime: deadlineTime,
          contact: item.licenseVehicle || 'N/A',
          rawBookingTime: item.bookingTime,
          checkInTime: item.checkInTime,
          checkOutTime: item.checkOutTime,
          totalAmount: item.totalAmount,
          paymentStatus: item.paymentStatus,
          paymentMethod: item.paymentMethod
        };
      });

      setBookings(mapped);
      localStorage.setItem('spotflow_driver_bookings', JSON.stringify(mapped));
    } catch (err) {
      console.error("Fetch bookings error:", err.response?.data || err);
      setError("Failed to load reservations.");
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

  // Compute remaining minutes label dynamically based on raw booking time
  const getRemainingMinutesText = (bookingTime) => {
    if (!bookingTime) return '0m remaining';
    const now = new Date();
    const booked = new Date(bookingTime);
    if (isNaN(booked.getTime())) return '0m remaining';
    
    // 15 minutes limit
    const target = new Date(booked.getTime() + 15 * 60 * 1000);
    const diffSeconds = Math.floor((target - now) / 1000);
    if (diffSeconds <= 0) return '0m remaining';
    
    const minutes = Math.ceil(diffSeconds / 60);
    return `${minutes}m remaining`;
  };

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

  // Confirm booking cancellation
  const handleConfirmCancel = () => {
    if (targetBookingId !== null) {
      setBookings(prevBookings => 
        prevBookings.map(b => 
          b.id === targetBookingId 
            ? { ...b, status: 'Cancelled / Expired', sessionStatus: 'Canceled' } 
            : b
        )
      );
      setIsCancelConfirmOpen(false);
      setTargetBookingId(null);
    }
  };

  return (
    <div className="space-y-6 font-sans select-none pb-12">
      
      {/* 1. PAGE HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">My Bookings</h1>
          <p className="text-slate-500 text-sm mt-1">View and manage your parking reservations</p>
        </div>
      </div>

      {/* 2. OVERVIEW STATISTICS ROW (4 Balanced summary cards) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Total Bookings Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-sm text-slate-500 font-medium block">Total Bookings</span>
            <span className="text-3xl font-bold text-slate-900 block">{totalBookings}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Ticket size={24} />
          </div>
        </div>

        {/* Active Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-sm text-slate-500 font-medium block">Active</span>
            <span className="text-3xl font-bold text-green-600 block">{activeCount}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
            <CheckCircle size={24} />
          </div>
        </div>

        {/* Expired Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-sm text-slate-500 font-medium block">Expired</span>
            <span className="text-3xl font-bold text-slate-900 block">{expiredCount}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-505 flex items-center justify-center shrink-0">
            <XCircle size={24} />
          </div>
        </div>

        {/* Total Spent Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-sm text-slate-500 font-medium block">Total Spent</span>
            <span className="text-2xl font-bold text-purple-600 block">
              {totalSpent.toLocaleString('vi-VN')} VND
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <CreditCard size={24} />
          </div>
        </div>

      </div>

      {/* 3. STATUS FILTER TABS */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setActiveTab('All')}
          className={`px-5 py-2 text-sm font-semibold rounded-lg border transition-all duration-200 ${
            activeTab === 'All'
              ? 'bg-black border-black text-white shadow-sm'
              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-slate-900'
          }`}
        >
          All ({totalBookings})
        </button>

        <button
          onClick={() => setActiveTab('Active')}
          className={`px-5 py-2 text-sm font-semibold rounded-lg border transition-all duration-200 ${
            activeTab === 'Active'
              ? 'bg-black border-black text-white shadow-sm'
              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-slate-900'
          }`}
        >
          Active ({activeCount})
        </button>

        <button
          onClick={() => setActiveTab('Expired')}
          className={`px-5 py-2 text-sm font-semibold rounded-lg border transition-all duration-200 ${
            activeTab === 'Expired'
              ? 'bg-black border-black text-white shadow-sm'
              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-slate-900'
          }`}
        >
          Expired ({expiredCount})
        </button>
      </div>

      {/* 4. BOOKING TICKET CONTAINER */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white border border-slate-100 rounded-2xl py-16 text-center shadow-sm">
            <div className="w-8 h-8 rounded-full border-4 border-slate-900 border-t-transparent animate-spin mx-auto mb-3"></div>
            <h3 className="text-slate-700 font-bold text-base">Loading bookings...</h3>
          </div>
        ) : error ? (
          <div className="bg-white border border-slate-100 rounded-2xl py-16 text-center shadow-sm">
            <AlertCircle size={40} className="text-red-500 mx-auto mb-3" />
            <h3 className="text-slate-700 font-bold text-base">{error}</h3>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-2xl py-16 text-center shadow-sm">
            <Info size={40} className="text-slate-350 mx-auto mb-3" />
            <h3 className="text-slate-700 font-bold text-base">No reservations found</h3>
            <p className="text-xs text-slate-555 mt-1">There are no bookings matching the selected filter.</p>
          </div>
        ) : (
          filteredBookings.map((booking, index) => (
            <div 
              key={booking.id}
              className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm mb-4"
            >
              
              {/* Top Info Bar (Badge Row) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-black">{index + 1}</span>
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-green-50 text-green-700 border border-green-100">
                    {booking.vehicleType}
                  </span>
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${
                    isActiveSession(booking.sessionStatus)
                      ? 'bg-green-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {booking.sessionStatus || booking.status}
                  </span>
                </div>
                <span className="text-slate-400 text-xs font-mono">
                  Ticket ID: {booking.ticketId}
                </span>
              </div>

              {/* Thin Divider */}
              <hr className="border-slate-100 mb-6" />

              {/* Content block: Metadata grid on left, action buttons on right */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                
                {/* Metadata Core Grid (Flexible multi-column Layout) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6 flex-1">
                  
                  {/* Column 1 (Location) */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center shrink-0 border border-slate-100">
                      <MapPin size={18} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-400 font-medium">Location</span>
                      <span className="text-sm font-semibold text-slate-800 mt-0.5">{booking.location}</span>
                    </div>
                  </div>

                  {/* Column 2 (Booked At) */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center shrink-0 border border-slate-100">
                      <CalendarIcon size={18} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-400 font-medium">Booked At</span>
                      <span className="text-sm font-semibold text-slate-800 mt-0.5">{booking.bookedDate}</span>
                      <span className="text-xs text-slate-500 mt-0.5">{booking.bookedTime}</span>
                    </div>
                  </div>

                  {/* Column 3 (Arrival Deadline or Activity Time) */}
                  {booking.sessionStatus === 'Reserved' ? (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0 border border-orange-100">
                        <Clock size={18} className="text-orange-500" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-400 font-medium">Arrival Deadline</span>
                        <span className="text-sm font-semibold text-slate-800 mt-0.5">{booking.deadlineTime}</span>
                        <span className="text-orange-500 text-xs font-semibold animate-pulse mt-0.5">
                          {getRemainingMinutesText(booking.rawBookingTime)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center shrink-0 border border-slate-100">
                        <Clock size={18} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-400 font-medium">Activity Time</span>
                        <span className="text-xs font-semibold text-slate-700 mt-0.5">
                          In: {booking.checkInTime ? new Date(booking.checkInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) + ' ' + new Date(booking.checkInTime).toLocaleDateString([], {day: '2-digit', month: '2-digit'}) : 'N/A'}
                        </span>
                        {booking.checkOutTime && (
                          <span className="text-xs font-semibold text-slate-700 mt-0.5">
                            Out: {new Date(booking.checkOutTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) + ' ' + new Date(booking.checkOutTime).toLocaleDateString([], {day: '2-digit', month: '2-digit'})}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Column 4 (Billing Info) */}
                  {booking.totalAmount !== null && booking.totalAmount !== undefined ? (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
                        <CreditCard size={18} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-400 font-medium">Billing</span>
                        <span className="text-sm font-extrabold text-purple-700 mt-0.5">
                          {booking.totalAmount.toLocaleString('vi-VN')} VND
                        </span>
                        <span className="text-[10px] text-slate-500 mt-0.5 uppercase font-semibold">
                          {booking.paymentMethod || 'CASH'} - {booking.paymentStatus || 'PENDING'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-300 flex items-center justify-center shrink-0 border border-slate-100">
                        <CreditCard size={18} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-400 font-medium">Billing</span>
                        <span className="text-xs font-medium text-slate-400 mt-0.5">No Invoice</span>
                      </div>
                    </div>
                  )}

                </div>

                {/* Action Buttons Block (Right-Aligned Column) */}
                <div className="flex flex-col gap-2 shrink-0 w-full lg:w-auto sm:min-w-[140px]">
                  <button 
                    onClick={() => {
                      setTargetBooking(booking);
                      setIsQrOpen(true);
                    }}
                    className="w-full border border-slate-200 text-slate-700 hover:bg-slate-50 py-2.5 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-1.5 transition-all"
                  >
                    <QrCode size={16} />
                    View QR
                  </button>

                  {isActiveSession(booking.sessionStatus) && (
                    <button 
                       onClick={() => handleCancelClick(booking.id)}
                       className="w-full bg-[#D91B5C] text-white hover:bg-rose-700 font-medium py-2 px-5 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/10 active:scale-[0.98]"
                    >
                      <X size={16} />
                      Cancel
                    </button>
                  )}
                </div>

              </div>

              {/* Full-width Contact Section (Inner Banner) */}
              <div className="bg-blue-50/60 rounded-lg p-3 flex items-center gap-2 mt-4">
                <Info size={16} className="text-blue-700 shrink-0" />
                <span className="text-blue-700 text-sm font-medium">Contact: {booking.contact}</span>
              </div>

            </div>
          ))
        )}
      </div>

      {/* 5. DYNAMIC CUSTOM REACTION CONFIRMATION MODAL OVERLAY */}
      {isCancelConfirmOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 animate-scale-in relative">
            <button 
              onClick={() => setIsCancelConfirmOpen(false)}
              className="absolute top-4 right-4 h-7 w-7 text-slate-400 hover:text-slate-600 hover:bg-slate-50 flex items-center justify-center rounded-lg transition-all"
            >
              <X size={16} />
            </button>

            <div className="space-y-4 pt-2 text-center">
              <div className="w-12 h-12 bg-rose-50 border border-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <AlertCircle size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-800">Cancel Parking Booking?</h3>
                <p className="text-xs text-slate-500 leading-normal">
                  Are you sure you want to cancel this reservation? Expired tickets release spots back to the building map grids immediately.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setIsCancelConfirmOpen(false)}
                  className="flex-1 h-10 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl text-xs transition-all"
                >
                  No, Keep it
                </button>
                <button
                  onClick={handleConfirmCancel}
                  className="flex-1 h-10 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-rose-600/10 active:scale-[0.98]"
                >
                  Yes, Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. DYNAMIC QR DISPLAY MODAL OVERLAY */}
      {isQrOpen && targetBooking && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 animate-scale-in relative text-center">
            <button 
              onClick={() => {
                setIsQrOpen(false);
                setTargetBooking(null);
              }}
              className="absolute top-4 right-4 h-7 w-7 text-slate-400 hover:text-slate-600 hover:bg-slate-50 flex items-center justify-center rounded-lg transition-all"
            >
              <X size={16} />
            </button>

            <div className="space-y-5 pt-2">
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-800">Parking Booking Ticket</h3>
                <p className="text-xs text-slate-550">Scan at entrance scan readers or camera checkpoints</p>
              </div>

              <div className="bg-slate-50 border border-slate-100 p-6 rounded-xl inline-block shadow-sm">
                {/* Real thermal QR block */}
                <div className="w-40 h-40 bg-white border border-slate-200 rounded-lg p-1.5 mx-auto flex items-center justify-center">
                  <img
                    src={qrUrl}
                    alt={`QR Code for Ticket ${targetBooking.ticketId}`}
                    className="w-full h-full rounded-md object-contain"
                  />
                </div>
              </div>

              <div className="text-xs font-mono font-bold text-indigo-600 tracking-wide uppercase">
                Ticket ID: {targetBooking.ticketId}
              </div>

              <button
                onClick={() => {
                  setIsQrOpen(false);
                  setTargetBooking(null);
                }}
                className="w-full h-10 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all"
              >
                Close Ticket
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MyBookings;
