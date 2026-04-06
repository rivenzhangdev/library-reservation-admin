import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Button, Form, Input, Modal, Select, Space, Tag, message } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import {
  NotificationType as NotificationTypeEnum,
  NotificationTypeText,
} from '../../constants/status';
import { getFloors } from '../../services/library/floor';
import {
  deleteNotification,
  getNotificationDetail,
  getNotificationList,
  sendNotification,
  updateNotification,
} from '../../services/library/notification';

/**
 * 通知数据类型
 */
interface NotificationRecord {
  id: string;
  userId: string;
  userName: string;
  type: number;
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
  const [detailVisible, setDetailVisible] = useState<boolean>(false);
  const [detailData, setDetailData] = useState<any>(null);
  const [editVisible, setEditVisible] = useState<boolean>(false);
  const [editForm] = Form.useForm();
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
        defaultMessage: 'Confirm delete',
      }),
      content: intl.formatMessage({
        id: 'notification.confirmDeleteContent',
        defaultMessage: 'Are you sure you want to delete this notification?',
      }),
      onOk: async () => {
        try {
          await deleteNotification(id);
          message.success(
            intl.formatMessage({
              id: 'common.deleteSuccessRefresh',
              defaultMessage: 'Deleted successfully, refreshing',
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
  };

  const columns: ProColumns<NotificationRecord>[] = [
    {
      title: intl.formatMessage({
        id: 'credit.tab.users',
        defaultMessage: 'User',
      }),
      dataIndex: 'userName',
      width: 100,
    },
    {
      title: intl.formatMessage({
        id: 'seat.form.type',
        defaultMessage: 'Type',
      }),
      dataIndex: 'type',
      valueType: 'select',
      valueEnum: {
        [NotificationTypeEnum.System]: {
          text: intl.formatMessage({
            id: 'notification.type.system',
            defaultMessage: 'System',
          }),
          status: 'Default',
        },
        [NotificationTypeEnum.Booking]: {
          text: intl.formatMessage({
            id: 'notification.type.booking',
            defaultMessage: 'Booking',
          }),
          status: 'Processing',
        },
        [NotificationTypeEnum.Activity]: {
          text: intl.formatMessage({
            id: 'notification.type.activity',
            defaultMessage: 'Activity',
          }),
          status: 'Success',
        },
        [NotificationTypeEnum.Marketing]: {
          text: intl.formatMessage({
            id: 'notification.type.marketing',
            defaultMessage: 'Marketing',
          }),
          status: 'Warning',
        },
      },
      render: (_, record) => {
        return (
          <Tag>
            {NotificationTypeText[record.type]
              ? intl.formatMessage({
                  id: NotificationTypeText[record.type],
                  defaultMessage: 'Unknown',
                })
              : intl.formatMessage({
                  id: 'common.unknown',
                  defaultMessage: 'Unknown',
                })}
          </Tag>
        );
      },
    },
    {
      title: intl.formatMessage({
        id: 'seat.form.floor',
        defaultMessage: 'Floor',
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
        defaultMessage: 'Title',
      }),
      dataIndex: 'title',
      copyable: true,
      width: 160,
      ellipsis: true,
    },
    {
      title: intl.formatMessage({
        id: 'notification.form.content',
        defaultMessage: 'Content',
      }),
      dataIndex: 'content',
      ellipsis: true,
      width: 200,
      hideInSearch: true,
    },
    {
      title: intl.formatMessage({
        id: 'credit.column.date',
        defaultMessage: 'Time',
      }),
      dataIndex: 'time',
      valueType: 'dateTime',
      width: 160,
      sorter: true,
    },
    {
      title: intl.formatMessage({
        id: 'activity.column.timeRange',
        defaultMessage: 'Time range',
      }),
      dataIndex: 'timeRange',
      valueType: 'dateRange',
      hideInTable: true,
    },
    {
      title: intl.formatMessage({
        id: 'seat.form.status',
        defaultMessage: 'Status',
      }),
      dataIndex: 'isRead',
      valueType: 'select',
      valueEnum: {
        true: {
          text: intl.formatMessage({
            id: 'notification.status.read',
            defaultMessage: 'Read',
          }),
          status: 'Default',
        },
        false: {
          text: intl.formatMessage({
            id: 'notification.status.unread',
            defaultMessage: 'Unread',
          }),
          status: 'Processing',
        },
      },
      render: (_, record) => (
        <Tag color={record.isRead ? 'default' : 'processing'}>
          {intl.formatMessage({
            id: record.isRead
              ? 'notification.status.read'
              : 'notification.status.unread',
          })}
        </Tag>
      ),
    },
    {
      title: intl.formatMessage({
        id: 'common.action',
        defaultMessage: 'Action',
      }),
      valueType: 'option',
      width: 140,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            size="small"
            onClick={async () => {
              try {
                const res: any = await getNotificationDetail(record.id);
                const raw = res?.data ?? res;
                setDetailData(raw);
                // prefill edit form
                editForm.setFieldsValue({
                  userId: raw.userId || '',
                  type: raw.type,
                  title: raw.title,
                  content: raw.content,
                });
                setEditVisible(true);
              } catch (e: any) {
                message.error(
                  e?.message ||
                    intl.formatMessage({
                      id: 'notification.detailFailed',
                      defaultMessage: 'Failed to fetch details',
                    }),
                );
              }
            }}
          >
            {intl.formatMessage({
              id: 'dashboard.view',
              defaultMessage: 'View',
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
        id: 'menu.notification',
        defaultMessage: 'Notification management',
      })}
    >
      <ProTable<NotificationRecord>
        headerTitle={intl.formatMessage({
          id: 'notification.listTitle',
          defaultMessage: 'Notification list',
        })}
        actionRef={actionRef}
        rowKey="id"
        scroll={{ x: 1000 }}
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
            list = list.map((item: any) => ({
              ...item,
              id: item.id || item._id,
              userName:
                item.userName ||
                item.user?.name ||
                item.user?.username ||
                item.userId ||
                '-',
            }));
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
              defaultMessage: 'Send notification',
            })}
          </Button>,
        ]}
        pagination={{
          pageSize: 10,
        }}
      />
      <Modal
        title={intl.formatMessage({
          id: 'dashboard.view',
          defaultMessage: 'View',
        })}
        open={detailVisible}
        onCancel={() => {
          setDetailVisible(false);
          setDetailData(null);
        }}
        footer={null}
      >
        {detailData ? (
          <div>
            <p>
              <strong>
                {intl.formatMessage({
                  id: 'notification.detail.user',
                  defaultMessage: 'User',
                })}
                ：
              </strong>
              {detailData.userName ||
                detailData.user?.name ||
                detailData.user?.username ||
                '-'}
            </p>
            <p>
              <strong>
                {intl.formatMessage({
                  id: 'notification.detail.title',
                  defaultMessage: 'Title',
                })}
                ：
              </strong>
              {detailData.title}
            </p>
            <p>
              <strong>
                {intl.formatMessage({
                  id: 'notification.detail.content',
                  defaultMessage: 'Content',
                })}
                ：
              </strong>
              {detailData.content}
            </p>
            <p>
              <strong>
                {intl.formatMessage({
                  id: 'notification.detail.time',
                  defaultMessage: 'Time',
                })}
                ：
              </strong>
              {detailData.time || detailData.createdAt || '-'}
            </p>
          </div>
        ) : (
          <div>
            {intl.formatMessage({
              id: 'common.loading',
              defaultMessage: 'Loading',
            })}
          </div>
        )}
      </Modal>
      <Modal
        title={intl.formatMessage({
          id: 'notification.edit',
          defaultMessage: 'Edit notification',
        })}
        open={editVisible}
        onCancel={() => {
          setEditVisible(false);
          setDetailData(null);
          editForm.resetFields();
        }}
        onOk={async () => {
          try {
            const values = await editForm.validateFields();
            const id = detailData?.id || detailData?._id;
            if (!id) throw new Error('missing id');
            await updateNotification(id, values);
            message.success(
              intl.formatMessage({
                id: 'notification.updateSuccess',
                defaultMessage: 'Updated successfully',
              }),
            );
            setEditVisible(false);
            editForm.resetFields();
            actionRef.current?.reload?.();
          } catch (e: any) {
            if (e?.errorFields) return;
            message.error(
              e?.message ||
                intl.formatMessage({
                  id: 'notification.updateFailed',
                  defaultMessage: 'Update failed',
                }),
            );
          }
        }}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item
            name="userId"
            label={intl.formatMessage({
              id: 'credit.form.userId',
              defaultMessage: 'User ID',
            })}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="type"
            label={intl.formatMessage({
              id: 'seat.form.type',
              defaultMessage: 'Type',
            })}
          >
            <Select>
              <Select.Option value={NotificationTypeEnum.System}>
                {intl.formatMessage({
                  id: 'notification.type.system',
                  defaultMessage: 'System',
                })}
              </Select.Option>
              <Select.Option value={NotificationTypeEnum.Booking}>
                {intl.formatMessage({
                  id: 'notification.type.booking',
                  defaultMessage: 'Booking',
                })}
              </Select.Option>
              <Select.Option value={NotificationTypeEnum.Activity}>
                {intl.formatMessage({
                  id: 'notification.type.activity',
                  defaultMessage: 'Activity',
                })}
              </Select.Option>
              <Select.Option value={NotificationTypeEnum.Marketing}>
                {intl.formatMessage({
                  id: 'notification.type.marketing',
                  defaultMessage: 'Marketing',
                })}
              </Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="title"
            label={intl.formatMessage({
              id: 'activity.form.title',
              defaultMessage: 'Title',
            })}
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="content"
            label={intl.formatMessage({
              id: 'notification.form.content',
              defaultMessage: 'Content',
            })}
            rules={[{ required: true }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title={intl.formatMessage({
          id: 'notification.send',
          defaultMessage: 'Send notification',
        })}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={async () => {
          try {
            const values = await form.validateFields();
            await sendNotification(values);
            message.success(
              intl.formatMessage({
                id: 'notification.sendSuccess',
                defaultMessage: 'Sent successfully',
              }),
            );
            setModalVisible(false);
            form.resetFields();
            actionRef.current?.reload?.();
          } catch (e: any) {
            if (e?.errorFields) return;
            message.error(
              e?.message ||
                intl.formatMessage({
                  id: 'notification.sendFailed',
                  defaultMessage: 'Send failed',
                }),
            );
          }
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="userId"
            label={intl.formatMessage({
              id: 'credit.form.userId',
              defaultMessage: 'User ID',
            })}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="type"
            label={intl.formatMessage({
              id: 'seat.form.type',
              defaultMessage: 'Type',
            })}
            initialValue={NotificationTypeEnum.System}
          >
            <Select>
              <Select.Option value={NotificationTypeEnum.System}>
                {intl.formatMessage({
                  id: 'notification.type.system',
                  defaultMessage: 'System',
                })}
              </Select.Option>
              <Select.Option value={NotificationTypeEnum.Booking}>
                {intl.formatMessage({
                  id: 'notification.type.booking',
                  defaultMessage: 'Booking',
                })}
              </Select.Option>
              <Select.Option value={NotificationTypeEnum.Activity}>
                {intl.formatMessage({
                  id: 'notification.type.activity',
                  defaultMessage: 'Activity',
                })}
              </Select.Option>
              <Select.Option value={NotificationTypeEnum.Marketing}>
                {intl.formatMessage({
                  id: 'notification.type.marketing',
                  defaultMessage: 'Marketing',
                })}
              </Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="title"
            label={intl.formatMessage({
              id: 'activity.form.title',
              defaultMessage: 'Title',
            })}
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="content"
            label={intl.formatMessage({
              id: 'notification.form.content',
              defaultMessage: 'Content',
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
