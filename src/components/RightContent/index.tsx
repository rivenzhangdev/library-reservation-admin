/* eslint-disable */
// local styles for RightContent
import './index.less';
// removed missing global import to avoid module not found during build
import UserProfileModal, { UserProfile } from '@/components/UserProfileModal';
import {
  BACKEND_ENVS,
  detectBackendStatuses,
  getBackendEnvKey,
  setBackendEnv,
} from '@/config/backendEnvs';
import { Roles } from '@/constants/roles';
import { updateUser, uploadImage } from '@/services/library/user';
import { normalizeRoleValue } from '@/utils/role';
import { CheckOutlined, LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { history, SelectLang, useIntl, useModel } from '@umijs/max';
import type { MenuProps } from 'antd';
import { Dropdown, message, Tooltip } from 'antd';
import React, { useEffect, useRef, useState } from 'react';

const RightContent: React.FC = () => {
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
  const normalizedRole = normalizeRoleValue(rawCurrent?.role);

  const currentUser = rawCurrent
    ? ({ ...rawCurrent, role: normalizedRole } as any)
    : defaultUserFallback;
  const setCurrentUser = (u: any) => {
    if (modelSetCurrentUser) modelSetCurrentUser(u);
    else setLocalUser((prev) => ({ ...(prev || {}), ...(u || {}) }));
  };

  // 响应式：当右侧空间不足（如侧边栏折叠）时，进入 compact 模式，仅显示头像
  const groupRef = useRef<HTMLDivElement | null>(null);
  const [isCompact, setIsCompact] = useState(false);
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);

  useEffect(() => {
    setAvatarLoadFailed(false);
  }, [currentUser?.avatar]);

  useEffect(() => {
    const el = groupRef.current;
    if (!el) return;
    const parent = el.parentElement || el;
    const handler = () => {
      try {
        const rect = (parent as HTMLElement).getBoundingClientRect();
        // 阈值：当可用宽度小于 120px 时进入 compact 模式
        setIsCompact(rect.width < 88);
      } catch (e) {
        // ignore
      }
    };
    handler();
    let ro: ResizeObserver | null = null;
    try {
      ro = new ResizeObserver(handler);
      ro.observe(parent);
    } catch (e) {
      // ResizeObserver 在某些环境可能不可用，退回到 window resize
      window.addEventListener('resize', handler);
    }
    window.addEventListener('resize', handler);
    return () => {
      try {
        if (ro) ro.disconnect();
      } catch (e) {
        // ignore
      }
      window.removeEventListener('resize', handler);
    };
  }, []);

  // 构造用户菜单项（放在状态之后，这样 icon 可以根据 selectedEnv 实时变化）
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: intl.formatMessage({ id: 'right.personalCenter' }),
    },
    {
      type: 'divider' as const,
    },
    // 环境切换标题（不可选）
    {
      key: 'env_header',
      label: intl.formatMessage({
        id: 'right.envHeader',
        defaultMessage: '切换环境',
      }),
      disabled: true,
    },
    // 环境项
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
      setCurrentUser((prev) => ({ ...prev, ...data }));
    } catch (e) {
      // 回退到本地保存
      setCurrentUser((prev) => ({ ...prev, ...data }));
      message.warning(intl.formatMessage({ id: 'right.updateBackendFailed' }));
    }
  };

  // （通知已移除 — 如需显示请在此恢复）

  const handleEnvChange = (value: string) => {
    try {
      const found = BACKEND_ENVS.find((e) => e.key === value);
      setBackendEnv(value as any);
      setSelectedEnv(value);
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
            defaultMessage: '已切换到 {env}',
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

  return (
    <div className="rc-right-container">
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
          ref={groupRef}
          className={
            'rc-user-group' + (isCompact ? ' rc-user-group--compact' : '')
          }
          style={{ cursor: 'pointer', padding: 8 }}
        >
          <Tooltip
            title={
              currentUser?.username ||
              currentUser?.name ||
              intl.formatMessage({
                id: 'user.role.user',
                defaultMessage: '普通用户',
              })
            }
            placement="left"
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
            </div>
          </Tooltip>

          {!isCompact && (
            <div className="rc-user-meta">
              <div className="rc-username">
                <Tooltip
                  title={
                    currentUser?.username ||
                    currentUser?.name ||
                    intl.formatMessage({
                      id: 'user.role.user',
                      defaultMessage: '普通用户',
                    })
                  }
                >
                  {currentUser?.username ||
                    currentUser?.name ||
                    intl.formatMessage({
                      id: 'user.role.user',
                      defaultMessage: '普通用户',
                    })}
                </Tooltip>
              </div>
              <div className="rc-role">
                {currentUser?.role === Roles.ADMIN
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
