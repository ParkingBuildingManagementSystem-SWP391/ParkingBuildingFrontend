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
  const normalized = hasTimezone ? text : `${text}Z`;
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
