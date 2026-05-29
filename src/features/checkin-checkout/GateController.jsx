import React, { useState, useEffect } from 'react';
import { Card, Tabs, Form, Input, Select, Button, Alert, message, Table, Tag } from 'antd';
import { parkingService, FLOORS } from '../../services/mockData';
import { useAuth } from '../../context/AuthContext';
import { ScanLine, ArrowUpRight, LogOut, CheckCircle, CreditCard, Sparkles, MonitorPlay, Zap } from 'lucide-react';
import TicketModal from './TicketModal';

// Import extracted image assets
import pthParkingImg from '../../imports/phan-mem-giu-xe-pth-parking-300x300-1.jpg';
import remoteMgmtImg from '../../imports/quan-ly-doanh-thu-tren-phan-mem-may-giu-xe-tu-xa-300x300.jpg';
import coreTechImg from '../../imports/cac-cong-nghe-cot-loi-duoc-ung-dung-trong-phan-mem-giu-xe-pth-300x300.jpg';

const GateController = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('checkin');
  const [slots, setSlots] = useState([]);
  const [logs, setLogs] = useState([]);
  const [checkInForm] = Form.useForm();
  const [checkOutForm] = Form.useForm();

  // Simulated Camera feed & AI recommendation states
  const [cameraFeed, setCameraFeed] = useState(pthParkingImg);
  const [aiRecommendation, setAiRecommendation] = useState(null);
  
  // States to manage print receipts
  const [ticketDetails, setTicketDetails] = useState(null);
  const [receiptDetails, setReceiptDetails] = useState(null);
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const loadData = () => {
    setSlots(parkingService.getSlots());
    setLogs(parkingService.getLogs());
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

  // Auto-generate random vehicle data for simulator
  const generateMockVehicle = () => {
    const letters = ['A', 'B', 'C', 'F', 'H', 'K', 'L', 'T'];
    const randomLetter = letters[Math.floor(Math.random() * letters.length)];
    const randomSeries = Math.floor(Math.random() * 2) === 0 ? '29' : '30';
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
    
    // Cycle camera feeds
    const feeds = [pthParkingImg, remoteMgmtImg, coreTechImg];
    const newFeed = feeds[Math.floor(Math.random() * feeds.length)];
    setCameraFeed(newFeed);

    // Dynamic AI Smart Slot recommendation
    // Find first available slot in target floor
    const availableSlot = parkingService.getSlots()
      .find(s => s.status === 'Available' && s.floor === floor && (type === 'VIP' ? s.type === 'VIP' : s.type === type || s.type === 'Car'));
    
    const targetSlotId = availableSlot ? availableSlot.id : `${floor}-02`;

    setAiRecommendation({
      slotId: targetSlotId,
      confidence: Math.floor(92 + Math.random() * 7),
      reason: type === 'Electric' 
        ? `Slot contains rapid charging terminal. Coordinated path matches entry gate.` 
        : `Closest empty space to Level ${floor === 'B1' ? 'Basement' : floor.substring(1)} lifts.`
    });

    message.info('Gate entry camera scanned license plate.');
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
      
      // Store ticket info and open print modal
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
    const term = values.searchQuery;
    try {
      const result = parkingService.checkOut(term);
      setReceiptDetails(result);
      setIsReceiptOpen(true);
      message.success(`License ${result.plate} checked out successfully!`);
      checkOutForm.resetFields();
    } catch (err) {
      message.error(err.message);
    }
  };

  // Immediate check-out shortcut from table list
  const handleDirectCheckOut = (plate) => {
    try {
      const result = parkingService.checkOut(plate);
      setReceiptDetails(result);
      setIsReceiptOpen(true);
      message.success(`Vehicle ${plate} checked out successfully!`);
    } catch (err) {
      message.error(err.message);
    }
  };

  // List of active parked vehicles (filter slots with occupied state)
  const occupiedSlots = slots.filter(s => s.status === 'Occupied' && s.occupiedBy);

  // Columns for parked vehicle list
  const parkedColumns = [
    {
      title: 'Slot ID',
      dataIndex: 'id',
      key: 'id',
      render: (text) => (
        <Tag color="indigo" className="font-bold border-indigo-200">
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
        <span className="text-xs font-semibold text-slate-600 capitalize">{type}</span>
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Shift Counter Terminal</h1>
        <p className="text-slate-500 text-sm mt-1">Process vehicle arrivals, exits, and print billing tickets</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Entry Scanner & Simulator column */}
        <div className="xl:col-span-5 space-y-6">
          <Card 
            title={<span className="text-sm font-bold text-slate-800 flex items-center gap-1.5"><MonitorPlay size={16} className="text-indigo-600"/> Entry Gate Camera Feed</span>}
            className="shadow-sm border border-slate-200"
            bodyStyle={{ padding: '16px' }}
          >
            <div className="relative aspect-[4/3] rounded-lg overflow-hidden border border-slate-200 bg-slate-950 flex items-center justify-center">
              <img 
                src={cameraFeed} 
                alt="Gate Camera Input" 
                className="w-full h-full object-cover opacity-85" 
              />
              
              {/* Scan Overlay graphics */}
              <div className="absolute inset-0 pointer-events-none border-2 border-indigo-500/20">
                <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-indigo-500"></div>
                <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-indigo-500"></div>
                <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-indigo-500"></div>
                <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-indigo-500"></div>
              </div>

              {/* Scanning laser line */}
              <div className="absolute left-0 right-0 h-0.5 bg-indigo-500 shadow-md shadow-indigo-500/50 opacity-60 animate-bounce" style={{ top: '40%' }}></div>
              
              <div className="absolute bottom-3 left-3 bg-slate-900/85 backdrop-blur border border-slate-700/50 rounded px-2.5 py-1 text-[10px] text-emerald-400 font-mono flex items-center gap-1.5 shadow-md">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full pulse-indicator"></span>
                LIVE FEED • GATE 01
              </div>
            </div>
            
            <Button
              type="dashed"
              onClick={generateMockVehicle}
              className="w-full mt-4 border-indigo-500/40 text-indigo-600 hover:text-indigo-700 bg-indigo-50/50 hover:bg-indigo-50 font-bold rounded-lg flex items-center justify-center gap-1.5 h-10 shadow-sm"
            >
              <Sparkles size={16} />
              Simulate Gate Entry Camera (Scan Plate)
            </Button>
          </Card>

          {/* AI Recommended Box */}
          {aiRecommendation && (
            <div className="bg-indigo-50 border border-indigo-200/80 rounded-xl p-4 shadow-sm animate-fade-in flex items-start gap-3">
              <div className="p-2 bg-indigo-600 text-white rounded-lg">
                <Zap size={18} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-indigo-950 uppercase tracking-wide">AI Recommended Parking Slot</span>
                  <Tag color="purple" className="border-purple-200 font-bold text-[10px]">{aiRecommendation.confidence}% Match</Tag>
                </div>
                <h4 className="text-sm font-extrabold text-indigo-700">Assign Slot: {aiRecommendation.slotId}</h4>
                <p className="text-xs text-indigo-900 leading-snug">{aiRecommendation.reason}</p>
              </div>
            </div>
          )}

          {/* Control Form Card */}
          <Card className="shadow-sm border border-slate-200">
            <Tabs 
              activeKey={activeTab} 
              onChange={setActiveTab}
              items={[
                {
                  key: 'checkin',
                  label: <span className="font-extrabold flex items-center gap-1.5"><ScanLine size={16}/> Vehicle Check-In</span>,
                  children: (
                    <div className="space-y-4 pt-2">
                      <Form
                        form={checkInForm}
                        layout="vertical"
                        onFinish={handleCheckInSubmit}
                        requiredMark={false}
                      >
                        <Form.Item
                          name="plate"
                          label={<span className="text-slate-500 text-xs font-bold uppercase tracking-wider">License Plate Number</span>}
                          rules={[{ required: true, message: 'Please input license plate!' }]}
                        >
                          <Input placeholder="e.g. 30A-123.45" className="h-10 bg-slate-50 border-slate-200 text-slate-800 rounded-lg font-mono uppercase font-bold focus:bg-white" />
                        </Form.Item>

                        <div className="grid grid-cols-2 gap-4">
                          <Form.Item
                            name="type"
                            label={<span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Classification</span>}
                            rules={[{ required: true, message: 'Please select vehicle type!' }]}
                            initialValue="Car"
                          >
                            <Select
                              className="h-10 text-slate-800 rounded-lg"
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
                            rules={[{ required: true, message: 'Please select parking level!' }]}
                            initialValue="L1"
                          >
                            <Select
                              className="h-10 text-slate-800 rounded-lg"
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
                            className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 border-none font-bold rounded-lg transition-all shadow-md shadow-indigo-600/10 flex items-center justify-center gap-1.5"
                          >
                            <Sparkles size={15}/> Register Entry & Print Ticket
                          </Button>
                        </Form.Item>
                      </Form>
                    </div>
                  )
                },
                {
                  key: 'checkout',
                  label: <span className="font-extrabold flex items-center gap-1.5"><LogOut size={16}/> Vehicle Check-Out</span>,
                  children: (
                    <div className="space-y-4 pt-2">
                      <Form
                        form={checkOutForm}
                        layout="vertical"
                        onFinish={handleCheckOutSubmit}
                        requiredMark={false}
                      >
                        <Form.Item
                          name="searchQuery"
                          label={<span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Search Slot ID or Plate Number</span>}
                          rules={[{ required: true, message: 'Please input plate or slot ID!' }]}
                        >
                          <Input placeholder="e.g. L1-03 or 29A-888.88" className="h-10 bg-slate-50 border-slate-200 text-slate-800 rounded-lg uppercase font-bold focus:bg-white" />
                        </Form.Item>

                        <Form.Item className="mb-0 pt-3">
                          <Button 
                            type="primary" 
                            danger
                            htmlType="submit" 
                            className="w-full h-11 bg-rose-600 hover:bg-rose-500 border-none font-bold rounded-lg transition-all shadow-md shadow-rose-600/10 flex items-center justify-center gap-1.5"
                          >
                            <CreditCard size={15}/> Process Exit & Compute Fee
                          </Button>
                        </Form.Item>
                      </Form>

                      <Alert
                        message={<span className="font-bold text-slate-700 text-xs">Checkout Billing Guidelines</span>}
                        description={
                          <div className="text-[11px] text-slate-500 leading-normal mt-0.5">
                            Fares are computed ceiling of hours elapsed since check-in times. Monthly pass card holders bypass fee calculations if the subscription is valid.
                          </div>
                        }
                        type="info"
                        showIcon
                        className="rounded-lg bg-slate-50 border-slate-200"
                      />
                    </div>
                  )
                }
              ]}
            />
          </Card>
        </div>

        {/* Real-time occupied slot list directory */}
        <div className="xl:col-span-7">
          <Card 
            title={<span className="text-sm font-bold text-slate-850 flex items-center gap-2">Active Parked Vehicles — <span className="text-indigo-650 font-bold">{occupiedSlots.length} In-Building</span></span>} 
            className="shadow-sm border border-slate-200"
          >
            {occupiedSlots.length === 0 ? (
              <div className="text-center py-20 text-slate-400 flex flex-col items-center">
                <CheckCircle size={44} className="text-emerald-500/20 mb-3" />
                <h3 className="text-slate-700 font-bold">All Parking Slots Available</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">No active vehicles are parked. Use the simulator camera scanner to record arrivals.</p>
              </div>
            ) : (
              <Table 
                columns={parkedColumns} 
                dataSource={occupiedSlots} 
                rowKey="id" 
                pagination={{ pageSize: 6, showTotal: (total) => `Total ${total} parked vehicles` }}
                className="custom-antd-table text-slate-800"
              />
            )}
          </Card>
        </div>
      </div>

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
