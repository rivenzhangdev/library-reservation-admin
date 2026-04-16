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
const request: RequestConfig & { errorHandler?: (error: any) => void } = {
  // 全局错误处理：捕获网络/代理错误和服务端错误，并弹窗提示
  errorHandler: (error: any) => {
    const getFormatMessageFn = () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const umi = require('umi');
        if (umi) {
          if (typeof umi.formatMessage === 'function') return umi.formatMessage;
          if (typeof umi.getIntl === 'function') {
            const intl = umi.getIntl();
            if (intl && typeof intl.formatMessage === 'function') {
              return intl.formatMessage.bind(intl);
            }
          }
        }
      } catch (e) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const localeExports = require('../.umi/plugin-locale/localeExports');
          if (
            localeExports &&
            typeof localeExports.formatMessage === 'function'
          ) {
            return localeExports.formatMessage;
          }
        } catch (e2) {
          // ignore
        }
      }
      return undefined;
    };

    try {
      const formatMessageFn = getFormatMessageFn();
      const locale =
        typeof window !== 'undefined'
          ? window.localStorage.getItem('umi_locale') ||
            navigator.language ||
            ''
          : '';
      const isZh = typeof locale === 'string' && locale.startsWith('zh');

      const showModal = (title: string, content: string) => {
        try {
          Modal.error({ title, content });
        } catch (e) {
          // ignore
        }
      };

      const status = error?.response?.status;
      const errorCode = String(error?.code || '').toLowerCase();
      const isServiceUnavailable =
        !error?.response ||
        status === 0 ||
        errorCode === 'ecofnrefused' ||
        errorCode === 'enotfound' ||
        errorCode === 'econnreset' ||
        String(error?.message || '')
          .toLowerCase()
          .includes('failed to fetch');
      if (isServiceUnavailable) {
        const title =
          formatMessageFn?.({
            id: 'request.networkError.title',
            defaultMessage: isZh ? '服务连接失败' : 'Service connection failed',
          }) ?? (isZh ? '服务连接失败' : 'Service connection failed');
        const content =
          formatMessageFn?.({
            id: 'request.networkError.content',
            defaultMessage: isZh
              ? '后端服务未响应，请检查 BACKEND_URL 或服务端是否已启动。'
              : 'The backend service did not respond. Please check BACKEND_URL or whether the server is running.',
          }) ??
          (isZh
            ? '后端服务未响应，请检查 BACKEND_URL 或服务端是否已启动。'
            : 'The backend service did not respond. Please check BACKEND_URL or whether the server is running.');
        showModal(
          title,
          `${content}${
            error?.message
              ? `
${error.message}`
              : ''
          }`.trim(),
        );
      } else if (status >= 500) {
        const title =
          formatMessageFn?.({
            id: 'request.serverError.title',
            defaultMessage: isZh ? '服务错误' : 'Server error',
          }) ?? (isZh ? '服务错误' : 'Server error');
        const serverMessage =
          error?.response?.data?.message ||
          error?.response?.data?.error?.message ||
          error?.message ||
          '';
        const content =
          formatMessageFn?.({
            id: 'request.serverError.content',
            defaultMessage: isZh
              ? '后端服务内部出现错误，请检查服务是否正常运行。'
              : 'The backend service returned an error. Please check if the server is running correctly.',
          }) ??
          (isZh
            ? '后端服务内部出现错误，请检查服务是否正常运行。'
            : 'The backend service returned an error. Please check if the server is running correctly.');
        showModal(
          title,
          `${content}${
            serverMessage
              ? `
[${status}] ${serverMessage}`
              : `
[${status}]`
          }`.trim(),
        );
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
    async (response: any) => {
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
                String(body.error.code) === String(2004) ||
                String(body.error.code) === String(2005) ||
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
