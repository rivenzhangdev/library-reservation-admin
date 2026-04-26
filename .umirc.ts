import { defineConfig } from '@umijs/max';

export default defineConfig({
  antd: {},
  access: {},
  model: {},
  initialState: {},
  request: {},
  locale: {
    default: 'zh-CN',
    antd: true,
    title: false,
    baseNavigator: true,
    baseSeparator: '-',
  },
  layout: {
    title: '图书馆管理后台',
    logo: '/logo.png',
    unAccessible: '/403',
  },
  // 本地开发时将 /api 请求代理到后端服务，优先使用环境变量 BACKEND_BASE_URL
  // 启动示例（PowerShell）：
  // $env:BACKEND_URL='http://localhost:3001'; pnpm dev
  proxy: {
    '/api': {
      target:
        process.env.BACKEND_BASE_URL ||
        process.env.BACKEND_URL ||
        'http://localhost:3001',
      changeOrigin: true,
      secure: false,
    },
  },
  routes: [
    {
      path: '/login',
      component: 'Login',
      layout: false,
    },
    {
      path: '/',
      redirect: '/data-management/dashboard',
    },
    {
      path: '/data-management',
      name: 'dataManagement',
      icon: 'LineChartOutlined',
      access: 'canSeeAdmin',
      routes: [
        {
          path: '/data-management',
          redirect: '/data-management/dashboard',
        },
        {
          path: 'dashboard',
          name: 'dashboard',
          icon: 'LineChartOutlined',
          component: 'Dashboard',
          access: 'canSeeAdmin',
        },
        {
          path: 'operations',
          name: 'operationDashboard',
          icon: 'DashboardOutlined',
          component: 'OperationDashboard',
          access: 'canSeeAdmin',
        },
        {
          path: 'audit-logs',
          name: 'auditLogs',
          icon: 'FileSearchOutlined',
          component: 'AuditLog',
          access: 'canSeeAdmin',
        },
      ],
    },
    {
      path: '/user',
      name: 'user',
      icon: 'TeamOutlined',
      component: 'User',
      access: 'canSeeAdmin',
    },
    {
      path: '/change-requests',
      name: 'changeRequests',
      icon: 'SwapOutlined',
      access: 'canReview',
      routes: [
        {
          path: '/change-requests',
          redirect: '/change-requests/student-id-change-requests',
        },
        {
          path: '/change-requests/student-id-change-requests',
          name: 'studentIdChangeRequests',
          icon: 'SolutionOutlined',
          component: 'change-requests/StudentIdChangeRequests',
          access: 'canSeeAdmin',
        },
        {
          path: '/change-requests/phone-change-requests',
          name: 'phoneChangeRequests',
          icon: 'MobileOutlined',
          component: 'change-requests/PhoneChangeRequests',
          access: 'canSeeAdmin',
        },
      ],
    },
    {
      path: '/booking',
      name: 'booking',
      icon: 'CalendarOutlined',
      access: 'canSeeManagement',
      routes: [
        {
          path: '/booking',
          redirect: '/booking/list',
        },
        {
          path: 'list',
          name: 'bookingList',
          icon: 'TableOutlined',
          component: 'Booking',
          access: 'canSeeAdmin',
        },
        {
          path: 'rules',
          name: 'bookingRules',
          icon: 'ControlOutlined',
          component: 'BookingRules',
          access: 'canSeeManagement',
        },
        {
          path: 'change-requests',
          name: 'bookingChangeRequests',
          icon: 'AuditOutlined',
          component: 'Approval',
          access: 'canReview',
        },
      ],
    },
    {
      path: '/booking-change-requests',
      redirect: '/booking/change-requests',
      hideInMenu: true,
    },
    {
      path: '/seat',
      name: 'seat',
      icon: 'AppstoreOutlined',
      component: 'Seat',
      access: 'canSeeAdmin',
    },
    {
      path: '/activity',
      name: 'activity',
      icon: 'GiftOutlined',
      component: 'Activity',
      access: 'canSeeAdmin',
    },

    {
      path: '/notification',
      name: 'notification',
      icon: 'BellOutlined',
      component: 'Notification',
      access: 'canSeeAdmin',
    },
    {
      path: '/feedback',
      name: 'feedback',
      icon: 'MessageOutlined',
      access: 'canSeeAdmin',
      routes: [
        {
          path: '/feedback',
          component: 'Feedback',
        },
        {
          path: '/feedback/:id',
          component: 'Feedback/Detail',
          hideInMenu: true,
        },
      ],
    },
    {
      path: '/uploads',
      name: 'uploads',
      icon: 'PictureOutlined',
      component: 'Uploads',
      access: 'canSeeAdmin',
    },
    {
      path: '/credit',
      name: 'credit',
      icon: 'StarOutlined',
      component: 'Credit',
      access: 'canSeeAdmin',
    },
    {
      path: '/third-party-services',
      name: 'thirdPartyServices',
      icon: 'ApiOutlined',
      access: 'canSeeAdmin',
      routes: [
        {
          path: '/third-party-services',
          redirect: '/third-party-services/student-registry',
        },
        {
          path: '/third-party-services/student-registry',
          name: 'studentRegistry',
          icon: 'SolutionOutlined',
          component: 'Management/StudentRegistry',
          access: 'canSeeAdmin',
        },
      ],
    },
    {
      path: '/management',
      name: 'management',
      icon: 'ApartmentOutlined',
      component: 'Management',
      access: 'canSeeAdmin',
    },
    {
      path: '/system-config',
      name: 'systemConfig',
      icon: 'SettingOutlined',
      component: 'SystemConfig',
      access: 'canSeeAdmin',
    },
    {
      path: '/floor',
      component: 'Floor',
      hideInMenu: true,
      access: 'canSeeAdmin',
    },
    {
      path: '/zone',
      component: 'Zone',
      hideInMenu: true,
      access: 'canSeeAdmin',
    },
    {
      path: '/audit-logs',
      redirect: '/data-management/audit-logs',
      hideInMenu: true,
    },
    {
      path: '/403',
      component: '403',
      layout: false,
      hideInMenu: true,
    },
    {
      path: '*',
      component: '404',
      layout: false,
      hideInMenu: true,
    },
  ],
  npmClient: 'pnpm',
  favicons: ['./public/favicon.icon'],
});
