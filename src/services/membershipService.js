import api from './api';

export const membershipService = {
  getMembershipTiers: async () => {
    const response = await api.get('/MembershipCard/tiers');
    return response.data;
  },

  getTiers: async () => membershipService.getMembershipTiers(),

  getAvailableSlots: async (typeId) => {
    const response = await api.get('/Parking/slots', {
      params: { typeId, status: 'Available' }
    });
    return response.data;
  },

  registerMembershipCard: async (payload) => {
    const response = await api.post('/MembershipCard/register', payload);
    return response.data;
  },

  register: async (payload) => membershipService.registerMembershipCard(payload),

  getMyMembershipCards: async () => {
    const response = await api.get('/MembershipCard/my-card');
    return response.data;
  },

  getMyMembershipCard: async () => membershipService.getMyMembershipCards(),

  getMyCard: async () => membershipService.getMyMembershipCards(),
};

export default membershipService;
