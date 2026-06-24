import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Clock, ArrowRight, CreditCard, ShieldAlert, QrCode } from 'lucide-react';
import api from '../services/api';
import { useTranslation } from 'react-i18next';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Extract query parameters
  const vnpResponseCode = searchParams.get('vnp_ResponseCode');
   const vnpTxnRef = searchParams.get('vnp_TxnRef') || '';
  const invoiceId = searchParams.get('invoiceId') || localStorage.getItem('pending_invoice_id');

  // Page States: 'polling' | 'success_deposit' | 'success_exit' | 'failed' | 'timeout'
  const [paymentState, setPaymentState] = useState('polling');
  const [loadingText, setLoadingText] = useState(t('paymentSuccess.loadingText1'));
  const [sessionDetail, setSessionDetail] = useState(null);
  const [graceTime, setGraceTime] = useState(1200); // 20 minutes in seconds (1200s)

  // Polling logic to confirm with C# Backend
  useEffect(() => {
    if (!invoiceId) {
      if (vnpResponseCode === '00') {
        // Phân loại màn hình dựa vào tiền tố mã giao dịch (DEP: Đặt cọc, INV: Phí đỗ xe ra cổng)
        if (vnpTxnRef.startsWith('DEP')) {
          setPaymentState('success_deposit');
          fetchBookingDetails();
        } else {
          setPaymentState('success_exit');
        }
      } else {
        setPaymentState('failed');
      }
      return;
    }

    // If VNPay response code is not '00', it's an immediate failure
    if (vnpResponseCode && vnpResponseCode !== '00') {
      setPaymentState('failed');
      return;
    }

    let intervalId;
    let attempts = 0;
    const maxAttempts = 15; // Max 30 seconds

    const pollStatus = async () => {
      if (attempts >= maxAttempts) {
        setPaymentState('timeout');
        clearInterval(intervalId);
        return;
      }

      attempts++;
      setLoadingText(t('paymentSuccess.loadingText2', { attempts, maxAttempts }));
      try {
        const response = await api.get(`/Payments/status/${invoiceId}`);
        const currentStatus = response.data?.status;

        if (currentStatus === 'Deposited') {
          // Booking Deposit Success
          setPaymentState('success_deposit');
          clearInterval(intervalId);
          fetchBookingDetails();
        } else if (currentStatus === 'SUCCESS') {
          // Pre-exit / Full Payment Success
          setPaymentState('success_exit');
          clearInterval(intervalId);
        } else if (currentStatus === 'SUCCESS_EXIT') {
          // MỚI: Thanh toán trực tiếp tại quầy BOT -> Ra bãi ngay
          setPaymentState('success_exit_bot');
          clearInterval(intervalId);
        } else if (currentStatus === 'FAILED') {
          setPaymentState('failed');
          clearInterval(intervalId);
        }
      } catch (err) {
        console.error('Error polling invoice status:', err);
      }
    };

    pollStatus();
    intervalId = setInterval(pollStatus, 2000);

    return () => clearInterval(intervalId);
  }, [invoiceId, vnpResponseCode]);

  // Fetch session details from my-bookings to display QR Code if deposited
  const fetchBookingDetails = async () => {
    try {
      const response = await api.get('/Parking/my-bookings');
      const bookings = response.data?.bookingsList || [];
      // Find the booking that has deposit status or matches invoice (fallback to first active booking)
      const matched = bookings.find(b => b.paymentStatus === 'Deposited' || b.sessionStatus === 'Reserved');
      if (matched) {
        setSessionDetail({
          location: `${matched.floorName || 'Floor'} - ${matched.slotName || 'Slot'}`,
          license: matched.licenseVehicle || 'N/A',
          ticketId: matched.ticketCode || 'N/A',
          qrPayload: encodeURIComponent(`SLOT:${matched.slotName}|PLATE:${matched.licenseVehicle}|ID:${matched.sessionId}|TICKET:${matched.ticketCode}`)
        });
      }
    } catch (err) {
      console.error('Failed to load booking details for QR:', err);
    }
  };

  // Countdown timer logic for grace period (20 minutes)
  useEffect(() => {
    if (paymentState !== 'success_exit') return;

    const timer = setInterval(() => {
      setGraceTime((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [paymentState]);

  const formatGraceTime = (sec) => {
    const minutes = Math.floor(sec / 60);
    const seconds = sec % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen w-screen bg-[#F8FAFC] flex items-center justify-center p-4 font-sans select-none relative overflow-hidden">
      {/* Decorative background grid and blurs */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#10B981 2px, transparent 2px)',
          backgroundSize: '24px 24px'
        }}
      />
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-emerald-400/5 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-sky-500/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-8 z-10 text-center space-y-6">

        {/* State 1: Polling backend status */}
        {paymentState === 'polling' && (
          <div className="py-12 space-y-6">
            <div className="w-16 h-16 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin mx-auto"></div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-800">{t('paymentSuccess.checkingResult')}</h2>
              <p className="text-sm text-slate-500 font-medium px-4">{loadingText}</p>
            </div>
          </div>
        )}

        {/* State 2: Booking Deposit Success */}
        {paymentState === 'success_deposit' && (
          <div className="space-y-6">
            <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 size={32} className="text-emerald-500 animate-bounce" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">{t('paymentSuccess.depositSuccess')}</h2>
              <p className="text-sm text-slate-500 font-medium px-2">
                {t('paymentSuccess.depositDesc')}
              </p>
            </div>

            {/* Display check-in QR Code directly */}
            {sessionDetail ? (
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4 max-w-xs mx-auto shadow-inner">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">{t('paymentSuccess.qrCodeTitle')}</span>
                <div className="bg-white p-2 rounded-xl border border-slate-200 inline-block shadow-sm">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&ecc=M&data=${sessionDetail.qrPayload}`}
                    alt="Check-in QR"
                    className="w-40 h-40 object-contain"
                  />
                </div>
                <div className="text-xs font-mono font-bold text-emerald-600">
                  {sessionDetail.ticketId}
                </div>
                <div className="grid grid-cols-2 gap-2 text-left text-xs font-sans pt-2 border-t border-slate-200/80">
                  <div>
                    <span className="text-slate-400 font-medium block">{t('paymentSuccess.location')}</span>
                    <span className="text-slate-800 font-bold">{sessionDetail.location}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">{t('paymentSuccess.license')}</span>
                    <span className="text-slate-800 font-bold">{sessionDetail.license}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-4 text-slate-400 text-xs flex items-center justify-center gap-1.5">
                <QrCode size={16} />
                {t('paymentSuccess.preparingQr')}
              </div>
            )}

            <button
              onClick={() => navigate('/dashboard')}
              className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] cursor-pointer"
            >
              {t('paymentSuccess.btnHome')}
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* State 3: Pre-exit / Full Payment Success */}
        {paymentState === 'success_exit' && (
          <div className="space-y-6">
            <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 size={32} className="text-emerald-500 animate-bounce" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">{t('paymentSuccess.exitSuccess')}</h2>
              <p className="text-sm text-slate-500 font-medium px-4">
                {t('paymentSuccess.exitDesc')}
              </p>
            </div>

            {/* Countdown timer card */}
            <div className="bg-amber-50/50 border border-amber-200/70 rounded-2xl p-5 space-y-2 max-w-xs mx-auto shadow-inner">
              <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-widest block">{t('paymentSuccess.graceTimeTitle')}</span>
              <div className="text-4xl font-mono font-black text-amber-600 animate-pulse">
                {formatGraceTime(graceTime)}
              </div>
              <p className="text-[10px] text-amber-800 font-medium leading-relaxed">
                {t('paymentSuccess.graceTimeDesc')}
              </p>
            </div>

            <button
              onClick={() => navigate('/dashboard')}
              className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] cursor-pointer"
            >
              {t('paymentSuccess.btnBackHome')}
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* State 3.1: Checkout at BOT Success */}
        {paymentState === 'success_exit_bot' && (
          <div className="space-y-6">
            <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 size={32} className="text-emerald-500 animate-bounce" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">{t('paymentSuccess.botSuccess')}</h2>
              <p className="text-sm text-slate-500 font-medium px-4">
                {t('paymentSuccess.botDesc1')}
              </p>
            </div>

            {/* Hộp trạng thái ra cổng lập tức (Không có đếm ngược ân hạn) */}
            <div className="bg-emerald-50/50 border border-emerald-200/70 rounded-2xl p-5 space-y-2 max-w-xs mx-auto shadow-inner">
              <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-widest block">{t('paymentSuccess.gateStatusTitle')}</span>
              <div className="text-xl font-black text-emerald-600 uppercase">
                {t('paymentSuccess.gateStatus')}
              </div>
              <p className="text-[10px] text-emerald-800 font-medium leading-relaxed">
                {t('paymentSuccess.botDesc2')}
              </p>
            </div>

            <button
              onClick={() => navigate('/dashboard')}
              className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] cursor-pointer"
            >
              {t('paymentSuccess.btnBackHome')}
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* State 4: Payment Failed */}
        {paymentState === 'failed' && (
          <div className="space-y-6 py-4">
            <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <XCircle size={32} className="text-rose-500" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">{t('paymentSuccess.failedTitle')}</h2>
              <p className="text-sm text-slate-500 font-medium px-4">
                {t('paymentSuccess.failedDesc')}
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex-1 h-11 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                {t('paymentSuccess.btnHome')}
              </button>
              <button
                onClick={() => navigate('/my-bookings')}
                className="flex-1 h-11 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-rose-600/10 cursor-pointer"
              >
                {t('paymentSuccess.btnRetry')}
              </button>
            </div>
          </div>
        )}

        {/* State 5: Timeout */}
        {paymentState === 'timeout' && (
          <div className="space-y-6 py-4">
            <div className="w-16 h-16 bg-amber-50 border border-amber-100 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <ShieldAlert size={32} className="text-amber-500" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">{t('paymentSuccess.timeoutTitle')}</h2>
              <p className="text-sm text-slate-500 font-medium px-4">
                {t('paymentSuccess.timeoutDesc')}
              </p>
            </div>

            <button
              onClick={() => navigate('/my-bookings')}
              className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] cursor-pointer"
            >
              {t('paymentSuccess.btnHistory')}
              <ArrowRight size={16} />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default PaymentSuccess;
