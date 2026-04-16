import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { request, useIntl } from '@umijs/max';
import { Button, Form, Input, Modal, Space, message } from 'antd';
import React, { useRef, useState } from 'react';

interface ZoneType {
  id: string;
  name: string;
  description?: string;
  updatedByName?: string;
  updatedBy?: { name?: string; username?: string };
}

const ZoneManagement: React.FC = () => {
  const intl = useIntl();

  const actionRef = useRef<ActionType>();
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Partial<ZoneType> | null>(null);
  const [form] = Form.useForm();

  const columns: ProColumns<ZoneType>[] = [
    {
      title: intl.formatMessage({
        id: 'zone.column.name',
        defaultMessage: 'Zone Name',
      }),
      dataIndex: 'name',
    },
    {
      title: intl.formatMessage({
        id: 'floor.form.description',
        defaultMessage: 'Description',
      }),
      dataIndex: 'description',
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
      width: 150,
      render: (_: any, record: ZoneType) => (
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
                  id: 'zone.confirmDelete',
                  defaultMessage: 'Are you sure you want to delete this zone?',
                }),
                onOk: async () => {
                  try {
                    await request(`/api/zones/${record.id}`, {
                      method: 'DELETE',
                    });
                    message.success(
                      intl.formatMessage({
                        id: 'zone.deleted',
                        defaultMessage: 'Deleted successfully',
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

  return (
    <PageContainer
      title={intl.formatMessage({
        id: 'zone.title',
        defaultMessage: 'Zone Management',
      })}
    >
      <ProTable<ZoneType>
        headerTitle={intl.formatMessage({
          id: 'zone.listTitle',
          defaultMessage: 'Zone List',
        })}
        actionRef={actionRef}
        rowKey="id"
        request={async (params) => {
          try {
            const res = await request('/api/zones', { params });
            const raw = res?.data;
            let list: any[] = [];
            if (Array.isArray(raw)) list = raw;
            else if (Array.isArray(raw?.list)) list = raw.list;
            else if (Array.isArray(raw?.zones)) list = raw.zones;
            else list = [];
            list = list.map((item: any) => ({
              ...item,
              id: item.id || item._id,
            }));
            const total = raw?.total ?? list.length;
            return { data: list, success: true, total };
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
            {intl.formatMessage({ id: 'zone.new', defaultMessage: 'New Zone' })}
          </Button>,
        ]}
      />

      <Modal
        title={
          editing
            ? intl.formatMessage({
                id: 'zone.modal.edit',
                defaultMessage: 'Edit Zone',
              })
            : intl.formatMessage({ id: 'zone.new', defaultMessage: 'New Zone' })
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
              await request(`/api/zones/${editing.id}`, {
                method: 'PUT',
                data: values,
              });
              message.success(
                intl.formatMessage({
                  id: 'zone.updateSuccess',
                  defaultMessage: 'Updated successfully',
                }),
              );
            } else {
              await request('/api/zones', { method: 'POST', data: values });
              message.success(
                intl.formatMessage({
                  id: 'zone.createSuccess',
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
              id: 'zone.column.name',
              defaultMessage: 'Zone Name',
            })}
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'zone.form.nameRequired',
                  defaultMessage: 'Please enter zone name',
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
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default ZoneManagement;
