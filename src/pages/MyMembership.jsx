import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bike,
  CalendarCheck,
  CalendarX2,
  Car,
  CheckCircle2,
  CreditCard,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Ticket,
  Truck,
  Wallet,
  X,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast as message } from '../components/ToastProvider';
import { membershipService } from '../services/membershipService';
import { formatDateTimeVN } from '../utils/dateTime';
import { getVehicleTypeLabel } from '../utils/i18nLabels';

const PLANS = [
  { id: 1, key: 'Bicycle', Icon: Bike, price: 120000, accent: 'emerald' },
  { id: 2, key: 'Motorbike', Icon: Truck, price: 250000, accent: 'indigo' },
  { id: 3, key: 'Car', Icon: Car, price: 1500000, accent: 'rose' },
];

const DURATIONS = [
  { value: 1, discount: null },
  { value: 6, discount: '5%' },
  { value: 12, discount: '10%' },
];

const accentCls = {
  emerald: { icon: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30', bar: 'bg-emerald-500' },
  indigo: { icon: 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30', bar: 'bg-indigo-500' },
  rose: { icon: 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30', bar: 'bg-rose-500' },
};

const getValue = (source, ...keys) => {
  for (const key of keys) {
    if (source?.[key] !== undefined && source?.[key] !== null) return source[key];
  }
  return undefined;
};

const unwrapCards = (payload) => {
  const data = payload?.data ?? payload;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.cards)) return data.cards;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.cards)) return data.data.cards;
  if (data?.card) return [data.card];
  return [];
};

const unwrapArray = (payload) => {
  const data = payload?.data ?? payload;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.tiers)) return data.tiers;
  if (Array.isArray(data?.slots)) return data.slots;
  return [];
};

const formatDateTime = (value) => {
  if (!value) return 'Chưa cập nhật';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return formatDateTimeVN(date);
};

const getTierId = (tier) => getValue(tier, 'tierId', 'id', 'membershipTierId');
const getTierTypeId = (tier) => Number(getValue(tier, 'typeId', 'vehicleTypeId', 'tariffId'));
const getTierDuration = (tier) => Number(getValue(tier, 'durationMonths', 'durationInMonths', 'months'));
const getSlotId = (slot) => Number(getValue(slot, 'slotId', 'id', 'SlotId'));
const getSlotName = (slot, t) => getValue(slot, 'slotName', 'name', 'SlotName') || t('membership.slotFallback', { id: getSlotId(slot) });

const getTierPrice = (tier, fallback = 0) => {
  const totalPrice = Number(getValue(tier, 'price', 'totalPrice', 'amount'));
  if (Number.isFinite(totalPrice) && totalPrice > 0) return totalPrice;

  const monthlyPrice = Number(getValue(tier, 'monthlyPrice'));
  const duration = getTierDuration(tier) || 1;
  return Number.isFinite(monthlyPrice) && monthlyPrice > 0 ? monthlyPrice * duration : fallback;
};

function groupMembershipCards(cards) {
  const groups = {};

  cards.forEach((card) => {
    const tier = card?.tier || {};
    const tierId = getValue(tier, 'tierId', 'id') || getValue(card, 'tierId', 'membershipTierId') || 'unknown';
    const startTime = getValue(card, 'startTime', 'startDate', 'StartTime', 'StartDate') || '';
    const endTime = getValue(card, 'endTime', 'endDate', 'EndTime', 'EndDate') || '';
    const key = `${tierId}_${startTime}_${endTime}`;

    if (!groups[key]) {
      groups[key] = {
        tier: {
          tierId,
          tierName: getValue(tier, 'tierName', 'name') || getValue(card, 'tierName') || 'Membership',
          typeId: getTierTypeId(tier) || Number(getValue(card, 'typeId', 'vehicleTypeId', 'tariffId')),
          durationMonths: getTierDuration(tier) || Number(getValue(card, 'durationMonths')),
        },
        startTime,
        endTime,
        vehicles: getValue(card, 'vehicles', 'licenseVehicles') || [],
        slots: [],
      };
    }

    groups[key].slots.push(card);
  });

  return Object.values(groups);
}

const LoadingSkeleton = () => (
  <div className="mx-auto max-w-5xl px-4 py-8 animate-pulse space-y-4">
    <div className="h-56 rounded-2xl bg-slate-200 dark:bg-slate-800" />
    <div className="h-40 rounded-2xl bg-slate-200 dark:bg-slate-800" />
  </div>
);

const ActiveMembershipView = ({ cards, onRefresh, onCancel, t }) => {
  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 py-8">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
            <ShieldCheck size={21} />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-100">Membership đang hoạt động</h1>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Quét mã QR khi vào/ra bãi đỗ.</p>
          </div>
        </div>
        <button
          onClick={onRefresh}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-[14px] border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
        >
          <RefreshCw size={14} />
          {t('membership.refresh')}
        </button>
      </div>

      {cards.map((card, idx) => {
        const tier = card?.tier || {};
        const plan = PLANS.find((item) => item.id === Number(getValue(tier, 'typeId', 'vehicleTypeId'))) || PLANS[1];
        const { Icon } = plan;
        const cls = accentCls[plan.accent];
        const now = new Date();
        const start = card.startTime ? new Date(card.startTime) : now;
        const end = card.endTime ? new Date(card.endTime) : now;
        const totalMs = end - start;
        const usedMs = now - start;
        const daysLeft = Math.max(0, Math.ceil((end - now) / 86400000));
        const progressPct = totalMs > 0 ? Math.min(100, Math.max(0, (usedMs / totalMs) * 100)) : 0;
        const ticketCode = getValue(card, 'ticketCode', 'TicketCode');
        const slots = card.slots || [];
        const vehicles = card.vehicles || [];
        const qrUrl = ticketCode
          ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(ticketCode)}&bgcolor=ffffff&color=1e293b&margin=10`
          : '';

        return (
          <div key={card.membershipCardId || idx} className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
            {/* Header */}
            <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 dark:border-slate-700 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${cls.icon}`}>
                  <Icon size={24} />
                </div>
                <div>
                  <div className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-slate-100 bg-slate-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                    <ShieldCheck size={10} />
                    {t('membership.label')}
                  </div>
                  <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                    {getValue(tier, 'tierName', 'name') || 'Membership'}
                  </h2>
                  <p className="mt-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {getVehicleTypeLabel(plan.key, t)} · {slots.length} ô đỗ · {vehicles.length} biển số
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="text-right">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Hiệu lực</p>
                  <p className="mt-1 text-sm font-extrabold text-slate-800 dark:text-slate-100">{formatDateTime(card.startTime)}</p>
                  <p className="text-xs font-medium text-slate-500">đến {formatDateTime(card.endTime)}</p>
                </div>
                <button
                  onClick={() => onCancel(card.membershipCardId)}
                  className="inline-flex items-center gap-1.5 rounded-[10px] border border-rose-200 bg-white px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:border-rose-500/40 dark:bg-transparent dark:hover:bg-rose-500/10"
                >
                  <X size={12} /> Hủy thẻ
                </button>
              </div>
            </div>

            {/* Progress */}
            <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-700">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t('membership.validityPeriod')}</span>
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{t('membership.daysLeft', { count: daysLeft })}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div className={`h-full rounded-full transition-all duration-700 ${cls.bar}`} style={{ width: `${Math.max(2, 100 - progressPct)}%` }} />
              </div>
            </div>

            {/* Body: QR + Slots + Vehicles */}
            <div className="grid gap-4 p-5 md:grid-cols-3">
              {/* QR Code */}
              <div className="flex flex-col items-center rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Mã QR check-in</p>
                {qrUrl ? (
                  <img src={qrUrl} alt={`QR ${ticketCode}`} className="h-40 w-40 object-contain rounded-xl" />
                ) : (
                  <div className="flex h-40 w-40 items-center justify-center rounded-xl bg-slate-200 text-slate-400">
                    <QrCode size={32} />
                  </div>
                )}
                <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-white px-2 py-1.5 dark:bg-slate-900">
                  <Ticket size={12} className="shrink-0 text-slate-400" />
                  <span className="break-all font-mono text-[10px] font-extrabold tracking-wider text-slate-700 dark:text-slate-200">{ticketCode}</span>
                </div>
              </div>

              {/* Slots */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Ô đỗ xe cố định</p>
                <div className="space-y-2">
                  {slots.length > 0 ? slots.map((s) => (
                    <div key={s.slotId} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 dark:bg-slate-900">
                      <CalendarCheck size={14} className="shrink-0 text-emerald-500" />
                      <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100">{s.slotName}</span>
                      <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">Reserved</span>
                    </div>
                  )) : (
                    <p className="text-xs text-slate-400">Chưa có ô đỗ</p>
                  )}
                </div>
              </div>

              {/* Vehicles */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Biển số đăng ký</p>
                <div className="space-y-2">
                  {vehicles.length > 0 ? vehicles.map((plate) => (
                    <div key={plate} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 dark:bg-slate-900">
                      <CheckCircle2 size={14} className="shrink-0 text-indigo-500" />
                      <span className="font-mono text-sm font-extrabold tracking-wider text-slate-900 dark:text-slate-100">{plate}</span>
                    </div>
                  )) : (
                    <p className="text-xs text-slate-400">Chưa có biển số</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const RegistrationView = ({ onRegister, submitting, t }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialVehicleTypeId = Number(searchParams.get('vehicleTypeId')) || null;
  const initialDuration = Number(searchParams.get('durationMonths')) || 1;
  const initialSlotId = Number(searchParams.get('slotIds')) || null;
  const initialSlotName = searchParams.get('selectedSlotName') || '';

  const [selectedTypeId, setSelectedTypeId] = useState(initialVehicleTypeId);
  const [selectedDuration, setSelectedDuration] = useState([1, 6, 12].includes(initialDuration) ? initialDuration : 1);
  const [tiers, setTiers] = useState([]);
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [selectedSlotName, setSelectedSlotName] = useState('');
  const [licenseVehicles, setLicenseVehicles] = useState(['']);
  const [paymentMethod, setPaymentMethod] = useState('VNPAY');
  const [loadingTiers, setLoadingTiers] = useState(false);

  useEffect(() => {
    if (initialSlotId) setSelectedSlotId(initialSlotId);
    if (initialSlotName) setSelectedSlotName(initialSlotName);
  }, [initialSlotId, initialSlotName]);

  useEffect(() => {
    const fetchTiers = async () => {
      setLoadingTiers(true);
      try {
        const response = await membershipService.getMembershipTiers();
        setTiers(unwrapArray(response));
      } catch (error) {
        console.error('Membership tiers error:', error);
        message.error(t('membership.errors.loadTiers'));
      } finally {
        setLoadingTiers(false);
      }
    };

    fetchTiers();
  }, []);

  const selectedTier = useMemo(() => {
    return tiers.find((tier) =>
      Number(getTierTypeId(tier)) === Number(selectedTypeId) &&
      Number(getTierDuration(tier)) === Number(selectedDuration)
    );
  }, [selectedDuration, selectedTypeId, tiers]);

  const maxVehicles = Number(getValue(selectedTier, 'maxVehicles', 'vehicleLimit')) || 1;
  const plan = PLANS.find((item) => item.id === Number(selectedTypeId));
  const cls = plan ? accentCls[plan.accent] : null;
  const fallbackPrice = plan ? plan.price * selectedDuration : 0;
  const totalPrice = selectedTier ? getTierPrice(selectedTier, fallbackPrice) : fallbackPrice;

  const clearSelectedSlot = () => {
    setSelectedSlotId(null);
    setSelectedSlotName('');
  };

  const handleSelectType = (typeId) => {
    setSelectedTypeId(typeId);
    clearSelectedSlot();
  };

  const handleSelectDuration = (duration) => {
    setSelectedDuration(duration);
    clearSelectedSlot();
  };

  const openParkingMapForSlot = () => {
    if (!selectedTypeId || !selectedTier) {
      message.error('Vui lòng chọn loại xe và thời hạn trước.');
      return;
    }

    const params = new URLSearchParams({
      selectForMembership: 'true',
      vehicleTypeId: String(selectedTypeId),
      durationMonths: String(selectedDuration),
    });
    navigate(`/parking-map?${params.toString()}`);
  };

  const updatePlate = (index, value) => {
    setLicenseVehicles((prev) => prev.map((plate, idx) => (idx === index ? value : plate)));
  };

  const addPlate = () => {
    if (licenseVehicles.length >= maxVehicles) {
      message.error(t('membership.errors.maxLicensePlates', { count: maxVehicles }));
      return;
    }
    setLicenseVehicles((prev) => [...prev, '']);
  };

  const removePlate = (index) => {
    setLicenseVehicles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = () => {
    if (!selectedTier) {
      message.error(t('membership.errors.selectValidPackage'));
      return;
    }

    if (!selectedSlotId) {
      message.error('Vui lòng chọn 1 ô đỗ cố định.');
      return;
    }

    const plates = licenseVehicles
      .map((plate) => plate.trim().toUpperCase())
      .filter(Boolean);

    if (!plates.length) {
      message.error(t('membership.errors.enterLicensePlate'));
      return;
    }

    if (plates.length > maxVehicles) {
      message.error(t('membership.errors.maxLicensePlates', { count: maxVehicles }));
      return;
    }

    onRegister({
      tierId: getTierId(selectedTier),
      slotIds: [selectedSlotId],
      licenseVehicles: plates,
      paymentMethod,
    });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-8">
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-500/15">
            <CreditCard size={19} className="text-indigo-600 dark:text-indigo-300" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-slate-100">Đăng ký Membership</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Chọn gói, 1 ô đỗ cố định và thanh toán một lần.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{t('membership.selectVehicleType')}</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {PLANS.map((item) => {
                const PIcon = item.Icon;
                const itemCls = accentCls[item.accent];
                const isSelected = selectedTypeId === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectType(item.id)}
                    className={`relative rounded-xl border-2 p-4 text-left transition-all duration-150 ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10 shadow-sm'
                        : 'border-slate-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-500/30'
                    }`}
                  >
                    {isSelected && <CheckCircle2 size={16} className="absolute right-3 top-3 text-indigo-600 dark:text-indigo-400" />}
                    <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl border ${itemCls.icon}`}>
                      <PIcon size={20} />
                    </div>
                    <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">{getVehicleTypeLabel(item.key, t)}</p>
                    <p className="mt-0.5 text-xs font-semibold text-slate-400">{t('membership.membershipParking')}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{t('membership.registrationDuration')}</p>
            <div className="grid grid-cols-3 gap-3">
              {DURATIONS.map((duration) => {
                const isSelected = selectedDuration === duration.value;
                const tierExists = !selectedTypeId || tiers.some((tier) => Number(getTierTypeId(tier)) === Number(selectedTypeId) && Number(getTierDuration(tier)) === Number(duration.value));
                return (
                  <button
                    key={duration.value}
                    disabled={!tierExists}
                    onClick={() => handleSelectDuration(duration.value)}
                    className={`relative rounded-xl border-2 py-3 text-center transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10'
                        : 'border-slate-100 dark:border-slate-700 hover:border-indigo-200'
                    }`}
                  >
                    {duration.discount && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-rose-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                        -{duration.discount}
                      </span>
                    )}
                    <p className={`text-sm font-extrabold ${isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}`}>{duration.label}</p>
                    <p className="mt-1 text-[10px] font-semibold text-slate-400">{1} ô đỗ</p>
                  </button>
                );
              })}
            </div>
            {selectedTypeId && !selectedTier && !loadingTiers && (
              <p className="mt-3 text-xs font-semibold text-rose-500">{t('membership.noTierConfig')}</p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Chọn 1 ô đỗ cố định</p>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-300">
                {selectedSlotId ? 'Đã chọn 1 ô đỗ' : 'Chưa chọn ô đỗ'}
              </span>
            </div>

            <div className="mb-4 flex flex-col gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
              <div>
                <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                  {selectedSlotId ? selectedSlotName || `Slot ${selectedSlotId}` : 'Chưa có ô đỗ cố định'}
                </p>
                <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                  Mở Parking Map để chọn một ô màu xanh còn trống đúng loại xe đã đăng ký.
                </p>
              </div>
              <button
                type="button"
                disabled={!selectedTier}
                onClick={openParkingMapForSlot}
                className={`inline-flex h-11 items-center justify-center gap-2 rounded-[14px] px-4 text-sm font-extrabold transition ${
                  selectedTier
                    ? 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700'
                    : 'cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-900 dark:text-slate-600'
                }`}
              >
                <CalendarCheck size={16} />
                {selectedSlotId ? 'Đổi ô trên Parking Map' : 'Chọn ô trên Parking Map'}
              </button>
            </div>

            {false && (!selectedTier ? (
              <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-xs font-semibold text-slate-400 dark:border-slate-700">Chọn loại xe và thời hạn trước.</div>
            ) : loadingSlots ? (
              <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-xs font-semibold text-slate-400 dark:border-slate-700">{t('membership.loadingSlots')}</div>
            ) : availableSlots.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-xs font-semibold text-slate-400 dark:border-slate-700">{t('membership.noAvailableSlots')}</div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {availableSlots.map((slot) => {
                  const slotId = getSlotId(slot);
                  const isSelected = selectedSlotId === slotId;
                  return (
                    <button
                      key={slotId}
                      type="button"
                      onClick={() => selectSlot(slotId)}
                      className={`flex items-center justify-between rounded-xl border px-3 py-3 text-left transition-all ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'
                          : 'border-slate-100 bg-slate-50 text-slate-700 hover:border-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      <span className="text-sm font-extrabold">{getSlotName(slot)}</span>
                      <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-600 text-white'
                          : 'border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-900'
                      }`}>
                        {isSelected && <CheckCircle2 size={13} />}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{t('membership.licensePlate')}</p>
              <button type="button" onClick={addPlate} className="text-xs font-bold text-indigo-600 hover:text-indigo-700">{t('membership.addLicensePlate')}</button>
            </div>
            <div className="space-y-2">
              {licenseVehicles.map((plate, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={plate}
                    onChange={(event) => updatePlate(index, event.target.value)}
                    placeholder={t('membership.licensePlatePlaceholder')}
                    className="h-11 flex-1 rounded-[14px] border border-slate-200 bg-slate-50 px-4 text-sm font-bold uppercase tracking-wider text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                  {licenseVehicles.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePlate(index)}
                      className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-rose-200 text-rose-500 hover:bg-rose-50 dark:border-rose-500/40 dark:hover:bg-rose-500/10"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11px] font-medium text-slate-400">{t('membership.maxLicensePlatesHint', { count: maxVehicles })}</p>
          </div>
        </div>

        <div className="flex flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="mb-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{t('membership.registrationSummary')}</p>

          {plan && cls ? (
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${cls.icon}`}>
                  <plan.Icon size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{getVehicleTypeLabel(plan.key, t)}</p>
                  <p className="text-[10px] text-slate-400">{selectedDuration} tháng · 1 ô đỗ</p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('membership.payment')}</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {['VNPAY', 'WALLET'].map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`flex h-10 items-center justify-center gap-2 rounded-xl border text-xs font-extrabold transition ${
                        paymentMethod === method
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'
                          : 'border-slate-200 bg-white text-slate-500 hover:border-indigo-200 dark:border-slate-700 dark:bg-slate-900'
                      }`}
                    >
                      {method === 'WALLET' ? <Wallet size={14} /> : <CreditCard size={14} />}
                      {method === 'WALLET' ? t('wallet.eWallet') : method}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{t('membership.total')}</span>
                  <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">{totalPrice.toLocaleString('vi-VN')} đ</span>
                </div>
              </div>

              <ul className="space-y-1.5 pt-1">
                {['Giữ 1 ô cố định trong suốt thời hạn thẻ', 'Tự động nhận diện biển số', 'Quản lý tập trung trong Membership'].map((perk) => (
                  <li key={perk} className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <CheckCircle2 size={11} className="shrink-0 text-emerald-500" />
                    {t(`membership.perks.${perk}`)}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-10 dark:border-slate-700">
              <Wallet size={26} className="mb-2 text-slate-300 dark:text-slate-600" />
              <p className="text-xs text-slate-400 dark:text-slate-500">{t('membership.choosePackageToViewTotal')}</p>
            </div>
          )}

          <button
            disabled={!selectedTier || submitting}
            onClick={handleSubmit}
            className={`mt-4 flex w-full items-center justify-center gap-2 rounded-[14px] py-3 text-sm font-extrabold transition-all ${
              selectedTier && !submitting
                ? 'bg-indigo-600 text-white shadow-sm hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-md'
                : 'cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600'
            }`}
          >
            {submitting ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                {t('membership.processing')}
              </>
            ) : (
              <>
                <CreditCard size={15} />
                {t('membership.registerTitle')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const MyMembership = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [cards, setCards] = useState([]);
  const [loadingCard, setLoadingCard] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchCardInfo = useCallback(async () => {
    setLoadingCard(true);
    try {
      const response = await membershipService.getMyMembershipCards();
      setCards(unwrapCards(response));
    } catch (error) {
      if (error.response?.status !== 404) console.error('Load membership cards error:', error.response?.data || error);
      setCards([]);
    } finally {
      setLoadingCard(false);
    }
  }, []);

  useEffect(() => {
    fetchCardInfo();
  }, [fetchCardInfo]);

  const handleCancel = async (cardId) => {
    if (!window.confirm('Bạn có chắc muốn hủy thẻ thành viên? Hành động này không thể hoàn tác và slot sẽ được giải phóng.')) return;
    try {
      await membershipService.cancelMembershipCard(cardId);
      message.success('Đã hủy thẻ thành viên thành công.');
      fetchCardInfo();
    } catch {
      message.error('Không thể hủy thẻ. Vui lòng thử lại.');
    }
  };

  const handleRegister = async (payload) => {
    setSubmitting(true);
    try {
      const result = await membershipService.registerMembershipCard(payload);
      const paymentUrl = getValue(result, 'paymentUrl', 'paymentURL', 'PaymentUrl', 'PaymentURL', 'vnpayUrl', 'vnPayUrl', 'url', 'Url')
        || getValue(result?.data, 'paymentUrl', 'paymentURL', 'PaymentUrl', 'PaymentURL', 'vnpayUrl', 'vnPayUrl', 'url', 'Url');

      if (paymentUrl) {
        window.location.href = paymentUrl;
        return;
      }

      navigate('/membership/success', { state: { result } });
    } catch (error) {
      const status = error.response?.status;
      message.error(error.message || (status === 403 ? 'Tài khoản chưa có quyền đăng ký Membership.' : 'Không thể tạo đăng ký Membership.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingCard) return <LoadingSkeleton />;
  if (cards.length > 0) return <ActiveMembershipView cards={cards} onRefresh={fetchCardInfo} onCancel={handleCancel} t={t} />;
  return <RegistrationView onRegister={handleRegister} submitting={submitting} t={t} />;
};

export default MyMembership;
