# dev/01 · 架构与红线落点矩阵

> 上游：FIN-Pod 方法论 P2（九位落点矩阵）/ P0（复用边界表）
> 本文不覆盖：引擎内部算法（04-guard-engine）、接口字段级契约（08-api）、错误码全表（11-errors）
> 权威级：与 CLAUDE.md 红线区冲突时以本文为准并回写 CLAUDE.md

## 1. 分层架构

```text
FIN 5.3.0 底座（Haxall 内核：Folio/hisRead/alarm/会话与授权）
  ├─ lib/ups/*.xeto      语义库（本 Pod 唯一模型增量，P3）
  ├─ fan/UpsPodExt.fan   Pod 入口（@ExtMeta 注册）
  ├─ fan/UpsPodLib.fan   Axon 函数（upsOverview() 等，引擎实现层）
  ├─ frontend/           SPA（Ractive 1.4，# 号路由，D-06）
  │    MockAdapter（演示）/ FinAdapter（实例，fail-closed）
  └─ connectors          连接器在线状态/点位新鲜度（底座能力，不复述）
```

- 引擎不得持有可变状态；重计算经底座 Scheduler 串行化，不自建 Actor 池
- Folio 无跨 rec 事务：写路径一律按批 + 游标 + 红冲（反向条目），不物理删除（R5）
- 前端不自带任何认证/授权逻辑，权限完全由 FIN 会话驱动（R1）

## 2. 复用边界表（P0 结论，与详设 §2 一致）

| 能力 | 归属 | 本 Pod 动作 |
|---|---|---|
| 记录持久化 Folio | 底座 | 复用，只增 ups 域记录 |
| 历史读 hisRead | 底座 | 复用（M1 趋势/SOC/负载全走此通道，Q7/Q10） |
| 告警体系 severity | 底座 | 复用，不自建分级（Q3） |
| 会话/授权/站点过滤 | 底座 | 复用（R1，前端零权限逻辑） |
| 调度 Scheduler | 底座 | 复用，不自建 Actor 池 |
| UI 框架 Ractive | 底座自带 | 锁定版本，vendor 原样引用（R4） |
| UPS 领域模型 | **本 Pod 新增** | lib/ups/*.xeto（P3 五步产出） |
| 聚合视图 upsOverview() | **本 Pod 新增** | 唯一新增 Axon 函数（零新增论证见详设 §2） |

## 3. 红线九位落点矩阵（P2 核心产物）

> 判定口径：九个落点全部填满才算落地，空格 = 口号红线。每矩阵末行（审计）按需。

### R1 · 永不绕过 FIN 授权模型

| # | 落点 | 落地 |
|---|---|---|
| 1 | 模型位 | upsSite = 权限隔离边界；点位经 equipRef→upsUnit→upsSite 推导链归属站点 |
| 2 | 构造断言 | FinAdapter 无 FIN 会话即 fail-closed 抛错（已实现，UpsPodLib 占位同规） |
| 3 | 仓储校验 | upsOverview() 侧按 principal scope 过滤站点（U-API-01 待实例验证，当前 fail-closed） |
| 4 | 引擎机制 | 无独立权限引擎——零新增，复用底座会话（详设 §2） |
| 5 | 错误码 | UPS-2001 越权访问（403 语义，写审计）/ UPS-2002 未认证（见 11-errors） |
| 6 | API 行为 | 越权返回专用码 + 审计记录；不给部分数据、不静默置空 |
| 7 | UI 呈现 | 前端不做权限性隐藏逻辑；无授权站点 = 空视图 + 明示文案 |
| 8 | 测试用例 | TC-M1-权限-*（转 U-UI-03，待实例）；TC-M1-逻辑-03 站点筛选回归 |
| 9 | CI 检查 | scripts/check/r1-no-frontend-auth.cjs：前端无 password/login/token/bearer 等认证痕迹 |
| 10 | 审计 | 越权访问必留 actor/target/ts（底座审计通道） |

### R2 · 只读优先，写操作必经守门（fail-closed）

| # | 落点 | 落地 |
|---|---|---|
| 1 | 模型位 | 点位全部只读（复用 ph）；M5 配置对象独立域，发布态与草稿态分离 |
| 2 | 构造断言 | 写请求构造期断言：必带幂等键 + 校验通过标记，缺一即抛 |
| 3 | 仓储校验 | 校验未过不可发布（验收 A3：拦截率 100%），拒绝不静默忽略 |
| 4 | 引擎机制 | 守门引擎（04-guard-engine 规划；硬否决/软告警两级） |
| 5 | 错误码 | UPS-6001 守门否决（判决 200+rejected）/ UPS-6004 校验未过（422 语义） |
| 6 | API 行为 | 判决类结果一律 200，业务结果非错误；写只读对象报错不静默 |
| 7 | UI 呈现 | 校验未过的配置不渲染发布入口（不渲染 ≠ 禁用） |
| 8 | 测试用例 | TC-M5-* 校验拦截/幂等重放（M5 微流程定义） |
| 9 | CI 检查 | scripts/check/r2-no-write-path.cjs：fan/与前端无 pointWrite/invokeAction 写语义 |
| 10 | 审计 | 全部写操作留 actor/op/before/after/ts，after 含当时判据，保留 ≥5 年 |

### R3 · 数据宁缺毋假（三态化）

| # | 落点 | 落地 |
|---|---|---|
| 1 | 模型位 | upsDataFreshness 枚举（ok/stale/gap），库级承载（lib/ups/tags.xeto） |
| 2 | 构造断言 | 采集时间戳缺失 → 强制 gap；超时 >2×轮询周期 → stale（classifyFreshness） |
| 3 | 仓储校验 | 读通道无写入；估算/换算值必须带 reference 级来源标记（mapping.xeto 来源等级） |
| 4 | 引擎机制 | 断讯/缺口单元不生成趋势缓冲（hasTrend=false，Q11）；无实测值不画最后已知缓冲 |
| 5 | 错误码 | 非错误态：UPS-5001 参考值降级 / UPS-5002 缺口（200 提示级，见 11-errors） |
| 6 | API 行为 | 响应带 freshness 字段；禁止以默认值/插值静默填补 |
| 7 | UI 呈现 | 参考值/缺口显式标注（fresh-stale 黄 / fresh-gap 红）；断讯卡等高虚线占位（D-M1-15） |
| 8 | 测试用例 | TC-M1-逻辑-02 时效三态 / TC-M1-逻辑-11 hasTrend / TC-M1-UI-09 占位 |
| 9 | CI 检查 | scripts/check/r3-no-fake-data.cjs：数据链路无 Math.random、种子无墙钟、fail-closed 无假数据兜底 |
| 10 | 审计 | 降级口径变化（ok→stale 批量出现）写审计，防长期以参考值充当实测 |

### R4 · 不改写上游内核（只扩展不补丁）

| # | 落点 | 落地 |
|---|---|---|
| 1 | 模型位 | 复用 ph/equip/site 既有标签，不重定义（xeto lint 门禁，U-DATA-01） |
| 2 | 构造断言 | lib.xeto 显式声明依赖（sys→ph→ph.points→ph.equips→ups），不得倒挂 |
| 3 | 仓储校验 | 不触碰底座 rec 类型定义，ups 域记录独立 |
| 4 | 引擎机制 | 引擎只经 @Axon 注册扩展，不改内核调度/告警/会话链路 |
| 5 | 错误码 | UPS-4001 连接器通讯异常（外部数据域，见 11-errors） |
| 6 | API 行为 | 底座接口不合并、不包装、不代理转发 |
| 7 | UI 呈现 | vendor/ractive.min.js 原样引用，不本地化魔改 |
| 8 | 测试用例 | 依赖版本锁定 build.fan（M2 微流程段 3 复核） |
| 9 | CI 检查 | scripts/check/r4-no-kernel-patch.cjs：vendor 清单白名单 + build.fan 版本钉死 |
| 10 | 审计 | 无（静态约束即可审计） |

### R5 · 历史不可改（版本化 + 幂等 + 红冲）

| # | 落点 | 落地 |
|---|---|---|
| 1 | 模型位 | mapping.xeto：外部编码映射带生效期，只新增版本，不修改历史 |
| 2 | 构造断言 | 映射构造断言：同来源+同外部编码生效期不得重叠；拆分组比例之和=1 |
| 3 | 仓储校验 | 修正走红冲（反向条目），不物理删除；周期状态 failed 可审计重放 |
| 4 | 引擎机制 | 幂等键 = SHA-1(op|siteRef|span|granularity)；按批提交+批次游标 |
| 5 | 错误码 | UPS-6002 缺幂等键（400 语义）/ UPS-6003 幂等键冲突（409 语义） |
| 6 | API 行为 | 写接口必带 Idempotency-Key，缺失即报错；缓存 24h |
| 7 | UI 呈现 | 配置/映射版本历史只读列表，无编辑入口（M5） |
| 8 | 测试用例 | TC-M5-* 幂等重放/红冲重算（M5 微流程定义）；TC-M1-逻辑-08 种子幂等 |
| 9 | CI 检查 | scripts/check/r5-idempotent-seed.cjs：种子两次生成逐字节一致（演示数据亦守 R5） |
| 10 | 审计 | 每次红冲留原条目引用 + 反向条目关联，可无损重算 |

## 4. 门禁自检（P2）

- [x] 红线 5 条 ≤ 7（R1~R5，CLAUDE.md 第一屏）
- [x] 每条红线九位落点填满（本节 §3，第 10 审计位按需）
- [x] 每条红线 ≥1 CI 检查（scripts/check/，P6 段落地并运行留证）
- [ ] 落点中含 U-* 未验证项的，解锁后回写本条（U-API-01/U-DATA-01/U-UI-03）
