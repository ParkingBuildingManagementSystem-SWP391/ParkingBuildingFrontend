import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Car, AlertTriangle, Clock, Building2 } from 'lucide-react';

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

  return (
    <section id="locate-vehicle" className="min-h-screen py-12 bg-slate-50 flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[80px] pointer-events-none"></div>

      <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-slate-200 shadow-xl z-10 relative">
        <div className="text-center mb-7">
          <div className="mx-auto w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-600/30">
            <Search className="w-7 h-7 text-white" strokeWidth={2.5} />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Tìm Vị Trí Xe Đỗ</h2>
          <p className="text-slate-500 text-sm mt-2 font-medium px-2">Dành cho tài xế hoặc khách vãng lai quên vị trí đỗ xe trong tòa nhà</p>
        </div>

        {/* Form Tra Cứu */}
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Nhập biển số xe của bạn</label>
            <input
              type="text"
              placeholder="VÍ DỤ: 30A-123.45"
              value={licensePlate}
              onChange={(e) => setLicensePlate(e.target.value)}
              className="w-full px-4 py-3.5 bg-slate-50 border-[1.5px] border-slate-200 rounded-[14px] text-center text-lg font-extrabold tracking-widest text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 uppercase transition-all duration-200"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white font-bold text-sm rounded-[14px] transition-all duration-300 shadow-lg shadow-indigo-600/25 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 flex justify-center items-center gap-2"
          >
            {loading ? (
              'Đang kiểm tra...'
            ) : (
              <>
                <Search className="w-4 h-4" strokeWidth={2.5} />
                Tìm Vị Trí Ngay
              </>
            )}
          </button>
        </form>

        {/* Khung Thông Báo Lỗi */}
        {error && (
          <div className="mt-5 p-3.5 bg-red-50 border border-red-200 rounded-[14px] flex items-center justify-center gap-2 text-red-600 text-sm font-semibold animate-fade-up">
            <AlertTriangle className="w-4 h-4 shrink-0" strokeWidth={2.5} />
            {error}
          </div>
        )}

        {/* Khung Hiển Thị Kết Quả Đỗ Xe */}
        {result && (
          <div className="mt-6 border-t border-slate-100 pt-6 space-y-4 animate-fade-up">
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold uppercase tracking-widest mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Đang Đỗ Trong Bãi
              </span>
              <h3 className="text-2xl font-extrabold tracking-widest text-slate-900 flex items-center justify-center gap-2">
                <Car className="w-6 h-6 text-slate-400" strokeWidth={2.5} />
                {result.licenseVehicle}
              </h3>
            </div>

            {/* Thông tin Tầng & Ô Đỗ */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 p-4 rounded-[14px] border border-slate-200">
                <span className="flex items-center gap-1.5 text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">
                  <Building2 className="w-3 h-3" strokeWidth={2.5} />
                  TẦNG ĐỖ XE
                </span>
                <span className="font-extrabold text-indigo-600 text-xl">{result.floorName}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-[14px] border border-slate-200">
                <span className="flex items-center gap-1.5 text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">
                  <MapPin className="w-3 h-3" strokeWidth={2.5} />
                  VỊ TRÍ Ô ĐỖ
                </span>
                <span className="font-extrabold text-emerald-600 text-xl">{result.slotName}</span>
              </div>
            </div>

            {/* Ảnh Cổng Vào Đối Chứng */}
            {result.checkInImageUrl && (
              <div>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-2">Ảnh Cổng Check-in Đối Chứng</span>
                <div className="relative group overflow-hidden rounded-[14px] border border-slate-200 shadow-sm">
                  <img
                    src={result.checkInImageUrl}
                    alt="Ảnh cổng check-in xe"
                    className="w-full h-40 object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute bottom-2 right-2 bg-slate-900/80 backdrop-blur-md text-[10px] px-2.5 py-1 rounded-lg text-white font-medium shadow-sm flex items-center gap-1">
                    <Clock className="w-3 h-3" strokeWidth={2.5} />
                    Vào bãi: {new Date(result.checkInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </div>
              </div>
            )}

            {/* Nút Xem Bản Đồ Chỉ Đường */}
            <button
              onClick={() => handleViewOnMap(result.floorId, result.slotName)}
              className="w-full py-3.5 bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-[14px] transition duration-200 flex items-center justify-center gap-2 border-[1.5px] border-slate-200 shadow-sm hover:-translate-y-0.5"
            >
              <MapPin className="w-4 h-4 text-indigo-600" strokeWidth={2.5} />
              Chỉ đường trên Sơ đồ đỗ xe
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default LocateVehicle;
