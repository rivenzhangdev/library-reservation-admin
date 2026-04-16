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
    logo: false,
  },
  // 本地开发时将 /api 请求代理到后端服务，优先使用环境变量 BACKEND_URL
  // 启动示例（PowerShell）：
  // $env:BACKEND_URL='http://localhost:3001'; pnpm dev
  proxy: {
    '/api': {
      target: process.env.BACKEND_URL || 'http://localhost:3001',
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
      redirect: '/dashboard',
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      icon: 'LineChartOutlined',
      component: 'Dashboard',
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
      access: 'canSeeAdmin',
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
      component: 'Booking',
      access: 'canSeeAdmin',
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
      path: '/management',
      name: 'management',
      icon: 'AppstoreAddOutlined',
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
  ],
  npmClient: 'pnpm',
});
