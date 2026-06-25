import React, { useEffect, useState } from 'react';
import { Card, Table, Avatar, Tag, Button } from 'antd';
import { Users, UserPlus, Shield, UserCheck } from 'lucide-react';
import { adminService } from '../services/adminService';
import { useTranslation } from 'react-i18next';

const StaffManagement = () => {
  const { t } = useTranslation();
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
        setError(t('staff.errLoadList'));
        setStaffMembers([]);
      } finally {
        setLoading(false);
      }
    };

    loadStaff();
  }, []);

  const columns = [
    {
      title: t('staff.colInfo'),
      dataIndex: 'name',
      key: 'name',
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <Avatar src={record.avatar} alt={record.name} className="bg-indigo-600 text-white border border-slate-200" />
          <div>
            <div className="font-bold text-slate-900 text-sm">{record.name}</div>
            <div className="text-xs text-slate-500">{record.email}</div>
          </div>
        </div>
      )
    },
    {
      title: t('staff.colScope'),
      dataIndex: 'role',
      key: 'role',
      render: (text) => (
        <span className="flex items-center gap-1.5 text-slate-700 text-xs font-medium">
          {text === 'Supervisor' ? <Shield size={12} className="text-rose-500"/> : <UserCheck size={12} className="text-indigo-600"/>}
          {text}
        </span>
      )
    },
    {
      title: t('staff.colZone'),
      dataIndex: 'zone',
      key: 'zone',
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    {
      title: t('staff.colAvailability'),
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'Active' ? 'green' : 'orange'}>{status}</Tag>
      )
    }
  ];

  return (
    <div className="min-h-full bg-slate-50 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{t('staff.pageTitle')}</h1>
          <p className="text-slate-500 text-sm mt-1">{t('staff.pageDesc')}</p>
          {error && <p className="text-rose-500 text-sm mt-2 font-semibold">{error}</p>}
        </div>
        <Button
          type="primary"
          icon={<UserPlus size={16} />}
          className="bg-indigo-600 hover:!bg-indigo-500 border-none font-semibold rounded-xl shadow-sm flex items-center justify-center gap-1.5 h-10"
        >
          {t('staff.btnAdd')}
        </Button>
      </div>

      <Card
        title={
          <span className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Users size={18} className="text-indigo-600"/> {t('staff.tableTitle')}
          </span>
        }
        className="bg-white rounded-2xl border border-slate-100 shadow-sm"
      >
        <Table
          columns={columns}
          dataSource={staffMembers}
          loading={loading}
          pagination={false}
          locale={{ emptyText: error ? t('staff.emptyError') : t('staff.emptyNormal') }}
          className="custom-antd-table"
        />
      </Card>
    </div>
  );
};

export default StaffManagement;
