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
import { useNavigate } from 'react-router-dom';
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
  { value: 1, label: '1 tháng', discount: null },
  { value: 6, label: '6 tháng', discount: '5%' },
  { value: 12, label: '12 tháng', discount: '10%' },
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

const getRequiredSlotCount = (durationMonths) => {
  if (Number(durationMonths) === 1) return 1;
  if (Number(durationMonths) === 6) return 2;
  if (Number(durationMonths) === 12) return 3;
  return 1;
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
const getSlotName = (slot) => getValue(slot, 'slotName', 'name', 'SlotName') || `Slot ${getSlotId(slot)}`;

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

const ActiveMembershipView = ({ cards, onRefresh, t }) => {
  const groups = groupMembershipCards(cards);

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 py-8">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
            <ShieldCheck size={21} />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-100">Membership đang hoạt động</h1>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Mỗi ô đỗ có một mã QR riêng.</p>
          </div>
        </div>
        <button
          onClick={onRefresh}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-[14px] border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
        >
          <RefreshCw size={14} />
          Làm mới
        </button>
      </div>

      {groups.map((group, groupIndex) => {
        const plan = PLANS.find((item) => item.id === Number(group.tier.typeId)) || PLANS[1];
        const { Icon } = plan;
        const cls = accentCls[plan.accent];
        const now = new Date();
        const start = group.startTime ? new Date(group.startTime) : now;
        const end = group.endTime ? new Date(group.endTime) : now;
        const totalMs = end - start;
        const usedMs = now - start;
        const daysLeft = Math.max(0, Math.ceil((end - now) / 86400000));
        const progressPct = totalMs > 0 ? Math.min(100, Math.max(0, (usedMs / totalMs) * 100)) : 0;

        return (
          <div key={`${group.tier.tierId}-${group.startTime}-${groupIndex}`} className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 dark:border-slate-700 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${cls.icon}`}>
                  <Icon size={24} />
                </div>
                <div>
                  <div className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-slate-100 bg-slate-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                    <ShieldCheck size={10} />
                    Membership
                  </div>
                  <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                    {group.tier.tierName}
                  </h2>
                  <p className="mt-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {getVehicleTypeLabel(plan.key, t)} · {group.slots.length} ô đỗ
                  </p>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Hiệu lực</p>
                <p className="mt-1 text-sm font-extrabold text-slate-800 dark:text-slate-100">{formatDateTime(group.startTime)}</p>
                <p className="text-xs font-medium text-slate-500">đến {formatDateTime(group.endTime)}</p>
              </div>
            </div>

            <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-700">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Thời hạn hiệu lực</span>
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{daysLeft} ngày còn lại</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div className={`h-full rounded-full transition-all duration-700 ${cls.bar}`} style={{ width: `${Math.max(2, 100 - progressPct)}%` }} />
              </div>
            </div>

            <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
              {group.slots.map((card, index) => {
                const ticketCode = getValue(card, 'ticketCode', 'TicketCode');
                const slotName = getValue(card, 'slotName', 'SlotName') || getValue(card, 'slot', 'Slot')?.slotName || `Slot ${index + 1}`;
                const slotId = getValue(card, 'slotId', 'SlotId');
                const license = getValue(card, 'licenseVehicle', 'LicenseVehicle') || getValue(card, 'licensePlate');
                const qrUrl = ticketCode
                  ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(ticketCode)}&bgcolor=ffffff&color=1e293b&margin=10`
                  : '';

                return (
                  <div key={ticketCode || `${slotId}-${index}`} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ô đỗ #{index + 1}</p>
                        <p className="text-lg font-black text-slate-900 dark:text-slate-100">{slotName}</p>
                      </div>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                        Active
                      </span>
                    </div>
                    {qrUrl && (
                      <div className="mb-3 flex justify-center rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700">
                        <img src={qrUrl} alt={`QR ${ticketCode}`} className="h-36 w-36 object-contain" />
                      </div>
                    )}
                    <div className="space-y-2 text-xs">
                      <div className="flex items-start gap-2 rounded-xl bg-white px-3 py-2 dark:bg-slate-900">
                        <Ticket size={14} className="mt-0.5 shrink-0 text-slate-400" />
                        <span className="break-all font-mono font-extrabold tracking-wider text-slate-800 dark:text-slate-100">{ticketCode || 'Chưa có mã'}</span>
                      </div>
                      {license && (
                        <p className="font-semibold text-slate-500 dark:text-slate-400">Biển số: <span className="font-bold text-slate-700 dark:text-slate-200">{license}</span></p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const RegistrationView = ({ onRegister, submitting, t }) => {
  const [selectedTypeId, setSelectedTypeId] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState(1);
  const [tiers, setTiers] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlotIds, setSelectedSlotIds] = useState([]);
  const [licenseVehicles, setLicenseVehicles] = useState(['']);
  const [paymentMethod, setPaymentMethod] = useState('VNPAY');
  const [loadingTiers, setLoadingTiers] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    const fetchTiers = async () => {
      setLoadingTiers(true);
      try {
        const response = await membershipService.getMembershipTiers();
        setTiers(unwrapArray(response));
      } catch (error) {
        console.error('Membership tiers error:', error);
        message.error('Không thể tải danh sách gói Membership.');
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

  const requiredSlotCount = selectedTier ? getRequiredSlotCount(getTierDuration(selectedTier)) : 0;
  const maxVehicles = Number(getValue(selectedTier, 'maxVehicles', 'vehicleLimit')) || requiredSlotCount || 1;
  const plan = PLANS.find((item) => item.id === Number(selectedTypeId));
  const cls = plan ? accentCls[plan.accent] : null;
  const fallbackPrice = plan ? plan.price * selectedDuration : 0;
  const totalPrice = selectedTier ? getTierPrice(selectedTier, fallbackPrice) : fallbackPrice;

  useEffect(() => {
    setSelectedSlotIds([]);
    setLicenseVehicles(['']);
    if (!selectedTypeId || !selectedTier) {
      setAvailableSlots([]);
      return;
    }

    const fetchSlots = async () => {
      setLoadingSlots(true);
      try {
        const response = await membershipService.getAvailableSlots(selectedTypeId);
        setAvailableSlots(unwrapArray(response));
      } catch (error) {
        console.error('Available slots error:', error);
        setAvailableSlots([]);
        message.error('Không thể tải danh sách ô đỗ còn trống.');
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [selectedTier, selectedTypeId]);

  const toggleSlot = (slotId) => {
    setSelectedSlotIds((prev) => {
      if (prev.includes(slotId)) {
        return prev.filter((id) => id !== slotId);
      }

      if (prev.length >= requiredSlotCount) {
        return prev;
      }

      return [...prev, slotId];
    });
  };

  const updatePlate = (index, value) => {
    setLicenseVehicles((prev) => prev.map((plate, idx) => (idx === index ? value : plate)));
  };

  const addPlate = () => {
    if (licenseVehicles.length >= maxVehicles) {
      message.error(`Gói này chỉ hỗ trợ tối đa ${maxVehicles} biển số.`);
      return;
    }
    setLicenseVehicles((prev) => [...prev, '']);
  };

  const removePlate = (index) => {
    setLicenseVehicles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = () => {
    if (!selectedTier) {
      message.error('Vui lòng chọn gói Membership hợp lệ.');
      return;
    }

    if (selectedSlotIds.length !== requiredSlotCount) {
      message.error(`Vui lòng chọn đúng ${requiredSlotCount} ô đỗ.`);
      return;
    }

    const plates = licenseVehicles
      .map((plate) => plate.trim().toUpperCase())
      .filter(Boolean);

    if (!plates.length) {
      message.error('Vui lòng nhập ít nhất 1 biển số.');
      return;
    }

    if (plates.length > maxVehicles) {
      message.error(`Gói này chỉ hỗ trợ tối đa ${maxVehicles} biển số.`);
      return;
    }

    onRegister({
      tierId: getTierId(selectedTier),
      slotIds: selectedSlotIds,
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
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Chọn gói, số ô đỗ theo thời hạn và thanh toán một lần.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Chọn loại xe</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {PLANS.map((item) => {
                const PIcon = item.Icon;
                const itemCls = accentCls[item.accent];
                const isSelected = selectedTypeId === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedTypeId(item.id)}
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
                    <p className="mt-0.5 text-xs font-semibold text-slate-400">Membership parking</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Thời hạn đăng ký</p>
            <div className="grid grid-cols-3 gap-3">
              {DURATIONS.map((duration) => {
                const isSelected = selectedDuration === duration.value;
                const tierExists = !selectedTypeId || tiers.some((tier) => Number(getTierTypeId(tier)) === Number(selectedTypeId) && Number(getTierDuration(tier)) === Number(duration.value));
                return (
                  <button
                    key={duration.value}
                    disabled={!tierExists}
                    onClick={() => setSelectedDuration(duration.value)}
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
                    <p className="mt-1 text-[10px] font-semibold text-slate-400">{getRequiredSlotCount(duration.value)} ô đỗ</p>
                  </button>
                );
              })}
            </div>
            {selectedTypeId && !selectedTier && !loadingTiers && (
              <p className="mt-3 text-xs font-semibold text-rose-500">Gói này chưa có cấu hình tier từ Backend.</p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Chọn ô đỗ</p>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-300">
                Đã chọn {selectedSlotIds.length}/{requiredSlotCount} ô đỗ
              </span>
            </div>

            {!selectedTier ? (
              <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-xs font-semibold text-slate-400 dark:border-slate-700">Chọn loại xe và thời hạn trước.</div>
            ) : loadingSlots ? (
              <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-xs font-semibold text-slate-400 dark:border-slate-700">Đang tải ô đỗ...</div>
            ) : availableSlots.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-xs font-semibold text-slate-400 dark:border-slate-700">Không có ô đỗ trống phù hợp.</div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {availableSlots.map((slot) => {
                  const slotId = getSlotId(slot);
                  const isSelected = selectedSlotIds.includes(slotId);
                  const isDisabled = !isSelected && selectedSlotIds.length >= requiredSlotCount;
                  return (
                    <button
                      key={slotId}
                      disabled={isDisabled}
                      onClick={() => toggleSlot(slotId)}
                      className={`flex items-center justify-between rounded-xl border px-3 py-3 text-left transition-all disabled:cursor-not-allowed disabled:opacity-45 ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'
                          : 'border-slate-100 bg-slate-50 text-slate-700 hover:border-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      <span className="text-sm font-extrabold">{getSlotName(slot)}</span>
                      {isSelected && <CheckCircle2 size={16} />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Biển số xe</p>
              <button type="button" onClick={addPlate} className="text-xs font-bold text-indigo-600 hover:text-indigo-700">Thêm biển số</button>
            </div>
            <div className="space-y-2">
              {licenseVehicles.map((plate, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={plate}
                    onChange={(event) => updatePlate(index, event.target.value)}
                    placeholder="Ví dụ: 51F-123.45"
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
            <p className="mt-2 text-[11px] font-medium text-slate-400">Tối đa {maxVehicles} biển số cho gói đang chọn.</p>
          </div>
        </div>

        <div className="flex flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="mb-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Tóm tắt đăng ký</p>

          {plan && cls ? (
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${cls.icon}`}>
                  <plan.Icon size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{getVehicleTypeLabel(plan.key, t)}</p>
                  <p className="text-[10px] text-slate-400">{selectedDuration} tháng · {requiredSlotCount || 0} ô đỗ</p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Thanh toán</p>
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
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Tổng cộng</span>
                  <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">{totalPrice.toLocaleString('vi-VN')} đ</span>
                </div>
              </div>

              <ul className="space-y-1.5 pt-1">
                {['Mỗi ô đỗ có QR riêng', 'Tự động nhận diện biển số', 'Quản lý tập trung trong Membership'].map((perk) => (
                  <li key={perk} className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <CheckCircle2 size={11} className="shrink-0 text-emerald-500" />
                    {perk}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-10 dark:border-slate-700">
              <Wallet size={26} className="mb-2 text-slate-300 dark:text-slate-600" />
              <p className="text-xs text-slate-400 dark:text-slate-500">Chọn gói để xem tổng tiền</p>
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
                Đang xử lý...
              </>
            ) : (
              <>
                <CreditCard size={15} />
                Đăng ký Membership
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
      message.error(error.response?.data?.message || error.response?.data?.error || (status === 403 ? 'Tài khoản chưa có quyền đăng ký Membership.' : 'Không thể tạo đăng ký Membership.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingCard) return <LoadingSkeleton />;
  if (cards.length > 0) return <ActiveMembershipView cards={cards} onRefresh={fetchCardInfo} t={t} />;
  return <RegistrationView onRegister={handleRegister} submitting={submitting} t={t} />;
};

export default MyMembership;
