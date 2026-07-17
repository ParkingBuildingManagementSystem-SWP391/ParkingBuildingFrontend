import {
  CalendarCheck,
  CreditCard,
  Home,
  LayoutDashboard,
  LogOut,
  Map,
  ScanLine,
  Settings,
  Users,
  Wallet
} from 'lucide-react';

export const ROLE_MENU_ROUTES = {
  home: '/',
  profile: '/settings',
  parkingMap: '/parking-map',
  checkinCheckout: '/checkin-checkout',
  myBookings: '/my-bookings',
  myWallet: '/my-wallet',
  myMembership: '/my-membership',
  managerDashboard: '/dashboard',
  adminDashboard: '/dashboard',
  adminAccounts: '/accounts',
  adminParkingSessions: '/admin/parking-sessions'
};

export const normalizeRole = (role) => (
  String(role || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
);

const label = (t, key, fallback) => (
  typeof t === 'function' ? t(key, { defaultValue: fallback }) : fallback
);

export const getRoleMenuItems = ({ role, routes = ROLE_MENU_ROUTES, t, currentPath = '/' }) => {
  const normalizedRole = normalizeRole(role);
  const isHomePage = currentPath === routes.home || currentPath === '/home';

  const commonNavigation = [
    {
      key: 'home',
      label: label(t, 'menu.home', 'Home'),
      path: routes.home,
      icon: Home
    }
  ];

  let roleNavigation = [];

  if (['driver', 'member', 'registered_driver', 'customer'].includes(normalizedRole)) {
    roleNavigation = [
      {
        key: 'parking-map',
        label: label(t, 'menu.parkingMap', 'Parking Map'),
        path: routes.parkingMap,
        icon: Map
      },
      {
        key: 'my-bookings',
        label: label(t, 'menu.myBookings', 'My Bookings'),
        path: routes.myBookings,
        icon: CalendarCheck
      },
      {
        key: 'my-wallet',
        label: label(t, 'sidebar.myWallet', 'Ví của tôi'),
        path: routes.myWallet,
        icon: Wallet
      },
      {
        key: 'my-membership',
        label: label(t, 'menu.memberships', 'Memberships'),
        path: routes.myMembership,
        icon: CreditCard
      }
    ];
  }

  if (normalizedRole === 'staff') {
    roleNavigation = [
      {
        key: 'checkin-checkout',
        label: label(t, 'menu.checkInOut', 'Check-in / Check-out'),
        path: routes.checkinCheckout,
        icon: ScanLine
      },
      {
        key: 'parking-map',
        label: label(t, 'menu.parkingMap', 'Parking Map'),
        path: routes.parkingMap,
        icon: Map
      }
    ];
  }

  if (normalizedRole === 'manager') {
    roleNavigation = [
      isHomePage
        ? {
            key: 'manager-dashboard',
            label: label(t, 'menu.dashboard', 'Dashboard'),
            path: routes.managerDashboard,
            icon: LayoutDashboard
          }
        : {
            key: 'home',
            label: label(t, 'menu.home', 'Home'),
            path: routes.home,
            icon: Home
          }
    ];
  }

  if (normalizedRole === 'admin') {
    roleNavigation = [
      isHomePage
        ? {
            key: 'admin-accounts',
            label: label(t, 'menu.userAccounts', 'User Accounts'),
            path: routes.adminAccounts,
            icon: Users
          }
        : {
            key: 'home',
            label: label(t, 'menu.home', 'Home'),
            path: routes.home,
            icon: Home
          }
    ];
  }

  return {
    navigationItems: [
      ...(normalizedRole === 'admin' || normalizedRole === 'manager' ? [] : commonNavigation),
      ...roleNavigation
    ].filter((item) => Boolean(item.path)),
    accountItems: [
      {
        key: 'profile',
        label: label(t, 'menu.profile', 'Profile'),
        path: routes.profile,
        icon: Settings
      },
      {
        key: 'logout',
        label: label(t, 'menu.logout', 'Logout'),
        danger: true,
        icon: LogOut
      }
    ]
  };
};
