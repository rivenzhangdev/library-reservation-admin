import { request } from '@umijs/max';

export async function getPhoneChangeRequests(params?: any) {
  return request('/api/phone-change-requests', {
    method: 'GET',
    params,
  });
}

export async function approvePhoneChangeRequest(
  id: string,
  reviewComment?: string,
) {
  return request(`/api/phone-change-requests/${id}/approve`, {
    method: 'PUT',
    data: { reviewComment },
  });
}

export async function rejectPhoneChangeRequest(
  id: string,
  reviewComment?: string,
) {
  return request(`/api/phone-change-requests/${id}/reject`, {
    method: 'PUT',
    data: { reviewComment },
  });
}
