import api from './api';
import i18n from '../i18n';

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
    try {
      const response = await api.post('/MembershipCard/register', payload);
      return response.data;
    } catch (error) {
      const status = error.response?.status;
      const msg = error.response?.data?.message;
      if (status === 409) throw new Error(msg || i18n.t('membershipService.errAlreadyActive'));
      if (status === 400) throw new Error(msg || i18n.t('membershipService.errInvalidRegistration'));
      if (status === 404) throw new Error(msg || i18n.t('membershipService.errPlanOrSlotNotFound'));
      throw new Error(msg || i18n.t('membershipService.errRegisterFailed'));
    }
  },

  register: async (payload) => membershipService.registerMembershipCard(payload),

  getMyMembershipCards: async () => {
    const response = await api.get('/MembershipCard/my-card');
    return response.data;
  },

  getMyMembershipCard: async () => membershipService.getMyMembershipCards(),
  getMyCard: async () => membershipService.getMyMembershipCards(),

  updateMembershipVehicles: async (cardId, plates) => {
    const response = await api.put(`/MembershipCard/${cardId}/vehicles`, plates);
    return response.data;
  },

  cancelMembershipCard: async (cardId) => {
    try {
      const response = await api.delete(`/MembershipCard/${cardId}/cancel`);
      return response.data;
    } catch (error) {
      const msg = error.response?.data?.message;
      throw new Error(msg || i18n.t('membershipService.errCancelFailed'));
    }
  },
};

export default membershipService;
