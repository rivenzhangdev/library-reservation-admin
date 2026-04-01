import RightContent from '@/components/RightContent';
import { history } from '@umijs/max';

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
  return {
    rightContentRender: () => <RightContent />,
    onPageChange: () => {
      const { location } = history;
      // 如果没有登录，重定向到 login
      if (!initialState?.currentUser && location.pathname !== loginPath) {
        history.push(loginPath);
      }
    },
  };
};
