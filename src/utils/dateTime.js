import i18n from 'i18next';

export const VIETNAM_TIME_ZONE = 'Asia/Ho_Chi_Minh';
export const VIETNAM_TIMEZONE = VIETNAM_TIME_ZONE;
export const VIETNAM_LOCALE = 'vi-VN';

export const getActiveLocale = () => {
  return i18n.language === 'en' ? 'en-US' : 'vi-VN';
};

const dateTimeFormatters = {
  dateTime: {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  },
  date: {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  },
  time: {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  },
  timeWithSeconds: {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  },
  longDate: {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  },
};

export const parseUtcDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const text = String(value).trim();
  if (!text) return null;

  const hasTimezone = /Z$|[+-]\d{2}:\d{2}$/.test(text);
  const normalized = hasTimezone ? text : `${text}+07:00`;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const toDate = parseUtcDate;

const normalizeFormatArgs = (options = {}, fallback = '--') => {
  if (typeof options === 'string') {
    return { options: {}, fallback: options };
  }

  return { options: options || {}, fallback };
};

const formatWith = (value, baseOptions, options = {}, fallback = '--') => {
  const { options: normalizedOptions, fallback: normalizedFallback } = normalizeFormatArgs(options, fallback);
  const date = parseUtcDate(value);
  if (!date) return normalizedFallback;
  const locale = getActiveLocale();
  return new Intl.DateTimeFormat(locale, {
    timeZone: VIETNAM_TIME_ZONE,
    ...baseOptions,
    ...normalizedOptions,
  }).format(date);
};

export const formatDateTimeVN = (value, options = {}, fallback = '--') =>
  formatWith(value, dateTimeFormatters.dateTime, options, fallback);

export const formatDateVN = (value, options = {}, fallback = '--') =>
  formatWith(value, dateTimeFormatters.date, options, fallback);

export const formatTimeVN = (value, options = {}, fallback = '--') =>
  formatWith(value, dateTimeFormatters.time, options, fallback);

export const formatTimeWithSecondsVN = (value, options = {}, fallback = '--') =>
  formatWith(value, dateTimeFormatters.timeWithSeconds, options, fallback);

export const formatLongDateVN = (value = new Date()) =>
  formatWith(value, dateTimeFormatters.longDate, {}, '');

export const getVietnamDateParts = (value = new Date()) => {
  const date = parseUtcDate(value) || new Date();
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: VIETNAM_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);

  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
};

export const getVietnamDateInputValue = (value = new Date()) => {
  const parts = getVietnamDateParts(value);
  return `${parts.year}-${parts.month}-${parts.day}`;
};

export const addDaysToDateInput = (dateInput, days) => {
  const date = new Date(`${dateInput}T00:00:00+07:00`);
  date.setUTCDate(date.getUTCDate() + days);
  return getVietnamDateInputValue(date);
};

export const createVietnamWallTimeIso = ({ hour, minute, baseDate = new Date() }) => {
  const parts = getVietnamDateParts(baseDate);
  const vietnamWallTimeUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(hour) - 7,
    Number(minute),
    0,
    0
  );

  return new Date(vietnamWallTimeUtc).toISOString();
};

export const vietnamDateInputToIso = (dateInput, endOfDay = false) => {
  if (!dateInput) return '';
  const [year, month, day] = dateInput.split('-').map(Number);
  if (!year || !month || !day) return '';

  const hour = endOfDay ? 23 : 0;
  const minute = endOfDay ? 59 : 0;
  const second = endOfDay ? 59 : 0;
  const millisecond = endOfDay ? 999 : 0;

  return new Date(Date.UTC(year, month - 1, day, hour - 7, minute, second, millisecond)).toISOString();
};

export const formatVietnamDate = (value) => formatDateVN(value, 'N/A');
export const formatVietnamTime = (value) => formatTimeVN(value, 'N/A');
export const formatVietnamDateTime = (value) => formatDateTimeVN(value, 'N/A');
export const formatVietnamDateTimeWithSeconds = (value) => {
  const date = parseUtcDate(value);
  if (!date) return 'N/A';
  return new Intl.DateTimeFormat(VIETNAM_LOCALE, {
    timeZone: VIETNAM_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour12: false,
  }).format(date);
};

export const formatVietnamTimeWithSeconds = (value) => formatTimeWithSecondsVN(value, 'N/A');

export const formatIncidentTypeLabel = (rawType, t) => {
  if (!rawType) return t ? t('createIncident.typeOther') : 'Khác';
  const clean = String(rawType).trim();
  const lower = clean.toLowerCase().replace(/[^a-z0-9]/g, '');

  if (lower.includes('platemismatch') || lower.includes('platename') || lower.includes('bienso')) {
    return t ? t('dashboard.incidents.typePlateMismatch') : 'Không khớp biển số';
  }
  if (lower.includes('ticketmismatch') || lower.includes('ticketcode') || lower.includes('mave')) {
    return t ? t('dashboard.incidents.typeTicketMismatch') : 'Không khớp mã vé';
  }
  if (lower.includes('lostticket') || lower.includes('lost') || lower.includes('matthe')) {
    return t ? t('createIncident.typeLostTicket') : 'Mất thẻ giữ xe';
  }
  if (lower.includes('vehicledamage') || lower.includes('damage') || lower.includes('vacham') || lower.includes('huhong')) {
    return t ? t('createIncident.typeVehicleDamage') : 'Xe bị va chạm / Hư hỏng';
  }
  if (lower.includes('equipment') || lower.includes('loithietbi') || lower.includes('malfunction') || lower.includes('failure')) {
    return t ? t('createIncident.typeEquipmentMalfunction') : 'Lỗi thiết bị (Barrier/Camera/Hệ thống)';
  }
  if (lower.includes('other') || lower.includes('khac')) {
    return t ? t('createIncident.typeOther') : 'Khác';
  }

  return clean;
};

/**
 * Auto-corrects unaccented Vietnamese backend messages to proper accented Vietnamese.
 */
export const fixVietnameseAccents = (str) => {
  if (!str || typeof str !== 'string') return str;

  const map = [
    // Booking & Payments
    [/dat cho va thanh toan tien coc ([\d,.]+\s*(?:VND|VNĐ|đ)?) bang vi thanh cong\.?/gi, 'Đặt chỗ và thanh toán tiền cọc $1 bằng ví thành công.'],
    [/dat cho va thanh toan tien coc bang vi thanh cong\.?/gi, 'Đặt chỗ và thanh toán tiền cọc bằng ví thành công.'],
    [/dat cho cho do xe ([a-z0-9-]+) thanh cong\.?/gi, 'Đặt chỗ đỗ xe $1 thành công.'],
    [/dat cho thanh cong\.?/gi, 'Đặt chỗ thành công.'],
    [/thanh toan tien coc thanh cong\.?/gi, 'Thanh toán tiền cọc thành công.'],
    [/nap tien vao vi thanh cong\.?/gi, 'Nạp tiền vào ví thành công.'],
    [/so du vi khong du/gi, 'Số dư ví không đủ.'],
    [/cho do xe da duoc dat/gi, 'Chỗ đỗ xe đã được đặt.'],
    [/cho do xe khong hop le/gi, 'Chỗ đỗ xe không hợp lệ.'],
    [/khong tim thay phien dat cho/gi, 'Không tìm thấy phiên đặt chỗ.'],
    [/khong tim thay/gi, 'Không tìm thấy'],
    [/phien dat cho/gi, 'phiên đặt chỗ'],

    // Checkin / Checkout / Gate
    [/check-in thanh cong/gi, 'Check-in thành công.'],
    [/check-out thanh cong/gi, 'Check-out thành công.'],
    [/xe da trong bai/gi, 'Xe đã trong bãi.'],
    [/xe chua nhap bai/gi, 'Xe chưa nhập bãi.'],
    [/bien so khong trung khop/gi, 'Biển số không trùng khớp.'],
    [/ma ve khong hop le/gi, 'Mã vé không hợp lệ.'],
    [/da mo cong/gi, 'Đã mở cổng.'],
    [/xac nhan thanh toan/gi, 'Xác nhận thanh toán'],

    // User management & incidents
    [/xoa tai khoan thanh cong/gi, 'Xóa tài khoản thành công.'],
    [/tao bao cao su co thanh cong/gi, 'Tạo báo cáo sự cố thành công.'],
    [/giai quyet su co thanh cong/gi, 'Giải quyết sự cố thành công.'],
    [/cap nhat thanh cong/gi, 'Cập nhật thành công.'],
    [/them moi thanh cong/gi, 'Thêm mới thành công.'],
    [/loi he thong/gi, 'Lỗi hệ thống.'],
    [/thao tac thanh cong/gi, 'Thao tác thành công.'],

    // Individual words & phrases fallback
    [/dat cho/gi, 'Đặt chỗ'],
    [/thanh toan/gi, 'thanh toán'],
    [/tien coc/gi, 'tiền cọc'],
    [/bang vi/gi, 'bằng ví'],
    [/thanh cong/gi, 'thành công'],
    [/khong hop le/gi, 'không hợp lệ'],
    [/khong trung khop/gi, 'không trùng khớp'],
    [/bien so/gi, 'biển số'],
    [/ma ve/gi, 'mã vé'],
    [/su co/gi, 'sự cố'],
    [/tai khoan/gi, 'tài khoản'],
  ];

  let result = str;
  for (const [regex, replacement] of map) {
    result = result.replace(regex, replacement);
  }
  return result;
};
