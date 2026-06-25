import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

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
    <section id="locate-vehicle" className="py-12 bg-[#f8fafc] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[60px] pointer-events-none"></div>

      <div className="max-w-sm w-full bg-white rounded-2xl p-6 border border-slate-200 shadow-xl z-10 relative">
        <div className="text-center mb-6">
          <div className="mx-auto w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-3 shadow-inner">
             <span className="text-2xl">🔍</span>
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Tìm Vị Trí Xe Đỗ</h2>
          <p className="text-slate-500 text-xs mt-1.5 font-medium px-2">Dành cho tài xế hoặc khách vãng lai quên vị trí đỗ xe trong tòa nhà</p>
        </div>

        {/* Form Tra Cứu */}
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Nhập biển số xe của bạn</label>
            <input
              type="text"
              placeholder="VÍ DỤ: 30A-123.45"
              value={licensePlate}
              onChange={(e) => setLicensePlate(e.target.value)}
              className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-lg text-center text-lg font-black tracking-widest text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 uppercase transition-all duration-200 shadow-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-lg transition-all duration-300 shadow-md shadow-blue-600/20 active:scale-[0.98] disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {loading ? 'Đang kiểm tra...' : 'Tìm Vị Trí Ngay'}
          </button>
        </form>

        {/* Khung Thông Báo Lỗi */}
        {error && (
          <div className="mt-5 p-3 bg-red-50 border border-red-200 rounded-lg text-center text-red-600 text-xs font-semibold animate-fade-up">
            ⚠️ {error}
          </div>
        )}

        {/* Khung Hiển Thị Kết Quả Đỗ Xe */}
        {result && (
          <div className="mt-6 border-t border-slate-100 pt-5 space-y-4 animate-fade-up">
            <div className="text-center">
              <span className="inline-block px-2.5 py-1 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-bold uppercase tracking-widest mb-2">
                Đang Đỗ Trong Bãi
              </span>
              <h3 className="text-2xl font-black tracking-widest text-slate-800">{result.licenseVehicle}</h3>
            </div>

            {/* Thông tin Tầng & Ô Đỗ */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="border-r border-slate-200 pr-2">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">TẦNG ĐỖ XE</span>
                <span className="font-black text-blue-600 text-lg">{result.floorName}</span>
              </div>
              <div className="pl-2">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">VỊ TRÍ Ô ĐỖ</span>
                <span className="font-black text-emerald-600 text-lg">{result.slotName}</span>
              </div>
            </div>

            {/* Ảnh Cổng Vào Đối Chứng */}
            {result.checkInImageUrl && (
              <div>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">Ảnh Cổng Check-in Đối Chứng</span>
                <div className="relative group overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                  <img
                    src={result.checkInImageUrl}
                    alt="Ảnh cổng check-in xe"
                    className="w-full h-36 object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute bottom-2 right-2 bg-slate-900/80 backdrop-blur-md text-[10px] px-2 py-1 rounded text-white font-medium shadow-sm">
                    Vào bãi: {new Date(result.checkInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </div>
              </div>
            )}

            {/* Nút Xem Bản Đồ Chỉ Đường */}
            <button
              onClick={() => handleViewOnMap(result.floorId, result.slotName)}
              className="w-full py-3 bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-lg transition duration-200 flex items-center justify-center gap-2 border-2 border-slate-200 shadow-sm"
            >
              🗺️ Chỉ đường trên Sơ đồ đỗ xe
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default LocateVehicle;
