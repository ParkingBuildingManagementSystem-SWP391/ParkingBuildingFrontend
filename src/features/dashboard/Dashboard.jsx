import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { parkingService } from '../../services/mockData';
import { ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();

  const [slots, setSlots] = useState([]);
  const [logs, setLogs] = useState([]);
  const [occupancyRate, setOccupancyRate] = useState(0);

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
    if (role === 'driver' || role === 'staff') {
      navigate('/parking-map');
    }
  }, [role, navigate]);

  // Format currencies in VND
  const formatVND = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  // ----------------------------------------------------
  // MANAGER & ADMIN DASHBOARD
  // ----------------------------------------------------
  const renderManagerDashboard = () => {
    const [subTab, setSubTab] = useState('Overview');

    const getFormattedDate = () => {
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      return new Date('2026-05-29T23:13:14+07:00').toLocaleDateString('en-US', options);
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

    return (
      <div className="space-y-6 select-none font-sans pb-12">
        {/* A. Sub-Header & Sub-Navigation */}
        <div className="space-y-4 font-sans">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Manager Dashboard</h1>
            <p className="text-sm text-slate-500 mt-1">{getFormattedDate()}</p>
          </div>

          {/* Sub-Navigation Pills */}
          <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-100">
            {subNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setSubTab(item.id)}
                className={`px-4 py-2 font-medium text-sm rounded-xl transition-all duration-200 ${
                  subTab === item.id
                    ? 'bg-[#1A62FF] text-white shadow-sm shadow-blue-500/10'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
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
              
              {/* Card 1: Occupied Slots */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between min-h-[120px]">
                <div>
                  <span className="text-xs text-slate-400 font-semibold block">Occupied Slots</span>
                  <span className="text-3xl font-bold text-[#FF1744] block mt-2">141</span>
                </div>
                <span className="text-xs text-slate-400 mt-2 block">40 active sessions</span>
              </div>

              {/* Card 2: Reserved Slots */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between min-h-[120px]">
                <div>
                  <span className="text-xs text-slate-400 font-semibold block">Reserved Slots</span>
                  <span className="text-3xl font-bold text-[#FFC107] block mt-2">25</span>
                </div>
                <span className="text-xs text-slate-400 mt-2 block">Pre-booked by users</span>
              </div>

              {/* Card 3: Available Slots */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between min-h-[120px]">
                <div>
                  <span className="text-xs text-slate-400 font-semibold block">Available Slots</span>
                  <span className="text-3xl font-bold text-[#00C853] block mt-2">124</span>
                </div>
                <span className="text-xs text-slate-400 mt-2 block">Ready for parking</span>
              </div>

              {/* Card 4: Occupancy Rate */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between min-h-[120px] relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '15px 15px' }}></div>
                <div className="relative">
                  <span className="text-xs text-slate-400 font-semibold block">Occupancy Rate</span>
                  <span className="text-3xl font-bold text-slate-900 block mt-2">48.6%</span>
                </div>
                <span className="text-xs text-slate-400 mt-2 block relative">141 / 290 occupied</span>
              </div>

            </div>

            {/* C. Bottom Analytics Layout (2-Column Grid) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Left Column: Revenue Summary Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-4">Revenue Summary</h3>
                  <div className="mt-2">
                    <span className="text-xs text-slate-400 font-semibold block">Total Revenue</span>
                    <span className="text-emerald-600 text-3xl font-bold mt-1 block font-sans">2.810.617 đ</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mt-8 pt-6 border-t border-slate-50">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-400 font-medium">Completed Sessions</span>
                    <span className="text-slate-800 text-xl font-bold mt-1">110</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-400 font-medium">Penalty Fines</span>
                    <span className="text-orange-500 text-xl font-bold mt-1 font-sans">998.135 đ</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Incidents Overview Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-[#FFC107] opacity-60"></div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-1.5">
                    <span>⚠️ Incidents Overview</span>
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* Lost Tickets */}
                    <div className="bg-orange-50/50 rounded-xl p-4 border border-orange-100/30 flex flex-col justify-between">
                      <span className="text-xs text-slate-500 font-medium">Lost Tickets</span>
                      <span className="text-orange-600 text-3xl font-bold mt-2">7</span>
                    </div>

                    {/* Overtime */}
                    <div className="bg-rose-50/50 rounded-xl p-4 border border-rose-100/30 flex flex-col justify-between">
                      <span className="text-xs text-slate-555 text-slate-500 font-medium">Overtime</span>
                      <span className="text-rose-600 text-3xl font-bold mt-2">28</span>
                    </div>
                  </div>
                </div>

                {/* Footer Statistic Strip */}
                <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between mt-6 border border-slate-100">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Penalty Collected</span>
                  <span className="text-lg font-bold text-emerald-600 font-sans">998.135 đ</span>
                </div>
              </div>

            </div>

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
  if (role === 'driver' || role === 'staff') {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center text-slate-400 font-medium font-sans">
        <div className="h-8 w-8 rounded-full border-4 border-slate-200 border-t-[#1A62FF] animate-spin mb-3"></div>
        <span>Loading map workspace...</span>
      </div>
    );
  }

  // Render correct dashboard based on role context
  switch (role) {
    case 'admin':
    case 'manager':
      return renderManagerDashboard();
    default:
      return (
        <div className="min-h-screen flex items-center justify-center text-rose-500 font-bold bg-white rounded-xl border border-slate-200 p-6">
          <ShieldAlert size={20} className="mr-2 animate-bounce" /> Error loading dashboard: User role undefined
        </div>
      );
  }
};

export default Dashboard;
