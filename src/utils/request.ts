import type { RequestConfig } from '@umijs/max';
import { Modal } from 'antd';

// 全局 request 配置：统一注入 Authorization（默认）并支持 options.skipAuth 跳过注入
const request: RequestConfig = {
  requestInterceptors: [
    async (url: string, options: any) => {
      let opts = options ?? {};
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
      return { url, options: opts };
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
              Modal.info({
                title: '会话已过期',
                content: '登录已失效，请重新登录',
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
              const err = new Error(body.error.message || '操作失败');
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
