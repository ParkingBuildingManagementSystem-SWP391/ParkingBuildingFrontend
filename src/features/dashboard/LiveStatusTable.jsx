import React, { useState, useEffect, useMemo } from 'react';
import { Table, Input, Select, Button, Tag, Drawer, Spin, message, Space, Tooltip, Popconfirm } from 'antd';
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
      render: (text) => <span className="font-mono font-extrabold text-blue-700">{text}</span>,
      sorter: (a, b) => a.slotName.localeCompare(b.slotName)
    },
    {
      title: t('dashboard.liveStatus.vehicleType'),
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        let icon = <Car size={16} className="text-slate-600" />;
        if (type === 'Bicycle') icon = <Bike size={16} className="text-slate-600" />;
        if (type === 'Motorcycle') icon = <Bike size={16} className="text-slate-600" />; // using bike icon for both currently

        return (
          <div className="flex items-center gap-2">
            {icon}
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
        return <Tag color={color} className="font-bold border-0 shadow-sm px-2.5 py-0.5">{getStatusLabel(status, t)}</Tag>;
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
          className="bg-indigo-600 hover:bg-indigo-700 shadow-md flex items-center gap-1.5 rounded-md"
        >
          <Settings size={14} />
          {t('dashboard.liveStatus.manage')}
        </Button>
      ),
    },
  ];

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 font-sans">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-xl font-bold text-indigo-900 flex items-center gap-2">
            <ShieldAlert className="text-indigo-600" />
            {t('dashboard.liveStatus.title')}
          </h3>
          <p className="text-xs text-slate-500 mt-1">{t('dashboard.liveStatus.subtitle')}</p>
        </div>

        <div className="flex items-center gap-3">
          <Select
            value={selectedFloor}
            onChange={(val) => setSelectedFloor(val)}
            className="w-36 h-9"
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
            className="w-48 h-9 rounded-lg"
          />

          <Tooltip title={t('dashboard.liveStatus.refresh')}>
            <Button 
              icon={<RefreshCw size={16} />} 
              onClick={fetchSlots} 
              loading={loading}
              className="h-9 w-9 flex items-center justify-center rounded-lg text-indigo-600 border-indigo-200 hover:bg-indigo-50"
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
        className="border border-slate-100 rounded-xl overflow-hidden"
      />

      {/* Detail & Action Drawer */}
      <Drawer
        title={
          <div className="flex items-center gap-2 text-indigo-900">
            <Settings size={18} />
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
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
              <div className="flex justify-between items-center text-sm border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-semibold">{t('dashboard.liveStatus.floor')}</span>
                <span className="font-bold text-slate-800">{selectedSlot.floorName}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-semibold">{t('dashboard.liveStatus.vehicleType')}</span>
                <span className="font-bold text-slate-800">{getVehicleTypeLabel(selectedSlot.type, t)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-semibold">{t('dashboard.liveStatus.currentStatus')}</span>
                <Tag color={selectedSlot.status === 'Available' ? 'success' : selectedSlot.status === 'Occupied' ? 'error' : 'warning'} className="m-0 font-bold border-0">
                  {getStatusLabel(selectedSlot.status, t)}
                </Tag>
              </div>
            </div>

            {/* Content based on status */}
            {(selectedSlot.status === 'Occupied' || selectedSlot.status === 'Reserved') && (
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">{t('dashboard.liveStatus.parkedData')}</h4>
                
                {detailLoading ? (
                  <div className="flex flex-col items-center justify-center p-6 gap-2">
                    <Spin size="default" />
                    <span className="text-xs text-slate-500">{t('dashboard.liveStatus.loadingData')}</span>
                  </div>
                ) : slotDetail?.activeSession ? (
                  <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Car size={16} className="text-blue-600" />
                      <span className="font-mono text-lg font-black text-blue-800">
                        {slotDetail.activeSession.licenseVehicle}
                      </span>
                    </div>

                    {slotDetail.activeSession.checkInTime && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock size={14} className="text-blue-400" />
                        <span className="text-slate-600">{t('dashboard.liveStatus.checkInTime', { time: new Date(slotDetail.activeSession.checkInTime).toLocaleString('vi-VN') })}</span>
                      </div>
                    )}

                    {slotDetail.activeSession.customer && (
                      <div className="pt-3 mt-2 border-t border-blue-200/50">
                        <div className="flex items-center gap-2 text-sm">
                          <User size={14} className="text-blue-400" />
                          <span className="font-bold text-slate-700">{slotDetail.activeSession.customer.username}</span>
                        </div>
                        <div className="text-xs text-slate-500 pl-6 mt-1">
                          {slotDetail.activeSession.customer.phoneNumber}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-slate-50 p-4 rounded-xl text-center text-xs font-medium text-slate-400">
                    {t('dashboard.liveStatus.noActiveSession')}
                  </div>
                )}

                {/* Force Release Action */}
                <div className="pt-4 border-t border-slate-200">
                  <h4 className="text-xs font-extrabold uppercase text-rose-400 tracking-wider mb-3">{t('dashboard.liveStatus.adminIntervention')}</h4>
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
                      className="font-bold shadow-sm"
                    >
                      {t('dashboard.liveStatus.forceRelease')}
                    </Button>
                  </Popconfirm>
                  <p className="text-[10px] text-slate-400 text-center mt-2">
                    {t('dashboard.liveStatus.releaseNote')}
                  </p>
                </div>
              </div>
            )}

            {selectedSlot.status === 'Available' && (
              <div className="pt-2">
                <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider mb-3">{t('dashboard.liveStatus.slotControl')}</h4>
                <Space direction="vertical" className="w-full" size="middle">
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex flex-col gap-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-amber-800 text-sm">{t('dashboard.liveStatus.maintenance')}</div>
                        <div className="text-xs text-amber-600 mt-0.5">{t('dashboard.liveStatus.maintenanceDesc')}</div>
                      </div>
                    </div>
                    <Button 
                      block 
                      loading={actionLoading}
                      onClick={() => handleUnsupportedSlotAction('Maintenance Lock')}
                      className="bg-amber-500 hover:bg-amber-600 text-white border-0 font-bold"
                    >
                      {t('dashboard.liveStatus.lockMaintenance')}
                    </Button>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 flex flex-col gap-3">
                    <div className="flex items-start gap-2">
                      <Key size={16} className="text-purple-500 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-purple-800 text-sm">{t('dashboard.liveStatus.vip')}</div>
                        <div className="text-xs text-purple-600 mt-0.5">{t('dashboard.liveStatus.vipDesc')}</div>
                      </div>
                    </div>
                    <Button 
                      block 
                      loading={actionLoading}
                      onClick={() => handleUnsupportedSlotAction('VIP Reservation')}
                      className="bg-purple-600 hover:bg-purple-700 text-white border-0 font-bold"
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
