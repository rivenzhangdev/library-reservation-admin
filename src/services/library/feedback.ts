import { request } from '@umijs/max';

export async function submitFeedback(data: any) {
  return request('/api/feedback', {
    method: 'POST',
    data,
  });
}

export async function getMyFeedbacks(params?: any) {
  return request('/api/feedback/my', {
    method: 'GET',
    params,
  });
}

export async function getAllFeedbacks(params?: any) {
  return request('/api/feedback/list', {
    method: 'GET',
    params,
  });
}

export async function getFeedbackDetail(id: string) {
  return request(`/api/feedback/${id}`, {
    method: 'GET',
  });
}

export async function processFeedback(id: string, data: any) {
  return request(`/api/feedback/${id}`, {
    method: 'PUT',
    data,
  });
}

export async function updateStatus(id: string, data: any) {
  return request(`/api/feedback/status/${id}`, {
    method: 'PUT',
    data,
  });
}

export async function addComment(id: string, data: any) {
  return request(`/api/feedback/comment/${id}`, {
    method: 'POST',
    data,
  });
}

export async function exportFeedbacks(params?: any) {
  return request('/api/feedback/export', {
    method: 'GET',
    params,
  });
}

export async function deleteFeedbackImage(id: string, data: any) {
  /**
   * 注意：该接口仅从反馈中移除图片的关联（解除 refType/refId），
   * 不会立即删除存储文件或 Upload 元数据。真正删除文件需在“上传管理”模块中由管理员确认执行。
   */
  return request(`/api/feedback/image/${id}`, {
    method: 'DELETE',
    data,
  });
}
