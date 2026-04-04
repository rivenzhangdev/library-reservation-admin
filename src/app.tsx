import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
// Ensure G2 plot extensions are registered (fixes pie label 'outer' plugin registration)
import '@antv/g2-extension-plot';
import { history, SelectLang, useIntl } from '@umijs/max';
import { Dropdown, message } from 'antd';
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

export const layout = ({ initialState }: any) => {
  const currentUser = initialState?.currentUser;

  return {
    avatarProps: {
      src: currentUser?.avatar,
      icon: !currentUser?.avatar ? <UserOutlined /> : undefined,
      // Avoid calling hooks here; use a simple fallback title
      title: currentUser?.name || currentUser?.username || 'User',
      size: 'small' as const,
      style: { backgroundColor: currentUser?.avatar ? undefined : '#1890ff' },
      render: (_: any, avatarDom: React.ReactNode) => {
        const AvatarMenu: React.FC = () => {
          const intl = useIntl();
          return (
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'profile',
                    icon: <UserOutlined />,
                    label: intl.formatMessage({ id: 'right.personalCenter' }),
                  },
                  { type: 'divider' as const },
                  {
                    key: 'logout',
                    icon: <LogoutOutlined />,
                    label: intl.formatMessage({ id: 'right.logout' }),
                    danger: true,
                  },
                ],
                onClick: ({ key }) => {
                  if (key === 'profile') {
                    window.dispatchEvent(new CustomEvent('open-profile-modal'));
                  } else if (key === 'logout') {
                    localStorage.removeItem('token');
                    localStorage.removeItem('currentUser');
                    message.success(
                      intl.formatMessage({ id: 'right.logout.success' }),
                    );
                    history.push('/login');
                  }
                },
              }}
            >
              {avatarDom}
            </Dropdown>
          );
        };
        return <AvatarMenu />;
      },
    },
    actionsRender: () => {
      return [<SelectLang key="select-lang" />];
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
