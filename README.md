# 管理后台说明

本项目是图书馆预约系统管理后台，负责预约管理、变更审批、座位管理、活动管理、通知管理和规则配置。

## 1. 技术栈

- Umi Max
- React + TypeScript
- Ant Design Pro 组件

## 2. 目录说明

- src/pages：业务页面
- src/services：接口封装
- src/components：通用组件
- src/config：运行时配置（包含后端环境配置）
- config：项目级配置文件
- scripts：启动与环境脚本

## 3. 后端环境配置

环境配置完全在本项目内维护。

- 配置文件：[config/backend-envs.json](config/backend-envs.json)
- 运行时读取与切换逻辑：[src/config/backendEnvs.ts](src/config/backendEnvs.ts)
- 命令行切换脚本：[scripts/switch-admin-env.js](scripts/switch-admin-env.js)

说明：

- 生产运行时隐藏环境切换入口
- 非生产运行时保留环境切换入口
- 环境切换后会清理当前登录态，避免跨环境 token 污染

## 4. 启动方式

安装依赖：

pnpm install

本地开发：

pnpm start:dev

测试环境：

pnpm start:test

UAT 环境：

pnpm start:uat

生产模式启动：

pnpm start:prod

交互式切换环境并启动：

pnpm switch-env

## 5. 常用脚本

- pnpm dev：启动 Umi 开发服务器
- pnpm build：构建产物
- pnpm lint：代码检查
- pnpm lint:fix：自动修复 lint
- pnpm stylelint：样式检查
- pnpm format：格式化代码

## 6. 关键业务页

- 预约规则配置：可调整续约上限与续约提前天数
- 预约变更审批：支持审批备注输入
- 用户与信用管理：支持信用明细回查

## 7. 故障排查

1. 页面空白或路由 chunk 失败：清缓存后硬刷新
2. 切换环境后接口 401：重新登录
3. 本地跨域错误：确认后端地址和代理配置
4. 表格无数据：在网络面板确认 token 与 baseUrl

## 8. 发布建议

1. 发布前锁定后端环境配置
2. 生产构建验证环境切换入口已隐藏
3. 回归关键路径：登录、规则配置、审批、通知
