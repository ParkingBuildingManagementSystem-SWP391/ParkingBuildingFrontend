import api from './api';

export const staffService = {
  startShift: async () => {
    try {
      const response = await api.post('/Staff/shift/start');
      return response.data;
    } catch (error) {
      console.error('startShift error:', error);
      throw error;
    }
  },

  endShift: async (data) => {
    try {
      const response = await api.post('/Staff/shift/end', data);
      return response.data;
    } catch (error) {
      console.error('endShift error:', error);
      throw error;
    }
  },

  getActiveShift: async () => {
    try {
      const response = await api.get('/Staff/shift/active');
      return response.data;
    } catch (error) {
      console.error('getActiveShift error:', error);
      throw error;
    }
  }
};
