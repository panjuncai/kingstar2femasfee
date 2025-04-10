import ImportForm from '@/components/ImportForm';
import { ExchangeFeeItem } from '@/types/exchangeFee';
import { compareAmount, compareRate } from '@/utils/tool';
import {
  ActionType,
  PageContainer,
  ProColumns,
  ProTable,
} from '@ant-design/pro-components';
import { Button, Modal, Pagination, message } from 'antd';
import React, { useEffect, useRef, useState } from 'react';

const ExchangeFeePage: React.FC<unknown> = () => {
  const [importModalVisible, setImportModalVisible] = useState<boolean>(false);
  const actionRef = useRef<ActionType>();
  const [dataSource, setDataSource] = useState<ExchangeFeeItem[]>([]);
  const [originalData, setOriginalData] = useState<ExchangeFeeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
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
      title: '产品名称',
      dataIndex: 'product_name',
      valueType: 'text',
      fieldProps: {
        allowClear: true,
      },
      hideInSearch: true,
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
      title: '合约代码',
      dataIndex: 'instrument_id',
      valueType: 'text',
      fieldProps: {
        allowClear: true,
      },
    },
    {
      title: '投保标识',
      dataIndex: 'hedge_flag',
      valueType: 'select',
      valueEnum: {
        '*': { text: '*' },
        投机: { text: '投机' },
        套保: { text: '套保' },
        套利: { text: '套利' },
      },
    },
    {
      title: '买卖标识',
      dataIndex: 'buy_sell',
      valueType: 'select',
      valueEnum: {
        '*': { text: '*' },
        买入: { text: '买入' },
        卖出: { text: '卖出' },
      },
    },
    {
      title: '开仓手续费额(按手数)',
      dataIndex: 'open_fee_amt',
      valueType: 'digit',
      fieldProps: {
        precision: 2,
      },
    },
    {
      title: '开仓手续费率(按金额)',
      dataIndex: 'open_fee_rate',
      valueType: 'digit',
      fieldProps: {
        precision: 8,
      },
    },
    {
      title: '短线开仓手续费额(按手数)',
      dataIndex: 'short_open_fee_amt',
      valueType: 'digit',
      fieldProps: {
        precision: 2,
      },
    },
    {
      title: '短线开仓手续费率(按金额)',
      dataIndex: 'short_open_fee_rate',
      valueType: 'digit',
      fieldProps: {
        precision: 8,
      },
    },
    {
      title: '平仓手续费额(按手数)',
      dataIndex: 'offset_fee_amt',
      valueType: 'digit',
      fieldProps: {
        precision: 2,
      },
    },
    {
      title: '平仓手续费率(按金额)',
      dataIndex: 'offset_fee_rate',
      valueType: 'digit',
      fieldProps: {
        precision: 8,
      },
    },
    {
      title: '平今手续费额(按手数)',
      dataIndex: 'ot_fee_amt',
      valueType: 'digit',
      fieldProps: {
        precision: 2,
      },
    },
    {
      title: '平今手续费率(按金额)',
      dataIndex: 'ot_fee_rate',
      valueType: 'digit',
      fieldProps: {
        precision: 8,
      },
    },
    {
      title: '行权手续费额(按手数)',
      dataIndex: 'exec_clear_fee_amt',
      valueType: 'digit',
      fieldProps: {
        precision: 2,
      },
    },
    {
      title: '行权手续费率(按金额)',
      dataIndex: 'exec_clear_fee_rate',
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
        // 确保数据符合ExchangeFeeItem接口定义
        // const typedData = result.data.map((item: any) => ({
        //   exch_code: item.exch_code || '',
        //   product_type: item.product_type || '',
        //   product_id: item.product_id || '',
        //   product_name: item.product_name || '',
        //   option_series_id: item.option_series_id || '',
        //   instrument_id: item.instrument_id || '',
        //   hedge_flag: item.hedge_flag || '*',
        //   buy_sell: item.buy_sell || '*',
        //   open_fee_rate: typeof item.open_fee_rate === 'number' ? item.open_fee_rate : 0,
        //   open_fee_amt: typeof item.open_fee_amt === 'number' ? item.open_fee_amt : 0,
        //   short_open_fee_rate: typeof item.short_open_fee_rate === 'number' ? item.short_open_fee_rate : 0,
        //   short_open_fee_amt: typeof item.short_open_fee_amt === 'number' ? item.short_open_fee_amt : 0,
        //   offset_fee_rate: typeof item.offset_fee_rate === 'number' ? item.offset_fee_rate : 0,
        //   offset_fee_amt: typeof item.offset_fee_amt === 'number' ? item.offset_fee_amt : 0,
        //   ot_fee_rate: typeof item.ot_fee_rate === 'number' ? item.ot_fee_rate : 0,
        //   ot_fee_amt: typeof item.ot_fee_amt === 'number' ? item.ot_fee_amt : 0,
        //   exec_clear_fee_rate: typeof item.exec_clear_fee_rate === 'number' ? item.exec_clear_fee_rate : 0,
        //   exec_clear_fee_amt: typeof item.exec_clear_fee_amt === 'number' ? item.exec_clear_fee_amt : 0,
        // }));

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
          `${record.exch_code}_${record.product_type}_${record.product_id}_${record.option_series_id}_${record.instrument_id}_${record.hedge_flag}_${record.buy_sell}`
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
            if (params.hedge_flag && item.hedge_flag !== params.hedge_flag)
              return false;
            if (params.buy_sell && item.buy_sell !== params.buy_sell)
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
        title="导入飞马交易所手续费率"
        visible={importModalVisible}
        onCancel={() => setImportModalVisible(false)}
        onSuccess={handleImportSuccess}
      />
    </PageContainer>
  );
};

export default ExchangeFeePage;
