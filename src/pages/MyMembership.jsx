import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bike,
  CalendarCheck,
  CalendarX2,
  Car,
  CheckCircle2,
  CreditCard,
  Hash,
  MapPin,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Ticket,
  Truck,
  Wallet
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from '../components/ToastProvider';
import membershipService from '../services/membershipService';
import { formatDateTimeVN } from '../utils/dateTime';
import { getVehicleTypeLabel } from '../utils/i18nLabels';

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

const asArray = (payload) => {
  const data = unwrapData(payload);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.slots)) return data.slots;
  if (Array.isArray(data?.tiers)) return data.tiers;
  return [];
};

const formatCurrency = (value) => `${Number(value || 0).toLocaleString('vi-VN')} đ`;

const DEFAULT_TIERS = [
  { tierId: 1, typeId: 1, key: 'Bicycle', name: 'Bicycle', Icon: Bike, monthlyPrice: 120000, accent: 'emerald' },
  { tierId: 2, typeId: 2, key: 'Motorbike', name: 'Motorbike', Icon: Truck, monthlyPrice: 250000, accent: 'indigo' },
  { tierId: 3, typeId: 3, key: 'Car', name: 'Car', Icon: Car, monthlyPrice: 1500000, accent: 'rose' }
];

const accentCls = {
  emerald: {
    icon: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30',
    bar: 'bg-emerald-500'
  },
  indigo: {
    icon: 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30',
    bar: 'bg-indigo-500'
  },
  rose: {
    icon: 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30',
    bar: 'bg-rose-500'
  }
};

const normalizeTier = (tier) => {
  const typeId = Number(getValue(tier, 'typeId', 'TypeId', 'vehicleTypeId', 'VehicleTypeId', 'tariffId', 'TariffId')) || 0;
  const fallback = DEFAULT_TIERS.find((item) => Number(item.typeId) === typeId)
    || DEFAULT_TIERS.find((item) => Number(item.tierId) === Number(getValue(tier, 'tierId', 'TierId', 'id', 'Id')))
    || DEFAULT_TIERS[1];

  return {
    ...fallback,
    tierId: Number(getValue(tier, 'tierId', 'TierId', 'id', 'Id')) || fallback.tierId,
    typeId: typeId || fallback.typeId,
    key: getValue(tier, 'vehicleType', 'VehicleType', 'vehicleTypeName', 'VehicleTypeName', 'name', 'Name') || fallback.key,
    name: getValue(tier, 'tierName', 'TierName', 'name', 'Name', 'vehicleTypeName', 'VehicleTypeName') || fallback.name,
    monthlyPrice: Number(getValue(tier, 'monthlyPrice', 'MonthlyPrice', 'price', 'Price')) || fallback.monthlyPrice,
    description: getValue(tier, 'description', 'Description') || ''
  };
};

const normalizeSlot = (slot) => ({
  id: getValue(slot, 'slotId', 'SlotId', 'id', 'Id', 'dbSlotId', 'DbSlotId'),
  name: getValue(slot, 'slotName', 'SlotName', 'name', 'Name', 'code', 'Code') || 'N/A',
  floor: getValue(slot, 'floorName', 'FloorName', 'floor', 'Floor'),
  status: getValue(slot, 'status', 'Status') || 'Available'
});

const LoadingSkeleton = () => (
  <div className="mx-auto max-w-4xl animate-pulse space-y-4 px-4 py-8">
    <div className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800" />
    <div className="h-40 rounded-2xl bg-slate-200 dark:bg-slate-800" />
  </div>
);

const ActiveCardView = ({ cardInfo, tiers, onRefresh, t }) => {
  const ticketCode = getValue(cardInfo, 'ticketCode', 'TicketCode');
  const tierId = Number(getValue(cardInfo, 'tierId', 'TierId', 'membershipTierId', 'MembershipTierId'));
  const typeId = Number(getValue(cardInfo, 'typeId', 'TypeId', 'vehicleTypeId', 'VehicleTypeId'));
  const startTime = getValue(cardInfo, 'startDate', 'StartDate', 'startTime', 'StartTime');
  const endTime = getValue(cardInfo, 'endDate', 'EndDate', 'endTime', 'EndTime');
  const status = getValue(cardInfo, 'status', 'Status') || 'Active';
  const slotName = getValue(cardInfo, 'slotName', 'SlotName', 'parkingSlotName', 'ParkingSlotName') || 'N/A';
  const licenseVehicle = getValue(cardInfo, 'licenseVehicle', 'LicenseVehicle')
    || getValue(cardInfo, 'licensePlate', 'LicensePlate')
    || getValue(cardInfo, 'licenseVehicles', 'LicenseVehicles')?.[0]
    || 'N/A';
  const price = Number(getValue(cardInfo, 'monthlyPrice', 'MonthlyPrice', 'price', 'Price'));
  const isActive = ['Active', 'MembershipCardActive'].includes(status);

  const tier = tiers.find((item) => Number(item.tierId) === tierId)
    || tiers.find((item) => Number(item.typeId) === typeId)
    || DEFAULT_TIERS.find((item) => Number(item.typeId) === typeId)
    || DEFAULT_TIERS[1];
  const Icon = tier.Icon;
  const cls = accentCls[tier.accent] || accentCls.indigo;

  const now = new Date();
  const end = endTime ? new Date(endTime) : now;
  const start = startTime ? new Date(startTime) : now;
  const totalMs = end - start;
  const usedMs = now - start;
  const daysLeft = Math.max(0, Math.ceil((end - now) / 86400000));
  const progressPct = totalMs > 0 ? Math.min(100, Math.max(0, (usedMs / totalMs) * 100)) : 0;
  const qrUrl = ticketCode
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(ticketCode)}&bgcolor=ffffff&color=1e293b&margin=10`
    : null;

  const stats = [
    { Icon: ShieldCheck, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-500/10', label: 'Gói Membership', value: tier.name || getVehicleTypeLabel(tier.key, t) },
    { Icon: MapPin, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', label: 'Chỗ đỗ', value: slotName },
    { Icon: Hash, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10', label: 'Biển số', value: licenseVehicle },
    { Icon: CreditCard, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-500/10', label: 'Phí / tháng', value: formatCurrency(price || tier.monthlyPrice) }
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-4 px-4 py-8">
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 dark:border-slate-700 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${cls.icon}`}>
              <Icon size={24} />
            </div>
            <div>
              <div className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-slate-100 bg-slate-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                <ShieldCheck size={10} />
                Thẻ thành viên đang hoạt động
              </div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                {getVehicleTypeLabel(tier.key, t)}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold ${
              isActive
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
            }`}>
              <CheckCircle2 size={11} />
              {isActive ? 'Đang hoạt động' : status}
            </span>
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold text-slate-500 transition-all hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
            >
              <RefreshCw size={11} />
              Làm mới
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 divide-y divide-slate-100 dark:divide-slate-700 sm:grid-cols-4 sm:divide-x sm:divide-y-0">
          {stats.map((item) => (
            <div key={item.label} className="flex items-start gap-3 px-5 py-4">
              <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${item.bg}`}>
                <item.Icon size={15} className={item.color} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{item.label}</p>
                <p className="mt-0.5 break-words text-sm font-extrabold leading-tight text-slate-800 dark:text-slate-100">{item.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-3 border-t border-slate-100 px-6 py-4 dark:border-slate-700 sm:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ngày bắt đầu</p>
            <p className="mt-1 text-sm font-extrabold text-slate-800 dark:text-slate-100">
              {formatDateTimeVN(startTime, t('common.notUpdated'))}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ngày hết hạn</p>
            <p className="mt-1 text-sm font-extrabold text-slate-800 dark:text-slate-100">
              {formatDateTimeVN(endTime, t('common.notUpdated'))}
            </p>
          </div>
        </div>

        <div className="border-t border-slate-100 px-6 py-4 dark:border-slate-700">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Thời hạn hiệu lực</span>
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{daysLeft} ngày còn lại</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div className={`h-full rounded-full transition-all duration-700 ${cls.bar}`} style={{ width: `${Math.max(2, 100 - progressPct)}%` }} />
          </div>
        </div>
      </div>

      {ticketCode && (
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col items-center gap-4 px-6 py-6 sm:flex-row">
            {qrUrl && (
              <div className="shrink-0 rounded-2xl border-2 border-slate-100 bg-white p-3 shadow-inner dark:border-slate-700">
                <img src={qrUrl} alt={t('membership.qrAlt')} className="block h-[160px] w-[160px]" />
              </div>
            )}
            <div className="flex w-full flex-1 flex-col gap-3">
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm">
                <QrCode size={15} />
                Mã QR Membership
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
                <Ticket size={15} className="shrink-0 text-slate-400" />
                <div>
                  <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Mã vé</p>
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

const RegistrationView = ({ tiers, onTiersLoaded, onRegister, submitting, t }) => {
  const [selectedTierId, setSelectedTierId] = useState(null);
  const [licensePlate, setLicensePlate] = useState('');
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('WALLET');
  const [slots, setSlots] = useState([]);
  const [loadingTiers, setLoadingTiers] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    const fetchTiers = async () => {
      setLoadingTiers(true);
      try {
        const response = await membershipService.getTiers();
        const serverTiers = asArray(response).map(normalizeTier);
        if (serverTiers.length) {
          onTiersLoaded(serverTiers);
          setSelectedTierId((current) => current || serverTiers[0].tierId);
        } else {
          setSelectedTierId((current) => current || DEFAULT_TIERS[0].tierId);
        }
      } catch (error) {
        console.error('load membership tiers error:', error);
        toast.error(error.response?.data?.message || 'Không thể tải danh sách gói Membership. Đang dùng dữ liệu mặc định.');
        setSelectedTierId((current) => current || tiers[0]?.tierId || DEFAULT_TIERS[0].tierId);
      } finally {
        setLoadingTiers(false);
      }
    };

    fetchTiers();
  }, [onTiersLoaded]);

  const activeTier = useMemo(
    () => tiers.find((tier) => Number(tier.tierId) === Number(selectedTierId)) || null,
    [selectedTierId, tiers]
  );

  useEffect(() => {
    if (!activeTier?.typeId) return;

    const fetchSlots = async () => {
      setLoadingSlots(true);
      setSelectedSlotId('');
      try {
        const response = await membershipService.getAvailableSlots(activeTier.typeId);
        setSlots(asArray(response).map(normalizeSlot).filter((slot) => slot.id));
      } catch (error) {
        console.error('load available slots error:', error);
        toast.error(error.response?.data?.message || 'Không thể tải danh sách chỗ trống.');
        setSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [activeTier?.typeId]);

  const handleSubmit = () => {
    if (!activeTier) {
      toast.warning('Vui lòng chọn gói Membership.');
      return;
    }

    if (!licensePlate.trim()) {
      toast.warning('Vui lòng nhập biển số xe.');
      return;
    }

    if (!selectedSlotId) {
      toast.warning('Vui lòng chọn chỗ đỗ cố định.');
      return;
    }

    onRegister({
      tierId: Number(activeTier.tierId),
      slotId: Number(selectedSlotId),
      slotIds: [Number(selectedSlotId)],
      licenseVehicles: [licensePlate.trim().toUpperCase()],
      paymentMethod
    });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 py-8">
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-500/15">
            <CreditCard size={19} className="text-indigo-600 dark:text-indigo-300" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-slate-100">Đăng ký Membership</h1>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Chọn gói, chỗ đỗ cố định và phương thức thanh toán.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {loadingTiers ? 'Đang tải gói Membership...' : 'Chọn gói Membership'}
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {tiers.map((tier) => {
                const Icon = tier.Icon;
                const cls = accentCls[tier.accent] || accentCls.indigo;
                const isSelected = Number(selectedTierId) === Number(tier.tierId);
                return (
                  <button
                    key={tier.tierId}
                    type="button"
                    onClick={() => setSelectedTierId(tier.tierId)}
                    className={`relative rounded-xl border-2 p-4 text-left transition-all duration-150 ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/50 shadow-sm dark:bg-indigo-500/10'
                        : 'border-slate-100 hover:border-indigo-200 dark:border-slate-700 dark:hover:border-indigo-500/30'
                    }`}
                  >
                    {isSelected && <CheckCircle2 size={16} className="absolute right-3 top-3 text-indigo-600 dark:text-indigo-400" />}
                    <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl border ${cls.icon}`}>
                      <Icon size={20} />
                    </div>
                    <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">{tier.name || getVehicleTypeLabel(tier.key, t)}</p>
                    <p className="mt-0.5 text-base font-black text-slate-800 dark:text-slate-100">
                      {formatCurrency(tier.monthlyPrice)}
                      <span className="ml-1 text-xs font-semibold text-slate-400">/tháng</span>
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Biển số xe</label>
              <input
                value={licensePlate}
                onChange={(event) => setLicensePlate(event.target.value.toUpperCase())}
                placeholder="VD: 51A12345"
                className="mt-3 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold uppercase text-slate-900 outline-none transition-colors focus:border-indigo-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-900"
              />
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {loadingSlots ? 'Đang tải chỗ trống...' : 'Chỗ đỗ cố định'}
              </label>
              <select
                value={selectedSlotId}
                onChange={(event) => setSelectedSlotId(event.target.value)}
                disabled={!activeTier || loadingSlots}
                className="mt-3 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-900 outline-none transition-colors focus:border-indigo-400 focus:bg-white disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-900"
              >
                <option value="">Chọn chỗ đỗ</option>
                {slots.map((slot) => (
                  <option key={slot.id} value={slot.id}>
                    {slot.name}{slot.floor ? ` - ${slot.floor}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Phương thức thanh toán</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { value: 'WALLET', label: 'Ví điện tử', Icon: Wallet },
                { value: 'VNPAY', label: 'VNPay', Icon: CreditCard }
              ].map((method) => (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => setPaymentMethod(method.value)}
                  className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-colors ${
                    paymentMethod === method.value
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-200'
                      : 'border-slate-100 text-slate-600 hover:border-indigo-200 dark:border-slate-700 dark:text-slate-300'
                  }`}
                >
                  <method.Icon size={18} />
                  <span className="text-sm font-extrabold">{method.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="mb-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Tóm tắt đăng ký</p>

          {activeTier ? (
            <div className="flex-1 space-y-3">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{activeTier.name}</p>
                <p className="mt-1 text-lg font-black text-indigo-600 dark:text-indigo-400">{formatCurrency(activeTier.monthlyPrice)}</p>
              </div>
              <div className="space-y-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <p>Biển số: <span className="font-extrabold text-slate-800 dark:text-slate-100">{licensePlate || 'Chưa nhập'}</span></p>
                <p>Chỗ đỗ: <span className="font-extrabold text-slate-800 dark:text-slate-100">{slots.find((slot) => String(slot.id) === String(selectedSlotId))?.name || 'Chưa chọn'}</span></p>
                <p>Thanh toán: <span className="font-extrabold text-slate-800 dark:text-slate-100">{paymentMethod}</span></p>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-10 dark:border-slate-700">
              <Wallet size={26} className="mb-2 text-slate-300 dark:text-slate-600" />
              <p className="text-xs text-slate-400 dark:text-slate-500">Chọn gói để tiếp tục</p>
            </div>
          )}

          <button
            type="button"
            disabled={!activeTier || !selectedSlotId || !licensePlate.trim() || submitting}
            onClick={handleSubmit}
            className={`mt-4 flex w-full items-center justify-center gap-2 rounded-[14px] py-3 text-sm font-extrabold transition-all ${
              activeTier && selectedSlotId && licensePlate.trim() && !submitting
                ? 'bg-indigo-600 text-white shadow-sm hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-md'
                : 'cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600'
            }`}
          >
            {submitting ? 'Đang xử lý...' : 'Đăng ký Membership'}
          </button>
        </div>
      </div>
    </div>
  );
};

const MyMembership = () => {
  const { t } = useTranslation();
  const [cardInfo, setCardInfo] = useState(null);
  const [tiers, setTiers] = useState(DEFAULT_TIERS);
  const [loadingCard, setLoadingCard] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchCardInfo = useCallback(async () => {
    setLoadingCard(true);
    try {
      const response = await membershipService.getMyCard();
      const data = unwrapData(response);
      setCardInfo(data?.card ?? data);
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('load membership card error:', error);
        toast.error(error.response?.data?.message || t('membership.errors.loadCard'));
      }
      setCardInfo(null);
    } finally {
      setLoadingCard(false);
    }
  }, [t]);

  useEffect(() => {
    fetchCardInfo();
  }, [fetchCardInfo]);

  const handleRegister = async (values) => {
    setSubmitting(true);
    try {
      const response = await membershipService.register(values);
      const paymentUrl = getPaymentUrl(response);

      if (paymentUrl) {
        window.location.href = paymentUrl;
        return;
      }

      toast.success(response?.message || 'Đăng ký Membership thành công.');
      await fetchCardInfo();
    } catch (error) {
      const status = error.response?.status;
      toast.error(
        error.response?.data?.message
        || error.response?.data?.error
        || (status === 403 ? t('membership.errors.noRegisterPermission') : t('membership.errors.createRegistration'))
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingCard) return <LoadingSkeleton />;
  if (cardInfo) return <ActiveCardView cardInfo={cardInfo} tiers={tiers} onRefresh={fetchCardInfo} t={t} />;

  return (
    <RegistrationView
      tiers={tiers}
      onTiersLoaded={setTiers}
      onRegister={handleRegister}
      submitting={submitting}
      t={t}
    />
  );
};

export default MyMembership;
