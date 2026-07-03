import api from './api';

export const membershipService = {
  getMembershipTiers: async () => {
    const response = await api.get('/MembershipCard/tiers');
    return response.data;
  },

  getAvailableSlots: async (typeId) => {
    const response = await api.get(`/Parking/slots?typeId=${typeId}&status=Available`);
    return response.data;
  },

  registerMembershipCard: async (payload) => {
    const response = await api.post('/MembershipCard/register', payload);
    return response.data;
  },

  getMyMembershipCards: async () => {
    const response = await api.get('/MembershipCard/my-card');
    return response.data;
  },
};
