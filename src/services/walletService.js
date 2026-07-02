import api from './api';

export const walletService = {
  getBalance: () => api.get('/Wallet/balance'),
  getHistory: () => api.get('/Wallet/history'),
  deposit: (amount) => api.post('/Wallet/deposit', { amount: Number(amount) })
};

export default walletService;
