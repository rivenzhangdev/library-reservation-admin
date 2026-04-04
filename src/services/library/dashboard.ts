import { request } from '@umijs/max';

/**
 * 获取仪表盘数据
 */
export async function getDashboardData() {
  return request('/api/dashboard', { method: 'GET' });
}

/**
 * 获取统计数据
 */
export async function getStatistics(params?: any) {
  return request('/api/statistics', { method: 'GET', params });
}

/** 获取楼层座位统计 */
export async function getDashboardFloors() {
  return request('/api/dashboard/floors', { method: 'GET' });
}

/** 获取最近预约记录 */
export async function getRecentBookings() {
  return request('/api/dashboard/recent-bookings', { method: 'GET' });
}

/** 获取活跃用户 */
export async function getActiveUsers() {
  return request('/api/dashboard/active-users', { method: 'GET' });
}

/** 获取今日热门区域 */
export async function getHotAreas() {
  return request('/api/dashboard/hot-areas', { method: 'GET' });
}

/** 获取未读通知数 */
export async function getUnreadNotificationCount() {
  return request('/api/notification/unread-count', { method: 'GET' });
}
