# Skill Pet

<p align="center">
  <img src="assets/skill-pet-icon.png" width="120" alt="Skill Pet icon">
</p>

<p align="center">
  <strong>一个本地优先的 macOS 悬浮工具，用于查看你后来添加到 Codex 的 skills。</strong>
</p>

<p align="center">
  <a href="https://github.com/xyyswwgf/skill-pet/releases"><img src="https://img.shields.io/github/v/release/xyyswwgf/skill-pet?display_name=tag&label=release" alt="Latest release"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-4b86f7" alt="MIT License"></a>
  <img src="https://img.shields.io/badge/platform-macOS%2012%2B-4b86f7" alt="macOS 12 or later">
  <img src="https://img.shields.io/badge/data-local%20only-4b86f7" alt="Local only">
</p>

Skill Pet 将个人 Codex skills 汇总为可搜索、可展开的本地清单。它不执行、不修改、不安装 skill，也不将任何本地路径或 `SKILL.md` 内容发送到网络。

## Why Skill Pet

当安装的 skills 增多时，Codex 中可用能力并不总是容易浏览。Skill Pet 将“我后来添加了什么、它们分别做什么”变成一个随时可打开的悬浮窗口：保留一个可拖动的圆形启动球，需要时展开，无需时收起。

## Highlights

- 只显示个人添加的 skills，过滤 Codex 官方运行时和内置市场内容。
- 扫描 Codex 用户目录、共享本地目录、工作区 `.agents/skills` 与用户添加插件的缓存。
- 根据插件和用途整理 skills；默认按更新日期排序，提供简短中文用途说明与搜索。
- 圆形 SP 悬浮球可拖动。展开时会依据屏幕剩余空间选择方向，同时保持按钮的屏幕位置不变。
- 展开面板支持滚轮浏览、组内展开、刷新、空状态和错误恢复。
- 全部扫描和窗口管理均在本机完成；应用没有账号、云同步、遥测或网络客户端。

## Product Boundaries

| Skill Pet does | Skill Pet does not |
| --- | --- |
| 读取本机 `SKILL.md` 元数据和说明 | 执行、编辑、安装、删除或启用 skill |
| 显示名称、分组、用途和来源 | 修改 Codex 配置或插件状态 |
| 管理自己的悬浮窗口位置与展开状态 | 上传内容、调用远程 API 或启动网络服务 |

## Quick Start

### Run from source

Requirements: macOS 12+, Node.js 18+, Rust stable with `cargo`, and Xcode Command Line Tools.

```bash
git clone https://github.com/xyyswwgf/skill-pet.git
cd skill-pet
npm install
npm run dev
```

首次启动时会出现圆形 SP 悬浮球。拖动它以移动位置，单击以展开或收起。

### Build a local app

```bash
npm install
npm run build
open "src-tauri/target/release/bundle/macos/Skill Pet.app"
```

构建结果为 `src-tauri/target/release/bundle/macos/Skill Pet.app`。当前构建未签名、未公证；首次打开若被 macOS 拦截，请在 Finder 中按住 Control 点击 App 后选择“打开”。

### Download the source package

在 [GitHub Releases](https://github.com/xyyswwgf/skill-pet/releases) 下载最新的 `Skill-Pet-*-source.zip`，解压后执行上方的构建命令。源码包不包含 `node_modules` 或编译输出。

## How It Works

Skill Pet 只读扫描以下本机位置：

- `~/.codex/skills`
- `~/.agents/skills`
- 当前工作区及子目录中的 `.agents/skills`
- `~/.codex/plugins/cache` 中非 OpenAI 内置市场的插件内容

展开面板或选择“刷新”时才重新扫描。当前版本不常驻监听文件系统，因此新安装的 skill 会在下次展开或刷新后出现。

## Architecture

| Layer | Responsibility |
| --- | --- |
| `web/` | 搜索、分组、中文摘要、列表交互与悬浮球交互。 |
| `src-tauri/src/main.rs` | 受限的本地只读扫描、来源分类、窗口移动及展开位置计算。 |
| `src-tauri/tauri.conf.json` | 本地资源、内容安全策略、透明无边框窗口与 macOS 配置。 |

完整设计和边界说明见 [architecture](documentation/architecture.md)、[flows](documentation/flows.md) 与 [permissions](documentation/permissions.md)。

## Privacy and Security

- 没有登录、账户、数据库、遥测或云同步。
- 没有网络客户端、远程 API 或本地 HTTP 服务（网页预览模式除外）。
- Rust 后端只公开扫描与窗口管理命令，不提供文件写入或 skill 执行命令。
- 透明窗口使用 macOS WebKit 私有 API，因此本项目不适合 Mac App Store 发布。

请阅读 [Security Policy](SECURITY.md) 了解漏洞报告方式和发行边界。

## Development

```bash
npm install
npm run build
node --check web/main.js
```

仅预览网页界面：

```bash
npm run preview
```

随后访问 `http://127.0.0.1:4174`。网页预览无法模拟原生透明度、系统级拖动和按屏幕空间展开。

贡献前请阅读 [Contributing](CONTRIBUTING.md)。测试范围、已知空白和后续计划分别记录在 [tests](documentation/tests.md) 与 [roadmap](documentation/roadmap.md)。

## Releases

每个发布版本均会附带可复现的源码 ZIP。维护者发布流程在 [BUILD.md](BUILD.md) 中说明；正式面向其他用户分发 `.app` 前，应补充 Apple Developer ID 签名与 notarization。

## License

Skill Pet 采用 [MIT License](LICENSE)。
