import { request } from '@umijs/max';

/** 获取楼层列表 */
export async function getFloors(params?: any) {
  const res: any = await request('/api/floors', {
    method: 'GET',
    params,
  });
  const raw = res?.data;
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.list)) return raw.list;
  return [];
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
