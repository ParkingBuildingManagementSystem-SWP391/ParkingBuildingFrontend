import React, { useState } from 'react';
import { Modal, Form, Select, Input, Button, message } from 'antd';
import incidentReportService from '../../services/incidentReportService';

const { Option } = Select;
const { TextArea } = Input;

const DriverCreateIncidentModal = ({ isOpen, onClose, licenseVehicle = '', onSuccess }) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const issueTypes = [
    { value: 'Lost Ticket', label: 'Mất thẻ giữ xe vật lý' },
    { value: 'Vehicle Damage', label: 'Xe bị va chạm / Trầy xước' },
    { value: 'Other', label: 'Sự cố khác' }
  ];

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      const normalizedPlate = licenseVehicle.trim().toUpperCase();
      if (!normalizedPlate) {
        message.error('Vui lòng nhập biển số xe.');
        return;
      }

      const payload = {
        licenseVehicle: normalizedPlate,
        issueType: values.issueType,
        description: values.description,
        imageProofUrl: "" // Hỗ trợ upload ảnh lên Cloudinary nếu cần
      };

      await incidentReportService.createIncident(payload);
      message.success('Gửi báo cáo sự cố thành công. Ban quản lý sẽ liên hệ hỗ trợ bạn.');
      form.resetFields();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      message.error(err.message || 'Gửi báo cáo thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Báo Cáo Sự Cố Lượt Đỗ"
      open={isOpen}
      onCancel={onClose}
      footer={null}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="issueType"
          label="Loại sự cố:"
          rules={[{ required: true, message: 'Vui lòng chọn loại sự cố!' }]}
        >
          <Select placeholder="Chọn loại sự cố gặp phải">
            {issueTypes.map(t => (
              <Option key={t.value} value={t.value}>{t.label}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="description"
          label="Chi tiết sự việc:"
          rules={[{ required: true, message: 'Vui lòng mô tả chi tiết sự cố!' }]}
        >
          <TextArea rows={4} placeholder="Vui lòng cung cấp chi tiết vị trí hoặc tình trạng xe..." />
        </Form.Item>

        <div className="flex justify-end gap-2 mt-4">
          <Button onClick={onClose} disabled={submitting}>Hủy</Button>
          <Button type="primary" htmlType="submit" loading={submitting} danger>
            Gửi Báo Cáo
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default DriverCreateIncidentModal;
