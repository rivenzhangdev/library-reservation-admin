import { request } from '@umijs/max';

/**
 * 获取座位列表
 */
export async function getSeatList(params?: any) {
  return request('/api/seat/list', {
    method: 'GET',
    params,
  });
}

/**
 * 获取座位详情
 */
export async function getSeatDetail(id: number) {
  return request(`/api/seat/${id}`, {
    method: 'GET',
  });
}

/**
 * 创建座位
 */
export async function createSeat(data: any) {
  const res: any = await request('/api/seat', {
    method: 'POST',
    data,
    getResponse: true,
  });
  if (res?.data?.success === false) {
    throw new Error(res.data.error?.message || 'Create seat failed');
  }
  return res?.data;
}

/**
 * 更新座位
 */
export async function updateSeat(id: number, data: any) {
  return request(`/api/seat/${id}`, {
    method: 'PUT',
    data,
  });
}

/**
 * 删除座位
 */
export async function deleteSeat(id: number) {
  return request(`/api/seat/${id}`, {
    method: 'DELETE',
  });
}

/**
 * 批量创建座位
 */
export async function batchCreateSeats(data: any[]) {
  const res: any = await request('/api/seat/batch', {
    method: 'POST',
    data,
    getResponse: true,
  });
  if (res?.data?.success === false) {
    throw new Error(res.data.error?.message || 'Batch create seats failed');
  }
  return res?.data;
}

/**
 * 批量更新座位状态
 */
export async function batchUpdateSeatStatus(seatIds: string[], status: number) {
  return request('/api/seat/batch', {
    method: 'PUT',
    data: { seatIds, status },
  });
}
