export type BackendEnvKey = 'development' | 'test' | 'uat' | 'production';

export interface BackendEnv {
  key: BackendEnvKey;
  label: string;
  baseUrl: string;
  lanBaseUrl?: string;
}

const BACKEND_ENVS_FALLBACK: BackendEnv[] = [
  {
    key: 'development',
    label: 'Development',
    baseUrl: 'http://localhost:3000',
    lanBaseUrl: 'http://192.168.18.60:3000',
  },
  {
    key: 'test',
    label: 'Test',
    baseUrl: 'http://localhost:3001',
    lanBaseUrl: 'http://192.168.18.60:3001',
  },
  {
    key: 'uat',
    label: 'UAT',
    baseUrl: 'http://localhost:3002',
    lanBaseUrl: 'http://192.168.18.60:3002',
  },
  {
    key: 'production',
    label: 'Production',
    baseUrl: 'http://localhost:3000',
    lanBaseUrl: 'http://192.168.18.60:3000',
  },
];

export const BACKEND_ENVS: BackendEnv[] = (() => {
  let envs: BackendEnv[] = BACKEND_ENVS_FALLBACK;
  try {
    if (typeof window === 'undefined') {
      // Prefer a shared workspace config if present.
      // Use eval('require') so bundlers don't try to resolve this optional file.
      // eslint-disable-next-line no-eval,@typescript-eslint/no-implied-eval
      const requireFn = eval('require');
      const shared = requireFn('../../backend-envs.json');
      if (shared && Array.isArray(shared.BACKEND_ENVS)) {
        envs = shared.BACKEND_ENVS as BackendEnv[];
      }
    }
  } catch (e) {
    // ignore and fallback
  }

  // Allow build/start-time overrides via environment variables.
  // Examples (in scripts):
  //   cross-env BACKEND_ENV=uat BACKEND_BASE_URL=http://192.168.x.x:3002 pnpm dev
  try {
    const penv = typeof process !== 'undefined' ? (process as any).env : null;
    if (penv) {
      const overrideKey =
        penv.BACKEND_ENV || penv.REACT_APP_BACKEND_ENV || penv.VITE_BACKEND_ENV;
      const overrideBase =
        penv.BACKEND_BASE_URL ||
        penv.REACT_APP_BACKEND_BASE_URL ||
        penv.VITE_BACKEND_BASE_URL;
      const overrideLan =
        penv.BACKEND_LAN_URL ||
        penv.REACT_APP_BACKEND_LAN_URL ||
        penv.VITE_BACKEND_LAN_BASE_URL;
      if (overrideKey || overrideBase || overrideLan) {
        const idx = envs.findIndex((e) => e.key === overrideKey);
        if (idx >= 0) {
          if (overrideBase) (envs[idx] as any).baseUrl = overrideBase;
          if (overrideLan) (envs[idx] as any).lanBaseUrl = overrideLan;
        } else {
          const newEnv: BackendEnv = {
            key: (overrideKey as BackendEnvKey) || 'development',
            label: overrideKey || 'Env',
            baseUrl: overrideBase || (envs[0] && envs[0].baseUrl) || '',
            lanBaseUrl: overrideLan || '',
          };
          envs = [newEnv, ...envs];
        }
      }
    }
  } catch (e) {
    // ignore
  }

  return envs;
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
