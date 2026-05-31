// Pre-configured mock data and state simulation for SpotFlow Parking Building Management System

export const PRESET_USERS = {
  admin: {
    username: 'alex_johnson',
    name: 'Alex Johnson',
    role: 'admin',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Alex',
    email: 'admin@spotflow.com',
    details: 'System Administrator'
  },
  staff: {
    username: 'sarah_connor',
    name: 'Sarah Connor',
    role: 'staff',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Sarah',
    email: 'sarah.c@spotflow.com',
    details: 'Zone A Supervisor',
    shift: 'Day Shift (06:00 AM - 02:00 PM)'
  },
  driver: {
    username: 'david_miller',
    name: 'David Miller',
    role: 'driver',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=David',
    email: 'david.miller@gmail.com',
    details: 'Registered Driver',
    vehiclePlate: '29A-888.88',
    vehicleType: 'Car',
    balance: 245000, // VND
    passExpiry: '2026-08-15',
    activeTicket: 'T-1004' // Currently parked in slot L1-03
  },
  manager: {
    username: 'robert_vance',
    name: 'Robert Vance',
    role: 'manager',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Robert',
    email: 'robert.v@spotflow.com',
    details: 'Parking Building Manager'
  }
};

// Parking Building Configurations
export const FLOORS = [
  { id: 'B1', name: 'Basement 1', description: 'Motorbikes & EV Charging' },
  { id: 'L1', name: 'Level 1 (Ground)', description: 'VIP, Standard Cars & Accessible' },
  { id: 'L2', name: 'Level 2', description: 'Standard Cars & Compacts' }
];

// In-memory active states
let parkingSlots = [];
let checkInLogs = [];

// Initialize Slots
const initParkingSlots = () => {
  const slots = [];
  
  // Basement 1 Slots (B1-01 to B1-15)
  for (let i = 1; i <= 15; i++) {
    const isEven = i % 2 === 0;
    const isElectric = i > 10;
    slots.push({
      id: `B1-${String(i).padStart(2, '0')}`,
      floor: 'B1',
      type: isElectric ? 'Electric' : 'Motorbike',
      status: i === 3 ? 'Occupied' : i === 7 ? 'Maintenance' : isEven ? 'Reserved' : 'Available',
      occupiedBy: i === 3 ? {
        plate: '29T1-567.89',
        checkInTime: new Date(Date.now() - 3.5 * 60 * 60 * 1000).toISOString(), // 3.5 hours ago
        type: 'Motorbike'
      } : null
    });
  }

  // Level 1 Slots (L1-01 to L1-12)
  for (let i = 1; i <= 12; i++) {
    let status = 'Available';
    let occupiedBy = null;
    let type = 'Car';

    if (i <= 3) {
      type = 'VIP';
    } else if (i === 11 || i === 12) {
      type = 'Accessible';
    }

    if (i === 1) {
      status = 'Reserved';
    } else if (i === 3) {
      status = 'Occupied';
      occupiedBy = {
        plate: '29A-888.88', // Driver user's active car
        checkInTime: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(), // 2.5 hours ago
        type: 'Car'
      };
    } else if (i === 6) {
      status = 'Occupied';
      occupiedBy = {
        plate: '30E-123.45',
        checkInTime: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        type: 'Electric'
      };
      type = 'Electric';
    } else if (i === 9) {
      status = 'Maintenance';
    }

    slots.push({
      id: `L1-${String(i).padStart(2, '0')}`,
      floor: 'L1',
      type,
      status,
      occupiedBy
    });
  }

  // Level 2 Slots (L2-01 to L2-15)
  for (let i = 1; i <= 15; i++) {
    const isThreeMulti = i % 3 === 0;
    slots.push({
      id: `L2-${String(i).padStart(2, '0')}`,
      floor: 'L2',
      type: 'Car',
      status: isThreeMulti ? 'Occupied' : 'Available',
      occupiedBy: isThreeMulti ? {
        plate: `30K-${1000 + i}`,
        checkInTime: new Date(Date.now() - (i * 45 * 60000)).toISOString(),
        type: 'Car'
      } : null
    });
  }

  return slots;
};

// Initialize Mock Logs
const initLogs = () => {
  return [
    {
      id: 'T-1001',
      plate: '30L-998.12',
      type: 'Car',
      slotId: 'L2-03',
      checkInTime: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      checkOutTime: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      fee: 60000,
      attendant: 'Sarah Connor',
      status: 'Completed'
    },
    {
      id: 'T-1002',
      plate: '29C-456.78',
      type: 'Car',
      slotId: 'L1-02',
      checkInTime: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      checkOutTime: new Date(Date.now() - 3.5 * 60 * 60 * 1000).toISOString(),
      fee: 45000,
      attendant: 'Sarah Connor',
      status: 'Completed'
    },
    {
      id: 'T-1003',
      plate: '29T1-567.89',
      type: 'Motorbike',
      slotId: 'B1-03',
      checkInTime: new Date(Date.now() - 3.5 * 60 * 60 * 1000).toISOString(),
      checkOutTime: null,
      fee: 0,
      attendant: 'Sarah Connor',
      status: 'Parked'
    },
    {
      id: 'T-1004',
      plate: '29A-888.88',
      type: 'Car',
      slotId: 'L1-03',
      checkInTime: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(),
      checkOutTime: null,
      fee: 0,
      attendant: 'Sarah Connor',
      status: 'Parked'
    },
    {
      id: 'T-1005',
      plate: '30E-123.45',
      type: 'Car',
      slotId: 'L1-06',
      checkInTime: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      checkOutTime: null,
      fee: 0,
      attendant: 'System Auto',
      status: 'Parked'
    }
  ];
};

// Check Local Storage or initialize
const storageSlotsKey = 'spotflow_parking_slots';
const storageLogsKey = 'spotflow_parking_logs';

if (localStorage.getItem(storageSlotsKey)) {
  parkingSlots = JSON.parse(localStorage.getItem(storageSlotsKey));
} else {
  parkingSlots = initParkingSlots();
  localStorage.setItem(storageSlotsKey, JSON.stringify(parkingSlots));
}

if (localStorage.getItem(storageLogsKey)) {
  checkInLogs = JSON.parse(localStorage.getItem(storageLogsKey));
} else {
  checkInLogs = initLogs();
  localStorage.setItem(storageLogsKey, JSON.stringify(checkInLogs));
}

// Persist data
const saveState = () => {
  localStorage.setItem(storageSlotsKey, JSON.stringify(parkingSlots));
  localStorage.setItem(storageLogsKey, JSON.stringify(checkInLogs));
  // Dispatch custom event to notify components listening for state changes
  window.dispatchEvent(new Event('parking_state_changed'));
};

// Rates settings (VND per hour)
export const PARKING_RATES = {
  Motorbike: 5000,
  Car: 15000,
  VIP: 30000,
  Electric: 20000 // includes charging surcharge
};

// State operations
export const parkingService = {
  getSlots: () => parkingSlots,
  
  getLogs: () => checkInLogs,
  
  getSlotsByFloor: (floorId) => parkingSlots.filter(s => s.floor === floorId),

  getOccupancyRate: () => {
    const total = parkingSlots.filter(s => s.status !== 'Maintenance').length;
    const occupied = parkingSlots.filter(s => s.status === 'Occupied').length;
    return total > 0 ? Math.round((occupied / total) * 100) : 0;
  },

  // Perform a vehicle check-in
  checkIn: (plate, type, preferredFloor = 'L1', attendant = 'System Auto') => {
    // 1. Find an available slot matching type and floor preference
    // VIP types must go to VIP slots, motorbikes to motorbike, etc.
    let eligibleSlots = parkingSlots.filter(s => s.status === 'Available' && s.floor === preferredFloor);
    
    if (eligibleSlots.length === 0) {
      // Fallback: search anywhere
      eligibleSlots = parkingSlots.filter(s => s.status === 'Available');
    }
    
    if (eligibleSlots.length === 0) {
      throw new Error('No available parking slots in the building!');
    }

    // Select the first eligible slot
    const slot = eligibleSlots[0];
    
    // Update slot status
    slot.status = 'Occupied';
    slot.occupiedBy = {
      plate,
      checkInTime: new Date().toISOString(),
      type
    };

    // Generate ticket/log
    const ticketId = `T-${1000 + checkInLogs.length + 1}`;
    const newLog = {
      id: ticketId,
      plate,
      type,
      slotId: slot.id,
      checkInTime: slot.occupiedBy.checkInTime,
      checkOutTime: null,
      fee: 0,
      attendant,
      status: 'Parked'
    };

    checkInLogs.unshift(newLog); // Prepend to show newest first
    saveState();

    return {
      ticket: newLog,
      slotId: slot.id
    };
  },

  // Calculate parking fee
  calculateFee: (checkInTimeStr, vehicleType) => {
    const checkInTime = new Date(checkInTimeStr);
    const now = new Date();
    const diffMs = now - checkInTime;
    const diffHours = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60))); // Min 1 hour, ceil
    const hourlyRate = PARKING_RATES[vehicleType] || PARKING_RATES.Car;
    return diffHours * hourlyRate;
  },

  // Perform a vehicle check-out
  checkOut: (plateOrSlotId) => {
    // Find slot
    const slot = parkingSlots.find(s => 
      s.id === plateOrSlotId || (s.occupiedBy && s.occupiedBy.plate === plateOrSlotId)
    );

    if (!slot || slot.status !== 'Occupied' || !slot.occupiedBy) {
      throw new Error(`No active parking record found for "${plateOrSlotId}"!`);
    }

    const { plate, checkInTime, type } = slot.occupiedBy;
    const fee = parkingService.calculateFee(checkInTime, type);

    // Find active log
    const logIndex = checkInLogs.findIndex(l => l.plate === plate && l.status === 'Parked');
    
    if (logIndex !== -1) {
      checkInLogs[logIndex].checkOutTime = new Date().toISOString();
      checkInLogs[logIndex].fee = fee;
      checkInLogs[logIndex].status = 'Completed';
    }

    // Reset slot
    slot.status = 'Available';
    slot.occupiedBy = null;

    saveState();

    return {
      plate,
      checkInTime,
      checkOutTime: new Date().toISOString(),
      fee,
      slotId: slot.id
    };
  },

  // Release/Reserve slot manually (Admin operation)
  updateSlotStatus: (slotId, newStatus) => {
    const slot = parkingSlots.find(s => s.id === slotId);
    if (!slot) throw new Error('Slot not found');
    
    if (newStatus === 'Available' && slot.status === 'Occupied') {
      // Must use checkOut to release an occupied slot correctly
      return parkingService.checkOut(slotId);
    }
    
    slot.status = newStatus;
    if (newStatus !== 'Occupied') {
      slot.occupiedBy = null;
    }
    
    saveState();
    return slot;
  },

  // Reset to initial mock data (Convenient for demos)
  resetDemoData: () => {
    parkingSlots = initParkingSlots();
    checkInLogs = initLogs();
    saveState();
  }
};
