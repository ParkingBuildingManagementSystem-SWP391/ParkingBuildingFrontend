import React, { useEffect, useState } from 'react';
import { Modal, Form, Select, Input, Upload, Button, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import incidentReportService from '../../services/incidentReportService';

const { Option } = Select;
const { TextArea } = Input;

const CreateIncidentModal = ({ isOpen, onClose, activeSessionId = null, onSuccess }) => {
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fileList, setFileList] = useState([]);

  useEffect(() => {
    if (isOpen) {
      form.setFieldsValue({
        issueType: form.getFieldValue('issueType') || 'Lost Ticket',
        sessionId: activeSessionId || undefined
      });
    }
  }, [activeSessionId, form, isOpen]);

  // Danh sách các loại sự cố phổ biến
  const issueTypes = [
    { value: 'Lost Ticket', label: 'Mất thẻ giữ xe' },
    { value: 'Vehicle Damage', label: 'Xe bị va chạm / Hư hỏng' },
    { value: 'Equipment Malfunction', label: 'Lỗi thiết bị (Barrier/Camera/Hệ thống)' },
    { value: 'Staff Complaint', label: 'Khiếu nại nhân viên' },
    { value: 'Other', label: 'Khác' }
  ];

  // Hàm upload ảnh lên Cloudinary
  const uploadImageToCloud = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'parking_incidents'); // preset cấu hình trên Cloudinary
    
    // Nếu chưa có Cloudinary, tạm thời trả về URL giả lập hoặc log lỗi
    try {
      const res = await fetch('https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      return data.secure_url || '';
    } catch (err) {
      console.warn("Cloudinary upload failed, using local/fake URL", err);
      return URL.createObjectURL(file); // fallback tạm thời
    }
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

      const sessionId = activeSessionId || values.sessionId;
      const payload = {
        sessionId: sessionId ? parseInt(sessionId, 10) : null,
        issueType: values.issueType,
        description: values.description,
        imageProofUrl
      };

      await incidentReportService.createIncident(payload);
      message.success('Báo cáo sự cố đã được gửi đi thành công.');
      onSuccess(); // Reload danh sách hoặc cập nhật UI cha
      form.resetFields();
      setFileList([]);
      onClose();   // Đóng modal
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
      title="Báo Cáo Sự Cố Mới"
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
          sessionId: activeSessionId
        }}
      >
        <Form.Item
          name="issueType"
          label="Loại sự cố:"
          rules={[{ required: true, message: 'Vui lòng chọn loại sự cố!' }]}
        >
          <Select>
            {issueTypes.map(t => (
              <Option key={t.value} value={t.value}>{t.label}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="sessionId"
          label="Mã lượt đỗ liên quan (Session ID):"
        >
          <Input 
            disabled={!!activeSessionId}
            placeholder="Có thể bỏ trống nếu là sự cố chung..." 
          />
        </Form.Item>

        <Form.Item
          name="description"
          label="Chi tiết sự việc:"
          rules={[{ required: true, message: 'Vui lòng nhập chi tiết sự cố!' }]}
        >
          <TextArea rows={4} placeholder="Nhập thông tin chi tiết sự cố..." />
        </Form.Item>

        <Form.Item
          label="Ảnh chụp bằng chứng (nếu có):"
        >
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
            Gửi Báo Cáo
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default CreateIncidentModal;
