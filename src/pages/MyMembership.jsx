import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bike,
  CalendarCheck,
  CalendarX2,
  Car,
  CheckCircle2,
  CreditCard,
  Info,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Ticket,
  Wallet,
  X,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast as message } from '../components/ToastProvider';
import { membershipService } from '../services/membershipService';
import { formatDateTimeVN, parseUtcDate } from '../utils/dateTime';
import { getVehicleTypeLabel } from '../utils/i18nLabels';
import bikeIcon from '../assets/vehicles/bike.png';
import motorbikeIcon from '../assets/vehicles/motorbike.png';
import carIcon from '../assets/vehicles/car.png';

const getVehicleLabel = (vehicleType, t) => {
  const typeStr = String(vehicleType ?? '').trim().toLowerCase();
  if (typeStr === '1' || typeStr === 'bicycle' || typeStr === 'bike') {
    return t('membershipRegister.vehicle.bicycle');
  }
  if (typeStr === '2' || typeStr === 'motorbike' || typeStr === 'motorcycle') {
    return t('membershipRegister.vehicle.motorbike');
  }
  if (typeStr === '3' || typeStr === 'car') {
    return t('membershipRegister.vehicle.car');
  }
  return vehicleType;
};

const getDurationLabel = (durationMonths, t) => {
  const months = Number(durationMonths);
  if (months === 1) return t('membershipRegister.duration.month1');
  if (months === 6) return t('membershipRegister.duration.month6');
  if (months === 12) return t('membershipRegister.duration.month12');
  return t('membership.durationMonths', { count: months });
};

const getVehicleIcon = (vehicleTypeOrId) => {
  const typeStr = String(vehicleTypeOrId ?? '').trim().toLowerCase();
  if (typeStr === '1' || typeStr === 'bicycle' || typeStr === 'bike') {
    return bikeIcon;
  }
  if (typeStr === '2' || typeStr === 'motorbike' || typeStr === 'motorcycle') {
    return motorbikeIcon;
  }
  if (typeStr === '3' || typeStr === 'car') {
    return carIcon;
  }
  return null;
};

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

const PLANS = [
  { id: 1, key: 'Bicycle', Icon: Bike, price: 120000, accent: 'emerald' },
  { id: 2, key: 'Motorbike', Icon: Motorcycle, price: 250000, accent: 'indigo' },
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
  return formatDateTimeVN(value, value);
};

const getTierId = (tier) => getValue(tier, 'tierId', 'id', 'membershipTierId');
const getTierTypeId = (tier) => {
  const typeId = Number(getValue(tier, 'typeId', 'vehicleTypeId', 'tariffId'));
  if (typeId === 1 || typeId === 2 || typeId === 3) return typeId;

  const raw = String(getValue(tier, 'vehicleType', 'VehicleType', 'vehicleTypeName', 'VehicleTypeName', 'typeName', 'TypeName', 'tierName', 'TierName', 'name') || '').toLowerCase();
  if (raw.includes('bicycle') || raw.includes('bike') || raw.includes('xe đạp') || raw.includes('xe dap')) return 1;
  if (raw.includes('motor') || raw.includes('scooter') || raw.includes('xe máy') || raw.includes('xe may')) return 2;
  if (raw.includes('car') || raw.includes('ô tô') || raw.includes('oto')) return 3;

  return 2;
};
const getTierDuration = (tier) => Number(getValue(tier, 'durationMonths', 'durationInMonths', 'months'));
const getSlotId = (slot) => Number(getValue(slot, 'slotId', 'id', 'SlotId'));
const getSlotName = (slot, t) => getValue(slot, 'slotName', 'name', 'SlotName') || t('membership.slotFallback', { id: getSlotId(slot) });

const getCardTypeId = (card) => {
  const tier = card?.tier || card?.Tier || {};
  const typeId = Number(
    getValue(card, 'typeId', 'TypeId', 'vehicleTypeId', 'VehicleTypeId') ||
    getValue(tier, 'typeId', 'TypeId', 'vehicleTypeId', 'VehicleTypeId')
  );
  if (typeId === 1 || typeId === 2 || typeId === 3) return typeId;

  const raw = String(
    getValue(card, 'vehicleType', 'VehicleType', 'vehicleTypeName', 'VehicleTypeName', 'typeName', 'TypeName') ||
    getValue(tier, 'vehicleType', 'VehicleType', 'vehicleTypeName', 'VehicleTypeName', 'typeName', 'TypeName', 'tierName', 'TierName') ||
    getValue(card, 'tierName', 'TierName') ||
    ''
  ).toLowerCase();

  if (raw.includes('bicycle') || raw.includes('bike') || raw.includes('xe đạp') || raw.includes('xe dap')) return 1;
  if (raw.includes('motor') || raw.includes('scooter') || raw.includes('xe máy') || raw.includes('xe may')) return 2;
  if (raw.includes('car') || raw.includes('ô tô') || raw.includes('oto')) return 3;

  return 2;
};

const getCardVehicles = (card) => {
  const vehicles = getValue(card, 'licenseVehicles', 'LicenseVehicles', 'vehicles', 'Vehicles') || [];
  const list = Array.isArray(vehicles) ? vehicles : [vehicles];
  return list
    .map((vehicle) => (
      typeof vehicle === 'string'
        ? vehicle
        : getValue(vehicle, 'licenseVehicle', 'LicenseVehicle', 'plate', 'Plate')
    ))
    .filter(Boolean);
};

const getCardSlots = (card) => {
  const slots = getValue(card, 'slots', 'Slots', 'membershipSlots', 'MembershipSlots') || [];
  if (Array.isArray(slots) && slots.length) return slots;

  const slotId = getValue(card, 'slotId', 'SlotId');
  const slotName = getValue(card, 'slotName', 'SlotName');
  const slotStatus = getValue(card, 'slotStatus', 'SlotStatus');
  return slotId || slotName ? [{ slotId, slotName, slotStatus }] : [];
};

const getTierPrice = (tier, fallback = 0) => {
  const totalPrice = Number(getValue(tier, 'price', 'totalPrice', 'amount'));
  if (Number.isFinite(totalPrice) && totalPrice > 0) return totalPrice;

  const monthlyPrice = Number(getValue(tier, 'monthlyPrice'));
  const duration = getTierDuration(tier) || 1;
  return Number.isFinite(monthlyPrice) && monthlyPrice > 0 ? monthlyPrice * duration : fallback;
};

const normalizeMembershipCard = (card) => {
  const tier = card?.tier || card?.Tier || {};
  const typeId = getCardTypeId(card);

  return {
    ...card,
    membershipCardId: getValue(card, 'membershipCardId', 'MembershipCardId', 'id', 'Id'),
    ticketCode: getValue(card, 'ticketCode', 'TicketCode'),
    startTime: getValue(card, 'startTime', 'startDate', 'StartTime', 'StartDate') || '',
    endTime: getValue(card, 'endTime', 'endDate', 'EndTime', 'EndDate') || '',
    tier: {
      tierId: getValue(tier, 'tierId', 'TierId', 'id') || getValue(card, 'tierId', 'TierId', 'membershipTierId'),
      tierName: getValue(tier, 'tierName', 'TierName', 'name') || getValue(card, 'tierName', 'TierName') || 'Membership',
      typeId,
      durationMonths: getTierDuration(tier) || Number(getValue(card, 'durationMonths', 'DurationMonths')),
    },
    vehicles: getCardVehicles(card),
    slots: getCardSlots(card),
  };
};

const normalizeMembershipCards = (cards) => cards.map(normalizeMembershipCard);

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
            <h1 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-100">{t('membershipRegister.activeTitle')}</h1>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('membershipRegister.activeSubtitle')}</p>
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
        const cls = accentCls[plan.accent];
        const now = new Date();
        const start = parseUtcDate(card.startTime) || now;
        const end = parseUtcDate(card.endTime) || now;
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
                  <img
                    src={getVehicleIcon(plan.key)}
                    alt={plan.key}
                    className="h-8 w-8 object-contain dark:brightness-125 dark:contrast-125 dark:opacity-90 dark:bg-white/10 dark:ring-1 dark:ring-white/10 rounded-lg p-0.5"
                  />
                </div>
                <div>
                  <div className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-slate-100 bg-slate-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                    <ShieldCheck size={10} />
                    {t('membership.label')}
                  </div>
                  <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                    {t('membershipRegister.summary.tierNamePattern', {
                      vehicle: getVehicleLabel(plan.key, t),
                      duration: getDurationLabel(tier.durationMonths, t)
                    })}
                  </h2>
                  <p className="mt-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {getVehicleLabel(plan.key, t)} · {t('membershipRegister.slotsCount', { count: slots.length })} · {t('membershipRegister.platesCount', { count: vehicles.length })}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="text-right">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t('membershipRegister.validity')}</p>
                  <p className="mt-1 text-sm font-extrabold text-slate-800 dark:text-slate-100">{formatDateTime(card.startTime)}</p>
                  <p className="text-xs font-medium text-slate-500">{t('membershipRegister.to')} {formatDateTime(card.endTime)}</p>
                </div>
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
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('membershipRegister.qrCheckIn')}</p>
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
                <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('membershipRegister.fixedSlotTitle')}</p>
                <div className="space-y-2">
                  {slots.length > 0 ? slots.map((s) => (
                    <div key={getValue(s, 'slotId', 'SlotId', 'slotName', 'SlotName')} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 dark:bg-slate-900">
                      <CalendarCheck size={14} className="shrink-0 text-emerald-500" />
                      <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                        {getValue(s, 'slotName', 'SlotName') || t('membership.slotFallback', { id: getValue(s, 'slotId', 'SlotId') })}
                      </span>
                      <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                        {getValue(s, 'slotStatus', 'SlotStatus') || 'Reserved'}
                      </span>
                    </div>
                  )) : (
                    <p className="text-xs text-slate-400 dark:text-slate-500">{t('membershipRegister.noSlot')}</p>
                  )}
                </div>
              </div>

              {/* Vehicles */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('membershipRegister.registeredPlates')}</p>
                <div className="space-y-2">
                  {vehicles.length > 0 ? vehicles.map((plate) => (
                    <div key={plate} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 dark:bg-slate-900">
                      <CheckCircle2 size={14} className="shrink-0 text-indigo-500" />
                      <span className="font-mono text-sm font-extrabold tracking-wider text-slate-900 dark:text-slate-100">{plate}</span>
                    </div>
                  )) : (
                    <p className="text-xs text-slate-400 dark:text-slate-500">{t('membershipRegister.noPlate')}</p>
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

const RegistrationView = ({ onRegister, submitting, activeTypeIds = [], t }) => {
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
  const [paymentMethod, setPaymentMethod] = useState('AUTO');
  const [loadingTiers, setLoadingTiers] = useState(false);
  const activeTypeIdSet = useMemo(() => new Set(activeTypeIds.map(Number)), [activeTypeIds]);
  const availablePlans = useMemo(() => PLANS.filter((planItem) => !activeTypeIdSet.has(Number(planItem.id))), [activeTypeIdSet]);

  useEffect(() => {
    if (selectedTypeId && !activeTypeIdSet.has(Number(selectedTypeId))) return;

    const nextPlan = availablePlans[0];
    setSelectedTypeId(nextPlan?.id || null);
    clearSelectedSlot();
  }, [activeTypeIdSet, availablePlans, selectedTypeId]);

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
    if (activeTypeIdSet.has(Number(typeId))) {
      message.info(t('membershipRegister.errors.alreadyActive'));
      return;
    }

    setSelectedTypeId(typeId);
    clearSelectedSlot();
  };

  const handleSelectDuration = (duration) => {
    setSelectedDuration(duration);
    clearSelectedSlot();
  };

  const openParkingMapForSlot = () => {
    if (!selectedTypeId || !selectedTier) {
      message.error(t('membershipRegister.errors.selectVehicleDurationFirst'));
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
      message.error(t('membershipRegister.errors.selectFixedSlot'));
      return;
    }

    let plates = [];
    if (selectedTypeId === 1) {
      // Xe đạp: backend tự sinh BIKE_... dựa trên maxVehicles.
      // Chúng ta truyền biển ảo tạm thời để qua validation.
      for (let i = 0; i < maxVehicles; i++) {
        plates.push(`BIKE_TEMP_${i}`);
      }
    } else {
      plates = licenseVehicles
        .map((plate) => plate.trim().toUpperCase())
        .filter(Boolean);
      const uniquePlates = new Set(plates);

      if (!plates.length) {
        message.error(t('membership.errors.enterLicensePlate'));
        return;
      }

      if (uniquePlates.size !== plates.length) {
        message.error(t('membershipRegister.errors.duplicatePlates'));
        return;
      }

      if (plates.length > maxVehicles) {
        message.error(t('membership.errors.maxLicensePlates', { count: maxVehicles }));
        return;
      }
    }

    onRegister({
      tierId: getTierId(selectedTier),
      slotId: selectedSlotId,
      slotIds: [selectedSlotId],
      licenseVehicles: plates,
      paymentMethod,
    });
  };

  if (!availablePlans.length) {
    return (
      <div className="mx-auto max-w-5xl px-4 pb-8">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 text-sm font-semibold text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          {t('membershipRegister.allVehicleTypesActive')}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-8">
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-500/15">
            <CreditCard size={19} className="text-indigo-600 dark:text-indigo-300" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-slate-100">{t('membershipRegister.title')}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t('membershipRegister.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{t('membershipRegister.vehicle.title')}</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {PLANS.map((item) => {
                const itemCls = accentCls[item.accent];
                const isSelected = selectedTypeId === item.id;
                const isActiveType = activeTypeIdSet.has(Number(item.id));
                return (
                  <button
                    key={item.id}
                    disabled={isActiveType}
                    onClick={() => handleSelectType(item.id)}
                    className={`relative rounded-xl border-2 p-4 text-left transition-all duration-150 ${isSelected
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10 shadow-sm'
                        : 'border-slate-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-500/30'
                      } ${isActiveType ? 'cursor-not-allowed opacity-50' : ''}`}
                  >
                    {isSelected && <CheckCircle2 size={16} className="absolute right-3 top-3 text-indigo-600 dark:text-indigo-400" />}
                    <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl border ${itemCls.icon}`}>
                      <img
                        src={getVehicleIcon(item.key)}
                        alt={item.key}
                        className="h-7 w-7 object-contain dark:brightness-125 dark:contrast-125 dark:opacity-90 dark:bg-white/10 dark:ring-1 dark:ring-white/10 rounded-lg p-0.5"
                      />
                    </div>
                    <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">{getVehicleLabel(item.key, t)}</p>
                    <p className="mt-0.5 text-xs font-semibold text-slate-400 dark:text-slate-500">
                      {isActiveType ? t('membershipRegister.vehicle.alreadyActive') : t('membershipRegister.vehicle.description')}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{t('membershipRegister.duration.title')}</p>
            <div className="grid grid-cols-3 gap-3">
              {DURATIONS.map((duration) => {
                const isSelected = selectedDuration === duration.value;
                const tierExists = !selectedTypeId || tiers.some((tier) => Number(getTierTypeId(tier)) === Number(selectedTypeId) && Number(getTierDuration(tier)) === Number(duration.value));
                return (
                  <button
                    key={duration.value}
                    disabled={!tierExists}
                    onClick={() => handleSelectDuration(duration.value)}
                    className={`relative rounded-xl border-2 py-3 text-center transition-all disabled:cursor-not-allowed disabled:opacity-40 ${isSelected
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10'
                        : 'border-slate-100 dark:border-slate-700 hover:border-indigo-200'
                      }`}
                  >
                    {duration.discount && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-rose-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                        -{duration.discount}
                      </span>
                    )}
                    <p className={`text-sm font-extrabold ${isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}`}>
                      {getDurationLabel(duration.value, t)}
                    </p>
                    <p className="mt-1 text-[10px] font-semibold text-slate-400">{t('membershipRegister.slot.fixedSlot')}</p>
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
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{t('membershipRegister.slot.title')}</p>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-300">
                {selectedSlotId ? t('membershipRegister.slot.selectedCount') : t('membershipRegister.slot.noSlotSelected')}
              </span>
            </div>

            <div className="mb-4 flex flex-col gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
              <div>
                <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                  {selectedSlotId ? selectedSlotName || `Slot ${selectedSlotId}` : t('membershipRegister.slot.none')}
                </p>
                <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                  {t('membershipRegister.slot.instruction')}
                </p>
              </div>
              <button
                type="button"
                disabled={!selectedTier}
                onClick={openParkingMapForSlot}
                className={`inline-flex h-11 items-center justify-center gap-2 rounded-[14px] px-4 text-sm font-extrabold transition ${selectedTier
                    ? 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700'
                    : 'cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-900 dark:text-slate-600'
                  }`}
              >
                <CalendarCheck size={16} />
                {selectedSlotId ? t('membershipRegister.slot.changeOnMap') : t('membershipRegister.slot.selectOnMap')}
              </button>
            </div>
          </div>

          {selectedTypeId !== 1 ? (
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{t('membershipRegister.plate.title')}</p>
                <button type="button" onClick={addPlate} className="text-xs font-bold text-indigo-600 hover:text-indigo-700">{t('membershipRegister.plate.add')}</button>
              </div>
              <div className="space-y-2">
                {licenseVehicles.map((plate, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={plate}
                      onChange={(event) => updatePlate(index, event.target.value)}
                      placeholder={t('membershipRegister.plate.placeholder')}
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
              <p className="mt-2 text-[11px] font-medium text-slate-400">{t('membershipRegister.plate.maxHint', { count: maxVehicles })}</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/30 p-5 shadow-sm dark:border-indigo-500/20 dark:bg-indigo-950/20">
              <div className="flex items-start gap-3">
                <Info className="mt-0.5 shrink-0 text-indigo-600 dark:text-indigo-400" size={18} />
                <div>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Định danh xe đạp tự động</p>
                  <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-500 dark:text-slate-400">
                    Xe đạp không có biển số truyền thống. Khi đăng ký thành công, hệ thống sẽ tự động sinh mã định danh cố định dạng <code className="font-mono text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded border border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/20">BIKE_XXXXXXXX</code> cho tài khoản của bạn để vào/ra bãi xe.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="mb-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{t('membershipRegister.summary.title')}</p>

          {plan && cls ? (
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${cls.icon}`}>
                  <img
                    src={getVehicleIcon(plan.key)}
                    alt={plan.key}
                    className="h-6 w-6 object-contain dark:brightness-125 dark:contrast-125 dark:opacity-90 dark:bg-white/10 dark:ring-1 dark:ring-white/10 rounded-lg p-0.5"
                  />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{getVehicleLabel(plan.key, t)}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">{t('membershipRegister.summary.details', { duration: selectedDuration, slots: 1 })}</p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('membershipRegister.payment.title')}</p>
                <div className="mt-2 grid grid-cols-1 gap-2">
                  {['AUTO', 'VNPAY', 'WALLET'].map((method) => {
                    const getPaymentMethodLabel = (m) => {
                      if (m === 'AUTO') return t('membershipRegister.payment.auto');
                      if (m === 'VNPAY') return t('membershipRegister.payment.vnpay');
                      if (m === 'WALLET') return t('membershipRegister.payment.wallet');
                      return m;
                    };
                    return (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`flex h-10 items-center justify-center gap-2 rounded-xl border text-xs font-extrabold transition ${paymentMethod === method
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'
                            : 'border-slate-200 bg-white text-slate-500 hover:border-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400'
                          }`}
                      >
                        {method === 'VNPAY' ? <CreditCard size={14} /> : <Wallet size={14} />}
                        {getPaymentMethodLabel(method)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{t('membershipRegister.total')}</span>
                  <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">{totalPrice.toLocaleString('vi-VN')} đ</span>
                </div>
              </div>

              <ul className="space-y-1.5 pt-1">
                {[
                  { key: 'fixedSlot', translateKey: 'membershipRegister.perks.fixedSlot' },
                  { key: 'autoPlate', translateKey: 'membershipRegister.perks.autoPlate' },
                  { key: 'centralizedManagement', translateKey: 'membershipRegister.perks.centralizedManagement' }
                ].map((perk) => (
                  <li key={perk.key} className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <CheckCircle2 size={11} className="shrink-0 text-emerald-500" />
                    {t(perk.translateKey)}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-10 dark:border-slate-700">
              <Wallet size={26} className="mb-2 text-slate-300 dark:text-slate-600" />
              <p className="text-xs text-slate-400 dark:text-slate-500">{t('membershipRegister.summary.choosePackageHint')}</p>
            </div>
          )}

          <button
            disabled={!selectedTier || submitting}
            onClick={handleSubmit}
            className={`mt-4 flex w-full items-center justify-center gap-2 rounded-[14px] py-3 text-sm font-extrabold transition-all ${selectedTier && !submitting
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
                {paymentMethod === 'VNPAY'
                  ? t('membershipRegister.actions.payVNPay')
                  : paymentMethod === 'WALLET'
                    ? t('membershipRegister.actions.payWallet')
                    : t('membershipRegister.actions.submit')}
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

  const activeCards = useMemo(() => normalizeMembershipCards(cards), [cards]);
  const activeTypeIds = useMemo(
    () => [...new Set(activeCards.map((card) => getCardTypeId(card)).filter(Boolean))],
    [activeCards]
  );

  const handleCancel = async (cardId) => {
    if (!window.confirm(t('membershipRegister.confirmCancel'))) return;
    try {
      await membershipService.cancelMembershipCard(cardId);
      message.success(t('membershipRegister.cancelSuccess'));
      fetchCardInfo();
    } catch {
      message.error(t('membershipRegister.cancelError'));
    }
  };

  const handleRegister = async (payload) => {
    setSubmitting(true);
    try {
      const result = await membershipService.registerMembershipCard(payload);
      const data = result?.data ?? result ?? {};
      const paymentUrl = getValue(result, 'paymentUrl', 'paymentURL', 'PaymentUrl', 'PaymentURL', 'vnpayUrl', 'vnPayUrl', 'url', 'Url')
        || getValue(result?.data, 'paymentUrl', 'paymentURL', 'PaymentUrl', 'PaymentURL', 'vnpayUrl', 'vnPayUrl', 'url', 'Url');
      const invoiceId = getValue(data, 'invoiceId', 'InvoiceId');
      const paymentStatus = String(getValue(data, 'paymentStatus', 'PaymentStatus') || '').toUpperCase();
      const resultPaymentMethod = String(getValue(data, 'paymentMethod', 'PaymentMethod') || payload.paymentMethod || '').toUpperCase();

      if (paymentUrl) {
        if (invoiceId) localStorage.setItem('pending_invoice_id', String(invoiceId));
        window.location.href = paymentUrl;
        return;
      }

      if (invoiceId && resultPaymentMethod === 'WALLET' && paymentStatus === 'SUCCESS') {
        navigate(`/payment-success?type=membership&invoiceId=${invoiceId}`);
        return;
      }

      navigate('/membership/success', { state: { result } });
    } catch (error) {
      const status = error.response?.status;
      message.error(error.message || (status === 403 ? t('membershipRegister.errors.noRegisterPermission') : t('membershipRegister.errors.createRegistrationError')));
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingCard) return <LoadingSkeleton />;
  return (
    <>
      {activeCards.length > 0 && (
        <ActiveMembershipView cards={activeCards} onRefresh={fetchCardInfo} onCancel={handleCancel} t={t} />
      )}
      <RegistrationView
        activeTypeIds={activeTypeIds}
        onRegister={handleRegister}
        submitting={submitting}
        t={t}
      />
    </>
  );
};

export default MyMembership;
