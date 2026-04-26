import { request } from '@umijs/max';

/**
 * 查询孤儿预约（未绑定用户的活跃预约）
 */
export async function getOrphanBookings() {
  return request('/api/bookings/orphans', {
    method: 'GET',
  });
}

/**
 * 一键修复孤儿预约（取消并释放座位）
 */
export async function repairOrphanBookings() {
  return request('/api/bookings/orphans/repair', {
    method: 'POST',
  });
}
