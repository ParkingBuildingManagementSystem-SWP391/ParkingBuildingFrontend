import React, { useCallback, useEffect, useState } from 'react';
import { Button, Modal, Space, Table, Tag, Typography, message } from 'antd';
import { Ban, RefreshCw } from 'lucide-react';
import { managerService } from '../services/managerService';

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
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

const statusColorMap = {
  Active: 'green',
  Expired: 'orange',
  Canceled: 'red',
  Cancelled: 'red'
};

const MonthlyCardManager = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cancelingIds, setCancelingIds] = useState({});

  const fetchMonthlyCards = useCallback(async () => {
    setLoading(true);
    try {
      const response = await managerService.getMonthlyCards();
      const data = unwrapData(response);
      setCards(Array.isArray(data) ? data : []);
    } catch (error) {
      message.error(error.response?.data?.message || 'Không thể tải danh sách vé tháng.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMonthlyCards();
  }, [fetchMonthlyCards]);

  const handleCancel = (record) => {
    const cardId = getValue(record, 'monthlyCardId', 'cardId', 'id');
    const licenseVehicle = getValue(record, 'licenseVehicle', 'LicenseVehicle') || 'thẻ này';

    Modal.confirm({
      title: 'Hủy thẻ tháng',
      content: `Bạn có chắc chắn muốn hủy vé tháng của xe ${licenseVehicle}?`,
      okText: 'Hủy thẻ',
      okButtonProps: { danger: true },
      cancelText: 'Đóng',
      async onOk() {
        setCancelingIds((prev) => ({ ...prev, [cardId]: true }));
        try {
          await managerService.cancelMonthlyCard(cardId);
          message.success('Đã hủy vé tháng.');
          fetchMonthlyCards();
        } catch (error) {
          message.error(error.response?.data?.message || error.response?.data?.error || 'Không thể hủy vé tháng.');
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
        const cardId = getValue(record, 'monthlyCardId', 'cardId', 'id');
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
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Quản lý vé tháng</h1>
          <p className="mt-1 text-sm text-slate-500">Theo dõi danh sách thẻ, vị trí cố định và trạng thái hiệu lực.</p>
        </div>
        <Space>
          <Button icon={<RefreshCw size={15} />} onClick={fetchMonthlyCards}>
            Làm mới
          </Button>
        </Space>
      </div>

      <Table
        rowKey={(record) => getValue(record, 'monthlyCardId', 'cardId', 'id') || `${getValue(record, 'licenseVehicle')}-${getValue(record, 'slotName')}`}
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

export default MonthlyCardManager;
