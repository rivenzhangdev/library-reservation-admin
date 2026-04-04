import services from '@/services/demo';
import {
  ActionType,
  FooterToolbar,
  PageContainer,
  ProColumns,
  ProDescriptions,
  ProTable,
} from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Button, Divider, Drawer, message } from 'antd';
import React, { useRef, useState } from 'react';
import CreateForm from './components/CreateForm';
import UpdateForm, { FormValueType } from './components/UpdateForm';

const { addUser, queryUserList, deleteUser, modifyUser } =
  services.UserController;

const TableList: React.FC<unknown> = () => {
  const intl = useIntl();

  // helper functions moved inside component to access intl
  const handleAdd = async (fields: API.UserInfo) => {
    const hide = message.loading(
      intl.formatMessage({ id: 'common.adding', defaultMessage: 'Adding...' }),
    );
    try {
      await addUser({ ...fields });
      hide();
      message.success(
        intl.formatMessage({
          id: 'common.addSuccess',
          defaultMessage: 'Added successfully',
        }),
      );
      return true;
    } catch (error) {
      hide();
      message.error(
        intl.formatMessage({
          id: 'common.addFailed',
          defaultMessage: 'Add failed, please try again!',
        }),
      );
      return false;
    }
  };

  const handleUpdate = async (fields: FormValueType) => {
    const hide = message.loading(
      intl.formatMessage({
        id: 'common.configuring',
        defaultMessage: 'Configuring...',
      }),
    );
    try {
      await modifyUser(
        {
          userId: fields.id || '',
        },
        {
          name: fields.name || '',
          nickName: fields.nickName || '',
          email: fields.email || '',
        },
      );
      hide();
      message.success(
        intl.formatMessage({
          id: 'common.configSuccess',
          defaultMessage: 'Configured successfully',
        }),
      );
      return true;
    } catch (error) {
      hide();
      message.error(
        intl.formatMessage({
          id: 'common.configFailed',
          defaultMessage: 'Config failed, please try again!',
        }),
      );
      return false;
    }
  };

  const handleRemove = async (selectedRows: API.UserInfo[]) => {
    const hide = message.loading(
      intl.formatMessage({
        id: 'common.deleting',
        defaultMessage: 'Deleting...',
      }),
    );
    if (!selectedRows) return true;
    try {
      await deleteUser({
        userId: selectedRows.find((row) => row.id)?.id || '',
      });
      hide();
      message.success(
        intl.formatMessage({
          id: 'common.deleteSuccessRefresh',
          defaultMessage: 'Deleted successfully, refreshing',
        }),
      );
      return true;
    } catch (error) {
      hide();
      message.error(
        intl.formatMessage({
          id: 'common.deleteFailed',
          defaultMessage: 'Delete failed, please try again',
        }),
      );
      return false;
    }
  };

  const [createModalVisible, handleModalVisible] = useState<boolean>(false);
  const [updateModalVisible, handleUpdateModalVisible] =
    useState<boolean>(false);
  const [stepFormValues, setStepFormValues] = useState({});
  const actionRef = useRef<ActionType>();
  const [row, setRow] = useState<API.UserInfo>();
  const [selectedRowsState, setSelectedRows] = useState<API.UserInfo[]>([]);
  const columns: ProColumns<API.UserInfo>[] = [
    {
      title: intl.formatMessage({ id: 'table.name', defaultMessage: 'Name' }),
      dataIndex: 'name',
      tip: intl.formatMessage({
        id: 'table.nameTip',
        defaultMessage: 'Name is a unique key',
      }),
      formItemProps: {
        rules: [
          {
            required: true,
            message: intl.formatMessage({
              id: 'table.nameRequired',
              defaultMessage: 'Name is required',
            }),
          },
        ],
      },
    },
    {
      title: intl.formatMessage({
        id: 'table.nickname',
        defaultMessage: 'Nickname',
      }),
      dataIndex: 'nickName',
      valueType: 'text',
    },
    {
      title: intl.formatMessage({
        id: 'table.gender',
        defaultMessage: 'Gender',
      }),
      dataIndex: 'gender',
      hideInForm: true,
      valueEnum: {
        0: {
          text: intl.formatMessage({
            id: 'table.gender.male',
            defaultMessage: 'Male',
          }),
          status: 'MALE',
        },
        1: {
          text: intl.formatMessage({
            id: 'table.gender.female',
            defaultMessage: 'Female',
          }),
          status: 'FEMALE',
        },
      },
    },
    {
      title: intl.formatMessage({
        id: 'common.action',
        defaultMessage: 'Action',
      }),
      dataIndex: 'option',
      valueType: 'option',
      render: (_, record) => (
        <>
          <a
            onClick={() => {
              handleUpdateModalVisible(true);
              setStepFormValues(record);
            }}
          >
            {intl.formatMessage({ id: 'common.edit', defaultMessage: 'Edit' })}
          </a>
          <Divider type="vertical" />
          <a href="">
            {intl.formatMessage({
              id: 'table.subscribeAlerts',
              defaultMessage: 'Subscribe alerts',
            })}
          </a>
        </>
      ),
    },
  ];

  return (
    <PageContainer
      header={{
        title: intl.formatMessage({
          id: 'table.demoTitle',
          defaultMessage: 'CRUD example',
        }),
      }}
    >
      <ProTable<API.UserInfo>
        headerTitle={intl.formatMessage({
          id: 'table.headerTitle',
          defaultMessage: 'Query table',
        })}
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 120,
          defaultCollapsed: false,
        }}
        toolBarRender={() => [
          <Button
            key="1"
            type="primary"
            onClick={() => handleModalVisible(true)}
          >
            {intl.formatMessage({ id: 'common.new', defaultMessage: 'New' })}
          </Button>,
        ]}
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
        rowSelection={{
          onChange: (_, selectedRows) => setSelectedRows(selectedRows),
        }}
      />
      {selectedRowsState?.length > 0 && (
        <FooterToolbar
          extra={
            <div>
              {intl.formatMessage(
                {
                  id: 'common.selectedItems',
                  defaultMessage: 'Selected {count} items',
                },
                { count: selectedRowsState.length },
              )}
            </div>
          }
        >
          <Button
            onClick={async () => {
              await handleRemove(selectedRowsState);
              setSelectedRows([]);
              actionRef.current?.reloadAndRest?.();
            }}
          >
            {intl.formatMessage({
              id: 'common.bulkDelete',
              defaultMessage: 'Bulk delete',
            })}
          </Button>
          <Button type="primary">
            {intl.formatMessage({
              id: 'common.bulkApprove',
              defaultMessage: 'Bulk approve',
            })}
          </Button>
        </FooterToolbar>
      )}
      <CreateForm
        onCancel={() => handleModalVisible(false)}
        modalVisible={createModalVisible}
      >
        <ProTable<API.UserInfo, API.UserInfo>
          onSubmit={async (value) => {
            const success = await handleAdd(value);
            if (success) {
              handleModalVisible(false);
              if (actionRef.current) {
                actionRef.current.reload();
              }
            }
          }}
          rowKey="id"
          type="form"
          columns={columns}
        />
      </CreateForm>
      {stepFormValues && Object.keys(stepFormValues).length ? (
        <UpdateForm
          onSubmit={async (value) => {
            const success = await handleUpdate(value);
            if (success) {
              handleUpdateModalVisible(false);
              setStepFormValues({});
              if (actionRef.current) {
                actionRef.current.reload();
              }
            }
          }}
          onCancel={() => {
            handleUpdateModalVisible(false);
            setStepFormValues({});
          }}
          updateModalVisible={updateModalVisible}
          values={stepFormValues}
        />
      ) : null}

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
            columns={columns as any}
          />
        )}
      </Drawer>
    </PageContainer>
  );
};

export default TableList;
