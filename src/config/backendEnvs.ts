export type BackendEnvKey = 'development' | 'test' | 'uat' | 'production';

export interface BackendEnv {
  key: BackendEnvKey;
  label: string;
  baseUrl: string;
}

const BACKEND_ENVS_FALLBACK: BackendEnv[] = [
  {
    key: 'development',
    label: 'Development',
    baseUrl: 'http://localhost:3000',
  },
  { key: 'test', label: 'Test', baseUrl: 'http://localhost:3001' },
  { key: 'uat', label: 'UAT', baseUrl: 'http://localhost:3002' },
  { key: 'production', label: 'Production', baseUrl: 'http://localhost:3000' },
];

export const BACKEND_ENVS: BackendEnv[] = (() => {
  try {
    // Prefer a shared workspace config if present
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const shared = require('../../../backend-envs.json');
    if (shared && Array.isArray(shared.BACKEND_ENVS)) {
      return shared.BACKEND_ENVS as BackendEnv[];
    }
  } catch (e) {
    // ignore and fallback
  }
  return BACKEND_ENVS_FALLBACK;
})();

export const BACKEND_ENV_KEY = 'backend_env';
export const BACKEND_BASE_KEY = 'backend_base_url';

export function getBackendEnvKey(): string | null {
  try {
    if (typeof window !== 'undefined')
      return localStorage.getItem(BACKEND_ENV_KEY);
  } catch (e) {
    // ignore
  }
  return null;
}

export function setBackendEnv(key: BackendEnvKey) {
  try {
    const found = BACKEND_ENVS.find((e) => e.key === key);
    if (found && typeof window !== 'undefined') {
      localStorage.setItem(BACKEND_ENV_KEY, key);
      localStorage.setItem(BACKEND_BASE_KEY, found.baseUrl);
    }
  } catch (e) {
    // ignore
  }
}

export function getBackendBaseUrl(): string {
  try {
    if (typeof window !== 'undefined') {
      const b = localStorage.getItem(BACKEND_BASE_KEY);
      if (b) return b;
    }
  } catch (e) {
    // ignore
  }
  // fallback to development
  const dev = BACKEND_ENVS.find((e) => e.key === 'development');
  return dev?.baseUrl || '';
}

/**
 * 简单检测每个环境的可达性。
 * - 优先检测 swagger 页面（若存在则视为完整可用）
 * - 否则尝试访问根路径以判断是否至少有响应
 */
export async function detectBackendStatuses(
  timeout = 3000,
): Promise<Record<string, { status: 'down' | 'partial' | 'ok' }>> {
  const results: Record<string, { status: 'down' | 'partial' | 'ok' }> = {};
  for (const env of BACKEND_ENVS) {
    const base = env.baseUrl.replace(/\/$/, '');
    // try swagger page
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      const resp = await fetch(`${base}/swagger-index.html`, {
        method: 'GET',
        signal: controller.signal,
        mode: 'cors',
      }).catch(() => null);
      clearTimeout(id);
      if (resp && resp.ok) {
        results[env.key] = { status: 'ok' };
        continue;
      }
    } catch (e) {
      // ignore
    }

    // try root path
    try {
      const controller2 = new AbortController();
      const id2 = setTimeout(() => controller2.abort(), timeout);
      const resp2 = await fetch(base, {
        method: 'GET',
        signal: controller2.signal,
        mode: 'cors',
      }).catch(() => null);
      clearTimeout(id2);
      if (resp2) {
        results[env.key] = { status: resp2.ok ? 'partial' : 'partial' };
      } else {
        results[env.key] = { status: 'down' };
      }
    } catch (e) {
      results[env.key] = { status: 'down' };
    }
  }
  return results;
}
