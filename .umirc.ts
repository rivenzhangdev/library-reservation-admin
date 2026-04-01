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
  ],
  npmClient: 'pnpm',
});
