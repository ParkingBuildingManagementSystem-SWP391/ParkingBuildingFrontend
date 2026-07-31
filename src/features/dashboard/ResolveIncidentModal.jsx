import React, { useEffect } from 'react';
import { Modal, Form, Input, Button } from 'antd';
import { useTranslation } from 'react-i18next';

const { TextArea } = Input;

const ResolveIncidentModal = ({ isOpen, onClose, incident, onResolve, loading }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();

  useEffect(() => {
    if (isOpen) {
      form.setFieldsValue({
        resolutionNotes: t('resolveIncident.defaultNotes')
      });
    }
  }, [isOpen, form, t]);

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
      title={t('resolveIncident.modalTitle', { id: incident?.id })}
      open={isOpen}
      onCancel={onClose}
      footer={null}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="resolutionNotes"
          label={t('resolveIncident.notesLabel')}
          rules={[{ required: true, message: t('resolveIncident.notesRequired') }]}
        >
          <TextArea rows={3} placeholder={t('resolveIncident.notesPlaceholder')} />
        </Form.Item>

        <div className="flex justify-end gap-2 mt-4">
          <Button onClick={onClose} disabled={loading}>{t('resolveIncident.cancelBtn')}</Button>
          <Button type="primary" htmlType="submit" loading={loading} className="bg-emerald-600 border-none hover:bg-emerald-700">
            {t('resolveIncident.confirmBtn')}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default ResolveIncidentModal;
