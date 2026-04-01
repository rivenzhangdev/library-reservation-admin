import { request } from '@umijs/max';

/**
 * 获取通知列表
 */
export async function getNotificationList(params?: any) {
  return request('/api/notification/list', {
    method: 'GET',
    params,
  });
}

/**
 * 获取通知详情
 */
export async function getNotificationDetail(id: string) {
  return request(`/api/notification/${id}`, {
    method: 'GET',
  });
}

/**
 * 发送通知
 */
export async function sendNotification(data: any) {
  return request('/api/notification', {
    method: 'POST',
    data,
  });
}

/**
 * 标记为已读
 */
export async function markAsRead(id: string) {
  return request(`/api/notification/${id}/read`, {
    method: 'POST',
  });
}

/**
 * 批量标记为已读
 */
export async function batchMarkAsRead(ids: string[]) {
  return request('/api/notification/batch-read', {
    method: 'POST',
    data: { ids },
  });
}

/**
 * 删除通知
 */
export async function deleteNotification(id: string) {
  return request(`/api/notification/${id}`, {
    method: 'DELETE',
  });
}
