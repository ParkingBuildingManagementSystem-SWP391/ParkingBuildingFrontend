import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Select, Button, Alert, message, Table, Tag, Upload, Modal, Descriptions, Image, Radio } from 'antd';
import { parkingService } from '../../services/parkingService';
import Webcam from 'react-webcam';
import { 
  CheckCircle, 
  CreditCard, 
  Sparkles, 
  MonitorPlay,
  RefreshCw,
  Check
} from 'lucide-react';
import TicketModal from './TicketModal';

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
  const webcamRef = React.useRef(null);
  
  const theme = {
    emerald: {
      border: "border-emerald-500",
      borderHover: "hover:border-emerald-500 hover:text-emerald-600",
      bg: "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/40",
      text: "text-emerald-400",
      borderSoft: "border-emerald-500/30",
      shadowHex: "#34d399",
      bgLaser: "bg-emerald-400"
    },
    rose: {
      border: "border-rose-500",
      borderHover: "hover:border-rose-500 hover:text-rose-600",
      bg: "bg-rose-600 hover:bg-rose-500 shadow-rose-600/40",
      text: "text-rose-400",
      borderSoft: "border-rose-500/30",
      shadowHex: "#fb7185",
      bgLaser: "bg-rose-400"
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
      <div className={`relative aspect-video rounded-lg overflow-hidden bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-slate-500 gap-1.5 group hover:border-slate-700 transition-colors mb-4 ${isWebcamOn ? '' : 'p-2'}`}>
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
            <img src={previewUrl} alt="Vehicle" className="w-full h-full object-contain bg-slate-950 rounded-lg" />
            
            {isScanning && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
                <div 
                  className={`w-full h-0.5 ${theme.bgLaser} absolute left-0 animate-laser-scan`}
                  style={{ boxShadow: `0 0 15px ${theme.shadowHex}` }}
                ></div>
                <div className="absolute inset-0 bg-blue-500/10 animate-pulse mix-blend-overlay"></div>
              </div>
            )}

            <div className={`absolute bottom-1.5 left-1.5 right-1.5 ${ocrResult === 'Cần kiểm tra' ? 'bg-orange-500/90 text-white' : 'bg-slate-900/90'} px-2 py-1 rounded flex items-center justify-between text-[10px] font-mono shadow-md`}>
              <span className="text-white/80 font-bold uppercase text-[8px]">{type}</span>
              <span className={`font-semibold truncate max-w-[180px] ${ocrResult === 'Cần kiểm tra' ? 'text-white' : (ocrResult && !isScanning ? 'text-yellow-400' : 'text-slate-500')}`}>
                {isScanning ? 'AI SCANNING...' : (ocrResult || 'LOCAL IMAGE')}
              </span>
            </div>
          </>
        ) : (
          <>
            <MonitorPlay size={22} className={`text-slate-700 group-hover:${theme.text} transition-colors`} />
            <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase text-center">{type} Image Preview</span>
            <span className="text-[8px] text-slate-600 font-bold tracking-widest uppercase">Start camera or upload</span>
          </>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        {!isWebcamOn && !previewUrl && (
          <>
            <Button 
              onClick={onTurnOn}
              className={`flex-1 h-10 border-slate-200 ${theme.borderHover} rounded-lg flex items-center justify-center gap-1.5 font-bold shadow-sm`}
            >
              Turn On Camera
            </Button>
            <Upload
              accept="image/*"
              beforeUpload={(file) => {
                const isImage = file.type.startsWith('image/');
                if (!isImage) { message.error('You can only upload image files!'); return Upload.LIST_IGNORE; }
                if (file.size / 1024 / 1024 >= 5) { message.error('Image must be smaller than 5MB!'); return Upload.LIST_IGNORE; }
                onUpload(file);
                return false;
              }}
              showUploadList={false}
              className="flex-1 flex"
            >
              <Button className="w-full h-10 border-slate-200 hover:border-blue-500 hover:text-blue-600 rounded-lg flex items-center justify-center gap-1.5 font-bold shadow-sm">
                Upload File
              </Button>
            </Upload>
          </>
        )}
        
        {(isWebcamOn || previewUrl) && !isScanning && (
          <div className="flex gap-2 w-full">
            {previewUrl && onRetry && (
              <Button
                onClick={onRetry}
                className="flex-1 h-10 text-blue-500 border-slate-200 hover:text-blue-600 hover:border-blue-500 rounded-lg font-bold"
              >
                Retry
              </Button>
            )}
            <Button
              onClick={onClear}
              className="flex-1 h-10 text-slate-500 border-slate-200 hover:text-rose-500 hover:border-rose-500 rounded-lg font-bold"
            >
              {isWebcamOn ? 'Turn Off Camera' : 'Clear Data'}
            </Button>
          </div>
        )}
      </div>
    </>
  );
};


const GateController = () => {
  const [slots, setSlots] = useState([]);
  const [checkInForm] = Form.useForm();
  const [checkOutForm] = Form.useForm();
  const [checkInMode, setCheckInMode] = useState('walkin'); // 'walkin' or 'reservation'

  const [isQrPopupOpen, setIsQrPopupOpen] = useState(false);

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
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('CASH');
  const [cashReceived, setCashReceived] = useState('');
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [changeDue, setChangeDue] = useState(null);

  const fetchActiveParkedVehicles = async () => {
    try {
      const [floorG, floorB1, floorB2] = await Promise.all([
        parkingService.getSlotsByFloor(3),
        parkingService.getSlotsByFloor(1),
        parkingService.getSlotsByFloor(2)
      ]);
      
      const allSlots = [];
      const mapFloorSlots = (backendSlots, floorId, floorName) => {
        return (backendSlots || []).map((s) => {
          const slotStatus = s.slotStatus ? s.slotStatus.trim() : 'Available';
          let type = 'Car';
          if (s.typeId === 1) type = 'Bicycle';
          else if (s.typeId === 2) type = 'Motorbike';
          else if (s.typeId === 3) type = 'Car';

          return {
            id: s.slotName,
            status: slotStatus,
            floor: floorName,
            type: type,
            occupiedBy: slotStatus !== 'Available' ? {
              plate: null,
              checkInTime: null,
              type,
              hasSessionData: false
            } : null
          };
        });
      };

      allSlots.push(...mapFloorSlots(floorG, 3, 'Floor G'));
      allSlots.push(...mapFloorSlots(floorB1, 1, 'Floor B1'));
      allSlots.push(...mapFloorSlots(floorB2, 2, 'Floor B2'));

      setSlots(allSlots);
    } catch (err) {
      console.error("Failed to load active parked slots from backend:", err);
    }
  };

  const loadData = () => {
    fetchActiveParkedVehicles();
  };

  useEffect(() => {
    loadData();
    const handleStateChange = () => {
      loadData();
    };
    window.addEventListener('parking_state_changed', handleStateChange);

    return () => {
      window.removeEventListener('parking_state_changed', handleStateChange);
    };
  }, []);

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

  // Perform Check-in (Supports both Walk-in and Reservation QR code)
  const handleCheckInSubmit = async (values) => {
    try {
      const tempImageUrl = values.tempImageUrl || null;

      if (checkInMode === 'walkin') {
        const vehicleTypeId = VEHICLE_TYPE_MAP[values.type] || 3;
        
        // Call walk-in check-in API
        const response = await parkingService.walkInCheckIn(values.plate, vehicleTypeId, tempImageUrl);
        
        if (response && response.isSuccess) {
          const ticket = {
            id: response.data?.ticketCode || response.data?.TicketCode || "N/A",
            plate: response.data?.licenseVehicle || response.data?.LicenseVehicle || values.plate,
            type: values.type,
            slotId: response.data?.slotName || response.data?.SlotName || "N/A",
            checkInTime: response.data?.checkInTime || response.data?.CheckInTime || new Date().toISOString()
          };
          
          setTicketDetails(ticket);
          setIsTicketOpen(true);
          message.success(response.message || "Walk-in Check-in successful!");
          
          checkInForm.resetFields();
          if (entryImagePreviewUrl) {
            URL.revokeObjectURL(entryImagePreviewUrl);
            setEntryImagePreviewUrl(null);
          }
          setEntryOcrResult(null);
          fetchActiveParkedVehicles();
        } else {
          message.error(response?.message || "Check-in failed.");
        }
      } else {
        // Reservation mode
        const ticketCode = values.ticketCode;
        const licenseVehicle = values.plate;
        
        const response = await parkingService.checkInVehicle(ticketCode, licenseVehicle, tempImageUrl);
        
        if (response) {
          message.success(response.message || "Reservation QR Check-in successful! Barrier opened.");
          checkInForm.resetFields();
          if (entryImagePreviewUrl) {
            URL.revokeObjectURL(entryImagePreviewUrl);
            setEntryImagePreviewUrl(null);
          }
          setEntryOcrResult(null);
          fetchActiveParkedVehicles();
        } else {
          message.error("Check-in failed. Please verify QR Ticket Code.");
        }
      }
    } catch (err) {
      console.error("Check-in Error:", err);
      message.error(err.message || String(err));
    }
  };

  // Unified exit check-out handler (Supports matching by ticketCode + licensePlate)
  const handleCheckOut = async (paymentMethod = 'CASH', plateToUse = null) => {
    const plate = plateToUse || checkOutForm.getFieldValue('plate');
    const ticketCode = checkOutForm.getFieldValue('ticketCode');
    const tempImageUrl = checkOutForm.getFieldValue('tempImageUrl') || null;
    if (!plate) {
      message.error("Please input license plate number!");
      return;
    }
    
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
      
      if (isSuccess === false) {
        message.warning(messageText || "License plate mismatch!");
      } else {
        const totalAmt = result.totalAmount || result.TotalAmount || 0;
        setCashReceived(totalAmt.toString());
        if (isPaid) {
          message.success(messageText || "Khách hàng đã thanh toán trước qua App di động. Mời xe ra!");
          fetchActiveParkedVehicles();
          setTimeout(() => {
            handleCloseCheckoutResultModal();
          }, 3000);
        } else {
          message.success("Check-out processed. Verification panel opened.");
          fetchActiveParkedVehicles();
        }
      }
    } catch (err) {
      console.error("Check-out Error:", err);
      message.error(String(err));
    }
  };

  // Perform Check-out (form submit)
  const handleCheckOutSubmit = (values) => {
    handleCheckOut(values.paymentMethod || 'CASH');
  };

  // Cash payment confirmation handler
  const handleConfirmCashPayment = async () => {
    const ticketCode = checkoutResult?.ticketCode || checkoutResult?.TicketCode;
    const totalAmount = checkoutResult?.totalAmount || checkoutResult?.TotalAmount || 0;
    
    if (!ticketCode) {
      message.error("Invalid ticket code!");
      return;
    }
    
    const amount = parseFloat(cashReceived);
    if (isNaN(amount) || amount < totalAmount) {
      message.error(`Received cash must be at least ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAmount)}!`);
      return;
    }
    
    try {
      const res = await parkingService.processCashPayment(ticketCode, amount);
      if (res && res.success) {
        message.success(res.message || "Cash payment recorded successfully!");
        setChangeDue(res.changeDue);
        setCheckoutResult(prev => ({
          ...prev,
          isPaid: true,
          IsPaid: true,
          message: "Thanh toán tiền mặt thành công. Mở cổng cho xe ra."
        }));
        fetchActiveParkedVehicles();
        setTimeout(() => {
          handleCloseCheckoutResultModal();
        }, 3000);
      } else {
        message.error(res?.message || "Failed to process cash payment.");
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
      message.error("Invalid invoice ID!");
      return;
    }
    
    setIsCheckingStatus(true);
    try {
      const res = await parkingService.getPaymentStatus(invoiceId);
      if (res && (res.status === 'SUCCESS' || res.status === 'SUCCESS'.toLowerCase() || res.status === 'SUCCESS'.toUpperCase())) {
        message.success("Payment confirmed successfully! Barrier opened.");
        setCheckoutResult(prev => ({
          ...prev,
          isPaid: true,
          IsPaid: true,
          message: "Thanh toán VNPay thành công. Mở cổng cho xe ra."
        }));
        fetchActiveParkedVehicles();
        setTimeout(() => {
          handleCloseCheckoutResultModal();
        }, 2000);
      } else {
        message.info("Payment is still pending. Please wait for the driver to scan and complete payment.");
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
            message.success("VNPay payment confirmed! Exit gate is opening.");
            setCheckoutResult(prev => ({
              ...prev,
              isPaid: true,
              IsPaid: true,
              message: "Thanh toán VNPay thành công. Mở cổng cho xe ra."
            }));
            fetchActiveParkedVehicles();
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
      message.info('This row only contains slot data. Enter the license plate manually in the Exit Gate form.');
      const exitCard = document.getElementById('exit-gate-card');
      if (exitCard) {
        exitCard.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }
    checkOutForm.setFieldsValue({ plate });
    message.info(`Selected ${plate} for exit. Please upload check-out image and confirm.`);
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

  const occupiedSlots = slots.filter(s => s.status === 'Occupied' && s.occupiedBy);

  // Columns for active parked list
  const parkedColumns = [
    {
      title: 'Slot ID',
      dataIndex: 'id',
      key: 'id',
      render: (text) => (
        <Tag color="blue" className="font-bold border-blue-200 text-[#2563EB]">
          {text}
        </Tag>
      )
    },
    {
      title: 'License Plate',
      dataIndex: ['occupiedBy', 'plate'],
      key: 'plate',
      render: (text) => (
        <span className="font-mono text-slate-800 font-extrabold bg-slate-100 border border-slate-200 px-2 py-0.5 rounded shadow-sm text-xs">
          {text || 'N/A'}
        </span>
      )
    },
    {
      title: 'Classification',
      dataIndex: ['occupiedBy', 'type'],
      key: 'type',
      render: (type, record) => (
        <span className="text-xs font-semibold text-slate-600 capitalize">{type || record.type || 'N/A'}</span>
      )
    },
    {
      title: 'Entry Time',
      dataIndex: ['occupiedBy', 'checkInTime'],
      key: 'checkInTime',
      render: (text) => text ? new Date(text).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 'N/A'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => {
        const plate = record.occupiedBy?.plate;
        return (
          <Button
            type="primary"
            danger
            size="small"
            disabled={!plate}
            title={!plate ? 'Backend slot API does not include license plate/session data. Use manual Exit Gate form.' : undefined}
            onClick={() => handleDirectCheckOut(plate)}
            className="flex items-center gap-1 h-7 rounded text-[11px] font-bold"
          >
            Check-Out
          </Button>
        );
      }
    }
  ];

  return (
    <div className="space-y-6 pb-12 font-sans select-none">


      {/* TOP ROW - TWO COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT COLUMN: Entry Gate Control */}
        <div className="space-y-6">
          <Card 
            title={
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
                  <span className="text-sm font-bold text-slate-800">Entry Gate - Vehicle Check-In</span>
                </div>
              </div>
            }
            className="shadow-sm border border-slate-200"
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
                  const file = dataURLtoFile(imageSrc, "entry_capture.jpg");
                  if (!file) throw new Error("Invalid captured image.");
                  const type = checkInForm.getFieldValue('type') || 'Car';
                  const typeId = VEHICLE_TYPE_MAP[type] || 3;
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
                      setEntryOcrResult('Cần kiểm tra');
                      message.warning("ALPR: Low confidence. Please verify plate manually.");
                    } else {
                      setEntryOcrResult(predictedPlate);
                      checkInForm.setFieldsValue({
                        plate: predictedPlate,
                        tempImageUrl: rawImageUrl
                      });
                      message.success(`ALPR: Nhận diện biển số: ${predictedPlate}`);

                      // --- BỔ SUNG TỰ ĐỘNG KIỂM TRA ĐẶT CHỖ BẰNG BIỂN SỐ ---
                      try {
                        const checkRes = await parkingService.scanCheckIn(null, predictedPlate);
                        if (checkRes && checkRes.isSuccess) {
                          // Tự chuyển sang chế độ Reservation và điền mã vé QR
                          setCheckInMode('reservation');
                          checkInForm.setFieldsValue({
                            ticketCode: checkRes.ticketCode || checkRes.TicketCode
                          });
                          message.success(`Phát hiện đặt chỗ của tài xế: ${checkRes.driverName || "N/A"}`);
                        }
                      } catch (err) {
                        // Không có lịch đặt trước -> Giữ nguyên chế độ Walk-in
                        setCheckInMode('walkin');
                      }
                      // ----------------------------------------------------
                    }
                  } else {
                    setEntryOcrResult('Cần kiểm tra');
                    message.warning(msg || "ALPR: Could not clearly read license plate. Please enter it manually.");
                  }
                } catch (err) {
                  console.error("Entry recognition error:", err);
                  setEntryOcrResult('Cần kiểm tra');
                  message.warning(`${err?.message || String(err)} Please enter the plate manually.`);
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
                  const type = checkInForm.getFieldValue('type') || 'Car';
                  const typeId = VEHICLE_TYPE_MAP[type] || 3;
                  const result = await parkingService.recognizeLicensePlate(file, typeId);

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
                      setEntryOcrResult('Cần kiểm tra');
                      message.warning("ALPR: Low confidence. Please verify plate manually.");
                    } else {
                      setEntryOcrResult(predictedPlate);
                      checkInForm.setFieldsValue({
                        plate: predictedPlate,
                        tempImageUrl: rawImageUrl
                      });
                      message.success(`ALPR: Nhận diện biển số: ${predictedPlate}`);

                      // --- BỔ SUNG TỰ ĐỘNG KIỂM TRA ĐẶT CHỖ BẰNG BIỂN SỐ ---
                      try {
                        const checkRes = await parkingService.scanCheckIn(null, predictedPlate);
                        if (checkRes && checkRes.isSuccess) {
                          setCheckInMode('reservation');
                          checkInForm.setFieldsValue({
                            ticketCode: checkRes.ticketCode || checkRes.TicketCode
                          });
                          message.success(`Phát hiện đặt chỗ của tài xế: ${checkRes.driverName || "N/A"}`);
                        }
                      } catch (err) {
                        setCheckInMode('walkin');
                      }
                      // ----------------------------------------------------
                    }
                  } else {
                    setEntryOcrResult('Cần kiểm tra');
                    message.warning(msg || "ALPR: Could not clearly read license plate. Please enter it manually.");
                  }
                } catch (err) {
                  console.error("Entry recognition error:", err);
                  setEntryOcrResult('Cần kiểm tra');
                  message.warning(`${err?.message || String(err)} Please enter the plate manually.`);
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

            {/* Check-In Mode Toggle */}
            <div className="p-1 bg-slate-100 border border-slate-200/80 rounded-xl grid grid-cols-2 gap-1 mb-4 shadow-inner">
              <button
                type="button"
                onClick={() => {
                  setCheckInMode('walkin');
                  checkInForm.resetFields();
                }}
                className={`flex items-center justify-center py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  checkInMode === 'walkin'
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                Check-In
              </button>
              <button
                type="button"
                onClick={() => {
                  setCheckInMode('reservation');
                  checkInForm.resetFields();
                }}
                className={`flex items-center justify-center py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  checkInMode === 'reservation'
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                Reservation QR
              </button>
            </div>

            {/* Check-In Form */}
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

              {checkInMode === 'reservation' && (
                <Form.Item
                  name="ticketCode"
                  label={<span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Ticket / QR Code</span>}
                  rules={[{ required: true, message: 'Please input or scan QR ticket code!' }]}
                  className="mb-3"
                >
                  <Input placeholder="e.g. QR_B5F9A1D8" className="h-10 bg-slate-50 border-slate-200 text-slate-800 rounded-lg font-mono uppercase font-bold focus:bg-white focus:border-emerald-500" />
                </Form.Item>
              )}

              <Form.Item
                name="plate"
                label={<span className="text-slate-500 text-xs font-bold uppercase tracking-wider">License Plate Number</span>}
                rules={[{ required: checkInMode === 'walkin', message: 'Please input plate number!' }]}
                className="mb-3"
              >
                <Input onChange={handlePlateChange} placeholder="e.g. 30A-123.45" className="h-10 bg-slate-50 border-slate-200 text-slate-800 rounded-lg font-mono uppercase font-bold focus:bg-white focus:border-emerald-500" />
              </Form.Item>

              {checkInMode === 'walkin' && (
                <div className="grid grid-cols-1 gap-4 mb-3">
                  <Form.Item
                    name="type"
                    label={<span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Classification</span>}
                    rules={[{ required: true, message: 'Select type!' }]}
                    initialValue="Car"
                    className="mb-0"
                  >
                    <Radio.Group className="flex w-full" buttonStyle="solid">
                      <Radio.Button value="Car" className="flex-1 text-center h-10 leading-[38px] font-semibold text-sm">Car</Radio.Button>
                      <Radio.Button value="Motorbike" className="flex-1 text-center h-10 leading-[38px] font-semibold text-sm">Motorbike</Radio.Button>
                      <Radio.Button value="Bicycle" className="flex-1 text-center h-10 leading-[38px] font-semibold text-sm">Bicycle</Radio.Button>
                    </Radio.Group>
                  </Form.Item>
                </div>
              )}

              <div className="pt-2">
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 border-none font-bold rounded-lg transition-all shadow-md shadow-emerald-600/10 flex items-center justify-center gap-1.5"
                >
                  <Sparkles size={15}/> {checkInMode === 'reservation' ? 'Verify QR Code & Open Gate' : 'Print Ticket & Open Gate'}
                </Button>
              </div>
            </Form>

            {checkInMode === 'reservation' && (
              <div className="flex gap-2 mt-3">
                <Button 
                  type="dashed"
                  onClick={() => setIsQrPopupOpen(true)} 
                  className="w-full h-10 border-indigo-300 text-indigo-600 font-bold"
                >
                  [Quét Mã QR Đặt Chỗ]
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* RIGHT COLUMN: Exit Gate Control */}
        <div className="space-y-6">
          <Card 
            id="exit-gate-card"
            title={
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-rose-500 rounded-full"></span>
                  <span className="text-sm font-bold text-slate-800">Exit Gate - Vehicle Check-Out</span>
                </div>
              </div>
            }
            className="shadow-sm border border-slate-200"
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
                  const file = dataURLtoFile(imageSrc, "exit_capture.jpg");
                  if (!file) throw new Error("Invalid captured image.");
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
                      setExitOcrResult('Cần kiểm tra');
                      message.warning("ALPR: Low confidence. Please verify plate manually.");
                    } else {
                      setExitOcrResult(predictedPlate);
                      checkOutForm.setFieldsValue({
                        plate: predictedPlate,
                        tempImageUrl: rawImageUrl
                      });
                      message.success(`ALPR: Nhận diện biển số: ${predictedPlate}`);

                      // --- BỔ SUNG TỰ ĐỘNG ĐỐI CHIẾU CHECK-OUT BẰNG BIỂN SỐ ---
                      try {
                        const scanRes = await parkingService.scanCheckOut(null, predictedPlate);
                        if (scanRes && scanRes.isSuccess) {
                          // Mở Popup modal hiển thị thông tin đối soát & thanh toán trực tiếp
                          setCheckoutResult(scanRes);
                          setIsCheckoutResultModalOpen(true);
                          
                          if (scanRes.isPaid) {
                            message.success("Xe đã thanh toán trước qua App di động. Mời xe ra!");
                          }
                        }
                      } catch (err) {
                        // Báo lỗi nếu xe không có phiên đỗ hợp lệ trong bãi đỗ
                        message.warning("Không tìm thấy xe đang đỗ. Vui lòng quét mã QR hoặc gõ mã vé!");
                      }
                      // ------------------------------------------------------
                    }
                  } else {
                    setExitOcrResult('Cần kiểm tra');
                    message.warning(msg || "ALPR: Could not clearly read license plate. Please enter it manually.");
                  }
                } catch (err) {
                  console.error("Exit recognition error:", err);
                  setExitOcrResult('Cần kiểm tra');
                  message.warning(`${err?.message || String(err)} Please enter the plate manually.`);
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
                  const result = await parkingService.recognizeLicensePlate(file, 3);
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
                      setExitOcrResult('Cần kiểm tra');
                      message.warning("ALPR: Low confidence. Please verify plate manually.");
                    } else {
                      setExitOcrResult(predictedPlate);
                      checkOutForm.setFieldsValue({
                        plate: predictedPlate,
                        tempImageUrl: rawImageUrl
                      });
                      message.success(`ALPR: Nhận diện biển số: ${predictedPlate}`);

                      // --- BỔ SUNG TỰ ĐỘNG ĐỐI CHIẾU CHECK-OUT BẰNG BIỂN SỐ ---
                      try {
                        const scanRes = await parkingService.scanCheckOut(null, predictedPlate);
                        if (scanRes && scanRes.isSuccess) {
                          setCheckoutResult(scanRes);
                          setIsCheckoutResultModalOpen(true);
                          
                          if (scanRes.isPaid) {
                            message.success("Xe đã thanh toán trước qua App di động. Mời xe ra!");
                          }
                        }
                      } catch (err) {
                        message.warning("Không tìm thấy xe đang đỗ. Vui lòng quét mã QR hoặc gõ mã vé!");
                      }
                      // ------------------------------------------------------
                    }
                  } else {
                    setExitOcrResult('Cần kiểm tra');
                    message.warning(msg || "ALPR: Could not clearly read license plate. Please enter it manually.");
                  }
                } catch (err) {
                  console.error("Exit recognition error:", err);
                  setExitOcrResult('Cần kiểm tra');
                  message.warning(`${err?.message || String(err)} Please enter the plate manually.`);
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
                label={<span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Ticket / QR Code</span>}
                className="mb-2"
              >
                <Input placeholder="e.g. QR_B5F9A1D8" className="h-10 bg-slate-50 border-slate-200 text-slate-800 rounded-lg font-mono uppercase font-bold focus:bg-white focus:border-rose-500" />
              </Form.Item>

              <Form.Item
                name="plate"
                label={<span className="text-slate-500 text-xs font-bold uppercase tracking-wider">License Plate Number</span>}
                rules={[{ required: true, message: 'Please input plate number!' }]}
                className="mb-2"
              >
                <Input onChange={handleCheckOutPlateChange} placeholder="e.g. 29A-888.88" className="h-10 bg-slate-50 border-slate-200 text-slate-800 rounded-lg uppercase font-bold focus:bg-white focus:border-rose-500" />
              </Form.Item>

              <Form.Item
                name="paymentMethod"
                label={<span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Payment Method</span>}
                initialValue="CASH"
                className="mb-3"
              >
                <Radio.Group className="w-full" buttonStyle="solid">
                  <div className="grid grid-cols-2 gap-3 w-full">
                    <Radio.Button value="CASH" className="h-10 text-center font-bold rounded-lg border-slate-200 hover:border-rose-500 hover:text-rose-600 transition-colors cursor-pointer">
                      <span className="flex items-center justify-center h-full gap-1.5 pt-0.5">
                        <CreditCard size={15} className="text-rose-500" /> Cash (Tiền mặt)
                      </span>
                    </Radio.Button>
                    <Radio.Button value="VNPAY" className="h-10 text-center font-bold rounded-lg border-slate-200 hover:border-emerald-500 hover:text-emerald-600 transition-colors cursor-pointer">
                      <span className="flex items-center justify-center h-full gap-1.5 pt-0.5">
                        <CreditCard size={15} className="text-emerald-500" /> VNPay (QR Code)
                      </span>
                    </Radio.Button>
                  </div>
                </Radio.Group>
              </Form.Item>

              <div className="pt-2">
                <Button 
                  type="primary"
                  htmlType="submit" 
                  className="w-full h-11 font-bold bg-rose-600 hover:bg-rose-500 text-white border-none rounded-lg flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/10 cursor-pointer"
                >
                  <CreditCard size={15}/> Process Check-Out & Verify
                </Button>
              </div>
            </Form>

            <div className="flex gap-2 mt-3">
              <Button 
                type="dashed"
                onClick={() => setIsQrPopupOpen(true)} // Mở popup camera quét QR vé cổng ra
                className="w-full h-10 border-rose-300 text-rose-600 font-bold"
              >
                [Quét Mã QR Vé Cổng Ra]
              </Button>
            </div>
          </Card>
        </div>

      </div>

      {/* BOTTOM ROW - FULL WIDTH: Active Parked Vehicles directory table */}
      <Card 
        title={
          <div className="flex items-center justify-between w-full">
            <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
              Active Parked Vehicles — <span className="text-[#2563EB] font-extrabold">{occupiedSlots.length} In-Building</span>
            </span>
          </div>
        } 
        className="shadow-sm border border-slate-200"
      >
        {occupiedSlots.length === 0 ? (
          <div className="text-center py-20 text-slate-400 flex flex-col items-center">
            <CheckCircle size={44} className="text-emerald-500/20 mb-3" />
            <h3 className="text-slate-700 font-bold">All Parking Slots Available</h3>
            <p className="text-xs text-slate-505 mt-1 max-w-xs">No active vehicles are parked. Use the simulator camera scanners to record arrivals.</p>
          </div>
        ) : (
          <Table 
            columns={parkedColumns} 
            dataSource={occupiedSlots} 
            rowKey="id" 
            pagination={{ pageSize: 5, showTotal: (total) => `Total ${total} parked vehicles` }}
            className="custom-antd-table text-slate-800"
          />
        )}
      </Card>

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
          <div className="flex items-center gap-2 text-slate-800 border-b border-slate-150 pb-3 font-bold text-lg font-sans">
            <span className="w-2.5 h-2.5 bg-rose-500 rounded-full"></span>
            Exit Gate Verification & Payment
          </div>
        }
        open={isCheckoutResultModalOpen}
        onCancel={handleCloseCheckoutResultModal}
        footer={[
          <Button key="close" type="dashed" onClick={handleCloseCheckoutResultModal} className="font-bold h-10 px-5 rounded-lg">
            Close Panel
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
          const extraAmount = checkoutResult.extraAmount ?? checkoutResult.ExtraAmount ?? checkoutResult.additionalAmount ?? checkoutResult.AdditionalAmount;
          const isOverGracePeriod = checkoutResult.isOverGracePeriod ?? checkoutResult.IsOverGracePeriod;
          const hasExtraFeeSignal = !isPaid && (
            Number(extraAmount || 0) > 0 ||
            isOverGracePeriod === true ||
            /extra|additional|grace|quá hạn|thu thêm|phụ thu/i.test(String(messageText || ''))
          );
          const amountDueLabel = isPaid
            ? 'Đã thanh toán - Không cần thu thêm'
            : hasExtraFeeSignal
              ? 'Số tiền cần thu thêm'
              : 'Số tiền cần thu';

          return (
            <div className="space-y-6 pt-4">
              {!isSuccess ? (
                <Alert
                  message="SECURITY EXCLUSION / BLOCKING WARNING"
                  description={messageText || "Plate Mismatch Detected! Exit Gate remains closed."}
                  type="error"
                  showIcon
                  className="rounded-xl font-bold"
                />
              ) : (
                <Alert
                  message="Plate Verification Successful"
                  description={messageText || "Plates match. Check payment status to open gate."}
                  type="success"
                  showIcon
                  className="rounded-xl font-bold"
                />
              )}

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Left Column: License Plates, Images & Session Details (col-span-7) */}
                <div className="md:col-span-7 space-y-4">
                  {/* Security Verification panel */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                    <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">License Plate & Security Verification</h3>
                    
                    <div className="space-y-2 font-mono text-xs">
                      <div className="flex justify-between items-center bg-white p-2.5 rounded border border-slate-100 shadow-sm">
                        <span className="text-slate-500 font-bold">Entered Checkout Plate:</span>
                        <Tag color="blue" className="font-bold font-mono">{checkOutForm.getFieldValue('plate') || "N/A"}</Tag>
                      </div>
                      <div className="flex justify-between items-center bg-white p-2.5 rounded border border-slate-100 shadow-sm">
                        <span className="text-slate-500 font-bold">Check-in Plate (DB):</span>
                        <Tag color="cyan" className="font-bold font-mono">{checkInLicensePlate || "N/A"}</Tag>
                      </div>
                      <div className="flex justify-between items-center bg-white p-2.5 rounded border border-slate-100 shadow-sm">
                        <span className="text-slate-500 font-bold">Check-out Plate (DB):</span>
                        <Tag color="purple" className="font-bold font-mono">{checkOutLicensePlate || "N/A"}</Tag>
                      </div>
                      <div className="flex justify-between items-center bg-white p-2.5 rounded border border-slate-100 shadow-sm">
                        <span className="text-slate-500 font-bold">Plate Match Status:</span>
                        {isLicensePlateMatched ? (
                          <Tag color="success" className="font-bold">MATCHED</Tag>
                        ) : (
                          <Tag color="error" className="font-bold">MISMATCHED</Tag>
                        )}
                      </div>
                    </div>

                    {/* Images side by side */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Check-in Image</span>
                        <div className="w-full aspect-[4/3] bg-slate-900 rounded overflow-hidden border border-slate-200 flex items-center justify-center">
                          {checkInImageUrl ? (
                            <Image
                              src={checkInImageUrl}
                              alt="Check-in"
                              className="w-full h-full object-cover"
                              fallback="https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&q=80&w=600"
                            />
                          ) : (
                            <span className="text-[9px] text-slate-500 font-bold uppercase">No Image</span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Check-out Image</span>
                        <div className="w-full aspect-[4/3] bg-slate-900 rounded overflow-hidden border border-slate-200 flex items-center justify-center">
                          {exitImagePreviewUrl ? (
                            <Image
                              src={exitImagePreviewUrl}
                              alt="Check-out"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-[9px] text-slate-500 font-bold uppercase">No Image</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {!isSuccess && (
                      <div className="mt-4 flex gap-3 pt-2">
                        <Button 
                          type="primary"
                          onClick={() => handleCheckOut(selectedPaymentMethod, checkInLicensePlate)} 
                          className="flex-1 h-10 font-bold rounded-lg bg-amber-600 hover:bg-amber-500 border-none flex items-center justify-center cursor-pointer text-white"
                        >
                          Bỏ qua cảnh báo (Cho xe ra)
                        </Button>
                        <Button 
                          onClick={handleCloseCheckoutResultModal} 
                          className="flex-1 h-10 font-bold rounded-lg cursor-pointer"
                        >
                          Giữ xe lại giải quyết
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Session Details */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-3">Session Details</h3>
                    <Descriptions column={2} size="small" bordered className="bg-white rounded-lg overflow-hidden border border-slate-200/60 font-sans">
                      <Descriptions.Item label={<span className="text-[11px] font-bold text-slate-500">Session ID</span>}>
                        <span className="text-xs font-extrabold text-slate-800">{sessionId || "N/A"}</span>
                      </Descriptions.Item>
                      <Descriptions.Item label={<span className="text-[11px] font-bold text-slate-500">Ticket Code</span>}>
                        <span className="text-xs font-mono font-bold text-slate-800">{ticketCode || "N/A"}</span>
                      </Descriptions.Item>
                      <Descriptions.Item label={<span className="text-[11px] font-bold text-slate-500">Slot Name</span>}>
                        <Tag color="geekblue" className="font-bold m-0">{slotName || "N/A"}</Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label={<span className="text-[11px] font-bold text-slate-500">Duration</span>}>
                        <span className="text-xs font-bold text-slate-800">{durationHours || 0} Hours</span>
                      </Descriptions.Item>
                      <Descriptions.Item label={<span className="text-[11px] font-bold text-slate-500">Check-in Time</span>}>
                        <span className="text-[10px] text-slate-600 font-medium">
                          {checkInTime ? new Date(checkInTime).toLocaleString('vi-VN') : "N/A"}
                        </span>
                      </Descriptions.Item>
                      <Descriptions.Item label={<span className="text-[11px] font-bold text-slate-500">Check-out Time</span>}>
                        <span className="text-[10px] text-slate-600 font-medium">
                          {checkOutTime ? new Date(checkOutTime).toLocaleString('vi-VN') : "N/A"}
                        </span>
                      </Descriptions.Item>
                      <Descriptions.Item label={<span className="text-[11px] font-bold text-slate-500">Payment Status</span>}>
                        {isPaid ? (
                          <Tag color="success" className="font-bold m-0">PAID</Tag>
                        ) : (
                          <Tag color="warning" className="font-bold m-0">PENDING</Tag>
                        )}
                      </Descriptions.Item>
                      <Descriptions.Item label={<span className="text-[11px] font-bold text-slate-500">{amountDueLabel}</span>}>
                        <span className="text-xs font-extrabold text-rose-600">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAmount || 0)}
                        </span>
                      </Descriptions.Item>
                    </Descriptions>
                  </div>
                </div>

                {/* Right Column: Checkout & Payment Center (col-span-5) */}
                <div className="md:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                      <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Payment Action Center</h3>
                      <Tag color={selectedPaymentMethod === 'VNPAY' ? 'blue' : 'orange'} className="font-bold font-mono">
                        {selectedPaymentMethod}
                      </Tag>
                    </div>

                    {/* Paid Alert */}
                    {isSuccess && isPaid && (
                      <div className="space-y-4 py-8 text-center">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3 animate-pulse">
                          <Check size={32} className="text-emerald-600" />
                        </div>
                        <h4 className="text-lg font-bold text-emerald-800">Thanh toán thành công</h4>
                        <p className="text-sm text-slate-500 leading-relaxed">Cổng barrier đã mở. Mời xe ra khỏi bãi đỗ.</p>
                        
                        {changeDue !== null && changeDue > 0 && (
                          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-800 font-bold max-w-xs mx-auto mt-4">
                            <span>Tiền thừa thối lại:</span>
                            <span className="text-base text-amber-700">
                              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(changeDue)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Unpaid Flow: VNPAY */}
                    {isSuccess && !isPaid && selectedPaymentMethod === 'VNPAY' && paymentUrl && (
                      <div className="space-y-5">
                        <div className="bg-blue-50/50 border border-blue-150 p-4 rounded-xl flex flex-col items-center justify-center shadow-inner relative overflow-hidden">
                          <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest mb-1">{amountDueLabel}</span>
                          <span className="text-2xl font-black text-blue-700">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAmount || 0)}
                          </span>
                        </div>

                        {/* Interactive QR Code Card */}
                        <div className="relative group flex justify-center bg-white p-4 rounded-xl border border-slate-200 max-w-[240px] mx-auto shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
                          {/* Laser Scan line micro-animation */}
                          <div className="absolute top-0 left-0 right-0 h-0.5 bg-sky-500/80 shadow-[0_0_8px_#0ea5e9] animate-scan pointer-events-none"></div>
                          
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(paymentUrl)}`}
                            alt="VNPay QR Code"
                            className="w-48 h-48 object-contain transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>

                        <div className="flex flex-col gap-2 pt-2">
                          <Button
                            type="primary"
                            icon={<RefreshCw size={14} className={isCheckingStatus ? "animate-spin" : ""} />}
                            loading={isCheckingStatus}
                            onClick={handleRefreshPaymentStatus}
                            className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 border-none font-bold rounded-xl flex items-center justify-center gap-1.5 text-white cursor-pointer transition-all duration-200 transform active:scale-95 shadow-md"
                          >
                            Kiểm tra trạng thái thanh toán (F5)
                          </Button>
                          <Button
                            type="link"
                            size="small"
                            onClick={() => window.open(paymentUrl, '_blank')}
                            className="text-xs text-blue-600 hover:text-blue-500 font-bold mt-1"
                          >
                            Mở liên kết thanh toán ở tab mới
                          </Button>
                        </div>
                        <p className="text-[10px] text-slate-400 text-center font-medium leading-relaxed">
                          Hệ thống quét trạng thái tự động mỗi 3 giây. Barrier sẽ tự động mở khi giao dịch thành công.
                        </p>
                      </div>
                    )}

                    {/* Unpaid Flow: CASH */}
                    {isSuccess && !isPaid && selectedPaymentMethod === 'CASH' && (
                      <div className="space-y-4">
                        <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 flex flex-col items-center justify-center shadow-inner">
                          <span className="text-[10px] font-extrabold text-amber-600 uppercase tracking-widest mb-1">{amountDueLabel}</span>
                          <span className="text-2xl font-black text-amber-700">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAmount || 0)}
                          </span>
                        </div>

                        <div className="space-y-3">
                          <span className="text-xs font-bold text-slate-500 block">Số tiền khách đưa (VNĐ):</span>
                          <Input
                            type="number"
                            placeholder="Nhập số tiền..."
                            value={cashReceived}
                            onChange={(e) => setCashReceived(e.target.value)}
                            className="h-14 bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl font-mono font-bold text-2xl px-5 transition-all focus:bg-white focus:ring-4 focus:ring-amber-500/10 focus:border-amber-400 hover:border-slate-300 shadow-sm"
                            suffix={<span className="font-extrabold text-slate-400 text-sm">VNĐ</span>}
                          />
                          
                          {/* Quick Denominations Grid */}
                          <div className="grid grid-cols-3 gap-2.5 pt-2">
                            <Button 
                              onClick={() => setCashReceived(totalAmount.toString())}
                              className="h-10 text-[11px] font-bold bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 shadow-sm transition-all"
                            >
                              Đủ tiền
                            </Button>
                            <Button 
                              onClick={() => {
                                const val = parseFloat(cashReceived) || 0;
                                setCashReceived((val + 50000).toString());
                              }}
                              className="h-10 text-[11px] font-bold bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 shadow-sm transition-all"
                            >
                              +50K
                            </Button>
                            <Button 
                              onClick={() => {
                                const val = parseFloat(cashReceived) || 0;
                                setCashReceived((val + 100000).toString());
                              }}
                              className="h-10 text-[11px] font-bold bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 shadow-sm transition-all"
                            >
                              +100K
                            </Button>
                            <Button 
                              onClick={() => {
                                const val = parseFloat(cashReceived) || 0;
                                setCashReceived((val + 200000).toString());
                              }}
                              className="h-10 text-[11px] font-bold bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 shadow-sm transition-all"
                            >
                              +200K
                            </Button>
                            <Button 
                              onClick={() => {
                                const val = parseFloat(cashReceived) || 0;
                                setCashReceived((val + 500000).toString());
                              }}
                              className="h-10 text-[11px] font-bold bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 shadow-sm transition-all"
                            >
                              +500K
                            </Button>
                            <Button 
                              onClick={() => setCashReceived('')}
                              className="h-10 text-[11px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-100 shadow-sm transition-all"
                            >
                              Xóa
                            </Button>
                          </div>
                        </div>

                        {cashReceived && parseFloat(cashReceived) >= totalAmount && (
                          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-between text-xs text-emerald-800 font-bold shadow-sm">
                            <span className="uppercase tracking-widest text-[10px]">Tiền thừa thối lại:</span>
                            <span className="text-xl font-black text-emerald-600">
                              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(parseFloat(cashReceived) - totalAmount)}
                            </span>
                          </div>
                        )}

                        <Button
                          type="primary"
                          icon={<Check size={18} />}
                          onClick={handleConfirmCashPayment}
                          className="w-full h-14 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 border-none font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 text-white mt-4 transition-all duration-300 transform hover:-translate-y-0.5"
                        >
                          Xác nhận Đã Thu Tiền & Mở Cổng
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
};

export default GateController;
