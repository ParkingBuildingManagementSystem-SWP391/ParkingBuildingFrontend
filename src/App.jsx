import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import RoleProtectedRoute from './components/RoleProtectedRoute';
import MainLayout from './components/MainLayout';
import { ToastProvider } from './components/ToastProvider';

// Public Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Unauthorized from './pages/Unauthorized';
import PaymentSuccess from './pages/PaymentSuccess';
import ForgotPassword from './pages/ForgotPassword';
import Home from './pages/Home';

// Protected Pages (Admin & Driver Features)
import Introduction from './pages/Introduction';
import StaffManagement from './pages/StaffManagement';
import MyBookings from './pages/MyBookings';
import Settings from './pages/Settings';
import Accounts from './pages/Accounts';
import CreateAccount from './pages/CreateAccount';
import ParkingSessionManager from './pages/ParkingSessionManager';
import MyMonthlyCard from './pages/MyMonthlyCard';
import MonthlyCardManager from './pages/MonthlyCardManager';

// Feature Components (Dashboard, Parking Map, Check-in counter)
import Dashboard, {
  LiveStatusPage,
  IncidentsPage,
  AnalyticsPage,
  SlotManagementPage,
  PricingPage,
  StaffLogsPage
} from './features/dashboard/Dashboard';
import ParkingLotMap from './features/parking-map/ParkingLotMap';
import GateController from './features/checkin-checkout/GateController';

const MonthlyCardsRoute = () => {
  const { role } = useAuth();
  const normalizedRole = String(role || '').toLowerCase();

  if (normalizedRole === 'manager') {
    return <MonthlyCardManager />;
  }

  return <MyMonthlyCard />;
};

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          {/* Public auth pages */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />

        {/* MainLayout wrapping for both public and protected routes */}
        <Route element={<MainLayout />}>
          {/* Public parking map */}
          <Route path="/parking-map" element={<ParkingLotMap />} />
          <Route path="/about" element={<Introduction />} />
          <Route path="/pricing" element={<PricingPage />} />

          {/* ĐUST SỬA: Đổi tên roles thành viết hoa chữ cái đầu cho khớp chuẩn với Database của bạn */}
          {/* Shell wrapping authenticated workspaces */}
          <Route element={<RoleProtectedRoute allowedRoles={['Admin', 'Staff', 'Driver', 'Manager', 'Member', 'Registered_Driver', 'Customer']} />}>
            
            {/* Common dashboard path - content routes adapt to user role */}
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* My Account Settings (accessible by all authenticated roles) */}
            <Route path="/settings" element={<Settings />} />
            
            {/* Admin-only paths */}
            <Route element={<RoleProtectedRoute allowedRoles={['Admin']} />}>
              <Route path="/staff-management" element={<StaffManagement />} />
              <Route path="/accounts" element={<Accounts />} />
              <Route path="/create-account" element={<CreateAccount />} />
            </Route>

            {/* Admin parking session management */}
            <Route element={<RoleProtectedRoute allowedRoles={['Admin']} />}>
              <Route path="/admin/parking-sessions" element={<ParkingSessionManager />} />
            </Route>

            {/* Manager dashboard feature pages */}
            <Route element={<RoleProtectedRoute allowedRoles={['Manager']} />}>
              <Route path="/live-status" element={<LiveStatusPage />} />
              <Route path="/incidents" element={<IncidentsPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/slot-management" element={<SlotManagementPage />} />
              <Route path="/staff-logs" element={<StaffLogsPage />} />
            </Route>

            {/* Monthly card route adapts to Manager vs Registered Driver */}
            <Route element={<RoleProtectedRoute allowedRoles={['Manager', 'Registered_Driver']} />}>
              <Route path="/dashboard/monthly-cards" element={<MonthlyCardsRoute />} />
            </Route>

            {/* Staff/Manager operations paths */}
            <Route element={<RoleProtectedRoute allowedRoles={['Staff', 'Manager']} />}>
              <Route path="/checkin-checkout" element={<GateController />} />
            </Route>

            {/* Driver/Customer-only paths */}
            <Route element={<RoleProtectedRoute allowedRoles={['Driver', 'Member', 'Registered_Driver', 'Customer']} />}>
              <Route path="/my-bookings" element={<MyBookings />} />
            </Route>

            {/* Registered driver monthly card */}
            <Route element={<RoleProtectedRoute allowedRoles={['Registered_Driver']} />}>
              <Route path="/my-monthly-card" element={<MyMonthlyCard />} />
            </Route>
            
          </Route>
        </Route>

        {/* Unmatched URL redirects */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
