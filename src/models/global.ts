// 全局共享数据示例
import { DEFAULT_NAME } from '@/constants';
import { useEffect, useState } from 'react';

const useUser = () => {
  const [name, setName] = useState<string>(DEFAULT_NAME);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const v = localStorage.getItem('app-theme');
      return v === 'dark' ? 'dark' : 'light';
    } catch (e) {
      return 'light';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('app-theme', theme);
      document.body.setAttribute('data-theme', theme);
    } catch (e) {
      // ignore
    }
  }, [theme]);

  return {
    name,
    setName,
    theme,
    setTheme,
  };
};

export default useUser;
