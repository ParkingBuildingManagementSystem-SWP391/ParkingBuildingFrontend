import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import RoleProtectedRoute from './components/RoleProtectedRoute';
import MainLayout from './components/MainLayout';

// Public Pages
import Login from './pages/Login';
import Unauthorized from './pages/Unauthorized';
import GuestParkingMap from './pages/GuestParkingMap';

// Protected Pages (Admin & Driver Features)
import StaffManagement from './pages/StaffManagement';
import MyBookings from './pages/MyBookings';
import MonthlyPass from './pages/MonthlyPass';
import Settings from './pages/Settings';
import Accounts from './pages/Accounts';

// Feature Components (Dashboard, Parking Map, Check-in counter)
import Dashboard from './features/dashboard/Dashboard';
import ParkingLotMap from './features/parking-map/ParkingLotMap';
import GateController from './features/checkin-checkout/GateController';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public auth pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/map" element={<GuestParkingMap />} />

        {/* Shell wrapping authenticated workspaces */}
        <Route element={<RoleProtectedRoute allowedRoles={['admin', 'staff', 'driver', 'manager']} />}>
          <Route element={<MainLayout />}>
            
            {/* Common dashboard path - content routes adapt to user role */}
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* Shared visual parking map grid */}
            <Route path="/parking-map" element={<ParkingLotMap />} />
            
            {/* Admin-only paths */}
            <Route element={<RoleProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/staff-management" element={<StaffManagement />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/accounts" element={<Accounts />} />
            </Route>

            {/* Staff-only paths */}
            <Route element={<RoleProtectedRoute allowedRoles={['staff', 'manager', 'admin']} />}>
              <Route path="/checkin-checkout" element={<GateController />} />
            </Route>

            {/* Driver/Customer-only paths */}
            <Route element={<RoleProtectedRoute allowedRoles={['driver', 'staff']} />}>
              <Route path="/my-bookings" element={<MyBookings />} />
            </Route>
            <Route element={<RoleProtectedRoute allowedRoles={['driver']} />}>
              <Route path="/monthly-pass" element={<MonthlyPass />} />
            </Route>
            
          </Route>
        </Route>

        {/* Unmatched URL redirects */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
