# 墨言（dsh-moyan）

!墨言 / MoYan(https://github.com/elviszhang007/dsh-moyan/raw/master/Screenshots/FrontPage001.png) 

一个克制、安静的 DeepSeek Harness WebUI 插件：在左下角侧边栏「设置」按钮上方，完整显示一句名言、古诗词或游戏经典台词。

> 路漫漫其修远兮，吾将上下而求索。
> —— 屈原《离骚》

句子自动折行、出处单列一行；整体风格与 Harness 原生的「设置」行保持一致。

## 特性

- **完整显示**：字体与 Harness 主字体相同，颜色用透明度调淡；句子按需折行，出处单独一行，不喧宾夺主；
- **刷新频率可调**：每次打开 WebUI 刷新、或每天刷新（跨午夜自动换一句），也可以随时手动「换一句」；
- **回到上一句**：面板里的小箭头按钮可回退最近 5 次刷新，防止手快错过想看的句子；
- **近十步去重**：最近显示过的 10 句不会被随机换出；
- **语料外置**：直接编辑 `corpus.txt` 即可增删句子，刷新页面即生效，无需重启、无需改代码；
- **明暗主题**：样式全部使用 Harness 主题变量，自动跟随亮色/暗色主题；
- 侧边栏收起成窄轨时自动隐藏，不占用空间。

## 安装

### 前置要求

- Node.js ≥ 18；
- DeepSeek Harness (DSH) 已安装（全局或本地）
- pnpm（若非全局安装，则需要用于解析依赖）；

本插件为「树外插件」（profile 插件），通过 `dsh plugin` 安装。

### 安装方式

> 注意：安装前请确认DSH安装方式以使用下文中所有命令！
> - 若为全局安装，**请去除 '(pnpm)'**。 --> 即 dsh...
> - 否则请 **去除括号 '()'**，仅 **保留 'pnpm'**。 --> 即 pnpm dsh...

**从本地目录安装：**

```sh
(pnpm) dsh plugin --profile web add ./dsh-moyan
```

**从 GitHub 安装（可使用'#'选定版本）：**

> 注意：请将命令中的版本（v0.5.x）改为实际需要的版本，例如 v0.5.2。

```sh
(pnpm) dsh plugin --profile web add "git+https://github.com/elviszhang007/dsh-moyan.git#v0.5.x"
```

安装后请**重启 web profile**（插件集的变化在重启时生效），刷新页面：

```sh
(pnpm) dsh web
```

## 卸载

### 卸载流程

按包名移除：
```sh
(pnpm) dsh plugin --profile web remove dsh-moyan
```

### 清理痕迹

插件在浏览器 localStorage 中留下了设置键（`dsh-moyan:v1`），如需清除，在 WebUI 页面按 F12 打开控制台执行：

```js
localStorage.removeItem("dsh-moyan:v1")
```

## 使用

1. 侧边栏底部、「设置」上方会出现一句话，出处附在句后；
2. 鼠标悬停时，出处行尾浮现齿轮按钮，点击打开设置面板；
3. 面板中可以：
   - 切换刷新频率（**每次打开** / **每天**）；
   - 点 **换一句** 换一条（近 10 句不会重复）；
   - 点左侧小箭头 **回到上一句**（最多回退 5 步）；
   - 查看当前句的完整出处。

## 语料库

### 格式

语料保存在项目根目录的 `corpus.txt` 中，每行一条：

```
会当凌绝顶，一览众山小。 | 杜甫《望岳》
```

- 分隔符用半角 `|` 或全角 `｜` 均可；
- 以 `#` 开头的行和空行会被忽略；
- 句子不超过 30 字，出处尽量简短（书名/篇名/作品名即可）；
- 内置 100 余条语料，覆盖古诗词、中外文学作品与游戏台词。

### 编辑与生效

插件安装到 profile 时会把整个包复制到 `%USERPROFILE%\.dsh\profiles\node_modules\dsh-moyan\`。编辑该目录下的 `corpus.txt`，保存后**刷新页面即生效**（宿主每次请求都会重新读取文件，无需重启 dsh web）。

如果语料文件缺失或解析为空，插件会自动回退到内置语料，保证始终有内容显示。

## 工作原理

- `cordis.patch.yml` 向 profile 配置树插入一个 loader 行，宿主机的 client-modules 扫描器据此识别包内的 `dsh.client`（platform: web）声明，并把 `lib/client.js` 以 `/plugins/dsh-moyan/client.js` 提供给页面；
- Node 半通过 `ctx.inject(["webServer"])` 注册路由 `/plugins/dsh-moyan/corpus.txt`，实时读取语料文件（非 web profile 中自动退化为无操作）；
- 浏览器半以官方 client 插件的同一契约（`window.__ModuleLoader__.load`）注册，UI 挂载到 `sidebar.footer.action` slot——它位于 `sidebar.settings`（设置）正上方；
- 所有颜色与字体均取自 Harness 主题变量（`--dsw-font-family`、`--dsw-alias-label-secondary`、`--dsw-alias-interactive-bg-hover` 等），不写死任何配色。

## 开发与测试

无构建步骤、零运行时依赖——`lib/*.js` 即交付物。

```sh
npm test        # 运行测试（或直接 node tests/run-tests.js）
npm run check   # 语法检查
```

测试覆盖：语料格式与查重、语料文件与内置回退的一致性、出处抽查、选句与去重逻辑、随机采样均匀性、宿主路由行为。

修改代码后让改动生效：

```sh
dsh plugin --profile web add "D:\path\to\dsh-moyan"   # 重新安装/拷贝
# 重启 dsh web，刷新页面
```

## 兼容性

在 DeepSeek Harness `0.1.0-rc.6` 上开发与验证。DSH 仍在快速演进，slot 名、主题变量名、client 模块契约可能随版本变化；升级 Harness 后如遇异常，请提 Issue 并注明 DSH 版本。

## 反馈

欢迎提 Issue 分享语录（格式照 `句子 | 出处`）、报告问题或建议新功能。

## License

MIT
