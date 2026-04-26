import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { request, useIntl } from '@umijs/max';
import { Button, Form, Input, InputNumber, Modal, Space, message } from 'antd';
import React, { useRef, useState } from 'react';
import {
  STANDARD_ACTION_COLUMN,
  STANDARD_TABLE_SCROLL,
  STANDARD_TABLE_SEARCH,
  renderOverflowText,
  toTableDataSource,
} from '../../utils/table';

interface FloorType {
  id: string;
  name: string;
  description?: string;
  totalSeats?: number;
  updatedByName?: string;
  updatedBy?: { name?: string; username?: string };
}

const FloorManagement: React.FC<{ embedded?: boolean }> = ({
  embedded = false,
}) => {
  const intl = useIntl();

  const actionRef = useRef<ActionType>();
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Partial<FloorType> | null>(null);
  const [form] = Form.useForm();

  const columns: ProColumns<FloorType>[] = [
    {
      title: intl.formatMessage({
        id: 'floor.form.name',
        defaultMessage: 'Floor Name',
      }),
      dataIndex: 'name',
      width: 180,
      ellipsis: true,
      render: (_, record) => renderOverflowText(record.name),
    },
    {
      title: intl.formatMessage({
        id: 'floor.form.description',
        defaultMessage: 'Description',
      }),
      dataIndex: 'description',
      width: 240,
      ellipsis: true,
      render: (_, record) => renderOverflowText(record.description),
    },
    {
      title: intl.formatMessage({
        id: 'floor.form.totalSeats',
        defaultMessage: 'Total Seats',
      }),
      dataIndex: 'totalSeats',
    },
    {
      title: intl.formatMessage({
        id: 'common.updatedBy',
        defaultMessage: 'Updated By',
      }),
      dataIndex: 'updatedByName',
      width: 140,
      hideInSearch: true,
      render: (_, record) => record.updatedByName || '-',
    },
    {
      title: intl.formatMessage({
        id: 'common.action',
        defaultMessage: 'Actions',
      }),
      valueType: 'option',
      ...STANDARD_ACTION_COLUMN,
      render: (_: any, record: FloorType) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => {
              setEditing(record);
              form.setFieldsValue(record);
              setModalVisible(true);
            }}
          >
            {intl.formatMessage({ id: 'common.edit', defaultMessage: 'Edit' })}
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              Modal.confirm({
                title: intl.formatMessage({
                  id: 'common.confirm',
                  defaultMessage: 'Confirm',
                }),
                content: intl.formatMessage({
                  id: 'floor.confirmDelete',
                  defaultMessage: 'Are you sure you want to delete this floor?',
                }),
                onOk: async () => {
                  try {
                    await request(`/api/floors/${record.id}`, {
                      method: 'DELETE',
                    });
                    message.success(
                      intl.formatMessage({
                        id: 'common.deleteSuccessRefresh',
                        defaultMessage: 'Deleted successfully, refreshing...',
                      }),
                    );
                    actionRef.current?.reload?.();
                  } catch (e: any) {
                    message.error(
                      e?.message ||
                        intl.formatMessage({
                          id: 'common.deleteFailed',
                          defaultMessage: 'Delete failed, please try again',
                        }),
                    );
                  }
                },
              });
            }}
          >
            {intl.formatMessage({
              id: 'common.delete',
              defaultMessage: 'Delete',
            })}
          </Button>
        </Space>
      ),
    },
  ];

  const tableNode = (
    <>
      <ProTable<FloorType>
        headerTitle={intl.formatMessage({
          id: 'floor.listTitle',
          defaultMessage: 'Floor List',
        })}
        actionRef={actionRef}
        rowKey="id"
        scroll={STANDARD_TABLE_SCROLL}
        search={STANDARD_TABLE_SEARCH}
        request={async (params) => {
          try {
            const res = await request('/api/floors', { params });
            return toTableDataSource<FloorType>(res);
          } catch (e) {
            return { data: [], success: false, total: 0 };
          }
        }}
        columns={columns}
        toolBarRender={() => [
          <Button
            key="new"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditing(null);
              form.resetFields();
              setModalVisible(true);
            }}
          >
            {intl.formatMessage({
              id: 'floor.new',
              defaultMessage: 'New Floor',
            })}
          </Button>,
        ]}
      />

      <Modal
        title={
          editing
            ? intl.formatMessage({
                id: 'floor.modal.edit',
                defaultMessage: 'Edit Floor',
              })
            : intl.formatMessage({
                id: 'floor.modal.new',
                defaultMessage: 'New Floor',
              })
        }
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditing(null);
          form.resetFields();
        }}
        onOk={async () => {
          try {
            const values = await form.validateFields();
            if (editing) {
              await request(`/api/floors/${editing.id}`, {
                method: 'PUT',
                data: values,
              });
              message.success(
                intl.formatMessage({
                  id: 'floor.updateSuccess',
                  defaultMessage: 'Updated successfully',
                }),
              );
            } else {
              await request('/api/floors', { method: 'POST', data: values });
              message.success(
                intl.formatMessage({
                  id: 'floor.createSuccess',
                  defaultMessage: 'Created successfully',
                }),
              );
            }
            setModalVisible(false);
            setEditing(null);
            form.resetFields();
            actionRef.current?.reload?.();
          } catch (err: any) {
            if (err?.errorFields) return;
            message.error(
              err?.message ||
                intl.formatMessage({
                  id: 'common.operationFailed',
                  defaultMessage: 'Operation failed',
                }),
            );
          }
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label={intl.formatMessage({
              id: 'floor.form.name',
              defaultMessage: 'Floor Name',
            })}
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'floor.form.nameRequired',
                  defaultMessage: 'Please enter floor name',
                }),
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label={intl.formatMessage({
              id: 'floor.form.description',
              defaultMessage: 'Description',
            })}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="totalSeats"
            label={intl.formatMessage({
              id: 'floor.form.totalSeats',
              defaultMessage: 'Total Seats',
            })}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );

  if (embedded) {
    return tableNode;
  }

  return (
    <PageContainer
      title={intl.formatMessage({
        id: 'floor.title',
        defaultMessage: 'Floor Management',
      })}
    >
      {tableNode}
    </PageContainer>
  );
};

export default FloorManagement;
