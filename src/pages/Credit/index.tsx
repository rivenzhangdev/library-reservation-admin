import { UserOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import {
  Avatar,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Space,
  Tabs,
  Tag,
  message,
} from 'antd';
import React, { useRef, useState } from 'react';
import { CreditType, CreditTypeText } from '../../constants/status';
import {
  addCreditPoints,
  deductCreditPoints,
  getCreditRecordList,
} from '../../services/library/credit';
import { getUserList, updateUserStatus } from '../../services/library/user';
import {
  deleteViolation,
  getViolationList,
} from '../../services/library/violation';

/**
 * 信用记录数据类型
 */
interface CreditRecordType {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  type: number;
  points: number;
  date: string;
  reason: string;
  updatedByName?: string;
}

/**
 * 信用管理页面
 */
const CreditManagement: React.FC = () => {
  const intl = useIntl();

  const actionRef = useRef<ActionType>();
  const usersActionRef = useRef<ActionType>();
  const violationsActionRef = useRef<ActionType>();
  const blacklistActionRef = useRef<ActionType>();
  const [modalVisible, setModalVisible] = useState(false);
  const [adjustTarget, setAdjustTarget] =
    useState<Partial<CreditRecordType> | null>(null);
  const [form] = Form.useForm();

  const [activeTab, setActiveTab] = useState<string>('records');

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    switch (key) {
      case 'records':
        actionRef.current?.reload?.();
        break;
      case 'users':
        usersActionRef.current?.reload?.();
        break;
      case 'violations':
        violationsActionRef.current?.reload?.();
        break;
      case 'blacklist':
        blacklistActionRef.current?.reload?.();
        break;
      default:
        break;
    }
  };

  const columns: ProColumns<CreditRecordType>[] = [
    {
      title: intl.formatMessage({
        id: 'credit.tab.users',
        defaultMessage: 'Users',
      }),
      dataIndex: 'userName',
      render: (_: any, r: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* 如果有头像字段可以在此显示 */}
          <div style={{ fontWeight: 600 }}>{r.userName}</div>
        </div>
      ),
    },
    {
      title: intl.formatMessage({
        id: 'seat.form.type',
        defaultMessage: 'Type',
      }),
      dataIndex: 'type',
      valueType: 'select',
      valueEnum: {
        [CreditType.Add]: {
          text: intl.formatMessage({
            id: 'credit.type.add',
            defaultMessage: 'Add',
          }),
          status: 'Success',
        },
        [CreditType.Deduct]: {
          text: intl.formatMessage({
            id: 'credit.type.deduct',
            defaultMessage: 'Deduct',
          }),
          status: 'Error',
        },
      },
      render: (_, record) => (
        <Tag color={record.type === CreditType.Add ? 'green' : 'red'}>
          {CreditTypeText[record.type]
            ? intl.formatMessage({
                id: CreditTypeText[record.type],
                defaultMessage: 'Unknown',
              })
            : intl.formatMessage({
                id: 'common.unknown',
                defaultMessage: 'Unknown',
              })}
        </Tag>
      ),
    },
    {
      title: intl.formatMessage({
        id: 'credit.column.points',
        defaultMessage: 'Points Change',
      }),
      dataIndex: 'points',
      sorter: true,
      width: 100,
      render: (_, record) => (
        <span
          style={{
            color: record.type === CreditType.Add ? '#52c41a' : '#f5222d',
          }}
        >
          {record.type === CreditType.Add ? '+' : '-'}
          {record.points}
        </span>
      ),
    },
    {
      title: intl.formatMessage({
        id: 'credit.column.date',
        defaultMessage: 'Date',
      }),
      dataIndex: 'date',
      valueType: 'dateTime',
      width: 160,
      sorter: true,
    },
    {
      title: intl.formatMessage({
        id: 'credit.form.reason',
        defaultMessage: 'Reason',
      }),
      dataIndex: 'reason',
      ellipsis: true,
      width: 200,
      hideInSearch: true,
    },
    {
      title: intl.formatMessage({
        id: 'common.updatedBy',
        defaultMessage: 'Updated By',
      }),
      dataIndex: 'updatedByName',
      width: 140,
      hideInSearch: true,
    },
    {
      title: intl.formatMessage({
        id: 'common.action',
        defaultMessage: 'Actions',
      }),
      valueType: 'option',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            type="link"
            onClick={() => {
              setAdjustTarget(record);
              setModalVisible(true);
              form.setFieldsValue({
                type: CreditType.Add,
                points: 1,
                reason: '',
              });
            }}
          >
            {intl.formatMessage({
              id: 'credit.modal.adjust',
              defaultMessage: 'Adjust Credit',
            })}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer
      title={intl.formatMessage({
        id: 'menu.credit',
        defaultMessage: 'Credit Management',
      })}
    >
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        defaultActiveKey="records"
      >
        <Tabs.TabPane
          tab={intl.formatMessage({
            id: 'credit.tab.records',
            defaultMessage: 'Credit Records',
          })}
          key="records"
        >
          <ProTable<CreditRecordType>
            headerTitle={intl.formatMessage({
              id: 'credit.header.records',
              defaultMessage: 'Credit Records',
            })}
            actionRef={actionRef}
            rowKey="id"
            scroll={{ x: 900 }}
            search={{ labelWidth: 'auto', defaultCollapsed: false }}
            request={async (params) => {
              try {
                const res: any = await getCreditRecordList(params);
                const raw = res?.data || {};
                const responseList = Array.isArray(raw.list) ? raw.list : [];
                const list = responseList.map((item: any) => ({
                  ...item,
                  id: item.id || item._id,
                  userName: item.userName || '',
                  userAvatar: item.userAvatar || '',
                  updatedByName: item.updatedByName || '',
                }));
                const total = raw?.total ?? list.length;
                return { data: list, success: true, total };
              } catch (e) {
                return { data: [], success: false, total: 0 };
              }
            }}
            columns={columns}
            pagination={{ pageSize: 10 }}
          />
        </Tabs.TabPane>

        <Tabs.TabPane
          tab={intl.formatMessage({
            id: 'credit.tab.users',
            defaultMessage: 'Users',
          })}
          key="users"
        >
          <ProTable<any>
            actionRef={usersActionRef}
            rowKey="id"
            search={{ labelWidth: 'auto', defaultCollapsed: false }}
            request={async (params) => {
              try {
                const res: any = await getUserList(params);
                const raw = res?.data || {};
                const list = Array.isArray(raw.list) ? raw.list : [];
                const total = raw.total ?? list.length;
                return {
                  data: list.map((item: any) => ({
                    ...item,
                    id: item.id || item._id,
                  })),
                  success: true,
                  total,
                };
              } catch (e) {
                return { data: [], success: false, total: 0 };
              }
            }}
            columns={[
              {
                title: intl.formatMessage({
                  id: 'credit.tab.users',
                  defaultMessage: 'Users',
                }),
                dataIndex: 'name',
                render: (_: any, r: any) => (
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 12 }}
                  >
                    <Avatar
                      src={r.avatar}
                      icon={!r.avatar ? <UserOutlined /> : undefined}
                      size={36}
                      style={{
                        backgroundColor: r.avatar ? 'transparent' : '#1890ff',
                        color: '#fff',
                        flexShrink: 0,
                      }}
                    >
                      {!r.avatar && r.name ? r.name.charAt(0) : null}
                    </Avatar>
                    <div>
                      <div style={{ fontWeight: 600 }}>{r.name}</div>
                      <div style={{ color: '#999' }}>{r.username}</div>
                    </div>
                  </div>
                ),
              },
              {
                title: intl.formatMessage({
                  id: 'user.form.studentId',
                  defaultMessage: 'Student ID',
                }),
                dataIndex: 'studentId',
              },
              {
                title: intl.formatMessage({
                  id: 'user.column.creditScore',
                  defaultMessage: 'Credit Score',
                }),
                dataIndex: 'creditScore',
                render: (_: any, r: any) => (
                  <Tag
                    color={
                      r.creditScore >= 80
                        ? 'green'
                        : r.creditScore >= 60
                        ? 'orange'
                        : 'red'
                    }
                  >
                    {r.creditScore}
                  </Tag>
                ),
              },
              {
                title: intl.formatMessage({
                  id: 'common.action',
                  defaultMessage: 'Actions',
                }),
                valueType: 'option',
                render: (_: any, record: any) => (
                  <Space>
                    <a
                      onClick={async () => {
                        setAdjustTarget({
                          userId: record.id,
                          userName: record.name,
                        } as any);
                        setModalVisible(true);
                      }}
                    >
                      {intl.formatMessage({
                        id: 'credit.action.adjust',
                        defaultMessage: 'Adjust Credit',
                      })}
                    </a>
                    {record.blacklisted ? (
                      <a
                        onClick={async () => {
                          try {
                            await updateUserStatus(record.id, 0);
                            message.success(
                              intl.formatMessage({
                                id: 'credit.message.removed',
                                defaultMessage: 'Removed from blacklist',
                              }),
                            );
                            usersActionRef.current?.reload?.();
                          } catch (e: any) {
                            message.error(
                              e?.message ||
                                intl.formatMessage({
                                  id: 'common.operationFailed',
                                  defaultMessage: 'Operation failed',
                                }),
                            );
                          }
                        }}
                      >
                        {intl.formatMessage({
                          id: 'credit.blacklist.remove',
                          defaultMessage: 'Remove from blacklist',
                        })}
                      </a>
                    ) : (
                      <a
                        onClick={async () => {
                          try {
                            await updateUserStatus(record.id, 1);
                            message.success(
                              intl.formatMessage({
                                id: 'credit.message.added',
                                defaultMessage: 'Added to blacklist',
                              }),
                            );
                            usersActionRef.current?.reload?.();
                          } catch (e: any) {
                            message.error(
                              e?.message ||
                                intl.formatMessage({
                                  id: 'common.operationFailed',
                                  defaultMessage: 'Operation failed',
                                }),
                            );
                          }
                        }}
                      >
                        {intl.formatMessage({
                          id: 'credit.blacklist.add',
                          defaultMessage: 'Add to blacklist',
                        })}
                      </a>
                    )}
                    {/* 删除操作已移除：用户不可在此处被删除 */}
                  </Space>
                ),
              },
            ]}
            pagination={{ pageSize: 10 }}
          />
        </Tabs.TabPane>

        <Tabs.TabPane
          tab={intl.formatMessage({
            id: 'credit.tab.violations',
            defaultMessage: 'Violations',
          })}
          key="violations"
        >
          <ProTable<any>
            actionRef={violationsActionRef}
            headerTitle={intl.formatMessage({
              id: 'credit.header.violations',
              defaultMessage: 'Violations',
            })}
            rowKey="id"
            search={{ labelWidth: 'auto', defaultCollapsed: false }}
            request={async (params) => {
              try {
                const res: any = await getViolationList(params);
                const raw = res?.data || {};
                const list = Array.isArray(raw.list) ? raw.list : [];
                const total = raw.total ?? list.length;
                return {
                  data: list.map((item: any) => ({
                    ...item,
                    id: item.id || item._id,
                  })),
                  success: true,
                  total,
                };
              } catch (e) {
                return { data: [], success: false, total: 0 };
              }
            }}
            columns={[
              {
                title: intl.formatMessage({
                  id: 'credit.tab.users',
                  defaultMessage: 'Users',
                }),
                dataIndex: 'userName',
                render: (_: any, record: any) => (
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 12 }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        minWidth: 32,
                        minHeight: 32,
                        overflow: 'hidden',
                        borderRadius: 999,
                        background: '#f5f5f5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {record.userAvatar ? (
                        <img
                          src={record.userAvatar}
                          alt={record.userName || 'avatar'}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      ) : (
                        <Avatar
                          icon={<UserOutlined />}
                          size={24}
                          style={{ background: '#d9d9d9', color: '#fff' }}
                        />
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>
                        {record.userName || '-'}
                      </div>
                      {record.studentId ? (
                        <div style={{ color: '#999', fontSize: 12 }}>
                          {record.studentId}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ),
              },
              {
                title: intl.formatMessage({
                  id: 'credit.column.violationType',
                  defaultMessage: 'Violation Type',
                }),
                dataIndex: 'type',
              },
              {
                title: intl.formatMessage({
                  id: 'floor.form.description',
                  defaultMessage: 'Description',
                }),
                dataIndex: 'description',
                ellipsis: true,
              },

              {
                title: intl.formatMessage({
                  id: 'credit.column.deductPoints',
                  defaultMessage: 'Deducted Points',
                }),
                dataIndex: 'points',
                render: (_: any, r: any) => (
                  <span style={{ color: '#f5222d' }}>{r.points}</span>
                ),
              },
              {
                title: intl.formatMessage({
                  id: 'booking.form.date',
                  defaultMessage: 'Date',
                }),
                dataIndex: 'date',
                hideInSearch: true,
              },
              {
                title: intl.formatMessage({
                  id: 'common.updatedBy',
                  defaultMessage: 'Updated By',
                }),
                dataIndex: 'updatedByName',
                width: 140,
                hideInSearch: true,
              },
              {
                title: intl.formatMessage({
                  id: 'common.action',
                  defaultMessage: 'Actions',
                }),
                valueType: 'option',
                render: (_: any, record: any) => (
                  <Space>
                    <a
                      onClick={() => {
                        Modal.confirm({
                          title: intl.formatMessage({
                            id: 'common.confirm',
                            defaultMessage: 'Confirm',
                          }),
                          content: intl.formatMessage({
                            id: 'credit.confirmDeleteViolation',
                            defaultMessage:
                              'Are you sure you want to delete this violation?',
                          }),
                          onOk: async () => {
                            try {
                              await deleteViolation(record.id);
                              message.success(
                                intl.formatMessage({
                                  id: 'credit.deleted',
                                  defaultMessage: 'Deleted',
                                }),
                              );
                              violationsActionRef.current?.reload?.();
                            } catch (e: any) {
                              message.error(
                                e?.message ||
                                  intl.formatMessage({
                                    id: 'common.deleteFailed',
                                    defaultMessage:
                                      'Delete failed, please try again',
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
                    </a>
                  </Space>
                ),
              },
            ]}
          />
        </Tabs.TabPane>

        <Tabs.TabPane
          tab={intl.formatMessage({
            id: 'credit.tab.blacklist',
            defaultMessage: 'Blacklist',
          })}
          key="blacklist"
        >
          <ProTable<any>
            actionRef={blacklistActionRef}
            headerTitle={intl.formatMessage({
              id: 'credit.header.blacklist',
              defaultMessage: 'Blacklisted Users',
            })}
            rowKey="id"
            search={{ labelWidth: 'auto', defaultCollapsed: false }}
            request={async (params) => {
              try {
                const q = { ...(params || {}), blacklisted: 1 };
                const res: any = await getUserList(q);
                const raw = res?.data || {};
                let list = Array.isArray(raw.list) ? raw.list : [];
                list = list.map((item: any) => ({
                  ...item,
                  id: item.id || item._id,
                }));
                const total = raw.total ?? list.length;
                return { data: list, success: true, total };
              } catch (e) {
                return { data: [], success: false, total: 0 };
              }
            }}
            columns={[
              {
                title: intl.formatMessage({
                  id: 'user.column.info',
                  defaultMessage: 'User Info',
                }),
                dataIndex: 'name',
                render: (_: any, r: any) => (
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 12 }}
                  >
                    <Avatar
                      src={r.avatar}
                      icon={!r.avatar ? <UserOutlined /> : undefined}
                      size={36}
                      style={{
                        backgroundColor: r.avatar ? 'transparent' : '#1890ff',
                        color: '#fff',
                        flexShrink: 0,
                      }}
                    >
                      {!r.avatar && r.name ? r.name.charAt(0) : null}
                    </Avatar>
                    <div>
                      <div style={{ fontWeight: 600 }}>{r.name}</div>
                      <div style={{ color: '#999' }}>{r.studentId}</div>
                    </div>
                  </div>
                ),
              },
              {
                title: intl.formatMessage({
                  id: 'user.form.studentId',
                  defaultMessage: 'Student ID',
                }),
                dataIndex: 'studentId',
              },
              {
                title: intl.formatMessage({
                  id: 'user.column.creditScore',
                  defaultMessage: 'Credit Score',
                }),
                dataIndex: 'creditScore',
              },
              {
                title: intl.formatMessage({
                  id: 'credit.column.joinedAt',
                  defaultMessage: 'Joined At',
                }),
                dataIndex: 'blacklistedAt',
                hideInSearch: true,
              },
              {
                title: intl.formatMessage({
                  id: 'common.action',
                  defaultMessage: 'Actions',
                }),
                valueType: 'option',
                render: (_: any, record: any) => (
                  <a
                    onClick={async () => {
                      try {
                        await updateUserStatus(record.id, 0);
                        message.success(
                          intl.formatMessage({
                            id: 'credit.message.removed',
                            defaultMessage: 'Removed from blacklist',
                          }),
                        );
                        blacklistActionRef.current?.reload?.();
                      } catch (e: any) {
                        message.error(
                          e?.message ||
                            intl.formatMessage({
                              id: 'common.operationFailed',
                              defaultMessage: 'Operation failed',
                            }),
                        );
                      }
                    }}
                  >
                    {intl.formatMessage({
                      id: 'credit.blacklist.remove',
                      defaultMessage: 'Remove from blacklist',
                    })}
                  </a>
                ),
              },
            ]}
          />
        </Tabs.TabPane>

        <Tabs.TabPane
          tab={intl.formatMessage({
            id: 'credit.tab.grades',
            defaultMessage: 'Grades',
          })}
          key="grades"
        >
          <Card bordered={false}>
            <div>
              {intl.formatMessage({
                id: 'credit.grades.description',
                defaultMessage:
                  'Credit grading rules can be displayed or configured here (e.g. >=80 Excellent, 60-79 Good, <60 Normal).',
              })}
            </div>
          </Card>
        </Tabs.TabPane>
      </Tabs>
      <Modal
        title={
          adjustTarget
            ? intl.formatMessage(
                {
                  id: 'credit.modal.adjustFor',
                  defaultMessage: "Adjust {name}'s Credit",
                },
                { name: adjustTarget.userName },
              )
            : intl.formatMessage({
                id: 'credit.modal.adjust',
                defaultMessage: 'Adjust Credit',
              })
        }
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setAdjustTarget(null);
          form.resetFields();
        }}
        onOk={async () => {
          try {
            const values = await form.validateFields();
            if (values.type === CreditType.Add) {
              await addCreditPoints(
                adjustTarget?.userId || values.userId,
                values.points,
                values.reason,
              );
            } else {
              await deductCreditPoints(
                adjustTarget?.userId || values.userId,
                values.points,
                values.reason,
              );
            }
            message.success(
              intl.formatMessage({
                id: 'credit.message.adjustSuccess',
                defaultMessage: 'Adjusted',
              }),
            );
            setModalVisible(false);
            setAdjustTarget(null);
            form.resetFields();
            actionRef.current?.reload?.();
            usersActionRef.current?.reload?.();
            violationsActionRef.current?.reload?.();
            blacklistActionRef.current?.reload?.();
          } catch (e: any) {
            if (e?.errorFields) return;
            message.error(
              e?.message ||
                intl.formatMessage({
                  id: 'credit.message.adjustFailed',
                  defaultMessage: 'Adjust failed',
                }),
            );
          }
        }}
      >
        <Form
          form={form}
          initialValues={{ type: CreditType.Add, points: 1 }}
          layout="vertical"
        >
          {!adjustTarget && (
            <Form.Item
              name="userId"
              label={intl.formatMessage({
                id: 'credit.form.userId',
                defaultMessage: 'User ID',
              })}
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
          )}
          <Form.Item
            name="type"
            label={intl.formatMessage({
              id: 'seat.form.type',
              defaultMessage: 'Type',
            })}
          >
            <Radio.Group>
              <Radio value={CreditType.Add}>
                {intl.formatMessage({
                  id: 'credit.type.add',
                  defaultMessage: 'Add',
                })}
              </Radio>
              <Radio value={CreditType.Deduct}>
                {intl.formatMessage({
                  id: 'credit.type.deduct',
                  defaultMessage: 'Deduct',
                })}
              </Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item
            name="points"
            label={intl.formatMessage({
              id: 'credit.form.points',
              defaultMessage: 'Points',
            })}
            rules={[{ required: true }]}
          >
            <InputNumber min={1} />
          </Form.Item>
          <Form.Item
            name="reason"
            label={intl.formatMessage({
              id: 'credit.form.reason',
              defaultMessage: 'Reason',
            })}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default CreditManagement;
