import api from './api';

export const membershipService = {
  getMyCard: async () => {
    const response = await api.get('/MembershipCard/my-card');
    return response.data;
  },

  getTiers: async () => {
    const response = await api.get('/MembershipCard/tiers');
    return response.data;
  },

  getAvailableSlots: async (typeId) => {
    const response = await api.get('/Parking/slots', {
      params: { typeId, status: 'Available' }
    });
    return response.data;
  },

  register: async (payload) => {
    const response = await api.post('/MembershipCard/register', payload);
    return response.data;
  }
};

export default membershipService;
