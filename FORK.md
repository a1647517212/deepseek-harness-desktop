# DeepSeek Harness Desktop 自维护记录(完整备忘)

> 本文件是**唯一权威记录**:fork 仓库内与 OneDrive 各存一份,内容同步。修改任何配置前先读这里。
> 最后更新:2026-08-15

---

## 0. 一句话总结

自维护仓库 [a1647517212/deepseek-harness-desktop](https://github.com/a1647517212/deepseek-harness-desktop):**保留上游全部机制(含应用内自动更新),更新源指向自己的仓库**,与原作者的仓库彻底脱钩。

---

## 1. 背景:这是什么、为什么自维护

### 1.1 项目原理(速记)

- 上游 deepseek-harness-desktop 是一个约 500 行的 Electron 壳:用 Electron 自带 Node(ELECTRON_RUN_AS_NODE=1 + --expose-internals)以子进程拉起官方 npm 包 @deepseek-ai/dsh 的 web 配置档,窗口加载 127.0.0.1 上的上游界面,并守护其生命周期。
- **引擎就是官方包本身**(不复制一行界面代码),数据目录 ~/.dsh 与 CLI 共享。
- 唯一的功能替换:目录选择器(koffi 在 Electron Node 下崩溃)→ 桌面插件桥接系统原生对话框。
- 引擎对 HMR 加载器原生支持两条路径(node-addon-require-builtin / --expose-internals),桌面端用的后者是受支持模式。

### 1.2 为什么自维护(威胁模型)

| 威胁 | fork 能否防御 |
| --- | --- |
| 原作者仓库/账号被攻破 → 恶意自动更新 | ✅ 已切断(更新源 = 自己的仓库) |
| npm 引擎包被投毒(新版本) | ❌ 依然存在——自动发布会跟随 npm,升级前人工看 changelog |
| 已安装的同版本 npm 包被换包 | 🟡 lockfile 的 integrity(SHA-512)防住 |
| Electron/Chromium CVE | ❌ 需要定期合并上游跟进(见 §6) |
| 引擎运行时代码执行能力 | ❌ DSH 设计本质,CLI 同样如此 |

---

## 2. 关键决策记录(为什么这么做)

1. **全新仓库,不是 GitHub fork** —— 绕开 GitHub 对 fork 禁用定时任务(schedule)的限制,release.yml 的每日自动同步原生运行。代价:没有 fork 同步按钮,合并上游走手动流程。
2. **保留 appId/productName 不变** —— 同一标识 = 无缝替换原安装;单实例锁共享,防止两个引擎同时跑。
3. **仓库 public** —— electron-updater 从 GitHub Releases 拉更新,私有仓库需在应用内嵌 token,不安全。
4. **保留全部机制** —— electron-updater、自动发版工作流、CI 冒烟测试、引擎版本镜像规则(0.1.0-rc.6.0 格式)全部原样。
5. **构建未签名**(现状)—— SmartScreen/Gatekeeper 会提示;自动更新包无签名校验,更新链安全依赖"自己的仓库 + 自己的 GitHub 账号"。
6. **提交身份** —— 本地 git 已配置为 a1647517212 <49139752+a1647517212@users.noreply.github.com>。

---

## 3. 与上游的差异(精确清单)

| 文件 | 改动 |
| --- | --- |
| package.json → build.publish.owner | hongfeiyucode → a1647517212(**更新源重定向,唯一关键改动**) |
| package.json → homepage / repository.url | 同上 |
| scripts/set-fork-owner.mjs | 新增:一键把 owner 写入 package.json + README 徽章;合并上游后必跑 |
| scripts/fork-daily.ps1 | 新增:本地每日触发发布(备用,正常无需) |
| FORK.md | 新增:本记录 |
| 其余全部(含 appId、release.yml、ci.yml、updater.mjs) | **未动** |

> set-fork-owner.mjs 用法:node scripts/set-fork-owner.mjs a1647517212(幂等,可重复执行)

---

## 4. 当前状态(2026-08-15 记录)

- 仓库:a1647517212/deepseek-harness-desktop,public,默认分支 master,Actions 已启用
- 本地工作副本:C:/Users/page/OneDrive/文档-综合/学习资料/AI相关/ai量化学习v2/deepseek-harness-desktop(origin=自己的仓库,upstream=原作者仓库)
- 首次发布:**v0.1.0-rc.6.1**(2026-08-14,Pre-release,含 latest.yml),构建 run 31824189764 全绿
- 内嵌引擎:@deepseek-ai/dsh 0.1.0-rc.6(精确固定)
- 版本规则:桌面版本镜像引擎——上游 0.1.0-rc.7 → 桌面 0.1.0-rc.7.0;仅桌面重建递增末段(rc.6.1 → rc.6.2);发布标签 desktop-v<版本>
- 已安装应用:需要手动下载首次安装包安装(版本 ≥ 0.1.0-rc.6.1);此后更新走应用内自动更新

---

## 5. 更新机制全景

```
你的仓库 Releases (latest.yml) ── electron-updater 每 6h 检查(Win/Linux;macOS 未签名停用)

你的 Release workflow(schedule 每日 03:23 UTC 自动;或手动触发)

npm registry(@deepseek-ai/dsh 及插件,新版本出现 → 自动固定 + 构建 + 发布)
```

触发方式:
1. **自动**:schedule 每日 03:23 UTC —— 有新引擎版本才构建,无变化不动;
2. **手动**:gh workflow run release.yml -R a1647517212/deepseek-harness-desktop —— 无参数时自动采纳 npm 新版本,无新版本则补丁重建(+1);
3. **精确**:推 tag desktop-v<版本> 构建指定版本。

---

## 6. 维护纪律(最重要,务必遵守)

1. **★ 合并上游后必跑** node scripts/set-fork-owner.mjs a1647517212,然后 git diff package.json 确认 publish.owner 仍是 a1647517212——上游改 package.json(如升级 Electron)会**静默把更新源改回 hongfeiyucode**。
2. **升级引擎前看 changelog**:release 自动采纳 npm 新版本,若对上游不放心,升级前到 npm 页核对版本与变更。
3. **Electron 安全更新是长期义务**:定期 git fetch upstream && git merge upstream/master(Electron/Chromium CVE 不断)。
4. **不要同时运行桌面端和 CLI dsh web** —— 共享 ~/.dsh 且引擎无数据锁,并发写可能踩踏。
5. **只从自己的 Releases 下载安装包**,核对 SHA256(GitHub Release 资产页可查)。
6. **gh 命令加 -R a1647517212/deepseek-harness-desktop**:本地有双 remote(origin/upstream),不带 -R 会解析到原作者仓库。

---

## 7. 操作手册

### 7.1 合并上游(壳层修复 / Electron 升级)

```sh
cd deepseek-harness-desktop
git fetch upstream
git merge upstream/master
node scripts/set-fork-owner.mjs a1647517212    # ★ 必跑
git diff package.json                          # 确认 publish.owner
git push
```

### 7.2 手动触发发布

```sh
gh workflow run release.yml -R a1647517212/deepseek-harness-desktop
gh run watch -R a1647517212/deepseek-harness-desktop
```

### 7.3 本地验证(不发布)

```sh
npm install        # 或 npm ci
npm run smoke      # 引擎冒烟(独立临时 DSH_HOME)
npm start          # 本地起桌面应用
```

### 7.4 日常使用提示

- 数据在 ~/.dsh(与 CLI 互通:会话/设置/插件);想隔离设 DSH_HOME 环境变量。
- 插件完全兼容:插件在 ~/.dsh/profiles/web/(package.json 依赖 + cordis.patch.yml 列表),桌面端加载分层(bundle → 用户层 → 桌面补丁层),桌面补丁只禁目录选择器一行,不碰用户插件。
- 窗口关闭即引擎退出,不留后台进程。

---

## 8. 风险备忘(不因自维护而消失)

- **npm 供应链**:引擎/插件来自 npm,自动发布会跟随;缓解 = 升级前看 changelog + lockfile integrity。
- **未签名构建**:安装/更新均无法做签名校验;更新链安全 = 自己仓库 + 自己账号的安全。
- **Electron CVE**:长期义务,靠 §7.1 定期合并上游。
- **引擎数据无锁**:与 CLI 并发有风险(§6.4)。
- **项目年轻**:上游与桌面端均为 2026-08 新建、0.1.0-rc 阶段,接口可能变动;桌面端自动跟随可缓解,但出现异常发布时以 §7.2 手动流程回退。

---

## 9. 兼容性速查(与官方 dsh 的关系)

- 桌面端**不使用**全局安装的 dsh,内嵌自己的 @deepseek-ai/dsh(精确固定版本),数据经 ~/.dsh 与 CLI 互通。
- 端口:桌面端用 32123–32125(CLI web 默认 3080),网络层互不冲突。
- 与 CLI 同版本时数据零差异;上游发新版本后桌面端最长滞后约 24h(每日同步)。
- 原生模块:node-pty 为 NAPI 预编译,兼容;个别原生插件在 Electron Node 下可能异常(目录选择器先例)。

---

## 10. 相关链接

- 本仓库:https://github.com/a1647517212/deepseek-harness-desktop
- 上游桌面端:https://github.com/hongfeiyucode/deepseek-harness-desktop
- 上游引擎:https://github.com/deepseek-ai/deepseek-harness / npm @deepseek-ai/dsh
