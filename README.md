# Library Reservation Admin

[![Project Status](https://img.shields.io/badge/status-active-brightgreen)](README.md) [![TypeScript](https://img.shields.io/badge/lang-TypeScript-blue)](README.md) [![License](https://img.shields.io/badge/license-Private-lightgrey)](README.md)

项目：图书馆预约管理后台（Admin）

## 目录

- [Library Reservation Admin](#library-reservation-admin)
  - [目录](#目录)
  - [简介](#简介)
  - [功能亮点](#功能亮点)
  - [预览](#预览)
  - [技术栈](#技术栈)
  - [快速开始](#快速开始)
  - [配置示例](#配置示例)
  - [常用脚本](#常用脚本)
  - [项目结构（简要）](#项目结构简要)
  - [开发说明](#开发说明)
  - [贡献指南](#贡献指南)
  - [常见问题](#常见问题)

## 简介

本项目为图书馆预约系统的管理端后台，基于 `@umijs/max` + `Ant Design` 开发，包含座位管理、预约、活动、通知、用户与违章管理等模块，适合作为高校或公共图书馆内部管理工具。

## 功能亮点

- 座位管理、预约管理与冲突检测
- 活动与通知管理（支持批量通知）
- 用户与权限管理（基础 RBAC 支持）
- 可视化统计面板（基于 `@ant-design/charts`）
- 多语言支持（i18n，位于 `src/locales`）

## 预览

> 在此处添加项目截图或演示 GIF（放到 `docs/` 或 `assets/` 并替换下面的链接）

![screenshot](./assets/preview-placeholder.png)

## 技术栈

- 框架：`@umijs/max`
- UI：`antd` / `@ant-design/pro-components`
- 语言：`TypeScript`
- 样式：`less`

## 快速开始

1. 克隆仓库：

```bash
git clone <仓库地址>
cd library-reservation-admin
```

2. 安装依赖（推荐使用 pnpm）：

```bash
pnpm install
```

3. 启动开发环境：

```bash
pnpm run dev
```

4. 本地构建：

```bash
pnpm run build
```

## 配置示例

如果项目依赖后端服务地址或其他环境变量，请在仓库根目录创建 `.env` 或 `.env.local`，示例：

```env
# 后端 API 地址
VITE_API_BASE_URL=https://api.example.com

# 其他配置示例
VITE_APP_ENV=development
```

将示例保存为 [`.env.example`](.env.example) 以便团队成员参考。

## 常用脚本

- `pnpm run dev`：启动开发服务器
- `pnpm run build`：构建生产包
- `pnpm run start`：运行 `npm run dev`（同 `dev`）
- `pnpm run lint`：运行 ESLint 校验
- `pnpm run lint:fix`：自动修复 eslint 问题
- `pnpm run format`：运行 Prettier 格式化
- `pnpm run stylelint` / `stylelint:fix`：样式检查与修复

（脚本由 `package.json` 定义）

## 项目结构（简要）

- `config/`：框架与运行时配置（例如 [config/config.ts](config/config.ts)）
- `src/`
  - `pages/`：页面（按模块划分，如 `Booking`, `Floor`, `Seat`）
  - `services/library/`：后端接口封装
  - `components/`：可复用组件
  - `locales/`：国际化文案
  - `models/`：全局数据模型

更多细节参见代码目录。

## 开发说明

- 后端接口集中在 `src/services/library`，新接口请放在对应的 service 文件中。
- 使用 `@umijs/max` 的路由与权限机制组织页面。
- 项目已配置 ESLint、Prettier、Stylelint、husky 与 lint-staged，提交前会自动校验与格式化。

## 贡献指南

1. Fork 并创建 feature 分支：`git checkout -b feat/your-feature`
2. 本地编写并通过 lint/format
3. 提交前运行 `pnpm run format` 与 `pnpm run lint`，使用规范的提交信息
4. 提交 PR，填写变更说明

项目使用 `commitizen` 与 `commitlint`，请按团队约定的提交规范书写提交信息。

## 常见问题

- Q: 如何配置后端地址？

  - A: 在 `.env` 中设置 `VITE_API_BASE_URL`，或修改 `config` 下的运行时配置。

- Q: 运行报错缺少依赖？
  - A: 请确认使用 `pnpm install` 并删除 `node_modules` 后重装。
