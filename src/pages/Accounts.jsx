import React, { useState, useEffect, useMemo } from 'react';
import { Users, UserCog, X, Search, CheckCircle } from 'lucide-react';

const INITIAL_ACCOUNTS = [
  { id: 1, name: 'Alex Johnson', email: 'admin@spotflow.com', role: 'admin', status: 'Active', joined: '10 Jan 2025' },
  { id: 2, name: 'Robert Vance', email: 'robert.v@spotflow.com', role: 'manager', status: 'Active', joined: '15 Feb 2025' },
  { id: 3, name: 'John Doe', email: 'john.doe@spotflow.com', role: 'manager', status: 'Active', joined: '20 Mar 2025' },
  { id: 4, name: 'Jane Smith', email: 'jane.smith@spotflow.com', role: 'manager', status: 'Inactive', joined: '12 Apr 2025' },
  { id: 5, name: 'Sarah Connor', email: 'sarah.c@spotflow.com', role: 'staff', status: 'Active', joined: '20 Jan 2025' },
  { id: 6, name: 'Michael Scott', email: 'michael.s@spotflow.com', role: 'staff', status: 'Active', joined: '01 May 2025' },
  { id: 7, name: 'Dwight Schrute', email: 'dwight.s@spotflow.com', role: 'staff', status: 'Inactive', joined: '15 May 2025' },
  { id: 8, name: 'David Miller', email: 'david.miller@gmail.com', role: 'driver', status: 'Active', joined: '05 Jan 2026' },
  { id: 9, name: 'Emily Watson', email: 'emily.w@gmail.com', role: 'driver', status: 'Active', joined: '10 Feb 2026' },
  { id: 10, name: 'Tom Hardy', email: 'tom.hardy@gmail.com', role: 'driver', status: 'Active', joined: '15 Mar 2026' },
  { id: 11, name: 'Natalie Portman', email: 'natalie.p@gmail.com', role: 'driver', status: 'Inactive', joined: '20 Apr 2026' },
  { id: 12, name: 'Chris Evans', email: 'chris.evans@gmail.com', role: 'driver', status: 'Active', joined: '01 May 2026' }
];

const Accounts = () => {
  const [accounts, setAccounts] = useState(() => {
    const saved = localStorage.getItem('spotflow_accounts_list');
    return saved ? JSON.parse(saved) : INITIAL_ACCOUNTS;
  });

  useEffect(() => {
    localStorage.setItem('spotflow_accounts_list', JSON.stringify(accounts));
  }, [accounts]);

  // Table Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [statusFilter, setStatusFilter] = useState('All Statuses');

  // Change Role Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedNewRole, setSelectedNewRole] = useState('driver');
  const [alertMessage, setAlertMessage] = useState(null);

  // Dynamic Date subtitle
  const getFormattedDate = () => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date('2026-05-29T23:09:16+07:00').toLocaleDateString('en-US', options);
  };

  // Helper mapping role tags for readable view
  const displayRole = (role) => {
    if (role === 'driver') return 'Driver';
    if (role === 'admin') return 'Admin';
    if (role === 'manager') return 'Manager';
    if (role === 'staff') return 'Staff';
    return role;
  };

  // Get Initials from Name for circular avatar
  const getInitials = (name) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  // Assign background color to avatar
  const getAvatarBg = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-blue-100 text-blue-600';
      case 'manager':
        return 'bg-orange-100 text-orange-600';
      case 'staff':
        return 'bg-teal-100 text-teal-600';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  // Dynamic Role summary counters
  const adminCount = useMemo(() => accounts.filter((u) => u.role === 'admin').length, [accounts]);
  const managerCount = useMemo(() => accounts.filter((u) => u.role === 'manager').length, [accounts]);
  const staffCount = useMemo(() => accounts.filter((u) => u.role === 'staff').length, [accounts]);
  const userCount = useMemo(() => accounts.filter((u) => u.role === 'driver').length, [accounts]);

  // Multi-conditional memoized filtration logic
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      // 1. Text Search matching Name or Email
      const matchesSearch =
        acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        acc.email.toLowerCase().includes(searchQuery.toLowerCase());

      // 2. Role Filter matching
      let matchesRole = true;
      if (roleFilter !== 'All Roles') {
        const queryRole = roleFilter === 'Driver' ? 'driver' : roleFilter.toLowerCase();
        matchesRole = acc.role === queryRole;
      }

      // 3. Status Filter matching
      let matchesStatus = true;
      if (statusFilter !== 'All Statuses') {
        matchesStatus = acc.status === statusFilter;
      }

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [accounts, searchQuery, roleFilter, statusFilter]);

  // Open Modal logic
  const openModal = (user) => {
    setSelectedUser(user);
    setSelectedNewRole(user.role);
    setIsModalOpen(true);
  };

  // Close Modal logic
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  // Save changes callback
  const handleSaveChanges = () => {
    if (!selectedUser) return;

    setAccounts((prevAccounts) =>
      prevAccounts.map((acc) =>
        acc.id === selectedUser.id ? { ...acc, role: selectedNewRole } : acc
      )
    );

    // Notify user
    setAlertMessage(`Successfully modified permissions for ${selectedUser.name}!`);
    setTimeout(() => {
      setAlertMessage(null);
    }, 3500);

    closeModal();
  };

  return (
    <div className="space-y-6 select-none font-sans pb-12">
      {/* Floating Success Alert Toast */}
      {alertMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-emerald-600 text-white font-semibold text-sm px-6 py-3 rounded-xl shadow-xl z-50 flex items-center gap-2 border border-emerald-500 animate-bounce">
          <CheckCircle size={18} />
          <span>{alertMessage}</span>
        </div>
      )}

      {/* A. Header Section */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-[#1A62FF]/10 text-[#1A62FF] rounded-2xl shadow-sm">
          <Users size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Account Management</h1>
          <p className="text-sm text-slate-500 mt-1">{getFormattedDate()}</p>
        </div>
      </div>

      {/* B. Summary Stat Cards Row (4 Columns Layout) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Admins Card */}
        <div className="bg-white p-5 rounded-2xl border-l-4 border-[#1A62FF] border-y border-r border-slate-100 shadow-sm flex flex-col justify-between min-h-[100px]">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Admins</span>
          <span className="text-2xl font-bold text-slate-800 mt-2">{adminCount} Admins</span>
        </div>

        {/* Managers Card */}
        <div className="bg-white p-5 rounded-2xl border-l-4 border-[#FFC107] border-y border-r border-slate-100 shadow-sm flex flex-col justify-between min-h-[100px]">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Managers</span>
          <span className="text-2xl font-bold text-slate-800 mt-2">{managerCount} Managers</span>
        </div>

        {/* Staff Card */}
        <div className="bg-white p-5 rounded-2xl border-l-4 border-[#00C853] border-y border-r border-slate-100 shadow-sm flex flex-col justify-between min-h-[100px]">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Staff</span>
          <span className="text-2xl font-bold text-slate-800 mt-2">{staffCount} Staff</span>
        </div>

        {/* Drivers Card */}
        <div className="bg-white p-5 rounded-2xl border-l-4 border-slate-400 border-y border-r border-slate-100 shadow-sm flex flex-col justify-between min-h-[100px]">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Drivers</span>
          <span className="text-2xl font-bold text-slate-800 mt-2">{userCount} Drivers</span>
        </div>
      </div>

      {/* C. "All Accounts" Table Container */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        
        {/* Table Header Section with Title & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-850 text-slate-800">All Accounts</h2>
            <p className="text-xs text-slate-400 mt-0.5">Manage permissions and view status details</p>
          </div>

          {/* Filtering controls stacked side-by-side */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Text Search Input */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 w-56 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-[#1A62FF] focus:bg-white transition-all font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Custom Roles select dropdown */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-650 focus:outline-none focus:border-[#1A62FF] focus:bg-white font-medium cursor-pointer transition-all"
            >
              <option value="All Roles">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="Manager">Manager</option>
              <option value="Staff">Staff</option>
              <option value="Driver">Driver</option>
            </select>

            {/* Custom Statuses select dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-655 text-slate-600 focus:outline-none focus:border-[#1A62FF] focus:bg-white font-medium cursor-pointer transition-all"
            >
              <option value="All Statuses">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-3">#</th>
                <th className="py-4 px-4">Name / Email</th>
                <th className="py-4 px-4">Current Role</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-4">Joined</th>
                <th className="py-4 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 font-medium">
                    No accounts found matching the search criteria.
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((item, index) => {
                  const initials = getInitials(item.name);
                  const isSystemAdmin = item.role === 'admin';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/40 transition-colors group">
                      {/* # Column */}
                      <td className="py-4 px-3 text-slate-400 font-mono">{index + 1}</td>

                      {/* Name / Email Column */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          {/* Circular initial avatar */}
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm shrink-0 ${getAvatarBg(item.role)}`}>
                            {initials}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-slate-805 text-slate-800 font-semibold group-hover:text-slate-900 transition-colors">{item.name}</span>
                            <span className="text-xs text-slate-400">{item.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Current Role badge column */}
                      <td className="py-4 px-4">
                        {item.role === 'admin' && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                            Admin
                          </span>
                        )}
                        {item.role === 'manager' && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100">
                            Manager
                          </span>
                        )}
                        {item.role === 'staff' && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            Staff
                          </span>
                        )}
                        {item.role === 'driver' && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            Driver
                          </span>
                        )}
                      </td>

                      {/* Status Column */}
                      <td className="py-4 px-4 font-medium">
                        {item.status === 'Active' ? (
                          <span className="flex items-center gap-1.5 text-emerald-600 font-semibold text-sm">
                            <span className="w-2 h-2 rounded-full bg-[#00C853] inline-block animate-pulse"></span>
                            Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-rose-500 font-semibold text-sm">
                            <span className="w-2 h-2 rounded-full bg-[#FF1744] inline-block"></span>
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* Joined Date Column */}
                      <td className="py-4 px-4 text-slate-500 font-medium">{item.joined}</td>

                      {/* Actions Column */}
                      <td className="py-4 px-4 text-right">
                        {isSystemAdmin ? (
                          <button
                            disabled
                            className="bg-slate-50 text-slate-400 px-4 py-2 rounded-xl text-sm font-medium cursor-not-allowed border border-slate-100"
                          >
                            Change Role
                          </button>
                        ) : (
                          <button
                            onClick={() => openModal(item)}
                            className="bg-blue-50 text-[#1A62FF] hover:bg-[#1A62FF] hover:text-white px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border border-blue-100/10 shadow-sm"
                          >
                            Change Role
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* D. "Change Role" Interactive Modal Overlay */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <UserCog className="text-[#1A62FF]" size={20} />
                <h3 className="text-lg font-bold text-slate-800">Modify User Permissions</h3>
              </div>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-50 rounded-xl transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="py-6 space-y-4">
              
              {/* Account Info Nudge */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${getAvatarBg(selectedUser.role)}`}>
                  {getInitials(selectedUser.name)}
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-slate-800 text-sm">{selectedUser.name}</span>
                  <span className="text-[11px] text-slate-400">{selectedUser.email}</span>
                </div>
              </div>

              {/* Live Preview Nudge */}
              <div className="bg-[#1A62FF]/5 border border-[#1A62FF]/10 rounded-2xl p-4">
                <span className="text-[10px] text-[#1A62FF] font-extrabold uppercase tracking-wider block">Live Mutation Preview</span>
                <p className="text-sm font-semibold text-slate-700 mt-1.5 flex items-center gap-2">
                  <span>Role:</span>
                  <span className="text-slate-400 line-through">{displayRole(selectedUser.role)}</span>
                  <span className="text-[#1A62FF] font-bold">&rarr;</span>
                  <span className="text-indigo-650 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100 font-bold">{displayRole(selectedNewRole)}</span>
                </p>
              </div>

              {/* Role Dropdown Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-555 text-slate-500 uppercase tracking-wide block">Select New Role</label>
                <select
                  value={selectedNewRole}
                  onChange={(e) => setSelectedNewRole(e.target.value)}
                  className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-medium text-slate-700 focus:outline-none focus:border-[#1A62FF] focus:ring-1 focus:ring-[#1A62FF] transition-all cursor-pointer"
                >
                  <option value="manager">Manager</option>
                  <option value="staff">Staff</option>
                  <option value="driver">Driver</option>
                </select>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                onClick={closeModal}
                className="px-4 py-2.5 border border-slate-200 text-slate-600 font-medium rounded-xl text-sm hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveChanges}
                className="px-5 py-2.5 bg-[#1A62FF] hover:bg-blue-700 text-white font-medium rounded-xl text-sm shadow-md hover:shadow-blue-500/10 transition-all duration-200"
              >
                Save Changes
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Accounts;
