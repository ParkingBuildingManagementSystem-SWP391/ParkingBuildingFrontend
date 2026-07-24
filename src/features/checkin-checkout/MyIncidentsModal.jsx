import React, { useEffect, useState } from 'react';
import { Modal, Tag, Spin, Empty, Button, Timeline } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, WarningOutlined, ReloadOutlined } from '@ant-design/icons';
import incidentReportService from '../../services/incidentReportService';

const MyIncidentsModal = ({ isOpen, onClose }) => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadIncidents = async () => {
    setLoading(true);
    try {
      const data = await incidentReportService.getMyIncidents();
      if (Array.isArray(data)) {
        setIncidents(data);
      } else {
        setIncidents([]);
      }
    } catch (err) {
      console.error('Lỗi khi tải sự cố cá nhân:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadIncidents();
    }
  }, [isOpen]);

  const renderStatusTag = (status) => {
    if (status === 'Resolved') {
      return (
        <Tag color="success" icon={<CheckCircleOutlined />}>
          Đã giải quyết
        </Tag>
      );
    }
    return (
      <Tag color="warning" icon={<ClockCircleOutlined />}>
        Đang chờ xử lý
      </Tag>
    );
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: '24px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <WarningOutlined style={{ color: '#ef4444' }} /> Lịch sử Báo cáo Sự cố của tôi
          </span>
          <Button icon={<ReloadOutlined />} size="small" onClick={loadIncidents} loading={loading}>
            Làm mới
          </Button>
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      footer={[
        <Button key="close" type="primary" onClick={onClose}>
          Đóng
        </Button>,
      ]}
      width={650}
      destroyOnClose
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin tip="Đang tải danh sách sự cố..." />
        </div>
      ) : incidents.length === 0 ? (
        <Empty description="Bạn chưa gửi báo cáo sự cố nào." style={{ margin: '30px 0' }} />
      ) : (
        <div style={{ maxHeight: '450px', overflowY: 'auto', paddingLeft: '24px', paddingRight: '8px', paddingTop: '8px', marginTop: '16px' }}>
          <Timeline
            items={(incidents || []).map((item) => {
              const safeItem = item || {};
              const isResolved = safeItem.status === 'Resolved';
              
              const formatSafeDate = (dateStr) => {
                if (!dateStr) return '---';
                const d = new Date(dateStr);
                return isNaN(d.getTime()) ? '---' : d.toLocaleString('vi-VN');
              };

              return {
                color: isResolved ? 'green' : 'gold',
                dot: isResolved ? <CheckCircleOutlined style={{ fontSize: '16px' }} /> : <ClockCircleOutlined style={{ fontSize: '16px' }} />,
                children: (
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '12px 16px',
                      marginBottom: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#1e293b' }}>
                        #{safeItem.incidentId || '---'} - {safeItem.issueType || 'Sự cố'}
                      </span>
                      {renderStatusTag(safeItem.status)}
                    </div>

                    {safeItem.licenseVehicle && (
                      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                        Biển số: <strong style={{ color: '#0f172a' }}>{safeItem.licenseVehicle}</strong>
                      </div>
                    )}

                    <div style={{ fontSize: '13px', color: '#334155', marginBottom: '8px' }}>
                      Mô tả: {safeItem.description || 'Không có mô tả'}
                    </div>

                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                      Thời gian gửi: {formatSafeDate(safeItem.createdAt)}
                    </div>

                    {isResolved && (
                      <div
                        style={{
                          marginTop: '10px',
                          paddingTop: '8px',
                          borderTop: '1px dashed #cbd5e1',
                          background: '#f0fdf4',
                          padding: '8px 12px',
                          borderRadius: '6px',
                        }}
                      >
                        <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#166534', marginBottom: '4px' }}>
                          Kết quả giải quyết từ Quản lý ({safeItem.resolvedUsername || 'Manager'}):
                        </div>
                        <div style={{ fontSize: '12px', color: '#15803d' }}>
                          {safeItem.resolutionNotes || 'Đã được kiểm tra và xử lý xong.'}
                        </div>
                        {safeItem.resolvedAt && (
                          <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '4px' }}>
                            Xử lý lúc: {formatSafeDate(safeItem.resolvedAt)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ),
              };
            })}
          />
        </div>
      )}
    </Modal>
  );
};

export default MyIncidentsModal;
