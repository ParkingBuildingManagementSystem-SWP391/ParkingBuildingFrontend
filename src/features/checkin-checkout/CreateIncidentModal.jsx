import React, { useEffect, useState } from 'react';
import { Modal, Form, Select, Input, Upload, Button, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import incidentReportService from '../../services/incidentReportService';

const { Option } = Select;
const { TextArea } = Input;

const CreateIncidentModal = ({ isOpen, onClose, licenseVehicle = '', onSuccess }) => {
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);
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

  const issueTypes = [
    { value: 'Lost Ticket', label: 'Mất thẻ giữ xe' },
    { value: 'Vehicle Damage', label: 'Xe bị va chạm / Hư hỏng' },
    { value: 'Equipment Malfunction', label: 'Lỗi thiết bị (Barrier/Camera/Hệ thống)' },
    { value: 'Staff Complaint', label: 'Khiếu nại nhân viên' },
    { value: 'Other', label: 'Khác' },
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
      throw new Error('Không thể tải ảnh lên máy chủ Cloudinary');
    }

    const data = await res.json();
    if (!data.secure_url) {
      throw new Error('Cloudinary không trả về URL ảnh hợp lệ');
    }

    return data.secure_url;
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);

    try {
      let imageProofUrl = '';
      if (fileList.length > 0) {
        setUploading(true);
        imageProofUrl = await uploadImageToCloud(fileList[0].originFileObj);
        setUploading(false);
      }

      const normalizedPlate = (licenseVehicle || values.licenseVehicle || '')
        .trim()
        .toUpperCase();

      if (!normalizedPlate) {
        message.error('Vui lòng nhập biển số xe.');
        return;
      }

      const payload = {
        licenseVehicle: normalizedPlate,
        issueType: values.issueType,
        description: values.description,
        imageProofUrl,
      };

      await incidentReportService.createIncident(payload);
      message.success('Báo cáo sự cố đã được gửi đi thành công.');
      onSuccess?.();
      form.resetFields();
      setFileList([]);
      onClose();
    } catch (err) {
      message.error(err.message || 'Gửi báo cáo thất bại.');
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  const handleUploadChange = ({ fileList: newFileList }) => setFileList(newFileList);

  return (
    <Modal
      title="Báo cáo sự cố mới"
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
          label="Loại sự cố:"
          rules={[{ required: true, message: 'Vui lòng chọn loại sự cố!' }]}
        >
          <Select>
            {issueTypes.map((type) => (
              <Option key={type.value} value={type.value}>{type.label}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="licenseVehicle"
          label="Biển số xe:"
          rules={[{ required: true, message: 'Vui lòng nhập biển số xe!' }]}
        >
          <Input
            disabled={!!licenseVehicle}
            placeholder="VD: 51A12345"
          />
        </Form.Item>

        <Form.Item
          name="description"
          label="Chi tiết sự việc:"
          rules={[{ required: true, message: 'Vui lòng nhập chi tiết sự cố!' }]}
        >
          <TextArea rows={4} placeholder="Nhập thông tin chi tiết sự cố..." />
        </Form.Item>

        <Form.Item label="Ảnh chụp bằng chứng (nếu có):">
          <Upload
            beforeUpload={() => false}
            listType="picture"
            maxCount={1}
            fileList={fileList}
            onChange={handleUploadChange}
          >
            <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
          </Upload>
        </Form.Item>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '24px' }}>
          <Button onClick={onClose} disabled={submitting}>Hủy</Button>
          <Button type="primary" htmlType="submit" loading={submitting || uploading} danger>
            Gửi báo cáo
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default CreateIncidentModal;
