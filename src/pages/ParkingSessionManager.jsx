import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Input, Modal, Select, Spin, Tag } from 'antd';
import { Car, Eye, RotateCcw, Search, Ticket } from 'lucide-react';
import parkingSessionService from '../services/parkingSessionService';
import { useTranslation } from 'react-i18next';
import { toast as message } from '../components/ToastProvider';
import { formatDateTimeVN, vietnamDateInputToIso } from '../utils/dateTime';

const initialFilters = {
  licenseVehicle: '',
  slotName: '',
  isRegistered: '',
  typeId: '',
  sessionStatus: '',
  fromDate: '',
  toDate: '',
};

const getArrayPayload = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.Data)) return payload.Data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.Items)) return payload.Items;
  return [];
};

const getField = (item, ...keys) => {
  for (const key of keys) {
    if (item?.[key] !== undefined && item?.[key] !== null) return item[key];
  }
  return undefined;
};

const normalizeFilters = (filters) => {
  const params = {
    licenseVehicle: filters.licenseVehicle?.trim() || undefined,
    slotName: filters.slotName?.trim() || undefined,
    isRegistered: filters.isRegistered !== '' ? parseInt(filters.isRegistered, 10) : undefined,
    typeId: filters.typeId ? parseInt(filters.typeId, 10) : undefined,
    sessionStatus: filters.sessionStatus || undefined,
  };

  if (filters.fromDate) params.fromDate = vietnamDateInputToIso(filters.fromDate);
  if (filters.toDate) params.toDate = vietnamDateInputToIso(filters.toDate, true);

  return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== ''));
};

const hasFilters = (filters) => Object.keys(normalizeFilters(filters)).length > 0;

const getVehicleTypeName = (typeId, vehicleTypeName, t) => {
  if (vehicleTypeName) return vehicleTypeName;
  const numericTypeId = Number(typeId);
  if (numericTypeId === 1) return t('parkingSession.vehBike');
  if (numericTypeId === 2) return t('parkingSession.vehMoto');
  if (numericTypeId === 3) return t('parkingSession.vehCar');
  return t('parkingSession.vehOther');
};

const getStatusLabel = (status, t) => {
  switch (status) {
    case 'Active':
    case 'InProgress':
      return t('parkingSession.statusActive');
    case 'Completed':
      return t('parkingSession.statusCompleted');
    case 'Cancelled':
    case 'Canceled':
      return t('parkingSession.statusCancelled');
    case 'Reserved':
      return t('parkingSession.statusReserved');
    default:
      return status || t('parkingSession.statusUnknown');
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case 'Active':
    case 'InProgress':
      return 'processing';
    case 'Completed':
      return 'success';
    case 'Reserved':
      return 'warning';
    case 'Cancelled':
    case 'Canceled':
      return 'default';
    default:
      return 'blue';
  }
};

const formatDateTime = (value, t) => {
  if (!value) return t('parkingSession.notAvail');
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return formatDateTimeVN(date);
};

const getPageNumbers = (currentPage, totalPages) => {
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, start + 4);
  const adjustedStart = Math.max(1, end - 4);
  return Array.from({ length: end - adjustedStart + 1 }, (_, index) => adjustedStart + index);
};

const LazySessionImage = ({ src, alt, emptyText }) => {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className="flex min-h-[180px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm font-semibold text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500">
        {emptyText}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setHasError(true)}
      className="h-56 w-full rounded-xl border border-slate-200 object-cover dark:border-slate-700"
    />
  );
};

const DetailRow = ({ label, children }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</span>
    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{children}</span>
  </div>
);

const SessionDetailModal = ({ selectedTicketCode, open, onClose }) => {
  const { t } = useTranslation();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const abortRef = useRef(null);

  useEffect(() => {
    if (!open || !selectedTicketCode) return undefined;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError('');
    setDetail(null);

    parkingSessionService
      .getSessionDetailByTicket(selectedTicketCode, controller.signal)
      .then((data) => {
        if (data) setDetail(data?.data || data?.Data || data);
      })
      .catch((err) => {
        setError(typeof err === 'string' ? err : err?.message || t('parkingSession.errLoadDetail'));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [open, selectedTicketCode]);

  const handleClose = () => {
    abortRef.current?.abort();
    onClose();
  };

  const slotName = getField(detail, 'slotName', 'SlotName');
  const licenseVehicle = getField(detail, 'licenseVehicle', 'LicenseVehicle');
  const ticketCode = getField(detail, 'ticketCode', 'TicketCode');
  const typeId = getField(detail, 'typeId', 'TypeId', 'vehicleTypeId', 'VehicleTypeId');
  const vehicleTypeName = getField(detail, 'vehicleTypeName', 'VehicleTypeName');
  const sessionStatus = getField(detail, 'sessionStatus', 'SessionStatus', 'status', 'Status');
  const username = getField(detail, 'username', 'Username', 'customerName', 'CustomerName', 'driverName', 'DriverName');
  const bookingTime = getField(detail, 'bookingTime', 'BookingTime', 'createdAt', 'CreatedAt');
  const checkInTime = getField(detail, 'checkInTime', 'CheckInTime');
  const checkOutTime = getField(detail, 'checkOutTime', 'CheckOutTime');
  const checkInImageUrl = getField(detail, 'checkInImageUrl', 'CheckInImageUrl', 'imageUrl', 'ImageUrl');
  const checkOutImageUrl = getField(detail, 'checkOutImageUrl', 'CheckOutImageUrl');

  return (
    <Modal
      title={
        <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          {t('parkingSession.detailTitle')}
        </span>
      }
      open={open}
      onCancel={handleClose}
      footer={null}
      width={860}
      centered
      destroyOnClose
    >
      {loading ? (
        <div className="flex min-h-[260px] items-center justify-center">
          <Spin tip={t('parkingSession.loadingDetail')} />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-100 bg-rose-50 p-4 text-sm font-semibold text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/15 dark:text-rose-300">
          {error}
        </div>
      ) : detail ? (
        <div className="space-y-6 pt-2">
          {ticketCode ? (
            <div className="flex items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 dark:border-indigo-500/40 dark:bg-indigo-500/15">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
                <Ticket size={18} />
              </span>
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase tracking-wide text-indigo-400">
                  {t('parkingSession.colTicket')}
                </span>
                <span className="font-mono text-sm font-extrabold text-indigo-700 dark:text-indigo-200">{ticketCode}</span>
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-5 rounded-2xl border border-slate-100 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800 md:grid-cols-2">
            <DetailRow label={t('parkingSession.booker')}>{username || t('parkingSession.none')}</DetailRow>
            <DetailRow label={t('parkingSession.slotPos')}>{slotName || t('parkingSession.none')}</DetailRow>
            <DetailRow label={t('parkingSession.plateNum')}>{licenseVehicle || t('parkingSession.none')}</DetailRow>
            <DetailRow label={t('parkingSession.vehType')}>{getVehicleTypeName(typeId, vehicleTypeName, t)}</DetailRow>
            <DetailRow label={t('parkingSession.bookTime')}>{formatDateTime(bookingTime, t)}</DetailRow>
            <DetailRow label={t('parkingSession.checkInTime')}>{formatDateTime(checkInTime, t)}</DetailRow>
            <DetailRow label={t('parkingSession.checkOutTime')}>{formatDateTime(checkOutTime, t)}</DetailRow>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">{t('parkingSession.statusLabel')}</span>
              <span><Tag color={getStatusColor(sessionStatus)}>{getStatusLabel(sessionStatus, t)}</Tag></span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <h4 className="mb-2 text-sm font-extrabold tracking-tight text-slate-700 dark:text-slate-300">{t('parkingSession.imgCheckIn')}</h4>
              <LazySessionImage src={checkInImageUrl} alt={t('parkingSession.imgCheckIn')} emptyText={t('parkingSession.noImgIn')} />
            </div>
            <div>
              <h4 className="mb-2 text-sm font-extrabold tracking-tight text-slate-700 dark:text-slate-300">{t('parkingSession.imgCheckOut')}</h4>
              <LazySessionImage src={checkOutImageUrl} alt={t('parkingSession.imgCheckOut')} emptyText={t('parkingSession.noImgOut')} />
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  );
};

const ParkingSessionManager = () => {
  const { t } = useTranslation();
  const [filters, setFilters] = useState(initialFilters);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTicketCode, setSelectedTicketCode] = useState(null);
  const abortControllerRef = useRef(null);
  const debounceTimeoutRef = useRef(null);
  const pageSize = 10;

  const fetchSessions = async (nextFilters, immediate = false) => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setLoading(true);
    setError('');

    try {
      const params = normalizeFilters(nextFilters);
      const response = Object.keys(params).length > 0
        ? await parkingSessionService.searchSessions(params, controller.signal)
        : await parkingSessionService.getAllSessions(controller.signal);

      if (response === null) return;
      setSessions(getArrayPayload(response));
    } catch (err) {
      const messageText = typeof err === 'string' ? err : err?.message || t('parkingSession.errLoadList');
      setError(messageText);
      message.error(messageText);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions(initialFilters);

    return () => {
      abortControllerRef.current?.abort();
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [sessions]);

  const updateFilter = (key, value) => {
    const nextFilters = { ...filters, [key]: value };
    setFilters(nextFilters);

    if (['licenseVehicle', 'slotName'].includes(key)) {
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = setTimeout(() => {
        fetchSessions(nextFilters);
      }, 500);
    } else {
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
      fetchSessions(nextFilters);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    fetchSessions(filters, true);
  };

  const handleReset = () => {
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    setFilters(initialFilters);
    fetchSessions(initialFilters);
  };

  const totalPages = Math.max(1, Math.ceil(sessions.length / pageSize));
  const paginatedSessions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sessions.slice(start, start + pageSize);
  }, [sessions, currentPage]);

  const pageNumbers = getPageNumbers(currentPage, totalPages);

  const fieldClassName = 'rounded-[14px] border-[1.5px] border-slate-200 bg-slate-50 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500';

  return (
    <div className="min-h-full space-y-6 bg-slate-50 dark:bg-slate-900">
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-5 flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-sm">
            <Car size={22} />
          </span>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">{t('parkingSession.pageTitle')}</h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('parkingSession.pageDesc')}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            size="large"
            allowClear
            prefix={<Search size={15} className="text-slate-400" />}
            placeholder={t('parkingSession.phPlate')}
            value={filters.licenseVehicle}
            onChange={(event) => updateFilter('licenseVehicle', event.target.value)}
            className={fieldClassName}
          />
          <Input
            size="large"
            allowClear
            placeholder={t('parkingSession.phSlot')}
            value={filters.slotName}
            onChange={(event) => updateFilter('slotName', event.target.value)}
            className={fieldClassName}
          />
          <Select
            size="large"
            placeholder={t('parkingSession.phCustomerType')}
            allowClear
            value={filters.isRegistered || undefined}
            onChange={(value) => updateFilter('isRegistered', value !== undefined ? value : '')}
            className="ps-select-field w-full"
            options={[
              { value: '1', label: t('parkingSession.custRegistered') },
              { value: '0', label: t('parkingSession.custWalkIn') },
            ]}
          />
          <Select
            size="large"
            placeholder={t('parkingSession.phVehType')}
            allowClear
            value={filters.typeId || undefined}
            onChange={(value) => updateFilter('typeId', value || '')}
            className="ps-select-field w-full"
            options={[
              { value: '1', label: t('parkingSession.vehBike') },
              { value: '2', label: t('parkingSession.vehMoto') },
              { value: '3', label: t('parkingSession.vehCar') },
            ]}
          />
          <Select
            size="large"
            placeholder={t('parkingSession.phStatus')}
            allowClear
            value={filters.sessionStatus || undefined}
            onChange={(value) => updateFilter('sessionStatus', value || '')}
            className="ps-select-field w-full"
            options={[
              { value: 'Reserved', label: t('parkingSession.statusReserved') },
              { value: 'InProgress', label: t('parkingSession.statusActive') },
              { value: 'Active', label: t('parkingSession.statusActive') },
              { value: 'Completed', label: t('parkingSession.statusCompleted') },
              { value: 'Cancelled', label: t('parkingSession.statusCancelled') },
              { value: 'Canceled', label: t('parkingSession.statusCancelled') },
            ]}
          />
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">{t('parkingSession.fromDate')}</span>
            <Input
              size="large"
              type="date"
              value={filters.fromDate}
              onChange={(event) => updateFilter('fromDate', event.target.value)}
              className={fieldClassName}
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">{t('parkingSession.toDate')}</span>
            <Input
              size="large"
              type="date"
              value={filters.toDate}
              onChange={(event) => updateFilter('toDate', event.target.value)}
              className={fieldClassName}
            />
          </div>
          <div className="flex items-end gap-2">
            <Button
              htmlType="submit"
              type="primary"
              size="large"
              icon={<Search size={15} />}
              className="flex-1 rounded-[14px] border-none bg-indigo-600 font-bold shadow-sm hover:!bg-indigo-700"
            >
              {t('parkingSession.btnSearch')}
            </Button>
            <Button
              type="default"
              size="large"
              icon={<RotateCcw size={15} />}
              onClick={handleReset}
              className="rounded-[14px] border-slate-200 bg-white font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:!border-slate-600 dark:hover:!text-slate-100"
            >
              {t('parkingSession.btnReset')}
            </Button>
          </div>
        </form>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        {error && (
          <div className="m-4 rounded-xl border border-rose-100 bg-rose-50 p-3 text-sm font-semibold text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/15 dark:text-rose-300">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                {[t('parkingSession.colSlot'), t('parkingSession.phPlate'), t('parkingSession.colType'), t('parkingSession.colTicket'), t('parkingSession.colStatus'), t('parkingSession.colAction')].map((heading) => (
                  <th key={heading} className="px-5 py-3.5 text-left text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-700 dark:bg-slate-900">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <Spin tip={t('parkingSession.loadingList')} />
                  </td>
                </tr>
              ) : paginatedSessions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-sm font-semibold text-slate-400 dark:text-slate-500">
                    {t('parkingSession.noData')}
                  </td>
                </tr>
              ) : (
                paginatedSessions.map((session, index) => {
                  const ticketCode = getField(session, 'ticketCode', 'TicketCode');
                  const typeId = getField(session, 'typeId', 'TypeId', 'vehicleTypeId', 'VehicleTypeId');
                  const status = getField(session, 'sessionStatus', 'SessionStatus', 'status', 'Status');
                  const vehicleTypeName = getField(session, 'vehicleTypeName', 'VehicleTypeName');

                  return (
                    <tr key={ticketCode || index} className="transition-colors hover:bg-indigo-50/40 dark:hover:bg-slate-800/70">
                      <td className="px-5 py-4 text-sm font-bold text-slate-800 dark:text-slate-200">{getField(session, 'slotName', 'SlotName') || t('parkingSession.none')}</td>
                      <td className="px-5 py-4 text-sm font-semibold italic text-slate-400 dark:text-slate-500">{t('parkingSession.none')}</td>
                      <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">{getVehicleTypeName(typeId, vehicleTypeName, t)}</td>
                      <td className="px-5 py-4 font-mono text-sm font-bold text-indigo-600 dark:text-indigo-300">{ticketCode || t('parkingSession.none')}</td>
                      <td className="px-5 py-4">
                        <Tag color={getStatusColor(status)}>{getStatusLabel(status, t)}</Tag>
                      </td>
                      <td className="px-5 py-4">
                        <Button
                          size="small"
                          icon={<Eye size={14} />}
                          disabled={!ticketCode}
                          onClick={() => setSelectedTicketCode(ticketCode)}
                          className="rounded-[10px] border-slate-200 font-bold text-slate-600 hover:!border-indigo-600 hover:!text-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:!border-indigo-400 dark:hover:!text-indigo-300"
                        >
                          {t('parkingSession.btnViewDetail')}
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            {t('parkingSession.totalSessions')} {sessions.length} {hasFilters(filters) ? t('parkingSession.byFilter') : ''}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="small" disabled={currentPage === 1} onClick={() => setCurrentPage(1)} className="rounded-[10px] font-semibold">{t('parkingSession.btnFirst')}</Button>
            <Button size="small" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} className="rounded-[10px] font-semibold">{t('parkingSession.btnPrev')}</Button>
            {pageNumbers.map((page) => (
              <Button
                key={page}
                size="small"
                type={page === currentPage ? 'primary' : 'default'}
                onClick={() => setCurrentPage(page)}
                className={`rounded-[10px] font-bold ${page === currentPage ? 'border-none bg-indigo-600 hover:!bg-indigo-700' : ''}`}
              >
                {page}
              </Button>
            ))}
            <Button size="small" disabled={currentPage === totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} className="rounded-[10px] font-semibold">{t('parkingSession.btnNext')}</Button>
            <Button size="small" disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)} className="rounded-[10px] font-semibold">{t('parkingSession.btnLast')}</Button>
          </div>
        </div>
      </div>

      <SessionDetailModal
        selectedTicketCode={selectedTicketCode}
        open={Boolean(selectedTicketCode)}
        onClose={() => setSelectedTicketCode(null)}
      />
    </div>
  );
};

export default ParkingSessionManager;
