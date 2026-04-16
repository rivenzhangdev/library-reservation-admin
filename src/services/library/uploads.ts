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
  if (res && res.success === false) {
    throw new Error(res.error?.message || '删除失败');
  }
  return res;
}

export async function deleteUploads(ids: string[]) {
  const res = await request('/api/uploads/batch-delete', {
    method: 'POST',
    data: { ids },
  });
  if (res && res.success === false) {
    throw new Error(res.error?.message || '批量删除失败');
  }
  return res;
}

export default { getUploads, deleteUpload, deleteUploads };
