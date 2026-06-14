import React, { useState, useMemo } from 'react';
import { Table, Tag, Button, Input, Select, message, Popconfirm, Tooltip, Space } from 'antd';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  CheckCircle2, 
  Search,
  Activity,
  Camera,
  MapPin,
  Clock
} from 'lucide-react';

const { Option } = Select;

// Generate some mock incidents
const MOCK_INCIDENTS = [
  {
    id: 'INC-20231015-01',
    severity: 'Critical',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
    type: 'License Plate Mismatch',
    description: 'Vehicle exiting at Gate 1 does not match the check-in license plate records.',
    location: 'Exit Gate 1',
    status: 'Open'
  },
  {
    id: 'INC-20231015-02',
    severity: 'Warning',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 48 hours ago
    type: 'Overstay Limit Reached',
    description: 'Vehicle 29A-12345 has been parked for over 48 hours continuously.',
    location: 'Floor B1 - Slot A2-14',
    status: 'Open'
  },
  {
    id: 'INC-20231015-03',
    severity: 'Critical',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
    type: 'Barrier Force-Opened',
    description: 'Entry Gate 2 barrier was forced open manually without authorization.',
    location: 'Entry Gate 2',
    status: 'Open'
  },
  {
    id: 'INC-20231014-04',
    severity: 'Info',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    type: 'Sensor Anomaly',
    description: 'Slot sensor reporting intermittent connection.',
    location: 'Floor G - Slot C1-05',
    status: 'Resolved'
  },
  {
    id: 'INC-20231014-05',
    severity: 'Warning',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    type: 'Payment Failed Repeatedly',
    description: 'Customer attempted VNPay transaction 3 times unsuccessfully.',
    location: 'Exit Gate 2',
    status: 'Open'
  }
];

const IncidentsTable = () => {
  const [incidents, setIncidents] = useState(MOCK_INCIDENTS);
  const [searchText, setSearchText] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('All');
  const [resolvingId, setResolvingId] = useState(null);

  // Filter Logic
  const filteredIncidents = useMemo(() => {
    return incidents.filter(inc => {
      const matchSearch = inc.id.toLowerCase().includes(searchText.toLowerCase()) || 
                          inc.type.toLowerCase().includes(searchText.toLowerCase()) ||
                          inc.location.toLowerCase().includes(searchText.toLowerCase());
      const matchSeverity = filterSeverity === 'All' || 
                            (filterSeverity === 'Resolved' ? inc.status === 'Resolved' : 
                            (inc.severity === filterSeverity && inc.status === 'Open'));
      
      return matchSearch && matchSeverity;
    }).sort((a, b) => {
      // Sort: Open first, then by timestamp descending
      if (a.status === 'Open' && b.status === 'Resolved') return -1;
      if (a.status === 'Resolved' && b.status === 'Open') return 1;
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
  }, [incidents, searchText, filterSeverity]);

  // Handle Resolve Action
  const handleResolve = (id) => {
    setResolvingId(id);
    setTimeout(() => {
      setIncidents(prev => prev.map(inc => 
        inc.id === id ? { ...inc, status: 'Resolved' } : inc
      ));
      setResolvingId(null);
      message.success(`Incident ${id} marked as resolved.`);
    }, 800);
  };

  // Tag rendering helpers
  const getSeverityTag = (severity) => {
    switch (severity) {
      case 'Critical': return <Tag icon={<AlertCircle size={14} className="mr-1" />} color="error" className="m-0 font-bold px-2 py-0.5 border-0">CRITICAL</Tag>;
      case 'Warning': return <Tag icon={<AlertTriangle size={14} className="mr-1" />} color="warning" className="m-0 font-bold px-2 py-0.5 border-0">WARNING</Tag>;
      case 'Info': return <Tag icon={<Info size={14} className="mr-1" />} color="processing" className="m-0 font-bold px-2 py-0.5 border-0">INFO</Tag>;
      default: return <Tag color="default">{severity}</Tag>;
    }
  };

  const getStatusTag = (status) => {
    if (status === 'Resolved') return <Tag icon={<CheckCircle2 size={14} className="mr-1" />} color="success" className="m-0 font-bold border-0">RESOLVED</Tag>;
    return <Tag color="default" className="m-0 font-bold border border-slate-200 text-slate-500 bg-slate-50">OPEN</Tag>;
  };

  const columns = [
    {
      title: 'Incident ID',
      dataIndex: 'id',
      key: 'id',
      render: (text) => <span className="font-mono font-extrabold text-rose-700">{text}</span>,
    },
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      render: (severity) => getSeverityTag(severity),
    },
    {
      title: 'Details',
      key: 'details',
      render: (_, record) => (
        <div className="flex flex-col gap-1 max-w-md">
          <span className="font-bold text-slate-800 text-sm">{record.type}</span>
          <span className="text-xs text-slate-500 leading-relaxed">{record.description}</span>
        </div>
      )
    },
    {
      title: 'Location & Time',
      key: 'locationTime',
      render: (_, record) => (
        <div className="flex flex-col gap-1.5 text-xs text-slate-600">
          <div className="flex items-center gap-1.5 font-semibold text-indigo-700">
            <MapPin size={14} /> {record.location}
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={14} /> {new Date(record.timestamp).toLocaleString('vi-VN')}
          </div>
        </div>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => {
        if (record.status === 'Resolved') {
          return <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1"><CheckCircle2 size={14} /> Handled</span>;
        }

        return (
          <Space>
            <Tooltip title="View Camera Evidence">
              <Button icon={<Camera size={14} />} size="small" className="text-slate-500 border-slate-200" onClick={() => message.info("Mock feature: Camera evidence viewer would open here.")} />
            </Tooltip>
            <Popconfirm
              title="Mark as Resolved?"
              description="Confirm that this incident has been handled."
              onConfirm={() => handleResolve(record.id)}
              okText="Confirm"
              cancelText="Cancel"
            >
              <Button 
                type="primary" 
                size="small"
                loading={resolvingId === record.id}
                className="bg-emerald-600 hover:bg-emerald-700 border-0 font-bold shadow-sm"
              >
                Resolve
              </Button>
            </Popconfirm>
          </Space>
        );
      }
    }
  ];

  // Calculate stats for badges
  const criticalCount = incidents.filter(i => i.severity === 'Critical' && i.status === 'Open').length;
  const warningCount = incidents.filter(i => i.severity === 'Warning' && i.status === 'Open').length;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 font-sans">
      
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-xl font-bold text-rose-900 flex items-center gap-2">
            <Activity className="text-rose-600" />
            Security & Alerts Log
          </h3>
          <p className="text-xs text-slate-500 mt-1">Real-time monitoring of building anomalies and system flags</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          
          <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200">
            <button 
              onClick={() => setFilterSeverity('All')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${filterSeverity === 'All' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Active Alerts
            </button>
            <button 
              onClick={() => setFilterSeverity('Critical')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${filterSeverity === 'Critical' ? 'bg-rose-100 shadow-sm text-rose-800' : 'text-slate-500 hover:text-rose-600'}`}
            >
              Critical
              {criticalCount > 0 && <span className="bg-rose-500 text-white px-1.5 rounded-full text-[10px]">{criticalCount}</span>}
            </button>
            <button 
              onClick={() => setFilterSeverity('Warning')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${filterSeverity === 'Warning' ? 'bg-amber-100 shadow-sm text-amber-800' : 'text-slate-500 hover:text-amber-600'}`}
            >
              Warning
              {warningCount > 0 && <span className="bg-amber-500 text-white px-1.5 rounded-full text-[10px]">{warningCount}</span>}
            </button>
            <button 
              onClick={() => setFilterSeverity('Resolved')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${filterSeverity === 'Resolved' ? 'bg-emerald-100 shadow-sm text-emerald-800' : 'text-slate-500 hover:text-emerald-600'}`}
            >
              Resolved
            </button>
          </div>

          <Input
            placeholder="Search incident..."
            prefix={<Search size={16} className="text-slate-400" />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            className="w-48 h-9 rounded-lg"
          />

        </div>
      </div>

      {/* Data Table */}
      <Table 
        columns={columns} 
        dataSource={filteredIncidents} 
        rowKey="id"
        pagination={{ pageSize: 5 }}
        rowClassName={(record) => record.status === 'Resolved' ? 'bg-slate-50/50 opacity-70' : 'hover:bg-rose-50/30'}
        className="border border-slate-100 rounded-xl overflow-hidden shadow-sm"
      />
    </div>
  );
};

export default IncidentsTable;
