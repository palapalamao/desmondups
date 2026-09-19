# dev/08 · 接口契约（REST 总则 / Axon / 统一约定）

> 上游：FIN-Pod 方法论 P4（REST 契约总则一次定死 / 错误码全表在 11-errors）
> 本文不覆盖：错误码逐条释义（11-errors）、引擎内部（04-guard-engine）

## 0. 零新增结论（本 Pod 的接口面形态）

upsPod **不设自有 REST 端点**（零新增论证，详设 §2）：接口面 = 
**Axon 函数（FIN 会话内调用）+ 前端 SPA（FIN 顶栏菜单深链，D-06）**。

下表 REST 总则为**一次定死的契约预留**：二期若对客户系统开放 REST，
即整体适用、不得再议；届时基址 `/api/ups/v1` 与底座 `/api/base/v1` 并存不合并。

## 1. REST 契约总则（预留，一次定死）

| 项 | 约定 |
|---|---|
| 基址 | `/api/ups/v1`（与底座接口并存不合并） |
| 鉴权 | 复用底座会话机制；本 Pod 不实现任何认证逻辑（R1） |
| 时间 | ISO 8601 带时区 |
| 账期 | `span=2026-08` 或 `2026-08-01..2026-09-01`（左闭右开） |
| 分页 | `?page=&limit=`，响应头 `X-Total-Count`，limit 有上限 |
| 幂等 | 写接口必带 `Idempotency-Key`，缓存 24h，缺失即 UPS-6002 |
| 排序 | `?sort=-ts,val` |
| 错误 | HTTP 状态 + `{"error":{"code","msg","detail"}}`，**不暴露堆栈** |
| 数据范围 | Principal 携带 scope，越权返回 UPS-2001 并写审计 |
| 只读保护 | 写只读对象一律报错（UPS-6001 域），**不静默忽略** |
| 业务判决 | 判决类结果（通过/否决）一律 HTTP 200，判决本身是正常业务结果 |
| 长任务 | `202 {jobId}` + 轮询进度接口 |

## 2. Axon 函数契约（当前接口面）

| 函数 | 签名 | 行为 | 状态 |
|---|---|---|---|
| upsOverview | `upsOverview(site?: Ref)` | 授权范围内 UPS 单元聚合视图（清单/严重度/时效三态/趋势最近值） | fail-closed 占位（U-API-01） |

- 返回结构每项必带 `freshness: upsDataFreshness`（ok/stale/gap），下游禁止默认值兜底（R3）
- 越权站点：不返回部分数据，按 R1 矩阵第 6 位处理（UPS-2001 + 审计）
- M2~M6 新增函数在同表追加，不得另立契约文档

## 3. 统一约定

- 错误码格式/分段/收敛类型：见 `11-errors.md`（对外异常统一收敛为 `UpsError`，携带 code/msg/detail/httpStatus）
- 幂等键算法：`SHA-1(op|siteRef|span|granularity)`（R5；Folio 无跨 rec 事务，按批 + 游标 + 红冲）
- 审计字段：`actor / op / target / before / after / ts`；after 必须含当时实测值与判据，不只结论
- 前端路由：`#/ups/<page>`（D-06 SPA 深链）；状态写入 hash，返回天然保留
