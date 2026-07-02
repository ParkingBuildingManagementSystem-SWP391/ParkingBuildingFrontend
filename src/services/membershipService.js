import api from './api';

export const membershipService = {
  getMyMembershipCard: async () => {
    const response = await api.get('/MembershipCard/my-card');
    return response.data;
  },

  getMyCard: async () => {
    return membershipService.getMyMembershipCard();
  },

  getMembershipTiers: async () => {
    const response = await api.get('/MembershipCard/tiers');
    return response.data;
  },

  getTiers: async () => {
    return membershipService.getMembershipTiers();
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
