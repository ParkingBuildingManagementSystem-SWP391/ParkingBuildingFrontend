import React, { useEffect, useState, useMemo } from 'react';
import { Table, Button, Input, InputNumber, Tooltip, Space, Modal, Image, message } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  Camera,
  MapPin,
  Clock,
  Activity,
  Search,
  Coins
} from 'lucide-react';
import { managerService } from '../../services/managerService';
import incidentReportService from '../../services/incidentReportService';
import { formatVietnamDateTime, parseUtcDate } from '../../utils/dateTime';
import { useAuth } from '../../context/AuthContext';

const IncidentsTable = () => {
  const { t } = useTranslation();
  const { role } = useAuth();
  const isManager = String(role || '').toLowerCase() === 'manager';
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchText, setSearchText] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('All');
  const [resolvingId, setResolvingId] = useState(null);
  const [evidenceIncident, setEvidenceIncident] = useState(null);
  const [resolveIncidentId, setResolveIncidentId] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [fineAmount, setFineAmount] = useState(0);
  const [stats, setStats] = useState(null);

  const normalizeIncident = (item, index) => {
    const safeItem = item || {};
    let realId = `incident-${index}`;
    if (safeItem.id !== undefined && safeItem.id !== null) realId = safeItem.id;
    else if (safeItem.incidentId !== undefined && safeItem.incidentId !== null) realId = safeItem.incidentId;
    else if (safeItem.IncidentId !== undefined && safeItem.IncidentId !== null) realId = safeItem.IncidentId;
    else if (safeItem.code !== undefined && safeItem.code !== null) realId = safeItem.code;

    return {
      id: realId,
      severity: safeItem.severity || safeItem.Severity || 'Info',
      timestamp: safeItem.incidentTime || safeItem.IncidentTime || safeItem.timestamp || safeItem.Timestamp || safeItem.createdAt || safeItem.CreatedAt || safeItem.reportedAt || safeItem.ReportedAt,
      type: safeItem.issueType || safeItem.IssueType || safeItem.type || safeItem.Type || safeItem.title || safeItem.Title || t('dashboard.incidents.defaultType'),
      description: safeItem.description || safeItem.Description || safeItem.message || safeItem.Message || '',
      location: safeItem.location || safeItem.Location || safeItem.slotName || safeItem.SlotName || safeItem.licenseVehicle || safeItem.LicenseVehicle || '',
      status: safeItem.status || safeItem.Status || 'Pending',
      imageProofUrl: safeItem.imageProofUrl || safeItem.ImageProofUrl || ''
    };
  };

  const isResolved = (status) => status === 'Resolved';
  const isPending = (status) => !isResolved(status);

  const fetchIncidents = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      
      if (filterSeverity === 'Resolved') {
        params.status = 'Resolved';
      } else if (filterSeverity !== 'All') {
        params.severity = filterSeverity;
        params.status = 'Pending';
      }
      
      if (searchText.trim() !== '') {
        params.licenseVehicle = searchText.trim();
      }

      const response = await managerService.getIncidents(params);
      const data = Array.isArray(response) ? response : (response?.data || response?.Data || []);
      setIncidents((data || []).map((item, index) => {
        const safeItem = item || {};
        const normalized = normalizeIncident(safeItem, index);
        return {
          ...normalized,
          status: safeItem.status === 'Open' || safeItem.Status === 'Open' ? 'Pending' : normalized.status
        };
      }));
    } catch (err) {
      console.error('fetchIncidents error:', err);
      setError(t('dashboard.incidents.fetchError'));
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchIncidents();
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [filterSeverity, searchText]);

  const fetchStats = async () => {
    try {
      const data = await incidentReportService.getIncidentStatistics();
      setStats(data);
    } catch (err) {
      console.error('fetchStats error:', err);
    }
  };

  useEffect(() => {
    if (isManager) fetchStats();
  }, [isManager]);

  // Filter Logic
  const filteredIncidents = useMemo(() => {
    return incidents.filter(inc => {
      const matchSearch = String(inc.id).toLowerCase().includes(searchText.toLowerCase()) ||
                          inc.type.toLowerCase().includes(searchText.toLowerCase()) ||
                          inc.location.toLowerCase().includes(searchText.toLowerCase());
      const matchSeverity = filterSeverity === 'All' ? isPending(inc.status) :
                            (filterSeverity === 'Resolved' ? isResolved(inc.status) :
                            (inc.severity === filterSeverity && isPending(inc.status)));

      return matchSearch && matchSeverity;
    }).sort((a, b) => {
      if (isPending(a.status) && isResolved(b.status)) return -1;
      if (isResolved(a.status) && isPending(b.status)) return 1;
      return (parseUtcDate(b.timestamp)?.getTime() || 0) - (parseUtcDate(a.timestamp)?.getTime() || 0);
    });
  }, [incidents, searchText, filterSeverity]);

  // Handle Resolve Action
  const handleResolve = (record) => {
    setResolveIncidentId(record.id);
    setResolutionNotes(t('dashboard.incidents.defaultResolutionNotes'));
    setFineAmount(record.type === 'Lost Ticket' ? 50000 : 0);
  };

  const handleResolveSubmit = () => {
    if (!resolutionNotes.trim()) {
      message.error(t('dashboard.incidents.promptNotesRequired'));
      return;
    }

    const payload = {
      resolutionNotes: resolutionNotes.trim(),
      fineAmount: Number(fineAmount) || 0,
    };

    setResolvingId(resolveIncidentId);

    managerService.resolveIncident(resolveIncidentId, payload)
      .then(() => {
        setIncidents((prev) =>
          prev.map((inc) =>
            inc.id === resolveIncidentId
              ? { ...inc, status: 'Resolved', ...payload }
              : inc
          )
        );

        message.success(t('dashboard.incidents.resolveSuccess', { id: resolveIncidentId }));
        setResolveIncidentId(null);
        setResolutionNotes('');
        setFineAmount(0);
        if (isManager) fetchStats();
      })
      .catch((err) => {
        console.error('resolveIncident error:', err);
        message.error(t('dashboard.incidents.resolveError'));
      })
      .finally(() => {
        setResolvingId(null);
      });
  };

  // Tag rendering helpers
  const getSeverityTag = (severity) => {
    switch (severity) {
      case 'Critical': return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 ring-1 ring-inset ring-rose-200 whitespace-nowrap">
          <AlertCircle size={14} /> {t('dashboard.incidents.severity.critical')}
        </span>
      );
      case 'Warning': return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 ring-1 ring-inset ring-amber-200 whitespace-nowrap">
          <AlertTriangle size={14} /> {t('dashboard.incidents.severity.warning')}
        </span>
      );
      case 'Info': return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 ring-1 ring-inset ring-indigo-200 whitespace-nowrap">
          <Info size={14} /> {t('dashboard.incidents.severity.info')}
        </span>
      );
      default: return (
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 ring-1 ring-inset ring-slate-200 whitespace-nowrap dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700">
          {severity}
        </span>
      );
    }
  };

  const getStatusTag = (status) => {
    if (isResolved(status)) return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-200 whitespace-nowrap dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/40">
        <CheckCircle2 size={14} /> {t('dashboard.incidents.status.resolved')}
      </span>
    );
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-500 ring-1 ring-inset ring-slate-200 whitespace-nowrap dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> {t('dashboard.incidents.status.open')}
      </span>
    );
  };

  const columns = [
    {
      title: t('dashboard.incidents.columns.id'),
      dataIndex: 'id',
      key: 'id',
      render: (text) => <span className="font-mono text-xs font-extrabold text-rose-700">{text}</span>,
    },
    {
      title: t('dashboard.incidents.columns.severity'),
      dataIndex: 'severity',
      key: 'severity',
      render: (severity) => getSeverityTag(severity),
    },
    {
      title: t('dashboard.incidents.columns.details'),
      key: 'details',
      render: (_, record) => (
        <div className="flex flex-col gap-1 max-w-md">
          <span className="font-bold text-slate-900 text-sm dark:text-slate-100">{record.type}</span>
          <span className="text-xs text-slate-500 leading-relaxed dark:text-slate-400">{record.description}</span>
        </div>
      )
    },
    {
      title: t('dashboard.incidents.columns.locationTime'),
      key: 'locationTime',
      render: (_, record) => (
        <div className="flex flex-col gap-1.5 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-1.5 font-semibold text-indigo-600">
            <MapPin size={14} /> {record.location}
          </div>
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <Clock size={14} /> {formatVietnamDateTime(record.timestamp)}
          </div>
        </div>
      )
    },
    {
      title: t('dashboard.incidents.columns.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
    },
    {
      title: t('dashboard.incidents.columns.action'),
      key: 'action',
      render: (_, record) => {
        if (isResolved(record.status)) {
          return <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 whitespace-nowrap"><CheckCircle2 size={14} /> {t('dashboard.incidents.resolvedLabel')}</span>;
        }

        return (
          <Space>
            <Tooltip title={t('dashboard.incidents.cameraEvidence')}>
              <Button
                icon={<Camera size={14} />}
                size="small"
                className="flex items-center justify-center rounded-[12px] border-slate-200 bg-white text-slate-500 hover:text-indigo-600 hover:border-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-indigo-300"
                onClick={() => record.imageProofUrl ? setEvidenceIncident(record) : message.info(t('dashboard.incidents.noCameraEvidence'))}
              />
            </Tooltip>
            {isManager && (
              <Button
                type="primary"
                size="small"
                className="rounded-[12px] border-0 bg-emerald-600 font-bold shadow-sm hover:bg-emerald-700"
                onClick={() => handleResolve(record)}
              >
                {t('dashboard.incidents.resolve')}
              </Button>
            )}
          </Space>
        );
      }
    }
  ];

  // Calculate stats for badges
  const criticalCount = incidents.filter(i => i.severity === 'Critical' && isPending(i.status)).length;
  const warningCount = incidents.filter(i => i.severity === 'Warning' && isPending(i.status)).length;

  return (
    <div className="space-y-5 font-sans">

      {/* Manager-only KPI stats */}
      {isManager && stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-2xl border-l-4 border-indigo-500 bg-white p-5 shadow-sm dark:border-indigo-400 dark:bg-slate-900">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('dashboard.incidents.statsTotal')}</p>
            <h3 className="mt-1 text-2xl font-extrabold text-indigo-600 dark:text-indigo-300">{stats.totalIncidents ?? 0}</h3>
          </div>
          <div className="rounded-2xl border-l-4 border-amber-500 bg-white p-5 shadow-sm dark:border-amber-400 dark:bg-slate-900">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('dashboard.incidents.statsPending')}</p>
            <h3 className="mt-1 text-2xl font-extrabold text-amber-600 dark:text-amber-300">{stats.pendingCount ?? 0}</h3>
          </div>
          <div className="rounded-2xl border-l-4 border-emerald-500 bg-white p-5 shadow-sm dark:border-emerald-400 dark:bg-slate-900">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('dashboard.incidents.statsResolved')}</p>
            <h3 className="mt-1 text-2xl font-extrabold text-emerald-600 dark:text-emerald-300">{stats.resolvedCount ?? 0}</h3>
          </div>
          <div className="rounded-2xl border-l-4 border-rose-500 bg-white p-5 shadow-sm dark:border-rose-400 dark:bg-slate-900">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <Coins size={13} /> {t('dashboard.incidents.statsTotalFine')}
            </p>
            <h3 className="mt-1 text-2xl font-extrabold text-rose-600 dark:text-rose-300">
              {(stats.totalFineCollected || 0).toLocaleString('vi-VN')} đ
            </h3>
          </div>
          <div className="rounded-2xl border-l-4 border-purple-500 bg-white p-5 shadow-sm dark:border-purple-400 dark:bg-slate-900">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('dashboard.incidents.statsTopIssue')}</p>
            <h3 className="mt-1 truncate text-lg font-extrabold text-purple-600 dark:text-purple-300">{stats.topIssueType || t('incidentHistory.notApplicable')}</h3>
          </div>
        </div>
      )}

    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5 font-sans dark:border-slate-700 dark:bg-slate-900">

      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-1 ring-inset ring-rose-100 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-500/40">
            <Activity size={22} />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
              {t('dashboard.incidents.title')}
            </h3>
            <p className="text-sm text-slate-500 mt-0.5 dark:text-slate-400">{t('dashboard.incidents.subtitle')}</p>
            {error && <p className="text-xs text-rose-500 mt-2 font-semibold">{error}</p>}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">

          <div className="flex bg-slate-50 p-1 rounded-[14px] border border-slate-200 dark:border-slate-700 dark:bg-slate-800">
            <button
              onClick={() => setFilterSeverity('All')}
              className={`px-3 py-1.5 text-xs font-bold rounded-[10px] transition-all ${filterSeverity === 'All' ? 'bg-white shadow-sm text-slate-900 dark:bg-slate-900 dark:text-slate-100' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
            >
              {t('dashboard.incidents.filterOpen')}
            </button>
            <button
              onClick={() => setFilterSeverity('Critical')}
              className={`px-3 py-1.5 text-xs font-bold rounded-[10px] transition-all flex items-center gap-1.5 ${filterSeverity === 'Critical' ? 'bg-rose-100 shadow-sm text-rose-800 dark:bg-rose-500/15 dark:text-rose-300' : 'text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-300'}`}
            >
              {t('dashboard.incidents.filterCritical')}
              {criticalCount > 0 && <span className="bg-rose-500 text-white px-1.5 rounded-full text-[10px]">{criticalCount}</span>}
            </button>
            <button
              onClick={() => setFilterSeverity('Warning')}
              className={`px-3 py-1.5 text-xs font-bold rounded-[10px] transition-all flex items-center gap-1.5 ${filterSeverity === 'Warning' ? 'bg-amber-100 shadow-sm text-amber-800 dark:bg-amber-500/15 dark:text-amber-300' : 'text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-300'}`}
            >
              {t('dashboard.incidents.filterWarning')}
              {warningCount > 0 && <span className="bg-amber-500 text-white px-1.5 rounded-full text-[10px]">{warningCount}</span>}
            </button>
            <button
              onClick={() => setFilterSeverity('Resolved')}
              className={`px-3 py-1.5 text-xs font-bold rounded-[10px] transition-all ${filterSeverity === 'Resolved' ? 'bg-emerald-100 shadow-sm text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300' : 'text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-300'}`}
            >
              {t('dashboard.incidents.filterResolved')}
            </button>
          </div>

          <Input
            placeholder={t('dashboard.incidents.search')}
            prefix={<Search size={16} className="text-slate-400" />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            className="w-48 h-9 rounded-[12px]"
          />

        </div>
      </div>

      {/* Data Table */}
      <Table
        columns={columns}
        dataSource={filteredIncidents}
        loading={loading}
        rowKey="id"
        locale={{ emptyText: error ? t('dashboard.incidents.emptyTextError') : t('dashboard.incidents.emptyText') }}
        pagination={{ pageSize: 5 }}
        rowClassName={(record) => isResolved(record.status) ? 'bg-slate-50/50 opacity-70 dark:bg-slate-800/40' : 'hover:bg-rose-50/30 dark:hover:bg-rose-500/10'}
        className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm dark:border-slate-700"
      />

      <Modal
        title={evidenceIncident ? `${t('dashboard.incidents.cameraEvidence')} #${evidenceIncident.id}` : t('dashboard.incidents.cameraEvidence')}
        open={!!evidenceIncident}
        onCancel={() => setEvidenceIncident(null)}
        footer={null}
        destroyOnClose
      >
        {evidenceIncident?.imageProofUrl && (
          <Image
            src={evidenceIncident.imageProofUrl}
            alt={evidenceIncident.description || evidenceIncident.type}
            className="rounded-xl"
          />
        )}
      </Modal>

      <Modal
        title={`${t('dashboard.incidents.resolve', 'Giải quyết sự cố')} #${resolveIncidentId}`}
        open={!!resolveIncidentId}
        onOk={handleResolveSubmit}
        onCancel={() => setResolveIncidentId(null)}
        confirmLoading={resolvingId !== null}
        okText={t('dashboard.incidents.confirm', 'Xác nhận')}
        cancelText={t('dashboard.incidents.cancel', 'Hủy')}
        destroyOnClose
      >
        <div className="space-y-4 py-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
              {t('dashboard.incidents.promptNotes')}{' '}
              <span className="text-rose-500">*</span>
            </label>

            <Input.TextArea
              rows={3}
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder={t('dashboard.incidents.notesPlaceholder')}
              className="rounded-lg"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
              {t('dashboard.incidents.fineAmountLabel')}
            </label>
            <InputNumber
              min={0}
              step={1000}
              value={fineAmount}
              onChange={(value) => setFineAmount(value || 0)}
              placeholder={t('dashboard.incidents.fineAmountPlaceholder')}
              addonAfter="đ"
              className="w-full rounded-lg"
            />
          </div>
        </div>
      </Modal>
    </div>
    </div>
  );
};

export default IncidentsTable;
