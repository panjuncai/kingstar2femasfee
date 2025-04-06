import { Button, Form, Modal, message } from 'antd';
import React from 'react';

interface ImportFormProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

const ImportForm: React.FC<ImportFormProps> = ({
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
      title="导入飞马交易所手续费率"
      open={visible}
      onCancel={onCancel}
      footer={null}
      destroyOnClose
    >
      <Form layout="vertical">
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <h3>先清空，后导入</h3>
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
