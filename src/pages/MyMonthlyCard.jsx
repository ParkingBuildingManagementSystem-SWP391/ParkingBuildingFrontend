import React, { useCallback, useEffect, useState } from 'react';
import {
  Bike,
  CalendarCheck,
  CalendarX2,
  Car,
  CheckCircle2,
  CreditCard,
  QrCode,
  RefreshCw,
  Shield,
  ShieldCheck,
  Ticket,
  Truck,
  Wallet,
  Zap
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { formatVietnamDateTime } from '../utils/dateTime';
import { getVehicleTypeLabel } from '../utils/i18nLabels';

/* ─── helpers ─── */
const unwrapData = (payload) => payload?.data?.data ?? payload?.data ?? payload ?? null;

const getValue = (source, ...keys) => {
  for (const key of keys) {
    if (source?.[key] !== undefined && source?.[key] !== null) return source[key];
  }
  return undefined;
};

const getPaymentUrl = (payload) => {
  const data = unwrapData(payload);
  const candidates = [payload, payload?.data, data, data?.data];
  const keys = ['paymentUrl', 'paymentURL', 'PaymentUrl', 'PaymentURL', 'vnpayUrl', 'vnPayUrl', 'url', 'Url'];
  for (const source of candidates) {
    for (const key of keys) {
      if (source?.[key]) return source[key];
    }
  }
  return '';
};

const formatDateTime = (value, t) => {
  if (!value) return t('common.notUpdated');
  return formatVietnamDateTime(value);
};

/* ─── constants ─── */
const PLANS = [
  { id: 1, key: 'Bicycle',   Icon: Bike,  price: 120000,  accent: 'emerald' },
  { id: 2, key: 'Motorbike', Icon: Truck, price: 250000,  accent: 'indigo'  },
  { id: 3, key: 'Car',       Icon: Car,   price: 1500000, accent: 'rose'    },
];

const DURATIONS = [
  { value: 1,  label: '1 tháng',  discount: null },
  { value: 3,  label: '3 tháng',  discount: null },
  { value: 6,  label: '6 tháng',  discount: '5%' },
  { value: 12, label: '12 tháng', discount: '10%'},
];

const accentCls = {
  emerald: { icon: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30', bar: 'bg-emerald-500' },
  indigo:  { icon: 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30',   bar: 'bg-indigo-500'  },
  rose:    { icon: 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30',               bar: 'bg-rose-500'    },
};

/* ─── Loading Skeleton ─── */
const LoadingSkeleton = () => (
  <div className="mx-auto max-w-4xl px-4 py-8 animate-pulse space-y-4">
    <div className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800" />
    <div className="h-40 rounded-2xl bg-slate-200 dark:bg-slate-800" />
  </div>
);

/* ─── Active Card View ─── */
const ActiveCardView = ({ cardInfo, onRefresh, t }) => {
  const ticketCode = getValue(cardInfo, 'ticketCode', 'TicketCode');
  const tariffId   = getValue(cardInfo, 'tariffId', 'TariffId');
  const startTime  = getValue(cardInfo, 'startDate', 'StartDate', 'startTime', 'StartTime');
  const endTime    = getValue(cardInfo, 'endDate', 'EndDate', 'endTime', 'EndTime');
  const status     = getValue(cardInfo, 'status', 'Status') || 'Active';
  const isActive   = status === 'Active' || status === 'MonthlyCardActive';

  const plan = PLANS.find(p => p.id === tariffId) || PLANS[1];
  const { Icon } = plan;
  const cls  = accentCls[plan.accent];

  const now      = new Date();
  const end      = endTime    ? new Date(endTime)    : now;
  const start    = startTime  ? new Date(startTime)  : now;
  const totalMs  = end - start;
  const usedMs   = now - start;
  const daysLeft = Math.max(0, Math.ceil((end - now) / 86400000));
  const progressPct = totalMs > 0 ? Math.min(100, Math.max(0, (usedMs / totalMs) * 100)) : 0;

  const qrUrl = ticketCode
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(ticketCode)}&bgcolor=ffffff&color=1e293b&margin=10`
    : null;

  const stats = [
    { Icon: ShieldCheck,  color: 'text-indigo-500',  bg: 'bg-indigo-50 dark:bg-indigo-500/10',   label: 'Loại xe',        value: getVehicleTypeLabel(plan.key, t) },
    { Icon: CalendarCheck,color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', label: 'Ngày bắt đầu',   value: formatDateTime(startTime, t) },
    { Icon: CalendarX2,   color: 'text-rose-500',    bg: 'bg-rose-50 dark:bg-rose-500/10',       label: 'Ngày hết hạn',   value: formatDateTime(endTime, t) },
    { Icon: CreditCard,   color: 'text-amber-500',   bg: 'bg-amber-50 dark:bg-amber-500/10',     label: 'Chi phí / tháng',value: `${plan.price.toLocaleString('vi-VN')} đ` },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-4 px-4 py-8">

      {/* ── Main info card ── */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900 overflow-hidden">

        {/* Card header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-700 px-6 py-5">
          <div className="flex items-center gap-4">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${cls.icon}`}>
              <Icon size={24} />
            </div>
            <div>
              <div className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-slate-100 bg-slate-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                <ShieldCheck size={10} />
                Vé Tháng Đỗ Xe Động
              </div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                {getVehicleTypeLabel(plan.key, t)}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold ${
              isActive
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
            }`}>
              <CheckCircle2 size={11} />
              {isActive ? 'Đang hoạt động' : status}
            </span>
            <button
              onClick={onRefresh}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold text-slate-500 hover:bg-slate-100 transition-all dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
            >
              <RefreshCw size={11} />
              Làm mới
            </button>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 dark:divide-slate-700 sm:grid-cols-4 sm:divide-y-0">
          {stats.map((s) => (
            <div key={s.label} className="flex items-start gap-3 px-5 py-4">
              <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${s.bg}`}>
                <s.Icon size={15} className={s.color} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{s.label}</p>
                <p className="mt-0.5 text-sm font-extrabold text-slate-800 dark:text-slate-100 leading-tight break-words">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="border-t border-slate-100 dark:border-slate-700 px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Thời hạn hiệu lực</span>
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{daysLeft} ngày còn lại</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-700 ${cls.bar}`}
              style={{ width: `${Math.max(2, 100 - progressPct)}%` }}
            />
          </div>
        </div>

        {/* Perks row */}
        <div className="border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-6 py-3">
          <div className="flex flex-wrap gap-x-6 gap-y-1.5">
            {['Vào bãi không giới hạn lượt', 'Cấp ô đỗ tự động', 'Không phát sinh phí mỗi lượt'].map((p) => (
              <span key={p} className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── QR card ── */}
      {ticketCode && (
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col items-center gap-4 px-6 py-6 sm:flex-row sm:items-center">
            {/* QR image */}
            {qrUrl && (
              <div className="shrink-0 rounded-2xl border-2 border-slate-100 dark:border-slate-700 bg-white p-3 shadow-inner">
                <img src={qrUrl} alt="QR Code" className="block h-[160px] w-[160px]" />
              </div>
            )}

            {/* Right side info */}
            <div className="flex flex-1 flex-col gap-3 w-full">
              {/* Pill label */}
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm">
                <QrCode size={15} />
                Mã QR vé tháng
              </div>

              {/* Ticket code chip */}
              <div className="rounded-xl border border-slate-100 bg-slate-50 dark:border-slate-700 dark:bg-slate-800 px-4 py-3 flex items-center gap-3">
                <Ticket size={15} className="text-slate-400 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-0.5">Mã vé</p>
                  <span className="font-mono text-base font-extrabold tracking-[0.15em] text-slate-800 dark:text-slate-100">{ticketCode}</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Registration View ─── */
const RegistrationView = ({ onRegister, submitting, t }) => {
  const [selectedPlan, setSelectedPlan]         = useState(null);
  const [selectedDuration, setSelectedDuration] = useState(1);
  const [plans, setPlans] = useState([
    { id: 1, key: 'Bicycle', Icon: Bike, price: 120000, accent: 'emerald' },
    { id: 2, key: 'Motorbike', Icon: Truck, price: 250000, accent: 'indigo' },
    { id: 3, key: 'Car', Icon: Car, price: 1500000, accent: 'rose' },
  ]);

  useEffect(() => {
    const fetchTariffs = async () => {
      try {
        const res = await api.get('/MonthlyCard/tariffs');

        const serverTariffs = Array.isArray(res.data)
          ? res.data
          : res.data?.data;

        if (Array.isArray(serverTariffs)) {
          setPlans(prevPlans =>
            prevPlans.map(plan => {
              const matched = serverTariffs.find(
                tariff => Number(tariff.tariffId) === Number(plan.id)
              );

              const monthlyPrice = Number(matched?.monthlyPrice);

              return matched && Number.isFinite(monthlyPrice)
                ? { ...plan, price: monthlyPrice }
                : plan;
            })
          );
        }
      } catch (err) {
        console.error('Lỗi khi tải bảng giá vé tháng từ Backend:', err);
      }
    };

    fetchTariffs();
  }, []);

  const plan = plans.find(p => p.id === selectedPlan);
  const { Icon } = plan || {};
  const cls = plan ? accentCls[plan.accent] : null;
  const discountRate = selectedDuration >= 12 ? 0.1 : selectedDuration >= 6 ? 0.05 : 0;
  const totalPrice   = plan ? Math.round(plan.price * selectedDuration * (1 - discountRate)) : 0;

  const handleSubmit = () => {
    if (!selectedPlan) return;
    onRegister({ vehicleTypeId: selectedPlan, durationInMonths: selectedDuration });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4 px-4 py-8">

      {/* Page header card */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-500/15">
            <CreditCard size={19} className="text-indigo-600 dark:text-indigo-300" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-slate-100">Đăng ký vé tháng</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Chọn loại xe và thời hạn, thanh toán một lần — đỗ xe không giới hạn.</p>
          </div>
        </div>
      </div>

      {/* Main config + summary */}
      <div className="grid gap-4 lg:grid-cols-3">

        {/* Left: plan + duration */}
        <div className="space-y-4 lg:col-span-2">

          {/* Plan cards */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Chọn loại xe</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {plans.map((p) => {
                const PIcon = p.Icon;
                const pCls  = accentCls[p.accent];
                const isSel = selectedPlan === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPlan(p.id)}
                    className={`relative rounded-xl border-2 p-4 text-left transition-all duration-150 ${
                      isSel
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10 shadow-sm'
                        : 'border-slate-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-500/30'
                    }`}
                  >
                    {isSel && (
                      <CheckCircle2 size={16} className="absolute right-3 top-3 text-indigo-600 dark:text-indigo-400" />
                    )}
                    <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl border ${pCls.icon}`}>
                      <PIcon size={20} />
                    </div>
                    <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">{getVehicleTypeLabel(p.key, t)}</p>
                    <p className="mt-0.5 text-base font-black text-slate-800 dark:text-slate-100">
                      {p.price.toLocaleString('vi-VN')}
                      <span className="text-xs font-semibold text-slate-400 ml-1">đ/tháng</span>
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Duration picker */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Thời hạn đăng ký</p>
            <div className="grid grid-cols-4 gap-3">
              {DURATIONS.map((d) => {
                const isSel = selectedDuration === d.value;
                return (
                  <button
                    key={d.value}
                    onClick={() => setSelectedDuration(d.value)}
                    className={`relative rounded-xl border-2 py-3 text-center transition-all ${
                      isSel
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10'
                        : 'border-slate-100 dark:border-slate-700 hover:border-indigo-200'
                    }`}
                  >
                    {d.discount && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-rose-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                        -{d.discount}
                      </span>
                    )}
                    <p className={`text-sm font-extrabold ${isSel ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}`}>
                      {d.label}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Order summary */}
        <div className="flex flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="mb-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Tóm tắt đơn hàng</p>

          {plan && cls ? (
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 dark:border-slate-700 dark:bg-slate-800 p-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${cls.icon}`}>
                  {Icon && <Icon size={16} />}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{getVehicleTypeLabel(plan.key, t)}</p>
                  <p className="text-[10px] text-slate-400">{selectedDuration} tháng × {plan.price.toLocaleString('vi-VN')} đ</p>
                </div>
              </div>

              {discountRate > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Ưu đãi ({discountRate * 100}%)</span>
                  <span className="font-bold text-emerald-600">-{(plan.price * selectedDuration * discountRate).toLocaleString('vi-VN')} đ</span>
                </div>
              )}

              <div className="border-t border-slate-100 dark:border-slate-700 pt-3 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Tổng cộng</span>
                <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">{totalPrice.toLocaleString('vi-VN')} đ</span>
              </div>

              <ul className="space-y-1.5 pt-1">
                {['Vào bãi không giới hạn', 'Cấp ô đỗ tự động', 'Không phát sinh phí'].map((perk) => (
                  <li key={perk} className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />
                    {perk}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 dark:border-slate-700 py-10">
              <Wallet size={26} className="text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-xs text-slate-400 dark:text-slate-500">Chọn gói để xem tổng tiền</p>
            </div>
          )}

          <button
            disabled={!selectedPlan || submitting}
            onClick={handleSubmit}
            className={`mt-4 flex w-full items-center justify-center gap-2 rounded-[14px] py-3 text-sm font-extrabold transition-all ${
              selectedPlan && !submitting
                ? 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 hover:-translate-y-0.5 hover:shadow-md'
                : 'cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600'
            }`}
          >
            {submitting ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Đang xử lý...
              </>
            ) : (
              <>
                <CreditCard size={15} />
                Thanh toán qua VNPay
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Main ─── */
const MyMonthlyCard = () => {
  const { t } = useTranslation();
  const [cardInfo, setCardInfo]     = useState(null);
  const [loadingCard, setLoadingCard] = useState(true);
  const [submitting, setSubmitting]   = useState(false);

  const fetchCardInfo = useCallback(async () => {
    setLoadingCard(true);
    try {
      const response = await api.get('/MonthlyCard/my-card');
      const data = unwrapData(response.data);
      setCardInfo(data?.card ?? data);
    } catch (error) {
      if (error.response?.status !== 404) console.error('Load card error:', error.response?.data);
      setCardInfo(null);
    } finally {
      setLoadingCard(false);
    }
  }, []);

  useEffect(() => { fetchCardInfo(); }, [fetchCardInfo]);

  const handleRegister = async (values) => {
    setSubmitting(true);
    try {
      const response = await api.post('/MonthlyCard/register', {
        tariffId: Number(values.vehicleTypeId),
        durationMonths: Number(values.durationInMonths)
      });
      const paymentUrl = getPaymentUrl(response.data);
      if (paymentUrl) { window.location.href = paymentUrl; return; }
      alert(response.data?.message || t('monthlyCard.errors.noPaymentUrl'));
    } catch (error) {
      const status = error.response?.status;
      alert(error.response?.data?.message || error.response?.data?.error || (status === 403 ? t('monthlyCard.errors.noRegisterPermission') : t('monthlyCard.errors.createRegistration')));
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingCard) return <LoadingSkeleton />;
  if (cardInfo)   return <ActiveCardView cardInfo={cardInfo} onRefresh={fetchCardInfo} t={t} />;
  return <RegistrationView onRegister={handleRegister} submitting={submitting} t={t} />;
};

export default MyMonthlyCard;
