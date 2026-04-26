import { DownloadOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Alert, Button, Space, Tag, message } from 'antd';
import React, { useRef } from 'react';
import {
  getAuditLogs,
  getAuditLogsExportUrl,
} from '../../services/library/audit-log';

interface AuditLogItem {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  targetLabel?: string;
  operatorId: string;
  operatorName?: string;
  operatorRole: string;
  ip?: string;
  createdAt: string;
}

const AuditLogPage: React.FC = () => {
  const intl = useIntl();
  const actionRef = useRef<ActionType>();

  const handleExport = async () => {
    try {
      const formValues = (actionRef.current as any)?.pageInfo?.params || {};
      const { current, pageSize, createdAtRange, ...rest } = formValues as any;
      const query: any = { ...rest };
      if (Array.isArray(createdAtRange) && createdAtRange.length === 2) {
        query.startDate = createdAtRange[0];
        query.endDate = createdAtRange[1];
      }
      const url = await getAuditLogsExportUrl(query);
      const token = window.localStorage.getItem('token') || '';
      const response = await fetch(url, {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `audit-logs-${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error: any) {
      message.error(
        error?.message ||
          intl.formatMessage({
            id: 'auditLog.exportFailed',
            defaultMessage: 'Export failed',
          }),
      );
    }
  };

  const columns: ProColumns<AuditLogItem>[] = [
    {
      title: intl.formatMessage({
        id: 'common.createdAt',
        defaultMessage: 'Created At',
      }),
      dataIndex: 'createdAt',
      valueType: 'dateTime',
      width: 180,
      hideInSearch: true,
    },
    {
      title: intl.formatMessage({
        id: 'common.field.type',
        defaultMessage: 'Type',
      }),
      dataIndex: 'targetType',
      width: 140,
    },
    {
      title: intl.formatMessage({
        id: 'common.action',
        defaultMessage: 'Action',
      }),
      dataIndex: 'action',
      width: 220,
      ellipsis: true,
      render: (_, record) => <Tag color="blue">{record.action}</Tag>,
    },
    {
      title: intl.formatMessage({
        id: 'common.field.relatedId',
        defaultMessage: 'Related ID',
      }),
      dataIndex: 'targetLabel',
      width: 220,
      ellipsis: true,
      copyable: true,
      hideInSearch: true,
      render: (_, record) =>
        record.targetLabel ||
        `${record.targetType || '-'}#${record.targetId || '-'}`,
    },
    {
      title: intl.formatMessage({
        id: 'common.field.relatedId',
        defaultMessage: 'Related ID',
      }),
      dataIndex: 'targetKeyword',
      hideInTable: true,
      order: 3,
      fieldProps: {
        placeholder: intl.formatMessage({
          id: 'auditLog.search.relatedId',
          defaultMessage: 'Search by related ID',
        }),
      },
    },
    {
      title: intl.formatMessage({
        id: 'common.updatedBy',
        defaultMessage: 'Updated By',
      }),
      dataIndex: 'operatorName',
      width: 180,
      ellipsis: true,
      copyable: true,
      hideInSearch: true,
      render: (_, record) => record.operatorName || record.operatorId || '-',
    },
    {
      title: intl.formatMessage({
        id: 'common.updatedBy',
        defaultMessage: 'Updated By',
      }),
      dataIndex: 'operatorKeyword',
      hideInTable: true,
      order: 2,
      fieldProps: {
        placeholder: intl.formatMessage({
          id: 'auditLog.search.operatorKeyword',
          defaultMessage: 'Search by name / username / ID',
        }),
      },
    },
    {
      title: intl.formatMessage({
        id: 'notification.form.role',
        defaultMessage: 'Role',
      }),
      dataIndex: 'operatorRole',
      width: 120,
      valueType: 'select',
      valueEnum: {
        admin: { text: 'admin' },
        reviewer: { text: 'reviewer' },
        operator: { text: 'operator' },
        user: { text: 'user' },
      },
    },
    {
      title: 'IP',
      dataIndex: 'ip',
      width: 140,
      hideInSearch: true,
    },
    {
      title: intl.formatMessage({
        id: 'common.createdAt',
        defaultMessage: 'Created At',
      }),
      dataIndex: 'createdAtRange',
      valueType: 'dateRange',
      hideInTable: true,
      order: 1,
    },
  ];

  return (
    <PageContainer
      title={intl.formatMessage({
        id: 'menu.dataManagement.auditLogs',
        defaultMessage: 'Audit Logs',
      })}
    >
      <Alert
        style={{ marginBottom: 16 }}
        type="info"
        showIcon
        message={intl.formatMessage({
          id: 'auditLog.fieldGuide.title',
          defaultMessage: 'Field Guide',
        })}
        description={
          <div>
            <div>
              {intl.formatMessage({
                id: 'auditLog.fieldGuide.action',
                defaultMessage:
                  'Action: operation code, such as booking.create or user.update.',
              })}
            </div>
            <div>
              {intl.formatMessage({
                id: 'auditLog.fieldGuide.type',
                defaultMessage:
                  'Type: business object type, such as booking / user / config.',
              })}
            </div>
            <div>
              {intl.formatMessage({
                id: 'auditLog.fieldGuide.relatedId',
                defaultMessage:
                  'Related ID: identifier of the operated object.',
              })}
            </div>
            <div>
              {intl.formatMessage({
                id: 'auditLog.fieldGuide.updatedBy',
                defaultMessage:
                  'Updated By: operator name (falls back to operator ID if missing).',
              })}
            </div>
          </div>
        }
      />
      <ProTable<AuditLogItem>
        actionRef={actionRef}
        rowKey="id"
        search={{ labelWidth: 'auto' }}
        pagination={{ pageSize: 20 }}
        columns={columns}
        toolBarRender={() => [
          <Space key="actions">
            <Button icon={<DownloadOutlined />} onClick={handleExport}>
              {intl.formatMessage({
                id: 'dashboard.export',
                defaultMessage: 'Export',
              })}
            </Button>
          </Space>,
        ]}
        request={async (params) => {
          const { current, pageSize, createdAtRange, ...rest } = params as any;
          const query: any = {
            ...rest,
            page: current,
            pageSize,
          };

          if (Array.isArray(createdAtRange) && createdAtRange.length === 2) {
            query.startDate = createdAtRange[0];
            query.endDate = createdAtRange[1];
          }

          const res: any = await getAuditLogs(query);
          const payload = res?.data || {};
          const list = Array.isArray(payload.list) ? payload.list : [];
          return {
            data: list,
            success: true,
            total: Number(payload.total || 0),
          };
        }}
      />
    </PageContainer>
  );
};

export default AuditLogPage;
