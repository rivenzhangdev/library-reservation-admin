/* eslint-disable */
// local styles for RightContent
import './index.less';
// removed missing global import to avoid module not found during build
import UserProfileModal, { UserProfile } from '@/components/UserProfileModal';
import {
  BACKEND_ENVS,
  clearBackendAuthStorage,
  detectBackendStatuses,
  getBackendEnvKey,
  setBackendEnv,
  shouldShowBackendEnvSwitch,
} from '@/config/backendEnvs';
import { Roles } from '@/constants/roles';
import { updateUser, uploadImage } from '@/services/library/user';
import {
  CheckOutlined,
  LogoutOutlined,
  SafetyOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { history, SelectLang, useIntl, useModel } from '@umijs/max';
import type { MenuProps } from 'antd';
import { Dropdown, message } from 'antd';
import React, { useEffect, useState } from 'react';

const RightContent: React.FC<{
  headerProps?: { collapsed?: boolean; isMobile?: boolean };
}> = ({ headerProps }) => {
  // theme tokens currently unused

  const intl = useIntl();

  // 用户菜单（包含环境切换项）
  // NOTE: items will be constructed later so they can react to `selectedEnv` state

  const [profileVisible, setProfileVisible] = useState(false);
  const [selectedEnv, setSelectedEnv] = useState<string>(() => {
    try {
      return (
        getBackendEnvKey() ||
        (BACKEND_ENVS[0] && BACKEND_ENVS[0].key) ||
        'development'
      );
    } catch (e) {
      return 'development';
    }
  });
  // use global model if available so login can update user immediately
  const globalModel = (useModel as any)('global');
  const modelCurrentUser = globalModel?.currentUser;
  const modelSetCurrentUser = globalModel?.setCurrentUser;

  const defaultUserFallback = {
    id: '',
    username: 'user',
    name: intl.formatMessage({
      id: 'user.role.user',
      defaultMessage: '普通用户',
    }),
    avatar: undefined,
    role: Roles.USER,
  } as any;

  const [localUser, setLocalUser] = useState<UserProfile | null>(() => {
    try {
      const raw = localStorage.getItem('currentUser');
      if (raw) return JSON.parse(raw);
    } catch (e) {
      // ignore
    }
    return null;
  });

  const rawCurrent = (modelCurrentUser || localUser) as any | null;

  const currentUser = rawCurrent
    ? ({ ...rawCurrent } as any)
    : defaultUserFallback;
  const isAdmin = currentUser?.role === Roles.ADMIN;
  const setCurrentUser = (u: any) => {
    const nextUser = { ...(rawCurrent || {}), ...(u || {}) };
    if (modelSetCurrentUser) {
      modelSetCurrentUser(nextUser);
    }
    setLocalUser(nextUser);
    try {
      localStorage.setItem('currentUser', JSON.stringify(nextUser));
    } catch (e) {
      // ignore storage failures
    }
  };

  useEffect(() => {
    const handleCurrentUserUpdated = () => {
      try {
        const raw = localStorage.getItem('currentUser');
        if (raw) {
          setLocalUser(JSON.parse(raw));
        }
      } catch (e) {
        // ignore
      }
    };
    window.addEventListener('currentUserUpdated', handleCurrentUserUpdated);
    return () => {
      window.removeEventListener(
        'currentUserUpdated',
        handleCurrentUserUpdated,
      );
    };
  }, []);

  const getLayoutMode = () => {
    if (
      headerProps?.isMobile ||
      (typeof window !== 'undefined' && window.innerWidth <= 480)
    ) {
      return 'topRight' as const;
    }
    if (headerProps?.collapsed) {
      return 'collapsed' as const;
    }
    return 'expanded' as const;
  };

  const [layoutMode, setLayoutMode] = useState<
    'expanded' | 'collapsed' | 'topRight'
  >(getLayoutMode());
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);

  useEffect(() => {
    setAvatarLoadFailed(false);
  }, [currentUser?.avatar]);

  useEffect(() => {
    setLayoutMode(getLayoutMode());
  }, [headerProps?.collapsed, headerProps?.isMobile]);

  useEffect(() => {
    const handler = () => setLayoutMode(getLayoutMode());
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handler);
    }
    handler();
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handler);
      }
    };
  }, [headerProps?.collapsed, headerProps?.isMobile]);

  // 构造用户菜单项（放在状态之后，这样 icon 可以根据 selectedEnv 实时变化）
  const envSwitchVisible = shouldShowBackendEnvSwitch(selectedEnv);
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: intl.formatMessage({ id: 'right.personalCenter' }),
    },
    ...(envSwitchVisible
      ? [
          {
            type: 'divider' as const,
          },
          {
            key: 'env_header',
            label: intl.formatMessage({
              id: 'right.envHeader',
              defaultMessage: '切换环境',
            }),
            disabled: true,
          },
          ...BACKEND_ENVS.map((e) => {
            const k = `env:${e.key}`;
            return {
              key: k,
              label: intl.formatMessage({
                id: `backend.env.${e.key}`,
                defaultMessage: e.label,
              }),
              icon: selectedEnv === e.key ? <CheckOutlined /> : undefined,
            } as any;
          }),
          {
            type: 'divider' as const,
          },
        ]
      : [
          {
            type: 'divider' as const,
          },
        ]),
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: intl.formatMessage({ id: 'right.logout' }),
      danger: true,
    },
  ];

  const [backendStatuses, setBackendStatuses] = useState<
    Record<string, { status: 'down' | 'partial' | 'ok' }>
  >({});

  const loadBackendStatuses = async () => {
    try {
      // short timeout for UI
      const s = await detectBackendStatuses(2000);
      setBackendStatuses(s || {});
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    loadBackendStatuses();
    // refresh every 60s while mounted
    const id = setInterval(() => loadBackendStatuses(), 60000);
    return () => clearInterval(id);
  }, []);

  const handleUserMenuClick: MenuProps['onClick'] = async (info) => {
    const { key } = info;
    if (key === 'profile') {
      setProfileVisible(true);
      return;
    }

    // 环境切换项（key 格式：env:<key>）
    if (typeof key === 'string' && key.startsWith('env:')) {
      const envKey = key.slice(4);
      try {
        handleEnvChange(envKey);
      } catch (e) {
        // ignore
      }
      return;
    }

    if (key === 'logout') {
      // 清理本地登录信息并跳转到登录页
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
      } catch (e) {
        // ignore
      }
      message.success(intl.formatMessage({ id: 'right.logout.success' }));
      history.push('/login');
    }
  };

  const handleSaveProfile = async (data: UserProfile) => {
    // 尝试调用后端更新；失败则保存在 localStorage
    try {
      // 如果头像是 base64 字符串，先上传获取 URL
      if (
        data.avatar &&
        typeof data.avatar === 'string' &&
        data.avatar.startsWith('data:')
      ) {
        try {
          const uploadRes: any = await uploadImage(data.avatar);
          const avatarUrl =
            uploadRes?.url ||
            (uploadRes && uploadRes.data && uploadRes.data.url) ||
            uploadRes;
          data.avatar = avatarUrl;
        } catch (e) {
          console.error(
            intl.formatMessage({
              id: 'userProfile.uploadFailed',
              defaultMessage: '上传头像失败',
            }),
            e,
          );
        }
      }

      if (currentUser?.id) {
        await updateUser(currentUser.id, data);
      }
      setCurrentUser(data);
    } catch (e) {
      // 回退到本地保存
      setCurrentUser(data);
      message.warning(intl.formatMessage({ id: 'right.updateBackendFailed' }));
    }
  };

  // （通知已移除 — 如需显示请在此恢复）

  const handleEnvChange = (value: string) => {
    try {
      const found = BACKEND_ENVS.find((e) => e.key === value);
      setBackendEnv(value as any, { clearAuth: true });
      setSelectedEnv(value);
      setLocalUser(null);
      if (modelSetCurrentUser) {
        try {
          modelSetCurrentUser(null);
        } catch (e) {
          // ignore
        }
      }
      clearBackendAuthStorage();
      const envLabel = found
        ? intl.formatMessage({
            id: `backend.env.${found.key}`,
            defaultMessage: found.label,
          })
        : value;
      message.success(
        intl.formatMessage(
          {
            id: 'right.backend.switchSuccessTo',
            defaultMessage: '已切换到 {env}，并已清理旧登录状态',
          },
          { env: envLabel },
        ),
      );
      // avoid full page reload to prevent UI flicker
      try {
        // dispatch an event so other parts can react if they choose to
        window.dispatchEvent(
          new CustomEvent('backend_base_url_changed', {
            detail: { key: value },
          }),
        );
        window.dispatchEvent(new Event('backend_env_switched'));
      } catch (e) {
        // ignore
      }
      // refresh status indicators
      loadBackendStatuses();
    } catch (e) {
      message.error(
        intl.formatMessage({
          id: 'common.saveFailed',
          defaultMessage: '切换失败',
        }),
      );
    }
  };

  const showUserMeta = layoutMode === 'expanded';

  return (
    <div className={`rc-right-container rc-right-container-${layoutMode}`}>
      {/* 语言切换（独立部分）*/}
      <div className="rc-lang">
        <SelectLang />
      </div>

      {/* 环境切换已移入用户菜单（个人菜单中显示） */}

      {/* 用户信息组：头像 + 名称 + 角色（点击弹出菜单） */}
      <Dropdown
        menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
        placement="bottomRight"
        trigger={['click']}
      >
        <div
          className={`rc-user-group rc-user-group-${layoutMode}`}
          style={{ cursor: 'pointer', padding: 8, minWidth: 0 }}
          title={
            currentUser?.name ||
            currentUser?.username ||
            intl.formatMessage({
              id: 'user.role.user',
              defaultMessage: '普通用户',
            })
          }
        >
          <div className="rc-avatar" role="img" aria-label="avatar">
            {currentUser?.avatar && !avatarLoadFailed ? (
              <img
                src={currentUser.avatar}
                alt="avatar"
                onError={() => setAvatarLoadFailed(true)}
              />
            ) : (
              <UserOutlined />
            )}
            {isAdmin && (
              <div
                className="rc-admin-badge"
                title={intl.formatMessage({
                  id: 'user.role.admin',
                  defaultMessage: '管理员',
                })}
              >
                <SafetyOutlined />
              </div>
            )}
          </div>

          {showUserMeta && (
            <div className="rc-user-meta">
              <div
                className="rc-username"
                title={
                  currentUser?.name ||
                  currentUser?.username ||
                  intl.formatMessage({
                    id: 'user.role.user',
                    defaultMessage: '普通用户',
                  })
                }
              >
                {currentUser?.name ||
                  currentUser?.username ||
                  intl.formatMessage({
                    id: 'user.role.user',
                    defaultMessage: '普通用户',
                  })}
              </div>
              <div
                className={
                  'rc-role-label ' +
                  (isAdmin ? 'rc-role-label-admin' : 'rc-role-label-user')
                }
                aria-label={
                  isAdmin
                    ? intl.formatMessage({
                        id: 'user.role.admin',
                        defaultMessage: '管理员',
                      })
                    : intl.formatMessage({
                        id: 'user.role.user',
                        defaultMessage: '普通用户',
                      })
                }
              >
                {isAdmin
                  ? intl.formatMessage({
                      id: 'user.role.admin',
                      defaultMessage: '管理员',
                    })
                  : intl.formatMessage({
                      id: 'user.role.user',
                      defaultMessage: '普通用户',
                    })}
              </div>
            </div>
          )}
        </div>
      </Dropdown>

      <UserProfileModal
        visible={profileVisible}
        initialValues={currentUser}
        onClose={() => setProfileVisible(false)}
        onSave={handleSaveProfile}
      />
    </div>
  );
};

export default RightContent;
