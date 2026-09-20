# UPS POD 与 FIN Expert 数据职责设计

日期：2026-09-20
状态：用户已批准核心边界，待规格审查

## 目标

UPS POD 的界面数据统一来自当前 FIN 项目的 Folio。POD 可以通过 UI 创建和安全编辑 UPS 设备树元数据，但不生成模拟数据，也不写入 point 的运行字段。FIN Expert 独立负责模拟值；真实采集值仍由现有 FIN 连接器或外部采集系统负责。

## 已批准的职责边界

### UPS POD

- 读取当前项目的 `site → floor → equip → point`。
- 总览只读取 point 的 `curVal` 和 `curStatusTs`；字段缺失时显示缺口，不读取 `val`、`dmValue` 或静态文件兜底。
- 提供设备树管理 UI，可创建和维护：
  - site 记录；
  - floor 记录及 `siteRef`；
  - UPS equip 记录及 `siteRef`、`floorRef`；
  - point 记录及 `equipRef`、语义标签、单位、类型等元数据。
- 设备树 UI 不设置、修改或删除 `curVal`、`curStatusTs`、历史值和模拟源值。
- “维护”限定为创建记录和编辑下述白名单元数据；本期不提供删除、级联删除或更换父级引用。删除和重挂载继续走 FIN 管理流程。
- POD 启动、轮询和后台任务均不得生成或刷新模拟遥测。

### FIN Expert

- 按已创建的 point 记录写入或持续刷新模拟场景的 `curVal`、`curStatusTs`。
- 负责模拟场景的值变化规律、模拟通讯状态和模拟更新频率。
- FIN Expert 的数据操作与 POD 的构建、安装和启动分离；部署 POD 不应改变业务设备树或实时值。

### 真实连接器与外部采集系统

- 继续按 FIN 现有机制写入真实 point 的 `curVal`、`curStatusTs` 和历史数据。
- 本次改造不改变连接器配置、采集任务或真实数据所有权。

## 数据流

```text
设备树结构维护：
用户 → UPS POD 建树 UI → Folio site/floor/equip/point 元数据

运行值写入：
FIN Expert → 模拟 point.curVal / point.curStatusTs
FIN 连接器或外部采集系统 → 真实 point.curVal / point.curStatusTs / 历史数据

页面读取：
UPS POD → upsOverview() → Folio 设备树与 point.curVal → FinAdapter → UI
```

POD 页面仅接受外层 FIN 页面路径 `/finMobile/<project>` 中的项目名，并通过 `/api/<project>/...` 访问同一项目。iframe 自身没有项目路径时读取同源 parent/top；若 parent、top 和 referrer 中出现互相冲突的项目名，或无法解析项目名，则 fail-closed。禁止回落到默认项目或其他已打开项目。会话失效或 Folio 调用失败时，页面明确报错，不切换到模拟数据。

## 元数据写入白名单

服务端按记录类型过滤并校验写入字段。请求只要包含保留字段即整体拒绝，不采用静默丢弃。

| 类型 | 创建请求字段 | 服务端注入字段 | 更新请求字段 |
|---|---|---|---|
| site | `dis`、`navName`、`tz`、`upsTreeKey` | `site`、`upsSite` | `dis`、`navName`、`tz` |
| floor | `dis`、`navName`、`siteRef`、`upsTreeKey` | `floor` | `dis`、`navName` |
| equip | `dis`、`navName`、`siteRef`、`floorRef`、`make`、`model`、`serial`、`ratedKva`、`upsTreeKey` | `equip`、`upsUnit` | `dis`、`navName`、`make`、`model`、`serial`、`ratedKva` |
| point | `dis`、`navName`、`siteRef`、`floorRef`、`equipRef`、`kind`、`unit`、恰一个受支持的 UPS 指标选择键、`upsTreeKey` | `point`、请求所选的 UPS 指标 Marker | `dis`、`navName`、`kind`、`unit` |

客户端创建请求不得传入 `site`、`floor`、`equip`、`point`、`upsSite` 或 `upsUnit`；服务端根据 `recType` 注入对应结构标记。本期支持的 point 指标选择键为 `upsSocPct`、`upsLoadPct`、`upsBatteryTemp`、`upsCommStatus`。point 创建请求必须且只能携带其中一个键，值为 `true`，服务端将其写为 Marker。

所有未列入对应操作白名单的字段均禁止写入，尤其包括 `curVal`、`curStatus`、`curStatusTs`、`his`、历史样本、告警状态、`val`、`dmValue`、`upsSimVal` 和 `upsSimTs`。`upsTreeKey`、类型标记、父级引用和 point 指标标记均为创建后不可变字段；修改请求包含这些字段时整体拒绝。更新已有 point 时，服务端只构造更新白名单字段 diff，不重写整条记录。

## 设备树 UI

设备树管理入口采用最小表单流程：

1. 选择或创建 site。
2. 在 site 下选择或创建 floor。
3. 在 floor 下创建 UPS equip。
4. 为 equip 创建标准 point 定义，例如 SOC、负载率、电池温度和通讯状态。
5. 编辑已存在记录时，只开放更新白名单；`upsTreeKey`、类型标记、父级引用和 point 指标标记不允许通过本 UI 修改。
6. 提交前展示将写入的结构标签；提交后重新读取 Folio 验证父子引用。

所有写操作使用当前 FIN 会话和权限。服务端再次校验记录类型、父级引用和允许的 point 标签。写入失败时不保留前端假成功状态。

每次创建由 UI 生成一个不可变 `upsTreeKey`，重试时复用同一个 key。服务端在当前项目内按 `upsTreeKey` 查重：找到相同类型和相同父级的记录即返回该记录；创建请求中的 `dis`、`navName` 等可编辑字段不参与重放判定，也不会覆盖该记录之后的编辑结果；发现类型或父级冲突则拒绝。向导每一步只创建一条 Folio 记录，成功一步后立即重读并展示记录 ID；后续步骤失败时，已创建的父级保持为有效设备树记录，用户可从最后成功步骤继续，不重复建树。

更新请求规范化后，服务端只提交值确实变化的字段；若所有请求字段均与 Folio 当前值相同，则返回 `status: "unchanged"`，不调用 commit，因此记录 `mod`、Folio 版本和提交观察者均不变化。create 与 update 按当前 Folio 分别串行化；获取同一 Folio 的 mutation lock 超时会返回稳定的 busy 错误，不阻塞其他 Folio。

## 现有实现迁移

- 删除 `UpsPodExt` 中向 Folio 发布模拟 `curVal` 的启动逻辑和 10 秒后台任务。
- 删除 `upsSimVal`、`upsSimTs` 及相关模拟字段。
- POD 部署脚本只安装、注册并启用 POD，不再执行设备树种子脚本。
- 保留 `upsOverview()` 的只读聚合逻辑，并继续限定只读 `curVal`、`curStatusTs`。
- 现有模拟树、`upsSimVal/upsSimTs` 标签的清理或模拟值维护通过 FIN Expert 执行，不由 POD 部署脚本执行。

## 错误处理

- 没有 point：显示数据缺口。
- point 没有 `curVal`：显示 `—`，不读取其他字段补值。
- `curStatusTs` 缺失时显示缺口。以浏览器当前时钟为基准，`now - curStatusTs > 20s` 时保留当前 `curVal`，但标记为“参考值”；恰好 20 秒仍标记“实测”。“参考值”只表示该 `curVal` 已过期，绝不表示读取 `val`、`dmValue` 或静态数据。
- 重名设备：以 Folio `id` 为唯一身份；建树 UI 在同一父级下阻止重复显示名，并展示冲突记录 ID。
- 任一建树步骤失败：停止后续写入，显示 FIN 返回的具体错误和最后成功步骤；已完成步骤通过重新读取确认，不伪造回滚成功。再次提交复用 `upsTreeKey`，不得创建重复记录。

## 验证与验收

1. 静态检查确认 POD 代码不存在 `curVal`/`curStatusTs` 写入、模拟定时任务和部署种子调用。
2. 构建并部署 POD，确认安装过程不改变 Folio 设备记录数量和实时值。
3. 通过建树 UI 创建一组 site/floor/equip/point，确认 point 只有元数据，没有 `curVal`。
4. 在 FIN Expert 写入 point 的 `curVal/curStatusTs` 前，页面显示缺口。
5. FIN Expert 写入后，页面在一个轮询周期内显示对应数值。
6. 停止 FIN Expert 更新后，20 秒边界仍为实测，超过 20 秒变为参考值；显示值仍是最后一个 `curVal`，POD 不产生自刷新值。
7. 编辑一个已经具有 `curVal`、`curStatusTs` 和历史数据的 point 元数据，确认这些运行字段和历史数据逐值保持不变。
8. 构造包含 `curVal`、`his` 或其他保留字段的 UI/API 请求，确认服务端整体拒绝且记录零变化；尝试修改 `upsTreeKey`、类型标记、父级引用和 point 指标标记时同样整体拒绝且记录零变化。
9. 在 site、floor、equip、point 每一步分别注入失败，确认 UI 停在最后成功步骤；使用相同 `upsTreeKey` 重试后不产生重复记录。
10. 分别测试项目名缺失、格式非法以及 parent/top/referrer 项目冲突，确认读写均失败且未访问默认项目；在 `mytest` 建树后确认其他项目记录数量不变。

## 不在本次范围

- POD 内置模拟器。
- POD 直接操作连接器或外部设备。
- POD 写入 `curVal`、历史数据或告警运行状态。
- 用静态 JSON、`dmValue` 或 `val` 代替实时值。

## 已否决方案

- **POD 内置定时模拟器**：混合了产品读取和测试数据生成职责，已否决。
- **部署时写入固定 `curVal`**：FIN 将 `curVal` 作为运行态标签，且固定时间会迅速过期，已否决。
- **只创建 equip、不创建 point 元数据**：无法形成可由 FIN Expert 驱动的完整设备树，已否决。
