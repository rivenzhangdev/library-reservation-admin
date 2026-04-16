import { request } from '@umijs/max';

export async function getStudentIdChangeRequests(params?: any) {
  return request('/api/student-id-change-requests', {
    method: 'GET',
    params,
  });
}

export async function approveStudentIdChangeRequest(
  id: string,
  reviewComment?: string,
) {
  return request(`/api/student-id-change-requests/${id}/approve`, {
    method: 'PUT',
    data: { reviewComment },
  });
}

export async function rejectStudentIdChangeRequest(
  id: string,
  reviewComment?: string,
) {
  return request(`/api/student-id-change-requests/${id}/reject`, {
    method: 'PUT',
    data: { reviewComment },
  });
}
