# dev/ 契约层文档索引（阶段 4 产出，当前为占位）

阅读顺序（每篇开头声明"不覆盖什么"）：

1. `00-conventions.md` — 编码与提交规范
2. `01-architecture.md` — 分层 + 复用边界表 + 并发/事务模型
3. `02-ups-lib.md` — 语义库说明（对应 `lib/ups/*.xeto`；库级铁律与命名规约以 `lib/ups/README.md` 第一屏为准）
4. `03-domain.md` — 领域类构造期不变式 + Repo 契约
5. `04-guard-engine.md` — 守门引擎（fail-closed 规则全量清单）
6. `08-api.md` — 接口契约（分页/幂等/错误格式）
7. `11-errors.md` — 错误码全表（UPS-0000 起）
8. `12-scheduler.md` — 调度/事务/幂等
9. `13-frontend.md` — 路由/权限矩阵/强制渲染规则
10. `14-test-plan.md` — 测试用例表 + CI 红线 + 验收回收
11. `15-tasks.md` — 里程碑 + 阻塞风险表

> 规则：越靠近代码越权威；与上游（业务方案/详设）冲突时以本文档为准并回写上游。
