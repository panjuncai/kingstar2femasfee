import { ImportFormProps } from '@/types/props';
import { Button, Form, Modal, message } from 'antd';
import React from 'react';

const ImportForm: React.FC<ImportFormProps> = ({
  title,
  visible,
  onCancel,
  onSuccess,
}) => {
  const [loading, setLoading] = React.useState<boolean>(false);

  const handleImport = async () => {
    try {
      setLoading(true);

      // 调用Electron API来导入Excel文件
      const result = await window.electronAPI.importExcel();

      if (result.success) {
        message.success(result.message);
        onSuccess();
      } else {
        message.error(result.message);
      }
    } catch (error) {
      console.error('导入失败:', error);
      message.error('导入失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={title}
      open={visible}
      onCancel={onCancel}
      footer={null}
      destroyOnClose
    >
      <Form layout="vertical">
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <h3>本操作会先清空数据，再做导入</h3>
        </div>
        <div style={{ textAlign: 'center' }}>
          <Button
            type="primary"
            onClick={handleImport}
            loading={loading}
            style={{ minWidth: 120 }}
          >
            选择文件
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default ImportForm;
