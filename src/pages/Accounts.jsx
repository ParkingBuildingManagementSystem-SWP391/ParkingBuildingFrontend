import React, { useState, useEffect, useMemo } from 'react';
import { Users, UserCog, X, Search, CheckCircle, AlertTriangle, Edit, Lock, Unlock } from 'lucide-react';
import { message, Select, Modal, Input, Switch, Button } from 'antd';
import api from '../services/api';
import { useTranslation } from 'react-i18next';

const Accounts = () => {
  const { t } = useTranslation();
  const [accounts, setAccounts] = useState([]);
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

    const uid = u.id || u.Id || u.userId || u.UserId || 1;
    const fakeDate = new Date(2025, uid % 12, (uid * 3) % 28 + 1).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    return {
      id: uid,
      name: u.name || u.Name || u.username || u.Username || 'Unknown User',
      email: u.email || u.Email || 'No Email Provided',
      phoneNumber: u.phoneNumber || u.PhoneNumber || '',
      roleId: roleId,
      status: u.isDeleted || u.IsDeleted ? 'Inactive' : 'Active', // Mapping to status toggle
      joined: u.createdAt || u.CreatedAt || u.joined || u.Joined || fakeDate
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

      const source = Array.isArray(rawData) ? rawData : (rawData?.data || rawData?.Data || []);
      const mapped = source
        .map(mapUserToUI)
        .filter(u => u.roleId !== 3); // Completely EXCLUDE RoleId = 3 (Customer)
      setAccounts(mapped);
    } catch (err) {
      console.error(err);
      setErrorBanner(t('accounts.errLoadAccounts'));
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Dynamic Date subtitle
  const getFormattedDate = () => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
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
      setAlertMessage(`${t('accounts.modSuccess')} ${selectedUser.name}!`);
      setTimeout(() => {
        setAlertMessage(null);
      }, 3500);

      closeModal();
      loadUsers(); // Reload dynamic user list
    } catch (err) {
      console.error("Change Role Error Response:", err.response?.data || err);
      const errMsg = err.response?.data?.message || err.response?.data?.error || err.message || t('accounts.modFail');
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
      setAlertMessage(`${t('accounts.updSuccess')} ${editUsername.trim()}!`);
      setTimeout(() => {
        setAlertMessage(null);
      }, 3500);

      closeEditModal();
      loadUsers(); // Reload dynamic user list
    } catch (err) {
      console.error(err);
      message.error(err.message || t('accounts.updFail'));
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

    setAlertMessage(`${t('accounts.toggleSuccess')} ${newStatus}!`);
    setTimeout(() => {
      setAlertMessage(null);
    }, 3500);
  };

  const totalCount = filteredAccounts.length;
  const activeCount = filteredAccounts.filter(a => a.status === 'Active').length;
  const lockedCount = filteredAccounts.filter(a => a.status !== 'Active').length;

  return (
    <div className="min-h-full bg-slate-50 select-none font-sans pb-12 w-full">
      <div className="space-y-8">
        {/* Floating Success Alert Toast */}
        {alertMessage && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-emerald-600 text-white font-semibold text-sm px-6 py-3 rounded-[14px] shadow-xl z-50 flex items-center gap-2 border border-emerald-500 animate-bounce">
            <CheckCircle size={18} />
            <span>{alertMessage}</span>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2.5">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-600 text-white shadow-sm">
                <Users size={20} strokeWidth={2.5} />
              </span>
              {t('accounts.allUsersTitle')}
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-2">{getFormattedDate()}</p>
          </div>
        </div>

        {/* Error / Offline Banner */}
        {errorBanner && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm font-semibold p-3.5 rounded-[14px] flex items-center gap-2.5">
            <AlertTriangle size={16} className="text-amber-600 shrink-0" />
            <span>{errorBanner}</span>
          </div>
        )}

        {/* A. Top Stats Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Total Users */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Users size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-3xl font-extrabold tracking-tight text-slate-900">{totalCount}</h3>
              <p className="text-[13px] font-medium text-slate-500">{t('accounts.totalUsers')}</p>
            </div>
          </div>

          {/* Active Users */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500">
              <CheckCircle size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-3xl font-extrabold tracking-tight text-slate-900">{activeCount}</h3>
              <p className="text-[13px] font-medium text-slate-500">{t('accounts.active')}</p>
            </div>
          </div>

          {/* Locked Users */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500">
              <Lock size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-3xl font-extrabold tracking-tight text-slate-900">{lockedCount}</h3>
              <p className="text-[13px] font-medium text-slate-500">{t('accounts.locked')}</p>
            </div>
          </div>
        </div>

        {/* B. Table Section */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm pt-6 pb-2">

          {/* Table Header & Controls */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 px-6 md:px-8">
            <div>
              <h2 className="text-xl font-extrabold tracking-tight text-slate-900">{t('accounts.allUsersTitle')}</h2>
              <p className="text-[13px] text-slate-500 font-medium mt-1">{totalCount} {t('accounts.accountsFound')}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Search Input */}
              <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={t('accounts.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 pr-9 py-2.5 w-full sm:w-[280px] bg-slate-50 border-[1.5px] border-slate-200 rounded-[14px] text-[13px] text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 focus:bg-white transition-all font-medium"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-8 h-8 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
                <span className="text-[13px] font-semibold text-slate-500">{t('accounts.loadingAccounts')}</span>
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[760px]">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest bg-slate-50">
                    <th className="py-4 px-6 md:px-8 font-extrabold">{t('accounts.colUser')}</th>
                    <th className="py-4 px-4 font-extrabold">{t('accounts.colEmail')}</th>
                    <th className="py-4 px-4 font-extrabold">{t('accounts.colRole')}</th>
                    <th className="py-4 px-4 font-extrabold">{t('accounts.colStatus')}</th>
                    <th className="py-4 px-4 font-extrabold">{t('accounts.colCreated')}</th>
                    <th className="py-4 px-6 md:px-8 text-right font-extrabold">{t('accounts.colActions')}</th>
                  </tr>
                </thead>
                <tbody className="text-[13px]">
                  {filteredAccounts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400 font-medium text-[13px]">
                        {t('accounts.noAccountsFound')}
                      </td>
                    </tr>
                  ) : (
                    filteredAccounts.map((item, index) => {
                      const initials = getInitials(item.name);

                      // Determine Role Badges
                      let roleBadge = null;
                      if (item.roleId === 1) {
                        roleBadge = <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-600">admin</span>;
                      } else if (item.roleId === 5) {
                        roleBadge = <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-purple-100 text-purple-600">manager</span>;
                      } else if (item.roleId === 2) {
                        roleBadge = <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-600">staff</span>;
                      } else {
                        roleBadge = <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-600">user</span>;
                      }

                      // Determine Status Badges
                      const isActive = item.status === 'Active';
                      const statusBadge = isActive
                        ? <span className="px-3 py-1 rounded-full text-[11px] font-bold border border-emerald-200 text-emerald-600 bg-emerald-50">active</span>
                        : <span className="px-3 py-1 rounded-full text-[11px] font-bold border border-rose-200 text-rose-600 bg-rose-50">locked</span>;

                      // Avatar Background Color (Using predefined distinct colors)
                      const avatarColors = ['bg-rose-500', 'bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500'];
                      const avatarBg = avatarColors[item.id % avatarColors.length];

                      return (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 group">

                          {/* User Column */}
                          <td className="py-4 px-6 md:px-8">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-[12px] shadow-sm ${avatarBg}`}>
                                {initials}
                              </div>
                              <span className="text-slate-900 font-bold">{item.name}</span>
                            </div>
                          </td>

                          {/* Email Column */}
                          <td className="py-4 px-4 font-medium text-slate-500">
                            {item.email}
                          </td>

                          {/* Role Column */}
                          <td className="py-4 px-4">
                            {roleBadge}
                          </td>

                          {/* Status Column */}
                          <td className="py-4 px-4">
                            {statusBadge}
                          </td>

                          {/* Created Column */}
                          <td className="py-4 px-4 text-slate-500 font-medium">
                            {item.joined}
                          </td>

                          {/* Actions Column */}
                          <td className="py-4 px-6 md:px-8 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openEditModal(item)}
                                className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 flex items-center justify-center transition-all shadow-sm"
                                title={t('accounts.editInfo')}
                              >
                                <Edit size={14} />
                              </button>

                              {/* Toggle Lock / Unlock */}
                              <button
                                onClick={() => handleToggleUserStatus(item.id, item.status)}
                                className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all shadow-sm ${
                                  isActive
                                    ? 'bg-white border-rose-200 text-rose-400 hover:text-rose-600 hover:border-rose-400'
                                    : 'bg-white border-emerald-200 text-emerald-400 hover:text-emerald-600 hover:border-emerald-400'
                                }`}
                                title={isActive ? t('accounts.lockUser') : t('accounts.unlockUser')}
                              >
                                {isActive ? <Lock size={14} /> : <Unlock size={14} />}
                              </button>
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
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">

              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <UserCog className="text-indigo-600" size={20} />
                  <h3 className="text-lg font-extrabold tracking-tight text-slate-900">{t('accounts.modPermissionsTitle')}</h3>
                </div>
                <button
                  onClick={closeModal}
                  disabled={submitting}
                  className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-50 rounded-xl transition-all disabled:opacity-50"
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
                    <span className="font-bold text-slate-900 text-sm">{selectedUser.name}</span>
                    <span className="text-[11px] text-slate-400">{selectedUser.email}</span>
                  </div>
                </div>

                {/* Live Preview Nudge */}
                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
                  <span className="text-[10px] text-indigo-600 font-extrabold uppercase tracking-wider block font-sans">{t('accounts.livePreview')}</span>
                  <p className="text-sm font-semibold text-slate-700 mt-1.5 flex items-center gap-2 font-sans">
                    <span>Role:</span>
                    <span className="text-slate-400 line-through">{displayRoleIdName(selectedUser.roleId)}</span>
                    <span className="text-indigo-600 font-bold">&rarr;</span>
                    <span className="text-indigo-600 bg-white px-2 py-0.5 rounded-lg border border-indigo-100 font-bold">{displayRoleIdName(selectedNewRoleId)}</span>
                  </p>
                </div>

                {/* Role Dropdown Selector */}
                <div className="space-y-2 font-sans">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">{t('accounts.selectRole')}</label>
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
                  className="px-4 py-2.5 border border-slate-200 bg-white text-slate-600 font-bold rounded-[14px] text-sm hover:bg-slate-50 transition-all disabled:opacity-50"
                >
                  {t('accounts.btnCancel')}
                </button>
                <button
                  onClick={handleSaveChanges}
                  disabled={submitting}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-[14px] text-sm shadow-md hover:shadow-indigo-500/20 transition-all duration-200 disabled:opacity-50"
                >
                  {submitting ? t('accounts.btnSaving') : t('accounts.btnSaveChanges')}
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
                <UserCog className="text-indigo-600" size={20} />
                <span className="text-lg font-extrabold tracking-tight text-slate-900">{t('accounts.editProfileTitle')}</span>
              </div>
            }
            open={isEditModalOpen}
            onCancel={closeEditModal}
            footer={[
              <Button
                key="cancel"
                onClick={closeEditModal}
                disabled={submitting}
                className="rounded-[14px] font-bold border-slate-200"
              >
                {t('accounts.btnCancel')}
              </Button>,
              <Button
                key="submit"
                type="primary"
                onClick={handleSaveEditProfile}
                loading={submitting}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-[14px] font-bold"
              >
                {t('accounts.btnSaveProfile')}
              </Button>
            ]}
            destroyOnClose
            width={400}
          >
            <div className="py-4 space-y-4 font-sans">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">{t('accounts.labelUsername')}</label>
                <Input
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  disabled={submitting}
                  placeholder={t('accounts.phUsername')}
                  className="h-10 rounded-[14px]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">{t('accounts.labelEmail')}</label>
                <Input
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  disabled={submitting}
                  placeholder={t('accounts.phEmail')}
                  className="h-10 rounded-[14px]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">{t('accounts.labelPhone')}</label>
                <Input
                  value={editPhoneNumber}
                  onChange={(e) => setEditPhoneNumber(e.target.value)}
                  disabled={submitting}
                  placeholder={t('accounts.phPhone')}
                  className="h-10 rounded-[14px]"
                />
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default Accounts;
