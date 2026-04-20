// Ensure G2 plot extensions are registered (fixes pie label 'outer' plugin registration)
import RightContent from '@/components/RightContent';
import '@antv/g2-extension-plot';
import { history } from '@umijs/max';
import { forwardRef } from 'react';
import {
  BACKEND_BASE_KEY,
  BACKEND_ENVS,
  clearBackendAuthStorage,
  detectBackendStatuses,
  getBackendBaseUrl,
  getBackendEnvKey,
  setBackendEnv,
} from './config/backendEnvs';
import requestConfig from './utils/request';

export const request = requestConfig;

const loginPath = '/login';

function resolveRuntimeBackendOverride(): {
  key?: string;
  baseUrl?: string;
} {
  try {
    const penv =
      typeof process !== 'undefined' ? (process as any).env : undefined;
    if (!penv) return {};

    const key = String(
      penv.BACKEND_ENV ||
        penv.REACT_APP_BACKEND_ENV ||
        penv.VITE_BACKEND_ENV ||
        '',
    ).trim();

    const baseUrl = String(
      penv.BACKEND_BASE_URL ||
        penv.BACKEND_URL ||
        penv.REACT_APP_BACKEND_BASE_URL ||
        penv.VITE_BACKEND_BASE_URL ||
        '',
    ).trim();

    return {
      key: key || undefined,
      baseUrl: baseUrl || undefined,
    };
  } catch (error) {
    return {};
  }
}

function applyRuntimeBackendOverride(
  selectedKey: string | null,
  baseUrl: string,
): {
  selectedKey: string | null;
  baseUrl: string;
} {
  const runtime = resolveRuntimeBackendOverride();
  const runtimeKey =
    runtime.key && BACKEND_ENVS.some((item) => item.key === runtime.key)
      ? runtime.key
      : undefined;

  if (!runtimeKey && !runtime.baseUrl) {
    return { selectedKey, baseUrl };
  }

  let nextSelectedKey = selectedKey;
  let nextBaseUrl = baseUrl;

  if (runtimeKey) {
    setBackendEnv(runtimeKey as any, { clearAuth: true });
    nextSelectedKey = runtimeKey;
    const matchedEnv = BACKEND_ENVS.find((item) => item.key === runtimeKey);
    if (matchedEnv?.baseUrl) {
      nextBaseUrl = matchedEnv.baseUrl;
    }
  }

  if (runtime.baseUrl) {
    nextBaseUrl = runtime.baseUrl;
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(BACKEND_BASE_KEY, runtime.baseUrl);
        clearBackendAuthStorage();
      }
    } catch (error) {
      // ignore
    }
  }

  return {
    selectedKey: nextSelectedKey,
    baseUrl: nextBaseUrl,
  };
}

export async function getInitialState(): Promise<{
  currentUser?: any;
  token?: string;
  backend?: any;
}> {
  try {
    const rawUser = localStorage.getItem('currentUser');
    const token = localStorage.getItem('token');

    if (rawUser && token) {
      const currentUser = JSON.parse(rawUser);
      // backend selection: use saved selection or try to auto-detect
      let selectedKey = getBackendEnvKey();
      let baseUrl = getBackendBaseUrl();
      let statuses: Record<string, any> = {};

      const runtimeApplied = applyRuntimeBackendOverride(selectedKey, baseUrl);
      selectedKey = runtimeApplied.selectedKey;
      baseUrl = runtimeApplied.baseUrl;

      if (!selectedKey) {
        try {
          statuses = await detectBackendStatuses(2500);
          // pick ok > partial > fallback development
          const okKey = Object.keys(statuses).find(
            (k) => statuses[k].status === 'ok',
          );
          const partialKey = Object.keys(statuses).find(
            (k) => statuses[k].status === 'partial',
          );
          const choose = (okKey || partialKey || 'development') as any;
          setBackendEnv(choose);
          selectedKey = choose;
          baseUrl = getBackendBaseUrl();
        } catch (e) {
          // ignore detection errors
        }
      }

      return {
        currentUser,
        token,
        backend: {
          selectedKey,
          baseUrl,
          statuses,
          allEnvs: BACKEND_ENVS,
        },
      };
    }
  } catch (error) {
    console.warn(error);
  }
  // ensure backend info even when no user
  try {
    let selectedKey = getBackendEnvKey();
    let baseUrl = getBackendBaseUrl();
    let statuses: Record<string, any> = {};

    const runtimeApplied = applyRuntimeBackendOverride(selectedKey, baseUrl);
    selectedKey = runtimeApplied.selectedKey;
    baseUrl = runtimeApplied.baseUrl;

    if (!selectedKey) {
      try {
        statuses = await detectBackendStatuses(2500);
        const okKey = Object.keys(statuses).find(
          (k) => statuses[k].status === 'ok',
        );
        const partialKey = Object.keys(statuses).find(
          (k) => statuses[k].status === 'partial',
        );
        const choose = (okKey || partialKey || 'development') as any;
        setBackendEnv(choose);
        selectedKey = choose;
        baseUrl = getBackendBaseUrl();
      } catch (e) {
        // ignore
      }
    }
    return {
      backend: { selectedKey, baseUrl, statuses, allEnvs: BACKEND_ENVS },
    };
  } catch (e) {
    let selectedKey = getBackendEnvKey();
    let baseUrl = getBackendBaseUrl();
    const runtimeApplied = applyRuntimeBackendOverride(selectedKey, baseUrl);
    selectedKey = runtimeApplied.selectedKey;
    baseUrl = runtimeApplied.baseUrl;
    const statuses: Record<string, any> = {};
    return {
      backend: { selectedKey, baseUrl, statuses, allEnvs: BACKEND_ENVS },
    };
  }
}

/* eslint-disable */
export const layout = ({ initialState }: any) => {
  const MenuItemLink = forwardRef<HTMLAnchorElement, any>(
    ({ to, target, children }, ref) => (
      <a
        ref={ref}
        href={to}
        target={target}
        onClick={(e) => {
          if (!target || target === '_self') {
            e.preventDefault();
            history.push(to);
          }
        }}
      >
        {children}
      </a>
    ),
  );

  const lockBodyScroll = (collapsed: boolean) => {
    if (typeof window === 'undefined') {
      return;
    }
    const isMobile = window.innerWidth <= 768;
    if (!isMobile) {
      return;
    }
    document.body.style.overflow = collapsed ? '' : 'hidden';
    document.body.style.touchAction = collapsed ? '' : 'none';
  };

  return {
    // 使用 RightContent 统一渲染用户菜单，避免重复头像区块
    rightContentRender: (headerProps: any) => {
      return <RightContent headerProps={headerProps} />;
    },
    siderWidth: 208,
    menuItemRender: (menuItemProps: any, defaultDom: any) => {
      if (menuItemProps.isUrl || menuItemProps.children) {
        return defaultDom;
      }
      if (menuItemProps.path) {
        return (
          <MenuItemLink
            to={menuItemProps.path.replace('/*', '')}
            target={menuItemProps.target}
          >
            {defaultDom}
          </MenuItemLink>
        );
      }
      return defaultDom;
    },
    onCollapse: (collapsed: boolean) => {
      lockBodyScroll(collapsed);
    },
    onPageChange: () => {
      const { location } = history;
      if (!initialState?.currentUser && location.pathname !== loginPath) {
        history.push(loginPath);
      }
    },
  };
};
