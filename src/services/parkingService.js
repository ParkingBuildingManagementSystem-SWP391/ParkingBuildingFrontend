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

  recognizeLicensePlate: async (imageFile, vehicleTypeId) => {
    try {
      const formData = new FormData();
      formData.append('imageFile', imageFile);
      formData.append('vehicleTypeId', vehicleTypeId);

      const response = await api.post('/Parking/recognize', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      const serverMessage = error.response?.data?.message || error.response?.data?.error || "License plate recognition failed.";
      throw serverMessage;
    }
  },

  // 3. Nhân viên quét xe tại cổng vào bãi (Check-in cho khách đã đặt trước)
  checkInVehicle: async (ticketCode, licenseVehicle, checkInImageUrl) => {
    try {
      const formData = new FormData();
      if (ticketCode) formData.append('TicketCode', ticketCode.trim());
      if (licenseVehicle) formData.append('LicenseVehicle', licenseVehicle.trim().toUpperCase());
      if (checkInImageUrl) formData.append('ImageUrl', checkInImageUrl);

      const response = await api.post('/Parking/check-in', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
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
      const formData = new FormData();
      if (licenseVehicle) formData.append('LicenseVehicle', licenseVehicle.trim().toUpperCase());
      formData.append('VehicleTypeId', parseInt(vehicleTypeId));
      if (checkInImageUrl) formData.append('ImageUrl', checkInImageUrl);

      const response = await api.post('/Parking/walk-in', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
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
      const formData = new FormData();
      if (ticketCode) formData.append('TicketCode', ticketCode.trim());
      if (checkoutLicensePlate) formData.append('CheckoutLicensePlate', checkoutLicensePlate.trim().toUpperCase());
      if (checkOutImageUrl) formData.append('ImageUrl', checkOutImageUrl);
      if (sessionId) formData.append('SessionId', parseInt(sessionId));
      formData.append('PaymentMethod', paymentMethod);

      const response = await api.post('/Parking/check-out', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
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
  },

  // Quét đối chiếu QR hoặc biển số tại cổng vào
  scanCheckIn: async (ticketCode, detectedPlate = null) => {
    try {
      const url = detectedPlate 
        ? `/Parking/scan-checkin/${ticketCode}?detectedPlate=${encodeURIComponent(detectedPlate)}`
        : `/Parking/scan-checkin/${ticketCode}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      const serverMessage = error.response?.data?.message || error.response?.data?.error || "Quét QR check-in thất bại.";
      throw serverMessage;
    }
  },

  // Quét đối chiếu QR hoặc biển số tại cổng ra
  scanCheckOut: async (ticketCode, detectedPlate = null) => {
    try {
      const url = detectedPlate 
        ? `/Parking/scan-checkout/${ticketCode}?detectedPlate=${encodeURIComponent(detectedPlate)}`
        : `/Parking/scan-checkout/${ticketCode}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      const serverMessage = error.response?.data?.message || error.response?.data?.error || "Quét QR check-out thất bại.";
      throw serverMessage;
    }
  }
};
