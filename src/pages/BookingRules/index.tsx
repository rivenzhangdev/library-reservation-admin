import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import {
  Alert,
  Button,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Space,
  Switch,
  Tag,
} from 'antd';
import React, { useMemo, useRef, useState } from 'react';
import {
  deleteBookingRule,
  getBookingRules,
  initDefaultBookingRulesWithMode,
  updateBookingRule,
  type BookingRuleItem,
} from '@/services/library/bookingRules';
import {
  STANDARD_TABLE_SCROLL,
  STANDARD_TABLE_SEARCH,
  toTableDataSource,
} from '@/utils/table';

const BookingRulesPage: React.FC = () => {
  const intl = useIntl();
  const actionRef = useRef<ActionType>();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<BookingRuleItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [deletingRuleKey, setDeletingRuleKey] = useState<string>('');
  const [switchingRuleKey, setSwitchingRuleKey] = useState<string>('');
  const [form] = Form.useForm();

  const categoryValueEnum = useMemo(
    () => ({
      booking: {
        text: intl.formatMessage({ id: 'bookingRules.category.booking' }),
      },
      renewal: {
        text: intl.formatMessage({ id: 'bookingRules.category.renewal' }),
      },
      cancel: {
        text: intl.formatMessage({ id: 'bookingRules.category.cancel' }),
      },
      general: {
        text: intl.formatMessage({ id: 'bookingRules.category.general' }),
      },
    }),
    [intl],
  );

  const categoryColors: Record<string, string> = {
    booking: 'blue',
    renewal: 'green',
    cancel: 'orange',
    general: 'default',
  };

  const getRuleUnit = (record: BookingRuleItem) => {
    const key = String(record.ruleKey || '').toLowerCase();
    if (key.includes('minutes')) {
      return intl.formatMessage({ id: 'bookingRules.unit.minutes' });
    }
    if (key.includes('days')) {
      return intl.formatMessage({ id: 'bookingRules.unit.days' });
    }
    if (key.includes('credit') || key.includes('points')) {
      return intl.formatMessage({ id: 'bookingRules.unit.points' });
    }
    if (key.includes('duration_hours') || key.includes('hours')) {
      return intl.formatMessage({ id: 'bookingRules.unit.hours' });
    }
    if (key.includes('max') || key.includes('count') || key.includes('times')) {
      return intl.formatMessage({ id: 'bookingRules.unit.times' });
    }
    return intl.formatMessage({ id: 'bookingRules.unit.value' });
  };

  const openEdit = (record: BookingRuleItem) => {
    setEditingRule(record);
    form.setFieldsValue({
      ruleValue: record.ruleValue,
      description: record.description ?? '',
    });
    setEditModalOpen(true);
  };

  const handleEditOk = async () => {
    try {
      const values = await form.validateFields();
      if (!editingRule) return;
      setSubmitting(true);
      await updateBookingRule(editingRule.ruleKey, {
        ruleValue: String(values.ruleValue),
        description: values.description || undefined,
      });
      message.success(intl.formatMessage({ id: 'bookingRules.edit.success' }));
      setEditModalOpen(false);
      setEditingRule(null);
      actionRef.current?.reload?.();
    } catch (error: any) {
      const msg = error?.data?.error?.message || error?.message;
      message.error(
        `${intl.formatMessage({ id: 'bookingRules.edit.failed' })}${
          msg ? `：${msg}` : ''
        }`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleInitDefaults = async (
    mode: 'merge' | 'replace',
    pruneCustom: boolean,
  ) => {
    try {
      setInitializing(true);
      const resp: any = await initDefaultBookingRulesWithMode({
        mode,
        pruneCustom,
      });
      const total = Number(resp?.data?.total || resp?.data?.list?.length || 0);
      const initialized = Number(resp?.data?.initialized || 0);
      const prunedCount = Number(resp?.data?.prunedCount || 0);
      message.success(
        `${intl.formatMessage({
          id: 'bookingRules.init.success',
        })}（${intl.formatMessage(
          { id: 'bookingRules.init.summary' },
          { initialized, total, prunedCount },
        )}）`,
      );
      actionRef.current?.reset?.();
      actionRef.current?.reload?.();
    } catch (error: any) {
      const msg = error?.data?.error?.message || error?.message;
      message.error(
        `${intl.formatMessage({ id: 'bookingRules.init.failed' })}${
          msg ? `：${msg}` : ''
        }`,
      );
    } finally {
      setInitializing(false);
    }
  };

  const handleDeleteRule = async (ruleKey: string) => {
    try {
      setDeletingRuleKey(ruleKey);
      await deleteBookingRule(ruleKey);
      message.success(
        intl.formatMessage({ id: 'bookingRules.delete.success' }),
      );
      actionRef.current?.reload?.();
    } catch (error: any) {
      const msg = error?.data?.error?.message || error?.message;
      message.error(
        `${intl.formatMessage({ id: 'bookingRules.delete.failed' })}${
          msg ? `：${msg}` : ''
        }`,
      );
    } finally {
      setDeletingRuleKey('');
    }
  };

  const handleToggleEnabled = async (
    record: BookingRuleItem,
    enabled: boolean,
  ) => {
    try {
      setSwitchingRuleKey(record.ruleKey);
      await updateBookingRule(record.ruleKey, { enabled });
      message.success(
        intl.formatMessage({ id: 'bookingRules.toggle.success' }),
      );
      actionRef.current?.reload?.();
    } catch (error: any) {
      const msg = error?.data?.error?.message || error?.message;
      message.error(
        `${intl.formatMessage({ id: 'bookingRules.toggle.failed' })}${
          msg ? `：${msg}` : ''
        }`,
      );
    } finally {
      setSwitchingRuleKey('');
    }
  };

  const columns: ProColumns<BookingRuleItem>[] = [
    {
      title: intl.formatMessage({ id: 'bookingRules.column.id' }),
      dataIndex: 'id',
      width: 60,
      search: false,
    },
    {
      title: intl.formatMessage({ id: 'bookingRules.column.ruleKey' }),
      dataIndex: 'ruleKey',
      width: 220,
      ellipsis: true,
      fieldProps: {
        placeholder: intl.formatMessage({ id: 'bookingRules.filter.ruleKey' }),
      },
      render: (_, record) => (
        <code style={{ fontSize: 12 }}>{record.ruleKey}</code>
      ),
    },
    {
      title: intl.formatMessage({ id: 'bookingRules.column.category' }),
      dataIndex: 'category',
      width: 120,
      valueType: 'select',
      valueEnum: categoryValueEnum,
      render: (_, record) => (
        <Tag color={categoryColors[record.category] ?? 'default'}>
          {categoryValueEnum[record.category]?.text ?? record.category}
        </Tag>
      ),
    },
    {
      title: intl.formatMessage({ id: 'bookingRules.column.ruleValue' }),
      dataIndex: 'ruleValue',
      width: 180,
      search: false,
      render: (_, record) => <strong>{record.ruleValue}</strong>,
    },
    {
      title: intl.formatMessage({ id: 'bookingRules.column.unit' }),
      dataIndex: 'unit',
      width: 120,
      search: false,
      render: (_, record) => getRuleUnit(record),
    },
    {
      title: intl.formatMessage({ id: 'bookingRules.column.description' }),
      dataIndex: 'description',
      ellipsis: true,
      search: false,
      width: 260,
      render: (_, record) => record.description || '-',
    },
    {
      title: intl.formatMessage({ id: 'bookingRules.column.enabled' }),
      dataIndex: 'enabled',
      width: 100,
      search: false,
      render: (_, record) => (
        <Switch
          checked={Boolean(record.enabled)}
          loading={switchingRuleKey === record.ruleKey}
          checkedChildren={intl.formatMessage({ id: 'common.enabled' })}
          unCheckedChildren={intl.formatMessage({ id: 'common.disabled' })}
          onChange={(checked) => handleToggleEnabled(record, checked)}
        />
      ),
    },
    {
      title: intl.formatMessage({ id: 'bookingRules.column.updatedBy' }),
      dataIndex: 'updatedByName',
      width: 140,
      search: false,
      render: (_, record) => record.updatedByName || record.updatedBy || '-',
    },
    {
      title: intl.formatMessage({ id: 'bookingRules.column.updatedAt' }),
      dataIndex: 'updatedAt',
      valueType: 'dateTime',
      width: 180,
      search: false,
    },
    {
      title: intl.formatMessage({ id: 'common.action' }),
      valueType: 'option',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => openEdit(record)}
          >
            {intl.formatMessage({ id: 'bookingRules.action.edit' })}
          </Button>
          <Popconfirm
            title={intl.formatMessage({
              id: 'bookingRules.delete.confirmTitle',
            })}
            description={intl.formatMessage(
              { id: 'bookingRules.delete.confirmText' },
              { ruleKey: record.ruleKey },
            )}
            okText={intl.formatMessage({ id: 'common.confirm' })}
            cancelText={intl.formatMessage({ id: 'common.cancel' })}
            onConfirm={() => handleDeleteRule(record.ruleKey)}
          >
            <Button
              danger
              size="small"
              loading={deletingRuleKey === record.ruleKey}
              icon={<DeleteOutlined />}
            >
              {intl.formatMessage({ id: 'bookingRules.action.delete' })}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer title={intl.formatMessage({ id: 'bookingRules.pageTitle' })}>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message={intl.formatMessage({
          id: 'bookingRules.help',
          defaultMessage:
            '本页展示所有预约相关规则。部分规则如“临近取消”与“迟取消扣分”配合使用：预约开始前 N 分钟内取消，若迟取消扣分大于 0，则允许取消并扣分，否则禁止取消。预约开始后不可自行取消。',
        })}
      />
      <ProTable<BookingRuleItem>
        rowKey="id"
        actionRef={actionRef}
        search={STANDARD_TABLE_SEARCH}
        scroll={STANDARD_TABLE_SCROLL}
        columns={columns}
        request={async (params) => {
          try {
            const resp: any = await getBookingRules({
              current: params.current,
              pageSize: params.pageSize,
              category: params.category,
              ruleKey: params.ruleKey,
            });
            return toTableDataSource<BookingRuleItem>(resp);
          } catch (error: any) {
            message.error(
              error?.data?.error?.message ||
                error?.message ||
                intl.formatMessage({ id: 'common.operationFailed' }),
            );
            return { success: false, data: [], total: 0 };
          }
        }}
        toolBarRender={() => [
          <Button
            key="init-replace"
            type="primary"
            loading={initializing}
            onClick={() => handleInitDefaults('replace', false)}
          >
            {intl.formatMessage({ id: 'bookingRules.action.initReplace' })}
          </Button>,
        ]}
        tableAlertRender={false}
        locale={{
          emptyText: intl.formatMessage({ id: 'bookingRules.empty.hint' }),
        }}
      />

      <Modal
        title={`${intl.formatMessage({ id: 'bookingRules.edit.title' })} — ${
          editingRule?.ruleKey ?? ''
        }`}
        open={editModalOpen}
        onOk={handleEditOk}
        onCancel={() => {
          setEditModalOpen(false);
          setEditingRule(null);
        }}
        confirmLoading={submitting}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="ruleValue"
            label={intl.formatMessage({
              id: 'bookingRules.edit.ruleValueLabel',
            })}
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'bookingRules.edit.placeholder',
                }),
              },
            ]}
          >
            <Input
              placeholder={intl.formatMessage({
                id: 'bookingRules.edit.placeholder',
              })}
            />
          </Form.Item>
          <Form.Item
            name="description"
            label={intl.formatMessage({
              id: 'bookingRules.edit.descriptionLabel',
            })}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
          {editingRule && (
            <div style={{ color: '#999', fontSize: 12, marginTop: -8 }}>
              分类：
              {categoryValueEnum[editingRule.category]?.text ??
                editingRule.category}
              &nbsp;｜&nbsp;当前值：{editingRule.ruleValue}
            </div>
          )}
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default BookingRulesPage;
