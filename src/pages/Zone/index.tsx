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
        defaultMessage: '区域名称',
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
        id: 'common.action',
        defaultMessage: '操作',
      }),
      valueType: 'option',
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
            {intl.formatMessage({ id: 'common.edit', defaultMessage: '编辑' })}
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={async () => {
              await request(`/api/zones/${record.id}`, { method: 'DELETE' });
              message.success('删除成功');
              actionRef.current?.reload?.();
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
        id: 'zone.title',
        defaultMessage: '区域管理',
      })}
    >
      <ProTable<ZoneType>
        headerTitle="区域列表"
        actionRef={actionRef}
        rowKey="id"
        request={async (params) => {
          const res = await request('/api/zones', { params });
          return { data: res.data.list, success: true, total: res.data.total };
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
            {intl.formatMessage({ id: 'zone.new', defaultMessage: '新建区域' })}
          </Button>,
        ]}
      />

      <Modal
        title={editing ? '编辑区域' : '新建区域'}
        visible={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditing(null);
          form.resetFields();
        }}
        onOk={async () => {
          const values = await form.validateFields();
          if (editing) {
            await request(`/api/zones/${editing.id}`, {
              method: 'PUT',
              data: values,
            });
            message.success('更新成功');
          } else {
            await request('/api/zones', { method: 'POST', data: values });
            message.success('创建成功');
          }
          setModalVisible(false);
          setEditing(null);
          form.resetFields();
          actionRef.current?.reload?.();
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label={intl.formatMessage({
              id: 'zone.column.name',
              defaultMessage: '区域名称',
            })}
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'zone.form.nameRequired',
                  defaultMessage: '请输入区域名称',
                }),
              },
            ]}
          >
            {' '}
            <Input />{' '}
          </Form.Item>
          <Form.Item
            name="description"
            label={intl.formatMessage({
              id: 'floor.form.description',
              defaultMessage: '描述',
            })}
          >
            {' '}
            <Input />{' '}
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default ZoneManagement;
