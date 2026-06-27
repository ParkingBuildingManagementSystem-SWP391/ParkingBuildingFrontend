import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Car, AlertTriangle, Clock, Building2, Sparkles, ArrowRight } from 'lucide-react';

const LocateVehicle = () => {
  const [licensePlate, setLicensePlate] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!licensePlate.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    // Chuẩn hóa chuỗi trước khi gọi API (tối ưu hóa UI phản hồi)
    const formattedPlate = licensePlate.replace(/[.\-\s]/g, '').toUpperCase();

    try {
      // Gọi API Endpoint ẩn danh của Backend
      const response = await axios.get(`/api/Parking/locate?licensePlate=${formattedPlate}`);

      if (response.data.isSuccess) {
        setResult(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Không tìm thấy phương tiện đang đỗ trong bãi.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewOnMap = (floorId, slotName) => {
    // Điều hướng sang sơ đồ bãi xe kèm theo các Query Parameters: floorId và slotName
    navigate(`/parking-map?floorId=${floorId}&slotName=${encodeURIComponent(slotName)}`);
  };

  const steps = [
    { icon: Car, title: 'Nhập biển số xe', desc: 'Gõ đúng biển số phương tiện bạn đang gửi.' },
    { icon: Building2, title: 'Hệ thống định vị', desc: 'Quét toàn bộ tòa nhà để tìm tầng và ô đỗ.' },
    { icon: MapPin, title: 'Chỉ đường tận nơi', desc: 'Xem vị trí trực tiếp trên sơ đồ bãi xe.' },
  ];

  return (
    <section id="locate-vehicle" className="relative w-full max-w-full overflow-hidden bg-slate-50 px-4 py-16 text-slate-950 transition-colors duration-300 dark:bg-slate-950 dark:text-white sm:px-6">
      {/* Background decor */}
      <div className="pointer-events-none absolute left-[-6rem] top-[-6rem] h-72 w-72 rounded-full bg-indigo-600/5 blur-[90px] dark:bg-indigo-500/10 sm:-left-24 sm:h-96 sm:w-96" />
      <div className="pointer-events-none absolute bottom-[-6rem] right-[-6rem] h-72 w-72 rounded-full bg-emerald-500/5 blur-[90px] dark:bg-emerald-400/10 sm:-right-24 sm:h-96 sm:w-96" />

      <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-16">

        {/* ============ Cột trái: giới thiệu + các bước ============ */}
        <div className="min-w-0 text-center lg:text-left">
          <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-[1.5px] text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
            <Sparkles className="h-3.5 w-3.5" strokeWidth={2.5} />
            Tra cứu nhanh
          </span>

          <h2 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Quên mất bạn đỗ xe ở đâu?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-slate-600 dark:text-slate-300 lg:mx-0">
            Chỉ cần biển số xe, hệ thống sẽ định vị chính xác tầng và ô đỗ trong tòa nhà — dành cho cả tài xế thành viên lẫn khách vãng lai.
          </p>

          {/* 3 bước */}
          <div className="mx-auto mt-8 max-w-md space-y-4 lg:mx-0">
            {steps.map((s, i) => (
              <div key={i} className="flex min-w-0 items-start gap-4 text-left">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-700">
                  <s.icon className="h-5 w-5 text-indigo-600" strokeWidth={2.2} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white">{i + 1}</span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{s.title}</h3>
                  </div>
                  <p className="mt-1 text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 inline-flex items-center gap-2 text-[12px] font-semibold text-slate-400 dark:text-slate-500">
            <Clock className="h-3.5 w-3.5" strokeWidth={2.5} />
            Dữ liệu cập nhật theo thời gian thực
          </div>
        </div>

        {/* ============ Cột phải: thẻ tra cứu ============ */}
        <div className="relative min-w-0 w-full">
          <div className="relative z-10 mx-auto w-full max-w-md rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.25)] transition-colors duration-300 dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-none dark:[&_h3]:text-white dark:[&_label]:text-slate-500 dark:[&_p]:text-slate-400 sm:p-8">
            <div className="mb-7 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-600/30">
                <Search className="h-6 w-6 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-lg font-extrabold tracking-tight text-slate-900">Tìm vị trí xe đỗ</h3>
                <p className="text-[12.5px] font-medium text-slate-500">Nhập biển số để định vị ngay</p>
              </div>
            </div>

            {/* Form Tra Cứu */}
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <label className="mb-2 block text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Nhập biển số xe của bạn</label>
                <input
                  type="text"
                  placeholder="VÍ DỤ: 30A-123.45"
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(e.target.value)}
                  className="w-full rounded-[14px] border-[1.5px] border-slate-200 bg-slate-50 px-4 py-3.5 text-center text-base font-extrabold uppercase tracking-widest text-slate-900 placeholder:text-slate-300 transition-all duration-200 focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-600/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 sm:text-lg"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-[14px] bg-gradient-to-br from-indigo-500 to-indigo-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/25 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {loading ? (
                  'Đang kiểm tra...'
                ) : (
                  <>
                    <Search className="h-4 w-4" strokeWidth={2.5} />
                    Tìm Vị Trí Ngay
                  </>
                )}
              </button>
            </form>

            {/* Khung Thông Báo Lỗi */}
            {error && (
              <div className="animate-fade-up mt-5 flex items-center justify-center gap-2 rounded-[14px] border border-red-200 bg-red-50 p-3.5 text-sm font-semibold text-red-600 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">
                <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                {error}
              </div>
            )}

            {/* Khung Hiển Thị Kết Quả Đỗ Xe */}
            {result && (
              <div className="animate-fade-up mt-6 space-y-4 border-t border-slate-100 pt-6 dark:border-slate-700">
                <div className="text-center">
                  <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500"></span>
                    Đang Đỗ Trong Bãi
                  </span>
                  <h3 className="flex min-w-0 items-center justify-center gap-2 break-all text-xl font-extrabold tracking-widest text-slate-900 dark:text-white sm:text-2xl">
                    <Car className="h-6 w-6 text-slate-400" strokeWidth={2.5} />
                    {result.licenseVehicle}
                  </h3>
                </div>

                {/* Thông tin Tầng & Ô Đỗ */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-[14px] border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
                    <span className="mb-1.5 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      <Building2 className="h-3 w-3" strokeWidth={2.5} />
                      TẦNG ĐỖ XE
                    </span>
                    <span className="break-words text-xl font-extrabold text-indigo-600">{result.floorName}</span>
                  </div>
                  <div className="rounded-[14px] border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
                    <span className="mb-1.5 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      <MapPin className="h-3 w-3" strokeWidth={2.5} />
                      VỊ TRÍ Ô ĐỖ
                    </span>
                    <span className="break-words text-xl font-extrabold text-emerald-600">{result.slotName}</span>
                  </div>
                </div>

                {/* Ảnh Cổng Vào Đối Chứng */}
                {result.checkInImageUrl && (
                  <div className="dark:[&>span]:text-slate-500">
                    <span className="mb-2 block text-[9px] font-bold uppercase tracking-wider text-slate-400">Ảnh Cổng Check-in Đối Chứng</span>
                    <div className="group relative overflow-hidden rounded-[14px] border border-slate-200 shadow-sm dark:border-slate-700">
                      <img
                        src={result.checkInImageUrl}
                        alt="Ảnh cổng check-in xe"
                        className="h-40 w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                      <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-lg bg-slate-900/80 px-2.5 py-1 text-[10px] font-medium text-white shadow-sm backdrop-blur-md">
                        <Clock className="h-3 w-3" strokeWidth={2.5} />
                        Vào bãi: {new Date(result.checkInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                  </div>
                )}

                {/* Nút Xem Bản Đồ Chỉ Đường */}
                <button
                  onClick={() => handleViewOnMap(result.floorId, result.slotName)}
                  className="flex w-full items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-slate-200 bg-white py-3.5 text-sm font-bold text-slate-700 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <MapPin className="h-4 w-4 text-indigo-600" strokeWidth={2.5} />
                  Chỉ đường trên Sơ đồ đỗ xe
                  <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </section>
  );
};

export default LocateVehicle;
