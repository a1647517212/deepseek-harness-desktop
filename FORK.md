# 自维护仓库手册(DeepSeek Harness Desktop)

本仓库的目标:**保留原项目全部机制(含应用内自动更新),但把更新源指向自己的 GitHub 仓库**。

> **重要:本仓库是全新仓库(推送了上游代码),不是 GitHub 意义上的 fork**——因此 GitHub 对 fork 的定时任务限制不适用,`schedule` 每日自动跟随上游**原生可用**;代价是没有 GitHub 的 fork 同步按钮,合并上游走下方的手动流程。
应用内更新由 electron-updater 驱动,它从构建时嵌入的 publish 配置读取更新源——即本仓库的 GitHub Releases。

## 改了什么(相比上游)

| 文件 | 字段 | 改动 |
| --- | --- | --- |
| package.json | build.publish.owner | hongfeiyucode → a1647517212(更新源重定向,唯一关键改动) |
| package.json | homepage / repository.url | 同上(已替换) |
| 其余全部 | — | **未动**。release.yml / ci.yml 不写死仓库(基于 GITHUB_TOKEN 作用于当前仓库);appId / productName 保持不变——同一标识可无缝替换原安装,且共享单实例锁,防止两个引擎同时跑 |

> **合并上游后重跑**:`node scripts/set-fork-owner.mjs <你的GitHub用户名>` 一次搞定 package.json + README 徽章(已执行,合并上游后必须重跑)。

## 更新流(改造后)

```
你的仓库 Releases (latest.yml)
   ↑ electron-updater 每 6h 检查(Windows/Linux;macOS 因未签名停用)
   ↑ 后台下载 → 重启时提示安装
你的 Release workflow(手动/定时触发)
   ↑ 检查 npm 上新版 @deepseek-ai/dsh → 固定版本 → 三平台构建 → 发布
npm registry(@deepseek-ai/dsh 及插件)
```

## 每日自动同步:原生 schedule 已生效

本仓库不是 GitHub fork,`release.yml` 的 `schedule`(每日 03:23 UTC)会**原生运行**:
有新引擎版本 → 固定并发布;无变化 → 什么都不做。原项目的全部机制均已保留。

备用/补充触发方式:

1. **手动**:`gh workflow run release.yml` ——无参数触发时,release-plan 会自动采纳 npm 上的新引擎版本;没有新版本则补丁重建(+1)。
2. **本地兜底**:`scripts/fork-daily.ps1`(Windows 任务计划程序每日执行)可在 schedule 异常时兜底。
3. **推 tag**:`git tag desktop-v<版本> && git push origin desktop-v<版本>` 精确构建某版本。

## 初始化记录(已完成)

- 仓库:`a1647517212/deepseek-harness-desktop`(public,默认分支 master)
- Actions:已启用(`actions/permissions.enabled = true`)
- 更新源:package.json `build.publish.owner` = `a1647517212`(electron-updater 将从本仓库 Releases 拉更新)
- 首次发布:已触发 `gh workflow run release.yml`(版本 0.1.0-rc.6.0 → 0.1.0-rc.6.1,首个含 latest.yml 的 Release)

日后如需重建/迁移,参考:

```sh
gh auth login
node scripts/set-fork-owner.mjs <你的GitHub用户名>
git push
gh workflow run release.yml                    # 采纳新引擎或补丁重建
# 或: git push origin desktop-v<版本>          # 精确发布某版本
```

> 仓库建议 **public**:electron-updater 从 GitHub Releases 拉更新,私有仓库需要在运行的应用里
> 携带 token,不安全。public 仓库的发布产物本来就是公开可下载的,与原项目无异。
> 用私有仓库会破坏自动更新。

## 上游合并流程(跟进壳层修复 / Electron 安全更新)

```sh
git remote add upstream https://github.com/hongfeiyucode/deepseek-harness-desktop.git  # 一次
git fetch upstream
git merge upstream/master
node scripts/set-fork-owner.mjs <你的用户名>    # ★ 合并后必跑:防 publish 被上游覆盖
git diff package.json                            # 人工确认 publish.owner 仍指向你的仓库
git push
```

**这是最重要的纪律**:上游对 package.json 的任何改动(例如升级 Electron 版本)合入后,
会**静默把 publish.owner 改回 hongfeiyucode**——不跑 set-fork-owner 就推送,你的更新源会悄悄回到原作者仓库。

## 风险备忘(与上游一致,不因 fork 消失)

- **引擎仍来自 npm**:release workflow 自动采纳 npm 上的新版 @deepseek-ai/dsh。
  若 npm 侧被投毒,你的 fork 也会跟随。缓解:升级前看 npm 包 changelog;lockfile 的 integrity 哈希防同版本换包。
- **未签名构建**:Windows SmartScreen / macOS Gatekeeper 会提示;自动更新包无法做签名校验,
  更新链安全依赖"你的仓库 + 你的 GitHub 账号"。
- **Electron 安全更新是长期义务**:Electron/Chromium CVE 不断,需定期执行上面的合并流程跟进。
- **数据**:仍与 CLI 共享 ~/.dsh,勿与 `dsh web` 同时运行(引擎无数据锁)。
