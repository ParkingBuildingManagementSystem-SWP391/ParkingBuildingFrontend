import React, { useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Button } from 'antd';

const { TextArea } = Input;

const ResolveIncidentModal = ({ isOpen, onClose, incident, onResolve, loading }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (isOpen) {
      form.setFieldsValue({
        resolutionNotes: 'Đã giải quyết nộp phạt mất thẻ xe',
        fineAmount: 50000
      });
    }
  }, [isOpen, form]);

  const handleSubmit = (values) => {
    onResolve(incident.id, values);
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

        <Form.Item
          name="fineAmount"
          label="Số tiền phạt / Thu thêm (VNĐ):"
          rules={[
            { required: true, message: 'Vui lòng nhập số tiền phạt!' },
            { type: 'number', min: 0, message: 'Số tiền phạt không được nhỏ hơn 0!' }
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={value => value.replace(/\$\s?|(,*)/g, '')}
            placeholder="Nhập số tiền..."
          />
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
