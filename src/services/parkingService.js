import api from './api';

export const parkingService = {
  // Lấy tất cả chỗ đỗ xe
  getAllSlots: async () => {
    try {
      // Đường dẫn này sẽ map với [HttpGet] trong ParkingController.cs bên Backend
      const response = await api.get('/parking'); 
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách slot:", error);
      throw error;
    }
  },

  // Ví dụ tạo một yêu cầu đỗ xe mới (WalkInRequest)
  createWalkInRequest: async (walkInData) => {
    const response = await api.post('/parking/walk-in', walkInData);
    return response.data;
  }
};