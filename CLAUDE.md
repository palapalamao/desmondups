# desmondUPS 工程约定（入口一页纸）

> 依据《需求到交付方法论 v2.0》（上游：v1.0 已被用户替换删除，以 v2.0 为准）。
> 本文件三区结构是本体：红线区 + 关键机制区 + 运维手册区。
> 真相单一、权威下沉、冲突回写：冲突时以 docs/dev/ 契约层为准，并回写上游。

## 一、红线区（2026-09-18 起生效，所有新增必须满足）

| # | 红线 | 存量状态 | 强制执行机制 |
|---|---|---|---|
| R1 | 永不绕过 FIN 授权模型：所有读写经 FIN 会话与权限服务，前端不自带认证 | 无存量 | scripts/check/r1-no-frontend-auth.cjs + 落点矩阵 docs/dev/01 §3 |
| R2 | 只读优先：UPS 点位默认只读集成；任何写操作（配置下发/告警确认）必经守门引擎，fail-closed，全量留痕 | 无存量 | scripts/check/r2-no-write-path.cjs + 守门断言（04-guard-engine） |
| R3 | 数据宁缺毋假：无实测值标"缺口"，估算值标"参考值"，禁止静默兜底 | 无存量 | scripts/check/r3-no-fake-data.cjs + 三态枚举 tags.xeto |
| R4 | 不改写上游内核：只扩展不补丁；FIN/Haxall/Ractive 版本以 build.fan 锁定 | 无存量 | scripts/check/r4-no-kernel-patch.cjs + build.fan 钉版本 |
| R5 | 历史不可改：配置/映射版本化只新增；修正红冲；写操作幂等 | 无存量 | scripts/check/r5-idempotent-seed.cjs + 红冲约定（08-api） |

> 红线生命周期（v2.0 要求五件齐）：生效日期 ✓ / 存量清零 ✓（无存量）/ 审计脚本 → 阶段 6 上线 / 终审证据 → 阶段 7 / 运维手册 → 本文件三区。

## 二、关键机制区（实测结论 / 陷阱登记，踩坑即成文不过夜）

> 当前全部条目为知识库结论，未经 FIN 5.3.0 运行时实测（本机无实例），
> 实测后必须回写本条并注明验证日期与证据路径（docs/evidence/）。

| # | 机制 | 结论 | 验证状态 |
|---|---|---|---|
| M1 | ext pod 骨架 = build.fan + Ext.fan(@ExtMeta) + Lib.fan(@Axon) + funcs.trio + locale | 知识库（fin-dev-docs/01） | 未运行时验证 |
| M2 | UI 扩展需 npm run build 先于 fan build；Display 声明区分大小写 | 知识库（Optic 培训） | 未运行时验证 |
| M3 | 扩展须在「设置→扩展」启用；Pod 编译版本与 FIN 版本须兼容 | 知识库（Optic 培训） | 未运行时验证 |

**陷阱登记表**（初始为空，表头即格式）：

| 日期 | 环境/工具 | 现象 | 根因 | 正确写法 |
|---|---|---|---|---|
| 2026-09-18 | 浏览器 file:// 协议 | 双击 index.html 白屏/加载失败 | file:// 下 fetch() 本地 JSON 被 CORS 拦截 | 必须起本地静态服务（frontend/serve.js 或 npx serve）再访问 |
| 2026-09-18 | Ractive 1.4 模板 | on-submit 写 event.preventDefault() 无效、表单原生提交整页刷新 | Ractive 模板作用域无 event 变量，须用 @event 特殊引用 | 写 @event.preventDefault(), @this.fire(...) |
| 2026-09-18 | Ractive 1.4 fire() | fire('filter', obj) 后 handler 第二参数为 undefined，导航静默失败 | 单个对象参数会被 mixin 进事件上下文（第一参数） | 对象须逐字段从事件上下文取；标量参数不受影响 |
| 2026-09-19 | kimi-webbridge evaluate | 走查时 evaluate 里 location.hash=... 或 history.back() 后页面视图不变，误判 SPA 路由失效 | 扩展 evaluate 在隔离世界执行，改 hash 不触发页面主世界 hashchange 监听 | 走查导航一律用页内 click（真实用户路径）；evaluate 只用于断言/读取；webbridge navigate 换 URL 才是可信的整页加载路径 |
| 2026-09-19 | 浏览器隐藏页定时器 | 走查滚动特性时 12s 等待 DOM 不变，误判功能失效 | 标签页 visibilityState=hidden，Chrome 节流 setInterval（最低 1 次/分） | 走查前 Page.bringToFront 激活标签页；或单次等待 ≥60s 覆盖节流下限再断言 |
| 2026-09-19 | kimi-webbridge 守护 | curl 返回空、list_tabs 丢标签 | 守护进程异常退出留 stale PID 文件 | `kimi-webbridge status` 见 running:false → `start` 重启 → 重新 navigate（重启后会话标签登记丢失） |
| 2026-09-19 | serve.js 生命周期 | 走查中页面变 chrome-error:// | serve.js 随启动它的终端会话终止 | 走查前先探活 localhost:3000；死了在 tty 会话重拉（node serve.js） |
| 2026-09-19 | Node 锚点替换脚本 | 多行 replace 报"未命中"但单串探针又能找到该文本 | 目标文件混合行尾（CRLF/LF）；PowerShell here-string 写出的 .cjs 多行模板字面量带 CRLF | 多行模式一律用显式 \n 拼接的单引号串；动手前先探针验证目标行尾 |

## 三、运维手册区（重建恢复标准顺序，随实现滚动补充）

草案（阶段 6 前不可作为操作依据）：
1. git clone 本仓库 → 2. fan build 后端扩展 → 3. npm run build 前端 →
4. FIN「设置→扩展」启用 pod → 5. 建数脚本（幂等+确定性，scripts/seed）→
6. 审计脚本终审全绿（evidence/*_audit，运行记录留档 docs/evidence/）

## 附 · 仓库结构与命名速查

| 路径 | 内容 |
|---|---|
| 需求到交付方法论-v2.0.md | 方法论（外部输入，只读参考） |
| docs/00-阶段0-底座探测记录.md | 环境与底座盘点（含未决项 U1~U5） |
| docs/01-业务方案/ | 业务方案 = PRD + 决策记录表 |
| docs/02-详细设计/ | 详设（权威源 + 派生格式） |
| docs/specs/ docs/plans/ | 特性级微流程：设计决策记录 + 分段任务清单 |
| docs/demo/ | 静态演示（演示先行基线） |
| docs/evidence/ evidence/ | 证据链 / 数据与运行态审计脚本+终审 |
| docs/releasedoc/ | 对外发布资料 + 关键产品事实口径源 |
| docs/dev/ | 契约层开发文档 + 版本联动清单 |
| lib/ups/*.xeto docs/fig/ | 语义库源码 / 图源码+渲染图 |
| scripts/check-* | 源码红线检查 |

命名：模块 M1~Mn（需求主键）→ REQ-M<n>-<seq> / TC-M<n>-<seq>；里程碑 D1~Dn；
错误码 UPS-0000 起；分支 feat/M<n>-<slug>；版本联动清单见 docs/dev/（阶段 4 建）。


