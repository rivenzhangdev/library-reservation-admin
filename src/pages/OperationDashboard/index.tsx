import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  List,
  Modal,
  Row,
  Select,
  Spin,
  Statistic,
  Typography,
  message,
} from 'antd';
import { Line } from '@ant-design/charts';
import React, { useCallback, useEffect, useState } from 'react';
import {
  getDashboardStats,
  getDashboardTrends,
} from '../../services/library/operationDashboard';
import { orphanBooking } from '../../services/library';

type DashboardStats = {
  todayBookings?: number;
  activeBookings?: number;
  pendingChangeRequests?: number;
  pendingFeedback?: number;
};

type TrendPoint = {
  day: string;
  count: number | string;
};

type ApiEnvelope<T> = {
  data?: T;
};

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

const OperationDashboardPage: React.FC = () => {
  const intl = useIntl();
  const [orphanModalVisible, setOrphanModalVisible] = useState(false);
  const [orphanLoading, setOrphanLoading] = useState(false);
  const [orphans, setOrphans] = useState<number[]>([]);
  const [repairing, setRepairing] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [trendDays, setTrendDays] = useState(7);

  const unwrapData = <T,>(response: T | ApiEnvelope<T> | null | undefined) =>
    (response && typeof response === 'object' && 'data' in response
      ? response.data
      : response) ?? null;

  const fetchOrphanBookings = async () => {
    setOrphanLoading(true);
    try {
      const res = await orphanBooking.getOrphanBookings();
      const data = res?.data || res;
      setOrphans(
        Array.isArray(data?.orphanBookingIds) ? data.orphanBookingIds : [],
      );
      setOrphanModalVisible(true);
    } catch (error: unknown) {
      message.error(getErrorMessage(error, '查询失败'));
    } finally {
      setOrphanLoading(false);
    }
  };

  const handleRepairOrphans = async () => {
    setRepairing(true);
    try {
      const res = await orphanBooking.repairOrphanBookings();
      const data = res?.data || res;
      message.success(`已释放异常占座 ${data?.repairedCount ?? 0} 条`);
      setOrphans([]);
      setOrphanModalVisible(false);
    } catch (error: unknown) {
      message.error(getErrorMessage(error, '处理失败'));
    } finally {
      setRepairing(false);
    }
  };

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getDashboardStats();
      setStats(unwrapData<DashboardStats>(res));
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTrends = useCallback(async () => {
    try {
      const res = await getDashboardTrends({ days: trendDays });
      const payload = unwrapData<{ bookingTrends?: TrendPoint[] }>(res);
      setTrends(
        Array.isArray(payload?.bookingTrends) ? payload.bookingTrends : [],
      );
    } catch {
      setTrends([]);
    }
  }, [trendDays]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  const lineConfig = {
    data: trends.map((t) => ({
      day: t.day,
      count: Number(t.count),
    })),
    xField: 'day',
    yField: 'count',
    smooth: true,
    point: { size: 3 },
    height: 300,
  };

  return (
    <PageContainer
      title={intl.formatMessage({ id: 'operationDashboard.pageTitle' })}
      extra={[
        <Button
          key="orphan-check"
          loading={orphanLoading}
          onClick={fetchOrphanBookings}
        >
          {intl.formatMessage({
            id: 'operationDashboard.staleOccupancyCheck',
          })}
        </Button>,
      ]}
    >
      <Modal
        open={orphanModalVisible}
        title={intl.formatMessage({
          id: 'operationDashboard.staleOccupancyCheckResult',
        })}
        onCancel={() => setOrphanModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setOrphanModalVisible(false)}>
            {intl.formatMessage({ id: 'common.close', defaultMessage: '关闭' })}
          </Button>,
          <Button
            key="repair"
            type="primary"
            loading={repairing}
            disabled={!orphans.length}
            onClick={handleRepairOrphans}
          >
            {intl.formatMessage({
              id: 'operationDashboard.releaseStaleOccupancy',
            })}
          </Button>,
        ]}
      >
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message={intl.formatMessage({
            id: 'operationDashboard.staleOccupancyHint',
          })}
        />
        {orphans.length ? (
          <List
            size="small"
            bordered
            dataSource={orphans}
            renderItem={(id) => (
              <List.Item>
                <Typography.Text code>{id}</Typography.Text>
              </List.Item>
            )}
          />
        ) : (
          <Typography.Text type="success">
            {intl.formatMessage({
              id: 'operationDashboard.noStaleOccupancy',
            })}
          </Typography.Text>
        )}
      </Modal>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16, display: 'flex', alignItems: 'baseline' }}
        message={intl.formatMessage({
          id: 'operationDashboard.dataHint',
          defaultMessage:
            '运营看板展示预约趋势、待处理变更和待处理反馈；如果为空，请先创建预约、提交变更申请或提交反馈。',
        })}
      />

      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title={intl.formatMessage({
                  id: 'operationDashboard.todayBookings',
                })}
                value={stats?.todayBookings ?? 0}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title={intl.formatMessage({
                  id: 'operationDashboard.activeBookings',
                })}
                value={stats?.activeBookings ?? 0}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title={intl.formatMessage({
                  id: 'operationDashboard.pendingChangeRequests',
                })}
                value={stats?.pendingChangeRequests ?? 0}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title={intl.formatMessage({
                  id: 'operationDashboard.pendingFeedback',
                })}
                value={stats?.pendingFeedback ?? 0}
              />
            </Card>
          </Col>
        </Row>
      </Spin>

      <Card
        title={intl.formatMessage({ id: 'operationDashboard.trendTitle' })}
        style={{ marginTop: 16 }}
        extra={
          <Select
            value={trendDays}
            onChange={setTrendDays}
            style={{ width: 120 }}
            options={[
              {
                label: intl.formatMessage({ id: 'operationDashboard.days7' }),
                value: 7,
              },
              {
                label: intl.formatMessage({ id: 'operationDashboard.days14' }),
                value: 14,
              },
              {
                label: intl.formatMessage({ id: 'operationDashboard.days30' }),
                value: 30,
              },
            ]}
          />
        }
      >
        {trends.length > 0 ? (
          <Line {...lineConfig} />
        ) : (
          <Empty description={intl.formatMessage({ id: 'common.noData' })} />
        )}
      </Card>
    </PageContainer>
  );
};

export default OperationDashboardPage;
