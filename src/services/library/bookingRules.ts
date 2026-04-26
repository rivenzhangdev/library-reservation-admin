import { request } from '@umijs/max';

export interface BookingRuleItem {
  id: number;
  ruleKey: string;
  ruleValue: string;
  description?: string | null;
  category: 'booking' | 'renewal' | 'cancel' | 'general';
  enabled: boolean;
  updatedBy?: string | null;
  updatedByName?: string | null;
  updatedAt?: string;
}

/**
 * GET /api/booking/rules
 */
export async function getBookingRules(params?: {
  category?: string;
  enabled?: boolean;
  ruleKey?: string;
  current?: number;
  pageSize?: number;
}) {
  return request('/api/booking/rules', {
    method: 'GET',
    params,
  });
}

/**
 * POST /api/booking/rules/init-defaults
 */
export async function initDefaultBookingRules() {
  return request('/api/booking/rules/init-defaults', {
    method: 'POST',
  });
}

export async function initDefaultBookingRulesWithMode(params: {
  mode: 'merge' | 'replace';
  pruneCustom?: boolean;
}) {
  return request('/api/booking/rules/init-defaults', {
    method: 'POST',
    data: params,
  });
}

/**
 * PUT /api/booking/rules/:ruleKey
 */
export async function updateBookingRule(
  ruleKey: string,
  data: { ruleValue?: string; description?: string; enabled?: boolean },
) {
  return request(`/api/booking/rules/${encodeURIComponent(ruleKey)}`, {
    method: 'PUT',
    data,
  });
}

/**
 * DELETE /api/booking/rules/:ruleKey
 */
export async function deleteBookingRule(ruleKey: string) {
  return request(`/api/booking/rules/${encodeURIComponent(ruleKey)}`, {
    method: 'DELETE',
  });
}
