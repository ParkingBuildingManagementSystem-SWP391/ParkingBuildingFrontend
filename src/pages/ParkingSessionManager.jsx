import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Input, Modal, Select, Spin, Tag, message } from 'antd';
import { Eye, RotateCcw, Search } from 'lucide-react';
import parkingSessionService from '../services/parkingSessionService';

const initialFilters = {
  licenseVehicle: '',
  slotName: '',
  username: '',
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
    username: filters.username?.trim() || undefined,
    typeId: filters.typeId ? parseInt(filters.typeId, 10) : undefined,
    sessionStatus: filters.sessionStatus || undefined,
  };

  if (filters.fromDate) params.fromDate = new Date(filters.fromDate).toISOString();
  if (filters.toDate) params.toDate = new Date(filters.toDate).toISOString();

  return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== ''));
};

const hasFilters = (filters) => Object.keys(normalizeFilters(filters)).length > 0;

const getVehicleTypeName = (typeId, vehicleTypeName) => {
  if (vehicleTypeName) return vehicleTypeName;
  const numericTypeId = Number(typeId);
  if (numericTypeId === 1) return 'Xe đạp';
  if (numericTypeId === 2) return 'Xe máy';
  if (numericTypeId === 3) return 'Ô tô';
  return 'Khác';
};

const getStatusLabel = (status) => {
  switch (status) {
    case 'Active':
    case 'InProgress':
      return 'Đang đỗ';
    case 'Completed':
      return 'Đã ra bãi';
    case 'Cancelled':
    case 'Canceled':
      return 'Đã hủy';
    case 'Reserved':
      return 'Đã đặt trước';
    default:
      return status || 'Không rõ';
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

const formatDateTime = (value) => {
  if (!value) return 'Chưa có';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('vi-VN');
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
        setError(typeof err === 'string' ? err : err?.message || 'Không thể tải chi tiết phiên đỗ.');
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
      title="Chi tiết phiên đỗ xe"
      open={open}
      onCancel={handleClose}
      footer={null}
      width={860}
      centered
      destroyOnClose
    >
      {loading ? (
        <div className="flex min-h-[260px] items-center justify-center">
          <Spin tip="Đang tải chi tiết..." />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-100 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
          {error}
        </div>
      ) : detail ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm md:grid-cols-2">
            <div><span className="font-bold text-slate-500">Người đặt:</span> {username || 'Không có'}</div>
            <div><span className="font-bold text-slate-500">Vị trí ô đỗ:</span> {slotName || 'Không có'}</div>
            <div><span className="font-bold text-slate-500">Biển số xe:</span> {licenseVehicle || 'Không có'}</div>
            <div><span className="font-bold text-slate-500">Loại phương tiện:</span> {getVehicleTypeName(typeId, vehicleTypeName)}</div>
            <div><span className="font-bold text-slate-500">Thời gian đặt chỗ:</span> {formatDateTime(bookingTime)}</div>
            <div><span className="font-bold text-slate-500">Thời gian xe vào bãi:</span> {formatDateTime(checkInTime)}</div>
            <div><span className="font-bold text-slate-500">Thời gian xe ra bãi:</span> {formatDateTime(checkOutTime)}</div>
            <div>
              <span className="font-bold text-slate-500">Trạng thái:</span>{' '}
              <Tag color={getStatusColor(sessionStatus)}>{getStatusLabel(sessionStatus)}</Tag>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <h4 className="mb-2 text-sm font-extrabold text-slate-700">Ảnh Check-in</h4>
              <LazySessionImage src={checkInImageUrl} alt="Ảnh Check-in" emptyText="Không có ảnh Check-in" />
            </div>
            <div>
              <h4 className="mb-2 text-sm font-extrabold text-slate-700">Ảnh Check-out</h4>
              <LazySessionImage src={checkOutImageUrl} alt="Ảnh Check-out" emptyText="Không có ảnh Check-out" />
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  );
};

const ParkingSessionManager = () => {
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
      const messageText = typeof err === 'string' ? err : err?.message || 'Không thể tải danh sách phiên đỗ.';
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

    if (['licenseVehicle', 'slotName', 'username'].includes(key)) {
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
          <h1 className="text-2xl font-extrabold text-slate-900">Quản lý phiên đỗ xe</h1>
          <p className="text-sm font-medium text-slate-500">Tra cứu, lọc và đối chiếu lịch sử phiên đỗ xe trong hệ thống.</p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <Input placeholder="Biển số xe" value={filters.licenseVehicle} onChange={(event) => updateFilter('licenseVehicle', event.target.value)} />
          <Input placeholder="Vị trí ô đỗ" value={filters.slotName} onChange={(event) => updateFilter('slotName', event.target.value)} />
          <Input placeholder="Username" value={filters.username} onChange={(event) => updateFilter('username', event.target.value)} />
          <Select
            placeholder="Loại xe"
            allowClear
            value={filters.typeId || undefined}
            onChange={(value) => updateFilter('typeId', value || '')}
            options={[
              { value: '1', label: 'Xe đạp' },
              { value: '2', label: 'Xe máy' },
              { value: '3', label: 'Ô tô' },
            ]}
          />
          <Select
            placeholder="Trạng thái phiên"
            allowClear
            value={filters.sessionStatus || undefined}
            onChange={(value) => updateFilter('sessionStatus', value || '')}
            options={[
              { value: 'Reserved', label: 'Đã đặt trước' },
              { value: 'InProgress', label: 'Đang đỗ' },
              { value: 'Active', label: 'Đang đỗ' },
              { value: 'Completed', label: 'Đã ra bãi' },
              { value: 'Cancelled', label: 'Đã hủy' },
              { value: 'Canceled', label: 'Đã hủy' },
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
              Tìm kiếm
            </Button>
            <Button type="default" icon={<RotateCcw size={15} />} onClick={handleReset} className="font-bold">
              Reset
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
                {['Vị trí ô đỗ', 'Loại xe', 'Mã vé', 'Trạng thái', 'Hành động'].map((heading) => (
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
                    <Spin tip="Đang tải dữ liệu phiên đỗ..." />
                  </td>
                </tr>
              ) : paginatedSessions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center text-sm font-semibold text-slate-400">
                    Không tìm thấy dữ liệu phiên đỗ nào.
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
                      <td className="px-4 py-3 text-sm font-bold text-slate-800">{getField(session, 'slotName', 'SlotName') || 'Không có'}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{getVehicleTypeName(typeId, vehicleTypeName)}</td>
                      <td className="px-4 py-3 font-mono text-sm font-bold text-blue-600">{ticketCode || 'Không có'}</td>
                      <td className="px-4 py-3">
                        <Tag color={getStatusColor(status)}>{getStatusLabel(status)}</Tag>
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          size="small"
                          icon={<Eye size={14} />}
                          disabled={!ticketCode}
                          onClick={() => setSelectedTicketCode(ticketCode)}
                          className="font-bold"
                        >
                          Tra cứu chi tiết
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
            Tổng {sessions.length} phiên đỗ {hasFilters(filters) ? 'theo bộ lọc' : ''}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="small" disabled={currentPage === 1} onClick={() => setCurrentPage(1)}>Đầu</Button>
            <Button size="small" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}>Trước</Button>
            {pageNumbers.map((page) => (
              <Button key={page} size="small" type={page === currentPage ? 'primary' : 'default'} onClick={() => setCurrentPage(page)}>
                {page}
              </Button>
            ))}
            <Button size="small" disabled={currentPage === totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}>Sau</Button>
            <Button size="small" disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)}>Cuối</Button>
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
