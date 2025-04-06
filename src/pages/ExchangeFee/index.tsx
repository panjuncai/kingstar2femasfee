import services from '@/services/demo';
import {
  ActionType,
  PageContainer,
  ProDescriptions,
  ProDescriptionsItemProps,
  ProTable,
} from '@ant-design/pro-components';
import { Button, Drawer } from 'antd';
import React, { useRef, useState } from 'react';
import ImportForm from './components/ImportForm';
const { queryUserList } = services.UserController;

const ExchangeFeePage: React.FC<unknown> = () => {
  const [importModalVisible, handleImportModalVisible] =
    useState<boolean>(false);
  const actionRef = useRef<ActionType>();
  const [row, setRow] = useState<API.UserInfo>();

  if (importModalVisible) {
    return <ImportForm />;
  }
  const columns: ProDescriptionsItemProps<API.UserInfo>[] = [
    {
      title: '名称',
      dataIndex: 'name',
      tip: '名称是唯一的 key',
      formItemProps: {
        rules: [
          {
            required: true,
            message: '名称为必填项',
          },
        ],
      },
    },
    {
      title: '昵称',
      dataIndex: 'nickName',
      valueType: 'text',
    },
    {
      title: '性别',
      dataIndex: 'gender',
      hideInForm: true,
      valueEnum: {
        0: { text: '男', status: 'MALE' },
        1: { text: '女', status: 'FEMALE' },
      },
    },
  ];

  return (
    <PageContainer
      header={{
        title: '交易所手续费率',
      }}
    >
      <ProTable<API.UserInfo>
        headerTitle=""
        actionRef={actionRef}
        rowKey="id"
        search={false}
        toolBarRender={() => [
          <Button
            key="1"
            type="primary"
            onClick={() => handleImportModalVisible(true)}
          >
            导入
          </Button>,
        ]}
        options={{
          setting: false,
          density: false,
          fullScreen: false,
          reload: false,
        }}
        request={async (params, sorter, filter) => {
          const { data, success } = await queryUserList({
            ...params,
            // FIXME: remove @ts-ignore
            // @ts-ignore
            sorter,
            filter,
          });
          return {
            data: data?.list || [],
            success,
          };
        }}
        columns={columns}
      />

      <Drawer
        width={600}
        open={!!row}
        onClose={() => {
          setRow(undefined);
        }}
        closable={false}
      >
        {row?.name && (
          <ProDescriptions<API.UserInfo>
            column={2}
            title={row?.name}
            request={async () => ({
              data: row || {},
            })}
            params={{
              id: row?.name,
            }}
            columns={columns}
          />
        )}
      </Drawer>
    </PageContainer>
  );
};

export default ExchangeFeePage;
