// Ensure G2 plot extensions are registered (fixes pie label 'outer' plugin registration)
import RightContent from '@/components/RightContent';
import '@antv/g2-extension-plot';
import { history, useIntl } from '@umijs/max';
import React from 'react';
import {
  BACKEND_ENVS,
  detectBackendStatuses,
  getBackendBaseUrl,
  getBackendEnvKey,
  setBackendEnv,
} from './config/backendEnvs';
import requestConfig from './utils/request';

export const request = requestConfig;

const loginPath = '/login';

export async function getInitialState(): Promise<{
  name?: string;
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
        name: currentUser.name || currentUser.username,
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
    // try to use runtime i18n if available
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const localeExports = require('./.umi/plugin-locale/localeExports');
      const title =
        localeExports && typeof localeExports.formatMessage === 'function'
          ? localeExports.formatMessage({
              id: 'right.guest',
              defaultMessage: '游客',
            })
          : '游客';
      return {
        name: title,
        backend: { selectedKey, baseUrl, statuses, allEnvs: BACKEND_ENVS },
      };
    } catch (e) {
      return {
        name: '游客',
        backend: { selectedKey, baseUrl, statuses, allEnvs: BACKEND_ENVS },
      };
    }
  } catch (e) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const localeExports = require('./.umi/plugin-locale/localeExports');
      const title =
        localeExports && typeof localeExports.formatMessage === 'function'
          ? localeExports.formatMessage({
              id: 'right.guest',
              defaultMessage: '游客',
            })
          : '游客';
      return { name: title };
    } catch (e2) {
      return { name: '游客' };
    }
  }
}

/* eslint-disable */
export const layout = ({ initialState }: any) => {
  const currentUser = initialState?.currentUser;
  const intl = useIntl();

  // 当 ProLayout 在移动端以抽屉显示菜单时，确保页面主体不会在抽屉打开时滚动。
  // 使用 MutationObserver 监测 .ant-drawer-mask（遮罩）元素的存在与可见性。
  // 使用 data 属性记录我们设置的锁定状态，确保在关闭后能正确恢复原始 overflow。
  React.useEffect(() => {
    if (typeof window === 'undefined' || !document || !document.body) return;

    let originalOverflowBody = document.body.style.overflow || '';
    let originalOverflowHtml = document.documentElement.style.overflow || '';
    let originalPositionBody = document.body.style.position || '';
    let originalTopBody = document.body.style.top || '';
    let originalLeftBody = document.body.style.left || '';
    let originalWidthBody = document.body.style.width || '';
    let originalBodyStyle = '';
    let originalHtmlStyle = '';
    let lastLockedAt = 0;
    const DEBUG = process.env.NODE_ENV !== 'production';

    const lockBody = () => {
      try {
        if (document.body.dataset.drawerLocked === '1') return;
        document.body.dataset.drawerLocked = '1';
        // record previous inline overflow/position
        originalOverflowBody = document.body.style.overflow || '';
        originalOverflowHtml = document.documentElement.style.overflow || '';
        originalPositionBody = document.body.style.position || '';
        originalTopBody = document.body.style.top || '';
        originalLeftBody = document.body.style.left || '';
        originalWidthBody = document.body.style.width || '';
        originalBodyStyle = document.body.getAttribute('style') || '';
        originalHtmlStyle =
          document.documentElement.getAttribute('style') || '';

        // lock scrolling
        document.body.style.overflow = 'hidden';
        try {
          document.documentElement.style.overflow = 'hidden';
        } catch (e) {
          // ignore
        }

        // also apply position:fixed hack to prevent body jump and preserve scroll position
        try {
          const scrollY =
            window.scrollY ||
            window.pageYOffset ||
            document.documentElement.scrollTop ||
            0;
          document.body.dataset.prevScroll = String(scrollY);
          document.body.style.position = 'fixed';
          document.body.style.top = `-${scrollY}px`;
          document.body.style.left = '0';
          document.body.style.width = '100%';
        } catch (e) {
          // ignore
        }

        lastLockedAt = Date.now();
      } catch (e) {
        // ignore
      }
    };

    const unlockBody = () => {
      try {
        if (document.body.dataset.drawerLocked !== '1') return;
        delete document.body.dataset.drawerLocked;

        // restore overflow
        try {
          document.body.style.removeProperty('overflow');
        } catch (e) {
          document.body.style.overflow = originalOverflowBody || '';
        }
        try {
          document.documentElement.style.removeProperty('overflow');
        } catch (e) {
          document.documentElement.style.overflow = originalOverflowHtml || '';
        }

        // restore position/scroll if we applied position:fixed
        try {
          const prev =
            parseInt(document.body.dataset.prevScroll || '0', 10) || 0;
          try {
            document.body.style.removeProperty('position');
            document.body.style.removeProperty('top');
            document.body.style.removeProperty('left');
            document.body.style.removeProperty('width');
          } catch (e) {
            document.body.style.position = originalPositionBody || '';
            document.body.style.top = originalTopBody || '';
            document.body.style.left = originalLeftBody || '';
            document.body.style.width = originalWidthBody || '';
          }
          if (prev) {
            try {
              window.scrollTo(0, prev);
            } catch (e) {
              // ignore
            }
          }
        } catch (e) {
          // ignore
        }

        // remove common classes that libraries sometimes add to lock scrolling
        try {
          const classesToRemove = [
            'ant-scrolling-effect',
            'ant-drawer-open',
            'rc-drawer-open',
            'drawer-open',
            'ant-drawer-open-body',
            'ant-modal-open',
            'no-scroll',
          ];
          classesToRemove.forEach((cls) => {
            try {
              document.body.classList.remove(cls);
            } catch (e) {
              // ignore
            }
            try {
              document.documentElement.classList.remove(cls);
            } catch (e) {
              // ignore
            }
          });
        } catch (e) {
          // ignore
        }

        lastLockedAt = 0;

        // debug logging removed to reduce noisy console output in development
      } catch (e) {
        // ignore
      }
    };

    const checkDrawerVisible = () => {
      try {
        const masks = Array.from(
          document.querySelectorAll('.ant-drawer-mask'),
        ) as Element[];
        const visible = masks.some((m) => {
          try {
            const el = m as HTMLElement;
            const r = el.getBoundingClientRect();
            return (
              (r.width > 0 && r.height > 0) ||
              el.offsetParent !== null ||
              el.clientHeight > 0
            );
          } catch (e) {
            return false;
          }
        });
        if (visible) {
          lockBody();
        } else {
          unlockBody();

          // Aggressive fallback: if unlock didn't restore scroll, force-clean common locks
          setTimeout(() => {
            try {
              if (document.body.dataset.drawerLocked === '1') {
                try {
                  document.body.style.removeProperty('overflow');
                } catch (e) {}
                try {
                  document.documentElement.style.removeProperty('overflow');
                } catch (e) {}
                const classesToRemove = [
                  'ant-scrolling-effect',
                  'ant-drawer-open',
                  'rc-drawer-open',
                  'drawer-open',
                  'ant-drawer-open-body',
                  'ant-modal-open',
                  'no-scroll',
                ];
                classesToRemove.forEach((cls) => {
                  try {
                    document.body.classList.remove(cls);
                  } catch (e) {}
                  try {
                    document.documentElement.classList.remove(cls);
                  } catch (e) {}
                });
                try {
                  delete document.body.dataset.drawerLocked;
                } catch (e) {}
                try {
                  document.body.removeAttribute('style');
                } catch (e) {}
                try {
                  document.documentElement.removeAttribute('style');
                } catch (e) {}
                const prev =
                  parseInt(document.body.dataset.prevScroll || '0', 10) || 0;
                if (prev) {
                  try {
                    window.scrollTo(0, prev);
                  } catch (e) {}
                }
                // aggressive fallback performed (logging removed)
              }
            } catch (e) {
              // ignore
            }
          }, 120);
        }

        // checkDrawerVisible executed (debug logging removed)
      } catch (e) {
        // ignore
      }
    };

    const onMaskTransition = () => setTimeout(checkDrawerVisible, 0);

    const attachMaskListeners = () => {
      const masks = Array.from(
        document.querySelectorAll('.ant-drawer-mask'),
      ) as Element[];
      masks.forEach((m) => {
        try {
          const anyM = m as any;
          if (!anyM.__drawerObserverAttached) {
            m.addEventListener('transitionend', onMaskTransition);
            anyM.__drawerObserverAttached = true;
          }
        } catch (e) {
          // ignore
        }
      });
    };

    const observer = new MutationObserver(() => {
      checkDrawerVisible();
      attachMaskListeners();
    });

    // Poller fallback: ensure we re-check periodically in case MutationObserver misses
    const poller = setInterval(() => {
      try {
        checkDrawerVisible();
        // safety unlock if locked for too long
        if (
          document.body.dataset.drawerLocked === '1' &&
          lastLockedAt &&
          Date.now() - lastLockedAt > 2000
        ) {
          // safety unlock triggered after timeout
          unlockBody();
        }
      } catch (e) {
        // ignore
      }
    }, 250);

    // Global listeners: if user interacts (click/touch/keydown) while body is locked,
    // try to unlock immediately. Also expose a manual unlock for debugging.
    const globalUnlockHandler = (ev?: any) => {
      try {
        if (document.body.dataset.drawerLocked === '1') {
          // global unlock triggered (debug logging removed)
          unlockBody();
        }
      } catch (e) {
        // ignore
      }
    };

    const keydownHandler = (ev: KeyboardEvent) => {
      try {
        if ((ev as any).key === 'Escape') globalUnlockHandler(ev);
      } catch (e) {
        // ignore
      }
    };

    const attachGlobalUnlockListeners = () => {
      try {
        document.addEventListener('click', globalUnlockHandler, true);
        document.addEventListener('touchstart', globalUnlockHandler, true);
        document.addEventListener('pointerdown', globalUnlockHandler, true);
        document.addEventListener('focusin', globalUnlockHandler, true);
        document.addEventListener('keydown', keydownHandler, true);
        try {
          // expose for manual testing
          (window as any).__forceUnlockDrawer = unlockBody;
        } catch (e) {
          // ignore
        }
      } catch (e) {
        // ignore
      }
    };

    const detachGlobalUnlockListeners = () => {
      try {
        document.removeEventListener('click', globalUnlockHandler, true);
        document.removeEventListener('touchstart', globalUnlockHandler, true);
        document.removeEventListener('pointerdown', globalUnlockHandler, true);
        document.removeEventListener('focusin', globalUnlockHandler, true);
        document.removeEventListener('keydown', keydownHandler, true);
        try {
          delete (window as any).__forceUnlockDrawer;
        } catch (e) {
          // ignore
        }
      } catch (e) {
        // ignore
      }
    };

    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('resize', checkDrawerVisible);
    // initial check & attach
    checkDrawerVisible();
    attachMaskListeners();

    return () => {
      observer.disconnect();
      clearInterval(poller);
      window.removeEventListener('resize', checkDrawerVisible);
      // cleanup mask listeners
      const masks = Array.from(
        document.querySelectorAll('.ant-drawer-mask'),
      ) as Element[];
      masks.forEach((m) => {
        try {
          const anyM = m as any;
          if (anyM.__drawerObserverAttached) {
            m.removeEventListener('transitionend', onMaskTransition);
            try {
              delete anyM.__drawerObserverAttached;
            } catch (e) {
              /* ignore */
            }
          }
        } catch (e) {
          // ignore
        }
      });
      try {
        if (document.body.dataset.drawerLocked === '1') {
          delete document.body.dataset.drawerLocked;
        }
        try {
          document.body.style.removeProperty('overflow');
        } catch (e) {
          document.body.style.overflow = originalOverflowBody || '';
        }
        try {
          document.documentElement.style.removeProperty('overflow');
        } catch (e) {
          document.documentElement.style.overflow = originalOverflowHtml || '';
        }
      } catch (e) {
        // ignore
      }
    };
  }, []);

  return {
    // 使用 RightContent 统一渲染用户菜单，避免重复头像区块
    // 使用自定义 RightContent 确保环境切换和用户信息可见
    rightContentRender: () => {
      return <RightContent />;
    },
    siderWidth: 208,
    onPageChange: () => {
      const { location } = history;
      if (!initialState?.currentUser && location.pathname !== loginPath) {
        history.push(loginPath);
      }
    },
  };
};
