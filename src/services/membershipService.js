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
    try {
      const response = await api.post('/MembershipCard/register', payload);
      return response.data;
    } catch (error) {
      const status = error.response?.status;
      const msg = error.response?.data?.message;
      if (status === 409) throw new Error(msg || 'Bạn đã có thẻ thành viên đang hoạt động.');
      if (status === 400) throw new Error(msg || 'Thông tin đăng ký không hợp lệ.');
      if (status === 404) throw new Error(msg || 'Gói cước hoặc ô đỗ không tồn tại.');
      throw new Error(msg || 'Đăng ký thẻ thất bại. Vui lòng thử lại.');
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
};

export default membershipService;
