import {
  ActionType,
  PageContainer,
  ProColumns,
  ProTable,
} from '@ant-design/pro-components';
import { Button, Modal, message } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import ImportForm from './components/ImportForm';

interface ExchangeFeeItem {
  exch_code: string;
  product_type: string;
  product_id: string;
  instrument_id: string;
  open_amt: number;
  open_rate: number;
}

const ExchangeFeePage: React.FC<unknown> = () => {
  const [importModalVisible, setImportModalVisible] = useState<boolean>(false);
  const actionRef = useRef<ActionType>();
  const [dataSource, setDataSource] = useState<ExchangeFeeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // 定义表格列
  const columns: ProColumns<ExchangeFeeItem>[] = [
    {
      title: '交易所',
      dataIndex: 'exch_code',
      valueType: 'text',
    },
    {
      title: '产品类型',
      dataIndex: 'product_type',
      valueType: 'text',
    },
    {
      title: '产品代码',
      dataIndex: 'product_id',
      valueType: 'text',
    },
    {
      title: '合约代码',
      dataIndex: 'instrument_id',
      valueType: 'text',
    },
    {
      title: '开仓手续费（按手数）',
      dataIndex: 'open_amt',
      valueType: 'digit',
      fieldProps: {
        precision: 2,
      },
    },
    {
      title: '开仓手续费（按金额）',
      dataIndex: 'open_rate',
      valueType: 'digit',
      fieldProps: {
        precision: 8,
      },
    },
  ];

  // 从数据库中加载数据
  const loadData = async () => {
    try {
      setLoading(true);
      const result = await window.electronAPI.queryExchangeFees();
      if (result.success && result.data) {
        setDataSource(result.data);
      } else {
        message.error(result.message || '加载数据失败');
      }
    } catch (error) {
      console.error('加载数据失败:', error);
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 组件挂载时加载数据
  useEffect(() => {
    loadData();
  }, []);

  // 导入成功后刷新数据
  const handleImportSuccess = () => {
    setImportModalVisible(false);
    loadData();
  };

  // 清空数据
  const handleClearData = () => {
    Modal.confirm({
      title: '确认清空',
      content: '确定要清空所有交易所手续费数据吗？此操作不可恢复。',
      okText: '确定',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          const result = await window.electronAPI.clearExchangeFees();
          if (result.success) {
            message.success(result.message);
            loadData(); // 刷新数据
          } else {
            message.error(result.message);
          }
        } catch (error) {
          console.error('清空数据失败:', error);
          message.error('清空数据失败');
        }
      },
    });
  };

  return (
    <PageContainer
      header={{
        title: '交易所手续费率',
      }}
    >
      <ProTable<ExchangeFeeItem>
        headerTitle=""
        actionRef={actionRef}
        rowKey={(record) =>
          `${record.exch_code}_${record.product_type}_${record.product_id}_${record.instrument_id}`
        }
        search={{
          labelWidth: 120,
        }}
        loading={loading}
        dataSource={dataSource}
        toolBarRender={() => [
          <Button
            key="1"
            type="primary"
            onClick={() => setImportModalVisible(true)}
          >
            导入
          </Button>,
          <Button key="2" danger onClick={handleClearData}>
            清空
          </Button>,
        ]}
        options={{
          setting: false,
          density: false,
          fullScreen: false,
          reload: () => loadData(),
        }}
        columns={columns}
      />

      <ImportForm
        visible={importModalVisible}
        onCancel={() => setImportModalVisible(false)}
        onSuccess={handleImportSuccess}
      />
    </PageContainer>
  );
};

export default ExchangeFeePage;
