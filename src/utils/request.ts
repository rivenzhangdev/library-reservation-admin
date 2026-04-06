import type { RequestConfig } from '@umijs/max';
import { Modal } from 'antd';

// Try to obtain a runtime formatMessage function from umi / generated locale exports
function getFormatMessage():
  | ((
      descriptor: { id: string; defaultMessage?: string },
      values?: any,
    ) => string)
  | undefined {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const localeExports = require('../.umi/plugin-locale/localeExports');
    if (localeExports && typeof localeExports.formatMessage === 'function') {
      return localeExports.formatMessage;
    }
  } catch (e) {
    // ignore
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const umi = require('umi');
    if (umi) {
      if (typeof umi.formatMessage === 'function') return umi.formatMessage;
      if (typeof umi.getIntl === 'function') {
        const intl = umi.getIntl();
        if (intl && typeof intl.formatMessage === 'function')
          return intl.formatMessage.bind(intl);
      }
    }
  } catch (e) {
    // ignore
  }
  return undefined;
}

// 全局 request 配置：统一注入 Authorization（默认）并支持 options.skipAuth 跳过注入
const request: RequestConfig = {
  // 全局错误处理：捕获网络/代理错误（如后端未启动导致的连接拒绝），并弹窗提示
  errorHandler: (error: any) => {
    try {
      // 尝试从运行时获取 formatMessage（支持 umi / @umijs/max）
      let formatMessageFn:
        | undefined
        | ((
            opts: { id: string; defaultMessage?: string },
            values?: any,
          ) => string);
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const umi = require('umi');
        if (umi) {
          if (typeof umi.formatMessage === 'function') {
            formatMessageFn = umi.formatMessage;
          } else if (typeof umi.getIntl === 'function') {
            const intl = umi.getIntl();
            if (intl && typeof intl.formatMessage === 'function') {
              formatMessageFn = intl.formatMessage.bind(intl);
            }
          }
        }
      } catch (e) {
        try {
          // fallback: 使用生成的 localeExports
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const localeExports = require('../.umi/plugin-locale/localeExports');
          if (
            localeExports &&
            typeof localeExports.formatMessage === 'function'
          ) {
            formatMessageFn = localeExports.formatMessage;
          }
        } catch (e2) {
          // ignore
        }
      }

      const locale =
        typeof window !== 'undefined'
          ? window.localStorage.getItem('umi_locale') ||
            navigator.language ||
            ''
          : '';
      const isZh = typeof locale === 'string' && locale.startsWith('zh');

      const title = formatMessageFn
        ? formatMessageFn({
            id: 'request.networkError.title',
            defaultMessage: isZh ? '网络错误' : 'Network error',
          })
        : isZh
        ? '网络错误'
        : 'Network error';

      const content = formatMessageFn
        ? formatMessageFn({
            id: 'request.networkError.content',
            defaultMessage: isZh
              ? '无法连接到后端服务，请确认服务已启动。'
              : 'Failed to connect to backend service. Please ensure the server is running.',
          })
        : isZh
        ? '无法连接到后端服务，请确认服务已启动。'
        : 'Failed to connect to backend service. Please ensure the server is running.';

      if (!error || !error.response) {
        Modal.error({ title, content });
      }
    } catch (e) {
      // ignore
    }
    throw error;
  },
  requestInterceptors: [
    async (url: string, options: any) => {
      let opts = options ?? {};
      let requestUrl = url;
      try {
        // 支持通过本地配置的 backend_base_url 强制覆盖请求前缀（用于多环境切换）
        if (typeof window !== 'undefined') {
          const forcedBase = window.localStorage.getItem('backend_base_url');
          if (
            forcedBase &&
            typeof requestUrl === 'string' &&
            !/^https?:\/\//i.test(requestUrl)
          ) {
            const prefix = forcedBase.replace(/\/$/, '');
            requestUrl = requestUrl.startsWith('/')
              ? `${prefix}${requestUrl}`
              : `${prefix}/${requestUrl}`;
          }
        }
      } catch (e) {
        // ignore
      }
      try {
        const skipAuth = opts && opts.skipAuth;
        const token =
          typeof window !== 'undefined'
            ? window.localStorage.getItem('token')
            : null;
        if (token && !skipAuth) {
          opts = {
            ...opts,
            headers: {
              ...(opts && opts.headers ? opts.headers : {}),
              Authorization: `Bearer ${token}`,
            },
          };
        }
      } catch (e) {
        // ignore
      }
      return { url: requestUrl, options: opts };
    },
  ],
  responseInterceptors: [
    async (response: Response) => {
      try {
        const showSessionExpired = async () => {
          try {
            if (typeof window !== 'undefined') {
              if ((window as any).__sessionExpiredShown) return;
              (window as any).__sessionExpiredShown = true;
              const fm = getFormatMessage();
              const title = fm
                ? fm({
                    id: 'request.sessionExpired.title',
                    defaultMessage: '会话已过期',
                  })
                : '会话已过期';
              const content = fm
                ? fm({
                    id: 'request.sessionExpired.content',
                    defaultMessage: '登录已失效，请重新登录',
                  })
                : '登录已失效，请重新登录';
              Modal.info({
                title,
                content,
                onOk: () => {
                  try {
                    window.localStorage.removeItem('token');
                    window.localStorage.removeItem('currentUser');
                  } catch (e) {
                    // ignore
                  }
                  window.location.replace('/login');
                },
              });
            }
          } catch (e) {
            // ignore
          }
        };

        if (response && response.status === 401) {
          await showSessionExpired();
          return response;
        }

        if (response && response.clone) {
          try {
            const clone = response.clone();
            const body = await clone.json().catch(() => null);
            if (
              body &&
              body.error &&
              (String(body.error.code) === String(1002) ||
                body.error.code === 'UNAUTHORIZED')
            ) {
              await showSessionExpired();
            }
            // 业务错误：API 返回 success: false 时抛出异常，让调用方 catch 能捕获
            if (body && body.success === false && body.error) {
              const fm = getFormatMessage();
              const defaultMsg = fm
                ? fm({
                    id: 'common.operationFailed',
                    defaultMessage: '操作失败',
                  })
                : '操作失败';
              const err = new Error(body.error.message || defaultMsg);
              (err as any).code = body.error.code;
              (err as any).data = body;
              throw err;
            }
          } catch (e: any) {
            // 如果是我们主动抛出的业务错误，继续往上抛
            if (e && e.data && e.data.success === false) {
              throw e;
            }
            // ignore parse errors
          }
        }
      } catch (e: any) {
        // 如果是业务错误，继续往上抛
        if (e && e.data && e.data.success === false) {
          throw e;
        }
        // ignore other errors
      }
      return response;
    },
  ],
};

export default request;
