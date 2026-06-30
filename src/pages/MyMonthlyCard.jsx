import React, { useCallback, useEffect, useState } from 'react';
import { Button, Card, Form, Input, Select, Spin, Tag, message } from 'antd';
import { CalendarDays, CreditCard, ShieldCheck } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { formatDateTimeVN } from '../utils/dateTime';

const unwrapData = (payload) => payload?.data?.data ?? payload?.data ?? payload ?? null;

const getValue = (source, ...keys) => {
  for (const key of keys) {
    if (source?.[key] !== undefined && source?.[key] !== null) return source[key];
  }
  return undefined;
};

const getPaymentUrl = (payload) => {
  const data = unwrapData(payload);
  const candidates = [payload, payload?.data, data, data?.data];
  const keys = ['paymentUrl', 'paymentURL', 'PaymentUrl', 'PaymentURL', 'vnpayUrl', 'vnPayUrl', 'VnpayUrl', 'VnPayUrl', 'url', 'Url'];

  for (const source of candidates) {
    for (const key of keys) {
      if (source?.[key]) return source[key];
    }
  }

  return '';
};

const formatDateTime = (value) => {
  if (!value) return 'Chưa cập nhật';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return formatDateTimeVN(date);
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
  const [submitting, setSubmitting] = useState(false);

  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const urlSlotId = searchParams.get('selectedSlotId');
  const urlSlotName = searchParams.get('selectedSlotName');
  const urlVehicleTypeId = searchParams.get('vehicleTypeId');

  const selectedVehicleTypeId = Form.useWatch('vehicleTypeId', form);

  useEffect(() => {
    if (selectedVehicleTypeId) {
      setLoadingSlots(true);
      api.get(`/Parking/slots?typeId=${selectedVehicleTypeId}&status=Available`)
        .then(res => {
          const data = unwrapData(res.data);
          setSlots(Array.isArray(data) ? data : []);
        })
        .catch(err => {
          console.error("Lỗi tải danh sách ô đỗ:", err);
          message.error("Không thể tải danh sách vị trí đỗ xe.");
        })
        .finally(() => setLoadingSlots(false));
    } else {
      setSlots([]);
    }
  }, [selectedVehicleTypeId]);

  useEffect(() => {
    const savedForm = sessionStorage.getItem('monthly_card_reg_form');
    let savedValues = {};
    if (savedForm) {
      try {
        savedValues = JSON.parse(savedForm);
        sessionStorage.removeItem('monthly_card_reg_form');
      } catch (e) {
        console.error(e);
      }
    }

    if (urlSlotId && urlSlotName && urlVehicleTypeId) {
      const vId = Number(urlVehicleTypeId);
      const sId = Number(urlSlotId);
      form.setFieldsValue({
        vehicleTypeId: vId,
        slotId: sId,
        licenseVehicle: savedValues.licenseVehicle || '',
        durationInMonths: savedValues.durationInMonths || 1
      });
      // Nếu chưa fetch được mảng slots đầy đủ, ta set tạm vào để dropdown hiển thị được tên
      setSlots(prev => prev.some(s => s.slotId === sId) ? prev : [{ slotId: sId, slotName: urlSlotName }, ...prev]);
    } else if (Object.keys(savedValues).length > 0) {
      form.setFieldsValue({
        licenseVehicle: savedValues.licenseVehicle || '',
        durationInMonths: savedValues.durationInMonths || 1
      });
    }
  }, [urlSlotId, urlSlotName, urlVehicleTypeId, form]);

  const handleGoToMapToSelect = () => {
    const vehicleTypeId = form.getFieldValue('vehicleTypeId');
    if (!vehicleTypeId) {
      message.warning('Vui lòng chọn loại xe trước khi xem bản đồ.');
      return;
    }
    const currentValues = form.getFieldsValue();
    sessionStorage.setItem('monthly_card_reg_form', JSON.stringify({
      licenseVehicle: currentValues.licenseVehicle || '',
      durationInMonths: currentValues.durationInMonths || 1
    }));
    navigate(`/parking-map?selectForMonthlyCard=true&vehicleTypeId=${vehicleTypeId}`);
  };

  const fetchCardInfo = useCallback(async () => {
    setLoadingCard(true);
    try {
      const response = await api.get('/MonthlyCard/my-card');
      const data = unwrapData(response.data);
      setCardInfo(data?.card ?? data);
    } catch (error) {
      if (error.response?.status !== 404) {
        const status = error.response?.status;
        const fallback = status === 403
          ? 'Bạn không có quyền xem thông tin vé tháng.'
          : 'Không thể tải thông tin vé tháng.';
        message.error(error.response?.data?.message || error.response?.data?.error || fallback);
      }
      setCardInfo(null);
    } finally {
      setLoadingCard(false);
    }
  }, []);

  useEffect(() => {
    fetchCardInfo();
  }, [fetchCardInfo]);

  const handleRegister = async (values) => {
    setSubmitting(true);
    try {
      const response = await api.post('/MonthlyCard/register', {
        tariffId: Number(values.vehicleTypeId),
        durationMonths: Number(values.durationInMonths)
      });
      const paymentUrl = getPaymentUrl(response.data);
      if (paymentUrl) {
        window.location.href = paymentUrl;
        return;
      }
      message.error(response.data?.message || 'Không nhận được URL thanh toán VNPay từ hệ thống.');
    } catch (error) {
      const status = error.response?.status;
      const fallback = status === 403
        ? 'Bạn không có quyền đăng ký vé tháng.'
        : 'Không thể tạo đăng ký vé tháng.';
      message.error(error.response?.data?.message || error.response?.data?.error || fallback);
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
    const ticketCode = getValue(cardInfo, 'ticketCode', 'TicketCode');
    const tariffId = getValue(cardInfo, 'tariffId', 'TariffId');
    const startTime = getValue(cardInfo, 'startDate', 'StartDate', 'startTime', 'StartTime');
    const endTime = getValue(cardInfo, 'endDate', 'EndDate', 'endTime', 'EndTime');
    const status = getValue(cardInfo, 'status', 'Status') || 'Active';

    // Map tariffId sang Tên loại xe & Chi phí thực tế
    const tariffMapping = {
      1: { name: 'Xe đạp (Bicycle)', price: 120000 },
      2: { name: 'Xe máy (Motorbike)', price: 250000 },
      3: { name: 'Ô tô (Car)', price: 1500000 }
    };
    const mappedTariff = tariffMapping[tariffId] || { name: `Gói vé #${tariffId}`, price: 0 };

    const detailCards = [
      {
        icon: <ShieldCheck className="mb-3 text-cyan-200" size={22} />,
        label: 'Loại xe / Gói cước',
        value: mappedTariff.name
      },
      {
        icon: <CalendarDays className="mb-3 text-emerald-200" size={22} />,
        label: 'Ngày bắt đầu',
        value: formatDateTime(startTime)
      },
      {
        icon: <CalendarDays className="mb-3 text-amber-200" size={22} />,
        label: 'Ngày hết hạn',
        value: formatDateTime(endTime)
      },
      {
        icon: <CreditCard className="mb-3 text-pink-200" size={22} />,
        label: 'Chi phí gói',
        value: mappedTariff.price > 0 ? `${mappedTariff.price.toLocaleString('vi-VN')} VND / tháng` : 'Miễn phí'
      }
    ];

    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 text-white shadow-2xl shadow-indigo-950/30">
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-100">
                <ShieldCheck size={15} />
                Vé tháng đỗ xe tự động (Dynamic Pass)
              </div>
              <h1 className="mt-5 text-4xl font-black tracking-tight">{mappedTariff.name}</h1>
              <p className="mt-2 text-sm font-medium text-indigo-100">Thẻ vé tháng đỗ xe thông minh - Cấp chỗ đỗ trống tự động khi quét QR vào cổng.</p>
            </div>
            <Tag color={status === 'Active' || status === 'MonthlyCardActive' ? 'green' : 'default'} className="m-0 w-fit rounded-full px-4 py-1 text-sm font-bold">
              {status === 'MonthlyCardActive' ? 'Đang hoạt động' : status}
            </Tag>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {detailCards.map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-white/10 p-4">
                {item.icon}
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-200">{item.label}</p>
                <p className="mt-1 text-sm font-bold">{item.value}</p>
              </div>
            ))}
          </div>

          {ticketCode && (
            <div className="mt-10 flex flex-col items-center justify-center bg-white/5 border border-white/10 rounded-2xl p-6 max-w-sm mx-auto">
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-200 mb-4 text-center">Mã QR Vé Tháng Của Bạn</p>
              <div className="bg-white p-3 rounded-2xl shadow-lg">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(ticketCode)}`}
                  alt="QR Code"
                  className="w-[180px] h-[180px]"
                />
              </div>
              <p className="mt-4 font-mono font-bold text-lg tracking-widest text-indigo-100">{ticketCode}</p>
              <p className="text-[10px] text-indigo-300/80 mt-1 text-center font-medium">Sử dụng mã QR này quét tại đầu đọc ở cổng vào/ra để đỗ xe</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Card className="rounded-2xl border-slate-100 shadow-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Đăng ký vé tháng</h1>
          <p className="mt-1 text-sm text-slate-500">Chọn loại xe và thời hạn để tạo yêu cầu thanh toán VNPay.</p>
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
