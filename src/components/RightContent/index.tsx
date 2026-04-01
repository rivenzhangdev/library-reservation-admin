import UserProfileModal, { UserProfile } from '@/components/UserProfileModal';
import { updateUser } from '@/services/library/user';
import { BellOutlined, LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { history, SelectLang } from '@umijs/max';
import type { MenuProps } from 'antd';
import { Badge, Dropdown, message, Space } from 'antd';
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

  // 通知菜单
  const notificationMenuItems: MenuProps['items'] = [
    {
      key: '1',
      label: (
        <div>
          <div>您有新的预约申请</div>
          <div style={{ fontSize: 12, color: '#888' }}>1 分钟前</div>
        </div>
      ),
    },
    {
      key: '2',
      label: (
        <div>
          <div>系统维护通知</div>
          <div style={{ fontSize: 12, color: '#888' }}>2 小时前</div>
        </div>
      ),
    },
    {
      key: '3',
      label: (
        <div>
          <div>张三取消了预约</div>
          <div style={{ fontSize: 12, color: '#888' }}>5 小时前</div>
        </div>
      ),
    },
  ];

  return (
    <Space size="large" style={{ marginRight: 16 }}>
      {/* 国际化切换 */}
      <SelectLang />

      {/* 通知 */}
      <Badge count={3} size="small">
        <Dropdown
          menu={{ items: notificationMenuItems }}
          placement="bottomRight"
          trigger={['click']}
        >
          <div
            style={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '8px',
            }}
          >
            <BellOutlined style={{ fontSize: 18 }} />
          </div>
        </Dropdown>
      </Badge>

      {/* 用户信息 */}
      <Dropdown
        menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
        placement="bottomRight"
        trigger={['click']}
      >
        <div
          style={{
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            padding: '8px',
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              backgroundColor: '#1890ff',
              overflow: 'hidden',
            }}
          >
            {currentUser?.avatar ? (
              <img
                src={currentUser.avatar}
                alt="avatar"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <UserOutlined style={{ color: '#fff' }} />
            )}
          </div>
          <span style={{ marginLeft: 8, whiteSpace: 'nowrap' }}>
            {currentUser?.name || currentUser?.username || '管理员'}
          </span>
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
