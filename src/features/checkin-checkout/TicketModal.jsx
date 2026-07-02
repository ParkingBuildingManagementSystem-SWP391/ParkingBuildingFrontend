import React from 'react';
import { Modal, Button } from 'antd';
import { Printer, QrCode, Barcode, CheckCircle2, Ticket } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatVietnamDate, formatVietnamTimeWithSeconds } from '../../utils/dateTime';

const TicketModal = ({ isOpen, onClose, details, type = 'ticket' }) => {
  const { t } = useTranslation();
  if (!details) return null;

  const formatVND = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const handlePrint = () => {
    window.print();
  };

  const isTicket = type === 'ticket';

  const qrPayload = details ? encodeURIComponent(
    `SLOT:${details.slotId || 'N/A'}|PLATE:${details.plate || 'N/A'}|ID:${details.sessionId || 'N/A'}|TICKET:${details.id || 'N/A'}`
  ) : '';
  const qrUrl = details ? `https://api.qrserver.com/v1/create-qr-code/?size=130x130&ecc=M&data=${qrPayload}` : '';

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={360}
      centered
      destroyOnClose
      className="receipt-modal"
      bodyStyle={{ padding: 0 }}
    >
      <div className="flex flex-col items-center justify-center p-5 bg-slate-50 text-slate-800 rounded-xl relative overflow-hidden select-none dark:bg-slate-900 dark:text-slate-200">
        
        {/* Glow ambient background border top */}
        <div className={`absolute top-0 w-full h-1 bg-gradient-to-r ${isTicket ? 'from-indigo-500 to-sky-400' : 'from-emerald-500 to-teal-400'}`}></div>
        
        {/* Top Header */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-extrabold uppercase tracking-wider mb-2 mt-2 dark:text-slate-400">
          {isTicket ? <Ticket size={14} className="text-indigo-600"/> : <CheckCircle2 size={14} className="text-emerald-600"/>}
          <span>SpotFlow Parking Counter</span>
        </div>
        <span className="text-[10px] text-slate-500 mb-6 font-bold dark:text-slate-400">B10, Ring Road 3, Cau Giay, Hanoi</span>

        {/* Paper Container */}
        <div className="w-full bg-white border border-slate-200/80 rounded-xl p-5 space-y-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="text-center pb-3 border-b border-dashed border-slate-200 dark:border-slate-700">
            <span className="text-[10.5px] text-slate-500 font-bold uppercase tracking-wider dark:text-slate-400">{isTicket ? t('gate.ticket.titleCheckIn') : t('gate.ticket.titleReceipt')}</span>
            <h2 className="text-2xl font-mono font-extrabold text-slate-800 mt-1 tracking-wide dark:text-slate-100">
              {details.id}
            </h2>
          </div>

          <div className="space-y-2.5 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">{t('gate.ticket.plateNumber')}</span>
              <span className="text-slate-800 font-extrabold dark:text-slate-100">{details.plate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">{t('gate.ticket.vehicleClass')}</span>
              <span className="text-slate-800 font-bold dark:text-slate-100">{details.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{t('gate.ticket.assignedSlot')}</span>
              <span className="text-indigo-600 font-extrabold">{details.slotId}</span>
            </div>
            
            <div className="h-px bg-slate-100 my-1 dark:bg-slate-700"></div>

            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">{t('gate.ticket.entryDate')}</span>
              <span className="text-slate-700 font-medium dark:text-slate-300">
                {formatVietnamDate(details.checkInTime)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">{t('gate.ticket.entryTime')}</span>
              <span className="text-slate-700 font-medium dark:text-slate-300">
                {formatVietnamTimeWithSeconds(details.checkInTime)}
              </span>
            </div>

            {!isTicket && details.checkOutTime && (
              <>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">{t('gate.ticket.exitTime')}</span>
                  <span className="text-slate-700 font-medium dark:text-slate-300">
                    {formatVietnamTimeWithSeconds(details.checkOutTime)}
                  </span>
                </div>
                
                <div className="h-px bg-slate-100 my-1 dark:bg-slate-700"></div>
                
                <div className="flex justify-between items-center text-sm pt-2">
                  <span className="text-slate-500 font-extrabold dark:text-slate-400">{t('gate.ticket.totalPaid')}</span>
                  <span className="text-emerald-600 font-extrabold text-base">{formatVND(details.fee)}</span>
                </div>
              </>
            )}
          </div>

          {/* QR / Barcode container */}
          <div className="flex flex-col items-center justify-center pt-3 border-t border-dashed border-slate-200 dark:border-slate-700">
            {isTicket ? (
              <div className="p-2 bg-white border border-slate-200 rounded-lg shadow-sm w-32 h-32 flex items-center justify-center">
                <img 
                  src={qrUrl}
                  alt="Ticket QR Code" 
                  className="w-[120px] h-[120px] object-contain"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5 p-2.5 bg-white rounded border border-slate-200 w-full text-center shadow-sm">
                <Barcode size={48} className="text-slate-800 w-full" />
                <span className="text-[9px] font-mono text-slate-500 font-bold tracking-widest">{details.plate}-{details.id}</span>
              </div>
            )}
            <span className="text-[10.5px] text-slate-500 text-center mt-3 leading-normal font-medium px-2 dark:text-slate-400">
              {isTicket ? t('gate.ticket.scanGate') : t('gate.ticket.thankYou')}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 w-full mt-6">
          <Button
            type="dashed"
            onClick={onClose}
            className="flex-1 h-11 border-[1.5px] border-slate-200 bg-white text-slate-600 hover:text-slate-800 hover:border-slate-400 rounded-[14px] font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-slate-100"
          >
            {t('gate.ticket.close')}
          </Button>
          <Button
            type="primary"
            onClick={handlePrint}
            icon={<Printer size={15} />}
            className={`flex-1 h-11 border-none font-bold rounded-[14px] flex items-center justify-center gap-1.5 text-white shadow-[0_12px_24px_-10px_rgba(79,70,229,0.7)] transition-all hover:-translate-y-0.5
              ${isTicket ? 'bg-gradient-to-br from-indigo-500 to-indigo-600' : 'bg-gradient-to-br from-emerald-500 to-emerald-600'}`}
          >
            {t('gate.ticket.print')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default TicketModal;
