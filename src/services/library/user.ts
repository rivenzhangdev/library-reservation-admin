import { request } from '@umijs/max';

/**
 * 获取用户列表
 */
export async function getUserList(params?: any) {
  return request('/api/user/list', {
    method: 'GET',
    params,
  });
}

/**
 * 获取用户详情
 */
export async function getUserDetail(id: string) {
  return request(`/api/user/${id}`, {
    method: 'GET',
  });
}

/**
 * 创建用户
 */
export async function createUser(data: any) {
  return request('/api/user', {
    method: 'POST',
    data,
  });
}

/**
 * 更新用户
 */
export async function updateUser(id: string, data: any) {
  return request(`/api/user/${id}`, {
    method: 'PUT',
    data,
  });
}

/**
 * 删除用户
 */
export async function deleteUser(id: string) {
  return request(`/api/user/${id}`, {
    method: 'DELETE',
  });
}

/**
 * 更新用户状态（active/inactive/blacklisted）
 */
export async function updateUserStatus(
  id: string,
  status: string,
  reason?: string,
) {
  return request(`/api/user/${id}/status`, {
    method: 'PUT',
    data: { status, reason },
  });
}

/**
 * 批量更新用户状态
 */
export async function batchUpdateUserStatus(userIds: string[], status: number) {
  return request('/api/user/batch/status', {
    method: 'PUT',
    data: { userIds, status },
  });
}

/**
 * 登录（示例）
 */
export async function login(data: any) {
  return request('/api/login', {
    method: 'POST',
    data,
  });
}
