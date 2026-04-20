import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import {
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Tag,
  message,
} from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import {
  NotificationType as NotificationTypeEnum,
  NotificationTypeText,
} from '../../constants/status';
import { getFloors } from '../../services/library/floor';
import {
  batchMarkAsRead,
  deleteNotification,
  getNotificationDetail,
  getNotificationList,
  sendNotification,
  updateNotification,
} from '../../services/library/notification';
import { getUserList } from '../../services/library/user';
import {
  STANDARD_ACTION_COLUMN,
  STANDARD_TABLE_SCROLL,
  STANDARD_TABLE_SEARCH,
} from '../../utils/table';

/**
 * 通知数据类型
 */
interface NotificationRecord {
  id: string;
  userId: string;
  userName: string;
  publisherName?: string;
  type: number;
  title: string;
  content: string;
  time: string;
  isRead: boolean;
  floorId?: string;
  floorName?: string;
  targetType?: string;
  targetRole?: number;
  audience?: string;
  updatedByName?: string;
  updatedBy?: { name?: string; username?: string };
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
  const [userOptions, setUserOptions] = useState<
    Array<{ label: string; value: string }>
  >([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const fetchUserOptions = async (keyword: string) => {
    try {
      const res: any = await getUserList({ q: keyword, page: 1, limit: 10 });
      const list = Array.isArray(res?.data?.list) ? res.data.list : [];
      setUserOptions(
        list.map((user: any) => ({
          label: `${user.name || user.username}${
            user.studentId ? ` (${user.studentId})` : ''
          }`,
          value: user.id,
        })),
      );
    } catch (e) {
      setUserOptions([]);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const list: any[] = await getFloors();
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

  const handleBatchMarkAsRead = async () => {
    if (!selectedRowKeys.length) return;
    try {
      await batchMarkAsRead(selectedRowKeys as string[]);
      message.success(
        intl.formatMessage({
          id: 'notification.batchMarkReadSuccess',
          defaultMessage: 'Selected notifications marked as read',
        }),
      );
      setSelectedRowKeys([]);
      actionRef.current?.reload?.();
    } catch (e: any) {
      message.error(
        e?.message ||
          intl.formatMessage({
            id: 'notification.batchMarkReadFailed',
            defaultMessage: 'Batch mark as read failed',
          }),
      );
    }
  };

  const handleBatchDelete = async () => {
    if (!selectedRowKeys.length) return;
    Modal.confirm({
      title: intl.formatMessage({
        id: 'notification.confirmDeleteTitle',
        defaultMessage: 'Confirm delete selected notifications',
      }),
      content: intl.formatMessage({
        id: 'notification.confirmDeleteSelectedContent',
        defaultMessage:
          'Are you sure you want to delete selected notifications?',
      }),
      onOk: async () => {
        try {
          await Promise.all(
            selectedRowKeys.map((id) => deleteNotification(String(id))),
          );
          message.success(
            intl.formatMessage({
              id: 'notification.batchDeleteSuccess',
              defaultMessage: 'Selected notifications deleted',
            }),
          );
          setSelectedRowKeys([]);
          actionRef.current?.reload?.();
        } catch (e: any) {
          message.error(
            e?.message ||
              intl.formatMessage({
                id: 'notification.batchDeleteFailed',
                defaultMessage: 'Batch delete failed',
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
        id: 'notification.form.audience',
        defaultMessage: 'Audience',
      }),
      dataIndex: 'audience',
      width: 180,
      hideInSearch: true,
      render: (_, record) =>
        record.audience ||
        intl.formatMessage({
          id: 'notification.audience.all',
          defaultMessage: 'All Users',
        }),
    },
    {
      title: intl.formatMessage({
        id: 'seat.form.type',
        defaultMessage: 'Type',
      }),
      dataIndex: 'type',
      width: 120,
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
      width: 120,
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
        id: 'common.createdBy',
        defaultMessage: 'Created By',
      }),
      dataIndex: 'publisherName',
      width: 140,
      hideInSearch: true,
      render: (_, record) => record.publisherName || '-',
    },
    {
      title: intl.formatMessage({
        id: 'common.updatedBy',
        defaultMessage: 'Updated By',
      }),
      dataIndex: 'updatedByName',
      width: 120,
      hideInSearch: true,
      render: (_, record) => record.updatedByName || '-',
    },
    {
      title: intl.formatMessage({
        id: 'common.action',
        defaultMessage: 'Action',
      }),
      valueType: 'option',
      ...STANDARD_ACTION_COLUMN,
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
        scroll={STANDARD_TABLE_SCROLL}
        search={STANDARD_TABLE_SEARCH}
        request={async (params) => {
          try {
            const res: any = await getNotificationList(params);
            const list = (
              Array.isArray(res?.data?.list) ? res.data.list : []
            ).map((item: any) => ({
              ...item,
              userName:
                item.userName || item.user?.name || item.user?.username || '-',
              audience:
                item.targetType === 'all'
                  ? intl.formatMessage({
                      id: 'notification.audience.all',
                      defaultMessage: 'All Users',
                    })
                  : item.targetType === 'role'
                  ? intl.formatMessage(
                      {
                        id: 'notification.audience.role',
                        defaultMessage: 'Role: {role}',
                      },
                      {
                        role:
                          item.targetRole === 1
                            ? intl.formatMessage({
                                id: 'notification.role.admin',
                                defaultMessage: 'Admin',
                              })
                            : intl.formatMessage({
                                id: 'notification.role.user',
                                defaultMessage: 'User',
                              }),
                      },
                    )
                  : item.targetType === 'floor'
                  ? `${intl.formatMessage({
                      id: 'notification.audience.floor',
                      defaultMessage: 'Floor',
                    })}: ${item.floorName || item.floorId}`
                  : item.targetType === 'user'
                  ? intl.formatMessage(
                      {
                        id: 'notification.audience.user',
                        defaultMessage: 'User: {user}',
                      },
                      {
                        user:
                          item.userName ||
                          item.user?.name ||
                          item.user?.username ||
                          '-',
                      },
                    )
                  : item.userName || '-',
            }));
            return {
              data: list,
              success: res?.success !== false,
              total: Number(res?.data?.total || 0),
            };
          } catch (e) {
            return { data: [], success: false, total: 0 };
          }
        }}
        columns={columns}
        toolBarRender={() => [
          selectedRowKeys.length ? (
            <Space key="batch-actions">
              <Button type="default" onClick={handleBatchMarkAsRead}>
                {intl.formatMessage({
                  id: 'notification.batchMarkRead',
                  defaultMessage: 'Mark selected as read',
                })}
              </Button>
              <Button danger type="default" onClick={handleBatchDelete}>
                {intl.formatMessage({
                  id: 'notification.batchDelete',
                  defaultMessage: 'Delete selected',
                })}
              </Button>
            </Space>
          ) : null,
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
        rowSelection={{
          selectedRowKeys,
          onChange: (selectedKeys) => {
            setSelectedRowKeys(selectedKeys);
          },
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
                detailData.user?.username ||
                detailData.user?.name ||
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
                  id: 'notification.detail.publisher',
                  defaultMessage: 'Publisher',
                })}
                ：
              </strong>
              {detailData.publisherName || '-'}
            </p>
            <p>
              <strong>
                {intl.formatMessage({
                  id: 'notification.detail.updatedBy',
                  defaultMessage: 'Updated By',
                })}
                ：
              </strong>
              {detailData.updatedByName || '-'}
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
            const id = detailData?.id;
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
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'notification.form.userIdRequired',
                  defaultMessage: 'Please enter a user ID',
                }),
              },
            ]}
          >
            <Input
              placeholder={intl.formatMessage({
                id: 'notification.form.userIdPlaceholder',
                defaultMessage: 'Enter target user ID',
              })}
            />
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
            const payload = { ...values } as any;
            if (payload.time?.toISOString) {
              payload.time = payload.time.toISOString();
            }
            if (
              payload.templateData &&
              typeof payload.templateData === 'string'
            ) {
              try {
                payload.templateData = JSON.parse(payload.templateData);
              } catch (parseError) {
                message.error(
                  intl.formatMessage({
                    id: 'notification.templateDataInvalid',
                    defaultMessage: 'Template Data must be valid JSON',
                  }),
                );
                return;
              }
            }
            await sendNotification(payload);
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
            name="targetType"
            label={intl.formatMessage({
              id: 'notification.form.audience',
              defaultMessage: 'Audience',
            })}
            initialValue="user"
            rules={[{ required: true }]}
          >
            <Select>
              <Select.Option value="user">
                {intl.formatMessage({
                  id: 'notification.audience.user',
                  defaultMessage: 'Specific user',
                })}
              </Select.Option>
              <Select.Option value="all">
                {intl.formatMessage({
                  id: 'notification.audience.all',
                  defaultMessage: 'All users',
                })}
              </Select.Option>
              <Select.Option value="role">
                {intl.formatMessage({
                  id: 'notification.audience.roleTarget',
                  defaultMessage: 'By role',
                })}
              </Select.Option>
              <Select.Option value="floor">
                {intl.formatMessage({
                  id: 'notification.audience.floorTarget',
                  defaultMessage: 'By floor',
                })}
              </Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(prev, current) =>
              prev.targetType !== current.targetType
            }
          >
            {({ getFieldValue }) => {
              const targetType = getFieldValue('targetType');
              if (targetType === 'user') {
                return (
                  <Form.Item
                    name="userId"
                    label={intl.formatMessage({
                      id: 'credit.form.userId',
                      defaultMessage: 'User ID',
                    })}
                    rules={[
                      {
                        required: true,
                        message: intl.formatMessage({
                          id: 'notification.form.userIdRequired',
                          defaultMessage: 'Please enter a user ID',
                        }),
                      },
                    ]}
                  >
                    <Select
                      showSearch
                      filterOption={false}
                      placeholder={intl.formatMessage({
                        id: 'notification.form.userIdPlaceholder',
                        defaultMessage: 'Search and select user',
                      })}
                      options={userOptions}
                      onSearch={fetchUserOptions}
                      notFoundContent={null}
                    />
                  </Form.Item>
                );
              }
              if (targetType === 'role') {
                return (
                  <Form.Item
                    name="role"
                    label={intl.formatMessage({
                      id: 'notification.form.role',
                      defaultMessage: 'Role',
                    })}
                    rules={[{ required: true }]}
                  >
                    <Select>
                      <Select.Option value={0}>
                        {intl.formatMessage({
                          id: 'notification.role.user',
                          defaultMessage: 'User',
                        })}
                      </Select.Option>
                      <Select.Option value={1}>
                        {intl.formatMessage({
                          id: 'notification.role.admin',
                          defaultMessage: 'Admin',
                        })}
                      </Select.Option>
                    </Select>
                  </Form.Item>
                );
              }
              if (targetType === 'floor') {
                return (
                  <Form.Item
                    name="floorId"
                    label={intl.formatMessage({
                      id: 'seat.form.floor',
                      defaultMessage: 'Floor',
                    })}
                    rules={[{ required: true }]}
                  >
                    <Select>
                      {floors.map((floor) => (
                        <Select.Option key={floor.id} value={floor.id}>
                          {floor.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                );
              }
              return null;
            }}
          </Form.Item>
          <Form.Item
            name="templateType"
            label={intl.formatMessage({
              id: 'notification.form.templateType',
              defaultMessage: 'Template Type',
            })}
          >
            <Select allowClear>
              <Select.Option value="BOOKING_SUCCESS">
                {intl.formatMessage({
                  id: 'notification.template.bookingSuccess',
                  defaultMessage: 'Booking success',
                })}
              </Select.Option>
              <Select.Option value="BOOKING_REMINDER">
                {intl.formatMessage({
                  id: 'notification.template.bookingReminder',
                  defaultMessage: 'Booking reminder',
                })}
              </Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="templateData"
            label={intl.formatMessage({
              id: 'notification.form.templateData',
              defaultMessage: 'Template Data',
            })}
          >
            <Input.TextArea
              rows={4}
              placeholder={intl.formatMessage({
                id: 'notification.form.templateDataPlaceholder',
                defaultMessage:
                  '{"title":"...","bookingTime":"...","seatInfo":"..."}',
              })}
            />
          </Form.Item>
          <Form.Item
            name="time"
            label={intl.formatMessage({
              id: 'notification.form.time',
              defaultMessage: 'Send time',
            })}
          >
            <DatePicker showTime style={{ width: '100%' }} />
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
