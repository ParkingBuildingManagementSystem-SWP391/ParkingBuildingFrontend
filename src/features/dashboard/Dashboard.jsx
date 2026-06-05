import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { parkingService } from '../../services/mockData';
import { 
  ShieldAlert, 
  Car, 
  DollarSign, 
  Percent, 
  Calendar, 
  TrendingUp, 
  LayoutDashboard 
} from 'lucide-react';
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
    const lowerRole = role?.toLowerCase();
    if (lowerRole && ['driver', 'member', 'registered_driver', 'customer', 'staff'].includes(lowerRole)) {
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
                  <span className="text-3xl font-extrabold text-slate-800 block">289</span>
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
                    <span className="text-3xl font-extrabold text-slate-800">11.7M VND</span>
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0">
                      <TrendingUp size={10} />
                      +12.5%
                    </span>
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
                  <span className="text-3xl font-extrabold text-slate-800 block">72.3%</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-[#8B5CF6] shrink-0">
                  <Percent size={24} />
                </div>
              </div>

              {/* Card 4: Available Slots */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between min-h-[110px] hover:shadow-md transition-shadow duration-250">
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Available Slots</span>
                  <span className="text-3xl font-extrabold text-slate-800 block">111</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-[#F97316] shrink-0">
                  <Calendar size={24} />
                </div>
              </div>

            </div>

            {/* C. Data Visualization Section (Two-Column Layout) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Left Column: Revenue by Vehicle Type */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Revenue by Vehicle Type</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Distribution of current daily revenue</p>
                </div>
                
                <div className="flex flex-col items-center justify-center py-6">
                  {/* Custom SVG Donut Chart */}
                  <svg viewBox="0 0 320 210" className="w-full max-w-[290px] h-auto">
                    {/* Background track (optional for styling) */}
                    <circle cx="160" cy="105" r="50" fill="transparent" stroke="#F1F5F9" strokeWidth="16" />
                    
                    {/* Car Slice (61.54%) */}
                    <circle 
                      cx="160" 
                      cy="105" 
                      r="50" 
                      fill="transparent" 
                      stroke="#10B981" 
                      strokeWidth="16" 
                      strokeDasharray="193.33 314.16" 
                      strokeDashoffset="0" 
                      transform="rotate(-90 160 105)" 
                    />
                    
                    {/* Motorbike Slice (38.46%) */}
                    <circle 
                      cx="160" 
                      cy="105" 
                      r="50" 
                      fill="transparent" 
                      stroke="#2563EB" 
                      strokeWidth="16" 
                      strokeDasharray="120.83 314.16" 
                      strokeDashoffset="-193.33" 
                      transform="rotate(-90 160 105)" 
                    />
                    
                    {/* Center Text labels */}
                    <text x="160" y="100" textAnchor="middle" className="text-slate-400 text-[10px] font-bold uppercase tracking-wider fill-slate-400">Total</text>
                    <text x="160" y="120" textAnchor="middle" className="text-slate-800 text-lg font-extrabold font-sans fill-slate-800">11.7M</text>
                    
                    {/* Left Pointer (Motorbike) */}
                    <path d="M 120 120 L 80 140 L 35 140" stroke="#CBD5E1" strokeWidth="1.5" fill="none" />
                    <circle cx="120" cy="120" r="3" fill="#2563EB" />
                    <text x="35" y="132" className="text-[10px] font-bold fill-[#2563EB]">Motorbike</text>
                    <text x="35" y="150" className="text-[9px] font-semibold fill-slate-500">4.5M VND (38.5%)</text>
                    
                    {/* Right Pointer (Car) */}
                    <path d="M 200 90 L 240 70 L 285 70" stroke="#CBD5E1" strokeWidth="1.5" fill="none" />
                    <circle cx="200" cy="90" r="3" fill="#10B981" />
                    <text x="245" y="62" className="text-[10px] font-bold fill-[#10B981]">Car</text>
                    <text x="245" y="80" className="text-[9px] font-semibold fill-slate-500">7.2M VND (61.5%)</text>
                  </svg>

                  {/* Legend below chart */}
                  <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-slate-100/60 w-full">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-[#2563EB] block"></span>
                      <span className="text-xs text-slate-600 font-medium">Motorbike</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-[#10B981] block"></span>
                      <span className="text-xs text-slate-600 font-medium">Car</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Weekly Traffic Flow */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Weekly Traffic Flow</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Total vehicle transits logged per day</p>
                </div>
                
                <div className="flex flex-col items-center justify-center py-6">
                  {/* Custom SVG Bar Chart */}
                  <svg viewBox="0 0 420 210" className="w-full max-w-[390px] h-auto">
                    {/* Grid Lines & Labels */}
                    <line x1="50" y1="30" x2="390" y2="30" stroke="#F1F5F9" strokeWidth="1" />
                    <text x="40" y="34" className="text-[9px] text-slate-400 font-semibold fill-slate-400" textAnchor="end">600</text>
                    
                    <line x1="50" y1="67.5" x2="390" y2="67.5" stroke="#F1F5F9" strokeWidth="1" />
                    <text x="40" y="71.5" className="text-[9px] text-slate-400 font-semibold fill-slate-400" textAnchor="end">450</text>
                    
                    <line x1="50" y1="105" x2="390" y2="105" stroke="#F1F5F9" strokeWidth="1" />
                    <text x="40" y="109" className="text-[9px] text-slate-400 font-semibold fill-slate-400" textAnchor="end">300</text>
                    
                    <line x1="50" y1="142.5" x2="390" y2="142.5" stroke="#F1F5F9" strokeWidth="1" />
                    <text x="40" y="146.5" className="text-[9px] text-slate-400 font-semibold fill-slate-400" textAnchor="end">150</text>
                    
                    <line x1="50" y1="180" x2="390" y2="180" stroke="#E2E8F0" strokeWidth="1.5" />
                    <text x="40" y="184" className="text-[9px] text-slate-400 font-semibold fill-slate-400" textAnchor="end">0</text>

                    {/* Bars: Mon-Sun */}
                    {/* Mon: 420 -> H=105, Y=75 */}
                    <rect className="fill-[#2563EB] hover:fill-[#1D4ED8] transition-colors cursor-pointer" x="65" y="75" width="24" height="105" rx="3">
                      <title>Mon: 420 Vehicles</title>
                    </rect>
                    <text x="77" y="196" className="text-[9px] font-bold fill-slate-500" textAnchor="middle">Mon</text>

                    {/* Tue: 480 -> H=120, Y=60 */}
                    <rect className="fill-[#2563EB] hover:fill-[#1D4ED8] transition-colors cursor-pointer" x="113.5" y="60" width="24" height="120" rx="3">
                      <title>Tue: 480 Vehicles</title>
                    </rect>
                    <text x="125.5" y="196" className="text-[9px] font-bold fill-slate-500" textAnchor="middle">Tue</text>

                    {/* Wed: 510 -> H=127.5, Y=52.5 */}
                    <rect className="fill-[#2563EB] hover:fill-[#1D4ED8] transition-colors cursor-pointer" x="162" y="52.5" width="24" height="127.5" rx="3">
                      <title>Wed: 510 Vehicles</title>
                    </rect>
                    <text x="174" y="196" className="text-[9px] font-bold fill-slate-500" textAnchor="middle">Wed</text>

                    {/* Thu: 460 -> H=115, Y=65 */}
                    <rect className="fill-[#2563EB] hover:fill-[#1D4ED8] transition-colors cursor-pointer" x="210.5" y="65" width="24" height="115" rx="3">
                      <title>Thu: 460 Vehicles</title>
                    </rect>
                    <text x="222.5" y="196" className="text-[9px] font-bold fill-slate-500" textAnchor="middle">Thu</text>

                    {/* Fri: 550 -> H=137.5, Y=42.5 */}
                    <rect className="fill-[#2563EB] hover:fill-[#1D4ED8] transition-colors cursor-pointer" x="259" y="42.5" width="24" height="137.5" rx="3">
                      <title>Fri: 550 Vehicles</title>
                    </rect>
                    <text x="271" y="196" className="text-[9px] font-bold fill-slate-500" textAnchor="middle">Fri</text>

                    {/* Sat: 380 -> H=95, Y=85 */}
                    <rect className="fill-[#2563EB] hover:fill-[#1D4ED8] transition-colors cursor-pointer" x="307.5" y="85" width="24" height="95" rx="3">
                      <title>Sat: 380 Vehicles</title>
                    </rect>
                    <text x="319.5" y="196" className="text-[9px] font-bold fill-slate-500" textAnchor="middle">Sat</text>

                    {/* Sun: 320 -> H=80, Y=100 */}
                    <rect className="fill-[#2563EB] hover:fill-[#1D4ED8] transition-colors cursor-pointer" x="356" y="100" width="24" height="80" rx="3">
                      <title>Sun: 320 Vehicles</title>
                    </rect>
                    <text x="368" y="196" className="text-[9px] font-bold fill-slate-500" textAnchor="middle">Sun</text>
                  </svg>

                  {/* Legend below chart */}
                  <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-slate-100/60 w-full">
                    <span className="w-3.5 h-3.5 bg-[#2563EB] rounded-sm block"></span>
                    <span className="text-xs text-slate-600 font-medium">Vehicles</span>
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
                    
                    {/* Floor 1 */}
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-4 text-sm font-semibold text-slate-700">Floor 1</td>
                      <td className="py-4 px-4 text-sm font-medium text-slate-600 text-center">150</td>
                      <td className="py-4 px-4 text-sm font-bold text-rose-600 text-center">128</td>
                      <td className="py-4 px-4 text-sm font-bold text-emerald-600 text-center">22</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden max-w-[140px] md:max-w-[200px] shrink-0">
                            <div className="bg-[#2563EB] h-full rounded-full transition-all duration-500" style={{ width: '85.3%' }}></div>
                          </div>
                          <span className="text-sm font-bold text-slate-700">85.3%</span>
                        </div>
                      </td>
                    </tr>

                    {/* Floor 2 */}
                    <tr className="hover:bg-slate-50/50 transition-colors bg-slate-50/20">
                      <td className="py-4 px-4 text-sm font-semibold text-slate-700">Floor 2</td>
                      <td className="py-4 px-4 text-sm font-medium text-slate-600 text-center">150</td>
                      <td className="py-4 px-4 text-sm font-bold text-rose-600 text-center">94</td>
                      <td className="py-4 px-4 text-sm font-bold text-emerald-600 text-center">56</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden max-w-[140px] md:max-w-[200px] shrink-0">
                            <div className="bg-[#2563EB] h-full rounded-full transition-all duration-500" style={{ width: '62.7%' }}></div>
                          </div>
                          <span className="text-sm font-bold text-slate-700">62.7%</span>
                        </div>
                      </td>
                    </tr>

                    {/* Basement */}
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-4 text-sm font-semibold text-slate-700">Basement</td>
                      <td className="py-4 px-4 text-sm font-medium text-slate-600 text-center">100</td>
                      <td className="py-4 px-4 text-sm font-bold text-rose-600 text-center">67</td>
                      <td className="py-4 px-4 text-sm font-bold text-emerald-600 text-center">33</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden max-w-[140px] md:max-w-[200px] shrink-0">
                            <div className="bg-[#2563EB] h-full rounded-full transition-all duration-500" style={{ width: '67.0%' }}></div>
                          </div>
                          <span className="text-sm font-bold text-slate-700">67.0%</span>
                        </div>
                      </td>
                    </tr>

                  </tbody>
                </table>
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
        <div className="h-8 w-8 rounded-full border-4 border-slate-200 border-t-[#2563EB] animate-spin mb-3"></div>
        <span>Loading map workspace...</span>
      </div>
    );
  }

  // Render correct dashboard based on role context
  switch (role?.toLowerCase()) {
    case 'admin':
    case 'manager':
      return renderManagerDashboard();
    default:
      return (
        <div className="min-h-screen flex items-center justify-center text-rose-500 font-bold bg-white rounded-xl border border-slate-200 p-6">
          <ShieldAlert size={20} className="mr-2 animate-bounce" /> Error loading dashboard: User role undefined (Role: {role})
        </div>
      );
  }
};

export default Dashboard;
