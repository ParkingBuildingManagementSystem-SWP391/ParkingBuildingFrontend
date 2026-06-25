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
    <div className="relative flex min-h-screen w-full select-none items-center justify-center overflow-hidden bg-slate-50 p-4 font-sans dark:bg-slate-950">
      {/* Decorative background blurs */}
      <div className="pointer-events-none absolute left-1/4 top-1/4 h-[320px] w-[320px] rounded-full bg-indigo-500/5 blur-[100px] sm:h-[420px] sm:w-[420px]" />
      <div className="pointer-events-none absolute bottom-1/4 right-1/4 h-[320px] w-[320px] rounded-full bg-emerald-400/5 blur-[100px] sm:h-[420px] sm:w-[420px]" />

      <div className="z-10 w-full max-w-md space-y-7 rounded-2xl border border-slate-100 bg-white p-5 text-center shadow-[0_30px_80px_-30px_rgba(15,23,42,0.25)] dark:border-slate-800 dark:bg-slate-900 sm:p-10">

        {/* State 1: Polling backend status */}
        {paymentState === 'polling' && (
          <div className="py-12 space-y-7">
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full bg-indigo-50 border border-indigo-100" />
              <div className="absolute inset-2 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">{t('paymentSuccess.checkingResult')}</h2>
              <p className="px-2 text-sm font-medium text-slate-500 dark:text-slate-400 sm:px-4">{loadingText}</p>
            </div>
          </div>
        )}

        {/* State 2: Booking Deposit Success */}
        {paymentState === 'success_deposit' && (
          <div className="space-y-7">
            <div className="w-20 h-20 bg-emerald-50 ring-8 ring-emerald-50/60 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={40} className="text-emerald-500" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">{t('paymentSuccess.depositSuccess')}</h2>
              <p className="px-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                {t('paymentSuccess.depositDesc')}
              </p>
            </div>

            {/* Display check-in QR Code directly */}
            {sessionDetail ? (
              <div className="mx-auto max-w-xs space-y-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800 sm:p-6">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">{t('paymentSuccess.qrCodeTitle')}</span>
                <div className="bg-white p-3 rounded-xl border border-slate-200 inline-block shadow-sm">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&ecc=M&data=${sessionDetail.qrPayload}`}
                    alt="Check-in QR"
                    className="w-40 h-40 object-contain"
                  />
                </div>
                <div className="break-all font-mono text-xs font-bold text-emerald-600">
                  {sessionDetail.ticketId}
                </div>
                <div className="grid grid-cols-1 gap-3 border-t border-slate-200/80 pt-3 text-left font-sans text-xs dark:border-slate-700 sm:grid-cols-2">
                  <div>
                    <span className="text-slate-400 font-medium block mb-0.5">{t('paymentSuccess.location')}</span>
                    <span className="break-words font-bold text-slate-900 dark:text-slate-100">{sessionDetail.location}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block mb-0.5">{t('paymentSuccess.license')}</span>
                    <span className="break-all font-bold text-slate-900 dark:text-slate-100">{sessionDetail.license}</span>
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
              className="w-full h-12 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-bold rounded-[14px] flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              {t('paymentSuccess.btnHome')}
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* State 3: Pre-exit / Full Payment Success */}
        {paymentState === 'success_exit' && (
          <div className="space-y-7">
            <div className="w-20 h-20 bg-emerald-50 ring-8 ring-emerald-50/60 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={40} className="text-emerald-500" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">{t('paymentSuccess.exitSuccess')}</h2>
              <p className="px-2 text-sm font-medium text-slate-500 dark:text-slate-400 sm:px-4">
                {t('paymentSuccess.exitDesc')}
              </p>
            </div>

            {/* Countdown timer card */}
            <div className="mx-auto max-w-xs space-y-2 rounded-2xl border border-amber-200/70 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10 sm:p-6">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-amber-700 uppercase tracking-widest">
                <Clock size={12} />
                {t('paymentSuccess.graceTimeTitle')}
              </span>
              <div className="text-4xl font-mono font-black text-amber-600 tracking-tight">
                {formatGraceTime(graceTime)}
              </div>
              <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
                {t('paymentSuccess.graceTimeDesc')}
              </p>
            </div>

            <button
              onClick={() => navigate('/dashboard')}
              className="w-full h-12 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-bold rounded-[14px] flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              {t('paymentSuccess.btnBackHome')}
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* State 3.1: Checkout at BOT Success */}
        {paymentState === 'success_exit_bot' && (
          <div className="space-y-7">
            <div className="w-20 h-20 bg-emerald-50 ring-8 ring-emerald-50/60 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={40} className="text-emerald-500" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">{t('paymentSuccess.botSuccess')}</h2>
              <p className="px-2 text-sm font-medium text-slate-500 dark:text-slate-400 sm:px-4">
                {t('paymentSuccess.botDesc1')}
              </p>
            </div>

            {/* Hộp trạng thái ra cổng lập tức (Không có đếm ngược ân hạn) */}
            <div className="mx-auto max-w-xs space-y-2 rounded-2xl border border-emerald-200/70 bg-emerald-50 p-4 dark:border-emerald-500/30 dark:bg-emerald-500/10 sm:p-6">
              <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-widest block">{t('paymentSuccess.gateStatusTitle')}</span>
              <div className="text-xl font-black text-emerald-600 uppercase">
                {t('paymentSuccess.gateStatus')}
              </div>
              <p className="text-[11px] text-emerald-800 font-medium leading-relaxed">
                {t('paymentSuccess.botDesc2')}
              </p>
            </div>

            <button
              onClick={() => navigate('/dashboard')}
              className="w-full h-12 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-bold rounded-[14px] flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              {t('paymentSuccess.btnBackHome')}
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* State 4: Payment Failed */}
        {paymentState === 'failed' && (
          <div className="space-y-7 py-4">
            <div className="w-20 h-20 bg-rose-50 ring-8 ring-rose-50/60 rounded-full flex items-center justify-center mx-auto">
              <XCircle size={40} className="text-rose-500" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">{t('paymentSuccess.failedTitle')}</h2>
              <p className="px-2 text-sm font-medium text-slate-500 dark:text-slate-400 sm:px-4">
                {t('paymentSuccess.failedDesc')}
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <button
                onClick={() => navigate('/dashboard')}
                className="h-12 flex-1 cursor-pointer rounded-[14px] border border-slate-200 bg-white text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                {t('paymentSuccess.btnHome')}
              </button>
              <button
                onClick={() => navigate('/my-bookings')}
                className="flex-1 h-12 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-bold rounded-[14px] text-sm transition-all shadow-lg shadow-indigo-600/20 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                {t('paymentSuccess.btnRetry')}
              </button>
            </div>
          </div>
        )}

        {/* State 5: Timeout */}
        {paymentState === 'timeout' && (
          <div className="space-y-7 py-4">
            <div className="w-20 h-20 bg-amber-50 ring-8 ring-amber-50/60 rounded-full flex items-center justify-center mx-auto">
              <ShieldAlert size={40} className="text-amber-500" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">{t('paymentSuccess.timeoutTitle')}</h2>
              <p className="px-2 text-sm font-medium text-slate-500 dark:text-slate-400 sm:px-4">
                {t('paymentSuccess.timeoutDesc')}
              </p>
            </div>

            <button
              onClick={() => navigate('/my-bookings')}
              className="w-full h-12 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-bold rounded-[14px] flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
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
