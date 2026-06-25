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
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Gradient Sleek */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full bg-slate-900/80 backdrop-blur-xl rounded-2xl p-8 border border-slate-800 shadow-2xl z-10">
        <div className="text-center mb-6">
          <span className="text-4xl">🔍</span>
          <h2 className="text-3xl font-extrabold text-amber-500 mt-3 tracking-tight">Tìm Vị Trí Xe Đỗ</h2>
          <p className="text-slate-400 text-xs mt-2">Dành cho tài xế hoặc khách vãng lai quên vị trí đỗ xe trong tòa nhà</p>
        </div>

        {/* Form Tra Cứu */}
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Nhập biển số xe của bạn</label>
            <input
              type="text"
              placeholder="VÍ DỤ: 30A-123.45"
              value={licensePlate}
              onChange={(e) => setLicensePlate(e.target.value)}
              className="w-full px-4 py-3.5 bg-slate-950 border border-slate-800 rounded-xl text-center text-xl font-bold tracking-widest text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent uppercase transition-all duration-200"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold rounded-xl transition-all duration-200 shadow-lg shadow-amber-500/15 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'Đang kiểm tra dữ liệu...' : 'Tìm Vị Trí Ngay'}
          </button>
        </form>

        {/* Khung Thông Báo Lỗi */}
        {error && (
          <div className="mt-6 p-4 bg-red-950/20 border border-red-500/30 rounded-xl text-center text-red-400 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Khung Hiển Thị Kết Quả Đỗ Xe */}
        {result && (
          <div className="mt-8 border-t border-slate-800 pt-6 space-y-4 animate-fade-in">
            <div className="text-center">
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-semibold uppercase tracking-wider">
                Đang Đỗ Trong Bãi
              </span>
              <h3 className="text-2xl font-black tracking-wider mt-3 text-slate-100">{result.licenseVehicle}</h3>
            </div>

            {/* Thông tin Tầng & Ô Đỗ */}
            <div className="grid grid-cols-2 gap-4 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
              <div className="border-r border-slate-850 pr-2">
                <span className="text-[10px] text-slate-500 font-semibold uppercase block">TẦNG ĐỖ XE</span>
                <span className="font-bold text-amber-500 text-lg">{result.floorName}</span>
              </div>
              <div className="pl-2">
                <span className="text-[10px] text-slate-500 font-semibold uppercase block">VỊ TRÍ Ô ĐỖ</span>
                <span className="font-bold text-emerald-400 text-lg">{result.slotName}</span>
              </div>
            </div>

            {/* Ảnh Cổng Vào Đối Chứng */}
            {result.checkInImageUrl && (
              <div>
                <span className="text-[10px] text-slate-500 font-semibold uppercase block mb-2">Ảnh Cổng Check-in Đối Chứng</span>
                <div className="relative group overflow-hidden rounded-xl border border-slate-800 shadow-md">
                  <img
                    src={result.checkInImageUrl}
                    alt="Ảnh cổng check-in xe"
                    className="w-full h-44 object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute bottom-2 right-2 bg-slate-900/80 text-[10px] px-2 py-1 rounded text-slate-350">
                    Vào bãi: {new Date(result.checkInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </div>
              </div>
            )}

            {/* Nút Xem Bản Đồ Chỉ Đường */}
            <button
              onClick={() => handleViewOnMap(result.floorId, result.slotName)}
              className="w-full py-3.5 bg-slate-800 hover:bg-slate-750 text-white font-bold rounded-xl transition duration-200 flex items-center justify-center gap-2 border border-slate-700 shadow-sm"
            >
              🗺️ Chỉ đường trên Sơ đồ đỗ xe
            </button>
          </div>
        )}
        
        <div className="mt-6 text-center">
            <button 
                onClick={() => navigate('/')}
                className="text-slate-400 hover:text-white text-sm font-medium transition-colors"
            >
                ← Quay lại trang chủ
            </button>
        </div>
      </div>
    </div>
  );
};

export default LocateVehicle;
