import React, { useEffect, useState } from 'react';
import { Modal, Form, Select, Input, Upload, Button, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import incidentReportService from '../../services/incidentReportService';

const { Option } = Select;
const { TextArea } = Input;

const CreateIncidentModal = ({ isOpen, onClose, licenseVehicle = '', onSuccess }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [fileList, setFileList] = useState([]);

  useEffect(() => {
    if (isOpen) {
      form.setFieldsValue({
        issueType: form.getFieldValue('issueType') || 'Lost Ticket',
        licenseVehicle: licenseVehicle || undefined,
      });
    }
  }, [form, isOpen, licenseVehicle]);

  const selectedIssueType = Form.useWatch('issueType', form);

  const issueTypes = [
    { value: 'Lost Ticket', label: t('createIncident.typeLostTicket') },
    { value: 'Vehicle Damage', label: t('createIncident.typeVehicleDamage') },
    { value: 'Equipment Malfunction', label: t('createIncident.typeEquipmentMalfunction') },
    { value: 'Other', label: t('createIncident.typeOther') },
  ];

  const uploadImageToCloud = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'parking_incidents');

    const cloudName = 'ddr2erkma';
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      throw new Error(t('createIncident.uploadCloudError'));
    }

    const data = await res.json();
    if (!data.secure_url) {
      throw new Error(t('createIncident.uploadCloudInvalidUrl'));
    }

    return data.secure_url;
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);

    try {
      let imageProofUrl = '';
      if (fileList.length > 0) {
        imageProofUrl = await uploadImageToCloud(fileList[0].originFileObj);
      }

      const normalizedPlate = (licenseVehicle || values.licenseVehicle || '')
        .trim()
        .toUpperCase();

      if (values.issueType !== 'EquipmentMalfunction' && !normalizedPlate) {
        message.error(t('createIncident.plateRequiredToast'));
        return;
      }

      const payload = {
        licenseVehicle: normalizedPlate || null,
        issueType: values.issueType,
        description: values.description,
        imageProofUrl,
      };

      await incidentReportService.createIncident(payload);
      message.success(t('createIncident.submitSuccess'));
      onSuccess?.();
      form.resetFields();
      setFileList([]);
      onClose();
    } catch (err) {
      message.error(err.message || t('createIncident.submitFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadChange = ({ fileList: newFileList }) => setFileList(newFileList);

  return (
    <Modal
      title={t('createIncident.modalTitle')}
      open={isOpen}
      onCancel={onClose}
      footer={null}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          issueType: 'Lost Ticket',
          licenseVehicle,
        }}
      >
        <Form.Item
          name="issueType"
          label={t('createIncident.issueTypeLabel')}
          rules={[{ required: true, message: t('createIncident.issueTypeRequired') }]}
        >
          <Select>
            {issueTypes.map((type) => (
              <Option key={type.value} value={type.value}>{type.label}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="licenseVehicle"
          label={t('createIncident.plateLabel')}
          rules={[
            {
              required: selectedIssueType !== 'EquipmentMalfunction',
              message: t('createIncident.plateRequired'),
            },
          ]}
        >
          <Input
            disabled={!!licenseVehicle}
            placeholder={selectedIssueType === 'EquipmentMalfunction' ? t('createIncident.plateOptionalEquipment') : t('createIncident.platePlaceholder')}
          />
        </Form.Item>

        <Form.Item
          name="description"
          label={t('createIncident.descriptionLabel')}
          rules={[{ required: true, message: t('createIncident.descriptionRequired') }]}
        >
          <TextArea rows={4} placeholder={t('createIncident.descriptionPlaceholder')} />
        </Form.Item>

        <Form.Item label={t('createIncident.evidenceLabel')}>
          <Upload
            beforeUpload={() => false}
            listType="picture"
            maxCount={1}
            fileList={fileList}
            onChange={handleUploadChange}
          >
            <Button icon={<UploadOutlined />}>{t('createIncident.chooseImage')}</Button>
          </Upload>
        </Form.Item>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '24px' }}>
          <Button onClick={onClose} disabled={submitting}>{t('createIncident.cancelBtn')}</Button>
          <Button type="primary" htmlType="submit" loading={submitting} danger>
            {t('createIncident.submitBtn')}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default CreateIncidentModal;
