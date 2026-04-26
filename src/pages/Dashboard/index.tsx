import { Roles } from '@/constants/roles';
import {
  getActiveUsers,
  getDashboardData,
  getDashboardFloors,
  getHotAreas,
  getRecentBookings,
  getStatistics,
} from '@/services/library/dashboard';
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
  Alert,
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

  const fetchDashboardDetails = async () => {
    setLoading(true);
    if (isAdmin) {
      Promise.all([
        getDashboardData().catch(() => ({ data: {} })),
        getDashboardFloors().catch(() => ({ data: [] })),
        getHotAreas().catch(() => ({ data: [] })),
        getRecentBookings().catch(() => ({ data: [] })),
        getActiveUsers().catch(() => ({ data: [] })),
      ])
        .then(([dashRes, floorRes, hotRes, bookRes, userRes]) => {
          setDashboardData(dashRes?.data || {});
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
  };

  const fetchStatisticsData = async (range: 'today' | 'week' | 'month') => {
    try {
      setLoading(true);
      const res: any = await getStatistics({ range });
      setStatisticsData(res?.data || {});
    } catch (error) {
      setStatisticsData({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      fetchStatisticsData(timeRange);
    }
  }, [timeRange, isAdmin]);

  const getRangeLabelId = (range: 'today' | 'week' | 'month') => {
    if (range === 'today') return 'dashboard.range.today';
    if (range === 'week') return 'dashboard.range.week';
    return 'dashboard.range.month';
  };

  const getRangeDefaultMessage = (range: 'today' | 'week' | 'month') => {
    if (range === 'today') return 'Bookings today';
    if (range === 'week') return 'Bookings this week';
    return 'Bookings this month';
  };

  const handleExportDashboard = () => {
    const rows = [
      [
        intl.formatMessage({
          id: 'dashboard.totalUsers',
          defaultMessage: 'Total users',
        }),
        dashboardData.totalUsers || 0,
      ],
      [
        intl.formatMessage({
          id: 'dashboard.totalBookings',
          defaultMessage: 'Total bookings',
        }),
        dashboardData.totalBookings || 0,
      ],
      [
        intl.formatMessage({
          id: getRangeLabelId(timeRange),
          defaultMessage: getRangeDefaultMessage(timeRange),
        }),
        (statisticsData.rangeBookings ?? dashboardData.todayBookings) || 0,
      ],
      [
        intl.formatMessage({
          id: 'dashboard.bookingType.completed',
          defaultMessage: 'Completed',
        }),
        statisticsData.completedBookings || 0,
      ],
      [
        intl.formatMessage({
          id: 'dashboard.bookingType.canceled',
          defaultMessage: 'Canceled',
        }),
        statisticsData.canceledBookings || 0,
      ],
      [
        intl.formatMessage({
          id: 'dashboard.bookingType.violated',
          defaultMessage: 'Violated',
        }),
        statisticsData.violatedBookings || 0,
      ],
    ];
    const csv = rows
      .map((row) => row.map((cell) => JSON.stringify(cell ?? '')).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard_export_${timeRange}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
        id: getRangeLabelId(timeRange),
        defaultMessage: getRangeDefaultMessage(timeRange),
      }),
      value: (statisticsData.rangeBookings ?? dashboardData.todayBookings) || 0,
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
      fixed: 'right' as const,
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
      width: 160,
      ellipsis: true,
    },
    {
      title: intl.formatMessage({
        id: 'booking.column.seat',
        defaultMessage: 'Seat',
      }),
      dataIndex: 'seat',
      key: 'seat',
      width: 140,
      ellipsis: true,
    },
    {
      title: intl.formatMessage({
        id: 'booking.form.date',
        defaultMessage: 'Date',
      }),
      dataIndex: 'date',
      key: 'date',
      width: 120,
    },
    {
      title: intl.formatMessage({
        id: 'seat.form.status',
        defaultMessage: 'Status',
      }),
      dataIndex: 'status',
      key: 'status',
      width: 120,
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
      width: 90,
      fixed: 'right' as const,
      align: 'center' as const,
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
                <Button
                  key="4"
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={handleExportDashboard}
                >
                  {intl.formatMessage({ id: 'dashboard.export' })}
                </Button>,
              ]
            : [],
        }}
      >
        {isAdmin && (
          <Alert
            type="info"
            showIcon
            style={{
              marginBottom: 16,
              display: 'flex',
              alignItems: 'baseline',
            }}
            message={intl.formatMessage({
              id: 'dashboard.adminDataHint',
              defaultMessage:
                '今日/本周/本月统计来自预约记录；热门区域、最近预约、活跃用户需要先有预约数据。',
            })}
          />
        )}

        {/* 统计卡片 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {statData.map((stat, index) => (
            <Col xs={24} sm={12} lg={6} key={index}>
              <Card variant="borderless" style={{ height: '100%' }}>
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

        {/* 楼层座位状态和热门区域 - 仅管理员 */}
        {isAdmin && (
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} lg={14}>
              <Card
                title={intl.formatMessage({ id: 'dashboard.card.floorStatus' })}
                variant="borderless"
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
                    scroll={{ x: 'max-content' }}
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
                variant="borderless"
                style={{ minHeight: 360 }}
                extra={
                  <a onClick={() => history.push('/system-config')}>
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
                        variant="borderless"
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
                variant="borderless"
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
                    scroll={{ x: 'max-content' }}
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
                variant="borderless"
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
                        variant="borderless"
                        style={{ background: '#fafafa' }}
                      >
                        <Space>
                          <Avatar
                            src={user.avatar}
                            icon={!user.avatar ? <UserOutlined /> : undefined}
                            size={40}
                            style={{
                              backgroundColor: user.avatar
                                ? 'transparent'
                                : '#1890ff',
                              color: '#fff',
                              flexShrink: 0,
                            }}
                          >
                            {!user.avatar && user.name
                              ? String(user.name).charAt(0).toUpperCase()
                              : null}
                          </Avatar>
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
