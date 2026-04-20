import { request } from '@umijs/max';

/** 获取看板统计概览 */
export async function getDashboardStats() {
  return request('/api/dashboard/stats', { method: 'GET' });
}

/** 获取预约趋势（最近 N 天） */
export async function getDashboardTrends(params?: { days?: number }) {
  return request('/api/dashboard/trends', { method: 'GET', params });
}
