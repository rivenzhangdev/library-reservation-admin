import '@/assets/styles/global.less';
import UserProfileModal, { UserProfile } from '@/components/UserProfileModal';
import { updateUser, uploadImage } from '@/services/library/user';
import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { history, SelectLang } from '@umijs/max';
import type { MenuProps } from 'antd';
import { Dropdown, message, Space, Tooltip } from 'antd';
import React, { useEffect, useState } from 'react';

const RightContent: React.FC = () => {
  // theme tokens currently unused

  // 用户菜单
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
    },

    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
    },
  ];

  const [profileVisible, setProfileVisible] = useState(false);
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
      name: '管理员',
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
      message.success('已退出登录');
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
          console.error('上传头像失败', e);
        }
      }

      if (currentUser?.id) {
        await updateUser(currentUser.id, data);
      }
      setCurrentUser((prev) => ({ ...prev, ...data }));
    } catch (e) {
      // 回退到本地保存
      setCurrentUser((prev) => ({ ...prev, ...data }));
      message.warning('更新后端失败，已保存到本地（演示）');
    }
  };

  // （通知已移除 — 如需显示请在此恢复）

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
                title={currentUser?.name || currentUser?.username || '管理员'}
              >
                {currentUser?.name || currentUser?.username || '管理员'}
              </Tooltip>
            </div>
            <div className="rc-role">管理员</div>
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
