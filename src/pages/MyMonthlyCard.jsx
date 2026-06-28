import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Card, Empty, Form, Input, Select, Spin, Tag, message } from 'antd';
import { CalendarDays, CreditCard, MapPin, ShieldCheck } from 'lucide-react';
import api from '../services/api';

const unwrapData = (payload) => payload?.data?.data ?? payload?.data ?? payload ?? null;

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

const vehicleTypes = [
  { value: 1, label: 'Xe đạp' },
  { value: 2, label: 'Xe máy' },
  { value: 3, label: 'Ô tô' }
];

const durations = [
  { value: 1, label: '1 tháng' },
  { value: 3, label: '3 tháng' },
  { value: 6, label: '6 tháng' },
  { value: 12, label: '12 tháng' }
];

const MyMonthlyCard = () => {
  const [form] = Form.useForm();
  const [cardInfo, setCardInfo] = useState(null);
  const [loadingCard, setLoadingCard] = useState(true);
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const selectedTypeId = Form.useWatch('vehicleTypeId', form);

  const fetchCardInfo = useCallback(async () => {
    setLoadingCard(true);
    try {
      const response = await api.get('/Driver/monthly-card');
      setCardInfo(unwrapData(response.data));
    } catch (error) {
      if (error.response?.status !== 404) {
        message.error(error.response?.data?.message || 'Không thể tải thông tin vé tháng.');
      }
      setCardInfo(null);
    } finally {
      setLoadingCard(false);
    }
  }, []);

  const fetchAvailableSlots = useCallback(async (typeId) => {
    if (!typeId) {
      setSlots([]);
      return;
    }

    setLoadingSlots(true);
    try {
      const response = await api.get('/Parking/slots', {
        params: { typeId, status: 'Available' }
      });
      const data = unwrapData(response.data);
      setSlots(Array.isArray(data) ? data : []);
    } catch (error) {
      setSlots([]);
      message.error(error.response?.data?.message || 'Không thể tải danh sách chỗ trống.');
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  useEffect(() => {
    fetchCardInfo();
  }, [fetchCardInfo]);

  useEffect(() => {
    fetchAvailableSlots(selectedTypeId);
    form.setFieldsValue({ slotId: undefined });
  }, [fetchAvailableSlots, form, selectedTypeId]);

  const slotOptions = useMemo(() => slots.map((slot) => ({
    value: getValue(slot, 'slotId', 'id', 'parkingSlotId'),
    label: getValue(slot, 'slotName', 'name', 'unitName', 'code') || `Slot #${getValue(slot, 'slotId', 'id')}`
  })).filter((slot) => slot.value !== undefined), [slots]);

  const handleRegister = async (values) => {
    setSubmitting(true);
    try {
      const response = await api.post('/Driver/monthly-card/register', {
        vehicleTypeId: Number(values.vehicleTypeId),
        typeId: Number(values.vehicleTypeId),
        licenseVehicle: values.licenseVehicle.trim().toUpperCase(),
        slotId: Number(values.slotId),
        durationInMonths: Number(values.durationInMonths),
        paymentMethod: 'VNPAY'
      });
      const paymentUrl = response.data?.data?.paymentUrl || response.data?.paymentUrl;
      if (paymentUrl) {
        window.location.href = paymentUrl;
        return;
      }
      message.success(response.data?.message || 'Đăng ký vé tháng thành công.');
      fetchCardInfo();
    } catch (error) {
      message.error(error.response?.data?.message || error.response?.data?.error || 'Không thể tạo đăng ký vé tháng.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingCard) {
    return (
      <div className="min-h-[420px] flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (cardInfo) {
    const licenseVehicle = getValue(cardInfo, 'licenseVehicle', 'LicenseVehicle');
    const slotName = getValue(cardInfo, 'slotName', 'SlotName', 'unitName');
    const startTime = getValue(cardInfo, 'startTime', 'StartTime');
    const endTime = getValue(cardInfo, 'endTime', 'EndTime');
    const tariffId = getValue(cardInfo, 'tariffId', 'TariffId');
    const status = getValue(cardInfo, 'status', 'Status') || 'Active';

    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 text-white shadow-2xl shadow-indigo-950/30">
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-100">
                <ShieldCheck size={15} />
                Monthly Parking Pass
              </div>
              <h1 className="mt-5 text-4xl font-black tracking-tight">{licenseVehicle || 'Biển số chưa cập nhật'}</h1>
              <p className="mt-2 text-sm font-medium text-indigo-100">Thẻ giữ chỗ cố định cho khách hàng đăng ký vé tháng</p>
            </div>
            <Tag color={status === 'Active' ? 'green' : 'default'} className="m-0 w-fit rounded-full px-4 py-1 text-sm font-bold">
              {status}
            </Tag>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <MapPin className="mb-3 text-cyan-200" size={22} />
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-200">Vị trí cố định</p>
              <p className="mt-1 text-lg font-extrabold">{slotName || 'Chưa cập nhật'}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <CalendarDays className="mb-3 text-emerald-200" size={22} />
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-200">Ngày bắt đầu</p>
              <p className="mt-1 text-sm font-bold">{formatDateTime(startTime)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <CalendarDays className="mb-3 text-amber-200" size={22} />
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-200">Ngày hết hạn</p>
              <p className="mt-1 text-sm font-bold">{formatDateTime(endTime)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <CreditCard className="mb-3 text-pink-200" size={22} />
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-200">Mã biểu phí</p>
              <p className="mt-1 text-lg font-extrabold">{tariffId || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Card className="rounded-2xl border-slate-100 shadow-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Đăng ký vé tháng</h1>
          <p className="mt-1 text-sm text-slate-500">Chọn loại xe, biển số và vị trí còn trống để tạo yêu cầu thanh toán VNPay.</p>
        </div>

        <Form
          form={form}
          layout="vertical"
          initialValues={{ durationInMonths: 1 }}
          onFinish={handleRegister}
          requiredMark={false}
        >
          <Form.Item
            name="vehicleTypeId"
            label="Loại xe"
            rules={[{ required: true, message: 'Vui lòng chọn loại xe.' }]}
          >
            <Select placeholder="Chọn loại xe" options={vehicleTypes} size="large" />
          </Form.Item>

          <Form.Item
            name="licenseVehicle"
            label="Biển số xe"
            rules={[{ required: true, message: 'Vui lòng nhập biển số xe.' }]}
          >
            <Input placeholder="Ví dụ: 51A12345" size="large" onChange={(event) => form.setFieldsValue({ licenseVehicle: event.target.value.toUpperCase() })} />
          </Form.Item>

          <Form.Item
            name="slotId"
            label="Chỗ đỗ còn trống"
            rules={[{ required: true, message: 'Vui lòng chọn chỗ đỗ.' }]}
          >
            <Select
              placeholder="Chọn chỗ đỗ"
              loading={loadingSlots}
              notFoundContent={selectedTypeId ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có chỗ trống" /> : 'Chọn loại xe trước'}
              options={slotOptions}
              size="large"
              showSearch
              optionFilterProp="label"
              disabled={!selectedTypeId}
            />
          </Form.Item>

          <Form.Item
            name="durationInMonths"
            label="Thời hạn"
            rules={[{ required: true, message: 'Vui lòng chọn thời hạn.' }]}
          >
            <Select options={durations} size="large" />
          </Form.Item>

          <Button type="primary" htmlType="submit" loading={submitting} size="large" block className="h-12 rounded-xl bg-indigo-600 font-bold">
            Thanh Toán Ngay qua VNPay
          </Button>
        </Form>
      </Card>
    </div>
  );
};

export default MyMonthlyCard;
