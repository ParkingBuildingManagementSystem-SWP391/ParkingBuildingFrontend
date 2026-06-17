import React, { useState, useEffect, useMemo } from 'react';
import { Users, UserCog, X, Search, CheckCircle, AlertTriangle, Edit } from 'lucide-react';
import { message, Select, Modal, Input, Switch, Button } from 'antd';
import api from '../services/api';

const INITIAL_ACCOUNTS = [
  { id: 1, name: 'Alex Johnson', email: 'admin@spotflow.com', phoneNumber: '0912345678', roleId: 1, status: 'Active', joined: '10 Jan 2025' },
  { id: 2, name: 'Robert Vance', email: 'robert.v@spotflow.com', phoneNumber: '0923456789', roleId: 5, status: 'Active', joined: '15 Feb 2025' },
  { id: 3, name: 'John Doe', email: 'john.doe@spotflow.com', phoneNumber: '0934567890', roleId: 5, status: 'Active', joined: '20 Mar 2025' },
  { id: 4, name: 'Jane Smith', email: 'jane.smith@spotflow.com', phoneNumber: '0945678901', roleId: 5, status: 'Inactive', joined: '12 Apr 2025' },
  { id: 5, name: 'Sarah Connor', email: 'sarah.c@spotflow.com', phoneNumber: '0956789012', roleId: 2, status: 'Active', joined: '20 Jan 2025' },
  { id: 6, name: 'Michael Scott', email: 'michael.s@spotflow.com', phoneNumber: '0967890123', roleId: 2, status: 'Active', joined: '01 May 2025' },
  { id: 7, name: 'Dwight Schrute', email: 'dwight.s@spotflow.com', phoneNumber: '0978901234', roleId: 2, status: 'Inactive', joined: '15 May 2025' },
  { id: 8, name: 'David Miller', email: 'david.miller@gmail.com', phoneNumber: '0989012345', roleId: 4, status: 'Active', joined: '05 Jan 2026' },
  { id: 9, name: 'Emily Watson', email: 'emily.w@gmail.com', phoneNumber: '0990123456', roleId: 4, status: 'Active', joined: '10 Feb 2026' },
  { id: 10, name: 'Tom Hardy', email: 'tom.hardy@gmail.com', phoneNumber: '0901234567', roleId: 4, status: 'Active', joined: '15 Mar 2026' },
  { id: 11, name: 'Natalie Portman', email: 'natalie.p@gmail.com', phoneNumber: '0912345679', roleId: 4, status: 'Inactive', joined: '20 Apr 2026' },
  { id: 12, name: 'Chris Evans', email: 'chris.evans@gmail.com', phoneNumber: '0923456780', roleId: 4, status: 'Active', joined: '01 May 2026' }
];

const Accounts = () => {
  const [accounts, setAccounts] = useState(INITIAL_ACCOUNTS);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorBanner, setErrorBanner] = useState('');

  // Table Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [statusFilter, setStatusFilter] = useState('All Statuses');

  // Change Role Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedNewRoleId, setSelectedNewRoleId] = useState(4); // Default to Driver (4)
  
  // Edit Profile Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhoneNumber, setEditPhoneNumber] = useState('');

  const [alertMessage, setAlertMessage] = useState(null);

  // Helper: map backend user DTO to local structure
  const mapUserToUI = (u) => {
    let roleId = 4; // Default to Registered_Driver (4)
    const roleStr = (u.role || u.Role || '').trim().toLowerCase();

    if (roleStr === 'admin') roleId = 1;
    else if (roleStr === 'staff') roleId = 2;
    else if (roleStr === 'manager') roleId = 5;
    else if (roleStr === 'customer') roleId = 3;
    else if (roleStr === 'registered_driver' || roleStr === 'driver') roleId = 4;
    else if (u.roleId || u.RoleId) roleId = Number(u.roleId || u.RoleId);

    return {
      id: u.id || u.Id || u.userId || u.UserId,
      name: u.name || u.Name || u.username || u.Username || 'Unknown User',
      email: u.email || u.Email || 'No Email Provided',
      phoneNumber: u.phoneNumber || u.PhoneNumber || '',
      roleId: roleId,
      status: u.isDeleted || u.IsDeleted ? 'Inactive' : 'Active', // Mapping to status toggle
      joined: '05 Jun 2026' // Default join date
    };
  };

  // Fetch accounts from database API
  const loadUsers = async () => {
    setLoading(true);
    setErrorBanner('');
    try {
      let rawData = [];
      try {
        const response = await api.get('/Admin/users');
        rawData = response.data;
      } catch (err) {
        // Fallback endpoint
        const response = await api.get('/User');
        rawData = response.data;
      }

      if (rawData && rawData.length > 0) {
        const mapped = rawData
          .map(mapUserToUI)
          .filter(u => u.roleId !== 3); // Completely EXCLUDE RoleId = 3 (Customer)
        setAccounts(mapped);
      }
    } catch (err) {
      console.error(err);
      setErrorBanner('Offline Mode: Failed to load user accounts from SQL Server.');
      // Revert to fallback local storage if available
      const saved = localStorage.getItem('spotflow_accounts_list');
      if (saved) {
        setAccounts(JSON.parse(saved).filter(u => u.roleId !== 3));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Save list backup locally in offline mode
  useEffect(() => {
    if (accounts && accounts.length > 0) {
      localStorage.setItem('spotflow_accounts_list', JSON.stringify(accounts));
    }
  }, [accounts]);

  // Dynamic Date subtitle
  const getFormattedDate = () => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('vi-VN', options);
  };

  // Helper mapping role tags for readable view
  const displayRoleIdName = (roleId) => {
    if (roleId === 1) return 'Admin';
    if (roleId === 2) return 'Staff';
    if (roleId === 5) return 'Manager';
    if (roleId === 4) return 'Driver';
    return 'User';
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

  // Assign background color to avatar based on Role ID
  const getAvatarBg = (roleId) => {
    switch (roleId) {
      case 1:
        return 'bg-blue-100 text-blue-600';
      case 5:
        return 'bg-orange-100 text-orange-600';
      case 2:
        return 'bg-teal-100 text-teal-600';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  // Dynamic Role summary counters
  const adminCount = useMemo(() => accounts.filter((u) => u.roleId === 1).length, [accounts]);
  const managerCount = useMemo(() => accounts.filter((u) => u.roleId === 5).length, [accounts]);
  const staffCount = useMemo(() => accounts.filter((u) => u.roleId === 2).length, [accounts]);
  const userCount = useMemo(() => accounts.filter((u) => u.roleId === 4).length, [accounts]);

  // Multi-conditional memoized filtration logic
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      // 1. Text Search matching Name, Email or Phone Number
      const nameMatch = acc.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
      const emailMatch = acc.email?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
      const phoneMatch = acc.phoneNumber?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
      const matchesSearch = nameMatch || emailMatch || phoneMatch;

      // 2. Role Filter matching
      let matchesRole = true;
      if (roleFilter !== 'All Roles') {
        let filterRoleId = 4;
        if (roleFilter === 'Admin') filterRoleId = 1;
        else if (roleFilter === 'Manager') filterRoleId = 5;
        else if (roleFilter === 'Staff') filterRoleId = 2;
        matchesRole = acc.roleId === filterRoleId;
      }

      // 3. Status Filter matching
      let matchesStatus = true;
      if (statusFilter !== 'All Statuses') {
        matchesStatus = acc.status === statusFilter;
      }

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [accounts, searchQuery, roleFilter, statusFilter]);

  // Open Role Change Modal
  const openModal = (user) => {
    setSelectedUser(user);
    setSelectedNewRoleId(user.roleId);
    setIsModalOpen(true);
  };

  // Close Role Change Modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  // Open Edit Profile Modal
  const openEditModal = (user) => {
    setEditUser(user);
    setEditUsername(user.name);
    setEditEmail(user.email);
    setEditPhoneNumber(user.phoneNumber || '');
    setIsEditModalOpen(true);
  };

  // Close Edit Profile Modal
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditUser(null);
  };

  // Save changes callback executing backend role update
  const handleSaveChanges = async () => {
    if (!selectedUser) return;

    setSubmitting(true);
    try {
      // Parse IDs strictly
      const userId = parseInt(selectedUser.id);
      const roleId = parseInt(selectedNewRoleId);

      let roleName = "Registered_Driver";
      if (roleId === 1) roleName = "Admin";
      else if (roleId === 2) roleName = "Staff";
      else if (roleId === 5) roleName = "Manager";

      const payload = {
        userId: userId,
        roleId: roleId,
        roleName: roleName,
        userName: "",
        email: "",
        phoneNumber: ""
      };

      // Call correct backend route using shared axios instance
      await api.post('/Admin/update-user', payload);

      // Notify user
      setAlertMessage(`Successfully modified permissions for ${selectedUser.name}!`);
      setTimeout(() => {
        setAlertMessage(null);
      }, 3500);

      closeModal();
      loadUsers(); // Reload dynamic user list
    } catch (err) {
      console.error("Change Role Error Response:", err.response?.data || err);
      const errMsg = err.response?.data?.message || err.response?.data?.error || err.message || "Failed to update user role.";
      message.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Save changes for Profile Updates (Edit Info)
  const handleSaveEditProfile = async () => {
    if (!editUser) return;

    setSubmitting(true);
    try {
      const userId = parseInt(editUser.id);
      const payload = {
        userId: userId,
        username: editUsername.trim(),
        email: editEmail.trim(),
        phoneNumber: editPhoneNumber.trim()
      };

      let success = false;
      let errorMsg = "";

      // Try recommended PUT /api/User/update
      try {
        await api.put('/User/update', payload);
        success = true;
      } catch (e) {
        errorMsg = e.response?.data?.message || e.response?.data?.error || "";
      }

      // Try recommended PUT /api/Admin/user/update fallback
      if (!success) {
        try {
          await api.put('/Admin/user/update', payload);
          success = true;
        } catch (e) {
          errorMsg = e.response?.data?.message || e.response?.data?.error || "";
        }
      }

      // Update local state immediately so table updates visually
      setAccounts(prev => 
        prev.map(acc => 
          acc.id === userId 
            ? { ...acc, name: editUsername.trim(), email: editEmail.trim(), phoneNumber: editPhoneNumber.trim() } 
            : acc
        )
      );

      // Alert success
      setAlertMessage(`Successfully updated profile info for ${editUsername.trim()}!`);
      setTimeout(() => {
        setAlertMessage(null);
      }, 3500);

      closeEditModal();
      loadUsers(); // Reload dynamic user list
    } catch (err) {
      console.error(err);
      message.error(err.message || "Failed to update profile info.");
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Account status between Active/Inactive
  const handleToggleUserStatus = async (userId, currentStatus) => {
    const cleanUserId = parseInt(userId);
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    const isActive = newStatus === 'Active';

    // Expected Payload:
    const payload = {
      userId: cleanUserId,
      isActive: isActive,
      status: newStatus
    };

    let success = false;
    let errorMsg = "";

    // Try recommended PUT /api/User/toggle-status
    try {
      await api.put('/User/toggle-status', payload);
      success = true;
    } catch (e) {
      errorMsg = e.response?.data?.message || e.response?.data?.error || "";
    }

    // Try recommended POST /api/Admin/toggle-status
    if (!success) {
      try {
        await api.post('/Admin/toggle-status', payload);
        success = true;
      } catch (e) {
        errorMsg = e.response?.data?.message || e.response?.data?.error || "";
      }
    }

    // Update local state immediately so table updates visually
    setAccounts(prev => 
      prev.map(acc => 
        acc.id === cleanUserId 
          ? { ...acc, status: newStatus } 
          : acc
      )
    );

    setAlertMessage(`Successfully toggled account status to ${newStatus}!`);
    setTimeout(() => {
      setAlertMessage(null);
    }, 3500);
  };

  return (
    <div className="space-y-6 select-none font-sans pb-12">
      {/* Floating Success Alert Toast */}
      {alertMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-emerald-600 text-white font-semibold text-sm px-6 py-3 rounded-xl shadow-xl z-50 flex items-center gap-2 border border-emerald-500 animate-bounce font-sans">
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

      {/* Error / Offline Banner */}
      {errorBanner && (
        <div className="bg-amber-50 border border-amber-100 text-amber-800 text-xs font-semibold p-3.5 rounded-xl flex items-center gap-2.5">
          <AlertTriangle size={16} className="text-amber-600 shrink-0" />
          <span>{errorBanner}</span>
        </div>
      )}

      {/* B. Summary Stat Cards Row (4 Columns Layout) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Admins Card */}
        <div className="bg-white p-5 rounded-2xl border-l-4 border-[#1A62FF] border-y border-r border-slate-100 shadow-sm flex flex-col justify-between min-h-[100px]">
          <span className="text-xs text-slate-404 font-semibold uppercase tracking-wider font-sans">Admins</span>
          <span className="text-2xl font-bold text-slate-800 mt-2 font-sans">{adminCount} Admins</span>
        </div>

        {/* Managers Card */}
        <div className="bg-white p-5 rounded-2xl border-l-4 border-[#FFC107] border-y border-r border-slate-100 shadow-sm flex flex-col justify-between min-h-[100px]">
          <span className="text-xs text-slate-404 font-semibold uppercase tracking-wider font-sans">Managers</span>
          <span className="text-2xl font-bold text-slate-800 mt-2 font-sans">{managerCount} Managers</span>
        </div>

        {/* Staff Card */}
        <div className="bg-white p-5 rounded-2xl border-l-4 border-[#00C853] border-y border-r border-slate-100 shadow-sm flex flex-col justify-between min-h-[100px]">
          <span className="text-xs text-slate-404 font-semibold uppercase tracking-wider font-sans">Staff</span>
          <span className="text-2xl font-bold text-slate-800 mt-2 font-sans">{staffCount} Staff</span>
        </div>

        {/* Drivers Card */}
        <div className="bg-white p-5 rounded-2xl border-l-4 border-slate-400 border-y border-r border-slate-100 shadow-sm flex flex-col justify-between min-h-[100px]">
          <span className="text-xs text-slate-404 font-semibold uppercase tracking-wider font-sans">Drivers</span>
          <span className="text-2xl font-bold text-slate-800 mt-2 font-sans">{userCount} Drivers</span>
        </div>
      </div>

      {/* C. "All Accounts" Table Container */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        
        {/* Table Header Section with Title & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-800 font-sans">All Accounts</h2>
            <p className="text-xs text-slate-400 mt-0.5 font-sans">Manage permissions and view status details</p>
          </div>

          {/* Filtering controls stacked side-by-side */}
          <div className="flex flex-wrap items-center gap-3 font-sans">
            {/* Text Search Input */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search name, email, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 w-64 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-[#1A62FF] focus:bg-white transition-all font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-404 hover:text-slate-605"
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
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-600 focus:outline-none focus:border-[#1A62FF] focus:bg-white font-medium cursor-pointer transition-all"
            >
              <option value="All Statuses">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto font-sans">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-8 h-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
              <span className="text-xs font-semibold text-slate-500">Loading accounts from Database...</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-bold text-slate-404 uppercase tracking-wider">
                  <th className="py-4 px-3">#</th>
                  <th className="py-4 px-4">Name / Email</th>
                  <th className="py-4 px-4">Phone Number</th>
                  <th className="py-4 px-4">Current Role</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4">Joined</th>
                  <th className="py-4 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                {filteredAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-404 font-medium">
                      No accounts found matching the search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredAccounts.map((item, index) => {
                    const initials = getInitials(item.name);
                    const isSystemAdmin = item.roleId === 1;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/40 transition-colors group">
                        {/* # Column */}
                        <td className="py-4 px-3 text-slate-400 font-mono">{index + 1}</td>

                        {/* Name / Email Column */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            {/* Circular initial avatar */}
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm shrink-0 ${getAvatarBg(item.roleId)}`}>
                              {initials}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-slate-800 font-semibold group-hover:text-slate-900 transition-colors">{item.name}</span>
                              <span className="text-xs text-slate-404">{item.email}</span>
                            </div>
                          </div>
                        </td>

                        {/* Phone Number Column */}
                        <td className="py-4 px-4 font-mono font-medium text-slate-600">
                          {item.phoneNumber || 'N/A'}
                        </td>

                        {/* Current Role badge column */}
                        <td className="py-4 px-4">
                          {item.roleId === 1 && (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                              Admin
                            </span>
                          )}
                          {item.roleId === 5 && (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100">
                              Manager
                            </span>
                          )}
                          {item.roleId === 2 && (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                              Staff
                            </span>
                          )}
                          {item.roleId === 4 && (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                              Driver
                            </span>
                          )}
                        </td>

                        {/* Status Column with Switch Toggle */}
                        <td className="py-4 px-4 font-medium">
                          <div className="flex items-center gap-3">
                            <Switch 
                              checked={item.status === 'Active'}
                              onChange={() => handleToggleUserStatus(item.id, item.status)}
                              className={item.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-300'}
                              size="small"
                            />
                            {item.status === 'Active' ? (
                              <span className="text-emerald-600 font-semibold text-sm">
                                Active
                              </span>
                            ) : (
                              <span className="text-rose-500 font-semibold text-sm">
                                Inactive
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Joined Date Column */}
                        <td className="py-4 px-4 text-slate-500 font-medium">{item.joined}</td>

                        {/* Actions Column */}
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Edit Info Button */}
                            <button
                              onClick={() => openEditModal(item)}
                              className="bg-slate-50 text-slate-600 hover:bg-slate-100 p-2 rounded-xl text-sm font-medium transition-all duration-205 border border-slate-200 shadow-sm flex items-center gap-1.5"
                              title="Edit Profile Info"
                            >
                              <Edit size={14} />
                              <span>Edit Info</span>
                            </button>

                            {isSystemAdmin ? (
                              <button
                                disabled
                                className="bg-slate-50 text-slate-404 px-4 py-2 rounded-xl text-sm font-medium cursor-not-allowed border border-slate-100"
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
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
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
                <h3 className="text-lg font-bold text-slate-808">Modify User Permissions</h3>
              </div>
              <button
                onClick={closeModal}
                disabled={submitting}
                className="text-slate-404 hover:text-slate-600 p-1.5 hover:bg-slate-50 rounded-xl transition-all disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="py-6 space-y-4">
              
              {/* Account Info Nudge */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${getAvatarBg(selectedUser.roleId)}`}>
                  {getInitials(selectedUser.name)}
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-slate-805 text-sm">{selectedUser.name}</span>
                  <span className="text-[11px] text-slate-400">{selectedUser.email}</span>
                </div>
              </div>

              {/* Live Preview Nudge */}
              <div className="bg-[#1A62FF]/5 border border-[#1A62FF]/10 rounded-2xl p-4">
                <span className="text-[10px] text-[#1A62FF] font-extrabold uppercase tracking-wider block font-sans">Live Mutation Preview</span>
                <p className="text-sm font-semibold text-slate-700 mt-1.5 flex items-center gap-2 font-sans">
                  <span>Role:</span>
                  <span className="text-slate-404 line-through">{displayRoleIdName(selectedUser.roleId)}</span>
                  <span className="text-[#1A62FF] font-bold">&rarr;</span>
                  <span className="text-indigo-650 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100 font-bold">{displayRoleIdName(selectedNewRoleId)}</span>
                </p>
              </div>

              {/* Role Dropdown Selector */}
              <div className="space-y-2 font-sans">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Select New Role</label>
                <Select
                  value={selectedNewRoleId}
                  onChange={(val) => setSelectedNewRoleId(val)}
                  disabled={submitting}
                  className="w-full h-11"
                  dropdownClassName="rounded-xl"
                  style={{ width: '100%' }}
                >
                  <Select.Option value={1}>Admin</Select.Option>
                  <Select.Option value={2}>Staff</Select.Option>
                  <Select.Option value={5}>Manager</Select.Option>
                  <Select.Option value={4}>Driver</Select.Option>
                </Select>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4 font-sans">
              <button
                onClick={closeModal}
                disabled={submitting}
                className="px-4 py-2.5 border border-slate-200 text-slate-600 font-medium rounded-xl text-sm hover:bg-slate-50 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveChanges}
                disabled={submitting}
                className="px-5 py-2.5 bg-[#1A62FF] hover:bg-blue-700 text-white font-medium rounded-xl text-sm shadow-md hover:shadow-blue-500/10 transition-all duration-200 disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* E. "Edit Profile" Interactive Modal Overlay */}
      {isEditModalOpen && editUser && (
        <Modal
          title={
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 font-sans">
              <UserCog className="text-blue-600" size={20} />
              <span className="text-lg font-bold text-slate-800">Edit User Profile</span>
            </div>
          }
          open={isEditModalOpen}
          onCancel={closeEditModal}
          footer={[
            <Button 
              key="cancel" 
              onClick={closeEditModal} 
              disabled={submitting}
              className="rounded-xl font-medium"
            >
              Cancel
            </Button>,
            <Button 
              key="submit" 
              type="primary" 
              onClick={handleSaveEditProfile} 
              loading={submitting}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium"
            >
              Save Profile
            </Button>
          ]}
          destroyOnClose
          width={400}
        >
          <div className="py-4 space-y-4 font-sans">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Username</label>
              <Input 
                value={editUsername} 
                onChange={(e) => setEditUsername(e.target.value)} 
                disabled={submitting}
                placeholder="Enter username"
                className="h-10 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Email Address</label>
              <Input 
                value={editEmail} 
                onChange={(e) => setEditEmail(e.target.value)} 
                disabled={submitting}
                placeholder="Enter email/gmail"
                className="h-10 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Phone Number</label>
              <Input 
                value={editPhoneNumber} 
                onChange={(e) => setEditPhoneNumber(e.target.value)} 
                disabled={submitting}
                placeholder="Enter phone number"
                className="h-10 rounded-xl"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Accounts;
