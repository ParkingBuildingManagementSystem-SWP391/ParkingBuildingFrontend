import api from './api';

// Hàm kiểm tra lỗi Hủy Request từ Axios
const isCanceled = (error) => error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED';

// Hàm bóc tách dữ liệu lỗi trả về từ Backend
const unwrapError = (error, fallback) => {
  if (isCanceled(error)) return null;
  return error.response?.data || error.message || fallback;
};

const incidentReportService = {
  /**
   * 1. Lấy danh sách sự cố (Có bộ lọc)
   * Vai trò: Staff, Manager, Admin
   * @param {Object} filters - { status, issueType, licenseVehicle }
   * @param {AbortSignal} signal - Hủy request khi component unmount
   */
  getIncidents: async (filters = {}, signal) => {
    try {
      const response = await api.get('/incident-reports', {
        params: filters,
        signal,
      });
      return response.data; // Trả về List<IncidentReportResponseDto>
    } catch (error) {
      const handledError = unwrapError(error, 'Không thể tải danh sách sự cố.');
      if (handledError === null) return null;
      throw handledError;
    }
  },

  /**
   * 2. Lấy chi tiết sự cố theo ID
   * Vai trò: Staff, Manager, Admin
   */
  getIncidentDetail: async (incidentId, signal) => {
    try {
      const response = await api.get(`/incident-reports/${incidentId}`, { signal });
      return response.data; // Trả về IncidentReportResponseDto
    } catch (error) {
      const handledError = unwrapError(error, 'Không thể tải thông tin chi tiết sự cố.');
      if (handledError === null) return null;
      throw handledError;
    }
  },

  /**
   * 3. Tạo báo cáo sự cố mới
   * Vai trò: Staff, Registered_Driver
   * @param {Object} data - { sessionId (nullable), issueType, description, imageProofUrl }
   */
  createIncident: async (data, signal) => {
    try {
      const response = await api.post('/incident-reports', data, { signal });
      return response.data;
    } catch (error) {
      const handledError = unwrapError(error, 'Không thể gửi báo cáo sự cố.');
      if (handledError === null) return null;
      throw handledError;
    }
  },

  /**
   * 4. Giải quyết sự cố (Resolve)
   * Vai trò: Manager
   * @param {number} incidentId
   * @param {Object} data - { resolutionNotes, fineAmount }
   */
  resolveIncident: async (incidentId, data, signal) => {
    try {
      const response = await api.put(`/incident-reports/${incidentId}/resolve`, data, { signal });
      return response.data;
    } catch (error) {
      const handledError = unwrapError(error, 'Không thể giải quyết sự cố.');
      if (handledError === null) return null;
      throw handledError;
    }
  },
};

export default incidentReportService;
