import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { parkingService } from '../../services/mockData';
import { managerService } from '../../services/managerService';
import ParkingLotMap from '../parking-map/ParkingLotMap';
import LiveStatusTable from './LiveStatusTable';
import IncidentsTable from './IncidentsTable';
import { 
  ShieldAlert, 
  Car, 
  DollarSign, 
  Percent, 
  Calendar, 
  TrendingUp, 
  LayoutDashboard,
  Filter,
  Download,
  BarChart3,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';

const Dashboard = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();

  const [slots, setSlots] = useState([]);
  const [logs, setLogs] = useState([]);
  const [occupancyRate, setOccupancyRate] = useState(0);

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

  // Fetch dashboard summary
  const fetchSummary = async () => {
    setLoadingSummary(true);
    setErrorSummary('');
    try {
      const data = await managerService.getDashboardSummary();
      setSummary(data);
    } catch (err) {
      console.error("fetchSummary error:", err);
      setErrorSummary("Failed to load real-time dashboard data.");
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
      setErrorStats("Failed to load traffic statistics.");
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
      message.success(`Report exported successfully as ${format}`);
    } catch (err) {
      console.error("Export error:", err);
      message.error("Failed to export report.");
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    if (lowerRole === 'admin' || lowerRole === 'manager') {
      fetchSummary();
      const interval = setInterval(fetchSummary, 30000);
      return () => clearInterval(interval);
    }
  }, [lowerRole]);

  useEffect(() => {
    if (lowerRole === 'admin' || lowerRole === 'manager') {
      fetchTrafficStats();
    }
  }, [lowerRole, startDate, endDate, groupBy, vehicleTypeId]);

  // Fetch data on load and subscribe to simulated state changes
  const fetchData = () => {
    setSlots(parkingService.getSlots());
    setLogs(parkingService.getLogs());
    setOccupancyRate(parkingService.getOccupancyRate());
  };

  useEffect(() => {
    fetchData();

    // Listen to changes in simulated local database
    const handleStateChange = () => {
      fetchData();
    };

    window.addEventListener('parking_state_changed', handleStateChange);
    return () => {
      window.removeEventListener('parking_state_changed', handleStateChange);
    };
  }, []);


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

  // ----------------------------------------------------
  // MANAGER & ADMIN DASHBOARD
  // ----------------------------------------------------
  const renderManagerDashboard = () => {
    const [subTab, setSubTab] = useState('Overview');

    if (loadingSummary && !summary) {
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center text-slate-500 font-medium font-sans">
          <Loader2 className="h-8 w-8 text-[#2563EB] animate-spin mb-3" />
          <span>Fetching real-time building statistics...</span>
        </div>
      );
    }

    if (errorSummary && !summary) {
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center text-rose-500 font-bold bg-white rounded-2xl border border-slate-100 p-6">
          <ShieldAlert size={36} className="mb-2 animate-bounce" />
          <span>{errorSummary}</span>
          <button onClick={fetchSummary} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-blue-700 transition-all">
            Retry Connection
          </button>
        </div>
      );
    }

    const getFormattedDate = () => {
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      return new Date().toLocaleDateString('vi-VN', options);
    };

    const subNavItems = [
      { id: 'Overview', label: 'Overview' },
      { id: 'Live Status', label: 'Live Status' },
      { id: 'Incidents', label: 'Incidents' },
      { id: 'Analytics', label: 'Analytics' },
      { id: 'Slot Management', label: 'Slot Management' },
      { id: 'Pricing', label: 'Pricing' },
      { id: 'Staff Logs', label: 'Staff Logs' }
    ];

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
                <stop offset="0%" stopColor="#2563EB" stopOpacity="0.15"/>
                <stop offset="100%" stopColor="#2563EB" stopOpacity="0"/>
              </linearGradient>
              <linearGradient id="checkOutGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F97316" stopOpacity="0.15"/>
                <stop offset="100%" stopColor="#F97316" stopOpacity="0"/>
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
            {checkInPath && <path d={checkInPath} fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
            {checkOutPath && <path d={checkOutPath} fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}

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
          <div className="flex items-center justify-center gap-6 pt-2 border-t border-slate-100/60 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-[#2563EB] inline-block border-t-2 border-[#2563EB]"></span>
              <span className="text-slate-600">Check-In</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-[#F97316] inline-block border-t-2 border-[#F97316]"></span>
              <span className="text-slate-600">Check-Out</span>
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
                  className="fill-[#10B981] hover:fill-[#059669] transition-colors cursor-pointer"
                  rx="1.5"
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
          <div className="flex items-center justify-center gap-2 pt-2 border-t border-slate-100/60 text-xs font-semibold">
            <span className="w-3.5 h-3.5 bg-[#10B981] rounded-sm block"></span>
            <span className="text-slate-600">Revenue (VND)</span>
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-6 select-none font-sans pb-12">
        {/* A. Sub-Header & Sub-Navigation */}
        <div className="space-y-4 font-sans">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Manager Dashboard</h1>
              <p className="text-sm text-slate-500 mt-0.5">{getFormattedDate()}</p>
            </div>
          </div>

          {/* Sub-Navigation Pills */}
          <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-100">
            {subNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setSubTab(item.id)}
                className={`px-4 py-2 font-semibold text-sm rounded-xl transition-all duration-200 ${
                  subTab === item.id
                    ? 'bg-[#2563EB] text-white shadow-md shadow-blue-500/10'
                    : 'bg-white text-slate-600 border border-slate-200/80 hover:text-slate-950 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {subTab === 'Overview' ? (
          <div className="space-y-6">
            
            {/* B. Core Metric Cards Row (4 Columns Layout) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Card 1: Total Vehicles Current */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between min-h-[110px] hover:shadow-md transition-shadow duration-250">
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Total Vehicles Current</span>
                  <span className="text-3xl font-extrabold text-slate-800 block">{summary?.occupiedSlotsCount || 0}</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-[#2563EB] shrink-0">
                  <Car size={24} />
                </div>
              </div>

              {/* Card 2: Daily Revenue */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between min-h-[110px] hover:shadow-md transition-shadow duration-250">
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Daily Revenue</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-extrabold text-slate-800">{formatVND(summary?.todayRevenue || 0)}</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-[#10B981] shrink-0">
                  <DollarSign size={24} />
                </div>
              </div>

              {/* Card 3: Overall Occupancy Rate */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between min-h-[110px] hover:shadow-md transition-shadow duration-250">
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Overall Occupancy Rate</span>
                  <span className="text-3xl font-extrabold text-slate-800 block">{((summary?.occupancyRate) || 0).toFixed(1)}%</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-[#8B5CF6] shrink-0">
                  <Percent size={24} />
                </div>
              </div>

              {/* Card 4: Available Slots */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between min-h-[110px] hover:shadow-md transition-shadow duration-250">
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Available Slots</span>
                  <span className="text-3xl font-extrabold text-slate-800 block">{summary?.availableSlotsCount || 0}</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-[#F97316] shrink-0">
                  <Calendar size={24} />
                </div>
              </div>

            </div>

            {/* C. Data Visualization Section (Two-Column Layout) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Left Column: Vehicles Distribution */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Vehicles in Building</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Distribution of vehicles currently parked</p>
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
                          stroke="#10B981" 
                          strokeWidth="16" 
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
                          stroke="#2563EB" 
                          strokeWidth="16" 
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
                          stroke="#8B5CF6" 
                          strokeWidth="16" 
                          strokeDasharray={bicycleStroke} 
                          strokeDashoffset={bicycleOffset} 
                          transform="rotate(-90 160 105)" 
                        />
                      )}
                      
                      {/* Center Text labels */}
                      <text x="160" y="100" textAnchor="middle" className="text-slate-400 text-[10px] font-bold uppercase tracking-wider fill-slate-400">Total</text>
                      <text x="160" y="120" textAnchor="middle" className="text-slate-800 text-lg font-extrabold font-sans fill-slate-800">{totalInBuilding}</text>
                    </svg>
                  ) : (
                    <div className="text-center py-12 text-slate-400 font-semibold text-xs">
                      No vehicles currently parked in building.
                    </div>
                  )}

                  {/* Legend below chart */}
                  <div className="flex items-center justify-center flex-wrap gap-4 mt-4 pt-4 border-t border-slate-100/60 w-full">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-[#10B981] block"></span>
                      <span className="text-xs text-slate-600 font-medium">Car: {carDetail.inBuildingCount} ({carPercent}%)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-[#2563EB] block"></span>
                      <span className="text-xs text-slate-600 font-medium">Motorcycle: {bikeDetail.inBuildingCount} ({bikePercent}%)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-[#8B5CF6] block"></span>
                      <span className="text-xs text-slate-600 font-medium">Bicycle: {bicycleDetail.inBuildingCount} ({bicyclePercent}%)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Building Details & Current Shift */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Building Operations Summary</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Sales summary and building volume metrics</p>
                </div>
                
                <div className="divide-y divide-slate-100 space-y-4 py-4">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-slate-500 font-semibold">Total Revenue (All-time):</span>
                    <span className="text-sm font-extrabold text-slate-800">{formatVND(summary?.totalRevenue || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-slate-500 font-semibold">Reserved Slots Volume:</span>
                    <span className="text-sm font-extrabold text-amber-600">{summary?.reservedSlotsCount || 0} Slots</span>
                  </div>
                </div>
              </div>

            </div>

            {/* D. Floor Occupancy Status Table (Full Width) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Floor Occupancy Status</h3>
                <p className="text-xs text-slate-400 mt-0.5">Real-time status per building level</p>
              </div>

              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">FLOOR</th>
                      <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">TOTAL SLOTS</th>
                      <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">OCCUPIED</th>
                      <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">AVAILABLE</th>
                      <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">OCCUPANCY RATE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/60">
                    {summary?.floorOccupancyDetail?.map((floor, idx) => {
                      const capacity = floor.capacity || 100;
                      const occupied = floor.occupiedCount || 0;
                      const available = capacity - occupied;
                      const rate = capacity > 0 ? Math.round((occupied / capacity) * 100) : 0;
                      
                      return (
                        <tr key={floor.floorId || idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-4 text-sm font-semibold text-slate-700">{floor.floorName}</td>
                          <td className="py-4 px-4 text-sm font-medium text-slate-600 text-center">{capacity}</td>
                          <td className="py-4 px-4 text-sm font-bold text-rose-600 text-center">{occupied}</td>
                          <td className="py-4 px-4 text-sm font-bold text-emerald-600 text-center">{available}</td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden max-w-[140px] md:max-w-[200px] shrink-0">
                                <div className="bg-[#2563EB] h-full rounded-full transition-all duration-500" style={{ width: `${rate}%` }}></div>
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
        ) : subTab === 'Live Status' ? (
          <LiveStatusTable />
        ) : subTab === 'Incidents' ? (
          <IncidentsTable />
        ) : subTab === 'Analytics' ? (
          <div className="space-y-6">
            {/* Filter Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Filter size={18} className="text-[#2563EB]" />
                <h3 className="text-base font-bold text-slate-800">Traffic & Revenue Query Filters</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full h-11 px-3 bg-slate-50 border border-slate-200 text-sm rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-semibold text-slate-700"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full h-11 px-3 bg-slate-50 border border-slate-200 text-sm rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-semibold text-slate-700"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Group By</label>
                  <select
                    value={groupBy}
                    onChange={(e) => setGroupBy(e.target.value)}
                    className="w-full h-11 px-3 bg-slate-50 border border-slate-200 text-sm rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-semibold text-slate-700"
                  >
                    <option value="DAY">By Day</option>
                    <option value="HOUR">By Hour</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vehicle Type</label>
                  <select
                    value={vehicleTypeId}
                    onChange={(e) => setVehicleTypeId(e.target.value)}
                    className="w-full h-11 px-3 bg-slate-50 border border-slate-200 text-sm rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-semibold text-slate-700"
                  >
                    <option value="">All Vehicles</option>
                    <option value="3">Car</option>
                    <option value="2">Motorbike</option>
                    <option value="1">Bicycle</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Report Export Panel */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Download size={18} className="text-[#10B981]" />
                <h3 className="text-base font-bold text-slate-800">Export Historical Reports</h3>
              </div>
              <p className="text-xs text-slate-400">Download formatted Excel spreadsheet or PDF report for the selected date range and filters.</p>
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  disabled={exporting}
                  onClick={() => handleExport('EXCEL')}
                  className="h-11 px-6 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-emerald-700 active:scale-98 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                  Export Excel Spreadsheet
                </button>
                <button
                  disabled={exporting}
                  onClick={() => handleExport('PDF')}
                  className="h-11 px-6 bg-rose-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-rose-700 active:scale-98 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                  Export PDF Document
                </button>
              </div>
            </div>

            {/* Charts Section */}
            {loadingStats ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-slate-400">
                <Loader2 size={32} className="animate-spin text-blue-600 mb-2" />
                <span className="text-xs font-semibold">Loading traffic flow and revenue charts...</span>
              </div>
            ) : errorStats ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-100 shadow-sm text-center text-rose-500 font-bold">
                <ShieldAlert size={32} className="mx-auto mb-2 animate-bounce" />
                <span>{errorStats}</span>
              </div>
            ) : trafficStats.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-100 shadow-sm text-center text-slate-400 font-semibold">
                <BarChart3 size={32} className="mx-auto mb-2" />
                <span>No transit data found for the selected filter configuration.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Traffic flow SVG chart */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Traffic Activity Over Time</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Check-in vs Check-out volumes</p>
                  </div>
                  <div className="py-6">
                    {renderTrafficChart()}
                  </div>
                </div>

                {/* Revenue SVG chart */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Revenue Generation</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Financial gains mapped over selected intervals</p>
                  </div>
                  <div className="py-6">
                    {renderRevenueChart()}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white border border-slate-100 rounded-2xl py-24 text-center shadow-sm">
            <h3 className="text-slate-700 font-bold text-lg">{subTab} Workspace</h3>
            <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto">
              This module is active in manager view. Real-time updates and logs are simulated.
            </p>
          </div>
        )}
      </div>
    );
  };

  // Redirect and load map for drivers and staff
  if (lowerRole && ['driver', 'member', 'registered_driver', 'customer', 'staff'].includes(lowerRole)) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center text-slate-400 font-medium font-sans">
        <div className="h-8 w-8 rounded-full border-4 border-slate-200 border-t-[#2563EB] animate-spin mb-3"></div>
        <span>Loading map workspace...</span>
      </div>
    );
  }

  // Render correct dashboard based on role context
  switch (lowerRole) {
    case 'admin':
    case 'manager':
      return renderManagerDashboard();
    default:
      return (
        <div className="min-h-[400px] flex items-center justify-center text-rose-500 font-bold bg-white rounded-xl border border-slate-200 p-6">
          <ShieldAlert size={20} className="mr-2 animate-bounce" /> Error loading dashboard: User role undefined ({role})
        </div>
      );
  }
};

export default Dashboard;