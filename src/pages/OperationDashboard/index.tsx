import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Alert, Card, Col, Empty, Row, Select, Spin, Statistic } from 'antd';
import { Line } from '@ant-design/charts';
import React, { useCallback, useEffect, useState } from 'react';
import {
  getDashboardStats,
  getDashboardTrends,
} from '../../services/library/operationDashboard';

const OperationDashboardPage: React.FC = () => {
  const intl = useIntl();
  const [stats, setStats] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [trendDays, setTrendDays] = useState(7);

  const unwrapData = (response: any) => response?.data ?? response ?? null;

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getDashboardStats();
      setStats(unwrapData(res));
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTrends = useCallback(async () => {
    try {
      const res = await getDashboardTrends({ days: trendDays });
      const payload = unwrapData(res);
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
    data: trends.map((t: any) => ({
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
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
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
                  id: 'operationDashboard.totalBookings',
                })}
                value={stats?.totalBookings ?? 0}
              />
            </Card>
          </Col>
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
                  id: 'operationDashboard.totalUsers',
                })}
                value={stats?.totalUsers ?? 0}
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
                  id: 'operationDashboard.totalActivities',
                })}
                value={stats?.totalActivities ?? 0}
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
