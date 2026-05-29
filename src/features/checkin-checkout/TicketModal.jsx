import React from 'react';
import { Modal, Button } from 'antd';
import { Printer, QrCode, Barcode, CheckCircle2, Ticket } from 'lucide-react';

const TicketModal = ({ isOpen, onClose, details, type = 'ticket' }) => {
  if (!details) return null;

  const formatVND = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const handlePrint = () => {
    window.print();
  };

  const isTicket = type === 'ticket';

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
      <div className="flex flex-col items-center justify-center p-5 bg-slate-50 text-slate-800 rounded-xl relative overflow-hidden select-none">
        
        {/* Glow ambient background border top */}
        <div className={`absolute top-0 w-full h-1 bg-gradient-to-r ${isTicket ? 'from-indigo-500 to-sky-400' : 'from-emerald-500 to-teal-400'}`}></div>
        
        {/* Top Header */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-extrabold uppercase tracking-wider mb-2 mt-2">
          {isTicket ? <Ticket size={14} className="text-indigo-600"/> : <CheckCircle2 size={14} className="text-emerald-600"/>}
          <span>SpotFlow Parking Counter</span>
        </div>
        <span className="text-[10px] text-slate-500 mb-6 font-bold">B10, Ring Road 3, Cau Giay, Hanoi</span>

        {/* Paper Container Mock (Light thermal paper background) */}
        <div className="w-full bg-white border border-slate-200/80 rounded-xl p-5 space-y-4 shadow-sm">
          <div className="text-center pb-3 border-b border-dashed border-slate-200">
            <span className="text-[10.5px] text-slate-500 font-bold uppercase tracking-wider">{isTicket ? 'Check-In RFID Ticket' : 'Payment Bill Receipt'}</span>
            <h2 className="text-2xl font-mono font-extrabold text-slate-800 mt-1 tracking-wide">
              {details.id}
            </h2>
          </div>

          <div className="space-y-2.5 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500">PLATE NUMBER:</span>
              <span className="text-slate-800 font-extrabold">{details.plate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">VEHICLE CLASS:</span>
              <span className="text-slate-800 font-bold">{details.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">ASSIGNED SLOT:</span>
              <span className="text-indigo-600 font-extrabold">{details.slotId}</span>
            </div>
            
            <div className="h-px bg-slate-100 my-1"></div>

            <div className="flex justify-between">
              <span className="text-slate-500">ENTRY DATE:</span>
              <span className="text-slate-700 font-medium">
                {new Date(details.checkInTime).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">ENTRY TIME:</span>
              <span className="text-slate-700 font-medium">
                {new Date(details.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>

            {!isTicket && details.checkOutTime && (
              <>
                <div className="flex justify-between">
                  <span className="text-slate-500">EXIT TIME:</span>
                  <span className="text-slate-700 font-medium">
                    {new Date(details.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
                
                <div className="h-px bg-slate-100 my-1"></div>
                
                <div className="flex justify-between items-center text-sm pt-2">
                  <span className="text-slate-500 font-extrabold">TOTAL PAID:</span>
                  <span className="text-emerald-600 font-extrabold text-base">{formatVND(details.fee)}</span>
                </div>
              </>
            )}
          </div>

          {/* QR / Barcode Mock (Clean white container for scanning legibility) */}
          <div className="flex flex-col items-center justify-center pt-3 border-t border-dashed border-slate-200">
            {isTicket ? (
              <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                <QrCode size={110} className="text-slate-800" />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5 p-2.5 bg-white rounded border border-slate-200 w-full text-center shadow-sm">
                <Barcode size={48} className="text-slate-800 w-full" />
                <span className="text-[9px] font-mono text-slate-500 font-bold tracking-widest">{details.plate}-{details.id}</span>
              </div>
            )}
            <span className="text-[10.5px] text-slate-500 text-center mt-3 leading-normal font-medium px-2">
              {isTicket ? 'Scan at gate scanner to verify check-out.' : 'Thank you for using SpotFlow services!'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 w-full mt-6">
          <Button
            type="dashed"
            onClick={onClose}
            className="flex-1 h-10 border-slate-300 text-slate-500 hover:text-slate-700 hover:border-slate-400 rounded-lg font-bold"
          >
            Close Dialog
          </Button>
          <Button
            type="primary"
            onClick={handlePrint}
            icon={<Printer size={15} />}
            className={`flex-1 h-10 border-none font-bold rounded-lg flex items-center justify-center gap-1.5 
              ${isTicket ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-emerald-600 hover:bg-emerald-500'}`}
          >
            Print Ticket
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default TicketModal;
