import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Select, Button, Alert, message, Table, Tag, Upload, Modal, Descriptions, Image } from 'antd';
import { parkingService } from '../../services/parkingService';
import { 
  CheckCircle, 
  CreditCard, 
  Sparkles, 
  MonitorPlay
} from 'lucide-react';
import TicketModal from './TicketModal';

const GateController = () => {
  const [slots, setSlots] = useState([]);
  const [checkInForm] = Form.useForm();
  const [checkOutForm] = Form.useForm();

  // Frontend-only image upload/preview states
  const [entryImagePreviewUrl, setEntryImagePreviewUrl] = useState(null);
  const [exitImagePreviewUrl, setExitImagePreviewUrl] = useState(null);

  // Checkout result and verification modal states
  const [checkoutResult, setCheckoutResult] = useState(null);
  const [isCheckoutResultModalOpen, setIsCheckoutResultModalOpen] = useState(false);

  // States to manage print receipts/tickets
  const [ticketDetails, setTicketDetails] = useState(null);
  const [receiptDetails, setReceiptDetails] = useState(null);
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

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

  // Perform Check-in (Walk-in)
  const handleCheckInSubmit = async (values) => {
    try {
      const vehicleTypeId = VEHICLE_TYPE_MAP[values.type] || 1;
      
      // Call walk-in check-in API
      const response = await parkingService.walkInCheckIn(values.plate, vehicleTypeId, null);
      
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
        fetchActiveParkedVehicles();
      } else {
        message.error(response?.message || "Check-in failed.");
      }
    } catch (err) {
      console.error("Walk-in Check-in Error:", err);
      message.error(err.message || String(err));
    }
  };

  // Unified exit check-out handler
  const handleCheckOut = async (paymentMethod = 'CASH') => {
    const plate = checkOutForm.getFieldValue('plate');
    if (!plate) {
      message.error("Please input license plate number!");
      return;
    }
    
    try {
      // Call the real checkOutVehicle API on backend with VNPAY or CASH
      const result = await parkingService.checkOutVehicle(null, plate, null, null, paymentMethod);
      
      setCheckoutResult(result);
      setIsCheckoutResultModalOpen(true);
      
      const isSuccess = result.isSuccess || result.IsSuccess;
      const messageText = result.message || result.Message;
      
      if (isSuccess === false) {
        message.warning(messageText || "License plate mismatch!");
      } else {
        message.success("Check-out processed. Verification panel opened.");
        fetchActiveParkedVehicles();
      }
    } catch (err) {
      console.error("Check-out Error:", err);
      message.error(String(err));
    }
  };

  // Perform Check-out (form submit defaults to VNPAY)
  const handleCheckOutSubmit = (values) => {
    handleCheckOut('VNPAY');
  };

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
        <span className="text-xs font-semibold text-slate-650 capitalize">{type || record.type || 'N/A'}</span>
      )
    },
    {
      title: 'Entry Time',
      dataIndex: ['occupiedBy', 'checkInTime'],
      key: 'checkInTime',
      render: (text) => text ? new Date(text).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'
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
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Shift Counter Terminal</h1>
        <p className="text-slate-500 text-sm mt-0.5">Simultaneous entry and exit lanes control center</p>
      </div>

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
            <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-slate-500 gap-1.5 p-2 group hover:border-slate-700 transition-colors mb-4">
              {entryImagePreviewUrl ? (
                <img src={entryImagePreviewUrl} alt="Entry uploaded vehicle" className="w-full h-full object-cover rounded-lg" />
              ) : (
                <>
                  <MonitorPlay size={22} className="text-slate-700 group-hover:text-emerald-400 transition-colors" />
                  <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase text-center">Entry Image Preview</span>
                  <span className="text-[8px] text-slate-600 font-bold tracking-widest uppercase">Upload vehicle image</span>
                </>
              )}
              {entryImagePreviewUrl && (
                <div className="absolute inset-0 pointer-events-none border border-emerald-500/30">
                  <div className="absolute top-2 left-2 w-2 h-2 border-t-2 border-l-2 border-emerald-500"></div>
                  <div className="absolute top-2 right-2 w-2 h-2 border-t-2 border-r-2 border-emerald-500"></div>
                  <div className="absolute bottom-2 left-2 w-2 h-2 border-b-2 border-l-2 border-emerald-500"></div>
                  <div className="absolute bottom-2 right-2 w-2 h-2 border-b-2 border-r-2 border-emerald-500"></div>
                </div>
              )}
              <div className="absolute bottom-1.5 left-1.5 right-1.5 bg-slate-900/90 px-2 py-1 rounded flex items-center justify-between text-[10px] font-mono shadow-md">
                <span className="text-white/60 font-bold uppercase text-[8px]">ENTRY</span>
                <span className={`font-semibold truncate max-w-[180px] ${entryImagePreviewUrl ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {entryImagePreviewUrl ? 'LOCAL UPLOAD' : 'NO IMAGE'}
                </span>
              </div>
            </div>

            {/* Entry Gate local image upload */}
            <div className="flex gap-3 mb-4">
              <Upload
                accept="image/*"
                beforeUpload={(file) => {
                  const isImage = file.type.startsWith('image/');
                  if (!isImage) {
                    message.error('You can only upload image files!');
                    return Upload.LIST_IGNORE;
                  }
                  const isLt5M = file.size / 1024 / 1024 < 5;
                  if (!isLt5M) {
                    message.error('Image must be smaller than 5MB!');
                    return Upload.LIST_IGNORE;
                  }
                  if (entryImagePreviewUrl) {
                    URL.revokeObjectURL(entryImagePreviewUrl);
                  }
                  const url = URL.createObjectURL(file);
                  setEntryImagePreviewUrl(url);
                  return false;
                }}
                showUploadList={false}
                className="w-full flex-1"
              >
                <Button className="w-full h-10 border-slate-200 hover:border-emerald-500 hover:text-emerald-600 rounded-lg flex items-center justify-center gap-1.5 font-bold shadow-sm">
                  Upload Entry Image
                </Button>
              </Upload>
              {entryImagePreviewUrl && (
                <Button
                  onClick={() => {
                    if (entryImagePreviewUrl) {
                      URL.revokeObjectURL(entryImagePreviewUrl);
                      setEntryImagePreviewUrl(null);
                    }
                  }}
                  className="h-10 text-slate-505 border-slate-200 hover:text-rose-500 hover:border-rose-500 rounded-lg font-bold"
                >
                  Clear Image
                </Button>
              )}
            </div>

            {/* Check-In Form */}
            <Form
              form={checkInForm}
              layout="vertical"
              onFinish={handleCheckInSubmit}
              requiredMark={false}
              className="space-y-3"
            >
              <Form.Item
                name="plate"
                label={<span className="text-slate-500 text-xs font-bold uppercase tracking-wider">License Plate Number</span>}
                rules={[{ required: true, message: 'Please input plate number!' }]}
                className="mb-3"
              >
                <Input onChange={handlePlateChange} placeholder="e.g. 30A-123.45" className="h-10 bg-slate-50 border-slate-200 text-slate-800 rounded-lg font-mono uppercase font-bold focus:bg-white focus:border-emerald-500" />
              </Form.Item>

              <div className="grid grid-cols-2 gap-4 mb-3">
                <Form.Item
                  name="type"
                  label={<span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Classification</span>}
                  rules={[{ required: true, message: 'Select type!' }]}
                  initialValue="Car"
                  className="mb-0"
                >
                  <Select
                    className="h-10 text-slate-850 rounded-lg font-medium"
                    options={[
                      { value: 'Car', label: 'Standard Car' },
                      { value: 'Motorbike', label: 'Motorbike' },
                      { value: 'Bicycle', label: 'Bicycle' }
                    ]}
                  />
                </Form.Item>

                <Form.Item
                  name="floor"
                  label={<span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Target Level</span>}
                  rules={[{ required: true, message: 'Select level!' }]}
                  initialValue="L1"
                  className="mb-0"
                >
                  <Select
                    className="h-10 text-slate-850 rounded-lg font-medium"
                    options={[
                      { value: 'B1', label: 'Basement 1' },
                      { value: 'L1', label: 'Level 1' },
                      { value: 'L2', label: 'Level 2' }
                    ]}
                  />
                </Form.Item>
              </div>

              <Form.Item className="mb-0 pt-2">
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 border-none font-bold rounded-lg transition-all shadow-md shadow-emerald-600/10 flex items-center justify-center gap-1.5"
                >
                  <Sparkles size={15}/> Print Ticket & Open Gate
                </Button>
              </Form.Item>
            </Form>
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
            <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-slate-500 gap-1.5 p-2 group hover:border-slate-700 transition-colors mb-4">
              {exitImagePreviewUrl ? (
                <img src={exitImagePreviewUrl} alt="Exit uploaded vehicle" className="w-full h-full object-cover rounded-lg" />
              ) : (
                <>
                  <MonitorPlay size={22} className="text-slate-700 group-hover:text-rose-400 transition-colors" />
                  <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase text-center">Exit Image Preview</span>
                  <span className="text-[8px] text-slate-600 font-bold tracking-widest uppercase">Upload vehicle image</span>
                </>
              )}
              {exitImagePreviewUrl && (
                <div className="absolute inset-0 pointer-events-none border border-rose-500/30">
                  <div className="absolute top-2 left-2 w-2 h-2 border-t-2 border-l-2 border-rose-500"></div>
                  <div className="absolute top-2 right-2 w-2 h-2 border-t-2 border-r-2 border-rose-500"></div>
                  <div className="absolute bottom-2 left-2 w-2 h-2 border-b-2 border-l-2 border-rose-500"></div>
                  <div className="absolute bottom-2 right-2 w-2 h-2 border-b-2 border-r-2 border-rose-500"></div>
                </div>
              )}
              <div className="absolute bottom-1.5 left-1.5 right-1.5 bg-slate-900/90 px-2 py-1 rounded flex items-center justify-between text-[10px] font-mono shadow-md">
                <span className="text-white/60 font-bold uppercase text-[8px]">EXIT</span>
                <span className={`font-semibold truncate max-w-[180px] ${exitImagePreviewUrl ? 'text-rose-400' : 'text-slate-500'}`}>
                  {exitImagePreviewUrl ? 'LOCAL UPLOAD' : 'NO IMAGE'}
                </span>
              </div>
            </div>

            {/* Exit Gate local image upload */}
            <div className="flex gap-3 mb-4">
              <Upload
                accept="image/*"
                beforeUpload={(file) => {
                  const isImage = file.type.startsWith('image/');
                  if (!isImage) {
                    message.error('You can only upload image files!');
                    return Upload.LIST_IGNORE;
                  }
                  const isLt5M = file.size / 1024 / 1024 < 5;
                  if (!isLt5M) {
                    message.error('Image must be smaller than 5MB!');
                    return Upload.LIST_IGNORE;
                  }
                  if (exitImagePreviewUrl) {
                    URL.revokeObjectURL(exitImagePreviewUrl);
                  }
                  const url = URL.createObjectURL(file);
                  setExitImagePreviewUrl(url);
                  return false;
                }}
                showUploadList={false}
                className="w-full flex-1"
              >
                <Button className="w-full h-10 border-slate-200 hover:border-rose-500 hover:text-rose-600 rounded-lg flex items-center justify-center gap-1.5 font-bold shadow-sm">
                  Upload Exit Image
                </Button>
              </Upload>
              {exitImagePreviewUrl && (
                <Button
                  onClick={() => {
                    if (exitImagePreviewUrl) {
                      URL.revokeObjectURL(exitImagePreviewUrl);
                      setExitImagePreviewUrl(null);
                    }
                  }}
                  className="h-10 text-slate-505 border-slate-200 hover:text-rose-500 hover:border-rose-500 rounded-lg font-bold"
                >
                  Clear Image
                </Button>
              )}
            </div>

            {/* Check-Out Form */}
            <Form
              form={checkOutForm}
              layout="vertical"
              onFinish={handleCheckOutSubmit}
              requiredMark={false}
              className="space-y-4"
            >
              <Form.Item
                name="plate"
                label={<span className="text-slate-500 text-xs font-bold uppercase tracking-wider">License Plate Number</span>}
                rules={[{ required: true, message: 'Please input plate number!' }]}
                className="mb-3"
              >
                <Input onChange={handleCheckOutPlateChange} placeholder="e.g. L1-03 or 29A-888.88" className="h-10 bg-slate-50 border-slate-200 text-slate-800 rounded-lg uppercase font-bold focus:bg-white focus:border-rose-500" />
              </Form.Item>

              <div className="flex gap-3 pt-2">
                <Button 
                  onClick={() => handleCheckOut('CASH')}
                  className="flex-1 h-10 font-bold bg-[#2563EB] hover:bg-blue-700 text-white border-none rounded-lg flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <CreditCard size={15}/> Check-out (CASH)
                </Button>
                <Button 
                  type="primary"
                  htmlType="submit" 
                  className="flex-1 h-10 font-bold bg-slate-800 hover:bg-slate-900 text-white border-none rounded-lg flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <CreditCard size={15}/> Confirm Exit & Open Gate
                </Button>
              </div>
            </Form>
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
        width={760}
        centered
        destroyOnClose
        className="font-sans"
      >
        {checkoutResult && (() => {
          const isSuccess = checkoutResult.isSuccess || checkoutResult.IsSuccess;
          const messageText = checkoutResult.message || checkoutResult.Message;
          const sessionId = checkoutResult.sessionId || checkoutResult.SessionId;
          const ticketCode = checkoutResult.ticketCode || checkoutResult.TicketCode;
          const slotName = checkoutResult.slotName || checkoutResult.SlotName;
          const checkInLicensePlate = checkoutResult.checkInLicensePlate || checkoutResult.CheckInLicensePlate;
          const checkOutLicensePlate = checkoutResult.checkOutLicensePlate || checkoutResult.CheckOutLicensePlate;
          const isLicensePlateMatched = checkoutResult.isLicensePlateMatched !== undefined ? checkoutResult.isLicensePlateMatched : checkoutResult.IsLicensePlateMatched;
          const checkInImageUrl = checkoutResult.checkInImageUrl || checkoutResult.CheckInImageUrl;
          const checkInTime = checkoutResult.checkInTime || checkoutResult.CheckInTime;
          const checkOutTime = checkoutResult.checkOutTime || checkoutResult.CheckOutTime;
          const durationHours = checkoutResult.durationHours || checkoutResult.DurationHours;
          const totalAmount = checkoutResult.totalAmount || checkoutResult.TotalAmount;
          const invoiceId = checkoutResult.invoiceId || checkoutResult.InvoiceId;
          const isPaid = checkoutResult.isPaid !== undefined ? checkoutResult.isPaid : checkoutResult.IsPaid;
          const paymentUrl = checkoutResult.paymentUrl || checkoutResult.PaymentUrl;

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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column: License Plates & Images Verification */}
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
                </div>

                {/* Right Column: Billing & Payment */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-3">Session Billing & Payment</h3>
                    
                    <Descriptions column={1} size="small" bordered className="bg-white rounded-lg overflow-hidden border border-slate-200/60 font-sans">
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
                        <span className="text-[11px] text-slate-600 font-medium">
                          {checkInTime ? new Date(checkInTime).toLocaleString() : "N/A"}
                        </span>
                      </Descriptions.Item>
                      <Descriptions.Item label={<span className="text-[11px] font-bold text-slate-500">Check-out Time</span>}>
                        <span className="text-[11px] text-slate-600 font-medium">
                          {checkOutTime ? new Date(checkOutTime).toLocaleString() : "N/A"}
                        </span>
                      </Descriptions.Item>
                      <Descriptions.Item label={<span className="text-[11px] font-bold text-slate-500">Total Fee</span>}>
                        <span className="text-sm font-extrabold text-rose-600">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAmount || 0)}
                        </span>
                      </Descriptions.Item>
                      <Descriptions.Item label={<span className="text-[11px] font-bold text-slate-500">Payment Status</span>}>
                        {isPaid ? (
                          <Tag color="success" className="font-bold m-0">PAID</Tag>
                        ) : (
                          <Tag color="warning" className="font-bold m-0">PENDING</Tag>
                        )}
                      </Descriptions.Item>
                    </Descriptions>
                  </div>

                  {/* VNPay Link Button */}
                  {isSuccess && !isPaid && paymentUrl && (
                    <div className="pt-4 border-t border-slate-200 mt-2">
                      <Button
                        type="primary"
                        className="w-full h-11 bg-[#2563EB] hover:bg-blue-700 border-none font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-md text-white"
                        onClick={() => window.open(paymentUrl, '_blank')}
                      >
                        <CreditCard size={16} /> Pay via VNPay (New Tab)
                      </Button>
                      <p className="text-[10px] text-slate-405 text-center mt-2 font-medium">
                        Open payment URL for VNPay to complete transaction. Invoice ID: {invoiceId || "N/A"}
                      </p>
                    </div>
                  )}
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
