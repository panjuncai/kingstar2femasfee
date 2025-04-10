import ImportForm from '@/components/ImportForm';
import { ExchangeFeeItem } from '@/types/exchangeFee';
import {
  ActionType,
  PageContainer,
  ProColumns,
  ProTable,
} from '@ant-design/pro-components';
import { Button, Modal, message } from 'antd';
import React, { useEffect, useRef, useState } from 'react';

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
      valueType: 'select',
      valueEnum: {
        中金所: { text: '中金所' },
        大商所: { text: '大商所' },
        广期所: { text: '广期所' },
        上期所: { text: '上期所' },
        能源中心: { text: '能源中心' },
        郑商所: { text: '郑商所' },
      },
    },
    {
      title: '产品类型',
      dataIndex: 'product_type',
      valueType: 'select',
      valueEnum: {
        期货: { text: '期货' },
        期权: { text: '期权' },
      },
    },
    {
      title: '产品代码',
      dataIndex: 'product_id',
      valueType: 'text',
      fieldProps: {
        allowClear: true,
      },
    },
    {
      title: '合约代码',
      dataIndex: 'instrument_id',
      valueType: 'text',
      fieldProps: {
        allowClear: true,
      },
    },
    {
      title: '开仓手续费率（ 按手数）',
      dataIndex: 'open_amt',
      valueType: 'digit',
      fieldProps: {
        precision: 2,
      },
    },
    {
      title: '开仓手续费率（按金额）',
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
          const result = await window.electronAPI.clearExchangeTradeFee();
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
          labelWidth: 160,
          filterType: 'query',
        }}
        loading={loading}
        dataSource={dataSource}
        onSubmit={(params) => {
          // 筛选数据
          const filteredData = dataSource.filter((item) => {
            // 交易所和产品类型 - 精确匹配
            if (params.exch_code && item.exch_code !== params.exch_code)
              return false;
            if (
              params.product_type &&
              item.product_type !== params.product_type
            )
              return false;

            // 产品代码和合约代码 - 模糊匹配
            if (
              params.product_id &&
              !item.product_id.includes(params.product_id)
            )
              return false;
            if (
              params.instrument_id &&
              !item.instrument_id.includes(params.instrument_id)
            )
              return false;

            // 开仓手续费率 - 精确匹配
            if (
              params.open_fee_amt !== undefined &&
              item.open_fee_amt !== params.open_fee_amt
            )
              return false;
            if (
              params.open_fee_rate !== undefined &&
              item.open_fee_rate !== params.open_fee_rate
            )
              return false;

            return true;
          });

          setDataSource(filteredData);

          // 如果没有筛选条件，重新加载所有数据
          if (Object.keys(params).length === 0) {
            loadData();
          }
        }}
        onReset={() => {
          loadData();
        }}
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
        title="导入金仕达客户手续费率"
        visible={importModalVisible}
        onCancel={() => setImportModalVisible(false)}
        onSuccess={handleImportSuccess}
      />
    </PageContainer>
  );
};

export default ExchangeFeePage;
