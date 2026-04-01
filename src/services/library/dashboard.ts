import { request } from '@umijs/max';

/**
 * 获取仪表盘数据
 */
export async function getDashboardData() {
  return request('/api/dashboard', {
    method: 'GET',
  });
}

/**
 * 获取统计数据
 */
export async function getStatistics(params?: any) {
  return request('/api/statistics', {
    method: 'GET',
    params,
  });
}
