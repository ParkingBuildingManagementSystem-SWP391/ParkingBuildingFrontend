import React, { useEffect, useMemo, useState } from 'react';
import { Table, Input, Select, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import incidentReportService from '../services/incidentReportService';
import { formatVietnamDateTime } from '../utils/dateTime';

const IncidentHistory = () => {
  const { t } = useTranslation();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('Resolved');
  const [issueTypeFilter, setIssueTypeFilter] = useState('');
  const [searchText, setSearchText] = useState('');

  const issueTypeOptions = useMemo(() => ([
    { value: '', label: t('incidentHistory.filterTypeAll') },
    { value: 'Lost Ticket', label: t('createIncident.typeLostTicket') },
    { value: 'Vehicle Damage', label: t('createIncident.typeVehicleDamage') },
    { value: 'Equipment Malfunction', label: t('createIncident.typeEquipmentMalfunction') },
    { value: 'Other', label: t('createIncident.typeOther') },
  ]), [t]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const filters = {};
        if (statusFilter) filters.status = statusFilter;
        if (issueTypeFilter) filters.issueType = issueTypeFilter;
        if (searchText.trim()) filters.licenseVehicle = searchText.trim();

        const response = await incidentReportService.getIncidents(filters);
        setIncidents(Array.isArray(response) ? response : []);
      } catch (err) {
        console.error('IncidentHistory fetch error:', err);
        setError(t('incidentHistory.fetchError'));
        setIncidents([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [statusFilter, issueTypeFilter, searchText, t]);

  const columns = [
    {
      title: t('incidentHistory.colId'),
      dataIndex: 'incidentId',
      key: 'incidentId',
      render: (id) => <span className="font-mono text-xs font-extrabold text-indigo-700 dark:text-indigo-300">#{id}</span>,
    },
    {
      title: t('incidentHistory.colPlate'),
      dataIndex: 'licenseVehicle',
      key: 'licenseVehicle',
      render: (plate) => <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{plate || t('incidentHistory.notApplicable')}</span>,
    },
    {
      title: t('incidentHistory.colType'),
      dataIndex: 'issueType',
      key: 'issueType',
      render: (issueType) => <Tag color="purple">{issueType}</Tag>,
    },
    {
      title: t('incidentHistory.colSeverity'),
      dataIndex: 'severity',
      key: 'severity',
      render: (severity) => {
        if (severity === 'Critical') return <Tag color="error">{severity}</Tag>;
        if (severity === 'Warning') return <Tag color="warning">{severity}</Tag>;
        return <Tag color="processing">{severity}</Tag>;
      },
    },
    {
      title: t('incidentHistory.colFine'),
      dataIndex: 'fineAmount',
      key: 'fineAmount',
      render: (fineAmount) => (
        <span className="font-bold text-rose-600 dark:text-rose-400">
          {fineAmount ? `${Number(fineAmount).toLocaleString('vi-VN')} đ` : '0 đ'}
        </span>
      ),
    },
    {
      title: t('incidentHistory.colStatus'),
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        status === 'Resolved'
          ? <Tag color="success">{t('incidentHistory.statusResolvedTag')}</Tag>
          : <Tag color="gold">{t('incidentHistory.statusPendingTag')}</Tag>
      ),
    },
    {
      title: t('incidentHistory.colResolvedBy'),
      dataIndex: 'resolvedUsername',
      key: 'resolvedUsername',
      render: (name) => name || t('incidentHistory.notResolvedYet'),
    },
    {
      title: t('incidentHistory.colResolvedAt'),
      dataIndex: 'resolvedAt',
      key: 'resolvedAt',
      render: (value) => value ? formatVietnamDateTime(value) : t('incidentHistory.notResolvedYet'),
    },
    {
      title: t('incidentHistory.colNotes'),
      dataIndex: 'resolutionNotes',
      key: 'resolutionNotes',
      render: (notes) => <span className="italic text-slate-500 dark:text-slate-400">{notes || t('incidentHistory.noNotes')}</span>,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6 font-sans">
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            className="w-full sm:w-48"
            options={[
              { value: '', label: t('incidentHistory.filterStatusAll') },
              { value: 'Resolved', label: t('incidentHistory.filterStatusResolved') },
              { value: 'Pending', label: t('incidentHistory.filterStatusPending') },
            ]}
          />
          <Select
            value={issueTypeFilter}
            onChange={setIssueTypeFilter}
            className="w-full sm:w-56"
            options={issueTypeOptions}
          />
          <Input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder={t('incidentHistory.searchPlaceholder')}
            prefix={<Search size={16} className="text-slate-400" />}
            className="w-full sm:w-64"
            allowClear
          />
        </div>

        {error && <p className="mb-3 text-xs font-semibold text-rose-500">{error}</p>}

        <Table
          columns={columns}
          dataSource={incidents}
          loading={loading}
          rowKey="incidentId"
          locale={{ emptyText: error ? t('incidentHistory.emptyTextError') : t('incidentHistory.emptyText') }}
          pagination={{ pageSize: 10 }}
          className="border border-slate-100 rounded-2xl overflow-hidden dark:border-slate-700"
        />
      </div>
    </div>
  );
};

export default IncidentHistory;
