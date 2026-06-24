import React, { useEffect, useState } from 'react';
import { Card, Table, Avatar, Tag, Button } from 'antd';
import { Users, UserPlus, Shield, UserCheck } from 'lucide-react';
import { adminService } from '../services/adminService';

const StaffManagement = () => {
  const [staffMembers, setStaffMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const mapUserToStaff = (user) => ({
    key: user.id || user.Id || user.userId || user.UserId || user.email || user.Email,
    name: user.name || user.Name || user.username || user.Username || 'N/A',
    avatar: user.avatar || user.Avatar || '',
    email: user.email || user.Email || 'N/A',
    role: user.roleName || user.RoleName || user.role || user.Role || 'Staff',
    zone: user.zone || user.Zone || user.assignedZone || user.AssignedZone || 'N/A',
    status: user.status || user.Status || (user.isActive === false || user.IsActive === false ? 'Inactive' : 'Active')
  });

  useEffect(() => {
    const loadStaff = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await adminService.getAllUsers();
        const rawUsers = Array.isArray(response.data) ? response.data : (response.data?.data || response.data?.Data || []);
        const staff = rawUsers
          .filter((user) => String(user.roleName || user.RoleName || user.role || user.Role || '').toLowerCase() === 'staff')
          .map(mapUserToStaff);
        setStaffMembers(staff);
      } catch (err) {
        console.error('loadStaff error:', err);
        setError('Chưa thể tải danh sách nhân viên từ backend.');
        setStaffMembers([]);
      } finally {
        setLoading(false);
      }
    };

    loadStaff();
  }, []);

  const columns = [
    {
      title: 'Attendant Info',
      dataIndex: 'name',
      key: 'name',
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <Avatar src={record.avatar} alt={record.name} className="bg-indigo-950 border border-slate-700" />
          <div>
            <div className="font-bold text-white text-sm">{record.name}</div>
            <div className="text-xs text-slate-400">{record.email}</div>
          </div>
        </div>
      )
    },
    {
      title: 'Security Scope',
      dataIndex: 'role',
      key: 'role',
      render: (text) => (
        <span className="flex items-center gap-1 text-slate-300 text-xs">
          {text === 'Supervisor' ? <Shield size={12} className="text-rose-400"/> : <UserCheck size={12} className="text-indigo-400"/>}
          {text}
        </span>
      )
    },
    {
      title: 'Assigned Patrol Zone',
      dataIndex: 'zone',
      key: 'zone',
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    {
      title: 'Availability',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'Active' ? 'green' : 'orange'}>{status}</Tag>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Staff Management Directory</h1>
          <p className="text-slate-400 text-sm mt-1">Review parking attendants, schedules, and active zones</p>
          {error && <p className="text-rose-400 text-sm mt-2 font-semibold">{error}</p>}
        </div>
        <Button
          type="primary"
          icon={<UserPlus size={16} />}
          className="bg-indigo-600 hover:bg-indigo-500 border-none font-semibold rounded-lg flex items-center justify-center gap-1.5 h-10"
        >
          Add New Attendant
        </Button>
      </div>

      <Card title={<span className="text-base font-bold text-white flex items-center gap-2"><Users size={18}/> Active Attendant Directory</span>} className="shadow-lg border border-slate-800">
        <Table
          columns={columns}
          dataSource={staffMembers}
          loading={loading}
          pagination={false}
          locale={{ emptyText: error ? 'Không có dữ liệu nhân viên để hiển thị.' : 'Chưa có dữ liệu nhân viên.' }}
          className="custom-antd-table"
        />
      </Card>
    </div>
  );
};

export default StaffManagement;
