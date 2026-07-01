export const getRoleLabel = (role, t) => {
  const normalized = String(role || '').trim().toLowerCase().replace(/\s+/g, '_');

  const roleKeyMap = {
    admin: 'roles.admin',
    manager: 'roles.manager',
    staff: 'roles.staff',
    driver: 'roles.driver',
    member: 'roles.member',
    customer: 'roles.customer',
    registered_driver: 'roles.registeredDriver'
  };

  return roleKeyMap[normalized] ? t(roleKeyMap[normalized]) : (role || t('header.userRole'));
};

export const getStatusLabel = (status, t) => {
  const normalized = String(status || '').trim().toLowerCase().replace(/\s+/g, '');

  const statusKeyMap = {
    active: 'status.active',
    monthlycardactive: 'status.active',
    inactive: 'status.inactive',
    pending: 'status.pending',
    expired: 'status.expired',
    available: 'status.available',
    occupied: 'status.occupied',
    reserved: 'status.reserved',
    maintenance: 'status.maintenance',
    canceled: 'status.canceled',
    cancelled: 'status.canceled',
    completed: 'status.completed',
    success: 'status.success',
    paid: 'status.paid'
  };

  return statusKeyMap[normalized] ? t(statusKeyMap[normalized]) : (status || t('status.unknown'));
};

export const getVehicleTypeLabel = (type, t) => {
  const normalized = String(type || '').trim().toLowerCase();

  if (
    normalized.includes('motorbike') ||
    normalized.includes('motor') ||
    normalized.includes('moto') ||
    normalized.includes('xe máy')
  ) {
    return t('vehicleTypes.motorbike');
  }

  if (
    normalized.includes('bike') ||
    normalized.includes('bicycle') ||
    normalized.includes('xe đạp')
  ) {
    return t('vehicleTypes.bicycle');
  }

  if (
    normalized.includes('car') ||
    normalized.includes('ô tô') ||
    normalized.includes('oto')
  ) {
    return t('vehicleTypes.car');
  }

  return type || t('vehicleTypes.unknown');
};
