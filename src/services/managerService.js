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

  getIncidents: async (params) => {
    try {
      const response = await api.get('/incident-reports', { params });
      return response.data;
    } catch (error) {
      console.error('getIncidents error:', error);
      throw error;
    }
  },

  resolveIncident: async (incidentId, data) => {
    try {
      const response = await api.put(`/incident-reports/${incidentId}/resolve`, data);
      return response.data;
    } catch (error) {
      console.error(`resolveIncident error for incident ${incidentId}:`, error);
      throw error;
    }
  },

  getStaffLogs: async () => {
    try {
      // TODO backend: implement GET /api/Manager/staff-logs returning an array of staff activity logs.
      const response = await api.get('/Manager/staff-logs');
      return response.data;
    } catch (error) {
      console.error('getStaffLogs error:', error);
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
        monthlyPrice: Number(data.monthlyPrice),
        maxHoursPerTurn: data.maxHoursPerTurn !== undefined && data.maxHoursPerTurn !== null && data.maxHoursPerTurn !== ''
          ? Number(data.maxHoursPerTurn)
          : null,
        firstHourRate: Number(data.firstHourRate ?? 0),
        subsequentHourRate: Number(data.subsequentHourRate ?? 0)
      });
      return response.data;
    } catch (error) {
      console.error('updateVehiclePricing error:', error);
      throw error;
    }
  },

  getMemberships: async (params = {}) => {
    try {
      const response = await api.get('/Manager/membership-cards', { params });
      return response.data;
    } catch (error) {
      console.error('getMemberships error:', error);
      throw error;
    }
  },

  cancelMembership: async (membershipCardId) => {
    try {
      const response = await api.delete(`/Manager/membership-cards/${membershipCardId}/cancel`);
      return response.data;
    } catch (error) {
      console.error(`cancelMembership error for card ${membershipCardId}:`, error);
      throw error;
    }
  }
};
