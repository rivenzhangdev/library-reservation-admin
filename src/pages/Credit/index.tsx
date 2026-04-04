import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import {
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
  type: number;
  points: number;
  date: string;
  reason: string;
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
        defaultMessage: '用户',
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
        defaultMessage: '类型',
      }),
      dataIndex: 'type',
      valueType: 'select',
      valueEnum: {
        [CreditType.Add]: {
          text: intl.formatMessage({
            id: 'credit.type.add',
            defaultMessage: '加分',
          }),
          status: 'Success',
        },
        [CreditType.Deduct]: {
          text: intl.formatMessage({
            id: 'credit.type.deduct',
            defaultMessage: '减分',
          }),
          status: 'Error',
        },
      },
      render: (_, record) => (
        <Tag color={record.type === CreditType.Add ? 'green' : 'red'}>
          {CreditTypeText[record.type] || '未知'}
        </Tag>
      ),
    },
    {
      title: intl.formatMessage({
        id: 'credit.column.points',
        defaultMessage: '积分变化',
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
          {record.type === CreditType.Add ? '+' : ''}
          {record.points}
        </span>
      ),
    },
    {
      title: intl.formatMessage({
        id: 'credit.column.date',
        defaultMessage: '时间',
      }),
      dataIndex: 'date',
      valueType: 'dateTime',
      width: 160,
      sorter: true,
    },
    {
      title: intl.formatMessage({
        id: 'credit.form.reason',
        defaultMessage: '原因',
      }),
      dataIndex: 'reason',
      ellipsis: true,
      width: 200,
    },
    {
      title: intl.formatMessage({
        id: 'common.action',
        defaultMessage: '操作',
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
              defaultMessage: '调整积分',
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
        defaultMessage: '信用管理',
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
            defaultMessage: '信用记录',
          })}
          key="records"
        >
          <ProTable<CreditRecordType>
            headerTitle={intl.formatMessage({
              id: 'credit.header.records',
              defaultMessage: '信用记录列表',
            })}
            actionRef={actionRef}
            rowKey="id"
            scroll={{ x: 900 }}
            search={{ labelWidth: 'auto', defaultCollapsed: false }}
            request={async (params) => {
              try {
                const res: any = await getCreditRecordList(params);
                const raw = res?.data;
                let list: any[] = [];
                if (Array.isArray(raw)) list = raw;
                else if (Array.isArray(raw?.list)) list = raw.list;
                else if (Array.isArray(raw?.records)) list = raw.records;
                else list = [];
                list = list.map((item: any) => ({
                  ...item,
                  id: item.id || item._id,
                }));
                const total =
                  raw?.total ?? (Array.isArray(list) ? list.length : 0);
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
            defaultMessage: '用户',
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
                const raw = res?.data;
                let list: any[] = [];
                if (Array.isArray(raw)) list = raw;
                else if (Array.isArray(raw?.list)) list = raw.list;
                else if (Array.isArray(raw?.users)) list = raw.users;
                else list = [];
                list = list.map((item: any) => ({
                  ...item,
                  id: item.id || item._id,
                }));
                const total =
                  raw?.total ?? (Array.isArray(list) ? list.length : 0);
                return { data: list, success: true, total };
              } catch (e) {
                return { data: [], success: false, total: 0 };
              }
            }}
            columns={[
              {
                title: intl.formatMessage({
                  id: 'credit.tab.users',
                  defaultMessage: '用户',
                }),
                dataIndex: 'name',
                render: (_: any, r: any) => (
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 12 }}
                  >
                    <img
                      src={r.avatar}
                      style={{ width: 36, height: 36, borderRadius: 18 }}
                      alt=""
                    />
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
                  defaultMessage: '学号',
                }),
                dataIndex: 'studentId',
              },
              {
                title: intl.formatMessage({
                  id: 'user.column.creditScore',
                  defaultMessage: '信用分',
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
                  defaultMessage: '操作',
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
                        defaultMessage: '调整信用分',
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
                                defaultMessage: '已移出黑名单',
                              }),
                            );
                            usersActionRef.current?.reload?.();
                          } catch (e: any) {
                            message.error(e?.message || '操作失败');
                          }
                        }}
                      >
                        {intl.formatMessage({
                          id: 'credit.blacklist.remove',
                          defaultMessage: '移出黑名单',
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
                                defaultMessage: '已加入黑名单',
                              }),
                            );
                            usersActionRef.current?.reload?.();
                          } catch (e: any) {
                            message.error(e?.message || '操作失败');
                          }
                        }}
                      >
                        {intl.formatMessage({
                          id: 'credit.blacklist.add',
                          defaultMessage: '加入黑名单',
                        })}
                      </a>
                    )}
                    <a
                      onClick={() => {
                        Modal.confirm({
                          title: '确认删除',
                          content: '确定要删除该记录吗？',
                          onOk: async () => {
                            try {
                              await deleteViolation(record.id);
                              message.success(
                                intl.formatMessage({
                                  id: 'common.deleted',
                                  defaultMessage: '已删除',
                                }),
                              );
                              usersActionRef.current?.reload?.();
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
                    </a>
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
            defaultMessage: '违规记录',
          })}
          key="violations"
        >
          <ProTable<any>
            actionRef={violationsActionRef}
            headerTitle={intl.formatMessage({
              id: 'credit.header.violations',
              defaultMessage: '违规记录',
            })}
            rowKey="id"
            search={{ labelWidth: 'auto', defaultCollapsed: false }}
            request={async (params) => {
              try {
                const res: any = await getViolationList(params);
                const raw = res?.data;
                let list: any[] = [];
                if (Array.isArray(raw)) list = raw;
                else if (Array.isArray(raw?.list)) list = raw.list;
                else if (Array.isArray(raw?.violations)) list = raw.violations;
                else list = [];
                list = list.map((item: any) => ({
                  ...item,
                  id: item.id || item._id,
                }));
                const total =
                  raw?.total ?? (Array.isArray(list) ? list.length : 0);
                return { data: list, success: true, total };
              } catch (e) {
                return { data: [], success: false, total: 0 };
              }
            }}
            columns={[
              {
                title: intl.formatMessage({
                  id: 'credit.tab.users',
                  defaultMessage: '用户',
                }),
                dataIndex: 'userName',
              },
              {
                title: intl.formatMessage({
                  id: 'user.form.studentId',
                  defaultMessage: '学号',
                }),
                dataIndex: 'studentId',
              },
              { title: '违规类型', dataIndex: 'type' },
              {
                title: intl.formatMessage({
                  id: 'floor.form.description',
                  defaultMessage: '描述',
                }),
                dataIndex: 'description',
                ellipsis: true,
              },
              {
                title: '扣除分数',
                dataIndex: 'points',
                render: (_: any, r: any) => (
                  <span style={{ color: '#f5222d' }}>{r.points}</span>
                ),
              },
              {
                title: intl.formatMessage({
                  id: 'booking.form.date',
                  defaultMessage: '日期',
                }),
                dataIndex: 'date',
              },
              {
                title: intl.formatMessage({
                  id: 'common.action',
                  defaultMessage: '操作',
                }),
                valueType: 'option',
                render: (_: any, record: any) => (
                  <Space>
                    <a
                      onClick={() => {
                        Modal.confirm({
                          title: '确认删除',
                          content: '确定要删除该违规记录吗？',
                          onOk: async () => {
                            try {
                              await deleteViolation(record.id);
                              message.success(
                                intl.formatMessage({
                                  id: 'common.deleted',
                                  defaultMessage: '已删除',
                                }),
                              );
                              violationsActionRef.current?.reload?.();
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
            defaultMessage: '黑名单',
          })}
          key="blacklist"
        >
          <ProTable<any>
            actionRef={blacklistActionRef}
            headerTitle={intl.formatMessage({
              id: 'credit.header.blacklist',
              defaultMessage: '黑名单用户',
            })}
            rowKey="id"
            search={{ labelWidth: 'auto', defaultCollapsed: false }}
            request={async (params) => {
              try {
                const q = { ...(params || {}), blacklisted: true };
                const res: any = await getUserList(q);
                const raw = res?.data;
                let list: any[] = [];
                if (Array.isArray(raw)) list = raw;
                else if (Array.isArray(raw?.list)) list = raw.list;
                else if (Array.isArray(raw?.users)) list = raw.users;
                else list = [];
                list = list.map((item: any) => ({
                  ...item,
                  id: item.id || item._id,
                }));
                const total =
                  raw?.total ?? (Array.isArray(list) ? list.length : 0);
                return { data: list, success: true, total };
              } catch (e) {
                return { data: [], success: false, total: 0 };
              }
            }}
            columns={[
              {
                title: intl.formatMessage({
                  id: 'user.column.info',
                  defaultMessage: '用户信息',
                }),
                dataIndex: 'name',
                render: (_: any, r: any) => (
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 12 }}
                  >
                    <img
                      src={r.avatar}
                      style={{ width: 36, height: 36, borderRadius: 18 }}
                      alt=""
                    />
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
                  defaultMessage: '学号',
                }),
                dataIndex: 'studentId',
              },
              {
                title: intl.formatMessage({
                  id: 'user.column.creditScore',
                  defaultMessage: '信用分',
                }),
                dataIndex: 'creditScore',
              },
              {
                title: intl.formatMessage({
                  id: 'credit.column.joinedAt',
                  defaultMessage: '加入时间',
                }),
                dataIndex: 'blacklistedAt',
              },
              {
                title: intl.formatMessage({
                  id: 'common.action',
                  defaultMessage: '操作',
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
                            defaultMessage: '已移出黑名单',
                          }),
                        );
                        blacklistActionRef.current?.reload?.();
                      } catch (e: any) {
                        message.error(e?.message || '操作失败');
                      }
                    }}
                  >
                    {intl.formatMessage({
                      id: 'credit.blacklist.remove',
                      defaultMessage: '移出黑名单',
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
            defaultMessage: '信用等级',
          })}
          key="grades"
        >
          <Card bordered={false}>
            <div>
              信用等级规则可在此展示或配置（如：&gt;=80 优秀，60-79 良好，&lt;60
              普通）。
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
                  defaultMessage: '调整 {name} 的积分',
                },
                { name: adjustTarget.userName },
              )
            : intl.formatMessage({
                id: 'credit.modal.adjust',
                defaultMessage: '调整积分',
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
                defaultMessage: '调整成功',
              }),
            );
            setModalVisible(false);
            setAdjustTarget(null);
            form.resetFields();
            actionRef.current?.reload?.();
          } catch (e: any) {
            if (e?.errorFields) return;
            message.error(
              e?.message ||
                intl.formatMessage({
                  id: 'credit.message.adjustFailed',
                  defaultMessage: '调整失败',
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
                defaultMessage: '用户 ID',
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
              defaultMessage: '类型',
            })}
          >
            <Radio.Group>
              <Radio value={CreditType.Add}>
                {intl.formatMessage({
                  id: 'credit.type.add',
                  defaultMessage: '加分',
                })}
              </Radio>
              <Radio value={CreditType.Deduct}>
                {intl.formatMessage({
                  id: 'credit.type.deduct',
                  defaultMessage: '减分',
                })}
              </Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item
            name="points"
            label={intl.formatMessage({
              id: 'credit.form.points',
              defaultMessage: '分数',
            })}
            rules={[{ required: true }]}
          >
            <InputNumber min={1} />
          </Form.Item>
          <Form.Item
            name="reason"
            label={intl.formatMessage({
              id: 'credit.form.reason',
              defaultMessage: '原因',
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
