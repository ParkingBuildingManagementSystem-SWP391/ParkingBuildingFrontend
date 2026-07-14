import React, { useState, useEffect, useCallback } from 'react';
import { Card, Form, Input, Button, Alert, Tag, Upload, Modal, Descriptions, Image, Radio } from 'antd';
import { useTranslation } from 'react-i18next';
import { parkingService } from '../../services/parkingService';
import { staffService } from '../../services/staffService';
import { useAuth } from '../../context/AuthContext';
import { toast as message } from '../../components/ToastProvider';
import Webcam from 'react-webcam';
import {
  CheckCircle,
  Clock,
  CreditCard,
  Sparkles,
  MonitorPlay,
  RefreshCw,
  Check,
  LogIn,
  LogOut,
  ScanLine,
  Camera,
  Upload as UploadIcon,
  ShieldCheck,
  QrCode,
  Wallet,
  Banknote,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import TicketModal from './TicketModal';
import QrScannerModal from './QrScannerModal';
import CreateIncidentModal from './CreateIncidentModal';
import { formatVietnamDateTime } from '../../utils/dateTime';


const dataURLtoFile = (dataurl, filename) => {
  try {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    let bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    return new File([u8arr], filename, { type: mime });
  } catch (err) {
    console.error("Failed to convert captured webcam image:", err);
    return null;
  }
};

const resizeAndCompressImage = (input, filename, maxWidth = 1280, maxHeight = 720, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    
    if (input instanceof File || input instanceof Blob) {
      img.src = URL.createObjectURL(input);
    } else if (typeof input === 'string') {
      img.src = input;
    } else {
      reject(new Error("Invalid input type. Must be a File, Blob, or base64 dataURL."));
      return;
    }

    img.onload = () => {
      if (input instanceof File || input instanceof Blob) {
        URL.revokeObjectURL(img.src);
      }

      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], filename, { type: 'image/jpeg' });
          resolve(file);
        } else {
          reject(new Error("Canvas export failed"));
        }
      }, 'image/jpeg', quality);
    };

    img.onerror = (err) => {
      if (input instanceof File || input instanceof Blob) {
        URL.revokeObjectURL(img.src);
      }
      reject(err);
    };
  });
};


const scanKeyframes = `
@keyframes laserScan {
  0% { top: 0; opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { top: 100%; opacity: 0; }
}
.animate-laser-scan {
  animation: laserScan 1.5s linear infinite;
}
`;

const SmartCamera = ({ type, color, onCapture, onClear, previewUrl, isScanning, ocrResult, onTurnOn, isWebcamOn, onUpload, onRetry }) => {
  const { t } = useTranslation();
  const webcamRef = React.useRef(null);
  const cameraLabel = type === 'Entry' ? t('gate.camera.entry') : type === 'Exit' ? t('gate.camera.exit') : type;

  const theme = {
    emerald: {
      border: "border-emerald-500",
      borderHover: "hover:border-emerald-400 hover:text-emerald-600",
      bg: "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/40",
      text: "text-emerald-400",
      borderSoft: "border-emerald-500/30",
      shadowHex: "#34d399",
      bgLaser: "bg-emerald-400"
    },
    rose: {
      border: "border-indigo-500",
      borderHover: "hover:border-indigo-400 hover:text-indigo-600",
      bg: "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/40",
      text: "text-indigo-400",
      borderSoft: "border-indigo-500/30",
      shadowHex: "#818cf8",
      bgLaser: "bg-indigo-400"
    }
  }[color];

  const handleCaptureClick = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      onCapture(imageSrc);
    }
  };

  return (
    <>
      <style>{scanKeyframes}</style>
      <div className={`relative aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-slate-500 gap-1.5 group hover:border-slate-700 transition-colors mb-4 ${isWebcamOn ? '' : 'p-2'}`}>
        {isWebcamOn ? (
          <>
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: "environment" }}
              className="w-full h-full object-cover"
            />
            <div className={`absolute inset-0 pointer-events-none border ${theme.borderSoft}`}>
              <div className={`absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 ${theme.border}`}></div>
              <div className={`absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 ${theme.border}`}></div>
              <div className={`absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 ${theme.border}`}></div>
              <div className={`absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 ${theme.border}`}></div>
            </div>
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              <button
                type="button"
                onClick={handleCaptureClick}
                className={`${theme.bg} text-white rounded-full p-3 shadow-lg border-2 border-white/20 transition-all active:scale-95`}
              >
                <div className="w-6 h-6 border-2 border-white rounded-full"></div>
              </button>
            </div>
          </>
        ) : previewUrl ? (
          <>
            <img src={previewUrl} alt="Ảnh xe" className="w-full h-full object-contain bg-slate-950 rounded-2xl" />

            {isScanning && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                <div
                  className={`w-full h-0.5 ${theme.bgLaser} absolute left-0 animate-laser-scan`}
                  style={{ boxShadow: `0 0 15px ${theme.shadowHex}` }}
                ></div>
                <div className="absolute inset-0 bg-indigo-500/10 animate-pulse mix-blend-overlay"></div>
              </div>
            )}

            <div className={`absolute bottom-1.5 left-1.5 right-1.5 ${ocrResult === t('gate.camera.needCheck') ? 'bg-amber-500/90 text-white' : 'bg-slate-900/90'} px-2.5 py-1.5 rounded-xl flex items-center justify-between text-[10px] font-mono shadow-md backdrop-blur-sm`}>
              <span className="text-white/80 font-bold uppercase text-[8px] flex items-center gap-1"><ScanLine size={10} />{cameraLabel}</span>
              <span className={`font-semibold truncate max-w-[180px] ${ocrResult === t('gate.camera.needCheck') ? 'text-white' : (ocrResult && !isScanning ? 'text-emerald-400' : 'text-slate-500')}`}>
                {isScanning ? t('gate.camera.aiScanning') : (ocrResult || t('gate.camera.localImage'))}
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:border-slate-700 transition-colors">
              <MonitorPlay size={22} className={`text-slate-700 group-hover:${theme.text} transition-colors`} />
            </div>
            <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase text-center mt-1">{t('gate.camera.preview')} {cameraLabel}</span>
            <span className="text-[8px] text-slate-600 font-bold tracking-widest uppercase">{t('gate.camera.turnOnOrUpload')}</span>
          </>
        )}
      </div>

      <div className="flex gap-2.5 mb-4">
        {!isWebcamOn && !previewUrl && (
          <>
            <Button
              onClick={onTurnOn}
              className={`flex-1 h-11 border-[1.5px] border-slate-200 ${theme.borderHover} rounded-[14px] flex items-center justify-center gap-1.5 font-bold shadow-sm`}
            >
              <Camera size={15} /> {t('gate.camera.turnOn')}
            </Button>
            <Upload
              accept="image/*"
              beforeUpload={(file) => {
                const isImage = file.type.startsWith('image/');
                if (!isImage) { message.error(t('gate.camera.uploadOnlyImage')); return Upload.LIST_IGNORE; }
                if (file.size / 1024 / 1024 >= 5) { message.error(t('gate.camera.imageSizeLimit')); return Upload.LIST_IGNORE; }
                onUpload(file);
                return false;
              }}
              showUploadList={false}
              className="flex-1 flex"
            >
              <Button className="w-full h-11 border-[1.5px] border-slate-200 hover:border-indigo-400 hover:text-indigo-600 rounded-[14px] flex items-center justify-center gap-1.5 font-bold shadow-sm">
                <UploadIcon size={15} /> {t('gate.camera.upload')}
              </Button>
            </Upload>
          </>
        )}

        {(isWebcamOn || previewUrl) && !isScanning && (
          <div className="flex gap-2.5 w-full">
            {previewUrl && onRetry && (
              <Button
                onClick={onRetry}
                className="flex-1 h-11 text-indigo-600 border-[1.5px] border-slate-200 hover:text-indigo-600 hover:border-indigo-400 rounded-[14px] font-bold"
              >
                {t('gate.camera.retake')}
              </Button>
            )}
            <Button
              onClick={onClear}
              className="flex-1 h-11 text-slate-500 border-[1.5px] border-slate-200 hover:text-rose-500 hover:border-rose-400 rounded-[14px] font-bold"
            >
              {isWebcamOn ? t('gate.camera.turnOff') : t('gate.camera.clearData')}
            </Button>
          </div>
        )}
      </div>
    </>
  );
};


const BookingCheckInModal = ({ isOpen, onClose, data }) => {
  const { t } = useTranslation();
  if (!data) return null;

  return (
    <Modal
      title={<span className="font-extrabold text-slate-900 text-base uppercase tracking-tight flex items-center gap-2"><CheckCircle size={18} className="text-emerald-500" />Xác nhận Check-in</span>}
      open={isOpen}
      onCancel={onClose}
      footer={[
        <Button
          key="ok"
          type="primary"
          onClick={onClose}
          className="h-11 bg-gradient-to-br from-emerald-500 to-emerald-600 hover:!from-emerald-400 hover:!to-emerald-500 border-none font-bold rounded-[14px] px-6 shadow-md transition-all"
        >
          Xác nhận cho xe vào
        </Button>
      ]}
      centered
      width={480}
      destroyOnClose
    >
      <div className="space-y-4 py-3">
        {/* Vị trí ô đỗ được Backend cấp động */}
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/40 border border-emerald-100 rounded-2xl p-5 text-center shadow-sm">
          <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-widest block mb-1">Vị trí ô đỗ phân phối</span>
          <span className="text-4xl font-black text-emerald-700 tracking-wide">{data.slotName || data.SlotName || "N/A"}</span>
        </div>

        {/* Bảng chi tiết thông tin */}
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
          <div className="flex justify-between border-b border-slate-200/60 pb-2 text-xs">
            <span className="text-slate-500 font-bold uppercase tracking-wider">Họ và tên chủ thẻ</span>
            <span className="text-slate-900 font-black">{data.driverName || data.DriverName || data.fullName || data.FullName || "N/A"}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200/60 pb-2 text-xs">
            <span className="text-slate-500 font-bold uppercase tracking-wider">Số điện thoại</span>
            <span className="text-slate-900 font-bold font-mono">{data.driverPhone || data.DriverPhone || data.phoneNumber || data.PhoneNumber || "N/A"}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200/60 pb-2 text-xs">
            <span className="text-slate-500 font-bold uppercase tracking-wider">Biển số xe</span>
            <span className="text-slate-900 font-black font-mono">{data.licenseVehicle || data.LicenseVehicle || "N/A"}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500 font-bold uppercase tracking-wider">Loại phương tiện</span>
            <span className="text-slate-900 font-bold">{data.vehicleTypeName || data.VehicleTypeName || data.vehicleType || "Car"}</span>
          </div>
        </div>
      </div>
    </Modal>
  );
};


const GateController = () => {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const [checkInForm] = Form.useForm();
  const [checkOutForm] = Form.useForm();
  const [endShiftForm] = Form.useForm();

  // Shift States
  const [activeShift, setActiveShift] = useState(null);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isEndShiftModalOpen, setIsEndShiftModalOpen] = useState(false);
  const [loadingShift, setLoadingShift] = useState(false);

  const checkActiveShift = async () => {
    try {
      const res = await staffService.getActiveShift();
      if (res && res.hasActiveShift) {
        setActiveShift(res.data);
        setIsShiftModalOpen(false);
      } else {
        setActiveShift(null);
        setIsShiftModalOpen(true);
      }
    } catch (err) {
      console.error("Lỗi kiểm tra ca trực:", err);
      setIsShiftModalOpen(true);
    }
  };

  useEffect(() => {
    checkActiveShift();
  }, []);

  const handleStartShift = async () => {
    setLoadingShift(true);
    try {
      const res = await staffService.startShift();
      if (res && res.isSuccess) {
        message.success("Mở ca trực thành công!");
        setActiveShift(res.data);
        setIsShiftModalOpen(false);
      } else {
        message.error(res?.message || "Không thể mở ca trực.");
      }
    } catch (err) {
      message.error(err.response?.data?.message || err.message || "Lỗi mở ca trực.");
    } finally {
      setLoadingShift(false);
    }
  };

  const handleEndShiftSubmit = async (values) => {
    setLoadingShift(true);
    try {
      const res = await staffService.endShift({
        actualCash: Number(values.actualCash || 0),
        notes: values.notes || ""
      });
      if (res && res.isSuccess) {
        message.success("Đóng ca trực thành công! Hệ thống tự động đăng xuất.");
        setIsEndShiftModalOpen(false);
        endShiftForm.resetFields();
        setActiveShift(null);
        setTimeout(() => {
          logout();
        }, 1500);
      } else {
        message.error(res?.message || "Không thể đóng ca trực.");
      }
    } catch (err) {
      message.error(err.response?.data?.message || err.message || "Lỗi đóng ca trực.");
    } finally {
      setLoadingShift(false);
    }
  };

  const [isLocalQrScannerOpen, setIsLocalQrScannerOpen] = useState(false);
  const [qrScannerTarget, setQrScannerTarget] = useState('entry'); // 'entry' or 'exit'
  const [isCreateIncidentOpen, setIsCreateIncidentOpen] = useState(false);
  const [isCheckInConfirmOpen, setIsCheckInConfirmOpen] = useState(false);
  const [bookingCheckInData, setBookingCheckInData] = useState(null);
  const qrInputRef = React.useRef(null);
  const entryQrInputRef = React.useRef(null);

  const handleLocalQrScanSuccess = async (decodedText) => {
    if (qrScannerTarget === 'entry') {
      checkInForm.setFieldsValue({ ticketCode: decodedText });
      message.success(t('gate.messages.scanBookingSuccess', { code: decodedText }));

      const currentPlate = checkInForm.getFieldValue('plate');
      if (!currentPlate) {
        try {
          const res = await parkingService.scanCheckIn(decodedText);
          const isSuccess = res?.isSuccess || res?.IsSuccess || (res && !res.error);

          if (isSuccess) {
            const plateFromDb = res.data?.licenseVehicle || res.data?.LicenseVehicle || res.licenseVehicle || res.LicenseVehicle;
            if (plateFromDb) {
              checkInForm.setFieldsValue({ plate: plateFromDb });
              if (plateFromDb.toUpperCase().startsWith('BIKE_')) {
                checkInForm.setFieldsValue({ type: 'Bicycle' });
              }
            }
          }
        } catch (err) {
          console.error("KhÃ´ng thá»ƒ tá»± Ä‘á»™ng truy váº¥n biá»ƒn sá»‘ tá»« mÃ£ QR cá»•ng vÃ o:", err);
        }
      }
    } else {
      checkOutForm.setFieldsValue({ ticketCode: decodedText });
      message.success(t('gate.messages.scanTicketSuccess', { code: decodedText }));

      // TỰ ĐỘNG TRA CỨU BIỂN SỐ NẾU Ô BIỂN SỐ ĐANG TRỐNG (Hỗ trợ xe đạp & lỗi camera)
      const currentPlate = checkOutForm.getFieldValue('plate');
      if (!currentPlate) {
        try {
          const res = await parkingService.scanCheckOut(decodedText);
          const isSuccess = res?.isSuccess || res?.IsSuccess || (res && !res.error);
          
          if (isSuccess) {
            const plateFromDb = res.data?.licenseVehicle || res.data?.LicenseVehicle || res.licenseVehicle;
            if (plateFromDb) {
              checkOutForm.setFieldsValue({ plate: plateFromDb });
              // Nếu là xe đạp, cập nhật exitOcrResult để mở khóa các trạng thái khác
              if (plateFromDb.toUpperCase().startsWith('BIKE_')) {
                setExitOcrResult(plateFromDb);
              }
            }
          }
        } catch (err) {
          console.error("Không thể tự động truy vấn biển số từ mã QR:", err);
        }
      }

      // Tự động submit sau khi điền đầy đủ dữ liệu
      setTimeout(() => {
        checkOutForm.submit();
      }, 500);
    }
  };


  // Frontend-only image upload/preview states
  const [entryImagePreviewUrl, setEntryImagePreviewUrl] = useState(null);
  const [exitImagePreviewUrl, setExitImagePreviewUrl] = useState(null);

  const [entryWebcamOn, setEntryWebcamOn] = useState(false);
  const [entryScanning, setEntryScanning] = useState(false);
  const [entryOcrResult, setEntryOcrResult] = useState(null);

  const [exitWebcamOn, setExitWebcamOn] = useState(false);
  const [exitScanning, setExitScanning] = useState(false);
  const [exitOcrResult, setExitOcrResult] = useState(null);

  // Checkout result and verification modal states
  const [checkoutResult, setCheckoutResult] = useState(null);
  const [isCheckoutResultModalOpen, setIsCheckoutResultModalOpen] = useState(false);

  // States to manage print receipts/tickets
  const [ticketDetails, setTicketDetails] = useState(null);
  const [receiptDetails, setReceiptDetails] = useState(null);
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // New checkout payment states
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('AUTO');
  const [cashReceived, setCashReceived] = useState('');
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [changeDue, setChangeDue] = useState(null);



  // Cleanup object URLs on unmount or before creating new ones
  useEffect(() => {
    return () => {
      if (entryImagePreviewUrl) URL.revokeObjectURL(entryImagePreviewUrl);
      if (exitImagePreviewUrl) URL.revokeObjectURL(exitImagePreviewUrl);
    };
  }, [entryImagePreviewUrl, exitImagePreviewUrl]);

  // Auto-fill Entry Camera feeds on typing
  const handlePlateChange = () => {};

  // Auto-fill Exit Camera feeds on typing
  const handleCheckOutPlateChange = () => {};

  const VEHICLE_TYPE_MAP = {
    Bicycle: 1,
    Motorbike: 2,
    Car: 3
  };

  const getVehicleTypeLabel = (type) => {
    if (type === 'Car') return 'Ô tô';
    if (type === 'Motorbike' || type === 'Motorcycle') return 'Xe máy';
    if (type === 'Bicycle') return 'Xe đạp';
    return type || 'N/A';
  };

  // Perform Check-in (Supports both Walk-in and Reservation QR code)
  const handleCheckInSubmit = async (values) => {
    try {
      const tempImageUrl = values.tempImageUrl || null;

      // CHẶN CỨNG: Bắt buộc phải có ảnh chụp cổng vào
      if (!tempImageUrl) {
        message.error("Vui lòng chụp ảnh hoặc tải ảnh xe lên trước khi check-in!");
        return;
      }

      // Tự động nhận diện chế độ dựa trên việc ô QR có dữ liệu hay không
      const ticketCode = values.ticketCode?.trim();
      const licenseVehicle = values.plate?.trim().toUpperCase();
      const isQrFlow = Boolean(ticketCode);

      if (!isQrFlow) {
        const vehicleTypeId = VEHICLE_TYPE_MAP[values.type] || 3;
        let finalPlate = licenseVehicle;
        if (vehicleTypeId === 1 && !finalPlate) {
          finalPlate = `BIKE_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
        }

        const response = await parkingService.walkInCheckIn(finalPlate, vehicleTypeId, tempImageUrl);

        if (response && response.isSuccess) {
          const ticket = {
            id: response.data?.ticketCode || response.data?.TicketCode || "N/A",
            plate: response.data?.licenseVehicle || response.data?.LicenseVehicle || finalPlate,
            type: values.type,
            slotId: response.data?.slotName || response.data?.SlotName || "N/A",
            checkInTime: response.data?.checkInTime || response.data?.CheckInTime || new Date().toISOString(),
            sessionId: response.data?.sessionId || response.data?.SessionId || null // Ánh xạ Session ID từ BE
          };

          setTicketDetails(ticket);
          setIsTicketOpen(true);
          message.success(response.message || t('gate.messages.walkinSuccess'));

          checkInForm.resetFields();
          if (entryImagePreviewUrl) {
            URL.revokeObjectURL(entryImagePreviewUrl);
            setEntryImagePreviewUrl(null);
          }
          setEntryOcrResult(null);
        } else {
          message.error(response?.message || t('gate.messages.checkinFailed'));
        }
      } else {
        // Reservation / Membership mode
        if (ticketCode?.startsWith('MBC_') && !licenseVehicle) {
          message.warning('Vui lòng nhập biển số xe đang vào bãi trước khi check-in thẻ thành viên!');
          return;
        }

        const response = await parkingService.checkInVehicle(ticketCode, licenseVehicle, tempImageUrl);
        const isSuccess = response?.isSuccess || response?.IsSuccess || response?.success || (response && !response.error);
        const requiresWalkIn = response?.requiresWalkIn || response?.RequiresWalkIn || false;
        
        if (isSuccess) {
          setBookingCheckInData(response.data || response);
          setIsCheckInConfirmOpen(true);
          message.success(response.message || t('gate.messages.bookingSuccess'));
          checkInForm.resetFields();
          if (entryImagePreviewUrl) {
            URL.revokeObjectURL(entryImagePreviewUrl);
            setEntryImagePreviewUrl(null);
          }
          setEntryOcrResult(null);
        } else {
          if (requiresWalkIn) {
            Modal.confirm({
              title: 'Thẻ thành viên đang được sử dụng',
              content: `${response?.message || 'Thẻ đang có xe khác trong bãi.'} Bạn có muốn check-in xe này theo hình thức vãng lai không?`,
              okText: 'Đồng ý - Check-in vãng lai',
              cancelText: 'Hủy',
              onOk: async () => {
                try {
                  const vehicleTypeId = VEHICLE_TYPE_MAP[values.type] || 2;
                  const result = await parkingService.walkInCheckIn(
                    licenseVehicle,
                    vehicleTypeId,
                    tempImageUrl
                  );

                  if (result?.isSuccess || result?.IsSuccess || result?.success) {
                    message.success('Check-in vãng lai thành công!');
                    checkInForm.resetFields();
                  } else {
                    message.error(result?.message || 'Check-in vãng lai thất bại.');
                  }
                } catch (walkInErr) {
                  const msg =
                    walkInErr?.response?.data?.message ||
                    walkInErr?.message ||
                    'Check-in vãng lai thất bại.';
                  message.error(msg);
                }
              },
            });

            return;
          }

          message.error(response?.message || t('gate.messages.bookingFailed'));
        }
      }
    } catch (err) {
      console.error("Check-in Error:", err);
      message.error(err.message || String(err));
    }
  };

  // Unified exit check-out handler (Supports matching by ticketCode + licensePlate)
  const handleCheckOut = async (paymentMethod = 'AUTO', plateToUse = null) => {
    const plate = plateToUse || checkOutForm.getFieldValue('plate');
    const ticketCode = checkOutForm.getFieldValue('ticketCode');
    const tempImageUrl = checkOutForm.getFieldValue('tempImageUrl') || null;
    
    // 1. Cho phép gửi check-out nếu có biển số HOẶC mã QR vé
    if (!plate && !ticketCode) {
      message.error("Vui lòng nhập biển số xe hoặc quét mã QR vé!");
      return;
    }

    // 2. CHẶN CỨNG: Bắt buộc phải chụp ảnh xe ở cổng ra trước khi check-out
    if (!tempImageUrl) {
      message.error("Vui lòng chụp ảnh hoặc tải ảnh xe ở cổng ra trước khi check-out!");
      return;
    }

    // Tiến hành gọi API check-out của backend
    setSelectedPaymentMethod(paymentMethod);
    setCashReceived('');
    setChangeDue(null);

    try {
      // Call the real checkOutVehicle API on backend with VNPAY or CASH
      const result = await parkingService.checkOutVehicle(
        ticketCode ? ticketCode.trim() : null,
        plate,
        tempImageUrl,
        null,
        paymentMethod
      );

      setCheckoutResult(result);
      setIsCheckoutResultModalOpen(true);

      const isSuccess = result.isSuccess || result.IsSuccess;
      const isPaid = result.isPaid !== undefined ? result.isPaid : result.IsPaid;
      const messageText = result.message || result.Message;
      const resultPaymentMethod = result.paymentMethod || result.PaymentMethod;
      const paymentUrl = result.paymentUrl || result.PaymentUrl;

      if (resultPaymentMethod) {
        setSelectedPaymentMethod(String(resultPaymentMethod).toUpperCase());
      } else if (paymentUrl) {
        setSelectedPaymentMethod('VNPAY');
      }

      if (isSuccess === false) {
        message.warning(messageText || t('gate.messages.plateMismatch'));
      } else {
        const totalAmt = result.totalAmount || result.TotalAmount || 0;
        setCashReceived(totalAmt.toString());
        if (isPaid) {
          message.success(messageText || t('gate.messages.prePaidCheckout'));
          setTimeout(() => {
            handleCloseCheckoutResultModal();
          }, 3000);
        } else {
          message.success(t('gate.messages.checkoutOpened'));
        }
      }
    } catch (err) {
      console.error("Check-out Error:", err);
      message.error(String(err));
    }
  };

  const [isSwitchingPayment, setIsSwitchingPayment] = useState(false);

  const handleSwitchPaymentMethodInModal = async (newMethod) => {
    if (isSwitchingPayment) return;

    const plate = checkOutForm.getFieldValue('plate');
    const ticketCode = checkOutForm.getFieldValue('ticketCode');
    const tempImageUrl = checkOutForm.getFieldValue('tempImageUrl') || null;

    setIsSwitchingPayment(true);
    setSelectedPaymentMethod(newMethod);

    try {
      const result = await parkingService.checkOutVehicle(
        ticketCode ? ticketCode.trim() : null,
        plate,
        tempImageUrl,
        null,
        newMethod
      );
      setCheckoutResult(result);

      const isPaid = result.isPaid !== undefined ? result.isPaid : result.IsPaid;
      const totalAmt = result.totalAmount || result.TotalAmount || 0;

      if (newMethod === 'CASH') {
        setCashReceived(totalAmt.toString());
      }

      message.success(t('gate.messages.switchPayment', { method: newMethod === 'VNPAY' ? t('gate.messages.vnpay') : t('gate.messages.cash') }));
    } catch (err) {
      console.error("Switch payment method error:", err);
      message.error(String(err));
    } finally {
      setIsSwitchingPayment(false);
    }
  };

  // Perform Check-out (form submit)
  const handleCheckOutSubmit = (values) => {
    const ticketCode = values.ticketCode?.trim();
    
    // Định tuyến thông minh nếu quét nhầm mã đặt chỗ (booking) vào cổng ra
    if (ticketCode && ticketCode.includes('SLOT:') && !ticketCode.includes('TICKET:WK_') && !ticketCode.startsWith('WK_')) {
      checkOutForm.setFieldsValue({ ticketCode: '' });
      checkInForm.setFieldsValue({ ticketCode });
      message.info(t('gate.messages.autoRouteToCheckIn'));
      setTimeout(() => {
        entryQrInputRef.current?.focus();
      }, 100);
      return;
    }

    // Mặc định gọi check-out bằng CASH để mở Modal hóa đơn
    handleCheckOut('AUTO');
  };

  // Cash payment confirmation handler
  const handleConfirmCashPayment = async () => {
    const ticketCode = checkoutResult?.ticketCode || checkoutResult?.TicketCode;
    const totalAmount = checkoutResult?.totalAmount || checkoutResult?.TotalAmount || 0;

    if (!ticketCode) {
      message.error(t('gate.messages.invalidTicket'));
      return;
    }

    const amount = parseFloat(cashReceived);
    if (isNaN(amount) || amount < totalAmount) {
      message.error(t('gate.messages.minAmount', { amount: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAmount) }));
      return;
    }

    try {
      const res = await parkingService.processCashPayment(ticketCode, amount);
      if (res && res.success) {
        message.success(res.message || t('gate.messages.cashSuccess'));
        setChangeDue(res.changeDue);
        setCheckoutResult(prev => ({
          ...prev,
          isPaid: true,
          IsPaid: true,
          message: t('gate.messages.cashComplete')
        }));
        setTimeout(() => {
          handleCloseCheckoutResultModal();
        }, 3000);
      } else {
        message.error(res?.message || t('gate.messages.cashFailed'));
      }
    } catch (err) {
      console.error("Confirm cash payment error:", err);
      message.error(String(err));
    }
  };

  // Refresh VNPay Payment Status
  const handleRefreshPaymentStatus = async () => {
    const invoiceId = checkoutResult?.invoiceId || checkoutResult?.InvoiceId;
    if (!invoiceId) {
      message.error(t('gate.messages.invalidTicket'));
      return;
    }

    setIsCheckingStatus(true);
    try {
      const res = await parkingService.getPaymentStatus(invoiceId);
      if (res && (res.status === 'SUCCESS' || res.status === 'SUCCESS'.toLowerCase() || res.status === 'SUCCESS'.toUpperCase())) {
        message.success(t('gate.messages.vnpaySuccess'));
        setCheckoutResult(prev => ({
          ...prev,
          isPaid: true,
          IsPaid: true,
          message: t('gate.messages.vnpayComplete')
        }));
        setTimeout(() => {
          handleCloseCheckoutResultModal();
        }, 2000);
      } else {
        message.info(t('gate.messages.vnpayPending'));
      }
    } catch (err) {
      console.error("Refresh payment status error:", err);
      message.error(String(err));
    } finally {
      setIsCheckingStatus(false);
    }
  };

  // Auto-polling payment status for VNPay
  useEffect(() => {
    let intervalId;
    const isPaid = checkoutResult?.isPaid || checkoutResult?.IsPaid;
    const invoiceId = checkoutResult?.invoiceId || checkoutResult?.InvoiceId;

    if (isCheckoutResultModalOpen && selectedPaymentMethod === 'VNPAY' && !isPaid && invoiceId) {
      intervalId = setInterval(async () => {
        try {
          const res = await parkingService.getPaymentStatus(invoiceId);
          if (res && (res.status === 'SUCCESS' || res.status === 'SUCCESS'.toLowerCase() || res.status === 'SUCCESS'.toUpperCase())) {
            message.success(t('gate.messages.vnpayConfirmed'));
            setCheckoutResult(prev => ({
              ...prev,
              isPaid: true,
              IsPaid: true,
              message: t('gate.messages.vnpayComplete')
            }));
            clearInterval(intervalId);
            setTimeout(() => {
              handleCloseCheckoutResultModal();
            }, 2000);
          }
        } catch (err) {
          console.error("Polling payment status failed:", err);
        }
      }, 3000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isCheckoutResultModalOpen, selectedPaymentMethod, checkoutResult]);

  // Immediate check-out shortcut from table list
  const handleDirectCheckOut = (plate) => {
    if (!plate) {
      message.info(t('gate.messages.directCheckoutInfo'));
      const exitCard = document.getElementById('exit-gate-card');
      if (exitCard) {
        exitCard.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }
    checkOutForm.setFieldsValue({ plate });
    message.info(t('gate.messages.directCheckoutSelected', { plate }));
    const exitCard = document.getElementById('exit-gate-card');
    if (exitCard) {
      exitCard.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCloseCheckoutResultModal = () => {
    setIsCheckoutResultModalOpen(false);
    setCheckoutResult(null);
    setChangeDue(null);

    checkOutForm.resetFields();
    if (exitImagePreviewUrl) {
      URL.revokeObjectURL(exitImagePreviewUrl);
      setExitImagePreviewUrl(null);
    }
  };



  return (
    <div className="space-y-6 pb-12 font-sans select-none bg-slate-50 dark:bg-slate-950">

      {/* Shift Control Banner */}
      {activeShift && (
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center dark:bg-indigo-950 dark:text-indigo-400">
              <Clock size={20} />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100">{t('staffShifts.shiftId')} #{activeShift.shiftId}</span>
                <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700 ring-1 ring-inset ring-indigo-200">{t('staffShifts.shiftBannerActive')}</span>
              </div>
              <span className="text-xs text-slate-500 mt-0.5">{t('staffShifts.shiftBannerStart')} {formatVietnamDateTime(activeShift.startTime)} • {t('staffShifts.shiftBannerSystem')} <span className="font-bold text-indigo-600">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(activeShift.systemCash || 0)}</span></span>
            </div>
          </div>
          <Button
            type="primary"
            danger
            onClick={() => setIsEndShiftModalOpen(true)}
            className="rounded-xl font-bold bg-rose-600 hover:bg-rose-700 border-none h-10 px-5 flex items-center gap-1.5"
          >
            {t('staffShifts.shiftBannerBtn')}
          </Button>
        </div>
      )}

      {/* TOP ROW - TWO COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* LEFT COLUMN: Entry Gate Control */}
        <div className="space-y-6">
          <Card
            title={
              <div className="flex items-center justify-between w-full py-1">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center dark:border-emerald-500/40 dark:bg-emerald-500/15">
                    <LogIn size={18} className="text-emerald-600" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-extrabold text-slate-900 tracking-tight leading-tight dark:text-slate-100">{t('gate.entryTitle')}</span>
                  </div>
                  <span className="ml-1 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
                </div>
              </div>
            }
            className="rounded-2xl border border-slate-100 shadow-sm overflow-hidden dark:border-slate-700 dark:bg-slate-900"
            bodyStyle={{ padding: '20px' }}
          >
            <SmartCamera
              type="Entry"
              color="emerald"
              isWebcamOn={entryWebcamOn}
              onTurnOn={() => setEntryWebcamOn(true)}
              previewUrl={entryImagePreviewUrl}
              isScanning={entryScanning}
              ocrResult={entryOcrResult}
              onCapture={async (imageSrc) => {
                setEntryWebcamOn(false);
                setEntryImagePreviewUrl(imageSrc);
                setEntryScanning(true);
                setEntryOcrResult(null);
                checkInForm.setFieldValue('tempImageUrl', null);
                try {
                  const file = await resizeAndCompressImage(imageSrc, "entry_capture.jpg", 1280, 720, 0.8);
                  if (!file) throw new Error("Ảnh chụp không hợp lệ.");
                  const type = checkInForm.getFieldValue('type') || 'Car';
                  const typeId = VEHICLE_TYPE_MAP[type] || 3;

                  // NẾU LÀ XE ĐẠP: Bỏ qua nhận diện biển số
                  if (type === 'Bicycle') {
                    const result = await parkingService.recognizeLicensePlate(file, typeId);
                    const rawImageUrl = result?.rawImageUrl || result?.ImageUrl;
                    
                    const randomBikePlate = `BIKE_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
                    setEntryOcrResult(randomBikePlate);
                    checkInForm.setFieldsValue({
                      plate: randomBikePlate,
                      tempImageUrl: rawImageUrl
                    });
                    message.success(t('gate.messages.bicycleExitImage') || "Đã lưu ảnh xe đạp!");
                  } else {
                    // XE MÁY / Ô TÔ: Chạy nhận diện biển số bình thường
                    const result = await parkingService.recognizeLicensePlate(file, typeId);
                    const isSuccess = result?.isSuccess || result?.IsSuccess;
                    const predictedPlate = result?.predictedPlate || result?.PredictedPlate;
                    const imageUrl = result?.imageUrl || result?.ImageUrl;
                    const rawImageUrl = result?.rawImageUrl || result?.RawImageUrl;
                    const msg = result?.message || result?.Message;

                    if (isSuccess && predictedPlate) {
                      setEntryImagePreviewUrl(rawImageUrl || imageUrl);
                      const confidence = result?.confidence !== undefined ? result.confidence : 1.0;

                      if (confidence < 0.85) {
                        setEntryOcrResult(t('gate.camera.needCheck'));
                        message.warning(t('gate.messages.alprLowConfidence'));
                      } else {
                        setEntryOcrResult(predictedPlate);
                        checkInForm.setFieldsValue({
                          plate: predictedPlate,
                          tempImageUrl: rawImageUrl
                        });
                        message.success(t('gate.messages.alprSuccess', { plate: predictedPlate }));

                        try {
                          checkInForm.setFieldsValue({ ticketCode: '' });
                          const checkRes = await parkingService.scanCheckIn(null, predictedPlate);
                          if (checkRes && checkRes.isSuccess) {
                            checkInForm.setFieldsValue({
                              ticketCode: checkRes.ticketCode || checkRes.TicketCode
                            });
                            message.success(t('gate.messages.bookingFound', { driver: checkRes.driverName || "N/A" }));
                            setTimeout(() => {
                              entryQrInputRef.current?.focus();
                            }, 100);
                          } else {
                            checkInForm.setFieldsValue({ ticketCode: '' });
                          }
                        } catch (err) {
                          checkInForm.setFieldsValue({ ticketCode: '' });
                        }
                      }
                    } else {
                      setEntryOcrResult(t('gate.camera.needCheck'));
                      message.warning(msg || t('gate.activeTable.alprUnclear'));
                    }
                  }
                } catch (err) {
                  console.error("Entry recognition error:", err);
                  setEntryOcrResult(t('gate.camera.needCheck'));
                  message.warning(t('gate.activeTable.alprError', { err: err?.message || String(err) }));
                } finally {
                  setEntryScanning(false);
                }
              }}
              onUpload={async (file) => {
                const url = URL.createObjectURL(file);
                setEntryImagePreviewUrl(url);
                setEntryWebcamOn(false);
                setEntryScanning(true);
                setEntryOcrResult(null);
                checkInForm.setFieldValue('tempImageUrl', null);
                try {
                  const compressedFile = await resizeAndCompressImage(file, "entry_capture.jpg", 1280, 720, 0.8);
                  const type = checkInForm.getFieldValue('type') || 'Car';
                  const typeId = VEHICLE_TYPE_MAP[type] || 3;
                  const result = await parkingService.recognizeLicensePlate(compressedFile, typeId);

                  const isSuccess = result?.isSuccess || result?.IsSuccess;
                  const predictedPlate = result?.predictedPlate || result?.PredictedPlate;
                  const imageUrl = result?.imageUrl || result?.ImageUrl;
                  const rawImageUrl = result?.rawImageUrl || result?.RawImageUrl;
                  const msg = result?.message || result?.Message;

                  if (isSuccess && predictedPlate) {
                    URL.revokeObjectURL(url);
                    setEntryImagePreviewUrl(rawImageUrl || imageUrl);
                    const confidence = result?.confidence !== undefined ? result.confidence : 1.0;

                    if (confidence < 0.85) {
                      setEntryOcrResult(t('gate.camera.needCheck'));
                      message.warning(t('gate.messages.alprLowConfidence'));
                    } else {
                      setEntryOcrResult(predictedPlate);
                      checkInForm.setFieldsValue({
                        plate: predictedPlate,
                        tempImageUrl: rawImageUrl
                      });
                      message.success(t('gate.messages.alprSuccess', { plate: predictedPlate }));

                      // --- BỔ SUNG TỰ ĐỘNG KIỂM TRA ĐẶT CHỖ BẰNG BIỂN SỐ ---
                      try {
                        checkInForm.setFieldsValue({ ticketCode: '' });
                        const checkRes = await parkingService.scanCheckIn(null, predictedPlate);
                        if (checkRes && checkRes.isSuccess) {
                          checkInForm.setFieldsValue({
                            ticketCode: checkRes.ticketCode || checkRes.TicketCode
                          });
                          message.success(`Phát hiện đặt chỗ của tài xế: ${checkRes.driverName || "N/A"}`);
                        }
                      } catch (err) {
                        checkInForm.setFieldsValue({ ticketCode: '' });
                      }
                      // ----------------------------------------------------
                    }
                  } else {
                    setEntryOcrResult(t('gate.camera.needCheck'));
                    message.warning(msg || t('gate.activeTable.alprUnclear'));
                  }
                } catch (err) {
                  console.error("Entry recognition error:", err);
                  setEntryOcrResult(t('gate.camera.needCheck'));
                  message.warning(t('gate.activeTable.alprError', { err: err?.message || String(err) }));
                } finally {
                  setEntryScanning(false);
                }
              }}
              onClear={() => {
                if (entryImagePreviewUrl) {
                  URL.revokeObjectURL(entryImagePreviewUrl);
                  setEntryImagePreviewUrl(null);
                }
                setEntryWebcamOn(false);
                setEntryOcrResult(null);
                checkInForm.setFieldsValue({ plate: '', tempImageUrl: null });
              }}
              onRetry={() => {
                if (entryImagePreviewUrl) {
                  URL.revokeObjectURL(entryImagePreviewUrl);
                  setEntryImagePreviewUrl(null);
                }
                setEntryOcrResult(null);
                checkInForm.setFieldValue('tempImageUrl', null);
                setEntryWebcamOn(true);
              }}
            />

            {/* Unified Check-In Form */}
            <Form
              form={checkInForm}
              layout="vertical"
              onFinish={handleCheckInSubmit}
              requiredMark={false}
              className="space-y-3"
            >
              <Form.Item name="tempImageUrl" noStyle>
                <Input type="hidden" />
              </Form.Item>

              <Form.Item
                name="ticketCode"
                label={<span className="text-slate-500 text-xs font-bold uppercase tracking-wider dark:text-slate-400">{t('gate.form.qrTicketCode')} (Nếu có)</span>}
                className="mb-3"
              >
                <Input 
                  ref={entryQrInputRef}
                  placeholder="Quét mã QR đặt chỗ hoặc Membership..."
                  className="h-11 bg-slate-50 border-slate-200 text-slate-800 rounded-[14px] font-mono uppercase font-bold focus:bg-white focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-800" 
                />
              </Form.Item>

              <Form.Item noStyle shouldUpdate={(prev, curr) => prev.type !== curr.type}>
                {({ getFieldValue }) => {
                  const type = getFieldValue('type') || 'Car';
                  return (
                    <Form.Item
                      name="plate"
                      label={<span className="text-slate-500 text-xs font-bold uppercase tracking-wider dark:text-slate-400">{t('gate.form.plate')}</span>}
                      rules={[{ required: type !== 'Bicycle', message: t('gate.form.requirePlate') }]}
                      className="mb-3"
                    >
                      <Input
                        onChange={handlePlateChange}
                        placeholder={type === 'Bicycle' ? t('gate.form.optionalBicycle') : 'e.g. 30A-123.45'}
                        suffix={entryScanning ? <RefreshCw className="animate-spin text-emerald-500" size={16} /> : null}
                        className="h-11 bg-slate-50 border-slate-200 text-slate-800 rounded-[14px] font-mono uppercase font-bold focus:bg-white focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-800"
                      />
                    </Form.Item>
                  );
                }}
              </Form.Item>

              <Form.Item noStyle shouldUpdate={(prev, curr) => prev.ticketCode !== curr.ticketCode}>
                {({ getFieldValue }) => {
                  const ticketCode = getFieldValue('ticketCode');
                  if (ticketCode) return null;

                  return (
                    <div className="grid grid-cols-1 gap-4 mb-3">
                      <Form.Item
                        name="type"
                        label={<span className="text-slate-500 text-xs font-bold uppercase tracking-wider dark:text-slate-400">{t('gate.form.type')}</span>}
                        rules={[{ required: true, message: t('gate.form.requireType') }]}
                        initialValue="Car"
                        className="mb-0"
                      >
                        <Radio.Group className="flex w-full" buttonStyle="solid">
                          <Radio.Button value="Car" className="flex-1 text-center h-11 leading-[42px] font-semibold text-sm">{t('gate.form.car')}</Radio.Button>
                          <Radio.Button value="Motorbike" className="flex-1 text-center h-11 leading-[42px] font-semibold text-sm">{t('gate.form.motorbike')}</Radio.Button>
                          <Radio.Button value="Bicycle" className="flex-1 text-center h-11 leading-[42px] font-semibold text-sm">{t('gate.form.bicycle')}</Radio.Button>
                        </Radio.Group>
                      </Form.Item>
                    </div>
                  );
                }}
              </Form.Item>

              <Form.Item noStyle shouldUpdate={(prev, curr) => prev.ticketCode !== curr.ticketCode}>
                {({ getFieldValue }) => {
                  const ticketCode = getFieldValue('ticketCode');
                  return (
                    <div className="pt-2">
                      <Button
                        type="primary"
                        htmlType="submit"
                        className="w-full h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 hover:!from-emerald-400 hover:!to-emerald-500 border-none font-bold rounded-[14px] transition-all shadow-md shadow-emerald-600/20 hover:-translate-y-0.5 flex items-center justify-center gap-1.5 text-white"
                      >
                        <Sparkles size={15}/> {ticketCode ? t('gate.form.verifyQrOpen') : t('gate.form.printTicketOpen')}
                      </Button>
                    </div>
                  );
                }}
              </Form.Item>
            </Form>

            <div className="flex gap-2 mt-3">
              <Button
                type="dashed"
                onClick={() => {
                  setQrScannerTarget('entry');
                  setIsLocalQrScannerOpen(true);
                }}
                className="w-full h-11 border-[1.5px] border-indigo-200 text-indigo-600 font-bold rounded-[14px] flex items-center justify-center gap-1.5 hover:border-indigo-400"
              >
                <QrCode size={15} /> {t('gate.form.scanQrCamera')}
              </Button>
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN: Exit Gate Control */}
        <div className="space-y-6">
          <Card
            id="exit-gate-card"
            title={
              <div className="flex items-center justify-between w-full py-1">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center dark:border-indigo-500/40 dark:bg-indigo-500/15">
                    <LogOut size={18} className="text-indigo-600" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-extrabold text-slate-900 tracking-tight leading-tight dark:text-slate-100">{t('gate.exitTitle')}</span>
                  </div>
                  <span className="ml-1 w-2.5 h-2.5 bg-indigo-500 rounded-full animate-pulse"></span>
                </div>
              </div>
            }
            className="rounded-2xl border border-slate-100 shadow-sm overflow-hidden dark:border-slate-700 dark:bg-slate-900"
            bodyStyle={{ padding: '20px' }}
          >
            <SmartCamera
              type="Exit"
              color="rose"
              isWebcamOn={exitWebcamOn}
              onTurnOn={() => setExitWebcamOn(true)}
              previewUrl={exitImagePreviewUrl}
              isScanning={exitScanning}
              ocrResult={exitOcrResult}
              onCapture={async (imageSrc) => {
                setExitWebcamOn(false);
                setExitImagePreviewUrl(imageSrc);
                setExitScanning(true);
                setExitOcrResult(null);
                checkOutForm.setFieldValue('tempImageUrl', null);
                try {
                  const file = await resizeAndCompressImage(imageSrc, "exit_capture.jpg", 1280, 720, 0.8);
                  if (!file) throw new Error("Ảnh chụp không hợp lệ.");

                  const currentPlate = checkOutForm.getFieldValue('plate') || '';
                  const isBike = currentPlate.toUpperCase().startsWith('BIKE_');
                  
                  if (isBike) {
                    const result = await parkingService.recognizeLicensePlate(file, 1);
                    const rawImageUrl = result?.rawImageUrl || result?.RawImageUrl || result?.imageUrl || result?.ImageUrl;
                    
                    setExitOcrResult(currentPlate);
                    checkOutForm.setFieldsValue({ tempImageUrl: rawImageUrl });
                    message.success("Đã ghi nhận ảnh chụp xe đạp cổng ra.");
                  } else {
                    const result = await parkingService.recognizeLicensePlate(file, 3);
                    const isSuccess = result?.isSuccess || result?.IsSuccess;
                    const predictedPlate = result?.predictedPlate || result?.PredictedPlate;
                    const imageUrl = result?.imageUrl || result?.ImageUrl;
                    const rawImageUrl = result?.rawImageUrl || result?.RawImageUrl;
                    const msg = result?.message || result?.Message;

                    if (isSuccess && predictedPlate) {
                      setExitImagePreviewUrl(rawImageUrl || imageUrl);
                      const confidence = result?.confidence !== undefined ? result.confidence : 1.0;

                      if (confidence < 0.85) {
                        setExitOcrResult(t('gate.camera.needCheck'));
                        message.warning(t('gate.messages.alprLowConfidence'));
                      } else {
                        // XE CƠ GIỚI: Đọc biển số và tự động đối soát
                        setExitOcrResult(predictedPlate);
                        checkOutForm.setFieldsValue({
                          plate: predictedPlate,
                          tempImageUrl: rawImageUrl
                        });
                        message.success(t('gate.messages.alprSuccess', { plate: predictedPlate }));

                        // Mở khóa ô nhập QR và tự động Focus chuột để nhân viên quét QR vé
                        setTimeout(() => {
                          qrInputRef.current?.focus();
                        }, 100);
                      }
                    } else {
                      setExitOcrResult(t('gate.camera.needCheck'));
                      message.warning(msg || t('gate.activeTable.alprUnclear'));
                    }
                  }
                } catch (err) {
                  console.error("Exit recognition error:", err);
                  setExitOcrResult(t('gate.camera.needCheck'));
                  message.warning(t('gate.activeTable.alprError', { err: err?.message || String(err) }));
                } finally {
                  setExitScanning(false);
                }
              }}
              onUpload={async (file) => {
                const url = URL.createObjectURL(file);
                setExitImagePreviewUrl(url);
                setExitWebcamOn(false);
                setExitScanning(true);
                setExitOcrResult(null);
                checkOutForm.setFieldValue('tempImageUrl', null);
                try {
                  const compressedFile = await resizeAndCompressImage(file, "exit_capture.jpg", 1280, 720, 0.8);
                  const currentPlate = checkOutForm.getFieldValue('plate') || '';
                  const isBike = currentPlate.toUpperCase().startsWith('BIKE_');
                  
                  if (isBike) {
                    const result = await parkingService.recognizeLicensePlate(compressedFile, 1);
                    const rawImageUrl = result?.rawImageUrl || result?.RawImageUrl || result?.imageUrl || result?.ImageUrl;
                    
                    URL.revokeObjectURL(url);
                    setExitOcrResult(currentPlate);
                    checkOutForm.setFieldsValue({ tempImageUrl: rawImageUrl });
                    message.success("Đã ghi nhận ảnh chụp xe đạp cổng ra.");
                  } else {
                    const result = await parkingService.recognizeLicensePlate(compressedFile, 3);
                    const isSuccess = result?.isSuccess || result?.IsSuccess;
                    const predictedPlate = result?.predictedPlate || result?.PredictedPlate;
                    const imageUrl = result?.imageUrl || result?.ImageUrl;
                    const rawImageUrl = result?.rawImageUrl || result?.RawImageUrl;
                    const msg = result?.message || result?.Message;

                    if (isSuccess && predictedPlate) {
                      URL.revokeObjectURL(url);
                      setExitImagePreviewUrl(rawImageUrl || imageUrl);
                      const confidence = result?.confidence !== undefined ? result.confidence : 1.0;

                      if (confidence < 0.85) {
                        setExitOcrResult(t('gate.camera.needCheck'));
                        message.warning(t('gate.messages.alprLowConfidence'));
                      } else {
                        // XE CƠ GIỚI: Đọc biển số và tự động đối soát
                        setExitOcrResult(predictedPlate);
                        checkOutForm.setFieldsValue({
                          plate: predictedPlate,
                          tempImageUrl: rawImageUrl
                        });
                        message.success(t('gate.messages.alprSuccess', { plate: predictedPlate }));

                        // Mở khóa ô nhập QR và tự động Focus chuột để nhân viên quét QR vé
                        setTimeout(() => {
                          qrInputRef.current?.focus();
                        }, 100);
                      }
                    } else {
                      setExitOcrResult(t('gate.camera.needCheck'));
                      message.warning(msg || t('gate.activeTable.alprUnclear'));
                    }
                  }
                } catch (err) {
                  console.error("Exit recognition error:", err);
                  setExitOcrResult(t('gate.camera.needCheck'));
                  message.warning(t('gate.activeTable.alprError', { err: err?.message || String(err) }));
                } finally {
                  setExitScanning(false);
                }
              }}
              onClear={() => {
                if (exitImagePreviewUrl) {
                  URL.revokeObjectURL(exitImagePreviewUrl);
                  setExitImagePreviewUrl(null);
                }
                setExitWebcamOn(false);
                setExitOcrResult(null);
                checkOutForm.setFieldsValue({ plate: '', tempImageUrl: null });
              }}
              onRetry={() => {
                if (exitImagePreviewUrl) {
                  URL.revokeObjectURL(exitImagePreviewUrl);
                  setExitImagePreviewUrl(null);
                }
                setExitOcrResult(null);
                checkOutForm.setFieldValue('tempImageUrl', null);
                setExitWebcamOn(true);
              }}
            />

            {/* Check-Out Form */}
            <Form
              form={checkOutForm}
              layout="vertical"
              onFinish={handleCheckOutSubmit}
              requiredMark={false}
              className="space-y-4"
            >
              <Form.Item name="tempImageUrl" noStyle>
                <Input type="hidden" />
              </Form.Item>

              <Form.Item
                name="ticketCode"
                label={
                  <div className="flex justify-between items-center w-full">
                    <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">{t('gate.form.qrTicketCode')}</span>
                    {!exitOcrResult && <span className="text-[10px] text-amber-500 font-bold normal-case">{t('gate.form.scanPlateFirst')}</span>}
                  </div>
                }
                className="mb-2"
              >
                <Input
                  ref={qrInputRef}
                  disabled={false}
                  onPressEnter={() => checkOutForm.submit()}
                  placeholder={exitOcrResult ? t('gate.form.scanOrEnter') : t('gate.form.waitScan')}
                  className="h-11 bg-slate-50 border-slate-200 text-slate-800 rounded-[14px] font-mono uppercase font-bold focus:bg-white focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-800"
                />
              </Form.Item>

              <Form.Item
                name="plate"
                label={<span className="text-slate-500 text-xs font-bold uppercase tracking-wider">{t('gate.form.plate')}</span>}
                rules={[{ required: true, message: t('gate.form.requirePlate') }]}
                className="mb-2"
              >
                <Input onChange={handleCheckOutPlateChange} placeholder="e.g. 29A-888.88" suffix={exitScanning ? <RefreshCw className="animate-spin text-indigo-500" size={16} /> : null} className="h-11 bg-slate-50 border-slate-200 text-slate-800 rounded-[14px] uppercase font-bold focus:bg-white focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-800" />
              </Form.Item>



              <div className="pt-2">
                <Button
                  type="primary"
                  htmlType="submit"
                  className="w-full h-12 font-bold bg-gradient-to-br from-indigo-500 to-indigo-600 hover:!from-indigo-400 hover:!to-indigo-500 text-white border-none rounded-[14px] flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 hover:-translate-y-0.5 transition-all cursor-pointer"
                >
                  <CreditCard size={15}/> {t('gate.form.checkoutProcess')}
                </Button>
              </div>
            </Form>

            <div className="flex gap-2 mt-3">
              <Button
                type="dashed"
                disabled={false}
                onClick={() => {
                  setQrScannerTarget('exit');
                  setIsLocalQrScannerOpen(true);
                }}
                className="w-full h-11 border-[1.5px] border-indigo-200 text-indigo-600 font-bold rounded-[14px] flex items-center justify-center gap-1.5 hover:border-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <QrCode size={15} /> {t('gate.form.scanQrCamera')}
              </Button>
            </div>
            
            <Button
              type="primary"
              danger
              onClick={() => setIsCreateIncidentOpen(true)}
              className="w-full h-11 font-bold rounded-[14px] flex items-center justify-center gap-1.5 mt-3 bg-rose-600 hover:bg-rose-700 border-none shadow-sm shadow-rose-600/20"
            >
              <AlertCircle size={15} /> Báo cáo sự cố / Mất thẻ
            </Button>
          </Card>
        </div>

      </div>



      {/* Local Webcam QR Scanner Modal */}
      <QrScannerModal
        isOpen={isLocalQrScannerOpen}
        onClose={() => setIsLocalQrScannerOpen(false)}
        onScanSuccess={handleLocalQrScanSuccess}
        title={qrScannerTarget === 'entry' ? t('gate.form.scanQrEntry') : t('gate.form.scanQrExit')}
      />

      {/* Booking Check-In Confirmation Modal */}
      <BookingCheckInModal
        isOpen={isCheckInConfirmOpen}
        onClose={() => {
          setIsCheckInConfirmOpen(false);
          setBookingCheckInData(null);
        }}
        data={bookingCheckInData}
      />


      {/* Checkin Ticket Modal Popup */}
      <TicketModal
        isOpen={isTicketOpen}
        onClose={() => {
          setIsTicketOpen(false);
          setTicketDetails(null);
        }}
        details={ticketDetails}
        type="ticket"
      />

      {/* Checkout Receipt Modal Popup */}
      <TicketModal
        isOpen={isReceiptOpen}
        onClose={() => {
          setIsReceiptOpen(false);
          setReceiptDetails(null);
        }}
        details={receiptDetails}
        type="receipt"
      />

      {/* Checkout Verification & Payment Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2.5 text-slate-900 border-b border-slate-100 pb-3 font-extrabold text-lg font-sans tracking-tight dark:border-slate-700 dark:text-slate-100">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center dark:border-indigo-500/40 dark:bg-indigo-500/15">
              <ShieldCheck size={18} className="text-indigo-600" />
            </div>
            {t('gate.checkoutModal.title')}
          </div>
        }
        open={isCheckoutResultModalOpen}
        onCancel={handleCloseCheckoutResultModal}
        footer={[
          <Button key="close" type="dashed" onClick={handleCloseCheckoutResultModal} className="font-bold h-11 px-5 rounded-[14px] border-[1.5px]">
            {t('gate.checkoutModal.close')}
          </Button>
        ]}
        width={920}
        centered
        destroyOnClose
        className="font-sans"
      >
        <style>{`
          @keyframes scan {
            0% { top: 0%; }
            50% { top: 100%; }
            100% { top: 0%; }
          }
          .animate-scan {
            position: absolute;
            animation: scan 3s linear infinite;
          }
        `}</style>
        {checkoutResult && (() => {
          const isSuccess = checkoutResult.isSuccess || checkoutResult.IsSuccess;
          const messageText = checkoutResult.message || checkoutResult.Message;
          const sessionId = checkoutResult.sessionId || checkoutResult.SessionId;
          const ticketCode = checkoutResult.ticketCode || checkoutResult.TicketCode;
          const slotName = checkoutResult.slotName || checkoutResult.SlotName;
          const checkInLicensePlate = checkoutResult.checkInLicensePlate || checkoutResult.CheckInLicensePlate;
          const checkOutLicensePlate = checkoutResult.checkOutLicensePlate || checkoutResult.CheckOutLicensePlate;
          const isLicensePlateMatched = checkoutResult.isLicensePlateMatched !== undefined ? checkoutResult.isLicensePlateMatched : checkoutResult.IsLicensePlateMatched;
          const checkInImageUrl = checkoutResult.imageUrl || checkoutResult.ImageUrl || checkoutResult.checkInImageUrl || checkoutResult.CheckInImageUrl;
          const checkInTime = checkoutResult.checkInTime || checkoutResult.CheckInTime;
          const checkOutTime = checkoutResult.checkOutTime || checkoutResult.CheckOutTime;
          const durationHours = checkoutResult.durationHours || checkoutResult.DurationHours;
          const totalAmount = checkoutResult.totalAmount || checkoutResult.TotalAmount;
          const invoiceId = checkoutResult.invoiceId || checkoutResult.InvoiceId;
          const isPaid = checkoutResult.isPaid !== undefined ? checkoutResult.isPaid : checkoutResult.IsPaid;
          const paymentUrl = checkoutResult.paymentUrl || checkoutResult.PaymentUrl;
          const effectivePaymentMethod = String(
            checkoutResult.paymentMethod || checkoutResult.PaymentMethod || selectedPaymentMethod || ''
          ).toUpperCase();
          const isVnPayPending = isSuccess && !isPaid && Boolean(paymentUrl);
          const isCashPending = isSuccess && !isPaid && !paymentUrl && ['AUTO', 'CASH', ''].includes(effectivePaymentMethod);
          const extraAmount = checkoutResult.extraAmount ?? checkoutResult.ExtraAmount ?? checkoutResult.additionalAmount ?? checkoutResult.AdditionalAmount;
          const isOverGracePeriod = checkoutResult.isOverGracePeriod ?? checkoutResult.IsOverGracePeriod;
          const hasExtraFeeSignal = !isPaid && (
            Number(extraAmount || 0) > 0 ||
            isOverGracePeriod === true ||
            /extra|additional|grace|quá hạn|thu thêm|phụ thu/i.test(String(messageText || ''))
          );
          const amountDueLabel = isPaid
            ? t('gate.checkoutModal.paidNoExtra')
            : hasExtraFeeSignal
              ? t('gate.checkoutModal.extraAmountDue')
              : t('gate.checkoutModal.amountDue');

          const isBicycle = checkInLicensePlate?.toUpperCase().startsWith('BIKE_');
          const formatMoney = (value) => `${new Intl.NumberFormat('vi-VN').format(Number(value || 0))} đ`;
          const receivedAmount = parseFloat(cashReceived) || 0;
          const previewChangeDue = Math.max(0, receivedAmount - Number(totalAmount || 0));
          const canConfirmCashPayment = receivedAmount >= Number(totalAmount || 0);

          return (
            <div className="space-y-6 pt-4">
              {!isSuccess ? (
                <Alert
                  message={t('gate.checkoutModal.securityWarning')}
                  description={messageText || t('gate.checkoutModal.securityWarningDesc')}
                  type="error"
                  showIcon
                  className="rounded-xl font-bold"
                />
              ) : (
                <Alert
                  message={t('gate.checkoutModal.plateMatchSuccess')}
                  description={messageText || t('gate.checkoutModal.plateMatchSuccessDesc')}
                  type="success"
                  showIcon
                  className="rounded-xl font-bold"
                />
              )}

              {/* THÊM BIỂU NGỮ CẢNH BÁO THIẾU ẢNH VÀO Ở ĐÂY */}
              {isSuccess && !checkInImageUrl && !isBicycle && (
                <Alert
                  message="Cảnh báo an ninh: Phiên đỗ xe thiếu ảnh đầu vào!"
                  description="Phương tiện này được check-in bằng cách nhập tay biển số hoặc camera bị lỗi lúc vào. Vui lòng đối chiếu thực tế kỹ lưỡng trước khi xác nhận cho xe ra!"
                  type="warning"
                  showIcon
                  className="rounded-xl font-bold border-amber-300 bg-amber-50 text-amber-900"
                />
              )}

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Left Column: License Plates, Images & Session Details (col-span-7) */}
                <div className="md:col-span-7 space-y-4">
                  {/* Security Verification panel */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4 dark:border-slate-700 dark:bg-slate-900">
                    <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 dark:text-slate-400"><ShieldCheck size={14} className="text-indigo-500" />{t('gate.checkoutModal.securityVerification')}</h3>

                    <div className="space-y-2 font-mono text-xs">
                      <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700 dark:bg-slate-800">
                        <span className="text-slate-500 font-bold dark:text-slate-400">{t('gate.checkoutModal.exitPlate')}</span>
                        <Tag color="blue" className="font-bold font-mono rounded-lg">{checkOutForm.getFieldValue('plate') || "N/A"}</Tag>
                      </div>
                      <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700 dark:bg-slate-800">
                        <span className="text-slate-500 font-bold dark:text-slate-400">{t('gate.checkoutModal.entryPlateDb')}</span>
                        <Tag color="cyan" className="font-bold font-mono rounded-lg">{checkInLicensePlate || "N/A"}</Tag>
                      </div>
                      <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700 dark:bg-slate-800">
                        <span className="text-slate-500 font-bold dark:text-slate-400">{t('gate.checkoutModal.exitPlateDb')}</span>
                        <Tag color="purple" className="font-bold font-mono rounded-lg">{checkOutLicensePlate || "N/A"}</Tag>
                      </div>
                      <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700 dark:bg-slate-800">
                        <span className="text-slate-500 font-bold dark:text-slate-400">{t('gate.checkoutModal.matchStatus')}</span>
                        {isLicensePlateMatched ? (
                          <Tag color="success" className="font-bold rounded-lg">{t('gate.checkoutModal.match')}</Tag>
                        ) : (
                          <Tag color="error" className="font-bold rounded-lg">{t('gate.checkoutModal.notMatch')}</Tag>
                        )}
                      </div>
                    </div>

                    {/* Images side by side */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 dark:text-slate-500">{t('gate.checkoutModal.entryImage')}</span>
                        <div className="w-full aspect-[4/3] bg-slate-900 rounded overflow-hidden border border-slate-200 flex items-center justify-center dark:border-slate-700">
                          {checkInImageUrl ? (
                            <Image
                              src={checkInImageUrl}
                              alt={t('gate.checkoutModal.entryImage')}
                              className="w-full h-full object-cover"
                            />
                          ) : isBicycle ? (
                            <div className="flex flex-col items-center justify-center p-3 text-center bg-slate-100 w-full h-full">
                              <span className="text-slate-400 font-extrabold text-[22px] mb-1">🚲</span>
                              <span className="text-[10px] text-slate-500 font-bold uppercase">Xe đạp (Không ảnh)</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center p-3 text-center bg-amber-50 w-full h-full border border-dashed border-amber-300">
                              <span className="text-amber-500 animate-pulse text-[22px] mb-1">⚠️</span>
                              <span className="text-[10px] text-amber-700 font-extrabold uppercase">Không có ảnh vào</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 dark:text-slate-500">{t('gate.checkoutModal.exitImage')}</span>
                        <div className="w-full aspect-[4/3] bg-slate-900 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center dark:border-slate-700">
                          {exitImagePreviewUrl ? (
                            <Image
                              src={exitImagePreviewUrl}
                              alt={t('gate.checkoutModal.exitImage')}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-[9px] text-slate-500 font-bold uppercase">{t('gate.checkoutModal.noImage')}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {!isSuccess && (
                      <div className="mt-4 flex gap-3 pt-2">
                        <Button
                          type="primary"
                          onClick={() => handleCheckOut(selectedPaymentMethod, checkInLicensePlate)}
                          className="flex-1 h-11 font-bold rounded-[14px] bg-gradient-to-br from-amber-500 to-amber-600 hover:!from-amber-400 hover:!to-amber-500 border-none flex items-center justify-center cursor-pointer text-white shadow-md hover:-translate-y-0.5 transition-all"
                        >
                          {t('gate.checkoutModal.ignoreWarning')}
                        </Button>
                        <Button
                          onClick={handleCloseCheckoutResultModal}
                          className="flex-1 h-11 font-bold rounded-[14px] border-[1.5px] border-slate-200 cursor-pointer"
                        >
                          {t('gate.checkoutModal.keepVehicle')}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Session Details */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-3 dark:text-slate-400">{t('gate.checkoutModal.sessionDetails')}</h3>
                    <Descriptions column={2} size="small" bordered className="bg-white rounded-xl overflow-hidden border border-slate-200/60 font-sans dark:border-slate-700 dark:bg-slate-900">
                      <Descriptions.Item label={<span className="text-[11px] font-bold text-slate-500">{t('gate.checkoutModal.sessionId')}</span>}>
                        <span className="text-xs font-extrabold text-slate-800">{sessionId || "N/A"}</span>
                      </Descriptions.Item>
                      <Descriptions.Item label={<span className="text-[11px] font-bold text-slate-500">{t('gate.checkoutModal.ticketCode')}</span>}>
                        <span className="text-xs font-mono font-bold text-slate-800">{ticketCode || "N/A"}</span>
                      </Descriptions.Item>
                      <Descriptions.Item label={<span className="text-[11px] font-bold text-slate-500">{t('gate.checkoutModal.slotName')}</span>}>
                        <Tag color="geekblue" className="font-bold m-0 rounded-lg">{slotName || "N/A"}</Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label={<span className="text-[11px] font-bold text-slate-500">{t('gate.checkoutModal.duration')}</span>}>
                        <span className="text-xs font-bold text-slate-800">{durationHours || 0} {t('gate.checkoutModal.hours')}</span>
                      </Descriptions.Item>
                      <Descriptions.Item label={<span className="text-[11px] font-bold text-slate-500">{t('gate.checkoutModal.entryTime')}</span>}>
                        <span className="text-[10px] text-slate-600 font-medium">
                          {formatVietnamDateTime(checkInTime)}
                        </span>
                      </Descriptions.Item>
                      <Descriptions.Item label={<span className="text-[11px] font-bold text-slate-500">{t('gate.checkoutModal.exitTime')}</span>}>
                        <span className="text-[10px] text-slate-600 font-medium">
                          {formatVietnamDateTime(checkOutTime)}
                        </span>
                      </Descriptions.Item>
                      <Descriptions.Item label={<span className="text-[11px] font-bold text-slate-500">{t('gate.checkoutModal.paymentStatus')}</span>}>
                        {isPaid ? (
                          <Tag color="success" className="font-bold m-0 rounded-lg">{t('gate.checkoutModal.paid')}</Tag>
                        ) : (
                          <Tag color="warning" className="font-bold m-0 rounded-lg">{t('gate.checkoutModal.pending')}</Tag>
                        )}
                      </Descriptions.Item>
                      <Descriptions.Item label={<span className="text-[11px] font-bold text-slate-500">{amountDueLabel}</span>}>
                        <span className="text-xs font-extrabold text-rose-600">
                          {formatMoney(totalAmount)}
                        </span>
                      </Descriptions.Item>
                    </Descriptions>
                  </div>
                </div>

                {/* Right Column: Checkout & Payment Center (col-span-5) */}
                <div className="md:col-span-5">
                  <section className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-700 dark:bg-slate-900/70">
                  <div>
                    <div className="mb-5 space-y-4 border-b border-slate-100 pb-4 dark:border-slate-700">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:ring-indigo-800/60">
                          <Wallet size={18} />
                        </div>
                        <h3 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
                          {t('gate.checkoutModal.paymentGateway')}
                        </h3>
                      </div>

                      <div className="grid grid-cols-2 rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800/70">
                        <button
                          type="button"
                          disabled={isSwitchingPayment}
                          onClick={() => handleSwitchPaymentMethodInModal('CASH')}
                          className={`h-10 rounded-lg text-sm font-extrabold transition-all focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-800 ${
                            selectedPaymentMethod === 'CASH'
                              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-900/20'
                              : 'text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                          } disabled:cursor-not-allowed disabled:opacity-60`}
                        >
                          {t('gate.form.cash')}
                        </button>
                        <button
                          type="button"
                          disabled={isSwitchingPayment}
                          onClick={() => handleSwitchPaymentMethodInModal('VNPAY')}
                          className={`h-10 rounded-lg text-sm font-extrabold transition-all focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-800 ${
                            selectedPaymentMethod === 'VNPAY'
                              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-900/20'
                              : 'text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                          } disabled:cursor-not-allowed disabled:opacity-60`}
                        >
                          VNPay
                        </button>
                      </div>
                    </div>

                    {/* Paid Alert */}
                    {isSuccess && isPaid && (
                      <div className="space-y-4 py-8 text-center">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3 animate-pulse dark:bg-emerald-500/15">
                          <Check size={32} className="text-emerald-600" />
                        </div>
                        <h4 className="text-lg font-extrabold text-emerald-800 tracking-tight dark:text-emerald-300">{t('gate.checkoutModal.paymentSuccess')}</h4>
                        <p className="text-sm text-slate-500 leading-relaxed dark:text-slate-400">{t('gate.checkoutModal.paymentSuccessDesc')}</p>

                        {changeDue !== null && changeDue > 0 && (
                          <div className="mx-auto mt-4 flex max-w-xs items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-950/20 dark:text-emerald-300">
                            <span>{t('gate.checkoutModal.changeDue')}</span>
                            <span className="text-base text-emerald-700 dark:text-emerald-300">
                              {formatMoney(changeDue)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Unpaid Flow: VNPAY */}
                    {isVnPayPending && (
                      <div className="space-y-5">
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center shadow-sm dark:border-amber-800/50 dark:bg-amber-950/20">
                          <span className="mb-1 block text-[10px] font-extrabold uppercase tracking-widest text-amber-700 dark:text-amber-300">{amountDueLabel}</span>
                          <span className="text-3xl font-black tracking-tight text-amber-800 dark:text-amber-300">
                            {formatMoney(totalAmount)}
                          </span>
                        </div>

                        {/* Interactive QR Code Card */}
                        <div className="relative group mx-auto flex max-w-[240px] justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-md transition-shadow duration-300 hover:shadow-lg dark:border-slate-700 dark:bg-slate-800">
                          {/* Laser Scan line micro-animation */}
                          <div className="absolute top-0 left-0 right-0 h-0.5 bg-indigo-500/80 shadow-[0_0_8px_#6366f1] animate-scan pointer-events-none"></div>

                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(paymentUrl)}`}
                            alt={t('gate.checkoutModal.vnpayQrCode')}
                            className="w-48 h-48 object-contain transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>

                        <div className="flex flex-col gap-2 pt-2">
                          <Button
                            type="primary"
                            icon={<RefreshCw size={14} className={isCheckingStatus ? "animate-spin" : ""} />}
                            loading={isCheckingStatus}
                            onClick={handleRefreshPaymentStatus}
                            className="w-full h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 hover:!from-emerald-400 hover:!to-emerald-500 border-none font-bold rounded-[14px] flex items-center justify-center gap-1.5 text-white cursor-pointer transition-all duration-200 transform active:scale-95 hover:-translate-y-0.5 shadow-md"
                          >
                            {t('gate.checkoutModal.checkPaymentStatus')}
                          </Button>
                          <Button
                            type="link"
                            size="small"
                            onClick={() => window.open(paymentUrl, '_blank')}
                            className="text-xs text-indigo-600 hover:text-indigo-500 font-bold mt-1 flex items-center justify-center gap-1"
                          >
                            <ExternalLink size={12} /> {t('gate.checkoutModal.openPaymentLink')}
                          </Button>
                        </div>
                        <p className="text-[10px] text-slate-400 text-center font-medium leading-relaxed dark:text-slate-500">
                          {t('gate.checkoutModal.autoScanNote')}
                        </p>
                        <p className="rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-center text-[11px] font-semibold leading-relaxed text-indigo-700 dark:border-indigo-800/50 dark:bg-indigo-950/20 dark:text-indigo-300">
                          {t('gate.checkoutModal.vnpayNote')}
                        </p>
                      </div>
                    )}

                    {/* Unpaid Flow: CASH */}
                    {isCashPending && (
                      <div className="space-y-4">
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm dark:border-amber-800/50 dark:bg-amber-950/20">
                          <span className="mb-1 block text-[10px] font-extrabold uppercase tracking-widest text-amber-700 dark:text-amber-300">{amountDueLabel}</span>
                          <span className="block text-3xl font-black tracking-tight text-amber-800 dark:text-amber-300">
                            {formatMoney(totalAmount)}
                          </span>
                        </div>

                        <div className="space-y-2.5">
                          <span className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('gate.checkoutModal.amountReceived')}</span>
                          <Input
                            type="number"
                            placeholder={t('gate.checkoutModal.enterAmount')}
                            value={cashReceived}
                            onChange={(e) => setCashReceived(e.target.value)}
                            onPressEnter={handleConfirmCashPayment}
                            className="h-14 rounded-2xl border border-slate-200 bg-slate-50 px-5 font-mono text-2xl font-bold text-slate-900 shadow-sm transition-all hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-800/70 dark:text-white dark:focus:bg-slate-800"
                            suffix={<span className="text-sm font-extrabold text-slate-400 dark:text-slate-500">đ</span>}
                          />

                          {/* Quick Denominations Grid */}
                          <div className="grid grid-cols-3 gap-2 pt-1">
                            <Button
                              onClick={() => setCashReceived(totalAmount.toString())}
                              className="h-12 rounded-xl border border-indigo-200 bg-indigo-50 text-sm font-extrabold text-indigo-700 shadow-sm transition-all hover:!border-indigo-300 hover:!bg-indigo-100 focus:!ring-2 focus:!ring-indigo-300 dark:border-indigo-800/60 dark:bg-indigo-950/30 dark:text-indigo-300 dark:hover:!bg-indigo-900/40"
                            >
                              {t('gate.checkoutModal.exactAmount')}
                            </Button>
                            <Button
                              onClick={() => {
                                const val = parseFloat(cashReceived) || 0;
                                setCashReceived((val + 50000).toString());
                              }}
                              className="h-12 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 shadow-sm transition-all hover:!border-slate-300 hover:!bg-slate-50 focus:!ring-2 focus:!ring-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:!bg-slate-700"
                            >
                              +50K
                            </Button>
                            <Button
                              onClick={() => {
                                const val = parseFloat(cashReceived) || 0;
                                setCashReceived((val + 100000).toString());
                              }}
                              className="h-12 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 shadow-sm transition-all hover:!border-slate-300 hover:!bg-slate-50 focus:!ring-2 focus:!ring-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:!bg-slate-700"
                            >
                              +100K
                            </Button>
                            <Button
                              onClick={() => {
                                const val = parseFloat(cashReceived) || 0;
                                setCashReceived((val + 200000).toString());
                              }}
                              className="h-12 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 shadow-sm transition-all hover:!border-slate-300 hover:!bg-slate-50 focus:!ring-2 focus:!ring-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:!bg-slate-700"
                            >
                              +200K
                            </Button>
                            <Button
                              onClick={() => {
                                const val = parseFloat(cashReceived) || 0;
                                setCashReceived((val + 500000).toString());
                              }}
                              className="h-12 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 shadow-sm transition-all hover:!border-slate-300 hover:!bg-slate-50 focus:!ring-2 focus:!ring-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:!bg-slate-700"
                            >
                              +500K
                            </Button>
                            <Button
                              onClick={() => setCashReceived('')}
                              className="h-12 rounded-xl border border-rose-200 bg-rose-50 text-sm font-extrabold text-rose-600 shadow-sm transition-all hover:!border-rose-300 hover:!bg-rose-100 focus:!ring-2 focus:!ring-rose-200 dark:border-rose-800/60 dark:bg-rose-950/30 dark:text-rose-300 dark:hover:!bg-rose-900/40"
                            >
                              {t('gate.checkoutModal.clear')}
                            </Button>
                          </div>
                        </div>

                        <div className={`flex items-center justify-between rounded-2xl border p-4 text-xs font-bold shadow-sm transition-colors ${
                          previewChangeDue > 0
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-950/20 dark:text-emerald-300'
                            : 'border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300'
                        }`}>
                          <span className="text-[10px] font-extrabold uppercase tracking-widest">{t('gate.checkoutModal.changeDue')}</span>
                          <span className={`text-xl font-black ${previewChangeDue > 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-600 dark:text-slate-300'}`}>
                            {formatMoney(previewChangeDue)}
                          </span>
                        </div>

                        <Button
                          type="primary"
                          icon={<Check size={18} />}
                          onClick={handleConfirmCashPayment}
                          disabled={!canConfirmCashPayment}
                          className="mt-2 flex h-14 w-full items-center justify-center gap-2 rounded-2xl border-none bg-gradient-to-r from-emerald-500 to-teal-500 font-bold text-white shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:!from-emerald-400 hover:!to-teal-400 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                        >
                          {t('gate.checkoutModal.confirmCashAndOpen')}
                        </Button>
                      </div>
                    )}
                  </div>
                  </section>
                </div>
              </div>
            </div>
          );
        })()}
      </Modal>

      <CreateIncidentModal 
        isOpen={isCreateIncidentOpen} 
        onClose={() => setIsCreateIncidentOpen(false)}
        licenseVehicle={
          checkoutResult?.licenseVehicle ||
          checkoutResult?.LicenseVehicle ||
          checkoutResult?.checkOutLicensePlate ||
          checkoutResult?.CheckOutLicensePlate ||
          checkOutForm.getFieldValue('plate')
        }
        onSuccess={() => {}}
      />

      {/* Start Shift Overlay Modal */}
      <Modal
        title={<span className="text-lg font-bold text-slate-800">{t('staffShifts.requireShiftTitle')}</span>}
        open={isShiftModalOpen}
        footer={null}
        closable={false}
        maskClosable={false}
        centered
        width={400}
      >
        <div className="text-center py-6 space-y-4">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto dark:bg-indigo-950 dark:text-indigo-400">
            <Clock size={32} />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">{t('staffShifts.requireShiftTitleDesc')}</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              {t('staffShifts.requireShiftBody')}
            </p>
          </div>
          <Button
            type="primary"
            size="large"
            loading={loadingShift}
            onClick={handleStartShift}
            className="w-full rounded-xl bg-indigo-600 font-bold h-11"
          >
            {t('staffShifts.btnStartShift')}
          </Button>
        </div>
      </Modal>

      {/* End Shift / Handover Modal */}
      <Modal
        title={<span className="text-lg font-bold text-slate-800">{t('staffShifts.endShiftTitle')}</span>}
        open={isEndShiftModalOpen}
        onCancel={() => setIsEndShiftModalOpen(false)}
        footer={null}
        centered
        width={450}
        destroyOnClose
      >
        <Form
          form={endShiftForm}
          layout="vertical"
          onFinish={handleEndShiftSubmit}
          className="pt-4 space-y-4"
        >
          {activeShift && (
            <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-100 dark:bg-slate-800/50 dark:border-slate-800 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">{t('staffShifts.shiftId')}</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">#{activeShift.shiftId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t('staffShifts.startTimeLabel')}</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{formatVietnamDateTime(activeShift.startTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t('staffShifts.systemCashLabel')}</span>
                <span className="font-extrabold text-indigo-600 text-sm">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(activeShift.systemCash || 0)}
                </span>
              </div>
            </div>
          )}

          <Form.Item
            name="actualCash"
            label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('staffShifts.actualCashLabel')}</span>}
            rules={[{ required: true, message: t('staffShifts.actualCashRequired') }]}
          >
            <Input
              type="number"
              placeholder="Ví dụ: 500000"
              className="h-11 rounded-xl text-lg font-bold"
              suffix={<span className="font-bold text-slate-400">VND</span>}
            />
          </Form.Item>

          <Form.Item
            name="notes"
            label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('staffShifts.notesLabel')}</span>}
          >
            <Input.TextArea
              rows={3}
              placeholder={t('staffShifts.notesPlaceholder')}
              className="rounded-xl"
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={loadingShift}
            className="w-full rounded-xl bg-rose-600 hover:bg-rose-700 border-none font-bold h-11"
          >
            {t('staffShifts.btnEndShift')}
          </Button>
        </Form>
      </Modal>
    </div>
  );
};

export default GateController;
