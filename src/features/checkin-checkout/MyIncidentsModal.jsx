import React, { useEffect, useState } from 'react';
import { Modal, Tag, Spin, Empty, Button, Timeline } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, WarningOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import incidentReportService from '../../services/incidentReportService';
import { formatDateTimeVN } from '../../utils/dateTime';

const MyIncidentsModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
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
      console.error('Error loading my incidents:', err);
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
          {t('myIncidents.statusResolved')}
        </Tag>
      );
    }
    return (
      <Tag color="warning" icon={<ClockCircleOutlined />}>
        {t('myIncidents.statusPending')}
      </Tag>
    );
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: '24px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <WarningOutlined style={{ color: '#ef4444' }} /> {t('myIncidents.modalTitle')}
          </span>
          <Button icon={<ReloadOutlined />} size="small" onClick={loadIncidents} loading={loading}>
            {t('myIncidents.refresh')}
          </Button>
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      footer={[
        <Button key="close" type="primary" onClick={onClose}>
          {t('myIncidents.close')}
        </Button>,
      ]}
      width={650}
      destroyOnClose
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin tip={t('myIncidents.loading')} />
        </div>
      ) : incidents.length === 0 ? (
        <Empty description={t('myIncidents.empty')} style={{ margin: '30px 0' }} />
      ) : (
        <div style={{ maxHeight: '450px', overflowY: 'auto', paddingLeft: '24px', paddingRight: '8px', paddingTop: '8px', marginTop: '16px' }}>
          <Timeline
            items={(incidents || []).map((item) => {
              const safeItem = item || {};
              const isResolved = safeItem.status === 'Resolved';
              const formatSafeDate = (dateStr) => formatDateTimeVN(dateStr, '---');

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
                        #{safeItem.incidentId || '---'} - {safeItem.issueType || t('myIncidents.defaultType')}
                      </span>
                      {renderStatusTag(safeItem.status)}
                    </div>

                    {safeItem.licenseVehicle && (
                      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                        {t('myIncidents.plateLabel')} <strong style={{ color: '#0f172a' }}>{safeItem.licenseVehicle}</strong>
                      </div>
                    )}

                    <div style={{ fontSize: '13px', color: '#334155', marginBottom: '8px' }}>
                      {t('myIncidents.descriptionLabel')} {safeItem.description || t('myIncidents.noDescription')}
                    </div>

                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                      {t('myIncidents.submittedAtLabel')} {formatSafeDate(safeItem.createdAt)}
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
                          {t('myIncidents.resolvedByLabel', { manager: safeItem.resolvedUsername || t('myIncidents.defaultManager') })}
                        </div>
                        <div style={{ fontSize: '12px', color: '#15803d' }}>
                          {safeItem.resolutionNotes || t('myIncidents.noResolutionNotes')}
                        </div>
                        {safeItem.resolvedAt && (
                          <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '4px' }}>
                            {t('myIncidents.resolvedAtLabel')} {formatSafeDate(safeItem.resolvedAt)}
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
