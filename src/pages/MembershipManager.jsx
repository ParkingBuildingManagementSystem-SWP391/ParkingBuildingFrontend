import React, { useCallback, useEffect, useState } from 'react';
import { Button, Modal, Space, Table, Tag, Typography, message } from 'antd';
import { Ban, RefreshCw } from 'lucide-react';
import { managerService } from '../services/managerService';
import { formatVietnamDateTime } from '../utils/dateTime';

const { Text } = Typography;

const unwrapData = (payload) => payload?.data?.data ?? payload?.data ?? payload ?? [];

const getValue = (source, ...keys) => {
  for (const key of keys) {
    if (source?.[key] !== undefined && source?.[key] !== null) return source[key];
  }
  return undefined;
};

const formatDateTime = (value) => {
  if (!value) return 'Chưa cập nhật';
  return formatVietnamDateTime(value);
};

const statusColorMap = {
  Active: 'green',
  Expired: 'orange',
  Canceled: 'red',
  Cancelled: 'red'
};

const MembershipManager = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cancelingIds, setCancelingIds] = useState({});

  const fetchMemberships = useCallback(async () => {
    setLoading(true);
    try {
      const response = await managerService.getMemberships();
      const data = unwrapData(response);
      setCards(Array.isArray(data) ? data : []);
    } catch (error) {
      message.error(error.response?.data?.message || 'Không thể tải danh sách Membership.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMemberships();
  }, [fetchMemberships]);

  const handleCancel = (record) => {
    const cardId = getValue(record, 'membershipCardId', 'MembershipCardId', 'cardId', 'id');
    const licenseVehicle = getValue(record, 'licenseVehicle', 'LicenseVehicle') || 'Membership này';

    Modal.confirm({
      title: 'Hủy Membership',
      content: `Bạn có chắc chắn muốn hủy Membership của xe ${licenseVehicle}?`,
      okText: 'Hủy Membership',
      okButtonProps: { danger: true },
      cancelText: 'Đóng',
      async onOk() {
        setCancelingIds((prev) => ({ ...prev, [cardId]: true }));
        try {
          await managerService.cancelMembership(cardId);
          message.success('Đã hủy Membership.');
          fetchMemberships();
        } catch (error) {
          message.error(error.response?.data?.message || error.response?.data?.error || 'Không thể hủy Membership.');
        } finally {
          setCancelingIds((prev) => ({ ...prev, [cardId]: false }));
        }
      }
    });
  };

  const columns = [
    {
      title: 'Chủ thẻ',
      key: 'owner',
      render: (_, record) => {
        const name = getValue(record, 'driverName', 'ownerName', 'fullName', 'driverFullName') || 'Chưa cập nhật';
        const phone = getValue(record, 'phone', 'phoneNumber', 'driverPhone') || 'Chưa có SĐT';
        return (
          <div className="flex flex-col">
            <Text strong>{name}</Text>
            <Text type="secondary" className="text-xs">{phone}</Text>
          </div>
        );
      }
    },
    {
      title: 'Biển số xe',
      dataIndex: 'licenseVehicle',
      key: 'licenseVehicle',
      render: (_, record) => (
        <span className="font-bold text-slate-900">{getValue(record, 'licenseVehicle', 'LicenseVehicle') || 'N/A'}</span>
      )
    },
    {
      title: 'Chỗ cố định',
      dataIndex: 'slotName',
      key: 'slotName',
      render: (_, record) => getValue(record, 'slotName', 'SlotName', 'unitName') || 'Chưa cập nhật'
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
        const cardId = getValue(record, 'membershipCardId', 'MembershipCardId', 'cardId', 'id');
        const status = getValue(record, 'status', 'Status') || 'Active';
        const isCanceled = ['Canceled', 'Cancelled'].includes(status);
        return (
          <Button
            danger
            icon={<Ban size={15} />}
            loading={Boolean(cancelingIds[cardId])}
            disabled={!cardId || isCanceled}
            onClick={() => handleCancel(record)}
          >
            Hủy thẻ
          </Button>
        );
      }
    }
  ];

  return (
    <div className="px-4 py-6">
      <div className="mb-5 flex justify-end">
        <Space>
          <Button icon={<RefreshCw size={15} />} onClick={fetchMemberships}>
            Làm mới
          </Button>
        </Space>
      </div>

      <Table
        rowKey={(record) => getValue(record, 'membershipCardId', 'MembershipCardId', 'cardId', 'id') || `${getValue(record, 'licenseVehicle')}-${getValue(record, 'slotName')}`}
        columns={columns}
        dataSource={cards}
        loading={loading}
        pagination={{ pageSize: 10, showSizeChanger: true }}
        scroll={{ x: 900 }}
        className="rounded-2xl bg-white shadow-sm"
      />
    </div>
  );
};

export default MembershipManager;
