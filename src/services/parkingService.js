import api from './api';

export const parkingService = {
  // 1. Lấy danh sách slot thực tế từ DB dựa theo Floor ID
  getSlotsByFloor: async (floorId) => {
    try {
      const response = await api.get(`/Parking/floor/${floorId}`);
      return response.data;
    } catch (error) {
      const serverMessage = error.response?.data?.message || error.response?.data?.error || "Failed to fetch parking slots.";
      throw serverMessage;
    }
  },

  // 2. Tài xế đặt chỗ trước qua Web (Book Parking Slot)
  bookSlot: async (slotIdOrPayload, vehicleTypeId, licenseVehicle, expectedCheckInTime, paymentMethod = 'VNPAY') => {
    try {
      const payload = typeof slotIdOrPayload === 'object' && slotIdOrPayload !== null
        ? slotIdOrPayload
        : {
            slotId: slotIdOrPayload,
            vehicleTypeId,
            licenseVehicle,
            expectedCheckInTime,
            paymentMethod
          };

      const response = await api.post('/Parking/book', {
        slotId: parseInt(payload.slotId),
        licenseVehicle: String(payload.licenseVehicle || '').trim().toUpperCase(),
        typeId: parseInt(payload.vehicleTypeId ?? payload.typeId),
        expectedCheckInTime: payload.expectedCheckInTime,
        paymentMethod: payload.paymentMethod || 'VNPAY'
      });
      return response.data;
    } catch (error) {
      const serverMessage = error.response?.data?.message || error.response?.data?.error || "Failed to reserve parking slot.";
      throw serverMessage;
    }
  },

  // 3. Nhân viên quét xe tại cổng vào bãi (Check-in cho khách đã đặt trước)
  checkInVehicle: async (ticketCode, licenseVehicle, checkInImageUrl) => {
    try {
      const response = await api.post('/Parking/check-in', {
        ticketCode: ticketCode ? ticketCode.trim() : null,
        licenseVehicle: licenseVehicle ? licenseVehicle.trim().toUpperCase() : null,
        checkInImageUrl: checkInImageUrl || "string"
      });
      return response.data;
    } catch (error) {
      const serverMessage = error.response?.data?.error || error.response?.data?.message || "Check-in failed.";
      throw serverMessage;
    }
  },

  // 4. Nhân viên check-in cho khách vãng lai (Walk-in - Không đặt trước)
  walkInCheckIn: async (licenseVehicle, vehicleTypeId, checkInImageUrl) => {
    try {
      const response = await api.post('/Parking/walk-in', {
        licenseVehicle: licenseVehicle.trim().toUpperCase(),
        vehicleTypeId: parseInt(vehicleTypeId),
        checkInImageUrl: checkInImageUrl || "string"
      });
      return response.data;
    } catch (error) {
      const serverMessage = error.response?.data?.error || error.response?.data?.message || "Walk-in check-in failed.";
      throw serverMessage;
    }
  },

  // 5. Nhân viên quét xe cho xe ra cổng (Check-out - Tính phí & giải phóng slot)
  checkOutVehicle: async (ticketCode, checkoutLicensePlate, checkOutImageUrl, sessionId, paymentMethod = 'CASH') => {
    try {
      const response = await api.post('/Parking/check-out', {
        ticketCode: ticketCode ? ticketCode.trim() : null,
        checkoutLicensePlate: checkoutLicensePlate ? checkoutLicensePlate.trim().toUpperCase() : null,
        checkOutImageUrl: checkOutImageUrl || null,
        sessionId: sessionId ? parseInt(sessionId) : null,
        paymentMethod: paymentMethod
      });
      return response.data;
    } catch (error) {
      const serverMessage = error.response?.data?.message || error.response?.data?.error || "Check-out failed.";
      throw serverMessage;
    }
  },

  // 6. Ghi nhận thanh toán tiền mặt (CASH)
  processCashPayment: async (ticketCode, amountReceived) => {
    try {
      const response = await api.post('/Payments/cash', {
        ticketCode: ticketCode,
        amountReceived: parseFloat(amountReceived)
      });
      return response.data;
    } catch (error) {
      const serverMessage = error.response?.data?.message || error.response?.data?.error || "Cash payment processing failed.";
      throw serverMessage;
    }
  },

  // 7. Lấy trạng thái thanh toán của hóa đơn
  getPaymentStatus: async (invoiceId) => {
    try {
      const response = await api.get(`/Payments/status/${invoiceId}`);
      return response.data;
    } catch (error) {
      const serverMessage = error.response?.data?.message || error.response?.data?.error || "Failed to fetch payment status.";
      throw serverMessage;
    }
  },

  // 8. Tạo URL thanh toán VNPay cho tài xế tự thanh toán trước (Pre-Exit Payment)
  createVnPayPayment: async (sessionId) => {
    try {
      const response = await api.post('/Payments/vnpay/create', {
        sessionId: parseInt(sessionId),
        ipAddress: "127.0.0.1"
      });
      return response.data;
    } catch (error) {
      let errorMsg = "Failed to create VNPay payment link.";
      if (error.response?.data) {
        const data = error.response.data;
        if (data.message) {
          errorMsg = data.message;
        } else if (data.error) {
          errorMsg = data.error;
        } else if (data.errors) {
          const validationErrors = Object.entries(data.errors)
            .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
            .join('\n');
          if (validationErrors) {
            errorMsg = `Validation errors:\n${validationErrors}`;
          }
        }
      }
      throw errorMsg;
    }
  },

  // 9. Tài xế hủy đặt chỗ trước khi Check-in
  cancelBooking: async (sessionId) => {
    try {
      const response = await api.post(`/Parking/cancel-booking/${sessionId}`);
      return response.data; // Trả về { isSuccess: true, message: "..." }
    } catch (error) {
      const serverMessage = error.response?.data?.message || error.response?.data?.error || "Hủy đặt chỗ thất bại.";
      throw serverMessage;
    }
  }
};
