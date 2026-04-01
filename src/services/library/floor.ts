import { request } from '@umijs/max';

/** 获取楼层列表 */
export async function getFloors(params?: any) {
  return request('/api/floors', {
    method: 'GET',
    params,
  });
}

/** 创建楼层 */
export async function createFloor(data: any) {
  return request('/api/floors', {
    method: 'POST',
    data,
  });
}

/** 更新楼层 */
export async function updateFloor(id: string, data: any) {
  return request(`/api/floors/${id}`, {
    method: 'PUT',
    data,
  });
}

/** 删除楼层 */
export async function deleteFloor(id: string) {
  return request(`/api/floors/${id}`, {
    method: 'DELETE',
  });
}
