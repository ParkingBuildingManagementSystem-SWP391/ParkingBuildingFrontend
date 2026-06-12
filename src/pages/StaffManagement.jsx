import React from 'react';
import { Card, Table, Avatar, Tag, Button } from 'antd';
import { Users, UserPlus, Shield, UserCheck } from 'lucide-react';
import { PRESET_USERS } from '../services/mockData';

const StaffManagement = () => {
  const staffMembers = [
    {
      key: '1',
      name: 'Sarah Connor',
      avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Sarah',
      email: 'sarah.c@spotflow.com',
      role: 'Staff Attendant',
      shift: 'Day Shift (06:00 AM - 02:00 PM)',
      zone: 'Zone A Ground Level',
      status: 'Active'
    },
    {
      key: '2',
      name: 'Marcus Wright',
      avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Marcus',
      email: 'marcus.w@spotflow.com',
      role: 'Staff Attendant',
      shift: 'Night Shift (02:00 PM - 10:00 PM)',
      zone: 'Zone B Basement 1',
      status: 'On Leave'
    },
    {
      key: '3',
      name: 'John Connor',
      avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=John',
      email: 'john.c@spotflow.com',
      role: 'Supervisor',
      shift: 'Flexible Shift',
      zone: 'All Floors',
      status: 'Active'
    }
  ];

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
          pagination={false}
          className="custom-antd-table"
        />
      </Card>
    </div>
  );
};

export default StaffManagement;
