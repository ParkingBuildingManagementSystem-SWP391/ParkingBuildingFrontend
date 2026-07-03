import React, { useCallback, useEffect, useState } from 'react';
import { Button, Input, InputNumber, Modal, Select, Space, Table, Tag, Typography, message } from 'antd';
import { Ban, DollarSign, RefreshCw } from 'lucide-react';
import { managerService } from '../services/managerService';
import { formatVietnamDateTime } from '../utils/dateTime';

const { Text } = Typography;

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

const formatDateTime = (value) => {
  if (!value) return 'Chưa cập nhật';
  return formatVietnamDateTime(value);
};

const formatCurrency = (value) => `${Number(value || 0).toLocaleString('vi-VN')} đ`;

const statusColorMap = {
  Active: 'green',
  PendingPayment: 'gold',
  Expired: 'orange',
  Canceled: 'red',
  Cancelled: 'red'
};

const MembershipManager = () => {
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cancelingIds, setCancelingIds] = useState({});
  const [statusFilter, setStatusFilter] = useState('');
  const [searchText, setSearchText] = useState('');
  const [tiers, setTiers] = useState([]);
  const [loadingTiers, setLoadingTiers] = useState(false);
  const [savingTierIds, setSavingTierIds] = useState({});
  const [tierPrices, setTierPrices] = useState({});

  const fetchMemberships = useCallback(async () => {
    setLoading(true);
    try {
      const response = await managerService.getMemberships({
        status: statusFilter || undefined,
        search: searchText || undefined,
      });
      setMemberships(unwrapMembershipCards(response));
    } catch (error) {
      message.error(error.response?.data?.message || 'Không thể tải danh sách Membership.');
    } finally {
      setLoading(false);
    }
  }, [searchText, statusFilter]);

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
      message.error(error.response?.data?.message || 'Không thể tải cấu hình giá Membership.');
    } finally {
      setLoadingTiers(false);
    }
  }, []);

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
      message.success('Đã cập nhật giá gói Membership.');
      fetchTiers();
    } catch (error) {
      message.error(
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Không thể cập nhật giá gói Membership.'
      );
    } finally {
      setSavingTierIds((prev) => ({ ...prev, [tierId]: false }));
    }
  };

  const handleCancel = (record) => {
    const membershipCardId = getValue(record, 'membershipCardId', 'MembershipCardId', 'id', 'Id');
    const licenseVehicles = getLicenseVehicles(record);
    const licenseVehicleText = licenseVehicles.length ? licenseVehicles.join(', ') : 'Membership này';

    Modal.confirm({
      title: 'Hủy Membership',
      content: `Bạn có chắc chắn muốn hủy Membership của xe ${licenseVehicleText}?`,
      okText: 'Hủy Membership',
      okButtonProps: { danger: true },
      cancelText: 'Đóng',
      async onOk() {
        setCancelingIds((prev) => ({ ...prev, [membershipCardId]: true }));
        try {
          await managerService.cancelMembership(membershipCardId);
          message.success('Đã hủy Membership.');
          fetchMemberships();
        } catch (error) {
          message.error(
            error.response?.data?.message ||
            error.response?.data?.error ||
            'Không thể hủy Membership.'
          );
        } finally {
          setCancelingIds((prev) => ({ ...prev, [membershipCardId]: false }));
        }
      }
    });
  };

  const tierColumns = [
    {
      title: 'Tên gói',
      key: 'tierName',
      render: (_, record) => (
        <Text strong>{getValue(record, 'tierName', 'TierName') || 'Chưa cập nhật'}</Text>
      )
    },
    {
      title: 'Loại xe',
      key: 'vehicleType',
      render: (_, record) => (
        <Tag color="blue">
          {getValue(record, 'vehicleType', 'VehicleType', 'vehicleTypeName', 'VehicleTypeName') || 'N/A'}
        </Tag>
      )
    },
    {
      title: 'Thời hạn',
      key: 'durationMonths',
      render: (_, record) => `${getValue(record, 'durationMonths', 'DurationMonths') || 0} tháng`
    },
    {
      title: 'Xe tối đa',
      key: 'maxVehicles',
      render: (_, record) => getValue(record, 'maxVehicles', 'MaxVehicles') || 0
    },
    {
      title: 'Giá',
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
            addonAfter="VND"
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
            Lưu
          </Button>
        );
      }
    }
  ];

  const columns = [
    {
      title: 'Chủ thẻ',
      key: 'owner',
      render: (_, record) => {
        const name =
          getValue(record, 'username', 'userName', 'driverName', 'ownerName', 'fullName') ||
          'Chưa cập nhật';
        const email = getValue(record, 'email', 'Email') || '';
        const phone =
          getValue(record, 'phoneNumber', 'phone', 'driverPhone') ||
          'Chưa có SĐT';

        return (
          <div className="flex flex-col">
            <Text strong>{name}</Text>
            {email && <Text type="secondary" className="text-xs">{email}</Text>}
            <Text type="secondary" className="text-xs">{phone}</Text>
          </div>
        );
      }
    },
    {
      title: 'Gói Membership',
      key: 'tier',
      render: (_, record) => (
        <div className="flex flex-col">
          <Text strong>{getValue(record, 'tierName', 'TierName') || 'Chưa cập nhật'}</Text>
          <Text type="secondary" className="text-xs">
            {(getValue(record, 'vehicleTypeName', 'VehicleTypeName') || 'N/A')} - {(getValue(record, 'durationMonths', 'DurationMonths') || 0)} tháng
          </Text>
          <Text type="secondary" className="text-xs">
            {formatCurrency(getValue(record, 'price', 'Price'))}
          </Text>
        </div>
      )
    },
    {
      title: 'Mã thẻ',
      key: 'ticketCode',
      render: (_, record) => (
        <Tag color="purple" className="font-mono font-bold">
          {getValue(record, 'ticketCode', 'TicketCode') || 'N/A'}
        </Tag>
      )
    },
    {
      title: 'Biển số',
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
          'N/A'
        );
      }
    },
    {
      title: 'Slot cố định',
      key: 'slots',
      render: (_, record) => {
        const slots = getSlots(record);

        return slots.length ? (
          <Space direction="vertical" size={2}>
            {slots.map((slot) => (
              <span key={slot.slotId || slot.SlotId || slot.slotName || slot.SlotName}>
                {slot.slotName || slot.SlotName || 'N/A'}{' '}
                <Tag>{slot.slotStatus || slot.SlotStatus || 'N/A'}</Tag>
              </span>
            ))}
          </Space>
        ) : (
          'Chưa cập nhật'
        );
      }
    },
    {
      title: 'Hiệu lực',
      key: 'validity',
      render: (_, record) => (
        <div className="flex flex-col text-sm">
          <span>{formatDateTime(getValue(record, 'startTime', 'StartTime'))}</span>
          <span className="text-slate-400">đến {formatDateTime(getValue(record, 'endTime', 'EndTime'))}</span>
        </div>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (_, record) => {
        const status = getValue(record, 'status', 'Status') || 'Active';
        return <Tag color={statusColorMap[status] || 'default'}>{status}</Tag>;
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
            Hủy Membership
          </Button>
        );
      }
    }
  ];

  return (
    <div className="px-4 py-6">
      <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <Typography.Title level={4} className="!mb-1">
              Cấu hình giá gói Membership
            </Typography.Title>
            <Text type="secondary">Giá Membership được lưu theo MembershipTier.</Text>
          </div>
          <Button icon={<RefreshCw size={15} />} onClick={fetchTiers} loading={loadingTiers}>
            Làm mới
          </Button>
        </div>

        <Table
          rowKey={(record) => getValue(record, 'tierId', 'TierId')}
          columns={tierColumns}
          dataSource={tiers}
          loading={loadingTiers}
          pagination={false}
          scroll={{ x: 900 }}
        />
      </div>

      <div className="mb-5 flex justify-end">
        <Space wrap>
          <Input.Search
            allowClear
            placeholder="Tìm biển số, tên, email..."
            onSearch={(value) => setSearchText(value)}
            style={{ width: 260 }}
          />

          <Select
            allowClear
            placeholder="Trạng thái"
            style={{ width: 180 }}
            value={statusFilter || undefined}
            onChange={(value) => setStatusFilter(value || '')}
            options={[
              { value: 'Active', label: 'Active' },
              { value: 'PendingPayment', label: 'PendingPayment' },
              { value: 'Expired', label: 'Expired' },
              { value: 'Canceled', label: 'Canceled' },
            ]}
          />

          <Button icon={<RefreshCw size={15} />} onClick={fetchMemberships}>
            Làm mới
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
        className="rounded-2xl bg-white shadow-sm"
      />
    </div>
  );
};

export default MembershipManager;
