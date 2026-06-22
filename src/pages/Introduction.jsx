import React from 'react';
import { ShieldCheck, Zap, Smartphone, Map, Clock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Introduction = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Map,
      title: 'Real-time Live Map',
      description: 'Experience an interactive, real-time map displaying exact slot availability across multiple floors and zones.'
    },
    {
      icon: Zap,
      title: 'Instant Booking',
      description: 'Reserve your parking spot instantly from anywhere. Skip the lines and guarantee your space before you even arrive.'
    },
    {
      icon: ShieldCheck,
      title: 'Secure & Reliable',
      description: 'Advanced ALPR (Automatic License Plate Recognition) ensures secure entry and exit, protecting your vehicle 24/7.'
    },
    {
      icon: Smartphone,
      title: 'Mobile Friendly',
      description: 'Our responsive design guarantees a seamless experience whether you are on your desktop, tablet, or mobile phone.'
    }
  ];

  return (
    <div className="min-h-full rounded-3xl bg-slate-50/50 p-4 sm:p-8 space-y-8 animate-fade-in relative overflow-hidden">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"></div>

      {/* Hero Section */}
      <section className="relative bg-white/60 backdrop-blur-xl border border-white shadow-2xl shadow-blue-900/5 rounded-[2rem] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-indigo-600/5 pointer-events-none"></div>
        <div className="p-8 sm:p-14 lg:p-20 text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold tracking-widest uppercase mb-4 animate-bounce-subtle">
            <Clock size={14} /> Welcome to the Future
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900">
            Next-Gen <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Parking</span> Management
          </h1>
          <p className="max-w-2xl mx-auto text-slate-500 text-base sm:text-lg leading-relaxed font-medium">
            PBMS (Parking Building Management System) revolutionizes the way you park. We integrate cutting-edge AI recognition, real-time mapping, and automated payments to deliver a frictionless parking experience.
          </p>
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => navigate('/parking-map')}
              className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 hover:-translate-y-1"
            >
              Explore Live Map <ArrowRight size={18} />
            </button>
            <button 
              onClick={() => navigate('/register')}
              className="w-full sm:w-auto px-8 py-4 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-bold transition-all shadow-sm flex items-center justify-center gap-2"
            >
              Create Account
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="space-y-6 relative z-10">
        <div className="text-center space-y-2 mb-10">
          <h2 className="text-2xl font-extrabold text-slate-800">Why Choose Us?</h2>
          <p className="text-slate-500 text-sm font-medium">Discover the core features that power our system</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => (
            <div 
              key={idx} 
              className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xl shadow-slate-200/20 hover:-translate-y-2 transition-all duration-300 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-sm">
                <feature.icon size={24} strokeWidth={2.5} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats or Footer CTA */}
      <section className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl p-10 sm:p-14 text-center relative overflow-hidden mt-12 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 space-y-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Ready to simplify your parking?</h2>
          <p className="text-blue-100 max-w-xl mx-auto font-medium text-sm sm:text-base">
            Join thousands of users who have already upgraded their parking experience. Register today and get immediate access to our premium facilities.
          </p>
        </div>
      </section>

    </div>
  );
};

export default Introduction;
