import { request } from '@umijs/max';

export interface BookingChangeRequestQuery {
  page?: number;
  pageSize?: number;
  status?: string;
  userId?: string;
  changeType?: string;
}

export function getBookingChangeRequestsAdmin(
  params?: BookingChangeRequestQuery,
) {
  return request('/api/booking/change-requests/admin', {
    method: 'GET',
    params,
  });
}

export function approveBookingChangeRequest(
  id: number | string,
  reviewComment?: string,
) {
  return request(`/api/booking/change-requests/${id}/approve`, {
    method: 'PUT',
    data: { reviewComment },
  });
}

export function rejectBookingChangeRequest(
  id: number | string,
  reviewComment?: string,
) {
  return request(`/api/booking/change-requests/${id}/reject`, {
    method: 'PUT',
    data: { reviewComment },
  });
}
