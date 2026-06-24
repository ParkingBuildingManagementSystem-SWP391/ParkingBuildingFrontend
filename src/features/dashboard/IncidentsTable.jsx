import React, { useEffect, useState, useMemo } from 'react';
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
import { managerService } from '../../services/managerService';

const { Option } = Select;

const IncidentsTable = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchText, setSearchText] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('All');
  const [resolvingId, setResolvingId] = useState(null);

  const normalizeIncident = (item, index) => ({
    id: item.id || item.incidentId || item.IncidentId || item.code || `incident-${index}`,
    severity: item.severity || item.Severity || 'Info',
    timestamp: item.timestamp || item.createdAt || item.CreatedAt || item.reportedAt || item.ReportedAt,
    type: item.type || item.Type || item.title || item.Title || 'Sự cố',
    description: item.description || item.Description || item.message || item.Message || '',
    location: item.location || item.Location || item.slotName || item.SlotName || '',
    status: item.status || item.Status || 'Open'
  });

  const fetchIncidents = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await managerService.getIncidents();
      const data = Array.isArray(response) ? response : (response?.data || response?.Data || []);
      setIncidents(data.map(normalizeIncident));
    } catch (err) {
      console.error('fetchIncidents error:', err);
      setError('Chưa thể tải dữ liệu sự cố từ backend.');
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

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
    managerService.resolveIncident(id).then(() => {
      setIncidents(prev => prev.map(inc => 
        inc.id === id ? { ...inc, status: 'Resolved' } : inc
      ));
      message.success(`Sự cố ${id} đã được đánh dấu là đã xử lý.`);
    }).catch((err) => {
      console.error('resolveIncident error:', err);
      message.error('Không thể cập nhật trạng thái sự cố.');
    }).finally(() => {
      setResolvingId(null);
    });
  };

  // Tag rendering helpers
  const getSeverityTag = (severity) => {
    switch (severity) {
      case 'Critical': return <Tag icon={<AlertCircle size={14} className="mr-1" />} color="error" className="m-0 font-bold px-2 py-0.5 border-0">NGHIÊM TRỌNG</Tag>;
      case 'Warning': return <Tag icon={<AlertTriangle size={14} className="mr-1" />} color="warning" className="m-0 font-bold px-2 py-0.5 border-0">CẢNH BÁO</Tag>;
      case 'Info': return <Tag icon={<Info size={14} className="mr-1" />} color="processing" className="m-0 font-bold px-2 py-0.5 border-0">THÔNG TIN</Tag>;
      default: return <Tag color="default">{severity}</Tag>;
    }
  };

  const getStatusTag = (status) => {
    if (status === 'Resolved') return <Tag icon={<CheckCircle2 size={14} className="mr-1" />} color="success" className="m-0 font-bold border-0">ĐÃ XỬ LÝ</Tag>;
    return <Tag color="default" className="m-0 font-bold border border-slate-200 text-slate-500 bg-slate-50">ĐANG MỞ</Tag>;
  };

  const columns = [
    {
      title: 'Mã sự cố',
      dataIndex: 'id',
      key: 'id',
      render: (text) => <span className="font-mono font-extrabold text-rose-700">{text}</span>,
    },
    {
      title: 'Mức độ',
      dataIndex: 'severity',
      key: 'severity',
      render: (severity) => getSeverityTag(severity),
    },
    {
      title: 'Chi tiết',
      key: 'details',
      render: (_, record) => (
        <div className="flex flex-col gap-1 max-w-md">
          <span className="font-bold text-slate-800 text-sm">{record.type}</span>
          <span className="text-xs text-slate-500 leading-relaxed">{record.description}</span>
        </div>
      )
    },
    {
      title: 'Vị trí & thời gian',
      key: 'locationTime',
      render: (_, record) => (
        <div className="flex flex-col gap-1.5 text-xs text-slate-600">
          <div className="flex items-center gap-1.5 font-semibold text-indigo-700">
            <MapPin size={14} /> {record.location}
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={14} /> {record.timestamp ? new Date(record.timestamp).toLocaleString('vi-VN') : 'N/A'}
          </div>
        </div>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => {
        if (record.status === 'Resolved') {
          return <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1"><CheckCircle2 size={14} /> Đã xử lý</span>;
        }

        return (
          <Space>
            <Tooltip title="Xem bằng chứng camera">
              <Button icon={<Camera size={14} />} size="small" className="text-slate-500 border-slate-200" onClick={() => message.info("Chưa có endpoint backend cho bằng chứng camera.")} />
            </Tooltip>
            <Popconfirm
              title="Đánh dấu đã xử lý?"
              description="Xác nhận sự cố này đã được xử lý."
              onConfirm={() => handleResolve(record.id)}
              okText="Xác nhận"
              cancelText="Hủy"
            >
              <Button 
                type="primary" 
                size="small"
                loading={resolvingId === record.id}
                className="bg-emerald-600 hover:bg-emerald-700 border-0 font-bold shadow-sm"
              >
                Xử lý
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
            Nhật ký an ninh & cảnh báo
          </h3>
          <p className="text-xs text-slate-500 mt-1">Theo dõi bất thường và cảnh báo hệ thống theo thời gian thực</p>
          {error && <p className="text-xs text-rose-500 mt-2 font-semibold">{error}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          
          <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200">
            <button 
              onClick={() => setFilterSeverity('All')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${filterSeverity === 'All' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Cảnh báo đang mở
            </button>
            <button 
              onClick={() => setFilterSeverity('Critical')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${filterSeverity === 'Critical' ? 'bg-rose-100 shadow-sm text-rose-800' : 'text-slate-500 hover:text-rose-600'}`}
            >
              Nghiêm trọng
              {criticalCount > 0 && <span className="bg-rose-500 text-white px-1.5 rounded-full text-[10px]">{criticalCount}</span>}
            </button>
            <button 
              onClick={() => setFilterSeverity('Warning')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${filterSeverity === 'Warning' ? 'bg-amber-100 shadow-sm text-amber-800' : 'text-slate-500 hover:text-amber-600'}`}
            >
              Cảnh báo
              {warningCount > 0 && <span className="bg-amber-500 text-white px-1.5 rounded-full text-[10px]">{warningCount}</span>}
            </button>
            <button 
              onClick={() => setFilterSeverity('Resolved')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${filterSeverity === 'Resolved' ? 'bg-emerald-100 shadow-sm text-emerald-800' : 'text-slate-500 hover:text-emerald-600'}`}
            >
              Đã xử lý
            </button>
          </div>

          <Input
            placeholder="Tìm sự cố..."
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
        loading={loading}
        rowKey="id"
        locale={{ emptyText: error ? 'Không có dữ liệu sự cố để hiển thị.' : 'Chưa có dữ liệu sự cố.' }}
        pagination={{ pageSize: 5 }}
        rowClassName={(record) => record.status === 'Resolved' ? 'bg-slate-50/50 opacity-70' : 'hover:bg-rose-50/30'}
        className="border border-slate-100 rounded-xl overflow-hidden shadow-sm"
      />
    </div>
  );
};

export default IncidentsTable;
