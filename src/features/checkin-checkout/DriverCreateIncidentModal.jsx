import React, { useState } from 'react';
import { Modal, Form, Select, Input, Button, message } from 'antd';
import { useTranslation } from 'react-i18next';
import incidentReportService from '../../services/incidentReportService';

const { Option } = Select;
const { TextArea } = Input;

const DriverCreateIncidentModal = ({ isOpen, onClose, licenseVehicle = '', onSuccess }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const issueTypes = [
    { value: 'Lost Ticket', label: t('driverCreateIncident.typeLostTicket') },
    { value: 'Vehicle Damage', label: t('driverCreateIncident.typeVehicleDamage') },
    { value: 'Other', label: t('driverCreateIncident.typeOther') }
  ];

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      const normalizedPlate = (licenseVehicle || '').trim().toUpperCase();
      if (!normalizedPlate) {
        message.error(t('driverCreateIncident.plateRequiredToast'));
        return;
      }

      const payload = {
        licenseVehicle: normalizedPlate,
        issueType: values.issueType,
        description: values.description,
        imageProofUrl: ""
      };

      await incidentReportService.createIncident(payload);
      message.success(t('driverCreateIncident.submitSuccess'));
      form.resetFields();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      message.error(err.message || t('driverCreateIncident.submitFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={t('driverCreateIncident.modalTitle')}
      open={isOpen}
      onCancel={onClose}
      footer={null}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="issueType"
          label={t('driverCreateIncident.issueTypeLabel')}
          rules={[{ required: true, message: t('driverCreateIncident.issueTypeRequired') }]}
        >
          <Select placeholder={t('driverCreateIncident.issueTypePlaceholder')}>
            {issueTypes.map(type => (
              <Option key={type.value} value={type.value}>{type.label}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="description"
          label={t('driverCreateIncident.descriptionLabel')}
          rules={[{ required: true, message: t('driverCreateIncident.descriptionRequired') }]}
        >
          <TextArea rows={4} placeholder={t('driverCreateIncident.descriptionPlaceholder')} />
        </Form.Item>

        <div className="flex justify-end gap-2 mt-4">
          <Button onClick={onClose} disabled={submitting}>{t('driverCreateIncident.cancelBtn')}</Button>
          <Button type="primary" htmlType="submit" loading={submitting} danger>
            {t('driverCreateIncident.submitBtn')}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default DriverCreateIncidentModal;
