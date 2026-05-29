import React, { useState } from 'react';
import { Card, Form, InputNumber, Button, Switch, Divider, message } from 'antd';
import { Settings as SettingsIcon, Coins, Save, BellRing } from 'lucide-react';
import { PARKING_RATES } from '../services/mockData';

const Settings = () => {
  const [form] = Form.useForm();
  const [rates, setRates] = useState(PARKING_RATES);

  const handleSaveRates = (values) => {
    // Save rates
    PARKING_RATES.Car = values.carRate;
    PARKING_RATES.Motorbike = values.motorbikeRate;
    PARKING_RATES.Electric = values.electricRate;
    PARKING_RATES.VIP = values.vipRate;
    
    setRates({ ...PARKING_RATES });
    message.success('Parking hourly rates updated successfully!');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">System Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Configure pricing scales, gate permissions, and notifications</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Rates Setup Form */}
        <Card title={<span className="text-base font-bold text-white flex items-center gap-2"><Coins size={18}/> Pricing Rates Config (VND/Hour)</span>} className="shadow-lg border border-slate-800">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSaveRates}
            initialValues={{
              carRate: rates.Car,
              motorbikeRate: rates.Motorbike,
              electricRate: rates.Electric,
              vipRate: rates.VIP
            }}
            requiredMark={false}
          >
            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                name="carRate"
                label={<span className="text-slate-400 text-xs">Standard Car</span>}
                rules={[{ required: true }]}
              >
                <InputNumber min={0} className="w-full h-10 bg-slate-800 border-slate-700 text-white rounded-lg" formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={value => value.replace(/\$\s?|(,*)/g, '')} />
              </Form.Item>

              <Form.Item
                name="motorbikeRate"
                label={<span className="text-slate-400 text-xs">Motorbike</span>}
                rules={[{ required: true }]}
              >
                <InputNumber min={0} className="w-full h-10 bg-slate-800 border-slate-700 text-white rounded-lg" formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={value => value.replace(/\$\s?|(,*)/g, '')} />
              </Form.Item>

              <Form.Item
                name="electricRate"
                label={<span className="text-slate-400 text-xs">Electric Vehicle</span>}
                rules={[{ required: true }]}
              >
                <InputNumber min={0} className="w-full h-10 bg-slate-800 border-slate-700 text-white rounded-lg" formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={value => value.replace(/\$\s?|(,*)/g, '')} />
              </Form.Item>

              <Form.Item
                name="vipRate"
                label={<span className="text-slate-400 text-xs">VIP Guest</span>}
                rules={[{ required: true }]}
              >
                <InputNumber min={0} className="w-full h-10 bg-slate-800 border-slate-700 text-white rounded-lg" formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={value => value.replace(/\$\s?|(,*)/g, '')} />
              </Form.Item>
            </div>

            <Form.Item className="mb-0 pt-4">
              <Button
                type="primary"
                htmlType="submit"
                icon={<Save size={15} />}
                className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 border-none font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/10"
              >
                Save Hourly Pricing
              </Button>
            </Form.Item>
          </Form>
        </Card>

        {/* Gate System Overrides */}
        <Card title={<span className="text-base font-bold text-white flex items-center gap-2"><BellRing size={18}/> Gate Controls & Alerts</span>} className="shadow-lg border border-slate-800">
          <div className="space-y-4 py-1.5">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-bold text-white text-xs">Automatic License Recognition (ALPR)</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Automate lane gate activation upon recognized license plates.</p>
              </div>
              <Switch defaultChecked className="bg-slate-750" />
            </div>

            <Divider className="border-slate-800 my-3" />

            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-bold text-white text-xs">Cap Occupancy Warning Alerts</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Send alerts to shift attendants when capacity exceeds 90%.</p>
              </div>
              <Switch defaultChecked className="bg-slate-750" />
            </div>

            <Divider className="border-slate-800 my-3" />

            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-bold text-white text-xs">SMS Billing Receipts Dispatch</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Send transaction messages to card holders on checkout.</p>
              </div>
              <Switch defaultChecked={false} className="bg-slate-750" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
