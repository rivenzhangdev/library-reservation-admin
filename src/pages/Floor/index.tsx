import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { request, useIntl } from '@umijs/max';
import { Button, Form, Input, InputNumber, Modal, Space, message } from 'antd';
import React, { useRef, useState } from 'react';

interface FloorType {
  id: string;
  name: string;
  description?: string;
  totalSeats?: number;
}

const FloorManagement: React.FC = () => {
  const intl = useIntl();

  const actionRef = useRef<ActionType>();
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Partial<FloorType> | null>(null);
  const [form] = Form.useForm();

  const columns: ProColumns<FloorType>[] = [
    {
      title: intl.formatMessage({
        id: 'floor.form.name',
        defaultMessage: '楼层名称',
      }),
      dataIndex: 'name',
    },
    {
      title: intl.formatMessage({
        id: 'floor.form.description',
        defaultMessage: '描述',
      }),
      dataIndex: 'description',
    },
    {
      title: intl.formatMessage({
        id: 'floor.form.totalSeats',
        defaultMessage: '总座位数',
      }),
      dataIndex: 'totalSeats',
    },
    {
      title: intl.formatMessage({
        id: 'common.action',
        defaultMessage: '操作',
      }),
      valueType: 'option',
      width: 150,
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
            {intl.formatMessage({ id: 'common.edit', defaultMessage: '编辑' })}
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              Modal.confirm({
                title: '确认删除',
                content: '确定要删除该楼层吗？',
                onOk: async () => {
                  try {
                    await request(`/api/floors/${record.id}`, {
                      method: 'DELETE',
                    });
                    message.success('删除成功');
                    actionRef.current?.reload?.();
                  } catch (e: any) {
                    message.error(e?.message || '删除失败');
                  }
                },
              });
            }}
          >
            {intl.formatMessage({
              id: 'common.delete',
              defaultMessage: '删除',
            })}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer
      title={intl.formatMessage({
        id: 'floor.title',
        defaultMessage: '楼层管理',
      })}
    >
      <ProTable<FloorType>
        headerTitle="楼层列表"
        actionRef={actionRef}
        rowKey="id"
        request={async (params) => {
          try {
            const res = await request('/api/floors', { params });
            const raw = res?.data;
            let list: any[] = [];
            if (Array.isArray(raw)) list = raw;
            else if (Array.isArray(raw?.list)) list = raw.list;
            else list = [];
            return {
              data: list,
              success: true,
              total: raw?.total ?? list.length,
            };
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
              defaultMessage: '新建楼层',
            })}
          </Button>,
        ]}
      />

      <Modal
        title={editing ? '编辑楼层' : '新建楼层'}
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
              message.success('更新成功');
            } else {
              await request('/api/floors', { method: 'POST', data: values });
              message.success('创建成功');
            }
            setModalVisible(false);
            setEditing(null);
            form.resetFields();
            actionRef.current?.reload?.();
          } catch (err: any) {
            if (err?.errorFields) return;
            message.error(err?.message || '操作失败');
          }
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label={intl.formatMessage({
              id: 'floor.form.name',
              defaultMessage: '楼层名称',
            })}
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'floor.form.nameRequired',
                  defaultMessage: '请输入楼层名称',
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
              defaultMessage: '描述',
            })}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="totalSeats"
            label={intl.formatMessage({
              id: 'floor.form.totalSeats',
              defaultMessage: '总座位数',
            })}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default FloorManagement;
