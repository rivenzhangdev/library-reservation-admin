import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { history, SelectLang } from '@umijs/max';
import { Dropdown, message } from 'antd';
import React from 'react';
import requestConfig from './utils/request';

export const request = requestConfig;

const loginPath = '/login';

export async function getInitialState(): Promise<{
  name?: string;
  currentUser?: any;
  token?: string;
}> {
  try {
    const rawUser = localStorage.getItem('currentUser');
    const token = localStorage.getItem('token');

    if (rawUser && token) {
      const currentUser = JSON.parse(rawUser);
      return {
        name: currentUser.name || currentUser.username,
        currentUser,
        token,
      };
    }
  } catch (error) {
    console.warn(error);
  }
  return { name: '游客' };
}

export const layout = ({ initialState }: any) => {
  const currentUser = initialState?.currentUser;

  return {
    avatarProps: {
      src: currentUser?.avatar,
      icon: !currentUser?.avatar ? <UserOutlined /> : undefined,
      title: currentUser?.name || currentUser?.username || '用户',
      size: 'small' as const,
      style: { backgroundColor: currentUser?.avatar ? undefined : '#1890ff' },
      render: (_: any, avatarDom: React.ReactNode) => {
        return (
          <Dropdown
            menu={{
              items: [
                { key: 'profile', icon: <UserOutlined />, label: '个人中心' },
                { type: 'divider' as const },
                {
                  key: 'logout',
                  icon: <LogoutOutlined />,
                  label: '退出登录',
                  danger: true,
                },
              ],
              onClick: ({ key }) => {
                if (key === 'profile') {
                  window.dispatchEvent(new CustomEvent('open-profile-modal'));
                } else if (key === 'logout') {
                  localStorage.removeItem('token');
                  localStorage.removeItem('currentUser');
                  message.success('已退出登录');
                  history.push('/login');
                }
              },
            }}
          >
            {avatarDom}
          </Dropdown>
        );
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
