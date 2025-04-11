import ImportForm from '@/components/ImportForm';
import { ExchangeFeeItem } from '@/types/exchangeFee';
import { compareAmount, compareRate } from '@/utils';
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
  const [originalData, setOriginalData] = useState<ExchangeFeeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [columnsState, setColumnsState] = useState<Record<string, any>>({});
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

  // 从 localStorage 加载列设置
  useEffect(() => {
    const savedColumnsState = localStorage.getItem('exchangeFeeColumnsState');
    if (savedColumnsState) {
      try {
        setColumnsState(JSON.parse(savedColumnsState));
      } catch (error) {
        console.error('加载列设置失败:', error);
      }
    }
  }, []);

  // 保存列设置到 localStorage
  const handleColumnsStateChange = (map: Record<string, any>) => {
    setColumnsState(map);
    localStorage.setItem('exchangeFeeColumnsState', JSON.stringify(map));
  };

  // 定义表格列
  const columns: ProColumns<ExchangeFeeItem>[] = [
    {
      title: '序号',
      dataIndex: 'index',
      valueType: 'index',
      width: 50,
      fixed: 'left',
    },
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
      width: 75,
    },
    {
      title: '产品类型',
      dataIndex: 'product_type',
      valueType: 'select',
      valueEnum: {
        期货: { text: '期货' },
        期权: { text: '期权' },
      },
      width: 80,
    },
    {
      title: '产品',
      dataIndex: 'product_id',
      valueType: 'text',
      fieldProps: {
        allowClear: true,
      },
      width: 45,
    },
    {
      title: '产品名称',
      dataIndex: 'product_name',
      valueType: 'text',
      fieldProps: {
        allowClear: true,
      },
      hideInSearch: true,
      width: 140,
    },
    {
      title: '期权系列',
      dataIndex: 'option_series_id',
      valueType: 'text',
      fieldProps: {
        allowClear: true,
      },
      hideInSearch: true,
    },
    {
      title: '合约',
      dataIndex: 'instrument_id',
      valueType: 'text',
      fieldProps: {
        allowClear: true,
      },
      width: 70,
    },
    {
      title: '投保',
      dataIndex: 'hedge_flag',
      valueType: 'select',
      valueEnum: {
        '*': { text: '*' },
        投机: { text: '投机' },
        套保: { text: '套保' },
        套利: { text: '套利' },
      },
      width: 45,
    },
    {
      title: '买卖',
      dataIndex: 'buy_sell',
      valueType: 'select',
      valueEnum: {
        '*': { text: '*' },
        买入: { text: '买入' },
        卖出: { text: '卖出' },
      },
      width: 45,
    },
    {
      title: '开仓(按手数)',
      dataIndex: 'open_fee_amt',
      valueType: 'digit',
      sorter: (a, b) => a.open_fee_amt - b.open_fee_amt,
    },
    {
      title: '开仓(按金额)',
      dataIndex: 'open_fee_rate',
      valueType: 'digit',
      sorter: (a, b) => a.open_fee_rate - b.open_fee_rate,
    },
    {
      title: '短开(按手数)',
      dataIndex: 'short_open_fee_amt',
      valueType: 'digit',
      sorter: (a, b) => a.short_open_fee_amt - b.short_open_fee_amt,
    },
    {
      title: '短开(按金额)',
      dataIndex: 'short_open_fee_rate',
      valueType: 'digit',
      sorter: (a, b) => a.short_open_fee_rate - b.short_open_fee_rate,
    },
    {
      title: '平仓(按手数)',
      dataIndex: 'offset_fee_amt',
      valueType: 'digit',
      sorter: (a, b) => a.offset_fee_amt - b.offset_fee_amt,
    },
    {
      title: '平仓(按金额)',
      dataIndex: 'offset_fee_rate',
      valueType: 'digit',
      sorter: (a, b) => a.offset_fee_rate - b.offset_fee_rate,
    },
    {
      title: '平今(按手数)',
      dataIndex: 'ot_fee_amt',
      valueType: 'digit',
      sorter: (a, b) => a.ot_fee_amt - b.ot_fee_amt,
    },
    {
      title: '平今(按金额)',
      dataIndex: 'ot_fee_rate',
      valueType: 'digit',
      sorter: (a, b) => a.ot_fee_rate - b.ot_fee_rate,
    },
    {
      title: '行权(按手数)',
      dataIndex: 'exec_clear_fee_amt',
      valueType: 'digit',
      sorter: (a, b) => a.exec_clear_fee_amt - b.exec_clear_fee_amt,
    },
    {
      title: '行权(按金额)',
      dataIndex: 'exec_clear_fee_rate',
      valueType: 'digit',
      sorter: (a, b) => a.exec_clear_fee_rate - b.exec_clear_fee_rate,
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

  // 处理搜索和筛选
  const handleSearch = (params: any) => {
    // 筛选数据 - 始终从原始数据中筛选
    const filteredData = originalData.filter((item) => {
      // 交易所和产品类型 - 精确匹配
      if (params.exch_code && item.exch_code !== params.exch_code) return false;
      if (params.product_type && item.product_type !== params.product_type)
        return false;
      if (params.hedge_flag && item.hedge_flag !== params.hedge_flag)
        return false;
      if (params.buy_sell && item.buy_sell !== params.buy_sell) return false;

      // 产品代码和合约代码 - 模糊匹配
      if (params.product_id && !item.product_id.includes(params.product_id))
        return false;
      if (
        params.instrument_id &&
        !item.instrument_id.includes(params.instrument_id)
      )
        return false;

      // 费率和费额比较
      if (
        params.open_fee_amt !== undefined &&
        !compareAmount(item.open_fee_amt, params.open_fee_amt)
      )
        return false;
      if (
        params.open_fee_rate !== undefined &&
        !compareRate(item.open_fee_rate, params.open_fee_rate)
      )
        return false;
      if (
        params.short_open_fee_amt !== undefined &&
        !compareAmount(item.short_open_fee_amt, params.short_open_fee_amt)
      )
        return false;
      if (
        params.short_open_fee_rate !== undefined &&
        !compareRate(item.short_open_fee_rate, params.short_open_fee_rate)
      )
        return false;
      if (
        params.offset_fee_amt !== undefined &&
        !compareAmount(item.offset_fee_amt, params.offset_fee_amt)
      )
        return false;
      if (
        params.offset_fee_rate !== undefined &&
        !compareRate(item.offset_fee_rate, params.offset_fee_rate)
      )
        return false;
      if (
        params.ot_fee_amt !== undefined &&
        !compareAmount(item.ot_fee_amt, params.ot_fee_amt)
      )
        return false;
      if (
        params.ot_fee_rate !== undefined &&
        !compareRate(item.ot_fee_rate, params.ot_fee_rate)
      )
        return false;
      if (
        params.exec_clear_fee_amt !== undefined &&
        !compareAmount(item.exec_clear_fee_amt, params.exec_clear_fee_amt)
      )
        return false;
      if (
        params.exec_clear_fee_rate !== undefined &&
        !compareRate(item.exec_clear_fee_rate, params.exec_clear_fee_rate)
      )
        return false;

      return true;
    });

    setDataSource(filteredData);
  };

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

  // 组件挂载时加载数据
  useEffect(() => {
    loadData();
  }, []);

  return (
    <PageContainer
      header={{
        title: '交易所手续费率',
      }}
      style={{
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      <ProTable<ExchangeFeeItem>
        headerTitle=""
        actionRef={actionRef}
        rowKey={(record) =>
          `${record.exch_code}_${record.product_type}_${record.product_id}_${record.option_series_id}_${record.instrument_id}_${record.hedge_flag}_${record.buy_sell}`
        }
        search={{
          labelWidth: 160,
          filterType: 'query',
        }}
        loading={loading}
        dataSource={dataSource}
        scroll={{ x: 'max-content', y: 'calc(100vh - 280px)' }}
        pagination={false}
        virtual
        onSubmit={handleSearch}
        onReset={() => {
          setDataSource(originalData);
        }}
        options={{
          setting: true,
          density: false,
          fullScreen: true,
          reload: () => loadData(),
        }}
        columns={columns}
        columnsState={{
          value: columnsState,
          onChange: handleColumnsStateChange,
        }}
        size="small"
        bordered
        style={{
          width: '100%',
          height: '100%',
        }}
        onRow={(record) => ({
          onClick: () => {
            const key = `${record.exch_code}_${record.product_type}_${record.product_id}_${record.option_series_id}_${record.instrument_id}_${record.hedge_flag}_${record.buy_sell}`;
            setSelectedRowKeys([key]);
          },
          style: { cursor: 'pointer' },
        })}
        rowClassName={(record) => {
          const key = `${record.exch_code}_${record.product_type}_${record.product_id}_${record.option_series_id}_${record.instrument_id}_${record.hedge_flag}_${record.buy_sell}`;
          return selectedRowKeys.includes(key) ? 'selected-row' : '';
        }}
        toolBarRender={() => [
          <span key="total" style={{ marginRight: 16 }}>
            总记录数：{dataSource.length}
          </span>,
          <Button
            key="import"
            type="primary"
            onClick={() => setImportModalVisible(true)}
          >
            导入
          </Button>,
          <Button key="clear" danger onClick={handleClearData}>
            清空
          </Button>,
        ]}
      />
      <style>
        {`
          .selected-row {
            background-color: #bae7ff !important;
          }
          .selected-row:hover > td {
            background-color: #bae7ff !important;
          }
          }
        `}
      </style>

      <ImportForm
        title="导入飞马交易所手续费率"
        visible={importModalVisible}
        onCancel={() => setImportModalVisible(false)}
        onSuccess={handleImportSuccess}
      />
    </PageContainer>
  );
};

export default ExchangeFeePage;
