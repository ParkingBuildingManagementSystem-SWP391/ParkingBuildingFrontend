import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Input, Modal, Select, Spin, Tag, message } from 'antd';
import { Eye, RotateCcw, Search } from 'lucide-react';
import parkingSessionService from '../services/parkingSessionService';
import { useTranslation } from 'react-i18next';

const initialFilters = {
  licenseVehicle: '',
  slotName: '',
  isRegistered: '', // Dùng isRegistered thay cho username
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
    // Chuyển đổi trạng thái isRegistered từ chuỗi select sang số nguyên gửi lên BE
    isRegistered: filters.isRegistered !== '' ? parseInt(filters.isRegistered, 10) : undefined,
    typeId: filters.typeId ? parseInt(filters.typeId, 10) : undefined,
    sessionStatus: filters.sessionStatus || undefined,
  };

  // GIẢI PHÁP MÚI GIỜ VIỆT NAM (UTC+7): 
  // Ghép chuỗi Local DateTime để khớp múi giờ Local trong DB (không bị lùi 7 tiếng do toISOString)
  // và bao trọn cả ngày kết thúc (từ 00:00:00 đến 23:59:59)
  if (filters.fromDate) params.fromDate = `${filters.fromDate}T00:00:00`;
  if (filters.toDate) params.toDate = `${filters.toDate}T23:59:59`;

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
  return date.toLocaleString();
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
      <div className="flex min-h-[180px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm font-semibold text-slate-400">
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
      className="h-56 w-full rounded-xl border border-slate-200 object-cover"
    />
  );
};

const SessionDetailModal = ({ ticketCode, open, onClose }) => {
  const { t } = useTranslation();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const abortRef = useRef(null);

  useEffect(() => {
    if (!open || !ticketCode) return undefined;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError('');
    setDetail(null);

    parkingSessionService
      .getSessionDetailByTicket(ticketCode, controller.signal)
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
  }, [open, ticketCode]);

  const handleClose = () => {
    abortRef.current?.abort();
    onClose();
  };

  const slotName = getField(detail, 'slotName', 'SlotName');
  const licenseVehicle = getField(detail, 'licenseVehicle', 'LicenseVehicle');
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
      title={t('parkingSession.detailTitle')}
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
        <div className="rounded-xl border border-rose-100 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
          {error}
        </div>
      ) : detail ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm md:grid-cols-2">
            <div><span className="font-bold text-slate-500">{t('parkingSession.booker')}</span> {username || t('parkingSession.none')}</div>
            <div><span className="font-bold text-slate-500">{t('parkingSession.slotPos')}</span> {slotName || t('parkingSession.none')}</div>
            <div><span className="font-bold text-slate-500">{t('parkingSession.plateNum')}</span> {licenseVehicle || t('parkingSession.none')}</div>
            <div><span className="font-bold text-slate-500">{t('parkingSession.vehType')}</span> {getVehicleTypeName(typeId, vehicleTypeName, t)}</div>
            <div><span className="font-bold text-slate-500">{t('parkingSession.bookTime')}</span> {formatDateTime(bookingTime, t)}</div>
            <div><span className="font-bold text-slate-500">{t('parkingSession.checkInTime')}</span> {formatDateTime(checkInTime, t)}</div>
            <div><span className="font-bold text-slate-500">{t('parkingSession.checkOutTime')}</span> {formatDateTime(checkOutTime, t)}</div>
            <div>
              <span className="font-bold text-slate-500">{t('parkingSession.statusLabel')}</span>{' '}
              <Tag color={getStatusColor(sessionStatus)}>{getStatusLabel(sessionStatus, t)}</Tag>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <h4 className="mb-2 text-sm font-extrabold text-slate-700">{t('parkingSession.imgCheckIn')}</h4>
              <LazySessionImage src={checkInImageUrl} alt={t('parkingSession.imgCheckIn')} emptyText={t('parkingSession.noImgIn')} />
            </div>
            <div>
              <h4 className="mb-2 text-sm font-extrabold text-slate-700">{t('parkingSession.imgCheckOut')}</h4>
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

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-1">
          <h1 className="text-2xl font-extrabold text-slate-900">{t('parkingSession.pageTitle')}</h1>
          <p className="text-sm font-medium text-slate-500">{t('parkingSession.pageDesc')}</p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <Input placeholder={t('parkingSession.phPlate')} value={filters.licenseVehicle} onChange={(event) => updateFilter('licenseVehicle', event.target.value)} />
          <Input placeholder={t('parkingSession.phSlot')} value={filters.slotName} onChange={(event) => updateFilter('slotName', event.target.value)} />
          <Select
            placeholder="Phân loại khách"
            allowClear
            value={filters.isRegistered || undefined}
            onChange={(value) => updateFilter('isRegistered', value !== undefined ? value : '')}
            options={[
              { value: '1', label: 'Khách hàng thành viên' },
              { value: '0', label: 'Khách vãng lai' },
            ]}
          />
          <Select
            placeholder={t('parkingSession.phVehType')}
            allowClear
            value={filters.typeId || undefined}
            onChange={(value) => updateFilter('typeId', value || '')}
            options={[
              { value: '1', label: t('parkingSession.vehBike') },
              { value: '2', label: t('parkingSession.vehMoto') },
              { value: '3', label: t('parkingSession.vehCar') },
            ]}
          />
          <Select
            placeholder={t('parkingSession.phStatus')}
            allowClear
            value={filters.sessionStatus || undefined}
            onChange={(value) => updateFilter('sessionStatus', value || '')}
            options={[
              { value: 'Reserved', label: t('parkingSession.statusReserved') },
              { value: 'InProgress', label: t('parkingSession.statusActive') },
              { value: 'Active', label: t('parkingSession.statusActive') },
              { value: 'Completed', label: t('parkingSession.statusCompleted') },
              { value: 'Cancelled', label: t('parkingSession.statusCancelled') },
              { value: 'Canceled', label: t('parkingSession.statusCancelled') },
            ]}
          />
          <Input
            type="date"
            value={filters.fromDate}
            onChange={(event) => updateFilter('fromDate', event.target.value)}
          />
          <Input
            type="date"
            value={filters.toDate}
            onChange={(event) => updateFilter('toDate', event.target.value)}
          />
          <div className="flex gap-2">
            <Button htmlType="submit" type="primary" icon={<Search size={15} />} className="flex-1 font-bold">
              {t('parkingSession.btnSearch')}
            </Button>
            <Button type="default" icon={<RotateCcw size={15} />} onClick={handleReset} className="font-bold">
              {t('parkingSession.btnReset')}
            </Button>
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
        {error && (
          <div className="m-4 rounded-xl border border-rose-100 bg-rose-50 p-3 text-sm font-semibold text-rose-700">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                {[t('parkingSession.colSlot'), t('parkingSession.colType'), t('parkingSession.colTicket'), t('parkingSession.colStatus'), t('parkingSession.colAction')].map((heading) => (
                  <th key={heading} className="px-4 py-3 text-left text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center">
                    <Spin tip={t('parkingSession.loadingList')} />
                  </td>
                </tr>
              ) : paginatedSessions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center text-sm font-semibold text-slate-400">
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
                    <tr key={getField(session, 'sessionId', 'SessionId') || ticketCode || index} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm font-bold text-slate-800">{getField(session, 'slotName', 'SlotName') || t('parkingSession.none')}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{getVehicleTypeName(typeId, vehicleTypeName, t)}</td>
                      <td className="px-4 py-3 font-mono text-sm font-bold text-blue-600">{ticketCode || t('parkingSession.none')}</td>
                      <td className="px-4 py-3">
                        <Tag color={getStatusColor(status)}>{getStatusLabel(status, t)}</Tag>
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          size="small"
                          icon={<Eye size={14} />}
                          disabled={!ticketCode}
                          onClick={() => setSelectedTicketCode(ticketCode)}
                          className="font-bold"
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

        <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm font-semibold text-slate-500">
            {t('parkingSession.totalSessions')} {sessions.length} {hasFilters(filters) ? t('parkingSession.byFilter') : ''}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="small" disabled={currentPage === 1} onClick={() => setCurrentPage(1)}>{t('parkingSession.btnFirst')}</Button>
            <Button size="small" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}>{t('parkingSession.btnPrev')}</Button>
            {pageNumbers.map((page) => (
              <Button key={page} size="small" type={page === currentPage ? 'primary' : 'default'} onClick={() => setCurrentPage(page)}>
                {page}
              </Button>
            ))}
            <Button size="small" disabled={currentPage === totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}>{t('parkingSession.btnNext')}</Button>
            <Button size="small" disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)}>{t('parkingSession.btnLast')}</Button>
          </div>
        </div>
      </div>

      <SessionDetailModal
        ticketCode={selectedTicketCode}
        open={Boolean(selectedTicketCode)}
        onClose={() => setSelectedTicketCode(null)}
      />
    </div>
  );
};

export default ParkingSessionManager;
