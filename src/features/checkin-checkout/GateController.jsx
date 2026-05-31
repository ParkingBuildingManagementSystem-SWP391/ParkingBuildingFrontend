import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Select, Button, Alert, message, Table, Tag } from 'antd';
import { parkingService } from '../../services/mockData';
import { useAuth } from '../../context/AuthContext';
import { 
  ScanLine, 
  ArrowUpRight, 
  LogOut, 
  CheckCircle, 
  CreditCard, 
  Sparkles, 
  MonitorPlay, 
  Zap, 
  TrendingUp 
} from 'lucide-react';
import TicketModal from './TicketModal';

const GateController = () => {
  const { user } = useAuth();
  const [slots, setSlots] = useState([]);
  const [logs, setLogs] = useState([]);
  const [checkInForm] = Form.useForm();
  const [checkOutForm] = Form.useForm();

  // Simulated & Live Backend Entry & Exit Camera feeds
  const [entryImages, setEntryImages] = useState({
    frontView: null,
    lane1: null
  });

  const [exitImages, setExitImages] = useState({
    frontView: null,
    lane1: null
  });

  const [aiRecommendation, setAiRecommendation] = useState(null);
  const [calculatedFeeDetails, setCalculatedFeeDetails] = useState(null);

  // States to manage print receipts/tickets
  const [ticketDetails, setTicketDetails] = useState(null);
  const [receiptDetails, setReceiptDetails] = useState(null);
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const loadData = () => {
    setSlots(parkingService.getSlots());
    setLogs(parkingService.getLogs());
  };

  // Fetch live camera feed URLs from backend API
  const fetchCameraFeeds = async () => {
    try {
      const response = await fetch('/api/operations/latest-feeds');
      if (!response.ok) throw new Error('API server returned error');
      const json = await response.json();
      if (json.success && json.data) {
        if (json.data.entryUrls) {
          setEntryImages(prev => ({
            ...prev,
            frontView: json.data.entryUrls.frontView || prev.frontView,
            lane1: json.data.entryUrls.lane1 || prev.lane1
          }));
        }
        if (json.data.exitUrls) {
          setExitImages(prev => ({
            ...prev,
            frontView: json.data.exitUrls.frontView || prev.frontView,
            lane1: json.data.exitUrls.lane1 || prev.lane1
          }));
        }
      }
    } catch (err) {
      // Graceful fallback for local development or disconnected state
      console.warn('API Fallback: Backend /api/operations/latest-feeds unreachable. Operating on UI state.', err);
    }
  };

  useEffect(() => {
    loadData();
    const handleStateChange = () => {
      loadData();
    };
    window.addEventListener('parking_state_changed', handleStateChange);

    // Initial fetch of camera feeds
    fetchCameraFeeds();

    // Periodic updates polling every 3 seconds (3000ms)
    const pollingInterval = setInterval(() => {
      fetchCameraFeeds();
    }, 3000);

    return () => {
      window.removeEventListener('parking_state_changed', handleStateChange);
      // Proper clean up to avoid memory leaks
      clearInterval(pollingInterval);
    };
  }, []);

  // Auto-fill Entry Camera feeds on typing
  const handlePlateChange = (e) => {
    const val = e.target.value;
    if (val && val.trim().length >= 3) {
      setEntryImages({
        frontView: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&q=80&w=600',
        lane1: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&q=80&w=600'
      });
    }
  };

  // Auto-fill Exit Camera feeds on typing
  const handleCheckOutPlateChange = (e) => {
    const val = e.target.value;
    if (val && val.trim().length >= 3) {
      setExitImages({
        frontView: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&q=80&w=600',
        lane1: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&q=80&w=600'
      });
    }
  };

  // Reset entry feeds
  const resetEntryFeeds = () => {
    setEntryImages({
      frontView: null,
      lane1: null
    });
    setAiRecommendation(null);
    message.info('Entry gate camera feeds reset to standby.');
  };

  // Reset exit feeds
  const resetExitFeeds = () => {
    setExitImages({
      frontView: null,
      lane1: null
    });
    setCalculatedFeeDetails(null);
    message.info('Exit gate camera feeds reset to standby.');
  };

  // Simulate Entry gate scan
  const generateMockVehicle = () => {
    const letters = ['A', 'B', 'C', 'F', 'H', 'K', 'L', 'T'];
    const randomLetter = letters[Math.floor(Math.random() * letters.length)];
    const randomSeries = Math.random() > 0.5 ? '29' : '30';
    const randomNum1 = Math.floor(100 + Math.random() * 900);
    const randomNum2 = Math.floor(10 + Math.random() * 90);
    const plate = `${randomSeries}${randomLetter}-${randomNum1}.${randomNum2}`;
    
    const types = ['Car', 'Motorbike', 'Electric', 'VIP'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    let floor = 'L1';
    if (type === 'Motorbike') floor = 'B1';
    else if (type === 'VIP') floor = 'L1';
    else floor = Math.random() > 0.5 ? 'L2' : 'L1';

    checkInForm.setFieldsValue({ plate, type, floor });
    
    setEntryImages({
      frontView: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&q=80&w=600',
      lane1: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&q=80&w=600'
    });

    const availableSlot = parkingService.getSlots()
      .find(s => s.status === 'Available' && s.floor === floor && (type === 'VIP' ? s.type === 'VIP' : s.type === type || s.type === 'Car'));
    
    const targetSlotId = availableSlot ? availableSlot.id : `${floor}-02`;

    setAiRecommendation({
      slotId: targetSlotId,
      confidence: Math.floor(92 + Math.random() * 7),
      reason: type === 'Electric' 
        ? 'Slot contains rapid charging terminal. Coordinated path matches entry gate.' 
        : `Closest empty space to Level ${floor === 'B1' ? 'Basement' : floor.substring(1)} lifts.`
    });

    message.info('Gate entry camera scanned license plate.');
  };

  // Simulate Exit gate scan
  const generateMockExitVehicle = () => {
    const occupied = slots.filter(s => s.status === 'Occupied' && s.occupiedBy);
    let plate = '';

    if (occupied.length > 0) {
      const randomSlot = occupied[Math.floor(Math.random() * occupied.length)];
      plate = randomSlot.occupiedBy.plate;
    } else {
      const letters = ['A', 'B', 'C', 'K', 'L', 'T'];
      const randomLetter = letters[Math.floor(Math.random() * letters.length)];
      plate = `29${randomLetter}-777.77`;
    }

    checkOutForm.setFieldsValue({ plate });

    setExitImages({
      frontView: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&q=80&w=600',
      lane1: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&q=80&w=600'
    });

    message.info('Gate exit camera scanned license plate.');
  };

  // Calculate Fee Inline for Exit
  const handleCalculateFee = () => {
    const plate = checkOutForm.getFieldValue('plate');
    if (!plate) {
      message.error('Please input plate number to calculate fee!');
      return;
    }
    const slot = slots.find(s => s.occupiedBy && s.occupiedBy.plate === plate) || slots.find(s => s.id === plate);
    if (!slot || slot.status !== 'Occupied' || !slot.occupiedBy) {
      message.error(`No active parking record found for "${plate}"!`);
      return;
    }
    const { checkInTime, type } = slot.occupiedBy;
    const diffMs = Math.max(0, Date.now() - new Date(checkInTime).getTime());
    const diffHours = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60)));
    
    const rates = { Car: 20000, Motorbike: 5000, Electric: 15000, VIP: 0 };
    const fee = diffHours * (rates[type] || 20000);
    
    setCalculatedFeeDetails({
      plate,
      slotId: slot.id,
      fee,
      duration: `${diffHours} hour(s)`,
      checkInTime,
      type
    });
    message.success(`Calculated fee: ${fee.toLocaleString()} VND`);
  };

  // Perform Check-in
  const handleCheckInSubmit = (values) => {
    try {
      const result = parkingService.checkIn(
        values.plate,
        values.type,
        values.floor,
        user.name
      );
      
      setEntryImages({
        frontView: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&q=80&w=600',
        lane1: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&q=80&w=600'
      });

      setTicketDetails(result.ticket);
      setIsTicketOpen(true);
      message.success(`Vehicle ${values.plate} checked in to slot ${result.slotId}!`);
      checkInForm.resetFields();
      setAiRecommendation(null);
    } catch (err) {
      message.error(err.message);
    }
  };

  // Perform Check-out
  const handleCheckOutSubmit = (values) => {
    const plate = values.plate;
    try {
      const result = parkingService.checkOut(plate);

      setExitImages({
        frontView: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&q=80&w=600',
        lane1: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&q=80&w=600'
      });

      setReceiptDetails(result);
      setIsReceiptOpen(true);
      message.success(`Vehicle ${result.plate} checked out successfully!`);
      checkOutForm.resetFields();
      setCalculatedFeeDetails(null);
    } catch (err) {
      message.error(err.message);
    }
  };

  // Immediate check-out shortcut from table list
  const handleDirectCheckOut = (plate) => {
    try {
      setExitImages({
        frontView: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&q=80&w=600',
        lane1: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&q=80&w=600'
      });

      const result = parkingService.checkOut(plate);
      setReceiptDetails(result);
      setIsReceiptOpen(true);
      message.success(`Vehicle ${plate} checked out successfully!`);
    } catch (err) {
      message.error(err.message);
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
          {text}
        </span>
      )
    },
    {
      title: 'Classification',
      dataIndex: ['occupiedBy', 'type'],
      key: 'type',
      render: (type) => (
        <span className="text-xs font-semibold text-slate-650 capitalize">{type}</span>
      )
    },
    {
      title: 'Entry Time',
      dataIndex: ['occupiedBy', 'checkInTime'],
      key: 'checkInTime',
      render: (text) => new Date(text).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="primary"
          danger
          size="small"
          onClick={() => handleDirectCheckOut(record.occupiedBy.plate)}
          className="flex items-center gap-1 h-7 rounded text-[11px] font-bold"
        >
          Check-Out
        </Button>
      )
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
                <Button 
                  size="small" 
                  type="text" 
                  onClick={resetEntryFeeds}
                  className="text-xs text-slate-404 hover:text-rose-500 font-semibold"
                >
                  Reset Feeds
                </Button>
              </div>
            }
            className="shadow-sm border border-slate-200"
            bodyStyle={{ padding: '20px' }}
          >
            {/* Camera slots side-by-side */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              {[
                { key: 'frontView', label: 'Entry Front View' },
                { key: 'lane1', label: 'Entry Lane 1' }
              ].map((slot) => {
                const imageUrl = entryImages[slot.key];
                return (
                  <div key={slot.key} className="relative aspect-[4/3] rounded-lg overflow-hidden bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-slate-500 gap-1.5 p-2 group hover:border-slate-700 transition-colors">
                    {imageUrl ? (
                      <img src={imageUrl} alt={slot.label} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <>
                        <MonitorPlay size={18} className="text-slate-700 group-hover:text-emerald-400 transition-colors animate-pulse" />
                        <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase text-center">{slot.label}</span>
                        <span className="text-[8px] text-slate-600 font-bold tracking-widest uppercase">STANDBY</span>
                      </>
                    )}
                    {imageUrl && (
                      <div className="absolute inset-0 pointer-events-none border border-emerald-500/30">
                        <div className="absolute top-2 left-2 w-2 h-2 border-t-2 border-l-2 border-emerald-500"></div>
                        <div className="absolute top-2 right-2 w-2 h-2 border-t-2 border-r-2 border-emerald-500"></div>
                        <div className="absolute bottom-2 left-2 w-2 h-2 border-b-2 border-l-2 border-emerald-500"></div>
                        <div className="absolute bottom-2 right-2 w-2 h-2 border-b-2 border-r-2 border-emerald-500"></div>
                      </div>
                    )}
                    
                    {/* Bottom positioned banner for URL */}
                    <div className="absolute bottom-1.5 left-1.5 right-1.5 bg-slate-900/90 px-2 py-1 rounded flex items-center justify-between text-[10px] font-mono shadow-md">
                      <span className="text-white/60 font-bold uppercase text-[8px]">{slot.key}</span>
                      {imageUrl ? (
                        <span className="text-emerald-400 font-semibold truncate max-w-[100px] md:max-w-[130px]" title={imageUrl}>
                          {imageUrl}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[8px] font-bold">NO SIGNAL</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <Button
              type="dashed"
              onClick={generateMockVehicle}
              className="w-full mb-4 border-emerald-500/40 text-emerald-600 hover:text-emerald-700 bg-emerald-50/50 hover:bg-emerald-50 font-bold rounded-lg flex items-center justify-center gap-1.5 h-10 shadow-sm transition-all"
            >
              <Sparkles size={16} />
              Simulate Gate Entry Camera (Scan Plate)
            </Button>

            {/* AI recommendation alert block */}
            {aiRecommendation && (
              <div className="mb-4 bg-indigo-50 border border-indigo-200/80 rounded-xl p-3.5 shadow-sm animate-fade-in flex items-start gap-2.5">
                <div className="p-1.5 bg-[#2563EB] text-white rounded-lg shrink-0">
                  <Zap size={14} />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-extrabold text-indigo-950 uppercase tracking-wide">AI Recommendation</span>
                    <Tag color="purple" className="border-purple-200 font-bold text-[9px] px-1 py-0">{aiRecommendation.confidence}% Match</Tag>
                  </div>
                  <h4 className="text-xs font-bold text-indigo-700">Assign Slot: {aiRecommendation.slotId}</h4>
                  <p className="text-[11px] text-indigo-900/90 leading-snug">{aiRecommendation.reason}</p>
                </div>
              </div>
            )}

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
                      { value: 'Electric', label: 'Electric (EV)' },
                      { value: 'VIP', label: 'VIP Member' }
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
            title={
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-rose-500 rounded-full"></span>
                  <span className="text-sm font-bold text-slate-800">Exit Gate - Vehicle Check-Out</span>
                </div>
                <Button 
                  size="small" 
                  type="text" 
                  onClick={resetExitFeeds}
                  className="text-xs text-slate-400 hover:text-rose-500 font-semibold"
                >
                  Reset Feeds
                </Button>
              </div>
            }
            className="shadow-sm border border-slate-200"
            bodyStyle={{ padding: '20px' }}
          >
            {/* Camera slots side-by-side */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              {[
                { key: 'frontView', label: 'Exit Front View' },
                { key: 'lane1', label: 'Exit Lane 1' }
              ].map((slot) => {
                const imageUrl = exitImages[slot.key];
                return (
                  <div key={slot.key} className="relative aspect-[4/3] rounded-lg overflow-hidden bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-slate-500 gap-1.5 p-2 group hover:border-slate-700 transition-colors">
                    {imageUrl ? (
                      <img src={imageUrl} alt={slot.label} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <>
                        <MonitorPlay size={18} className="text-slate-700 group-hover:text-rose-400 transition-colors animate-pulse" />
                        <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase text-center">{slot.label}</span>
                        <span className="text-[8px] text-slate-600 font-bold tracking-widest uppercase">STANDBY</span>
                      </>
                    )}
                    {imageUrl && (
                      <div className="absolute inset-0 pointer-events-none border border-rose-500/30">
                        <div className="absolute top-2 left-2 w-2 h-2 border-t-2 border-l-2 border-rose-500"></div>
                        <div className="absolute top-2 right-2 w-2 h-2 border-t-2 border-r-2 border-rose-500"></div>
                        <div className="absolute bottom-2 left-2 w-2 h-2 border-b-2 border-l-2 border-rose-500"></div>
                        <div className="absolute bottom-2 right-2 w-2 h-2 border-b-2 border-r-2 border-rose-500"></div>
                      </div>
                    )}
                    
                    {/* Bottom positioned banner for URL */}
                    <div className="absolute bottom-1.5 left-1.5 right-1.5 bg-slate-900/90 px-2 py-1 rounded flex items-center justify-between text-[10px] font-mono shadow-md">
                      <span className="text-white/60 font-bold uppercase text-[8px]">{slot.key}</span>
                      {imageUrl ? (
                        <span className="text-rose-400 font-semibold truncate max-w-[100px] md:max-w-[130px]" title={imageUrl}>
                          {imageUrl}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[8px] font-bold">NO SIGNAL</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <Button
              type="dashed"
              onClick={generateMockExitVehicle}
              className="w-full mb-4 border-rose-500/40 text-rose-600 hover:text-rose-700 bg-rose-50/50 hover:bg-rose-50 font-bold rounded-lg flex items-center justify-center gap-1.5 h-10 shadow-sm transition-all"
            >
              <Sparkles size={16} />
              Simulate Gate Exit Camera (Scan Plate)
            </Button>

            {/* Calculated Fee Details Alert Box */}
            {calculatedFeeDetails && (
              <div className="mb-4 bg-emerald-50 border border-emerald-200/85 rounded-xl p-3.5 shadow-sm animate-fade-in flex items-start gap-2.5">
                <div className="p-1.5 bg-[#10B981] text-white rounded-lg shrink-0">
                  <CheckCircle size={14} />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold text-emerald-950 uppercase tracking-wide">Active Parking Bill</span>
                    <span className="text-[8px] bg-emerald-100 text-emerald-700 font-bold px-1 py-0 rounded border border-emerald-200 uppercase">{calculatedFeeDetails.type}</span>
                  </div>
                  <h4 className="text-sm font-extrabold text-emerald-800">
                    Exit Fee: {calculatedFeeDetails.fee.toLocaleString()} VND
                  </h4>
                  <p className="text-[11px] text-slate-550 leading-snug">
                    Slot <span className="font-bold text-slate-700">{calculatedFeeDetails.slotId}</span> • Duration: <span className="font-bold text-slate-700">{calculatedFeeDetails.duration}</span> since check-in ({new Date(calculatedFeeDetails.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}).
                  </p>
                </div>
              </div>
            )}

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
                  onClick={handleCalculateFee}
                  className="flex-1 h-10 font-bold bg-[#2563EB] hover:bg-blue-700 text-white border-none rounded-lg flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <TrendingUp size={15}/> Calculate Fee
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
            <p className="text-xs text-slate-500 mt-1 max-w-xs">No active vehicles are parked. Use the simulator camera scanners to record arrivals.</p>
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
    </div>
  );
};

export default GateController;
