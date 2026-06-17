import api from './api';

export const managerService = {
  getDashboardSummary: async () => {
    try {
      const response = await api.get('/Manager/dashboard-summary');
      return response.data;
    } catch (error) {
      console.error('getDashboardSummary error:', error);
      throw error;
    }
  },

  getSlotDetail: async (slotId) => {
    try {
      const response = await api.get(`/Manager/slot-detail/${slotId}`);
      return response.data;
    } catch (error) {
      console.error(`getSlotDetail error for slot ${slotId}:`, error);
      throw error;
    }
  },

  getTrafficStatistics: async (params) => {
    try {
      const response = await api.get('/Manager/traffic-statistics', { params });
      return response.data;
    } catch (error) {
      console.error('getTrafficStatistics error:', error);
      throw error;
    }
  },

  exportReport: async (params) => {
    try {
      const response = await api.get('/Manager/export-report', {
        params,
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('exportReport error:', error);
      throw error;
    }
  },

  updateVehiclePricing: async (data) => {
    try {
      const response = await api.put('/Manager/update-pricing', {
        vehicleTypeId: Number(data.vehicleTypeId),
        dayRate: Number(data.dayRate),
        nightRate: Number(data.nightRate),
        fullDayRate: Number(data.fullDayRate),
        maxHoursPerTurn: data.maxHoursPerTurn !== undefined && data.maxHoursPerTurn !== null && data.maxHoursPerTurn !== ''
          ? Number(data.maxHoursPerTurn)
          : null
      });
      return response.data;
    } catch (error) {
      console.error('updateVehiclePricing error:', error);
      throw error;
    }
  }
};
