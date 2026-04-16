import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Button, Space, Table, Tag, Typography, message } from 'antd';
import React, { useEffect, useState } from 'react';
import {
  BACKEND_BASE_KEY,
  BACKEND_ENVS,
  BACKEND_ENV_KEY,
  detectBackendStatuses,
  getBackendBaseUrl,
  getBackendEnvKey,
  setBackendEnv,
} from '../../../config/backendEnvs';

type EnvRow = {
  key: string;
  label: string;
  baseUrl: string;
  status: 'ok' | 'partial' | 'down' | 'unknown';
  selected: boolean;
};

const BackendStatusPage: React.FC = () => {
  const intl = useIntl();
  const [rows, setRows] = useState<EnvRow[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const stats = await detectBackendStatuses(2500);
      const currentKey = getBackendEnvKey();
      setRows(
        BACKEND_ENVS.map((e) => ({
          key: e.key,
          label: e.label,
          baseUrl: e.baseUrl,
          status: (stats[e.key]?.status as EnvRow['status']) || 'unknown',
          selected: currentKey === e.key,
        })),
      );
    } catch (e) {
      message.error(
        intl.formatMessage({
          id: 'admin.detectFailed',
          defaultMessage: 'Failed to detect backends',
        }),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleSet = (key: string) => {
    // @ts-ignore
    setBackendEnv(key);
    message.success(
      intl.formatMessage({
        id: 'admin.setSuccess',
        defaultMessage: 'Environment set',
      }),
    );
    refresh();
  };

  const handleUseLan = (key: string) => {
    const found = BACKEND_ENVS.find((e) => e.key === key);
    const lan = (found as any)?.lanBaseUrl || '';
    if (!lan) {
      message.warning(
        intl.formatMessage({
          id: 'admin.noLan',
          defaultMessage: 'No LAN address configured for this environment',
        }),
      );
      return;
    }
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(BACKEND_ENV_KEY, key);
        localStorage.setItem(BACKEND_BASE_KEY, lan);
      }
    } catch (e) {
      // ignore
    }
    message.success(
      intl.formatMessage({
        id: 'admin.useLanSuccess',
        defaultMessage: 'Using LAN address',
      }),
    );
    refresh();
  };

  const columns = [
    {
      title: intl.formatMessage({
        id: 'admin.env',
        defaultMessage: 'Environment',
      }),
      dataIndex: 'label',
      key: 'label',
    },
    {
      title: intl.formatMessage({
        id: 'admin.baseUrl',
        defaultMessage: 'Base URL',
      }),
      dataIndex: 'baseUrl',
      key: 'baseUrl',
      render: (text: string) => (
        <a href={text} target="_blank" rel="noreferrer">
          {text}
        </a>
      ),
    },
    {
      title: intl.formatMessage({
        id: 'admin.status',
        defaultMessage: 'Status',
      }),
      dataIndex: 'status',
      key: 'status',
      render: (s: EnvRow['status']) => {
        if (s === 'ok')
          return (
            <Tag color="success">
              {intl.formatMessage({
                id: 'admin.status.ok',
                defaultMessage: 'OK',
              })}
            </Tag>
          );
        if (s === 'partial')
          return (
            <Tag color="warning">
              {intl.formatMessage({
                id: 'admin.status.partial',
                defaultMessage: 'Partial',
              })}
            </Tag>
          );
        if (s === 'down')
          return (
            <Tag color="error">
              {intl.formatMessage({
                id: 'admin.status.down',
                defaultMessage: 'Down',
              })}
            </Tag>
          );
        return (
          <Tag>
            {intl.formatMessage({
              id: 'admin.status.unknown',
              defaultMessage: 'Unknown',
            })}
          </Tag>
        );
      },
    },
    {
      title: intl.formatMessage({
        id: 'admin.current',
        defaultMessage: 'Current',
      }),
      dataIndex: 'selected',
      key: 'selected',
      render: (v: boolean) =>
        v ? (
          <Tag color="processing">
            {intl.formatMessage({
              id: 'admin.currentTag',
              defaultMessage: 'Current',
            })}
          </Tag>
        ) : null,
    },
    {
      title: intl.formatMessage({
        id: 'common.action',
        defaultMessage: 'Action',
      }),
      key: 'action',
      render: (_: any, record: EnvRow) => (
        <Space>
          <Button
            size="small"
            onClick={() => window.open(record.baseUrl, '_blank')}
          >
            {intl.formatMessage({ id: 'admin.open', defaultMessage: 'Open' })}
          </Button>
          {(() => {
            const found = BACKEND_ENVS.find((e) => e.key === record.key) as any;
            const hasLan = !!(found && found.lanBaseUrl);
            return (
              <Button
                size="small"
                onClick={() => handleUseLan(record.key)}
                disabled={!hasLan}
              >
                {intl.formatMessage({
                  id: 'admin.useLan',
                  defaultMessage: 'Use LAN',
                })}
              </Button>
            );
          })()}
          {!record.selected && (
            <Button
              size="small"
              type="primary"
              onClick={() => handleSet(record.key)}
            >
              {intl.formatMessage({
                id: 'admin.setAsCurrent',
                defaultMessage: 'Set as current',
              })}
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <PageContainer
      title={intl.formatMessage({
        id: 'admin.backendDetect',
        defaultMessage: 'Backend environment detection',
      })}
    >
      <Space style={{ marginBottom: 12 }}>
        <Button onClick={refresh} loading={loading}>
          {intl.formatMessage({
            id: 'admin.refresh',
            defaultMessage: 'Refresh',
          })}
        </Button>
        <Typography.Text type="secondary">
          {intl.formatMessage({
            id: 'admin.selectedBase',
            defaultMessage: 'Selected base',
          })}
          : {getBackendBaseUrl()}
        </Typography.Text>
      </Space>
      <Table
        rowKey="key"
        dataSource={rows}
        columns={columns}
        pagination={false}
      />
    </PageContainer>
  );
};

export default BackendStatusPage;
