import {
  CalendarCheck,
  CarFront,
  CreditCard,
  Home,
  LayoutDashboard,
  LogOut,
  Map,
  ScanLine,
  Settings,
  Shield
} from 'lucide-react';

export const ROLE_MENU_ROUTES = {
  home: '/',
  profile: '/settings',
  parkingMap: '/parking-map',
  checkinCheckout: '/checkin-checkout',
  myBookings: '/my-bookings',
  monthlyCard: '/my-monthly-card',
  managerDashboard: '/dashboard',
  adminDashboard: '/dashboard',
  adminParkingSessions: '/admin/parking-sessions'
};

export const normalizeRole = (role) => (
  String(role || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
);

export const getRoleMenuItems = ({ role, routes = ROLE_MENU_ROUTES }) => {
  const normalizedRole = normalizeRole(role);

  const commonNavigation = [
    {
      key: 'home',
      label: 'Trang chủ',
      path: routes.home,
      icon: Home
    }
  ];

  let roleNavigation = [];

  if (normalizedRole === 'driver' || normalizedRole === 'registered_driver') {
    roleNavigation = [
      {
        key: 'parking-map',
        label: 'Bản đồ bãi đỗ',
        path: routes.parkingMap,
        icon: Map
      },
      {
        key: 'my-bookings',
        label: 'Lịch đặt chỗ của tôi',
        path: routes.myBookings,
        icon: CalendarCheck
      },
      {
        key: 'monthly-card',
        label: 'Vé tháng',
        path: routes.monthlyCard,
        icon: CreditCard
      }
    ];
  }

  if (normalizedRole === 'staff') {
    roleNavigation = [
      {
        key: 'checkin-checkout',
        label: 'Check-in / Check-out',
        path: routes.checkinCheckout,
        icon: ScanLine
      },
      {
        key: 'parking-map',
        label: 'Bản đồ bãi đỗ',
        path: routes.parkingMap,
        icon: Map
      }
    ];
  }

  if (normalizedRole === 'manager') {
    roleNavigation = [
      {
        key: 'manager-dashboard',
        label: 'Dashboard quản lý',
        path: routes.managerDashboard,
        icon: LayoutDashboard
      },
      {
        key: 'parking-map',
        label: 'Bản đồ bãi đỗ',
        path: routes.parkingMap,
        icon: Map
      }
    ];
  }

  if (normalizedRole === 'admin') {
    roleNavigation = [
      {
        key: 'admin-dashboard',
        label: 'Trang quản trị',
        path: routes.adminDashboard,
        icon: Shield
      },
      {
        key: 'admin-parking-sessions',
        label: 'Quản lý phiên đỗ xe',
        path: routes.adminParkingSessions,
        icon: CarFront
      },
      {
        key: 'parking-map',
        label: 'Bản đồ bãi đỗ',
        path: routes.parkingMap,
        icon: Map
      }
    ];
  }

  return {
    navigationItems: [...commonNavigation, ...roleNavigation].filter((item) => Boolean(item.path)),
    accountItems: [
      {
        key: 'profile',
        label: 'Trang cá nhân',
        path: routes.profile,
        icon: Settings
      },
      {
        key: 'logout',
        label: 'Đăng xuất',
        danger: true,
        icon: LogOut
      }
    ]
  };
};
