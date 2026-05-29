import React from 'react';
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-transparent">
      <div className="glass-panel max-w-lg w-full p-8 rounded-2xl border border-slate-800 text-center shadow-xl">
        <Result
          status="403"
          icon={
            <div className="flex justify-center mb-2">
              <div className="p-4 bg-rose-500/10 rounded-full text-rose-400 border border-rose-500/20">
                <ShieldAlert size={48} className="animate-pulse" />
              </div>
            </div>
          }
          title={<span className="text-white text-2xl font-bold">Access Restrained</span>}
          subTitle={
            <p className="text-slate-400 mt-2 max-w-sm mx-auto">
              Your account does not possess the permissions necessary to enter this section. Please switch your role context to inspect this page.
            </p>
          }
          extra={
            <Button 
              type="primary" 
              onClick={() => navigate('/dashboard')}
              className="bg-indigo-600 hover:bg-indigo-500 border-none px-6 h-10 font-medium rounded-lg"
            >
              Back to Dashboard
            </Button>
          }
        />
      </div>
    </div>
  );
};

export default Unauthorized;
