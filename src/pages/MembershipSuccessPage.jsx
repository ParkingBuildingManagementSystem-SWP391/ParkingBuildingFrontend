import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, CreditCard, QrCode } from 'lucide-react';
import { formatDateTimeVN } from '../utils/dateTime';

const buildCards = (result) => {
  const data = result?.data ?? result ?? {};
  return (data?.ticketCodes || []).map((ticketCode, index) => ({
    ticketCode,
    slotId: data?.slotIds?.[index],
    slotName: data?.slotNames?.[index],
  }));
};

const MembershipSuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state?.result;
  const data = result?.data ?? result ?? {};
  const cards = buildCards(result);
  const startTime = data?.startTime || data?.StartTime;

  return (
    <div className="min-h-full bg-slate-50 px-4 py-10 font-sans dark:bg-slate-900">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 ring-8 ring-emerald-50/60">
            <CheckCircle2 size={34} />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">Đăng ký Membership thành công</h1>
          <p className="mx-auto mt-2 max-w-xl text-sm font-medium text-slate-500 dark:text-slate-400">
            {cards.length > 0
              ? 'Mỗi ô đỗ đã được cấp một mã QR riêng. Vui lòng dùng đúng QR tương ứng với ô đỗ.'
              : 'Không tìm thấy dữ liệu ticket trong kết quả trả về. Bạn có thể quay lại trang Membership để tải lại danh sách.'}
          </p>
          {startTime && (
            <p className="mt-3 text-xs font-bold text-slate-500 dark:text-slate-400">
              Bắt đầu: <span className="text-slate-800 dark:text-slate-100">{formatDateTimeVN(startTime)}</span>
            </p>
          )}
        </div>

        {cards.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {cards.map((card, index) => {
              const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(card.ticketCode)}`;
              return (
                <div key={card.ticketCode} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Thẻ #{index + 1}</p>
                      <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">Ô đỗ {card.slotName || card.slotId || 'N/A'}</h2>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                      <CreditCard size={18} />
                    </div>
                  </div>

                  <div className="mb-4 flex justify-center rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                    <img src={qrUrl} alt={`QR ${card.ticketCode}`} className="h-44 w-44 object-contain" />
                  </div>

                  <div className="flex items-start gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
                    <QrCode size={15} className="mt-0.5 shrink-0 text-slate-400" />
                    <span className="break-all font-mono text-sm font-extrabold tracking-wider text-slate-800 dark:text-slate-100">
                      {card.ticketCode}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => navigate('/my-membership')}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-[14px] bg-indigo-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700"
          >
            Xem Membership của tôi
            <ArrowRight size={16} />
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex h-12 items-center justify-center rounded-[14px] border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    </div>
  );
};

export default MembershipSuccessPage;
