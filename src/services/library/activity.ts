import { request } from '@umijs/max';

/**
 * 获取活动列表
 */
export async function getActivityList(params?: any) {
  return request('/api/activity/list', {
    method: 'GET',
    params,
  });
}

/**
 * 获取活动详情
 */
export async function getActivityDetail(id: string) {
  return request(`/api/activity/${id}`, {
    method: 'GET',
  });
}

/**
 * 创建活动
 */
export async function createActivity(data: any) {
  return request('/api/activity', {
    method: 'POST',
    data,
  });
}

/**
 * 更新活动
 */
export async function updateActivity(id: string, data: any) {
  return request(`/api/activity/${id}`, {
    method: 'PUT',
    data,
  });
}

/**
 * 删除活动
 */
export async function deleteActivity(id: string) {
  return request(`/api/activity/${id}`, {
    method: 'DELETE',
  });
}

/**
 * 报名活动
 */
export async function joinActivity(id: string) {
  return request(`/api/activity/${id}/join`, {
    method: 'POST',
  });
}

/**
 * 取消报名
 */
export async function cancelActivityJoin(id: string) {
  return request(`/api/activity/${id}/cancel`, {
    method: 'POST',
  });
}
