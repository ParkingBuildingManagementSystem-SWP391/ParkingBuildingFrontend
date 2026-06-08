import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spin } from 'antd';

const RoleProtectedRoute = ({ allowedRoles, children }) => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-indigo-400">
        <Spin size="large" tip="Authenticating..." />
      </div>
    );
  }

  // Redirect to login if user is not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const getRoleId = (roleName) => {
    const r = String(roleName || '').trim().toLowerCase();
    if (r === 'admin') return 1;
    if (r === 'staff') return 2;
    if (r === 'registered_driver' || r === 'driver') return 4;
    if (r === 'manager') return 5;
    if (r === 'customer') return 3;
    return null;
  };

  const userRoleId = user ? Number(user.roleId || getRoleId(role)) : getRoleId(role);

  // Redirect to unauthorized page if user role is not allowed
  if (allowedRoles) {
    const isAllowed = allowedRoles.includes(role) || 
                      (userRoleId !== null && allowedRoles.includes(userRoleId)) ||
                      (role === 'Registered_Driver' && allowedRoles.includes('Driver')) ||
                      (role === 'Driver' && allowedRoles.includes('Registered_Driver'));
                      
    if (!isAllowed) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Return children if specified, otherwise return the Router Outlet for nested layouts
  return children ? children : <Outlet />;
};

export default RoleProtectedRoute;
