import { request } from '@umijs/max';

export async function getAuditLogs(params?: any) {
  return request('/api/audit-logs', {
    method: 'GET',
    params,
  });
}

export async function getAuditLogsExportUrl(params?: Record<string, any>) {
  const search = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    search.set(key, String(value));
  });
  const query = search.toString();
  return `/api/audit-logs/export${query ? `?${query}` : ''}`;
}
