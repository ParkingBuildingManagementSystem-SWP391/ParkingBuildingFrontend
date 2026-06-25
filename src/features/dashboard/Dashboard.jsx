import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { managerService } from '../../services/managerService';
import LiveStatusTable from './LiveStatusTable';
import IncidentsTable from './IncidentsTable';
import {
  ShieldAlert,
  Car,
  DollarSign,
  Percent,
  Calendar,
  Filter,
  Download,
  BarChart3,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button, InputNumber, message } from 'antd';

const defaultPricingData = [
  {
    vehicleTypeId: 1,
    vehicleType: 'Bicycle',
    description: 'Xe đạp, xe đạp điện',
    dayRate: 2000,
    nightRate: 3000,
    fullDayRate: 5000,
    maxHoursPerTurn: null
  },
  {
    vehicleTypeId: 2,
    vehicleType: 'Motorbike',
    description: 'Xe máy, xe mô tô',
    dayRate: 4000,
    nightRate: 6000,
    fullDayRate: 10000,
    maxHoursPerTurn: null
  },
  {
    vehicleTypeId: 3,
    vehicleType: 'Car',
    description: 'Xe hơi dưới 7 chỗ',
    dayRate: 20000,
    nightRate: 30000,
    fullDayRate: 50000,
    maxHoursPerTurn: 4
  }
];

const Dashboard = ({ section = 'overview' }) => {
  const { role } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const lowerRole = role?.toLowerCase();

  // Manager Dashboard States
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [errorSummary, setErrorSummary] = useState('');

  // Manager Analytics States
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [groupBy, setGroupBy] = useState('DAY');
  const [vehicleTypeId, setVehicleTypeId] = useState('');
  const [trafficStats, setTrafficStats] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [errorStats, setErrorStats] = useState('');
  const [exporting, setExporting] = useState(false);
  const [pricingRows, setPricingRows] = useState(defaultPricingData);
  const [savingPricingIds, setSavingPricingIds] = useState({});

  // Fetch dashboard summary
  const fetchSummary = async () => {
    setLoadingSummary(true);
    setErrorSummary('');
    try {
      const data = await managerService.getDashboardSummary();
      setSummary(data);
    } catch (err) {
      console.error("fetchSummary error:", err);
      setErrorSummary(t('dashboard.errorSummary'));
    } finally {
      setLoadingSummary(false);
    }
  };

  // Fetch traffic statistics
  const fetchTrafficStats = async () => {
    setLoadingStats(true);
    setErrorStats('');
    try {
      const params = {
        StartDate: startDate,
        EndDate: endDate,
        GroupBy: groupBy,
        VehicleTypeId: vehicleTypeId ? parseInt(vehicleTypeId) : null
      };
      const data = await managerService.getTrafficStatistics(params);
      setTrafficStats(data);
    } catch (err) {
      console.error("fetchTrafficStats error:", err);
      setErrorStats(t('dashboard.errorStats', { defaultValue: 'Không thể tải thống kê lượt xe.' }));
    } finally {
      setLoadingStats(false);
    }
  };

  const handleExport = async (format) => {
    setExporting(true);
    try {
      const blob = await managerService.exportReport({
        StartDate: startDate,
        EndDate: endDate,
        Format: format,
        VehicleTypeId: vehicleTypeId ? parseInt(vehicleTypeId) : null
      });
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      const filename = `Report_ParkingHistory_${startDate}_to_${endDate}.${format.toLowerCase() === 'pdf' ? 'pdf' : 'xlsx'}`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      message.success(`Đã xuất báo cáo thành công dưới dạng ${format}`);
    } catch (err) {
      console.error("Export error:", err);
      message.error("Không thể xuất báo cáo.");
    } finally {
      setExporting(false);
    }
  };

  const getPricingRowKey = (row) => row.vehicleTypeId ?? row.pricingId ?? row.id ?? row.vehicleType ?? row.name;

  const handlePricingValueChange = (rowKey, field, value) => {
    setPricingRows((prev) => prev.map((row) => (
      getPricingRowKey(row) === rowKey
        ? { ...row, [field]: value }
        : row
    )));
  };

  const handleUpdatePricing = async (row) => {
    const rowKey = getPricingRowKey(row);
    const isCarPricing = Number(row.vehicleTypeId) === 3 || String(row.vehicleType).toLowerCase() === 'car';
    setSavingPricingIds((prev) => ({ ...prev, [rowKey]: true }));
    try {
      await managerService.updateVehiclePricing({
        vehicleTypeId: row.vehicleTypeId,
        dayRate: row.dayRate,
        nightRate: row.nightRate,
        fullDayRate: row.fullDayRate,
        maxHoursPerTurn: isCarPricing ? row.maxHoursPerTurn : null
      });
      message.success(`Đã cập nhật cấu hình giá cho ${getVehicleTypeLabel(row.vehicleType)}.`);
    } catch (err) {
      console.error('handleUpdatePricing error:', err);
      const status = err.response?.status;
      const backendMessage = err.response?.data?.message || err.response?.data?.error || err.response?.data;
      if (status === 400) {
        message.error(backendMessage || 'Giá cấu hình không hợp lệ.');
      } else if (status === 401 || status === 403) {
        message.error(backendMessage || 'Bạn cần đăng nhập bằng tài khoản có quyền Manager/Admin.');
      } else if (status === 404) {
        message.error(backendMessage || 'Không tìm thấy loại xe yêu cầu.');
      } else if (status === 500) {
        message.error(backendMessage || 'Lỗi máy chủ khi cập nhật bảng giá.');
      } else {
        message.error(backendMessage || 'Không thể cập nhật cấu hình giá.');
      }
    } finally {
      setSavingPricingIds((prev) => ({ ...prev, [rowKey]: false }));
    }
  };

  useEffect(() => {
    if ((lowerRole === 'admin' || lowerRole === 'manager') && section === 'overview') {
      fetchSummary();
      const interval = setInterval(fetchSummary, 30000);
      return () => clearInterval(interval);
    }
  }, [lowerRole, section]);

  useEffect(() => {
    if ((lowerRole === 'admin' || lowerRole === 'manager') && section === 'analytics') {
      fetchTrafficStats();
    }
  }, [lowerRole, section, startDate, endDate, groupBy, vehicleTypeId]);

  // Redirect driver and staff to /parking-map automatically
  useEffect(() => {
    if (lowerRole && ['driver', 'member', 'registered_driver', 'customer', 'staff'].includes(lowerRole)) {
      navigate('/parking-map');
    }
  }, [lowerRole, navigate]);

  // Format currencies in VND
  const formatVND = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const getVehicleTypeLabel = (type) => {
    const normalized = String(type || '').toLowerCase();
    if (normalized === 'car') return t('dashboard.car');
    if (normalized === 'motorbike' || normalized === 'motorcycle') return t('dashboard.motorbike');
    if (normalized === 'bicycle' || normalized === 'bike') return t('dashboard.bicycle');
    return type || 'Không xác định';
  };

  // ----------------------------------------------------
  // MANAGER & ADMIN DASHBOARD
  // ----------------------------------------------------
  const renderManagerDashboard = () => {
    if (section === 'overview' && loadingSummary && !summary) {
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center text-slate-500 font-medium">
          <Loader2 className="h-9 w-9 text-indigo-600 animate-spin mb-3" />
          <span className="font-semibold">{t('dashboard.loadingSummary')}</span>
        </div>
      );
    }

    if (section === 'overview' && errorSummary && !summary) {
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center text-rose-600 font-bold bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center mb-3">
            <ShieldAlert size={28} className="text-rose-500" />
          </div>
          <span>{errorSummary}</span>
          <button
            onClick={fetchSummary}
            className="mt-5 rounded-[14px] bg-gradient-to-br from-indigo-500 to-indigo-600 text-white font-bold px-5 py-2.5 text-sm shadow-md shadow-indigo-200 hover:-translate-y-0.5 transition-all"
          >
            {t('dashboard.retry')}
          </button>
        </div>
      );
    }

    const sectionLabels = {
      'slot-management': t('dashboard.slotManagement', { defaultValue: 'Quản lý chỗ đỗ' }),
      'staff-logs': t('dashboard.staffLogs', { defaultValue: 'Nhật ký nhân viên' })
    };

    // Vehicles distribution calculations
    const carDetail = summary?.vehiclesInBuildingDetail?.find(v => v.vehicleTypeName.toLowerCase() === 'car') || { inBuildingCount: 0 };
    const bikeDetail = summary?.vehiclesInBuildingDetail?.find(v => v.vehicleTypeName.toLowerCase() === 'motorbike' || v.vehicleTypeName.toLowerCase() === 'motorcycle') || { inBuildingCount: 0 };
    const bicycleDetail = summary?.vehiclesInBuildingDetail?.find(v => v.vehicleTypeName.toLowerCase() === 'bicycle' || v.vehicleTypeName.toLowerCase() === 'bike') || { inBuildingCount: 0 };
    const totalInBuilding = carDetail.inBuildingCount + bikeDetail.inBuildingCount + bicycleDetail.inBuildingCount;

    const carPercent = totalInBuilding > 0 ? Math.round((carDetail.inBuildingCount / totalInBuilding) * 100) : 0;
    const bikePercent = totalInBuilding > 0 ? Math.round((bikeDetail.inBuildingCount / totalInBuilding) * 100) : 0;
    const bicyclePercent = totalInBuilding > 0 ? Math.round((bicycleDetail.inBuildingCount / totalInBuilding) * 100) : 0;

    const circ = 314.16;
    const carStroke = `${(carPercent / 100) * circ} ${circ}`;
    const bikeStroke = `${(bikePercent / 100) * circ} ${circ}`;
    const bicycleStroke = `${(bicyclePercent / 100) * circ} ${circ}`;

    const bikeOffset = -((carPercent / 100) * circ);
    const bicycleOffset = -(((carPercent + bikePercent) / 100) * circ);

    const renderTrafficChart = () => {
      if (trafficStats.length === 0) return null;
      const maxTraffic = Math.max(...trafficStats.map(s => Math.max(s.checkInCount, s.checkOutCount)), 5);
      const height = 150;
      const width = 380;
      const paddingLeft = 40;
      const paddingTop = 10;
      const hPadding = 35;
      const chartWidth = width - paddingLeft;
      const usableWidth = chartWidth - 2 * hPadding;
      const chartHeight = height - paddingTop - 20;

      const getPathPoints = (key) => {
        return trafficStats.map((item, idx) => {
          const x = paddingLeft + hPadding + (idx / Math.max(1, trafficStats.length - 1)) * usableWidth;
          const val = item[key] || 0;
          const y = height - 20 - (val / maxTraffic) * chartHeight;
          return { x, y };
        });
      };

      const checkInPoints = getPathPoints('checkInCount');
      const checkOutPoints = getPathPoints('checkOutCount');

      const checkInPath = checkInPoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
      const checkOutPath = checkOutPoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

      const checkInArea = checkInPoints.length > 0
        ? `${checkInPath} L ${checkInPoints[checkInPoints.length - 1].x} ${height - 20} L ${checkInPoints[0].x} ${height - 20} Z`
        : '';
      const checkOutArea = checkOutPoints.length > 0
        ? `${checkOutPath} L ${checkOutPoints[checkOutPoints.length - 1].x} ${height - 20} L ${checkOutPoints[0].x} ${height - 20} Z`
        : '';

      return (
        <div className="space-y-2">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
            <defs>
              <linearGradient id="checkInGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.18"/>
                <stop offset="100%" stopColor="#4f46e5" stopOpacity="0"/>
              </linearGradient>
              <linearGradient id="checkOutGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.18"/>
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0"/>
              </linearGradient>
            </defs>

            {/* Gridlines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
              const y = paddingTop + pct * chartHeight;
              const val = Math.round(maxTraffic * (1 - pct));
              return (
                <g key={i}>
                  <line x1={paddingLeft} y1={y} x2={width} y2={y} stroke="#F1F5F9" strokeWidth="1" />
                  <text x={paddingLeft - 8} y={y + 3} className="text-[8px] font-bold fill-slate-400" textAnchor="end">{val}</text>
                </g>
              );
            })}

            {/* Filled Areas */}
            {checkInArea && <path d={checkInArea} fill="url(#checkInGrad)" />}
            {checkOutArea && <path d={checkOutArea} fill="url(#checkOutGrad)" />}

            {/* Paths */}
            {checkInPath && <path d={checkInPath} fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
            {checkOutPath && <path d={checkOutPath} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}

            {/* X Axis labels */}
            {trafficStats.length > 0 && trafficStats.map((item, idx) => {
              const x = paddingLeft + hPadding + (idx / Math.max(1, trafficStats.length - 1)) * usableWidth;
              // To prevent overlap if there are many dates, we could rotate or skip. For now, render all.
              // If we have more than 7 items, only show a subset or rotate.
              if (trafficStats.length > 7 && idx % Math.ceil(trafficStats.length / 7) !== 0 && idx !== trafficStats.length - 1) return null;

              return (
                <text key={idx} x={x} y={height - 2} className="text-[8px] font-bold fill-slate-400" textAnchor="middle">
                  {item.timeLabel.replace(/^\d{4}-/, '')}
                </text>
              );
            })}
          </svg>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 pt-3 border-t border-slate-100 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-1 rounded-full bg-indigo-600 inline-block"></span>
              <span className="text-slate-600">{t('dashboard.checkInLabel')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-1 rounded-full bg-amber-500 inline-block"></span>
              <span className="text-slate-600">{t('dashboard.checkOutLabel')}</span>
            </div>
          </div>
        </div>
      );
    };

    const renderRevenueChart = () => {
      if (trafficStats.length === 0) return null;
      const maxRevenue = Math.max(...trafficStats.map(s => s.revenueGenerated), 10000);
      const height = 150;
      const width = 380;
      const paddingLeft = 50;
      const paddingTop = 10;
      const hPadding = 35;
      const chartWidth = width - paddingLeft;
      const usableWidth = chartWidth - 2 * hPadding;
      const chartHeight = height - paddingTop - 20;

      const barWidth = Math.max(4, Math.min(24, (usableWidth / trafficStats.length) * 0.6));

      return (
        <div className="space-y-2">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981"/>
                <stop offset="100%" stopColor="#059669"/>
              </linearGradient>
            </defs>
            {/* Gridlines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
              const y = paddingTop + pct * chartHeight;
              const val = maxRevenue * (1 - pct);
              let valStr = val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : val >= 1000 ? `${Math.round(val / 1000)}k` : Math.round(val);
              return (
                <g key={i}>
                  <line x1={paddingLeft} y1={y} x2={width} y2={y} stroke="#F1F5F9" strokeWidth="1" />
                  <text x={paddingLeft - 8} y={y + 3} className="text-[8px] font-bold fill-slate-400" textAnchor="end">{valStr} đ</text>
                </g>
              );
            })}

            {/* Bars */}
            {trafficStats.map((item, idx) => {
              const xCenter = paddingLeft + hPadding + (idx / Math.max(1, trafficStats.length - 1)) * usableWidth;
              const x = xCenter - barWidth / 2;
              const val = item.revenueGenerated || 0;
              const barHeight = (val / maxRevenue) * chartHeight;
              const y = height - 20 - barHeight;

              return (
                <rect
                  key={idx}
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.max(barHeight, 2)}
                  fill="url(#revenueGrad)"
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                  rx="3"
                >
                  <title>{`${item.timeLabel}: ${val.toLocaleString('vi-VN')} đ`}</title>
                </rect>
              );
            })}

            {/* X Axis labels */}
            {trafficStats.length > 0 && trafficStats.map((item, idx) => {
              const x = paddingLeft + hPadding + (idx / Math.max(1, trafficStats.length - 1)) * usableWidth;
              if (trafficStats.length > 7 && idx % Math.ceil(trafficStats.length / 7) !== 0 && idx !== trafficStats.length - 1) return null;

              return (
                <text key={idx} x={x} y={height - 2} className="text-[8px] font-bold fill-slate-400" textAnchor="middle">
                  {item.timeLabel.replace(/^\d{4}-/, '')}
                </text>
              );
            })}
          </svg>

          {/* Legend */}
          <div className="flex items-center justify-center gap-2 pt-3 border-t border-slate-100 text-xs font-semibold">
            <span className="w-3.5 h-3.5 bg-emerald-500 rounded-md block"></span>
            <span className="text-slate-600">{t('dashboard.revenueLabel')}</span>
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-6 select-none pb-12">
        {section === 'overview' ? (
          <div className="space-y-6">

            {/* B. Core Metric Cards Row (4 Columns Layout) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

              {/* Card 1: Total Vehicles Current */}
              <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100/70 shadow-sm flex items-center justify-between min-h-[110px] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <div className="space-y-1">
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">{t('dashboard.totalVehicles')}</span>
                  <span className="text-3xl font-extrabold tracking-tight text-slate-900 block">{summary?.occupiedSlotsCount || 0}</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                  <Car size={24} />
                </div>
              </div>

              {/* Card 2: Daily Revenue */}
              <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100/70 shadow-sm flex items-center justify-between min-h-[110px] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <div className="space-y-1">
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">{t('dashboard.todayRevenue')}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-extrabold tracking-tight text-slate-900">{formatVND(summary?.todayRevenue || 0)}</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
                  <DollarSign size={24} />
                </div>
              </div>

              {/* Card 3: Overall Occupancy Rate */}
              <div className="bg-violet-50 p-6 rounded-2xl border border-violet-100/70 shadow-sm flex items-center justify-between min-h-[110px] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <div className="space-y-1">
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">{t('dashboard.occupancyRate')}</span>
                  <span className="text-3xl font-extrabold tracking-tight text-slate-900 block">{((summary?.occupancyRate) || 0).toFixed(1)}%</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-violet-600 shadow-sm shrink-0">
                  <Percent size={24} />
                </div>
              </div>

              {/* Card 4: Available Slots */}
              <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100/70 shadow-sm flex items-center justify-between min-h-[110px] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <div className="space-y-1">
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">{t('dashboard.availableSlots')}</span>
                  <span className="text-3xl font-extrabold tracking-tight text-slate-900 block">{summary?.availableSlotsCount || 0}</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-amber-600 shadow-sm shrink-0">
                  <Calendar size={24} />
                </div>
              </div>

            </div>

            {/* C. Data Visualization Section (Two-Column Layout) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Left Column: Vehicles Distribution */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-extrabold tracking-tight text-slate-900">{t('dashboard.vehiclesInLot')}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{t('dashboard.vehiclesDistribution')}</p>
                </div>

                <div className="flex flex-col items-center justify-center py-6">
                  {totalInBuilding > 0 ? (
                    <svg viewBox="0 0 320 210" className="w-full max-w-[290px] h-auto">
                      <circle cx="160" cy="105" r="50" fill="transparent" stroke="#F1F5F9" strokeWidth="16" />

                      {/* Car Slice */}
                      {carPercent > 0 && (
                        <circle
                          cx="160"
                          cy="105"
                          r="50"
                          fill="transparent"
                          stroke="#10b981"
                          strokeWidth="16"
                          strokeLinecap="round"
                          strokeDasharray={carStroke}
                          strokeDashoffset="0"
                          transform="rotate(-90 160 105)"
                        />
                      )}

                      {/* Motorbike Slice */}
                      {bikePercent > 0 && (
                        <circle
                          cx="160"
                          cy="105"
                          r="50"
                          fill="transparent"
                          stroke="#4f46e5"
                          strokeWidth="16"
                          strokeLinecap="round"
                          strokeDasharray={bikeStroke}
                          strokeDashoffset={bikeOffset}
                          transform="rotate(-90 160 105)"
                        />
                      )}

                      {/* Bicycle Slice */}
                      {bicyclePercent > 0 && (
                        <circle
                          cx="160"
                          cy="105"
                          r="50"
                          fill="transparent"
                          stroke="#f59e0b"
                          strokeWidth="16"
                          strokeLinecap="round"
                          strokeDasharray={bicycleStroke}
                          strokeDashoffset={bicycleOffset}
                          transform="rotate(-90 160 105)"
                        />
                      )}

                      {/* Center Text labels */}
                      <text x="160" y="100" textAnchor="middle" className="text-[10px] font-bold uppercase tracking-wider fill-slate-400">{t('dashboard.total')}</text>
                      <text x="160" y="120" textAnchor="middle" className="text-lg font-extrabold fill-slate-900">{totalInBuilding}</text>
                    </svg>
                  ) : (
                    <div className="text-center py-12 text-slate-400 font-semibold text-xs">
                      {t('dashboard.noVehicles')}
                    </div>
                  )}

                  {/* Legend below chart */}
                  <div className="flex items-center justify-center flex-wrap gap-4 mt-4 pt-4 border-t border-slate-100 w-full">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-emerald-500 block"></span>
                      <span className="text-xs text-slate-600 font-medium">{t('dashboard.car')}: {carDetail.inBuildingCount} ({carPercent}%)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-indigo-600 block"></span>
                      <span className="text-xs text-slate-600 font-medium">{t('dashboard.motorbike')}: {bikeDetail.inBuildingCount} ({bikePercent}%)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-amber-500 block"></span>
                      <span className="text-xs text-slate-600 font-medium">{t('dashboard.bicycle')}: {bicycleDetail.inBuildingCount} ({bicyclePercent}%)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Building Details & Current Shift */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-extrabold tracking-tight text-slate-900">{t('dashboard.operationSummary')}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{t('dashboard.operationDesc')}</p>
                </div>

                <div className="space-y-3 py-4">
                  <div className="flex justify-between items-center rounded-xl bg-slate-50 px-4 py-4">
                    <span className="text-sm text-slate-500 font-semibold">{t('dashboard.totalRevenueTitle')}</span>
                    <span className="text-sm font-extrabold text-slate-900">{formatVND(summary?.totalRevenue || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center rounded-xl bg-slate-50 px-4 py-4">
                    <span className="text-sm text-slate-500 font-semibold">{t('dashboard.reservedSlotsTitle')}</span>
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-sm font-extrabold text-amber-700">{summary?.reservedSlotsCount || 0}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* D. Floor Occupancy Status Table (Full Width) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div>
                <h3 className="text-lg font-extrabold tracking-tight text-slate-900">{t('dashboard.floorOccupancy')}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{t('dashboard.floorOccupancyDesc')}</p>
              </div>

              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('dashboard.table.floor')}</th>
                      <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">{t('dashboard.table.totalSlots')}</th>
                      <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">{t('dashboard.table.occupied')}</th>
                      <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">{t('dashboard.table.available')}</th>
                      <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('dashboard.table.rate')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {summary?.floorOccupancyDetail?.map((floor, idx) => {
                      const capacity = floor.capacity || 100;
                      const occupied = floor.occupiedCount || 0;
                      const available = capacity - occupied;
                      const rate = capacity > 0 ? Math.round((occupied / capacity) * 100) : 0;

                      return (
                        <tr key={floor.floorId || idx} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-4 px-4 text-sm font-semibold text-slate-700">{floor.floorName}</td>
                          <td className="py-4 px-4 text-sm font-medium text-slate-600 text-center">{capacity}</td>
                          <td className="py-4 px-4 text-center">
                            <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-0.5 text-sm font-bold text-rose-600">{occupied}</span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-sm font-bold text-emerald-600">{available}</span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden max-w-[140px] md:max-w-[200px] shrink-0">
                                <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-full rounded-full transition-all duration-500" style={{ width: `${rate}%` }}></div>
                              </div>
                              <span className="text-sm font-bold text-slate-700">{rate}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        ) : section === 'live-status' ? (
          <LiveStatusTable />
        ) : section === 'incidents' ? (
          <IncidentsTable />
        ) : section === 'analytics' ? (
          <div className="space-y-6">
            {/* Filter Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                  <Filter size={18} />
                </div>
                <h3 className="text-base font-extrabold tracking-tight text-slate-900">{t('dashboard.filterTitle')}</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('dashboard.startDate')}</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full h-11 px-3 bg-slate-50 border-[1.5px] border-slate-200 text-sm rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-semibold text-slate-700"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('dashboard.endDate')}</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full h-11 px-3 bg-slate-50 border-[1.5px] border-slate-200 text-sm rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-semibold text-slate-700"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('dashboard.groupBy')}</label>
                  <select
                    value={groupBy}
                    onChange={(e) => setGroupBy(e.target.value)}
                    className="w-full h-11 px-3 bg-slate-50 border-[1.5px] border-slate-200 text-sm rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-semibold text-slate-700"
                  >
                    <option value="DAY">{t('dashboard.byDay')}</option>
                    <option value="HOUR">{t('dashboard.byHour')}</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('dashboard.vehicleType')}</label>
                  <select
                    value={vehicleTypeId}
                    onChange={(e) => setVehicleTypeId(e.target.value)}
                    className="w-full h-11 px-3 bg-slate-50 border-[1.5px] border-slate-200 text-sm rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-semibold text-slate-700"
                  >
                    <option value="">{t('dashboard.allVehicles')}</option>
                    <option value="3">{t('dashboard.car')}</option>
                    <option value="2">{t('dashboard.motorbike')}</option>
                    <option value="1">{t('dashboard.bicycle')}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Report Export Panel */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                  <Download size={18} />
                </div>
                <h3 className="text-base font-extrabold tracking-tight text-slate-900">{t('dashboard.exportTitle')}</h3>
              </div>
              <p className="text-xs text-slate-500">{t('dashboard.exportDesc')}</p>
              <div className="flex flex-wrap items-center gap-4 pt-1">
                <button
                  disabled={exporting}
                  onClick={() => handleExport('EXCEL')}
                  className="h-11 px-6 rounded-[14px] bg-gradient-to-br from-emerald-500 to-emerald-600 text-white text-sm font-bold shadow-md shadow-emerald-200 hover:-translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                  {t('dashboard.exportExcel')}
                </button>
                <button
                  disabled={exporting}
                  onClick={() => handleExport('PDF')}
                  className="h-11 px-6 rounded-[14px] bg-gradient-to-br from-rose-500 to-rose-600 text-white text-sm font-bold shadow-md shadow-rose-200 hover:-translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                  {t('dashboard.exportPdf')}
                </button>
              </div>
            </div>

            {/* Charts Section */}
            {loadingStats ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-slate-400">
                <Loader2 size={32} className="animate-spin text-indigo-600 mb-2" />
                <span className="text-xs font-semibold">{t('dashboard.loadingCharts')}</span>
              </div>
            ) : errorStats ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-100 shadow-sm text-center text-rose-500 font-bold">
                <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-3">
                  <ShieldAlert size={28} className="text-rose-500" />
                </div>
                <span>{errorStats}</span>
              </div>
            ) : trafficStats.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-100 shadow-sm text-center text-slate-400 font-semibold">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                  <BarChart3 size={28} className="text-slate-400" />
                </div>
                <span>{t('dashboard.noData')}</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Traffic flow SVG chart */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-extrabold tracking-tight text-slate-900">{t('dashboard.trafficChartTitle')}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{t('dashboard.trafficChartDesc')}</p>
                  </div>
                  <div className="py-6">
                    {renderTrafficChart()}
                  </div>
                </div>

                {/* Revenue SVG chart */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-extrabold tracking-tight text-slate-900">{t('dashboard.revenueChartTitle')}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{t('dashboard.revenueChartDesc')}</p>
                  </div>
                  <div className="py-6">
                    {renderRevenueChart()}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : section === 'pricing' ? (
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                <DollarSign size={18} />
              </div>
              <div>
                <h3 className="text-base font-extrabold tracking-tight text-slate-900">{t('dashboard.pricingTitle')}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{t('dashboard.pricingDesc')}</p>
              </div>
            </div>

            <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full min-w-[920px] border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-4 py-3 text-xs font-extrabold uppercase tracking-wider text-slate-500">{t('dashboard.pricingTable.vehicleType')}</th>
                    <th className="px-4 py-3 text-xs font-extrabold uppercase tracking-wider text-slate-500">{t('dashboard.pricingTable.dayRate')}</th>
                    <th className="px-4 py-3 text-xs font-extrabold uppercase tracking-wider text-slate-500">{t('dashboard.pricingTable.nightRate')}</th>
                    <th className="px-4 py-3 text-xs font-extrabold uppercase tracking-wider text-slate-500">{t('dashboard.pricingTable.fullDayRate')}</th>
                    <th className="px-4 py-3 text-xs font-extrabold uppercase tracking-wider text-slate-500">{t('dashboard.pricingTable.maxHours')}</th>
                    <th className="px-4 py-3 text-xs font-extrabold uppercase tracking-wider text-slate-500 text-right">{t('dashboard.pricingTable.action')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {pricingRows.map((row, index) => {
                    const rowKey = getPricingRowKey(row) ?? index;
                    const isCarPricing = Number(row.vehicleTypeId) === 3 || String(row.vehicleType).toLowerCase() === 'car';

                    return (
                    <tr key={rowKey} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-4 align-middle">
                        <div className="flex flex-col">
                          <span className="text-sm font-extrabold text-slate-900">{getVehicleTypeLabel(row.vehicleType)}</span>
                          <span className="text-xs font-medium text-slate-400">{row.description}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-middle">
                        <InputNumber
                          min={0}
                          value={row.dayRate}
                          formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                          parser={(value) => value?.replace(/\s?VND|(,*)/g, '')}
                          onChange={(value) => handlePricingValueChange(rowKey, 'dayRate', value ?? 0)}
                          addonAfter="VND"
                          className="w-full"
                        />
                      </td>
                      <td className="px-4 py-4 align-middle">
                        <InputNumber
                          min={0}
                          value={row.nightRate}
                          formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                          parser={(value) => value?.replace(/\s?VND|(,*)/g, '')}
                          onChange={(value) => handlePricingValueChange(rowKey, 'nightRate', value ?? 0)}
                          addonAfter="VND"
                          className="w-full"
                        />
                      </td>
                      <td className="px-4 py-4 align-middle">
                        <InputNumber
                          min={0}
                          value={row.fullDayRate}
                          formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                          parser={(value) => value?.replace(/\s?VND|(,*)/g, '')}
                          onChange={(value) => handlePricingValueChange(rowKey, 'fullDayRate', value ?? 0)}
                          addonAfter="VND"
                          className="w-full"
                        />
                      </td>
                      <td className="px-4 py-4 align-middle">
                        {isCarPricing ? (
                          <InputNumber
                            min={1}
                            max={24}
                            value={row.maxHoursPerTurn}
                            onChange={(value) => handlePricingValueChange(rowKey, 'maxHoursPerTurn', value ?? 1)}
                            addonAfter="giờ"
                            className="w-full"
                          />
                        ) : (
                          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-400">{t('dashboard.pricingTable.notApplicable')}</span>
                        )}
                      </td>
                      <td className="px-4 py-4 align-middle text-right">
                        <Button
                          type="primary"
                          loading={Boolean(savingPricingIds[rowKey])}
                          onClick={() => handleUpdatePricing(row)}
                          className="h-9 rounded-xl bg-indigo-600 px-5 font-bold"
                        >
                          {t('dashboard.pricingTable.save')}
                        </Button>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-100 rounded-2xl py-24 text-center shadow-sm">
            <h3 className="text-slate-900 font-extrabold tracking-tight text-lg">{sectionLabels[section] || 'Chức năng quản lý'}</h3>
            <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto">
              {t('dashboard.noDataSection')}
            </p>
          </div>
        )}
      </div>
    );
  };

  // Redirect and load map for drivers and staff
  if (lowerRole && ['driver', 'member', 'registered_driver', 'customer', 'staff'].includes(lowerRole)) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center text-slate-400 font-medium">
        <div className="h-9 w-9 rounded-full border-4 border-slate-200 border-t-indigo-600 animate-spin mb-3"></div>
        <span className="font-semibold">{t('dashboard.loadingMap')}</span>
      </div>
    );
  }

  // Render correct dashboard based on role context
  switch (lowerRole) {
    case 'manager':
      return renderManagerDashboard();
    case 'admin':
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center text-slate-500 font-medium bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
            <ShieldAlert size={32} className="text-indigo-600" />
          </div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 mb-2">{t('dashboard.adminNoAccess')}</h2>
          <p className="text-sm text-slate-500">{t('dashboard.adminNoAccessDesc')}</p>
        </div>
      );
    default:
      return (
        <div className="min-h-[400px] flex items-center justify-center text-rose-500 font-bold bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <ShieldAlert size={20} className="mr-2 animate-bounce" /> Error loading dashboard: User role undefined ({role})
        </div>
      );
  }
};

export const LiveStatusPage = () => <Dashboard section="live-status" />;
export const IncidentsPage = () => <Dashboard section="incidents" />;
export const AnalyticsPage = () => <Dashboard section="analytics" />;
export const SlotManagementPage = () => <Dashboard section="slot-management" />;
export const PricingPage = () => <Dashboard section="pricing" />;
export const StaffLogsPage = () => <Dashboard section="staff-logs" />;

export default Dashboard;
