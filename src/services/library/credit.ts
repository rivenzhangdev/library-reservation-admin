import { request } from '@umijs/max';

/**
 * 获取信用记录列表
 */
export async function getCreditRecordList(params?: any) {
  return request('/api/user/credit/records', {
    method: 'GET',
    params,
  });
}

/**
 * 添加信用分
 */
export async function addCreditPoints(
  userId: string,
  points: number,
  reason: string,
) {
  const res: any = await request('/api/credit/add', {
    method: 'POST',
    data: { userId, points, reason },
  });
  if (res?.success === false) {
    throw new Error(res?.error?.message || 'Adjust failed');
  }
  return res;
}

/**
 * 扣除信用分
 */
export async function deductCreditPoints(
  userId: string,
  points: number,
  reason: string,
) {
  const res: any = await request('/api/credit/deduct', {
    method: 'POST',
    data: { userId, points, reason },
  });
  if (res?.success === false) {
    throw new Error(res?.error?.message || 'Adjust failed');
  }
  return res;
}

/**
 * 获取用户信用分
 */
export async function getUserCreditScore(userId: string) {
  return request(`/api/credit/score/${userId}`, {
    method: 'GET',
  });
}

/**
 * 更新信用等级配置
 */
export async function updateCreditLevels(levels: any[]) {
  return request('/api/credit/levels', {
    method: 'PUT',
    data: { levels },
  });
}

/**
 * 获取黑名单用户
 */
export async function getBlacklistedUsers(params?: any) {
  return request('/api/credit/blacklist', {
    method: 'GET',
    params,
  });
}
