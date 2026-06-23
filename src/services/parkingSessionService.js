import api from './api';

const isCanceled = (error) => error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED';

const unwrapError = (error, fallback) => {
  if (isCanceled(error)) return null;
  return error.response?.data || error.message || fallback;
};

const parkingSessionService = {
  getAllSessions: async (signal) => {
    try {
      const response = await api.get('/Admin/sessions', { signal });
      return response.data;
    } catch (error) {
      const handledError = unwrapError(error, 'Failed to fetch parking sessions.');
      if (handledError === null) return null;
      throw handledError;
    }
  },

  searchSessions: async (filters, signal) => {
    try {
      const response = await api.get('/Admin/sessions/search', {
        params: filters,
        signal,
      });
      return response.data;
    } catch (error) {
      const handledError = unwrapError(error, 'Failed to search parking sessions.');
      if (handledError === null) return null;
      throw handledError;
    }
  },

  getSessionDetailByTicket: async (ticketCode, signal) => {
    try {
      const response = await api.get(`/Admin/sessions/by-ticket/${encodeURIComponent(ticketCode)}`, {
        signal,
      });
      return response.data;
    } catch (error) {
      const handledError = unwrapError(error, 'Failed to fetch parking session detail.');
      if (handledError === null) return null;
      throw handledError;
    }
  },
};

export default parkingSessionService;
