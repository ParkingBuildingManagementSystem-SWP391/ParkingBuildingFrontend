import React, { useCallback, useEffect, useState } from 'react';
import { Button, Input, InputNumber, Modal, Select, Space, Table, Tag, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { Ban, DollarSign, RefreshCw } from 'lucide-react';
import { managerService } from '../services/managerService';
import { formatVietnamDateTime } from '../utils/dateTime';
import { getStatusLabel } from '../utils/i18nLabels';

const unwrapMembershipCards = (payload) => {
  const data = payload?.data ?? payload;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.cards)) return data.cards;
  if (Array.isArray(data?.data?.cards)) return data.data.cards;

  return [];
};

const unwrapMembershipTiers = (payload) => {
  const data = payload?.data ?? payload;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.tiers)) return data.tiers;
  if (Array.isArray(data?.data?.tiers)) return data.data.tiers;

  return [];
};

const getValue = (source, ...keys) => {
  for (const key of keys) {
    if (source?.[key] !== undefined && source?.[key] !== null) {
      return source[key];
    }
  }
  return undefined;
};

const getLicenseVehicles = (record) => {
  const vehicles = getValue(record, 'licenseVehicles', 'LicenseVehicles', 'vehicles', 'Vehicles') || [];
  if (Array.isArray(vehicles)) return vehicles;
  return vehicles ? [vehicles] : [];
};

const getSlots = (record) => {
  const slots = getValue(record, 'slots', 'Slots') || [];
  return Array.isArray(slots) ? slots : [];
};

const getVehicleTypeKey = (record) => {
  const typeId = Number(getValue(record, 'typeId', 'TypeId', 'vehicleTypeId', 'VehicleTypeId'));
  if (typeId === 1) return 'bicycle';
  if (typeId === 2) return 'motorbike';
  if (typeId === 3) return 'car';

  const raw = String(getValue(record, 'vehicleType', 'VehicleType', 'vehicleTypeName', 'VehicleTypeName', 'typeName', 'TypeName') || '').toLowerCase();
  if (raw.includes('bicycle') || raw.includes('bike') || raw.includes('xe dap') || raw.includes('xe đạp')) return 'bicycle';
  if (raw.includes('motor') || raw.includes('moto') || raw.includes('xe may') || raw.includes('xe máy')) return 'motorbike';
  if (raw.includes('car') || raw.includes('auto') || raw.includes('oto') || raw.includes('ô tô') || raw.includes('xe hoi') || raw.includes('xe hơi')) return 'car';

  return 'unknown';
};

const getVehicleTypeLabel = (record, t) => {
  const key = getVehicleTypeKey(record);
  if (key === 'unknown') return getValue(record, 'vehicleType', 'VehicleType', 'vehicleTypeName', 'VehicleTypeName') || t('vehicleTypes.unknown');
  return t(`membershipConfig.vehicle.${key}`);
};

const getDurationMonths = (record) => Number(getValue(record, 'durationMonths', 'DurationMonths', 'durationInMonths', 'months')) || 0;

const getDurationLabel = (record, t) => {
  const duration = getDurationMonths(record);
  if ([1, 6, 12].includes(duration)) {
    return t(`membershipConfig.duration.month${duration}`);
  }
  return t('membershipConfig.duration.monthCount', { count: duration });
};

const getMembershipPackageLabel = (tier, t) => {
  const vehicleKey = getVehicleTypeKey(tier);
  const duration = getDurationMonths(tier);
  const packageKey = `membershipConfig.packages.${vehicleKey}${duration}`;

  if (vehicleKey !== 'unknown' && [1, 6, 12].includes(duration)) {
    return t(packageKey);
  }

  return getValue(tier, 'tierName', 'TierName', 'name', 'Name') || t('common.notUpdated');
};

const formatCurrency = (value) => `${Number(value || 0).toLocaleString('vi-VN')} VND`;

const statusColorMap = {
  Active: 'green',
  PendingPayment: 'gold',
  Expired: 'orange',
  Canceled: 'red',
  Cancelled: 'red'
};

const tableThemeClass = [
  'rounded-2xl bg-white shadow-sm dark:bg-slate-900',
  '[&_.ant-table]:!bg-white dark:[&_.ant-table]:!bg-slate-900',
  '[&_.ant-table-container]:!bg-white dark:[&_.ant-table-container]:!bg-slate-900',
  '[&_.ant-table-thead>tr>th]:!bg-slate-50 dark:[&_.ant-table-thead>tr>th]:!bg-slate-800',
  '[&_.ant-table-thead>tr>th]:!text-slate-600 dark:[&_.ant-table-thead>tr>th]:!text-slate-300',
  '[&_.ant-table-tbody>tr>td]:!bg-white dark:[&_.ant-table-tbody>tr>td]:!bg-slate-900',
  '[&_.ant-table-tbody>tr>td]:!text-slate-700 dark:[&_.ant-table-tbody>tr>td]:!text-slate-200',
  'dark:[&_.ant-table-tbody>tr:hover>td]:!bg-slate-800',
  '[&_.ant-table-cell]:!border-slate-100 dark:[&_.ant-table-cell]:!border-slate-700'
].join(' ');

const MembershipManager = () => {
  const { t } = useTranslation();
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cancelingIds, setCancelingIds] = useState({});
  const [statusFilter, setStatusFilter] = useState('');
  const [searchText, setSearchText] = useState('');
  const [tiers, setTiers] = useState([]);
  const [loadingTiers, setLoadingTiers] = useState(false);
  const [savingTierIds, setSavingTierIds] = useState({});
  const [tierPrices, setTierPrices] = useState({});

  const formatDateTime = (value) => {
    if (!value) return t('common.notUpdated');
    return formatVietnamDateTime(value);
  };

  const fetchMemberships = useCallback(async () => {
    setLoading(true);
    try {
      const response = await managerService.getMemberships({
        status: statusFilter || undefined,
        search: searchText || undefined,
      });
      setMemberships(unwrapMembershipCards(response));
    } catch (error) {
      message.error(error.response?.data?.message || t('membershipConfig.messages.loadMembershipsError'));
    } finally {
      setLoading(false);
    }
  }, [searchText, statusFilter, t]);

  const fetchTiers = useCallback(async () => {
    setLoadingTiers(true);
    try {
      const response = await managerService.getMembershipTiers();
      const tierList = unwrapMembershipTiers(response);
      setTiers(tierList);
      setTierPrices(
        tierList.reduce((acc, tier) => {
          const tierId = getValue(tier, 'tierId', 'TierId');
          if (tierId !== undefined && tierId !== null) {
            acc[tierId] = Number(getValue(tier, 'price', 'Price') || 0);
          }
          return acc;
        }, {})
      );
    } catch (error) {
      message.error(error.response?.data?.message || t('membershipConfig.messages.loadPricingError'));
    } finally {
      setLoadingTiers(false);
    }
  }, [t]);

  useEffect(() => {
    fetchMemberships();
  }, [fetchMemberships]);

  useEffect(() => {
    fetchTiers();
  }, [fetchTiers]);

  const handleSaveTierPrice = async (tier) => {
    const tierId = getValue(tier, 'tierId', 'TierId');
    const typeId = getValue(tier, 'typeId', 'TypeId');
    const durationMonths = getValue(tier, 'durationMonths', 'DurationMonths');
    const price = tierPrices[tierId];

    setSavingTierIds((prev) => ({ ...prev, [tierId]: true }));
    try {
      await managerService.updateMembershipPricing({
        typeId,
        durationMonths,
        price,
      });
      message.success(t('membershipConfig.messages.updateSuccess'));
      fetchTiers();
    } catch (error) {
      message.error(
        error.response?.data?.message ||
        error.response?.data?.error ||
        t('membershipConfig.messages.updateError')
      );
    } finally {
      setSavingTierIds((prev) => ({ ...prev, [tierId]: false }));
    }
  };

  const handleCancel = (record) => {
    const membershipCardId = getValue(record, 'membershipCardId', 'MembershipCardId', 'id', 'Id');
    const licenseVehicles = getLicenseVehicles(record);
    const licenseVehicleText = licenseVehicles.length ? licenseVehicles.join(', ') : t('membershipConfig.membershipFallback');

    Modal.confirm({
      title: t('membershipConfig.cancel.title'),
      content: t('membershipConfig.cancel.content', { licenseVehicle: licenseVehicleText }),
      okText: t('membershipConfig.cancel.ok'),
      okButtonProps: { danger: true },
      cancelText: t('membershipConfig.cancel.close'),
      async onOk() {
        setCancelingIds((prev) => ({ ...prev, [membershipCardId]: true }));
        try {
          await managerService.cancelMembership(membershipCardId);
          message.success(t('membershipConfig.messages.cancelSuccess'));
          fetchMemberships();
        } catch (error) {
          message.error(
            error.response?.data?.message ||
            error.response?.data?.error ||
            t('membershipConfig.messages.cancelError')
          );
        } finally {
          setCancelingIds((prev) => ({ ...prev, [membershipCardId]: false }));
        }
      }
    });
  };

  const tierColumns = [
    {
      title: t('membershipConfig.columns.packageName'),
      key: 'tierName',
      render: (_, record) => (
        <span className="font-semibold text-slate-900 dark:text-slate-100">
          {getMembershipPackageLabel(record, t)}
        </span>
      )
    },
    {
      title: t('membershipConfig.columns.vehicleType'),
      key: 'vehicleType',
      render: (_, record) => (
        <Tag color="blue" className="font-semibold">
          {getVehicleTypeLabel(record, t)}
        </Tag>
      )
    },
    {
      title: t('membershipConfig.columns.duration'),
      key: 'durationMonths',
      render: (_, record) => (
        <span className="font-medium text-slate-700 dark:text-slate-300">
          {getDurationLabel(record, t)}
        </span>
      )
    },
    {
      title: t('membershipConfig.columns.maxVehicles'),
      key: 'maxVehicles',
      render: (_, record) => (
        <span className="font-medium text-slate-700 dark:text-slate-300">
          {getValue(record, 'maxVehicles', 'MaxVehicles') || 0}
        </span>
      )
    },
    {
      title: t('membershipConfig.columns.price'),
      key: 'price',
      render: (_, record) => {
        const tierId = getValue(record, 'tierId', 'TierId');

        return (
          <InputNumber
            min={0}
            value={tierPrices[tierId]}
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value) => value?.replace(/\s?VND|(,*)/g, '')}
            onChange={(value) => setTierPrices((prev) => ({ ...prev, [tierId]: value ?? 0 }))}
            addonAfter={t('membershipConfig.currency.vnd')}
            className="w-full max-w-[220px]"
          />
        );
      }
    },
    {
      title: '',
      key: 'actions',
      align: 'right',
      render: (_, record) => {
        const tierId = getValue(record, 'tierId', 'TierId');

        return (
          <Button
            type="primary"
            icon={<DollarSign size={15} />}
            loading={Boolean(savingTierIds[tierId])}
            onClick={() => handleSaveTierPrice(record)}
          >
            {t('membershipConfig.actions.save')}
          </Button>
        );
      }
    }
  ];

  const columns = [
    {
      title: t('membershipConfig.columns.owner'),
      key: 'owner',
      render: (_, record) => {
        const name =
          getValue(record, 'username', 'userName', 'driverName', 'ownerName', 'fullName') ||
          t('common.notUpdated');
        const email = getValue(record, 'email', 'Email') || '';
        const phone =
          getValue(record, 'phoneNumber', 'phone', 'driverPhone') ||
          t('membershipConfig.noPhone');

        return (
          <div className="flex flex-col">
            <span className="font-semibold text-slate-900 dark:text-slate-100">{name}</span>
            {email && <span className="text-xs text-slate-500 dark:text-slate-400">{email}</span>}
            <span className="text-xs text-slate-500 dark:text-slate-400">{phone}</span>
          </div>
        );
      }
    },
    {
      title: t('membershipConfig.columns.membershipPackage'),
      key: 'tier',
      render: (_, record) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-900 dark:text-slate-100">{getMembershipPackageLabel(record, t)}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {getVehicleTypeLabel(record, t)} - {getDurationLabel(record, t)}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {formatCurrency(getValue(record, 'price', 'Price'))}
          </span>
        </div>
      )
    },
    {
      title: t('membershipConfig.columns.ticketCode'),
      key: 'ticketCode',
      render: (_, record) => (
        <Tag color="purple" className="font-mono font-bold">
          {getValue(record, 'ticketCode', 'TicketCode') || 'N/A'}
        </Tag>
      )
    },
    {
      title: t('membershipConfig.columns.licensePlates'),
      key: 'licenseVehicles',
      render: (_, record) => {
        const vehicles = getLicenseVehicles(record);

        return vehicles.length ? (
          <Space wrap>
            {vehicles.map((plate) => (
              <Tag key={plate} color="blue" className="font-bold">
                {plate}
              </Tag>
            ))}
          </Space>
        ) : (
          <span className="text-slate-500 dark:text-slate-400">N/A</span>
        );
      }
    },
    {
      title: t('membershipConfig.columns.fixedSlot'),
      key: 'slots',
      render: (_, record) => {
        const slots = getSlots(record);

        return slots.length ? (
          <Space direction="vertical" size={2}>
            {slots.map((slot) => (
              <span key={slot.slotId || slot.SlotId || slot.slotName || slot.SlotName} className="text-slate-700 dark:text-slate-300">
                {slot.slotName || slot.SlotName || 'N/A'}{' '}
                <Tag>{slot.slotStatus || slot.SlotStatus || 'N/A'}</Tag>
              </span>
            ))}
          </Space>
        ) : (
          <span className="text-slate-500 dark:text-slate-400">{t('common.notUpdated')}</span>
        );
      }
    },
    {
      title: t('membershipConfig.columns.validity'),
      key: 'validity',
      render: (_, record) => (
        <div className="flex flex-col text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-300">{formatDateTime(getValue(record, 'startTime', 'StartTime'))}</span>
          <span className="text-slate-500 dark:text-slate-400">
            {t('membershipConfig.validUntil', { date: formatDateTime(getValue(record, 'endTime', 'EndTime')) })}
          </span>
        </div>
      )
    },
    {
      title: t('membershipConfig.columns.status'),
      dataIndex: 'status',
      key: 'status',
      render: (_, record) => {
        const status = getValue(record, 'status', 'Status') || 'Active';
        return <Tag color={statusColorMap[status] || 'default'}>{getStatusLabel(status, t)}</Tag>;
      }
    },
    {
      title: '',
      key: 'actions',
      align: 'right',
      render: (_, record) => {
        const membershipCardId = getValue(record, 'membershipCardId', 'MembershipCardId', 'id', 'Id');
        const status = getValue(record, 'status', 'Status') || 'Active';
        const isDeleted = Boolean(getValue(record, 'isDeleted', 'IsDeleted'));
        const disabled = !membershipCardId || isDeleted || ['Canceled', 'Cancelled'].includes(status);

        return (
          <Button
            danger
            icon={<Ban size={15} />}
            loading={Boolean(cancelingIds[membershipCardId])}
            disabled={disabled}
            onClick={() => handleCancel(record)}
          >
            {t('membershipConfig.actions.cancelMembership')}
          </Button>
        );
      }
    }
  ];

  return (
    <div className="px-4 py-6 text-slate-900 dark:text-slate-100">
      <div className="mb-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="mb-1 text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              {t('membershipConfig.title')}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('membershipConfig.subtitle')}</p>
          </div>
          <Button icon={<RefreshCw size={15} />} onClick={fetchTiers} loading={loadingTiers}>
            {t('membershipConfig.actions.refresh')}
          </Button>
        </div>

        <Table
          rowKey={(record) => getValue(record, 'tierId', 'TierId')}
          columns={tierColumns}
          dataSource={tiers}
          loading={loadingTiers}
          pagination={false}
          scroll={{ x: 900 }}
          className={tableThemeClass}
        />
      </div>

      <div className="mb-5 flex justify-end">
        <Space wrap>
          <Input.Search
            allowClear
            placeholder={t('membershipConfig.search.placeholder')}
            onSearch={(value) => setSearchText(value)}
            style={{ width: 260 }}
          />

          <Select
            allowClear
            placeholder={t('membershipConfig.search.statusPlaceholder')}
            style={{ width: 180 }}
            value={statusFilter || undefined}
            onChange={(value) => setStatusFilter(value || '')}
            options={[
              { value: 'Active', label: getStatusLabel('Active', t) },
              { value: 'PendingPayment', label: getStatusLabel('PendingPayment', t) },
              { value: 'Expired', label: getStatusLabel('Expired', t) },
              { value: 'Cancelled', label: getStatusLabel('Cancelled', t) },
            ]}
          />

          <Button icon={<RefreshCw size={15} />} onClick={fetchMemberships}>
            {t('membershipConfig.actions.refresh')}
          </Button>
        </Space>
      </div>

      <Table
        rowKey={(record) =>
          getValue(record, 'membershipCardId', 'MembershipCardId', 'id', 'Id') ||
          `${getLicenseVehicles(record).join('-')}-${getSlots(record).map((slot) => slot.slotName || slot.SlotName).join('-')}`
        }
        columns={columns}
        dataSource={memberships}
        loading={loading}
        pagination={{ pageSize: 10, showSizeChanger: true }}
        scroll={{ x: 1100 }}
        className={tableThemeClass}
      />
    </div>
  );
};

export default MembershipManager;
