import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CreditCard, History, Plus, RefreshCw, Wallet } from 'lucide-react';
import { toast } from '../components/ToastProvider';
import walletService from '../services/walletService';
import { formatDateTimeVN } from '../utils/dateTime';
import { useNotification } from '../context/NotificationContext';

const unwrapData = (payload) => payload?.data?.data ?? payload?.data ?? payload ?? null;

const getValue = (source, ...keys) => {
  for (const key of keys) {
    if (source?.[key] !== undefined && source?.[key] !== null) return source[key];
  }
  return undefined;
};

const getPaymentUrl = (payload) => {
  const data = unwrapData(payload);
  const candidates = [payload, payload?.data, data, data?.data];
  const keys = ['paymentUrl', 'paymentURL', 'PaymentUrl', 'PaymentURL', 'vnpayUrl', 'vnPayUrl', 'url', 'Url'];

  for (const source of candidates) {
    for (const key of keys) {
      if (source?.[key]) return source[key];
    }
  }

  return '';
};

const formatCurrency = (value) =>
  `${Number(value || 0).toLocaleString('vi-VN')} đ`;

const PRESET_AMOUNTS = [50000, 100000, 200000, 500000];

const MyWallet = () => {
  const { latestNotification } = useNotification();
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState([]);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [depositing, setDepositing] = useState(false);

  const normalizedAmount = useMemo(() => Number(String(amount).replace(/[^\d]/g, '')), [amount]);

  const loadWallet = useCallback(async () => {
    setLoading(true);
    try {
      const [balanceRes, historyRes] = await Promise.all([
        walletService.getBalance(),
        walletService.getHistory()
      ]);

      const balanceData = unwrapData(balanceRes.data);
      const historyData = unwrapData(historyRes.data);

      setBalance(Number(getValue(balanceData, 'balance', 'Balance', 'amount', 'Amount') || balanceData || 0));
      setHistory(Array.isArray(historyData) ? historyData : (historyData?.items || historyData?.transactions || []));
    } catch (error) {
      console.error('loadWallet error:', error);
      toast.error(error.response?.data?.message || 'Không thể tải thông tin ví.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWallet();
  }, [loadWallet]);

  useEffect(() => {
    if (latestNotification && (latestNotification.notificationType === 'WalletTransaction' || latestNotification.NotificationType === 'WalletTransaction')) {
      console.log('Wallet transaction notification received, reloading wallet data...');
      loadWallet();
    }
  }, [latestNotification, loadWallet]);

  const handleDeposit = async (event) => {
    event.preventDefault();

    if (!Number.isFinite(normalizedAmount) || normalizedAmount < 10000) {
      toast.warning('Số tiền nạp tối thiểu là 10.000đ.');
      return;
    }

    setDepositing(true);
    try {
      const response = await walletService.deposit(normalizedAmount);
      const paymentUrl = getPaymentUrl(response.data);

      if (paymentUrl) {
        window.location.href = paymentUrl;
        return;
      }

      toast.success(response.data?.message || 'Tạo yêu cầu nạp ví thành công.');
      await loadWallet();
      setAmount('');
    } catch (error) {
      console.error('deposit wallet error:', error);
      toast.error(error.response?.data?.message || error.response?.data?.error || 'Không thể tạo giao dịch nạp ví.');
    } finally {
      setDepositing(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-8 sm:px-6">
      <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
              <Wallet size={26} />
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">Ví điện tử</p>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-white">
                {loading ? 'Đang tải...' : formatCurrency(balance)}
              </h1>
            </div>
          </div>
          <button
            type="button"
            onClick={loadWallet}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Làm mới
          </button>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
        <form onSubmit={handleDeposit} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
              <Plus size={19} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">Nạp tiền vào ví</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Thanh toán qua cổng VNPay.</p>
            </div>
          </div>

          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Số tiền nạp
          </label>
          <div className="mt-2 flex items-center rounded-xl border border-slate-200 bg-slate-50 px-4 focus-within:border-indigo-400 focus-within:bg-white dark:border-slate-700 dark:bg-slate-800 dark:focus-within:bg-slate-900">
            <input
              type="number"
              min="10000"
              step="1000"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="Nhập số tiền"
              className="h-12 min-w-0 flex-1 bg-transparent text-sm font-bold text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
            />
            <span className="text-sm font-bold text-slate-400">đ</span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {PRESET_AMOUNTS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmount(String(preset))}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-extrabold text-slate-700 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-indigo-500/40 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-200"
              >
                {preset.toLocaleString('vi-VN')}
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={depositing}
            className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-extrabold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700"
          >
            <CreditCard size={17} />
            {depositing ? 'Đang xử lý...' : 'Nạp tiền'}
          </button>
        </form>

        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-700">
            <History size={18} className="text-indigo-500" />
            <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">Lịch sử giao dịch</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left">
              <thead className="bg-slate-50 text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3">Thời gian</th>
                  <th className="px-5 py-3">Loại</th>
                  <th className="px-5 py-3 text-right">Số tiền</th>
                  <th className="px-5 py-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-sm font-semibold text-slate-400">
                      Chưa có giao dịch ví.
                    </td>
                  </tr>
                ) : (
                  history.map((item, index) => {
                    const id = getValue(item, 'transactionId', 'TransactionId', 'id', 'Id') || index;
                    const time = getValue(item, 'createdAt', 'CreatedAt', 'transactionDate', 'TransactionDate', 'date', 'Date');
                    const type = getValue(item, 'type', 'Type', 'transactionType', 'TransactionType') || 'Nạp ví';
                    const value = getValue(item, 'amount', 'Amount', 'money', 'Money') || 0;
                    const status = getValue(item, 'status', 'Status') || 'N/A';

                    return (
                      <tr key={id} className="text-sm text-slate-600 dark:text-slate-300">
                        <td className="whitespace-nowrap px-5 py-4 font-semibold">{formatDateTimeVN(time, 'N/A')}</td>
                        <td className="px-5 py-4 font-bold">{type}</td>
                        <td className="whitespace-nowrap px-5 py-4 text-right font-black text-slate-900 dark:text-white">
                          {formatCurrency(value)}
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};

export default MyWallet;
