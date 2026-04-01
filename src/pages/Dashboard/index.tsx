import { Line, Pie } from '@ant-design/charts';
import {
  ArrowUpOutlined,
  CalendarOutlined,
  DownloadOutlined,
  FireOutlined,
  StopOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import {
  Avatar,
  Button,
  Card,
  Col,
  Progress,
  Row,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import React, { useState } from 'react';

const { Text } = Typography;

/**
 * 统计卡片数据类型
 */
interface StatCardData {
  title: string;
  value: number;
  trend?: number;
  trendLabel?: string;
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
}

/**
 * 数据概览页面
 */
const Dashboard: React.FC = () => {
  const intl = useIntl();

  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>(
    'today',
  );

  // 统计数据
  const statData: StatCardData[] = [
    {
      title: intl.formatMessage({
        id: 'dashboard.totalUsers',
        defaultMessage: '总用户数',
      }),
      value: 2580,
      trend: 2.5,
      trendLabel: '较昨日',
      icon: <UserOutlined />,
      iconColor: '#2f54eb',
      iconBg: '#d6e4ff',
    },
    {
      title: intl.formatMessage({
        id: 'dashboard.totalBookings',
        defaultMessage: '总预约数',
      }),
      value: 12540,
      trend: 4.2,
      trendLabel: '较昨日',
      icon: <CalendarOutlined />,
      iconColor: '#52c41a',
      iconBg: '#f6ffed',
    },
    {
      title: intl.formatMessage({
        id: 'dashboard.activeToday',
        defaultMessage: '今日活跃',
      }),
      value: 358,
      trend: 8.7,
      trendLabel: '较昨日',
      icon: <FireOutlined />,
      iconColor: '#722ed1',
      iconBg: '#f9f0ff',
    },
    {
      title: intl.formatMessage({
        id: 'credit.header.blacklist',
        defaultMessage: '黑名单用户',
      }),
      value: 12,
      trend: -1,
      trendLabel: '较昨日',
      icon: <StopOutlined />,
      iconColor: '#ff4d4f',
      iconBg: '#fff1f0',
    },
  ];

  // 座位使用率趋势数据
  const usageTrendData = [
    { time: '8:00', value: 35 },
    { time: '10:00', value: 78 },
    { time: '12:00', value: 45 },
    { time: '14:00', value: 85 },
    { time: '16:00', value: 90 },
    { time: '18:00', value: 75 },
    { time: '20:00', value: 40 },
    { time: '22:00', value: 15 },
  ];

  // 预约状态分布数据
  const bookingStatusData = [
    { type: '总预约', value: 50 },
    { type: '完成', value: 39 },
    { type: '取消', value: 6 },
    { type: '违约', value: 5 },
  ];

  // 楼层座位状态数据
  const floorData = [
    {
      key: '1',
      floor: '1 楼',
      totalSeats: 150,
      availableSeats: 45,
      occupiedSeats: 105,
      usageRate: 70,
    },
    {
      key: '2',
      floor: '2 楼',
      totalSeats: 120,
      availableSeats: 30,
      occupiedSeats: 90,
      usageRate: 75,
    },
    {
      key: '3',
      floor: '3 楼',
      totalSeats: 100,
      availableSeats: 25,
      occupiedSeats: 75,
      usageRate: 75,
    },
    {
      key: '4',
      floor: '4 楼',
      totalSeats: 80,
      availableSeats: 32,
      occupiedSeats: 48,
      usageRate: 60,
    },
  ];

  // 今日热门区域数据
  const hotAreasData = [
    {
      key: '1',
      area: 'A 区 2 楼靠窗座位',
      usageRate: 92,
      count: 85,
    },
    {
      key: '2',
      area: 'B 区 3 楼研修室',
      usageRate: 88,
      count: 72,
    },
    {
      key: '3',
      area: 'C 区 1 楼电子阅览区',
      usageRate: 80,
      count: 64,
    },
  ];

  // 最近预约记录数据
  const recentBookings = [
    {
      key: '1',
      user: '张三',
      seat: 'A 区 2 楼靠窗座位',
      date: '2026-01-10',
      status: '进行中',
      statusType: 'processing',
    },
    {
      key: '2',
      user: '李四',
      seat: 'B 区 3 楼研修室',
      date: '2026-01-10',
      status: '已完成',
      statusType: 'success',
    },
    {
      key: '3',
      user: '王五',
      seat: 'C 区 1 楼电子阅览区',
      date: '2026-01-09',
      status: '已取消',
      statusType: 'default',
    },
    {
      key: '4',
      user: '赵六',
      seat: 'A 区 1 楼普通座位',
      date: '2026-01-09',
      status: '违约',
      statusType: 'error',
    },
  ];

  // 最近活跃用户数据
  const activeUsers = [
    {
      key: '1',
      name: '张三',
      username: 'zhangsan',
      bookings: 12,
      lastActive: '10 分钟前',
      avatar: 'https://api.dicebear.com/7.x/miniavs/svg?seed=1',
    },
    {
      key: '2',
      name: '李四',
      username: 'lisi',
      bookings: 10,
      lastActive: '30 分钟前',
      avatar: 'https://api.dicebear.com/7.x/miniavs/svg?seed=2',
    },
    {
      key: '3',
      name: '王五',
      username: 'wangwu',
      bookings: 8,
      lastActive: '1 小时前',
      avatar: 'https://api.dicebear.com/7.x/miniavs/svg?seed=3',
    },
  ];

  // 座位使用率趋势图配置
  const lineConfig = {
    data: usageTrendData,
    xField: 'time',
    yField: 'value',
    point: {
      size: 4,
      shape: 'circle',
    },
    lineStyle: {
      lineWidth: 3,
      stroke: '#5B8FF9',
    },
    xAxis: {
      tickCount: 8,
      grid: {
        line: {
          style: {
            lineDash: [4, 4],
            stroke: '#d9d9d9',
          },
        },
      },
    },
    yAxis: {
      min: 0,
      max: 100,
      tickInterval: 25,
      grid: {
        line: {
          style: {
            lineDash: [4, 4],
            stroke: '#d9d9d9',
          },
        },
      },
    },
    animation: {
      appear: {
        animation: 'path-in',
        duration: 1000,
      },
    },
    tooltip: {
      showMarkers: false,
    },
  };

  // 预约状态分布饼图配置
  const pieConfig = {
    data: bookingStatusData,
    angleField: 'value',
    colorField: 'type',
    color: ['#1890ff', '#13c2c2', '#faad14', '#ff7f4f'],
    radius: 0.75,
    innerRadius: 0,
    autoFit: true,
    label: {
      type: 'outer',
      content: '{percentage}',
      autoRotate: true,
      autoHide: true,
    },
    legend: {
      position: 'bottom',
      layout: 'horizontal',
    },
    tooltip: {
      showMarkers: false,
    },
    animation: {
      appear: {
        animation: 'zoom-in',
        duration: 1000,
      },
    },
  };

  // 楼层座位状态表格列
  const floorColumns = [
    {
      title: intl.formatMessage({
        id: 'seat.form.floor',
        defaultMessage: '楼层',
      }),
      dataIndex: 'floor',
      key: 'floor',
      width: 80,
    },
    {
      title: intl.formatMessage({
        id: 'dashboard.column.totalSeats',
        defaultMessage: '总座位',
      }),
      dataIndex: 'totalSeats',
      key: 'totalSeats',
      width: 80,
      align: 'center' as const,
    },
    {
      title: intl.formatMessage({
        id: 'dashboard.column.availableSeats',
        defaultMessage: '可用座位',
      }),
      dataIndex: 'availableSeats',
      key: 'availableSeats',
      width: 80,
      align: 'center' as const,
      render: (value: number) => (
        <span style={{ color: '#52c41a' }}>{value}</span>
      ),
    },
    {
      title: intl.formatMessage({
        id: 'dashboard.column.occupiedSeats',
        defaultMessage: '已占用座位',
      }),
      dataIndex: 'occupiedSeats',
      key: 'occupiedSeats',
      width: 100,
      align: 'center' as const,
      render: (value: number) => (
        <span style={{ color: '#1890ff' }}>{value}</span>
      ),
    },
    {
      title: intl.formatMessage({
        id: 'dashboard.column.usageRate',
        defaultMessage: '使用率',
      }),
      dataIndex: 'usageRate',
      key: 'usageRate',
      width: 150,
      align: 'center' as const,
      render: (value: number) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Progress
            percent={value}
            size="small"
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
            trailColor="#D9D9D9"
            style={{ width: 80, margin: 0 }}
            showInfo={false}
          />
          <Text style={{ minWidth: 35 }}>{value}%</Text>
        </div>
      ),
    },
    {
      title: intl.formatMessage({
        id: 'common.action',
        defaultMessage: '操作',
      }),
      key: 'action',
      width: 100,
      align: 'center' as const,
      fixed: 'right' as const,
      render: () => (
        <a style={{ color: '#1890ff', whiteSpace: 'nowrap' }}>
          {intl.formatMessage({
            id: 'dashboard.viewDetails',
            defaultMessage: '查看详情',
          })}
        </a>
      ),
    },
  ];

  // 最近预约记录表格列
  const bookingColumns = [
    {
      title: intl.formatMessage({
        id: 'credit.tab.users',
        defaultMessage: '用户',
      }),
      dataIndex: 'user',
      key: 'user',
    },
    {
      title: intl.formatMessage({
        id: 'booking.column.seat',
        defaultMessage: '座位',
      }),
      dataIndex: 'seat',
      key: 'seat',
    },
    {
      title: intl.formatMessage({
        id: 'booking.form.date',
        defaultMessage: '日期',
      }),
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: intl.formatMessage({
        id: 'seat.form.status',
        defaultMessage: '状态',
      }),
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: any) => {
        const statusMap: Record<string, string> = {
          processing: 'processing',
          success: 'success',
          default: 'default',
          error: 'error',
        };
        return <Tag color={statusMap[record.statusType]}>{status}</Tag>;
      },
    },
    {
      title: intl.formatMessage({
        id: 'common.action',
        defaultMessage: '操作',
      }),
      key: 'action',
      render: () => (
        <a style={{ color: '#1890ff' }}>
          {intl.formatMessage({ id: 'dashboard.view', defaultMessage: '查看' })}
        </a>
      ),
    },
  ];

  return (
    <div style={{ background: '#f0f2f5', minHeight: '100vh' }}>
      <PageContainer
        header={{
          title: intl.formatMessage({
            id: 'menu.dashboard',
            defaultMessage: '数据概览',
          }),
          ghost: true,
          extra: [
            <Button
              key="1"
              type={timeRange === 'today' ? 'primary' : 'default'}
              onClick={() => setTimeRange('today')}
            >
              {intl.formatMessage({
                id: 'dashboard.range.today',
                defaultMessage: '今日',
              })}
            </Button>,
            <Button
              key="2"
              type={timeRange === 'week' ? 'primary' : 'default'}
              onClick={() => setTimeRange('week')}
            >
              {intl.formatMessage({
                id: 'dashboard.range.week',
                defaultMessage: '本周',
              })}
            </Button>,
            <Button
              key="3"
              type={timeRange === 'month' ? 'primary' : 'default'}
              onClick={() => setTimeRange('month')}
            >
              {intl.formatMessage({
                id: 'dashboard.range.month',
                defaultMessage: '本月',
              })}
            </Button>,
            <Button key="4" type="primary" icon={<DownloadOutlined />}>
              {intl.formatMessage({
                id: 'dashboard.export',
                defaultMessage: '导出报表',
              })}
            </Button>,
          ],
        }}
      >
        {/* 统计卡片 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {statData.map((stat, index) => (
            <Col xs={24} sm={12} lg={6} key={index}>
              <Card bordered={false}>
                <Space
                  style={{ width: '100%', justifyContent: 'space-between' }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: '28px',
                        fontWeight: 600,
                        marginBottom: 8,
                      }}
                    >
                      {stat.value.toLocaleString()}
                    </div>
                    {stat.trend !== undefined && (
                      <div
                        style={{
                          fontSize: '12px',
                          color: stat.trend >= 0 ? '#52c41a' : '#ff4d4f',
                        }}
                      >
                        <ArrowUpOutlined rotate={stat.trend < 0 ? 180 : 0} />
                        <span style={{ marginLeft: 4 }}>
                          {Math.abs(stat.trend)}%
                        </span>
                        <span style={{ marginLeft: 4, color: '#8c8c8c' }}>
                          {stat.trendLabel}
                        </span>
                      </div>
                    )}
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

        {/* 图表区域 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={12}>
            <Card
              title={intl.formatMessage({
                id: 'dashboard.card.usageTrend',
                defaultMessage: '座位使用率趋势',
              })}
              bordered={false}
            >
              <div style={{ height: 320 }}>
                <Line {...lineConfig} style={{ height: 320 }} />
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card
              title={intl.formatMessage({
                id: 'dashboard.card.bookingStatus',
                defaultMessage: '预约状态分布',
              })}
              bordered={false}
            >
              <div
                style={{ height: 320, position: 'relative' }}
                key="pie-chart"
              >
                <Pie {...pieConfig} height={320} />
              </div>
            </Card>
          </Col>
        </Row>

        {/* 楼层座位状态和热门区域 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={14}>
            <Card
              title={intl.formatMessage({
                id: 'dashboard.card.floorStatus',
                defaultMessage: '楼层座位状态',
              })}
              bordered={false}
            >
              <Table
                columns={floorColumns}
                dataSource={floorData}
                pagination={false}
                size="middle"
                scroll={{ x: 800 }}
              />
            </Card>
          </Col>
          <Col xs={24} lg={10}>
            <Card
              title={intl.formatMessage({
                id: 'dashboard.card.hotAreas',
                defaultMessage: '今日热门区域',
              })}
              bordered={false}
            >
              <div style={{ height: 300, overflow: 'auto' }}>
                <Space
                  direction="vertical"
                  style={{ width: '100%' }}
                  size="middle"
                >
                  {hotAreasData.map((area) => (
                    <Card key={area.key} size="small" bordered={false}>
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
                          strokeColor={{
                            '0%': '#108ee9',
                            '100%': '#87d068',
                          }}
                          showInfo={false}
                        />
                        <Text type="secondary">预约次数：{area.count}</Text>
                      </Space>
                    </Card>
                  ))}
                </Space>
              </div>
            </Card>
          </Col>
        </Row>

        {/* 最近预约记录和活跃用户 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={14}>
            <Card
              title={intl.formatMessage({
                id: 'dashboard.card.recentBookings',
                defaultMessage: '最近预约记录',
              })}
              bordered={false}
              extra={
                <a>
                  {intl.formatMessage({
                    id: 'dashboard.viewAll',
                    defaultMessage: '查看全部',
                  })}
                </a>
              }
            >
              <Table
                columns={bookingColumns}
                dataSource={recentBookings}
                pagination={false}
                size="middle"
                scroll={{ x: 800 }}
              />
            </Card>
          </Col>
          <Col xs={24} lg={10}>
            <Card
              title={intl.formatMessage({
                id: 'dashboard.card.activeUsers',
                defaultMessage: '最近活跃用户',
              })}
              bordered={false}
              extra={
                <a>
                  {intl.formatMessage({
                    id: 'dashboard.viewAll',
                    defaultMessage: '查看全部',
                  })}
                </a>
              }
            >
              <div style={{ height: 300, overflow: 'auto' }}>
                <Space
                  direction="vertical"
                  style={{ width: '100%' }}
                  size="middle"
                >
                  {activeUsers.map((user) => (
                    <Card key={user.key} size="small" bordered={false}>
                      <Space>
                        <Avatar src={user.avatar} size={40} />
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
                          <div>
                            <Text type="secondary">
                              预约次数：{user.bookings} | 最后活跃：
                              {user.lastActive}
                            </Text>
                          </div>
                        </div>
                      </Space>
                    </Card>
                  ))}
                </Space>
              </div>
            </Card>
          </Col>
        </Row>
      </PageContainer>
    </div>
  );
};

export default Dashboard;
