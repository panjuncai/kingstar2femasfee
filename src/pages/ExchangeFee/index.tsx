import {
  ActionType,
  PageContainer,
  ProColumns,
  ProTable,
} from '@ant-design/pro-components';
import { Button, Modal, Pagination, message } from 'antd';
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
  const [originalData, setOriginalData] = useState<ExchangeFeeItem[]>([]);
  // 分页相关状态
  const [current, setCurrent] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [total, setTotal] = useState<number>(0);

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
      title: '开仓手续费率(按手数)',
      dataIndex: 'open_amt',
      valueType: 'digit',
      fieldProps: {
        precision: 2,
      },
    },
    {
      title: '开仓手续费率(按金额)',
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
        setOriginalData(result.data);
        setTotal(result.data.length);
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

  // 处理分页变化
  const handlePageChange = (page: number, size?: number) => {
    setCurrent(page);
    if (size) {
      setPageSize(size);
    }
  };

  // 获取当前页数据
  const getCurrentPageData = () => {
    const startIndex = (current - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return dataSource.slice(startIndex, endIndex);
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
          labelWidth: 160,
          filterType: 'query',
        }}
        loading={loading}
        dataSource={getCurrentPageData()}
        onSubmit={(params) => {
          // 筛选数据 - 始终从原始数据中筛选
          const filteredData = originalData.filter((item) => {
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

            // 开仓手续费率 - 近似匹配（考虑浮点数精度问题）
            if (params.open_amt !== undefined) {
              const diff = Math.abs(item.open_amt - params.open_amt);
              if (diff > 0.000001) return false; // 容许很小的误差
            }

            if (params.open_rate !== undefined) {
              // 对于非常小的小数，使用更高精度的近似比较
              const diff = Math.abs(item.open_rate - params.open_rate);
              if (diff > 0.000000001) return false; // 容许极小的误差
            }

            return true;
          });

          setDataSource(filteredData);
          setTotal(filteredData.length);
          setCurrent(1); // 重置到第一页
        }}
        onReset={() => {
          // 重置时恢复原始数据
          setDataSource(originalData);
          setTotal(originalData.length);
          setCurrent(1); // 重置到第一页
        }}
        toolBarRender={() => [
          <div
            key="pagination"
            style={{ display: 'flex', alignItems: 'center' }}
          >
            <Pagination
              current={current}
              pageSize={pageSize}
              total={total}
              size="small"
              onChange={handlePageChange}
              showSizeChanger
              showQuickJumper
              showTotal={(t) => `共 ${t} 条`}
              style={{ marginRight: 16 }}
            />
          </div>,
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
        pagination={false}
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
