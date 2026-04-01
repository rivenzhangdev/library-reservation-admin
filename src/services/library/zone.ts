import { request } from '@umijs/max';

/** 获取区域列表 */
export async function getZones(params?: any) {
  return request('/api/zones', {
    method: 'GET',
    params,
  });
}

/** 创建区域 */
export async function createZone(data: any) {
  return request('/api/zones', {
    method: 'POST',
    data,
  });
}

/** 更新区域 */
export async function updateZone(id: string, data: any) {
  return request(`/api/zones/${id}`, {
    method: 'PUT',
    data,
  });
}

/** 删除区域 */
export async function deleteZone(id: string) {
  return request(`/api/zones/${id}`, {
    method: 'DELETE',
  });
}

/** 批量更新区域状态 */
export async function batchUpdateZoneStatus(data: {
  ids: string[];
  status: number;
}) {
  return request('/api/zones/batch/status', {
    method: 'PUT',
    data,
  });
}
