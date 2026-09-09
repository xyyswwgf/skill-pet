# Skill Pet

一个 macOS 本地悬浮工具，用于查看你后续添加到 Codex 的 skills。它不执行 skill，也不会把本地 skills 或内容上传到任何服务器。

![Skill Pet floating ball](assets/skill-pet.svg)

## 功能

- 扫描 `~/.codex/skills`、当前项目 skills 和用户添加的 Codex 插件缓存。
- 排除 Codex 内置运行时和官方捆绑 skills，仅展示个人添加的内容。
- 按插件/功能归类，按更新时间排序，展示 skill 名称与简短中文用途。
- 蓝色 `SP` 悬浮球可拖动；点击后会依据所在屏幕位置向空余方向展开，且 SP 的屏幕位置不变。
- 展开面板支持搜索、模块内展开和鼠标滚轮浏览。
- 全部数据仅在本机读取；没有登录、云同步、网络请求或技能写入操作。

## 运行环境

当前发布目标是 **macOS 12+**。透明悬浮窗使用 macOS WebKit 私有 API，因此不支持 Mac App Store 发布。

构建源码需要：

- Node.js 18 或更高版本
- Rust stable（含 `cargo`）
- Xcode Command Line Tools：`xcode-select --install`

## 从 GitHub 源码运行

```bash
git clone https://github.com/YOUR_GITHUB_USERNAME/skill-pet.git
cd skill-pet
npm install
npm run dev
```

首次运行会弹出一个蓝色 SP 悬浮球。拖动可以移动，单击展开或收起。

## 构建本地 App

```bash
npm install
npm run build
open "src-tauri/target/release/bundle/macos/Skill Pet.app"
```

构建后的应用在：

```text
src-tauri/target/release/bundle/macos/Skill Pet.app
```

在未签名和未公证的情况下，macOS 可能阻止首次打开。请在 Finder 中按住 Control 点击 App，选择“打开”；确认安全后，后续可正常双击启动。

## 从源码 ZIP 运行

1. 在 GitHub Releases 下载 `Skill-Pet-*-source.zip`。
2. 解压后在终端进入项目目录。
3. 按上面的“构建本地 App”命令执行。

源码 ZIP 不含 `node_modules` 和编译输出，下载者需要在自己电脑上执行 `npm install` 和 `npm run build`。

## 仅网页预览

```bash
npm run preview
```

然后访问 `http://127.0.0.1:4174`。网页预览只用于查看列表界面；它无法模拟 macOS 透明悬浮窗、窗口拖动和按屏幕方向展开。

## 使用与数据边界

Skill Pet 只读扫描本机以下来源：

- `~/.codex/skills`
- 当前项目中的 `.codex/skills` 或 `.agents/skills`
- `~/.codex/plugins/cache` 中非 OpenAI 内置市场的插件

它不会：

- 上传 skills、SKILL.md 内容或路径
- 启用、禁用、安装、删除或执行任何 skill
- 修改 Codex 配置
- 启动本地 HTTP 服务（Tauri App 本体）

## 项目维护

发布和维护说明见：

- [Build guide](BUILD.md)
- [Architecture](documentation/architecture.md)
- [Window and scan flows](documentation/flows.md)
- [Permissions](documentation/permissions.md)
- [Release test map](documentation/tests.md)
- [Product roadmap](documentation/roadmap.md)
- [Interface direction](documentation/interface.md)

## 发布到 GitHub

仓库维护者可创建一个公开仓库并推送：

```bash
git init
git add .
git commit -m "Initial release"
gh repo create skill-pet --public --source=. --remote=origin --push
```

随后在 GitHub Releases 上传 `Skill-Pet-*-source.zip`。正式向他人分发 `.app` 前，建议补充 Developer ID 签名和 Apple notarization。

## License

[MIT](LICENSE)
