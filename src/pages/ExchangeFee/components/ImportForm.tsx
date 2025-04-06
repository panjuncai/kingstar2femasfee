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
      title="导入手续费数据"
      open={visible}
      onCancel={onCancel}
      footer={null}
      destroyOnClose
    >
      <Form layout="vertical">
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <p>点击下方按钮选择Excel文件进行导入</p>
          <p>支持的文件格式：.xlsx, .xls</p>
          <p>
            Excel列名应包含：交易所、产品类型、产品代码、合约代码、开仓手续费（按手数）、开仓手续费（按金额）
          </p>
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
