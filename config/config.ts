import { defineConfig } from '@umijs/max';

export default defineConfig({
  // 启用 i18n（locale）插件，参见 https://umijs.org/docs/max/i18n
  locale: {
    default: 'zh-CN',
    antd: true,
    // 是否根据浏览器语言自动切换；设为 false 以由应用控制
    baseNavigator: false,
  },
  // 兼容性别名：将老的 `umi` 导入映射到 `@umijs/max`
  alias: {
    umi: '@umijs/max',
  },
});
