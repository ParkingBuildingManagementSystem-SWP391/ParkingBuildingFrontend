import React, { useState, useEffect, useMemo } from 'react';
import { Table, Input, Select, Button, Tag, Drawer, Spin, Space, Tooltip, Popconfirm } from 'antd';
import { toast as message } from '../../components/ToastProvider';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Car,
  Bike,
  RefreshCw,
  AlertTriangle,
  ShieldAlert,
  Key,
  Settings,
  Info,
  Clock,
  User,
  Unlock
} from 'lucide-react';
import { parkingService } from '../../services/parkingService';
import { managerService } from '../../services/managerService';
import { useAuth } from '../../context/AuthContext';
import { formatVietnamDateTime } from '../../utils/dateTime';

const { Option } = Select;

const getVehicleTypeLabel = (type, t) => {
  if (type === 'Car') return t('dashboard.liveStatus.car', { defaultValue: 'Ô tô' });
  if (type === 'Motorcycle' || type === 'Motorbike') return t('dashboard.liveStatus.motorbike', { defaultValue: 'Xe máy' });
  if (type === 'Bicycle') return t('dashboard.liveStatus.bicycle', { defaultValue: 'Xe đạp' });
  return type || t('dashboard.liveStatus.unknown', { defaultValue: 'Không xác định' });
};

const getStatusLabel = (status, t) => {
  if (status === 'Available') return t('dashboard.liveStatus.available', { defaultValue: 'CÒN TRỐNG' });
  if (status === 'Occupied') return t('dashboard.liveStatus.occupied', { defaultValue: 'ĐANG ĐỖ' });
  if (status === 'Reserved') return t('dashboard.liveStatus.reserved', { defaultValue: 'ĐÃ ĐẶT' });
  return String(status || '').toUpperCase();
};

const getActionLabel = (actionName, t) => {
  if (actionName === 'Maintenance Lock') return t('dashboard.liveStatus.maintenance', { defaultValue: 'Khóa bảo trì' });
  if (actionName === 'VIP Reservation') return t('dashboard.liveStatus.vip', { defaultValue: 'Giữ chỗ VIP' });
  return actionName;
};

// Presentational helper: maps a status to semantic pill classes (no logic impact)
const getStatusPillClass = (status) => {
  if (status === 'Available') return 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200';
  if (status === 'Occupied') return 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200';
  if (status === 'Reserved') return 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200';
  return 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200';
};

const LiveStatusTable = () => {
  const { role } = useAuth();
  const { t } = useTranslation();
  const [floors, setFloors] = useState([]);
  const [selectedFloor, setSelectedFloor] = useState(3); // Default Floor G
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Drawer states
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slotDetail, setSlotDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch Floors
  useEffect(() => {
    const fetchFloors = async () => {
      try {
        const data = await parkingService.getFloors();
        const mappedFloors = Array.isArray(data) ? data.map(f => ({ id: f.floorId || f.id, name: f.floorName || f.name })) : [];
        setFloors(mappedFloors);
        if (mappedFloors.length > 0 && !mappedFloors.some((floor) => floor.id === selectedFloor)) {
          setSelectedFloor(mappedFloors[0].id);
        }
      } catch (err) {
        console.warn("Failed to fetch floors", err);
        setFloors([]);
      }
    };
    fetchFloors();
  }, []);

  // Fetch Slots
  const fetchSlots = async () => {
    setLoading(true);
    try {
      const data = await parkingService.getSlotsByFloor(selectedFloor);
      // Map data
      const mapped = data.map(s => {
        let type = 'Car';
        if (s.typeId === 1) type = 'Bicycle';
        else if (s.typeId === 2) type = 'Motorcycle';

        let statusStr = String(s.slotStatus || '').trim().toLowerCase();
        let status = 'Available';
        if (statusStr === '1' || statusStr === 'occupied') status = 'Occupied';
        if (statusStr === '2' || statusStr === 'reserved') status = 'Reserved';

        const floorObj = floors.find(f => f.id === selectedFloor);

        return {
          key: s.slotId,
          slotId: s.slotId,
          slotName: s.slotName,
          type: type,
          status: status,
          floorName: floorObj ? floorObj.name : t('dashboard.liveStatus.floorId', { id: selectedFloor })
        };
      });
      setSlots(mapped);
    } catch (err) {
      console.error(err);
      message.error(t('dashboard.liveStatus.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedFloor) {
      setCurrentPage(1);
      fetchSlots();
    }
  }, [selectedFloor, floors]); // re-run if floors loaded

  // Filter slots
  const filteredSlots = useMemo(() => {
    if (!searchText) return slots;
    return slots.filter(s => s.slotName.toLowerCase().includes(searchText.toLowerCase()));
  }, [slots, searchText]);

  // Handle open Drawer
  const handleManageSlot = async (slot) => {
    setSelectedSlot(slot);
    setDrawerVisible(true);
    setSlotDetail(null);

    if (slot.status === 'Occupied' || slot.status === 'Reserved') {
      setDetailLoading(true);
      try {
        const detail = await managerService.getSlotDetail(slot.slotId);
        setSlotDetail(detail);
      } catch (err) {
        console.error(err);
      } finally {
        setDetailLoading(false);
      }
    }
  };

  const handleUnsupportedSlotAction = (actionName) => {
    message.warning(t('dashboard.liveStatus.noApi', { action: getActionLabel(actionName, t) }));
  };

  // Real Force Release Action
  const handleForceRelease = async () => {
    setActionLoading(true);
    try {
      const plate = slotDetail?.activeSession?.licenseVehicle || 'Unknown';
      const cleanPlate = plate !== 'Unknown' ? plate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : null;

      const response = await parkingService.checkOutVehicle(null, cleanPlate, null, null);
      message.success(response.message || t('dashboard.liveStatus.releaseSuccess', { slot: selectedSlot.slotName }));
      setDrawerVisible(false);
      fetchSlots();
    } catch (err) {
      message.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      title: t('dashboard.liveStatus.slotCode'),
      dataIndex: 'slotName',
      key: 'slotName',
      render: (text) => <span className="font-mono font-extrabold text-indigo-600">{text}</span>,
      sorter: (a, b) => a.slotName.localeCompare(b.slotName)
    },
    {
      title: t('dashboard.liveStatus.vehicleType'),
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        let icon = <Car size={16} className="text-slate-500" />;
        if (type === 'Bicycle') icon = <Bike size={16} className="text-slate-500" />;
        if (type === 'Motorcycle') icon = <Bike size={16} className="text-slate-500" />; // using bike icon for both currently

        return (
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-slate-100">
              {icon}
            </span>
            <span className="font-medium text-slate-700">{getVehicleTypeLabel(type, t)}</span>
          </div>
        );
      },
      filters: [
        { text: t('dashboard.liveStatus.car'), value: 'Car' },
        { text: t('dashboard.liveStatus.motorbike'), value: 'Motorcycle' },
        { text: t('dashboard.liveStatus.bicycle'), value: 'Bicycle' },
      ],
      onFilter: (value, record) => record.type.indexOf(value) === 0,
    },
    {
      title: t('dashboard.liveStatus.currentStatus'),
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        if (status === 'Available') color = 'success';
        if (status === 'Occupied') color = 'error';
        if (status === 'Reserved') color = 'warning';
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${getStatusPillClass(status)}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
            {getStatusLabel(status, t)}
          </span>
        );
      },
      filters: [
        { text: t('dashboard.liveStatus.available'), value: 'Available' },
        { text: t('dashboard.liveStatus.occupied'), value: 'Occupied' },
        { text: t('dashboard.liveStatus.reserved'), value: 'Reserved' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: t('dashboard.liveStatus.floor'),
      dataIndex: 'floorName',
      key: 'floorName',
      render: (text) => <span className="font-semibold text-slate-600">{text}</span>
    },
    {
      title: t('dashboard.liveStatus.action'),
      key: 'action',
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          onClick={() => handleManageSlot(record)}
          className="flex items-center gap-1.5 rounded-[14px] border-0 bg-gradient-to-r from-indigo-600 to-indigo-500 px-3 font-semibold text-white shadow-sm hover:from-indigo-700 hover:to-indigo-600"
        >
          <Settings size={14} />
          {t('dashboard.liveStatus.manage')}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-5 rounded-2xl border border-slate-100 bg-white p-6 font-sans shadow-sm dark:border-slate-700 dark:bg-slate-900">

      {/* Header & Controls */}
      <div className="flex flex-col items-start justify-between gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center dark:border-slate-700">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
            <ShieldAlert size={22} />
          </span>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
              {t('dashboard.liveStatus.title')}
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t('dashboard.liveStatus.subtitle')}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={selectedFloor}
            onChange={(val) => setSelectedFloor(val)}
            className="h-10 w-36"
            placeholder={t('dashboard.liveStatus.selectFloor')}
          >
            {floors.map(f => (
              <Option key={f.id} value={f.id}>{f.name}</Option>
            ))}
          </Select>

          <Input
            placeholder={t('dashboard.liveStatus.searchSlot')}
            prefix={<Search size={16} className="text-slate-400" />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            className="h-10 w-48 rounded-[14px]"
          />

          <Tooltip title={t('dashboard.liveStatus.refresh')}>
            <Button
              icon={<RefreshCw size={16} />}
              onClick={fetchSlots}
              loading={loading}
              className="flex h-10 w-10 items-center justify-center rounded-[14px] border-slate-200 bg-white text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 dark:border-slate-700 dark:bg-slate-800 dark:text-indigo-300 dark:hover:bg-indigo-500/15"
            />
          </Tooltip>
        </div>
      </div>

      {/* Data Table */}
      <Table
        columns={columns}
        dataSource={filteredSlots}
        loading={loading}
        pagination={{
          current: currentPage,
          pageSize: 10,
          showSizeChanger: true,
          onChange: (page) => setCurrentPage(page)
        }}
        rowClassName="hover:bg-indigo-50/50 cursor-default"
        className="overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-700"
      />

      {/* Detail & Action Drawer */}
      <Drawer
        title={
          <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
              <Settings size={18} />
            </span>
            <span className="font-extrabold">{t('dashboard.liveStatus.slotDetail', { slot: selectedSlot?.slotName })}</span>
          </div>
        }
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={400}
        className="font-sans"
      >
        {selectedSlot && (
          <div className="space-y-6">

            {/* General Info Card */}
            <div className="space-y-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 text-sm dark:border-slate-700">
                <span className="font-semibold text-slate-500 dark:text-slate-400">{t('dashboard.liveStatus.floor')}</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{selectedSlot.floorName}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 text-sm dark:border-slate-700">
                <span className="font-semibold text-slate-500 dark:text-slate-400">{t('dashboard.liveStatus.vehicleType')}</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{getVehicleTypeLabel(selectedSlot.type, t)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-500 dark:text-slate-400">{t('dashboard.liveStatus.currentStatus')}</span>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${getStatusPillClass(selectedSlot.status)}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                  {getStatusLabel(selectedSlot.status, t)}
                </span>
              </div>
            </div>

            {/* Content based on status */}
            {(selectedSlot.status === 'Occupied' || selectedSlot.status === 'Reserved') && (
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">{t('dashboard.liveStatus.parkedData')}</h4>

                {detailLoading ? (
                  <div className="flex flex-col items-center justify-center gap-2 p-6">
                    <Spin size="default" />
                    <span className="text-xs text-slate-500 dark:text-slate-400">{t('dashboard.liveStatus.loadingData')}</span>
                  </div>
                ) : slotDetail?.activeSession ? (
                  <div className="space-y-3 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 dark:border-indigo-500/40 dark:bg-indigo-500/15">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-300">
                        <Car size={16} />
                      </span>
                      <span className="font-mono text-lg font-black text-indigo-900 dark:text-indigo-200">
                        {slotDetail.activeSession.licenseVehicle}
                      </span>
                    </div>

                    {slotDetail.activeSession.checkInTime && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock size={14} className="text-indigo-400" />
                        <span className="text-slate-600 dark:text-slate-300">{t('dashboard.liveStatus.checkInTime', { time: formatVietnamDateTime(slotDetail.activeSession.checkInTime) })}</span>
                      </div>
                    )}

                    {slotDetail.activeSession.customer && (
                      <div className="mt-2 border-t border-indigo-200/50 pt-3 dark:border-indigo-500/30">
                        <div className="flex items-center gap-2 text-sm">
                          <User size={14} className="text-indigo-400" />
                          <span className="font-bold text-slate-700 dark:text-slate-200">{slotDetail.activeSession.customer.username}</span>
                        </div>
                        <div className="mt-1 pl-6 text-xs text-slate-500 dark:text-slate-400">
                          {slotDetail.activeSession.customer.phoneNumber}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center text-xs font-medium text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500">
                    {t('dashboard.liveStatus.noActiveSession')}
                  </div>
                )}

                {/* Force Release Action */}
                <div className="border-t border-slate-100 pt-4 dark:border-slate-700">
                  <h4 className="mb-3 text-xs font-extrabold uppercase tracking-wider text-rose-400">{t('dashboard.liveStatus.adminIntervention')}</h4>
                  <Popconfirm
                    title={t('dashboard.liveStatus.forceReleaseTitle')}
                    description={t('dashboard.liveStatus.forceReleaseDesc')}
                    onConfirm={handleForceRelease}
                    okText={t('dashboard.liveStatus.confirmRelease')}
                    cancelText={t('dashboard.liveStatus.cancel')}
                    okButtonProps={{ danger: true }}
                  >
                    <Button
                      danger
                      block
                      size="large"
                      loading={actionLoading}
                      icon={<Unlock size={16} />}
                      className="flex items-center justify-center gap-2 rounded-[14px] font-bold shadow-sm"
                    >
                      {t('dashboard.liveStatus.forceRelease')}
                    </Button>
                  </Popconfirm>
                  <p className="mt-2 text-center text-[10px] text-slate-400">
                    {t('dashboard.liveStatus.releaseNote')}
                  </p>
                </div>
              </div>
            )}

            {selectedSlot.status === 'Available' && (
              <div className="pt-2">
                <h4 className="mb-3 text-xs font-extrabold uppercase tracking-wider text-slate-400">{t('dashboard.liveStatus.slotControl')}</h4>
                <Space direction="vertical" className="w-full" size="middle">
                  <div className="flex flex-col gap-3 rounded-2xl border border-amber-100 bg-amber-50 p-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-500" />
                      <div>
                        <div className="text-sm font-bold text-amber-800">{t('dashboard.liveStatus.maintenance')}</div>
                        <div className="mt-0.5 text-xs text-amber-600">{t('dashboard.liveStatus.maintenanceDesc')}</div>
                      </div>
                    </div>
                    <Button
                      block
                      loading={actionLoading}
                      onClick={() => handleUnsupportedSlotAction('Maintenance Lock')}
                      className="rounded-[14px] border-0 bg-amber-500 font-bold text-white hover:bg-amber-600"
                    >
                      {t('dashboard.liveStatus.lockMaintenance')}
                    </Button>
                  </div>

                  <div className="flex flex-col gap-3 rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
                    <div className="flex items-start gap-2">
                      <Key size={16} className="mt-0.5 shrink-0 text-indigo-500" />
                      <div>
                        <div className="text-sm font-bold text-indigo-800">{t('dashboard.liveStatus.vip')}</div>
                        <div className="mt-0.5 text-xs text-indigo-600">{t('dashboard.liveStatus.vipDesc')}</div>
                      </div>
                    </div>
                    <Button
                      block
                      loading={actionLoading}
                      onClick={() => handleUnsupportedSlotAction('VIP Reservation')}
                      className="rounded-[14px] border-0 bg-gradient-to-r from-indigo-600 to-indigo-500 font-bold text-white hover:from-indigo-700 hover:to-indigo-600"
                    >
                      {t('dashboard.liveStatus.vip')}
                    </Button>
                  </div>
                </Space>
              </div>
            )}

          </div>
        )}
      </Drawer>
    </div>
  );
};

export default LiveStatusTable;
