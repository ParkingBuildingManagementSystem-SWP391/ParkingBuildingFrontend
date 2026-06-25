import React from 'react';
import { ShieldCheck, Zap, Smartphone, Map, Clock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Introduction = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const features = [
    {
      icon: Map,
      title: t('intro.featMapTitle'),
      description: t('intro.featMapDesc')
    },
    {
      icon: Zap,
      title: t('intro.featBookTitle'),
      description: t('intro.featBookDesc')
    },
    {
      icon: ShieldCheck,
      title: t('intro.featSecureTitle'),
      description: t('intro.featSecureDesc')
    },
    {
      icon: Smartphone,
      title: t('intro.featMobileTitle'),
      description: t('intro.featMobileDesc')
    }
  ];

  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-8 space-y-8">

      {/* Hero Section */}
      <section
        className="relative overflow-hidden rounded-2xl shadow-sm text-white"
        style={{ background: 'radial-gradient(120% 120% at 0% 0%, #6366f1 0%, #4f46e5 45%, #3730a3 100%)' }}
      >
        <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
        <div className="relative z-10 p-8 sm:p-14 lg:p-20 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 border border-white/20 text-white text-xs font-bold tracking-widest uppercase backdrop-blur-sm">
            <Clock size={14} /> {t('intro.welcomeFuture')}
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white">
            {t('intro.introTitle1')} <span className="text-indigo-200">{t('intro.introTitleHighlight')}</span> {t('intro.introTitle2')}
          </h1>
          <p className="max-w-2xl mx-auto text-indigo-100 text-base sm:text-lg leading-relaxed font-medium">
            {t('intro.introDesc')}
          </p>
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/parking-map')}
              className="w-full sm:w-auto px-8 py-4 rounded-[14px] bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold transition-all shadow-sm flex items-center justify-center gap-2"
            >
              {t('intro.btnExplore')} <ArrowRight size={18} />
            </button>
            <button
              onClick={() => navigate('/register')}
              className="w-full sm:w-auto px-8 py-4 rounded-[14px] bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold transition-all shadow-sm flex items-center justify-center gap-2"
            >
              {t('intro.btnCreateAcc')}
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="space-y-6">
        <div className="text-center space-y-2 mb-10">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">{t('intro.whyChooseUs')}</h2>
          <p className="text-slate-500 text-sm font-medium">{t('intro.whyChooseUsDesc')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                <feature.icon size={24} strokeWidth={2.5} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section
        className="relative overflow-hidden rounded-2xl shadow-sm text-white mt-12"
        style={{ background: 'radial-gradient(120% 120% at 0% 0%, #6366f1 0%, #4f46e5 45%, #3730a3 100%)' }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 p-10 sm:p-14 text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">{t('intro.readyTitle')}</h2>
          <p className="text-indigo-100 max-w-xl mx-auto font-medium text-sm sm:text-base">
            {t('intro.readyDesc')}
          </p>
        </div>
      </section>

    </div>
  );
};

export default Introduction;
