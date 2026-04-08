import { Roles } from '@/constants/roles';
import {
  getActiveUsers,
  getDashboardData,
  getDashboardFloors,
  getHotAreas,
  getRecentBookings,
  getStatistics,
} from '@/services/library/dashboard';
import { Line, Pie } from '@ant-design/charts';
import {
  CalendarOutlined,
  DownloadOutlined,
  FireOutlined,
  StopOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { history, useIntl, useModel } from '@umijs/max';
import {
  Avatar,
  Button,
  Card,
  Col,
  Empty,
  Progress,
  Row,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
} from 'antd';
import React, { useEffect, useState } from 'react';

const { Text } = Typography;

interface StatCardData {
  title: string;
  value: number;
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
}

const Dashboard: React.FC = () => {
  const intl = useIntl();
  const { initialState } = useModel('@@initialState');
  const isAdmin = initialState?.currentUser?.role === Roles.ADMIN;

  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>(
    'today',
  );
  const [dashboardData, setDashboardData] = useState<any>({});
  const [statisticsData, setStatisticsData] = useState<any>({});
  const [floorData, setFloorData] = useState<any[]>([]);
  const [hotAreasData, setHotAreasData] = useState<any[]>([]);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    if (isAdmin) {
      Promise.all([
        getDashboardData().catch(() => ({ data: {} })),
        getStatistics().catch(() => ({ data: {} })),
        getDashboardFloors().catch(() => ({ data: [] })),
        getHotAreas().catch(() => ({ data: [] })),
        getRecentBookings().catch(() => ({ data: [] })),
        getActiveUsers().catch(() => ({ data: [] })),
      ])
        .then(([dashRes, statRes, floorRes, hotRes, bookRes, userRes]) => {
          setDashboardData(dashRes?.data || {});
          setStatisticsData(statRes?.data || {});
          setFloorData(Array.isArray(floorRes?.data) ? floorRes.data : []);
          setHotAreasData(Array.isArray(hotRes?.data) ? hotRes.data : []);
          setRecentBookings(Array.isArray(bookRes?.data) ? bookRes.data : []);
          setActiveUsers(Array.isArray(userRes?.data) ? userRes.data : []);
        })
        .finally(() => setLoading(false));
    } else {
      getDashboardData()
        .then((res: any) => setDashboardData(res?.data || {}))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isAdmin]);

  const statData: StatCardData[] = [
    {
      title: intl.formatMessage({
        id: 'dashboard.totalUsers',
        defaultMessage: 'Total users',
      }),
      value: dashboardData.totalUsers || 0,
      icon: <UserOutlined />,
      iconColor: '#2f54eb',
      iconBg: '#d6e4ff',
    },
    {
      title: intl.formatMessage({
        id: 'dashboard.totalBookings',
        defaultMessage: 'Total bookings',
      }),
      value: dashboardData.totalBookings || 0,
      icon: <CalendarOutlined />,
      iconColor: '#52c41a',
      iconBg: '#f6ffed',
    },
    {
      title: intl.formatMessage({
        id: 'dashboard.activeToday',
        defaultMessage: 'Bookings today',
      }),
      value: dashboardData.todayBookings || 0,
      icon: <FireOutlined />,
      iconColor: '#722ed1',
      iconBg: '#f9f0ff',
    },
    {
      title: intl.formatMessage({
        id: 'credit.header.blacklist',
        defaultMessage: 'Blacklisted users',
      }),
      value: dashboardData.blacklistedUsers || 0,
      icon: <StopOutlined />,
      iconColor: '#ff4d4f',
      iconBg: '#fff1f0',
    },
  ];

  const usageTrendData =
    statisticsData.trend && statisticsData.trend.length > 0
      ? statisticsData.trend.map((t: any) => ({
          time: t.date,
          value: t.bookings,
        }))
      : [];

  const bookingStatusData = [
    {
      type: intl.formatMessage({ id: 'dashboard.bookingType.total' }),
      value: statisticsData.totalBookings || dashboardData.totalBookings || 0,
    },
    {
      type: intl.formatMessage({ id: 'dashboard.bookingType.completed' }),
      value: statisticsData.completedBookings || 0,
    },
    {
      type: intl.formatMessage({ id: 'dashboard.bookingType.canceled' }),
      value: statisticsData.canceledBookings || 0,
    },
    {
      type: intl.formatMessage({ id: 'dashboard.bookingType.violated' }),
      value:
        statisticsData.violatedBookings || dashboardData.violationCount || 0,
    },
  ];

  const lineConfig = {
    data: usageTrendData,
    xField: 'time',
    yField: 'value',
    point: { size: 4, shape: 'circle' },
    lineStyle: { lineWidth: 3, stroke: '#5B8FF9' },
    xAxis: { tickCount: 7 },
    yAxis: { min: 0 },
    animation: { appear: { animation: 'path-in', duration: 1000 } },
  };

  const pieConfig = {
    data: bookingStatusData,
    angleField: 'value',
    colorField: 'type',
    color: ['#1890ff', '#13c2c2', '#faad14', '#ff7f4f'],
    radius: 0.75,
    label: {
      type: 'outer',
      content: (data: any) => `${(data.percent * 100).toFixed(0)}%`,
    },
    legend: { position: 'bottom', layout: 'horizontal' },
  };

  const floorColumns = [
    {
      title: intl.formatMessage({
        id: 'seat.form.floor',
        defaultMessage: 'Floor',
      }),
      dataIndex: 'floor',
      key: 'floor',
      width: 100,
    },
    {
      title: intl.formatMessage({ id: 'dashboard.column.totalSeats' }),
      dataIndex: 'totalSeats',
      key: 'totalSeats',
      width: 80,
      align: 'center' as const,
    },
    {
      title: intl.formatMessage({
        id: 'dashboard.column.availableSeats',
        defaultMessage: 'Available',
      }),
      dataIndex: 'availableSeats',
      key: 'availableSeats',
      width: 80,
      align: 'center' as const,
      render: (v: number) => <span style={{ color: '#52c41a' }}>{v}</span>,
    },
    {
      title: intl.formatMessage({
        id: 'dashboard.column.occupiedSeats',
        defaultMessage: 'Occupied today',
      }),
      dataIndex: 'occupiedSeats',
      key: 'occupiedSeats',
      width: 80,
      align: 'center' as const,
      render: (v: number) => <span style={{ color: '#1890ff' }}>{v}</span>,
    },
    {
      title: intl.formatMessage({ id: 'dashboard.column.usageRate' }),
      dataIndex: 'usageRate',
      key: 'usageRate',
      width: 160,
      align: 'center' as const,
      render: (v: number) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Progress
            percent={v}
            size="small"
            strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }}
            style={{ width: 80, margin: 0 }}
            showInfo={false}
          />
          <Text style={{ minWidth: 35 }}>{v}%</Text>
        </div>
      ),
    },
    {
      title: intl.formatMessage({ id: 'common.action' }),
      key: 'action',
      width: 80,
      align: 'center' as const,
      render: () => (
        <a onClick={() => history.push('/seat')}>
          {intl.formatMessage({ id: 'dashboard.view' })}
        </a>
      ),
    },
  ];

  const bookingColumns = [
    {
      title: intl.formatMessage({
        id: 'credit.tab.users',
        defaultMessage: 'User',
      }),
      dataIndex: 'user',
      key: 'user',
    },
    {
      title: intl.formatMessage({
        id: 'booking.column.seat',
        defaultMessage: 'Seat',
      }),
      dataIndex: 'seat',
      key: 'seat',
    },
    {
      title: intl.formatMessage({
        id: 'booking.form.date',
        defaultMessage: 'Date',
      }),
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: intl.formatMessage({
        id: 'seat.form.status',
        defaultMessage: 'Status',
      }),
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: any) => {
        const colorMap: Record<string, string> = {
          processing: 'processing',
          success: 'success',
          default: 'default',
          error: 'error',
        };
        return <Tag color={colorMap[record.statusType]}>{status}</Tag>;
      },
    },
    {
      title: intl.formatMessage({
        id: 'common.action',
        defaultMessage: 'Action',
      }),
      key: 'action',
      render: () => (
        <a onClick={() => history.push('/booking')}>
          {intl.formatMessage({ id: 'dashboard.view' })}
        </a>
      ),
    },
  ];

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '60vh',
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ background: '#f0f2f5', minHeight: '100vh' }}>
      <PageContainer
        header={{
          title: intl.formatMessage({
            id: 'menu.dashboard',
            defaultMessage: 'Dashboard',
          }),
          ghost: true,
          extra: isAdmin
            ? [
                <Button
                  key="1"
                  type={timeRange === 'today' ? 'primary' : 'default'}
                  onClick={() => setTimeRange('today')}
                >
                  {intl.formatMessage({ id: 'dashboard.range.today' })}
                </Button>,
                <Button
                  key="2"
                  type={timeRange === 'week' ? 'primary' : 'default'}
                  onClick={() => setTimeRange('week')}
                >
                  {intl.formatMessage({ id: 'dashboard.range.week' })}
                </Button>,
                <Button
                  key="3"
                  type={timeRange === 'month' ? 'primary' : 'default'}
                  onClick={() => setTimeRange('month')}
                >
                  {intl.formatMessage({ id: 'dashboard.range.month' })}
                </Button>,
                <Button key="4" type="primary" icon={<DownloadOutlined />}>
                  {intl.formatMessage({ id: 'dashboard.export' })}
                </Button>,
              ]
            : [],
        }}
      >
        {/* 统计卡片 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {statData.map((stat, index) => (
            <Col xs={24} sm={12} lg={6} key={index}>
              <Card bordered={false} style={{ height: '100%' }}>
                <Space
                  style={{ width: '100%', justifyContent: 'space-between' }}
                >
                  <div>
                    <Text type="secondary" style={{ fontSize: 14 }}>
                      {stat.title}
                    </Text>
                    <div
                      style={{ fontSize: 28, fontWeight: 600, marginTop: 4 }}
                    >
                      {stat.value.toLocaleString()}
                    </div>
                  </div>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 8,
                      background: stat.iconBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 24,
                      color: stat.iconColor,
                    }}
                  >
                    {stat.icon}
                  </div>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>

        {/* 图表区域 - 仅管理员 */}
        {isAdmin && (
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} lg={12}>
              <Card
                title={intl.formatMessage({ id: 'dashboard.card.usageTrend' })}
                bordered={false}
                style={{ height: 400 }}
              >
                {usageTrendData.length > 0 ? (
                  <div style={{ height: 300 }}>
                    <Line {...lineConfig} style={{ height: 300 }} />
                  </div>
                ) : (
                  <Empty
                    description={intl.formatMessage({ id: 'common.noData' })}
                    style={{ paddingTop: 80 }}
                  />
                )}
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card
                title={intl.formatMessage({
                  id: 'dashboard.card.bookingStatus',
                })}
                bordered={false}
                style={{ height: 400 }}
              >
                <div style={{ height: 300 }}>
                  <Pie {...pieConfig} height={300} />
                </div>
              </Card>
            </Col>
          </Row>
        )}

        {/* 楼层座位状态和热门区域 - 仅管理员 */}
        {isAdmin && (
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} lg={14}>
              <Card
                title={intl.formatMessage({ id: 'dashboard.card.floorStatus' })}
                bordered={false}
                style={{ minHeight: 360 }}
                extra={
                  <a onClick={() => history.push('/seat')}>
                    {intl.formatMessage({ id: 'dashboard.viewAll' })}
                  </a>
                }
              >
                {floorData.length > 0 ? (
                  <Table
                    columns={floorColumns}
                    dataSource={floorData}
                    pagination={false}
                    size="middle"
                    scroll={{ x: 600 }}
                  />
                ) : (
                  <Empty
                    description={intl.formatMessage({ id: 'common.noData' })}
                  />
                )}
              </Card>
            </Col>
            <Col xs={24} lg={10}>
              <Card
                title={intl.formatMessage({ id: 'dashboard.card.hotAreas' })}
                bordered={false}
                style={{ minHeight: 360 }}
                extra={
                  <a onClick={() => history.push('/management')}>
                    {intl.formatMessage({ id: 'dashboard.viewAll' })}
                  </a>
                }
              >
                {hotAreasData.length > 0 ? (
                  <Space
                    direction="vertical"
                    style={{ width: '100%' }}
                    size="middle"
                  >
                    {hotAreasData.map((area) => (
                      <Card
                        key={area.key}
                        size="small"
                        bordered={false}
                        style={{ background: '#fafafa' }}
                      >
                        <Space
                          direction="vertical"
                          style={{ width: '100%' }}
                          size="small"
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <Text strong>{area.area}</Text>
                            <Text strong style={{ color: '#1677ff' }}>
                              {area.usageRate}%
                            </Text>
                          </div>
                          <Progress
                            percent={area.usageRate}
                            strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }}
                            showInfo={false}
                          />
                          <Text type="secondary">
                            {intl.formatMessage({
                              id: 'dashboard.label.bookings',
                            })}
                            : {area.count}
                          </Text>
                        </Space>
                      </Card>
                    ))}
                  </Space>
                ) : (
                  <Empty
                    description={intl.formatMessage({ id: 'common.noData' })}
                  />
                )}
              </Card>
            </Col>
          </Row>
        )}

        {/* 最近预约记录和活跃用户 - 仅管理员 */}
        {isAdmin && (
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={14}>
              <Card
                title={intl.formatMessage({
                  id: 'dashboard.card.recentBookings',
                })}
                bordered={false}
                style={{ minHeight: 360 }}
                extra={
                  <a onClick={() => history.push('/booking')}>
                    {intl.formatMessage({ id: 'dashboard.viewAll' })}
                  </a>
                }
              >
                {recentBookings.length > 0 ? (
                  <Table
                    columns={bookingColumns}
                    dataSource={recentBookings}
                    pagination={false}
                    size="middle"
                  />
                ) : (
                  <Empty
                    description={intl.formatMessage({ id: 'common.noData' })}
                  />
                )}
              </Card>
            </Col>
            <Col xs={24} lg={10}>
              <Card
                title={intl.formatMessage({ id: 'dashboard.card.activeUsers' })}
                bordered={false}
                style={{ minHeight: 360 }}
                extra={
                  <a onClick={() => history.push('/user')}>
                    {intl.formatMessage({ id: 'dashboard.viewAll' })}
                  </a>
                }
              >
                {activeUsers.length > 0 ? (
                  <Space
                    direction="vertical"
                    style={{ width: '100%' }}
                    size="middle"
                  >
                    {activeUsers.map((user) => (
                      <Card
                        key={user.key}
                        size="small"
                        bordered={false}
                        style={{ background: '#fafafa' }}
                      >
                        <Space>
                          <Avatar
                            src={user.avatar}
                            icon={<UserOutlined />}
                            size={40}
                          />
                          <div>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                              }}
                            >
                              <Text strong>{user.name}</Text>
                              <Text type="secondary">{user.username}</Text>
                            </div>
                            <Text type="secondary">
                              {intl.formatMessage({
                                id: 'dashboard.label.bookings',
                              })}
                              : {user.bookings} |{' '}
                              {intl.formatMessage({
                                id: 'dashboard.label.lastActive',
                              })}
                              : {user.lastActive}
                            </Text>
                          </div>
                        </Space>
                      </Card>
                    ))}
                  </Space>
                ) : (
                  <Empty
                    description={intl.formatMessage({ id: 'common.noData' })}
                  />
                )}
              </Card>
            </Col>
          </Row>
        )}
      </PageContainer>
    </div>
  );
};

export default Dashboard;
