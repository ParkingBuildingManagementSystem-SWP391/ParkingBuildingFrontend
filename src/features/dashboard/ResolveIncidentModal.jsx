import React, { useEffect } from 'react';
import { Modal, Form, Input, Button } from 'antd';

const { TextArea } = Input;

const ResolveIncidentModal = ({ isOpen, onClose, incident, onResolve, loading }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (isOpen) {
      form.setFieldsValue({
        resolutionNotes: 'Đã giải quyết sự cố'
      });
    }
  }, [isOpen, form]);

  const handleSubmit = (values) => {
    onResolve(incident.id, {
      resolutionNotes: values.resolutionNotes.trim(),
      fineAmount: 0
    });
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={`Xử Lý Sự Cố #${incident?.id}`}
      open={isOpen}
      onCancel={onClose}
      footer={null}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="resolutionNotes"
          label="Ghi chú giải quyết sự cố:"
          rules={[{ required: true, message: 'Vui lòng nhập ghi chú xử lý!' }]}
        >
          <TextArea rows={3} placeholder="Ví dụ: Đã tìm thấy chìa khóa / Khách đồng ý đóng phạt mất thẻ..." />
        </Form.Item>

        <div className="flex justify-end gap-2 mt-4">
          <Button onClick={onClose} disabled={loading}>Hủy</Button>
          <Button type="primary" htmlType="submit" loading={loading} className="bg-emerald-600 border-none hover:bg-emerald-700">
            Xác Nhận Giải Quyết
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default ResolveIncidentModal;
