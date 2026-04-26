import { request } from '@umijs/max';

function ensureSuccess(response: any, fallbackMessage: string) {
  if (response && response.success === false) {
    const backendMessage =
      response?.error?.message || response?.message || fallbackMessage;
    const error = new Error(String(backendMessage));
    (error as any).data = response;
    throw error;
  }
  return response;
}

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
  const res = await request(`/api/bookings/cancel/${id}`, {
    method: 'POST',
  });
  return ensureSuccess(res, 'Failed to cancel booking');
}

/**
 * 删除预约
 */
export async function deleteBooking(id: number) {
  const res = await request(`/api/bookings/${id}`, {
    method: 'DELETE',
  });
  return ensureSuccess(res, 'Failed to delete booking');
}

/**
 * 签到
 */
export async function checkIn(id: number) {
  const res = await request(`/api/bookings/checkin/${id}`, {
    method: 'POST',
  });
  return ensureSuccess(res, 'Check-in failed');
}

/**
 * 签退
 */
export async function checkOut(id: number) {
  const res = await request(`/api/bookings/checkout/${id}`, {
    method: 'POST',
  });
  return ensureSuccess(res, 'Check-out failed');
}

/**
 * 创建预约
 */
export async function createBooking(data: any) {
  const res = await request('/api/bookings', {
    method: 'POST',
    data,
  });
  return ensureSuccess(res, 'Failed to create booking');
}

/**
 * 批量取消预约
 */
export async function batchCancelBookings(
  bookingIds: (string | number)[],
  reason?: string,
) {
  const res = await request('/api/bookings/batch/cancel', {
    method: 'PUT',
    data: { bookingIds, reason },
  });
  return ensureSuccess(res, 'Failed to batch cancel bookings');
}

/**
 * 更新预约状态
 */
export async function updateBookingStatus(
  id: number | string,
  status: string,
  reason?: string,
) {
  const res = await request(`/api/bookings/status/${id}`, {
    method: 'PUT',
    data: { status, reason },
  });
  return ensureSuccess(res, 'Failed to update booking status');
}
