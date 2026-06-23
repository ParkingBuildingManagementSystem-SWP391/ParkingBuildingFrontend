import api from './api';

export const adminService = {
  // Get all users (Admin only)
  getAllUsers: async () => {
    return await api.get('/Admin/users');
  },

  // Update a user's information and role (Admin only)
  updateUser: async (userData) => {
    return await api.post('/Admin/update-user', userData);
  },

  // Create a new user account (Admin only)
  createUser: async (userData) => {
    return await api.post('/Admin/create-user', userData);
  }
};
