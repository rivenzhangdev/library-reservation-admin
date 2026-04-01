import { request } from '@umijs/max';

/**
 * 获取预约列表
 */
export async function getBookingList(params?: any) {
  return request('/api/bookings', {
    method: 'GET',
    params,
  });
}

/**
 * 获取预约详情
 */
export async function getBookingDetail(id: number) {
  return request(`/api/bookings/${id}`, {
    method: 'GET',
  });
}

/**
 * 取消预约
 */
export async function cancelBooking(id: number) {
  return request(`/api/bookings/cancel/${id}`, {
    method: 'POST',
  });
}

/**
 * 删除预约
 */
export async function deleteBooking(id: number) {
  return request(`/api/bookings/${id}`, {
    method: 'DELETE',
  });
}

/**
 * 签到
 */
export async function checkIn(id: number) {
  return request(`/api/bookings/checkin/${id}`, {
    method: 'POST',
  });
}

/**
 * 创建预约
 */
export async function createBooking(data: any) {
  return request('/api/bookings', {
    method: 'POST',
    data,
  });
}

/**
 * 批量取消预约
 */
export async function batchCancelBookings(
  bookingIds: (string | number)[],
  reason?: string,
) {
  return request('/api/bookings/batch/cancel', {
    method: 'PUT',
    data: { bookingIds, reason },
  });
}

/**
 * 更新预约状态
 */
export async function updateBookingStatus(
  id: number | string,
  status: string,
  reason?: string,
) {
  return request(`/api/bookings/status/${id}`, {
    method: 'PUT',
    data: { status, reason },
  });
}
