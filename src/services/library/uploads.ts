import { request } from '@umijs/max';

export async function getUploads(params?: any) {
  return request('/api/uploads', {
    method: 'GET',
    params,
  });
}

export async function deleteUpload(id: string) {
  const res = await request(`/api/uploads/${id}`, {
    method: 'DELETE',
  });
  // 如果后端返回 { success: false, error: {...} }，将其作为异常抛出，避免前端误判为成功
  if (res && res.success === false) {
    throw new Error(res.error?.message || '删除失败');
  }
  return res;
}

export default { getUploads, deleteUpload };
