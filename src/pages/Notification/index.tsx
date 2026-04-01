import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Button, Form, Input, Modal, Select, Space, Tag, message } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { getFloors } from '../../services/library/floor';
import {
  deleteNotification,
  getNotificationList,
  sendNotification,
} from '../../services/library/notification';

/**
 * 通知数据类型
 */
interface NotificationType {
  id: string;
  userId: string;
  userName: string;
  type: string;
  title: string;
  content: string;
  time: string;
  isRead: boolean;
  floorId?: string;
  floorName?: string;
}

/**
 * 通知管理页面
 */
const NotificationManagement: React.FC = () => {
  const intl = useIntl();

  const actionRef = useRef<ActionType>();
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [floors, setFloors] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    (async () => {
      try {
        const res: any = await getFloors();
        const raw = res?.data;
        let list: any[] = [];
        if (Array.isArray(raw)) list = raw;
        else if (Array.isArray(raw?.floors)) list = raw.floors;
        else list = [];
        setFloors(list.map((f) => ({ id: f.id, name: f.name })));
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  /**
   * 删除通知
   */
  const handleDelete = (id: string) => {
    Modal.confirm({
      title: intl.formatMessage({
        id: 'user.confirmDeleteTitle',
        defaultMessage: '确认删除',
      }),
      content: '确定要删除该通知吗？',
      onOk: async () => {
        try {
          await deleteNotification(id);
          message.success('删除成功');
          actionRef.current?.reload?.();
        } catch (e) {
          message.error('删除失败');
        }
      },
    });
  };

  const columns: ProColumns<NotificationType>[] = [
    {
      title: intl.formatMessage({
        id: 'credit.tab.users',
        defaultMessage: '用户',
      }),
      dataIndex: 'userName',
    },
    {
      title: intl.formatMessage({
        id: 'credit.tab.users',
        defaultMessage: '用户',
      }),
      dataIndex: 'userName',
    },
    {
      title: intl.formatMessage({
        id: 'seat.form.type',
        defaultMessage: '类型',
      }),
      dataIndex: 'type',
      valueType: 'select',
      valueEnum: {
        system: {
          text: intl.formatMessage({
            id: 'notification.type.system',
            defaultMessage: '系统通知',
          }),
          status: 'Default',
        },
        booking: {
          text: intl.formatMessage({
            id: 'notification.type.booking',
            defaultMessage: '预约通知',
          }),
          status: 'Processing',
        },
        activity: {
          text: intl.formatMessage({
            id: 'notification.type.activity',
            defaultMessage: '活动通知',
          }),
          status: 'Success',
        },
        marketing: {
          text: intl.formatMessage({
            id: 'notification.type.marketing',
            defaultMessage: '营销通知',
          }),
          status: 'Warning',
        },
      },
      render: (_, record) => {
        const textMap: Record<string, string> = {
          system: '系统通知',
          booking: '预约通知',
          activity: '活动通知',
          marketing: '营销通知',
        };
        return <Tag>{textMap[record.type]}</Tag>;
      },
    },
    {
      title: intl.formatMessage({
        id: 'seat.form.floor',
        defaultMessage: '楼层',
      }),
      dataIndex: 'floorId',
      valueType: 'select',
      hideInTable: true,
      valueEnum: (() => {
        const map: Record<string, any> = {};
        floors.forEach((f) => {
          map[f.id] = { text: f.name };
        });
        return map;
      })(),
      render: (_, record) => record.floorName || '',
    },
    {
      title: intl.formatMessage({
        id: 'activity.form.title',
        defaultMessage: '标题',
      }),
      dataIndex: 'title',
      copyable: true,
    },
    {
      title: intl.formatMessage({
        id: 'notification.form.content',
        defaultMessage: '内容',
      }),
      dataIndex: 'content',
      ellipsis: true,
      hideInSearch: true,
    },
    {
      title: intl.formatMessage({
        id: 'credit.column.date',
        defaultMessage: '时间',
      }),
      dataIndex: 'time',
      valueType: 'dateTime',
      sorter: true,
    },
    {
      title: intl.formatMessage({
        id: 'activity.column.timeRange',
        defaultMessage: '时间范围',
      }),
      dataIndex: 'timeRange',
      valueType: 'dateRange',
      hideInTable: true,
    },
    {
      title: intl.formatMessage({
        id: 'seat.form.status',
        defaultMessage: '状态',
      }),
      dataIndex: 'isRead',
      valueType: 'select',
      valueEnum: {
        true: {
          text: intl.formatMessage({
            id: 'notification.status.read',
            defaultMessage: '已读',
          }),
          status: 'Default',
        },
        false: {
          text: intl.formatMessage({
            id: 'notification.status.unread',
            defaultMessage: '未读',
          }),
          status: 'Processing',
        },
      },
      render: (_, record) => (
        <Tag color={record.isRead ? 'default' : 'processing'}>
          {record.isRead ? '已读' : '未读'}
        </Tag>
      ),
    },
    {
      title: intl.formatMessage({
        id: 'common.action',
        defaultMessage: '操作',
      }),
      valueType: 'option',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" icon={<EditOutlined />} size="small">
            {intl.formatMessage({
              id: 'dashboard.view',
              defaultMessage: '查看',
            })}
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => handleDelete(record.id)}
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
        id: 'menu.notification',
        defaultMessage: '通知管理',
      })}
    >
      <ProTable<NotificationType>
        headerTitle="通知列表"
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 'auto',
          defaultCollapsed: false,
        }}
        request={async (params) => {
          try {
            const res: any = await getNotificationList(params);
            const raw = res?.data;
            let list: any[] = [];
            if (Array.isArray(raw)) list = raw;
            else if (Array.isArray(raw?.list)) list = raw.list;
            else if (Array.isArray(raw?.notifications))
              list = raw.notifications;
            else list = [];
            const total = raw?.total ?? (Array.isArray(list) ? list.length : 0);
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
            onClick={() => setModalVisible(true)}
          >
            {intl.formatMessage({
              id: 'notification.send',
              defaultMessage: '发送通知',
            })}
          </Button>,
        ]}
        pagination={{
          pageSize: 10,
        }}
      />
      <Modal
        title={intl.formatMessage({
          id: 'notification.send',
          defaultMessage: '发送通知',
        })}
        visible={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={async () => {
          try {
            const values = await form.validateFields();
            await sendNotification(values);
            message.success('发送成功');
            setModalVisible(false);
            form.resetFields();
            actionRef.current?.reload?.();
          } catch (e) {
            message.error('发送失败');
          }
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="userId"
            label={intl.formatMessage({
              id: 'credit.form.userId',
              defaultMessage: '用户 ID',
            })}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="type"
            label={intl.formatMessage({
              id: 'seat.form.type',
              defaultMessage: '类型',
            })}
            initialValue="system"
          >
            <Select>
              <Select.Option value="system">
                {intl.formatMessage({
                  id: 'notification.type.system',
                  defaultMessage: '系统通知',
                })}
              </Select.Option>
              <Select.Option value="booking">
                {intl.formatMessage({
                  id: 'notification.type.booking',
                  defaultMessage: '预约通知',
                })}
              </Select.Option>
              <Select.Option value="activity">
                {intl.formatMessage({
                  id: 'notification.type.activity',
                  defaultMessage: '活动通知',
                })}
              </Select.Option>
              <Select.Option value="marketing">
                {intl.formatMessage({
                  id: 'notification.type.marketing',
                  defaultMessage: '营销通知',
                })}
              </Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="title"
            label={intl.formatMessage({
              id: 'activity.form.title',
              defaultMessage: '标题',
            })}
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="content"
            label={intl.formatMessage({
              id: 'notification.form.content',
              defaultMessage: '内容',
            })}
            rules={[{ required: true }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default NotificationManagement;
