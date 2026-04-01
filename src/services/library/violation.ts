import { request } from '@umijs/max';

/**
 * 获取违规记录列表
 */
export async function getViolationList(params?: any) {
  return request('/api/violation/list', {
    method: 'GET',
    params,
  });
}

/**
 * 删除违规记录
 */
export async function deleteViolation(id: string) {
  return request(`/api/violation/${id}`, {
    method: 'DELETE',
  });
}
