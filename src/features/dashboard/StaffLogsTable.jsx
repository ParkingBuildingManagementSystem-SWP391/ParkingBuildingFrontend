import React, { useEffect, useState, useMemo } from 'react';
import { Table, Button, Input, DatePicker, Select, Space, Tabs, Badge, Tag, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  History,
  UserCheck,
  Search,
  Filter,
  Calendar,
  AlertTriangle,
  FileText,
  DollarSign,
  Clock
} from 'lucide-react';
import { managerService } from '../../services/managerService';
import { formatVietnamDateTime } from '../../utils/dateTime';

const { RangePicker } = DatePicker;
const { Option } = Select;

const StaffLogsTable = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('shifts');

  // Shifts state
  const [shifts, setShifts] = useState([]);
  const [loadingShifts, setLoadingShifts] = useState(false);
  const [shiftStatus, setShiftStatus] = useState('All');
  const [shiftDateRange, setShiftDateRange] = useState(null);

  // Activities state
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [actionType, setActionType] = useState('All');
  const [activityDateRange, setActivityDateRange] = useState(null);
  const [searchStaff, setSearchStaff] = useState('');

  // Fetch shifts
  const fetchShifts = async () => {
    setLoadingShifts(true);
    try {
      const params = {};
      if (shiftStatus !== 'All') {
        params.status = shiftStatus;
      }
      if (shiftDateRange && shiftDateRange[0] && shiftDateRange[1]) {
        params.startDate = shiftDateRange[0].toISOString();
        params.endDate = shiftDateRange[1].toISOString();
      }
      const res = await managerService.getStaffShifts(params);
      const data = Array.isArray(res) ? res : (res?.data || res?.Data || []);
      setShifts(data);
    } catch (err) {
      console.error('fetchShifts error:', err);
    } finally {
      setLoadingShifts(false);
    }
  };

  // Fetch activities
  const fetchActivities = async () => {
    setLoadingActivities(true);
    try {
      const params = {};
      if (actionType !== 'All') {
        params.actionType = actionType;
      }
      if (activityDateRange && activityDateRange[0] && activityDateRange[1]) {
        params.startDate = activityDateRange[0].toISOString();
        params.endDate = activityDateRange[1].toISOString();
      }
      const res = await managerService.getStaffActivities(params);
      const data = Array.isArray(res) ? res : (res?.data || res?.Data || []);
      setActivities(data);
    } catch (err) {
      console.error('fetchActivities error:', err);
    } finally {
      setLoadingActivities(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'shifts') {
      fetchShifts();
    } else {
      fetchActivities();
    }
  }, [activeTab, shiftStatus, shiftDateRange, actionType, activityDateRange]);

  // Client-side search filters
  const filteredShifts = useMemo(() => {
    return shifts.filter(s => {
      const matchStaff = s.staffUsername?.toLowerCase().includes(searchStaff.toLowerCase());
      return matchStaff;
    });
  }, [shifts, searchStaff]);

  const filteredActivities = useMemo(() => {
    return activities.filter(a => {
      const matchStaff = a.staffUsername?.toLowerCase().includes(searchStaff.toLowerCase());
      const matchPlate = a.licensePlate ? a.licensePlate.toLowerCase().includes(searchStaff.toLowerCase()) : false;
      const matchDesc = a.description ? a.description.toLowerCase().includes(searchStaff.toLowerCase()) : false;
      return matchStaff || matchPlate || matchDesc;
    });
  }, [activities, searchStaff]);

  // Format currency
  const formatVND = (value) => {
    if (value === undefined || value === null) return '0 đ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  // Shifts columns definition
  const shiftColumns = [
    {
      title: t('staffShifts.colShiftId'),
      dataIndex: 'shiftId',
      key: 'shiftId',
      render: (id) => <span className="font-mono text-xs font-bold text-slate-700">#{id}</span>
    },
    {
      title: t('staffShifts.colStaff'),
      dataIndex: 'staffUsername',
      key: 'staffUsername',
      render: (text) => <span className="font-extrabold text-slate-900">{text}</span>
    },
    {
      title: t('staffShifts.colTime'),
      key: 'time',
      render: (_, record) => (
        <div className="flex flex-col text-xs text-slate-600 gap-1">
          <span className="flex items-center gap-1.5"><Clock size={12} className="text-emerald-500" /> {t('staffShifts.startTime')} {formatVietnamDateTime(record.startTime)}</span>
          {record.endTime ? (
            <span className="flex items-center gap-1.5"><Clock size={12} className="text-rose-500" /> {t('staffShifts.endTime')} {formatVietnamDateTime(record.endTime)}</span>
          ) : (
            <span className="text-amber-500 font-bold animate-pulse">{t('staffShifts.working')}</span>
          )}
        </div>
      )
    },
    {
      title: t('staffShifts.colSystemCash'),
      dataIndex: 'systemCash',
      key: 'systemCash',
      render: (val) => <span className="font-bold text-indigo-600">{formatVND(val)}</span>
    },
    {
      title: t('staffShifts.colActualCash'),
      dataIndex: 'actualCash',
      key: 'actualCash',
      render: (val) => val !== null ? <span className="font-bold text-emerald-600">{formatVND(val)}</span> : <span className="text-slate-400 font-medium">{t('staffShifts.notClosed')}</span>
    },
    {
      title: t('staffShifts.colDifference'),
      dataIndex: 'difference',
      key: 'difference',
      render: (val) => {
        if (val === null) return '-';
        if (val === 0) return <Tag color="success" className="font-bold">{t('staffShifts.sufficient')}</Tag>;
        return (
          <Tag color="error" className="font-extrabold flex items-center gap-1 w-fit">
            <AlertTriangle size={12} /> {val > 0 ? '+' : ''}{formatVND(val)}
          </Tag>
        );
      }
    },
    {
      title: t('staffShifts.colTransactions'),
      dataIndex: 'totalTransactions',
      key: 'totalTransactions',
      render: (val) => <span className="font-mono font-bold">{val}</span>
    },
    {
      title: t('staffShifts.colStatus'),
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const isActive = status === 'Active';
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${isActive ? 'bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200' : 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-indigo-500' : 'bg-slate-400'}`} />
            {isActive ? t('staffShifts.statusActive') : t('staffShifts.statusClosed')}
          </span>
        );
      }
    },
    {
      title: t('staffShifts.colNotes'),
      dataIndex: 'notes',
      key: 'notes',
      render: (text) => <span className="text-xs text-slate-500 leading-normal max-w-xs block truncate" title={text}>{text || '-'}</span>
    }
  ];

  // Activities columns definition
  const activityColumns = [
    {
      title: t('staffShifts.colTime'),
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (time) => <span className="font-mono text-xs text-slate-500">{formatVietnamDateTime(time)}</span>
    },
    {
      title: t('staffShifts.colStaff'),
      dataIndex: 'staffUsername',
      key: 'staffUsername',
      render: (text) => <span className="font-bold text-slate-900">{text}</span>
    },
    {
      title: t('staffShifts.colActionType'),
      dataIndex: 'actionType',
      key: 'actionType',
      render: (type) => {
        const tagMap = {
          START_SHIFT: { color: 'processing', text: t('staffShifts.actionStartShift') },
          END_SHIFT: { color: 'default', text: t('staffShifts.actionEndShift') },
          CHECK_IN: { color: 'success', text: t('staffShifts.actionCheckIn') },
          CHECK_OUT: { color: 'cyan', text: t('staffShifts.actionCheckOut') },
          PLATE_OVERRIDE: { color: 'warning', text: t('staffShifts.actionPlateOverride') }
        };
        const config = tagMap[type] || { color: 'magenta', text: type };
        return <Tag color={config.color} className="font-bold uppercase text-[10px]">{config.text}</Tag>;
      }
    },
    {
      title: t('staffShifts.colPlate'),
      dataIndex: 'licensePlate',
      key: 'licensePlate',
      render: (plate) => plate ? <span className="font-mono font-black text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-xs">{plate}</span> : '-'
    },
    {
      title: t('staffShifts.colDetails'),
      dataIndex: 'description',
      key: 'description',
      render: (desc, record) => {
        const isOverride = record.actionType === 'PLATE_OVERRIDE';
        return (
          <span className={`text-xs ${isOverride ? 'text-amber-700 font-semibold bg-amber-50/50 px-2 py-1 rounded border border-amber-100' : 'text-slate-600'}`}>
            {desc}
          </span>
        );
      }
    },
    {
      title: t('staffShifts.colIp'),
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      render: (ip) => <span className="font-mono text-slate-400 text-xs">{ip || '-'}</span>
    }
  ];

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5 font-sans dark:border-slate-700 dark:bg-slate-900">
      
      {/* Header section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-inset ring-indigo-100 dark:bg-indigo-500/15 dark:text-indigo-300 dark:ring-indigo-500/40">
            <History size={22} />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
              {t('staffShifts.title')}
            </h3>
            <p className="text-sm text-slate-500 mt-0.5 dark:text-slate-400">
              {t('staffShifts.subtitle')}
            </p>
          </div>
        </div>

        {/* Global Search Input */}
        <div className="w-full sm:w-64">
          <Input
            placeholder={t('staffShifts.searchPlaceholder')}
            prefix={<Search size={16} className="text-slate-400" />}
            value={searchStaff}
            onChange={(e) => setSearchStaff(e.target.value)}
            className="h-10 rounded-[12px]"
          />
        </div>
      </div>

      {/* Tabs navigation */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        className="[&_.ant-tabs-nav]:!mb-4"
        items={[
          {
            key: 'shifts',
            label: (
              <span className="flex items-center gap-2 font-bold px-1 py-0.5">
                <DollarSign size={16} /> {t('staffShifts.tabShifts')}
              </span>
            ),
            children: (
              <div className="space-y-4">
                {/* Filters Row */}
                <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 dark:bg-slate-800/40 dark:border-slate-800">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Filter size={10} /> {t('staffShifts.filterStatus')}</span>
                    <Select
                      value={shiftStatus}
                      onChange={setShiftStatus}
                      className="w-44 [&_.ant-select-selector]:!rounded-xl [&_.ant-select-selector]:!h-10 [&_.ant-select-selector]:!flex [&_.ant-select-selector]:items-center"
                    >
                      <Option value="All">{t('staffShifts.allStatus')}</Option>
                      <Option value="Active">{t('staffShifts.statusActive')} (Active)</Option>
                      <Option value="Closed">{t('staffShifts.statusClosed')} (Closed)</Option>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Calendar size={10} /> {t('staffShifts.filterTime')}</span>
                    <RangePicker
                      value={shiftDateRange}
                      onChange={setShiftDateRange}
                      className="!rounded-xl !h-10"
                      placeholder={[t('parkingSession.fromDate'), t('parkingSession.toDate')]}
                    />
                  </div>
                </div>

                {/* Table Data */}
                <Table
                  columns={shiftColumns}
                  dataSource={filteredShifts}
                  loading={loadingShifts}
                  rowKey="shiftId"
                  pagination={{ pageSize: 8 }}
                  className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm dark:border-slate-800"
                />
              </div>
            )
          },
          {
            key: 'activities',
            label: (
              <span className="flex items-center gap-2 font-bold px-1 py-0.5">
                <FileText size={16} /> {t('staffShifts.tabActivities')}
              </span>
            ),
            children: (
              <div className="space-y-4">
                {/* Filters Row */}
                <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 dark:bg-slate-800/40 dark:border-slate-800">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Filter size={10} /> {t('staffShifts.colActionType')}</span>
                    <Select
                      value={actionType}
                      onChange={setActionType}
                      className="w-56 [&_.ant-select-selector]:!rounded-xl [&_.ant-select-selector]:!h-10 [&_.ant-select-selector]:!flex [&_.ant-select-selector]:items-center"
                    >
                      <Option value="All">{t('staffShifts.allActions')}</Option>
                      <Option value="START_SHIFT">{t('staffShifts.actionStartShift')} (START_SHIFT)</Option>
                      <Option value="END_SHIFT">{t('staffShifts.actionEndShift')} (END_SHIFT)</Option>
                      <Option value="CHECK_IN">{t('staffShifts.actionCheckIn')} (CHECK_IN)</Option>
                      <Option value="CHECK_OUT">{t('staffShifts.actionCheckOut')} (CHECK_OUT)</Option>
                      <Option value="PLATE_OVERRIDE">{t('staffShifts.actionPlateOverride')} (PLATE_OVERRIDE)</Option>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Calendar size={10} /> {t('staffShifts.filterTime')}</span>
                    <RangePicker
                      value={activityDateRange}
                      onChange={setActivityDateRange}
                      className="!rounded-xl !h-10"
                      placeholder={[t('parkingSession.fromDate'), t('parkingSession.toDate')]}
                    />
                  </div>
                </div>

                {/* Table Data */}
                <Table
                  columns={activityColumns}
                  dataSource={filteredActivities}
                  loading={loadingActivities}
                  rowKey="logId"
                  pagination={{ pageSize: 10 }}
                  rowClassName={(record) => record.actionType === 'PLATE_OVERRIDE' ? 'bg-amber-50/20 hover:bg-amber-50/40 dark:bg-amber-500/5' : ''}
                  className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm dark:border-slate-800"
                />
              </div>
            )
          }
        ]}
      />
    </div>
  );
};

export default StaffLogsTable;
