import api from './api';

export const parkingService = {
<<<<<<< Updated upstream
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
=======
  // Fetch real parking slots by Floor ID from DB
  getSlotsByFloor: async (floorId) => {
    try {
      const response = await api.get(`/Parking/floor/${floorId}`);
      return response.data;
    } catch (error) {
      const serverMessage = error.response?.data?.message || error.response?.data?.error || "Failed to fetch parking slots.";
      throw serverMessage;
    }
  },

  // Driver reserves a parking slot
  bookSlot: async (slotId, licenseVehicle, typeId) => {
    try {
      const response = await api.post('/Parking/book', {
        slotId: parseInt(slotId),
        licenseVehicle: licenseVehicle.trim().toUpperCase(),
        typeId: parseInt(typeId)
      });
      return response.data;
    } catch (error) {
      const serverMessage = error.response?.data?.message || error.response?.data?.error || "Failed to reserve parking slot.";
      throw serverMessage;
    }
  },

  // Staff scans vehicle at entrance (Check-in)
  checkInVehicle: async (ticketCode, licenseVehicle, checkInImageUrl) => {
    try {
      const response = await api.post('/Parking/check-in', {
        ticketCode: ticketCode ? ticketCode.trim() : null,
        licenseVehicle: licenseVehicle ? licenseVehicle.trim().toUpperCase() : null,
        checkInImageUrl: checkInImageUrl || null
      });
      return response.data;
    } catch (error) {
      const serverMessage = error.response?.data?.error || error.response?.data?.message || "Check-in failed.";
      throw serverMessage;
    }
  },

  // Staff check-in for walk-in customer (Bypass booking)
  walkInCheckIn: async (licenseVehicle, vehicleTypeId, checkInImageUrl) => {
    try {
      const response = await api.post('/Parking/walk-in', {
        licenseVehicle: licenseVehicle.trim().toUpperCase(),
        vehicleTypeId: parseInt(vehicleTypeId),
        checkInImageUrl: checkInImageUrl || null
      });
      return response.data;
    } catch (error) {
      const serverMessage = error.response?.data?.error || error.response?.data?.message || "Walk-in check-in failed.";
      throw serverMessage;
    }
  },

  // Staff check-out vehicle (Process fee & release slot)
  checkOutVehicle: async (ticketCode, checkoutLicensePlate, checkOutImageUrl, sessionId) => {
    try {
      const response = await api.post('/Parking/check-out', {
        ticketCode: ticketCode ? ticketCode.trim() : null,
        checkoutLicensePlate: checkoutLicensePlate ? checkoutLicensePlate.trim().toUpperCase() : null,
        checkOutImageUrl: checkOutImageUrl || null,
        sessionId: sessionId ? parseInt(sessionId) : null
      });
      return response.data;
    } catch (error) {
      const serverMessage = error.response?.data?.message || error.response?.data?.error || "Check-out failed.";
      throw serverMessage;
    }
>>>>>>> Stashed changes
  }
};