import '@/assets/styles/global.less';
import UserProfileModal, { UserProfile } from '@/components/UserProfileModal';
import {
  BACKEND_ENVS,
  detectBackendStatuses,
  getBackendEnvKey,
  setBackendEnv,
} from '@/config/backendEnvs';
import { updateUser, uploadImage } from '@/services/library/user';
import {
  DownOutlined,
  LogoutOutlined,
  ReloadOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { history, SelectLang, useIntl } from '@umijs/max';
import type { MenuProps } from 'antd';
import {
  Button,
  Dropdown,
  message,
  Popover,
  Select,
  Space,
  Tag,
  Tooltip,
} from 'antd';
import React, { useEffect, useState } from 'react';

const RightContent: React.FC = () => {
  // theme tokens currently unused

  const intl = useIntl();

  // 用户菜单
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: intl.formatMessage({ id: 'right.personalCenter' }),
    },

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
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    try {
      const raw = localStorage.getItem('currentUser');
      if (raw) return JSON.parse(raw);
    } catch (e) {
      // ignore
    }
    return {
      id: '1',
      username: 'admin',
      name: intl.formatMessage({
        id: 'user.role.admin',
        defaultMessage: 'Administrator',
      }),
      avatar: undefined,
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    } catch (e) {
      // ignore
    }
  }, [currentUser]);

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
    } else if (key === 'logout') {
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
      setBackendEnv(value as any);
      setSelectedEnv(value);
      message.success(
        intl.formatMessage({
          id: 'right.backend.switchSuccess',
          defaultMessage: '已切换后端环境',
        }),
      );
      // reload to ensure new base URL takes effect
      setTimeout(() => window.location.reload(), 300);
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
    <Space
      size="large"
      style={{ marginRight: 16 }}
      className="rc-right-container"
    >
      {/* 语言切换（独立部分）*/}
      <div className="rc-lang">
        <SelectLang />
      </div>

      {/* 后端环境选择 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Select
          value={selectedEnv}
          onChange={handleEnvChange}
          style={{ width: 140 }}
        >
          {BACKEND_ENVS.map((e) => (
            <Select.Option key={e.key} value={e.key}>
              {intl.formatMessage({
                id: `backend.env.${e.key}`,
                defaultMessage: e.label,
              })}
            </Select.Option>
          ))}
        </Select>
        <Popover
          placement="bottomRight"
          title={intl.formatMessage({
            id: 'right.backend.statusTitle',
            defaultMessage: 'Backend Status',
          })}
          content={
            <div style={{ minWidth: 220 }}>
              {BACKEND_ENVS.map((e) => {
                const s = backendStatuses[e.key]?.status || 'down';
                const color =
                  s === 'ok' ? 'green' : s === 'partial' ? 'orange' : 'red';
                return (
                  <div
                    key={e.key}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '4px 0',
                    }}
                  >
                    <div>
                      {intl.formatMessage({
                        id: `backend.env.${e.key}`,
                        defaultMessage: e.label,
                      })}
                    </div>
                    <Tag color={color} style={{ textTransform: 'capitalize' }}>
                      {s}
                    </Tag>
                  </div>
                );
              })}
              <div style={{ marginTop: 8, textAlign: 'right' }}>
                <Button
                  size="small"
                  icon={<ReloadOutlined />}
                  onClick={() => loadBackendStatuses()}
                >
                  {intl.formatMessage({
                    id: 'right.backend.refresh',
                    defaultMessage: 'Refresh',
                  })}
                </Button>
              </div>
            </div>
          }
        >
          <Button type="text" icon={<DownOutlined />} />
        </Popover>
      </div>

      {/* 用户信息组：头像 + 名称 + 角色（点击弹出菜单） */}
      <Dropdown
        menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
        placement="bottomRight"
        trigger={['click']}
      >
        <div
          className="rc-user-group"
          style={{ cursor: 'pointer', padding: 8 }}
        >
          <div className="rc-avatar" role="img" aria-label="avatar">
            {currentUser?.avatar ? (
              <img src={currentUser.avatar} alt="avatar" />
            ) : (
              <UserOutlined />
            )}
          </div>

          <div className="rc-user-meta">
            <div className="rc-username">
              <Tooltip
                title={
                  currentUser?.name ||
                  currentUser?.username ||
                  intl.formatMessage({
                    id: 'user.role.admin',
                    defaultMessage: '管理员',
                  })
                }
              >
                {currentUser?.name ||
                  currentUser?.username ||
                  intl.formatMessage({
                    id: 'user.role.admin',
                    defaultMessage: '管理员',
                  })}
              </Tooltip>
            </div>
            <div className="rc-role">
              {intl.formatMessage({
                id: 'user.role.admin',
                defaultMessage: '管理员',
              })}
            </div>
          </div>
        </div>
      </Dropdown>

      <UserProfileModal
        visible={profileVisible}
        initialValues={currentUser}
        onClose={() => setProfileVisible(false)}
        onSave={handleSaveProfile}
      />
    </Space>
  );
};

export default RightContent;
