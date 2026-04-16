import { request } from '@umijs/max';

/**
 * 获取时间段配置
 */
export async function getConfigTimeSlots() {
  return request('/api/config/time-slots', {
    method: 'GET',
  });
}

export async function createConfigTimeSlot(data: any) {
  return request('/api/config/time-slots', {
    method: 'POST',
    data,
  });
}

export async function updateConfigTimeSlot(id: number | string, data: any) {
  return request(`/api/config/time-slots/${id}`, {
    method: 'PUT',
    data,
  });
}

export async function deleteConfigTimeSlot(id: number | string) {
  return request(`/api/config/time-slots/${id}`, {
    method: 'DELETE',
  });
}

export async function getConfigSeatTypes() {
  return request('/api/config/seat-types', {
    method: 'GET',
  });
}

export async function createConfigSeatType(data: any) {
  return request('/api/config/seat-types', {
    method: 'POST',
    data,
  });
}

export async function updateConfigSeatType(id: number | string, data: any) {
  return request(`/api/config/seat-types/${id}`, {
    method: 'PUT',
    data,
  });
}

export async function deleteConfigSeatType(id: number | string) {
  return request(`/api/config/seat-types/${id}`, {
    method: 'DELETE',
  });
}

export async function getConfigSeatFacilities() {
  return request('/api/config/seat-facilities', {
    method: 'GET',
  });
}

export async function createConfigSeatFacility(data: any) {
  return request('/api/config/seat-facilities', {
    method: 'POST',
    data,
  });
}

export async function updateConfigSeatFacility(id: number | string, data: any) {
  return request(`/api/config/seat-facilities/${id}`, {
    method: 'PUT',
    data,
  });
}

export async function deleteConfigSeatFacility(id: number | string) {
  return request(`/api/config/seat-facilities/${id}`, {
    method: 'DELETE',
  });
}
