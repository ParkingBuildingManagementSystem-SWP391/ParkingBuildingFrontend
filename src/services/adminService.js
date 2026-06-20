import api from './api';

export const adminService = {
  // Create a new user account (Admin only)
  createUser: async (userData) => {
    return await api.post('/Admin/create-user', userData);
  }
};
