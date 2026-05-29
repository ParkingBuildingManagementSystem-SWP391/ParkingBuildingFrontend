import React, { useState } from 'react';
import { Card, Button, Form, Input, Alert, message, Timeline } from 'antd';
import { CreditCard, ShieldCheck, Zap, PlusCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MonthlyPass = () => {
  const { user } = useAuth();
  const [expiry, setExpiry] = useState(user.passExpiry);

  const handleRenew = () => {
    // Extend expiry by 1 month
    const currentDate = new Date(expiry);
    currentDate.setMonth(currentDate.getMonth() + 1);
    const newExpiry = currentDate.toISOString().split('T')[0];
    setExpiry(newExpiry);
    user.passExpiry = newExpiry; // Mutate local context mock
    localStorage.setItem('spotflow_user', JSON.stringify(user));
    message.success('Monthly Pass renewed for 30 additional days successfully!');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">RFID Pass Card</h1>
        <p className="text-slate-400 text-sm mt-1">Manage subscription card credentials and renewals</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pass Visual Card */}
        <Card title={<span className="text-base font-bold text-white flex items-center gap-2"><CreditCard size={18}/> Digital Pass Card Visual</span>} className="shadow-lg border border-slate-800">
          <div className="relative w-full h-52 bg-gradient-to-br from-indigo-700 via-indigo-600 to-indigo-900 rounded-2xl p-6 flex flex-col justify-between overflow-hidden shadow-xl border border-indigo-500/30 group">
            
            {/* Hologram details */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:bg-indigo-400/10 transition-colors"></div>
            <div className="absolute bottom-4 right-4 text-white/10">
              <CreditCard size={120} />
            </div>

            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs text-indigo-200/80 font-bold uppercase tracking-widest">RFID Pass System</span>
                <h3 className="text-lg font-bold text-white mt-0.5">SpotFlow Premium</h3>
              </div>
              <div className="h-9 w-12 bg-yellow-500/20 border border-yellow-500/40 rounded-lg flex items-center justify-center font-bold text-yellow-400 text-xs">
                CHIP
              </div>
            </div>

            <div className="mt-6 flex flex-col">
              <span className="text-xs text-indigo-200/80 font-bold tracking-widest font-mono uppercase">REGISTERED PLATE</span>
              <span className="text-xl font-mono font-bold text-white mt-1 tracking-widest">{user.vehiclePlate}</span>
            </div>

            <div className="flex justify-between items-end mt-4">
              <div>
                <span className="text-[10px] text-indigo-300 font-semibold block uppercase">Card Holder</span>
                <span className="text-xs font-bold text-white">{user.name}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-indigo-300 font-semibold block uppercase">VALID UNTIL</span>
                <span className="text-xs font-mono font-bold text-white">{expiry}</span>
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <Button
              type="primary"
              onClick={handleRenew}
              icon={<PlusCircle size={15} />}
              className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 border-none font-bold rounded-lg flex items-center justify-center gap-1.5"
            >
              Extend Card Period (+30 Days)
            </Button>
          </div>
        </Card>

        {/* Pass Policies */}
        <Card title={<span className="text-base font-bold text-white flex items-center gap-2"><ShieldCheck size={18}/> Subscription benefits</span>} className="shadow-lg border border-slate-800">
          <Timeline
            className="mt-2 text-slate-300 custom-antd-timeline"
            items={[
              {
                dot: <Zap size={14} className="text-yellow-400" />,
                children: (
                  <div>
                    <h4 className="font-bold text-white text-xs">Seamless Lane Gates Access</h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                      RFID gate sensors read and open lanes automatically at entrances and exits without camera delays.
                    </p>
                  </div>
                )
              },
              {
                dot: <PlusCircle size={14} className="text-indigo-400" />,
                children: (
                  <div>
                    <h4 className="font-bold text-white text-xs">Discounted Rates Override</h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                      Saves up to 25% on standard ticket prices. Valid for unlimited entry cycles.
                    </p>
                  </div>
                )
              }
            ]}
          />
        </Card>
      </div>
    </div>
  );
};

export default MonthlyPass;
