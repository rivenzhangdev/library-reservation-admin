import backendEnvsJson from '../../config/backend-envs.json';

export type BackendEnvKey = string;
export interface BackendEnv {
  key: BackendEnvKey;
  label: string;
  baseUrl: string;
  lanBaseUrl?: string;
  isProd?: boolean;
}

export const BACKEND_ENVS: BackendEnv[] =
  backendEnvsJson && Array.isArray(backendEnvsJson.BACKEND_ENVS)
    ? backendEnvsJson.BACKEND_ENVS
    : [];

export const BACKEND_ENV_KEY = 'backend_env';
export const BACKEND_BASE_KEY = 'backend_base_url';
export const BOOT_BACKEND_ENV_KEY: BackendEnvKey = 'development';

export function getBackendEnvKey(): string | null {
  try {
    if (typeof window !== 'undefined')
      return localStorage.getItem(BACKEND_ENV_KEY);
  } catch (e) {
    // ignore
  }
  return null;
}

export function clearBackendAuthStorage() {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
    }
  } catch (e) {
    // ignore
  }
}

export function setBackendEnv(
  key: BackendEnvKey,
  options?: { clearAuth?: boolean },
) {
  try {
    const found = BACKEND_ENVS.find((e) => e.key === key);
    if (found && typeof window !== 'undefined') {
      localStorage.setItem(BACKEND_ENV_KEY, key);
      localStorage.setItem(BACKEND_BASE_KEY, found.baseUrl);
      if (options?.clearAuth) {
        clearBackendAuthStorage();
      }
    }
  } catch (e) {
    // ignore
  }
}

export function setBackendBaseUrl(
  baseUrl: string,
  key?: BackendEnvKey,
  options?: { clearAuth?: boolean },
) {
  try {
    if (typeof window !== 'undefined') {
      if (key) {
        localStorage.setItem(BACKEND_ENV_KEY, key);
      }
      localStorage.setItem(BACKEND_BASE_KEY, baseUrl);
      if (options?.clearAuth) {
        clearBackendAuthStorage();
      }
    }
  } catch (e) {
    // ignore
  }
}

export function resetBackendEnvStorageOnLaunch(
  key: BackendEnvKey = BOOT_BACKEND_ENV_KEY,
) {
  try {
    if (typeof window === 'undefined') return;

    localStorage.removeItem(BACKEND_ENV_KEY);
    localStorage.removeItem(BACKEND_BASE_KEY);

    const found =
      BACKEND_ENVS.find((item) => item.key === key) || BACKEND_ENVS[0];
    if (found?.key) {
      setBackendEnv(found.key);
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
 * - 尝试访问根路径判断服务是否已启动
 */
export async function detectBackendStatuses(
  timeout = 3000,
): Promise<Record<string, { status: 'down' | 'partial' | 'ok' }>> {
  const results: Record<string, { status: 'down' | 'partial' | 'ok' }> = {};
  for (const env of BACKEND_ENVS) {
    const base = env.baseUrl.replace(/\/$/, '');

    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      const resp = await fetch(base, {
        method: 'GET',
        signal: controller.signal,
        mode: 'cors',
      }).catch(() => null);
      clearTimeout(id);
      if (resp) {
        results[env.key] = { status: resp.ok ? 'partial' : 'partial' };
      }
    } catch (e) {
      results[env.key] = { status: 'down' };
    }
  }
  return results;
}

export function isBackendEnvProdByKey(key?: string | null): boolean {
  const envKey = String(key || '').trim();
  if (!envKey) return false;
  const matched = BACKEND_ENVS.find((item) => item.key === envKey);
  return !!matched?.isProd;
}

export function shouldShowBackendEnvSwitch(key?: string | null): boolean {
  const selectedKey = key || getBackendEnvKey() || 'development';
  return !isBackendEnvProdByKey(selectedKey);
}
