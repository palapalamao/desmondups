# upsNew Figma + Tailwind UI 升级设计

## 1. 目标

将 `upsNew` 正式 UI 重构为与 `demo/AI-CES-IoT-UPS/index.html` 原型一致的 UPS 运行监测界面，并使用 Figma 建立可编辑设计稿、使用 Tailwind CSS 落地生产代码。

正式 UI 必须读取 FIN 设备树、实时点位、历史数据、告警和健康评估接口。原型中的静态数组、随机遥测和模拟停电操作不得进入正式实现。

## 2. 设计基准

原型是本次升级的唯一布局、信息层级和深色主题视觉基准：

- 深色工业控制台界面和 48px 网格背景。
- IBM Plex Sans 用于界面文字，IBM Plex Mono 用于数值、时间和技术标识。
- 青绿色表示正常，橙色表示警告，红色表示严重，蓝色表示信息。
- 3px 小圆角、细边框、紧凑面板和低装饰度。
- 顶部品牌、时钟和 UPS 设备切换标签。
- 设备状态 Hero：运行状态、设备名称、位置、预计续航和健康评分环。
- 三列设备信息面板：电池健康、负载与容量、电力电子、环境、转换与旁路、预测性维护。
- 底部全宽告警列表；运行事件在独立数据模型和接口完成前不混入告警。

允许的调整仅限：中文化、浅色主题、真实数据状态、历史详情交互、错误与空状态、无障碍和响应式修复。不得重新解释为侧边栏管理后台或通用卡片仪表板。

### 2.1 双主题

- 默认主题为浅色；首次访问不读取系统深色偏好来覆盖该默认值。
- 用户可通过头部的“浅色/深色”按钮切换主题，按钮显示当前状态和目标动作，并具有可读的 `aria-label`。
- 用户主动选择后保存到 `localStorage`，键名为 `upsNew.theme`，允许值仅为 `light` 或 `dark`。
- 页面初始化脚本在首屏绘制前应用已保存主题，避免主题闪烁；无有效保存值时使用浅色。
- 深色主题沿用原型的背景、面板、网格、边框和状态色。
- 浅色主题使用同一布局和组件结构，将背景映射为浅灰白、面板映射为白色、正文映射为深石墨色；正常、警告、严重、信息颜色在白色背景上满足文字和图形对比要求。
- 主题切换不得改变告警严重度、数据质量或运行模式的业务含义；状态始终同时使用文字或图形标记。
- 两套主题均设置匹配的 `color-scheme`、浏览器 `theme-color`、表单控件颜色、焦点样式和图表网格/坐标颜色。

## 3. 信息架构

正式页面采用单页设备监测结构，不再使用“总览/详情/告警/风险/映射”的左侧主菜单。

页面从上至下为：

1. 品牌与连接状态：`upsNew`、当前 FIN 项目、数据更新时间、系统时钟。
2. 设备选择：按 `Site → Floor → Equip` 组织 UPS 标签，标签展示设备名、Floor 和运行状态。
3. 设备状态 Hero：运行模式、设备类型、位置、预计续航、保障时长比较、健康评分。
4. 设备面板：按原型六块面板排列。
5. 告警：显示当前 UPS 的活动告警、严重度、时间、状态及允许的业务操作。
6. 页脚：数据来源、最近刷新时间，以及“设备遥测只读；告警确认是经授权的业务操作”说明。

映射工作台属于工程配置能力，不嵌入 UPS 运行监测主页面。现有映射接口与代码保留，但不占用原型主界面。

## 4. FIN 数据映射

### 4.1 设备树

- `upsSites()`：读取 Site。
- `upsFloors(siteRef)`：读取 Floor。
- `upsEquips(siteRef, floorRef)`：读取 UPS Equip。
- 所有 Equip 和 Point 必须包含 `siteRef`、`floorRef`；Point 还必须包含 `equipRef`。
- 禁止以 `spaceRef` 替代 `floorRef`。

### 4.2 实时点位

- `upsEquipSummary(equipRef)`：设备摘要。
- `upsEquipPoints(equipRef)`：设备关联点位与 `curVal`。
- 通过点位语义标签而非显示名称映射到原型字段。
- 缺少点位时显示“未配置”，不得生成替代数值。
- `curErr`、`curStatus`、更新时间和数据质量影响数值颜色及状态提示。
- `upsEquipPoints()` 返回的每条记录必须包含 `id`、`dis`、`equipRef`、`siteRef`、`floorRef`、`curVal`、`curStatus`、`upsObservedAt`、`upsDataQuality` 和 `upsStaleAfterSec`；`unit`、`curErr` 按点位类型和状态返回。`upsObservedAt` 是观测产生时间，不使用记录定义修改时间 `mod` 替代。
- 过期判断使用 `now - upsObservedAt > upsStaleAfterSec`。缺少观测时间或过期阈值时质量显示为“未知”，不得显示为正常。

字段选择采用“当前 Equip 下匹配全部必需标签，且单位等于指定单位”的规则。匹配 0 条时显示“未配置”；匹配 1 条时使用该点；匹配多条时优先 `primary` 标记，其次按 `dis` 和 `id` 稳定排序后选择第一条，同时显示“存在多个匹配点位”的质量提示。不得按中文或英文显示名猜测字段。

| 原型字段 | 必需标签 | 单位/类型 | 数据来源 |
|---|---|---|---|
| 运行模式 | `point sensor upsMode` | Str | Point `curVal` |
| 电池组电压 | `point sensor upsBatteryVolt` | V | Point `curVal` |
| 电池组内阻 | `point sensor upsBatteryImpedance` | mΩ | Point `curVal` |
| 电池温度 | `point sensor upsBatteryTemp` | °C | Point `curVal` |
| 充电电流 | `point sensor upsChargeCurrent` | A | Point `curVal` |
| 电池容量 | `point sensor upsBatteryCapacity` | % | Point `curVal` + History |
| 预计续航 | `point sensor upsRuntimeEstimate` | min | Point `curVal` |
| 当前负载率 | `point sensor upsLoadRate` | % | Point `curVal` + History |
| 当前负载功率 | `point sensor upsLoadPower` | kW | Point `curVal` |
| 逆变器电压 | `point sensor upsInverter upsVoltage` | V | Point `curVal` |
| 逆变器频率 | `point sensor upsInverter upsFrequency` | Hz | Point `curVal` |
| 输出 THD | `point sensor upsInverter upsThd` | % | Point `curVal` |
| 整流器/充电器 | `point sensor upsRectifier` | Str | Point `curVal` |
| 电容健康度 | `point sensor upsCapacitorHealth` | % | Point `curVal` |
| 风机状态 | `point sensor upsFanStatus` | Str | Point `curVal` |
| 环境温度 | `point sensor upsAmbientTemp` | °C | Point `curVal` |
| 湿度 | `point sensor upsHumidity` | %RH | Point `curVal` |
| 空气质量 | `point sensor upsAirQuality` | Str | Point `curVal` |
| 漏水 | `point sensor upsWaterDetected` | Bool | Point `curVal` |
| 转换开关 | `point sensor upsTransferStatus` | Str | Point `curVal` |
| 旁路可用 | `point sensor upsBypassAvailable` | Bool | Point `curVal` |
| 最近转换耗时 | `point sensor upsTransfer upsTransferDuration` | ms | Point `curVal` |

上述专用标记需补入 `lib/ups/points.xeto`、`trio/ups-defs.trio` 和演示设备树种子。现有通用 `temp`、`volt`、`freq`、`current` 标签可以同时保留，但不得单独作为 UI 字段选择条件。

Hero 与面板非点位字段来源：

| UI 字段 | 唯一来源 | 缺失行为 |
|---|---|---|
| UPS 名称、拓扑、额定功率、保障时长 | `upsEquipSummary()` 的 `dis`、`upsTopology`、`upsRatedPower`、`upsRequiredRuntime` | 显示“未配置” |
| Site/Floor | `siteRef`、`floorRef` 解析后的记录 `dis` | 显示引用值并提示层级记录缺失 |
| 电池单体数 | 当前 Equip 关联且带 `primary` 的 `upsBatteryGroup.upsCellCount`；无 primary 时仅有一条可直接使用 | 显示“未配置” |
| 内阻基线 | 电池内阻 Point 的 `upsBaselineValue` 和 `upsBaselineSource` | 仅隐藏基线比较，不推算 |
| 健康评分 | 最新健康评估的 `upsHealthScore` | 健康环显示“—”和“尚无评分” |
| 预测更换窗口、维护建议 | 最新评估关联风险项及维护建议 | 显示“尚无维护建议” |
| 最近转换时间 | 带 `upsLastTransferAt` 的转换点位或设备字段 | 显示“未配置” |

### 4.3 历史数据

- `upsPointHistory(pointRef, span, opts)`：唯一历史数据入口。
- 默认读取最近 24 小时；支持 7 天、30 天和自定义时间范围。
- 首屏面板 Sparkline 使用真实历史序列。
- 历史详情支持同单位点位多选对比。
- 统计值包括最新值、最小值、最大值、平均值和样本数。
- 图表悬浮或键盘聚焦时显示时间、数值、单位和质量。
- 采样过密时只在显示层降采样，不改写原始历史记录。
- 切换设备、点位或时间范围时取消过期请求，避免旧响应覆盖新状态。

历史契约如下：

- 时间使用选中设备或项目的 `tz`；缺失时使用项目时区，不使用浏览器猜测时区。
- 时间区间统一为 `[start, end)`，结束时间不包含在返回区间内。
- 24 小时、7 天、30 天分别使用绝对时间 `now-24hr..now`、`now-7day..now`、`now-30day..now`；前端用 `haystack-core` 的日期时间对象生成 Axon 字面量，不拼接未转义用户文本。
- 自定义范围必须满足 `start < end` 且不超过 366 天。
- 调用形式为 `upsPointHistory(pointRef, span, opts)`；V1 的 `opts` 传 `{}`，不假定 FIN 运行时支持服务器端重采样。
- 返回 Grid 必须包含 `ts`、`val` 两列；可选 `quality`、`source`。单位从 `val` 或点位定义取得。
- 统计只计算有限数值。`quality` 缺失或为 `valid` 的样本参与统计；`stale`、`missing`、`invalid` 样本保留在质量摘要中但不参与最小、最大、平均值。
- 多点对比只允许单位字符串严格相同；V1 不做单位换算。
- 每条序列显示前最多使用 600 个点。超过时在前端采用 LTTB 或等价的保峰降采样；统计始终基于全部有效返回样本。
- 多点请求使用 `Promise.allSettled`。部分点位失败时展示成功序列，并在图例中标明失败点位；全部失败时显示整体错误状态。

### 4.4 告警与评估

- `upsActiveAlarms({equipRef})`：当前 UPS 的活动告警；后端必须实际执行 `equipRef` 过滤，不能忽略 `filter`。
- `upsAlarmAck()`：确认告警，保留版本冲突处理。
- `upsLatestAssessment(equipRef)`：健康评分和预测性维护依据。
- 无评估记录时明确显示“尚无健康评估”，不得推算评分。

告警确认参数取自当前告警记录：`alarmRef=id`、`version=upsAlarmVersion`，评论在 V1 传 `null`。发生 `UPS-3002 ALARM_VERSION_CONFLICT` 后重新读取当前 UPS 告警并提示记录已变化，不自动重复提交。

告警采用 Xeto 模型为唯一规范，不兼容服务中的旧临时名称：记录标记为 `upsAlarmRecord`，设备引用为 `subjectRef`，严重度为 `upsRiskLevel`，状态为 `open / acknowledged / inProgress / resolved / closed`。模型新增必需整数 `upsAlarmVersion`，初始值为 0。`upsActiveAlarms({equipRef})` 的标准返回字段为 `id`、`dis`、`subjectRef`、`upsRiskLevel`、`upsAlarmState`、`upsAlarmVersion`、`raisedAt`、`upsRuleVersion`，以及可选 `triggerValue`、`threshold`、`acknowledgedBy`、`acknowledgedAt`。服务、种子、UI 和测试必须统一使用这些名称。

`upsLatestAssessment(equipRef)` 使用 Xeto 字段 `subjectRef`、`span`、`upsAssessmentState`、`upsRuleVersion`、`coverage`、`upsConfidence`、`calculatedAt`，并在模型中新增 0–100 的 `upsHealthScore`。新增 `upsAssessmentRiskItems(assessmentRef)` 和 `upsRiskRecommendations(riskItemRef)` 只读 Axon 接口解析关联的风险项和维护建议；风险项返回 `id`、`dis`、`upsRiskLevel`、`evidenceRefs`，建议返回 `id`、`dis`、`priority`、可选 `dueDate`。不得从普通点位名称或前端规则生成维护建议。

告警确认按钮在状态为 `open` 时始终显示，权限仍由服务端强制校验。服务端拒绝时按钮恢复，并显示“当前账号无权确认告警”或接口返回的具体原因；前端不根据猜测隐藏操作。

### 4.5 刷新策略

- Site、Floor 和 Equip 树：首次加载及手动刷新；页面持续打开时每 5 分钟刷新。
- 当前 Equip 摘要和实时点位：每 15 秒刷新。
- 当前 Equip 告警：每 30 秒刷新，确认成功后立即刷新。
- 健康评估：首次选中设备及每 5 分钟刷新。
- 默认 24 小时 Sparkline：首次选中设备及每 60 秒刷新。
- 7 天、30 天和自定义历史详情仅在打开、切换范围或手动刷新时读取。
- 页面不可见时暂停轮询；重新可见时立即刷新当前设备数据。
- 设备切换和历史条件变化使用请求序号或等价机制丢弃过期响应。若底层请求不可取消，也不得让旧响应覆盖新选择。
- 实时“数据更新时间”取 `upsObservedAt`；历史趋势更新时间取对应序列最后一个 `ts`。本地系统时钟仅用于页面时钟，不冒充采集时间。

## 5. 历史详情交互

点击“电池容量趋势”或“负载趋势”打开历史详情。桌面端使用覆盖主内容的宽面板，移动端使用全屏面板。

历史详情包含：

- 标题、设备、Site/Floor 路径和数据更新时间。
- `24 小时 / 7 天 / 30 天 / 自定义`范围选择。
- 点位选择器，仅允许比较单位兼容的点位。
- 主折线图、图例、网格、时间轴和数值轴。
- 最新、最小、最大、平均、样本数统计。
- 加载、无数据、部分缺失、接口错误和过期数据状态。
- 关闭按钮、Escape 关闭、焦点约束和返回焦点。

Sparkline 和详情图表不引入原型的随机数据。历史接口返回空结果时图表显示空状态，并保留范围切换操作。

## 6. 响应式行为

### 桌面（≥ 980px）

- 内容最大宽度 1240px，居中展示。
- Hero 使用三列结构。
- 六个设备面板使用三列网格。
- 告警列表保持表格式四列结构。

### 平板（641–979px）

- Hero 改为单列。
- 设备面板改为两列。
- 历史详情保持宽面板，但图例允许换行。

### 移动端（≤ 640px）

- 内容使用 14px 页边距，禁止水平页面滚动。
- UPS 标签横向滚动且完整显示设备名和 Floor。
- Hero、设备面板均为单列。
- 告警列表改为纵向卡片。
- 历史详情为全屏，图表保持至少 280px 高度。
- 所有触控目标不小于 44×44px。

## 7. Tailwind 实现策略

- 使用本地 Tailwind 构建流程，生成静态 CSS；不得在 FIN 页面中加载 Tailwind CDN。
- 使用 Tailwind 主题定义原型颜色、字体、间距、圆角和阴影。
- 保留原生 JavaScript 与 `haystack-nclient`，不引入 React/Vue。
- 可复用的复杂样式使用 Tailwind 组件层或小型组件函数，避免长串重复类名。
- 原型字体优先本地化或随 POD 打包，避免生产环境依赖 Google Fonts。
- 构建产物继续输出到 `ui/`，由现有 POD 打包流程发布。

## 8. Figma 交付

创建 `upsNew — UPS Fleet Monitor` Figma 设计文件，至少包含：

- Foundations：颜色、字体、间距、圆角和状态语义。
- Components：设备标签、状态徽标、按钮、指标、健康环、面板、趋势图、告警行、范围选择器和空/错状态。
- Desktop：1440px 浅色/深色正式监测页面和历史详情状态。
- Mobile：390px 浅色/深色正式监测页面和历史详情状态。
- 所有组件使用 Auto Layout，并以与 Tailwind 主题一致的名称标注设计令牌。

视觉验收使用固定视口：桌面 `1440×1800`、移动端 `390×1600`。深色基准页面为 `demo/AI-CES-IoT-UPS/index.html` 在相同视口下的截图；浅色主题使用 Figma 中经确认的令牌映射作为基准。两种主题必须保持以下锚点：品牌、主题切换与时钟位于同一头部，UPS 标签位于 Hero 上方，Hero 左/中/右三段，六面板按电池/负载/电力电子/环境/转换旁路/预测维护顺序排列，告警列表占满最后一行。允许因中文长度和真实状态提示产生高度变化，不允许改变区域顺序、字体角色和三列节奏。

## 9. 状态与错误处理

- 首次加载使用结构化骨架屏，保持原型布局稳定。
- FIN 连接失败时显示错误原因和“重新加载”操作。
- 单个接口失败不隐藏其他已成功加载的区域。
- 告警确认期间禁用当前按钮并显示进行中状态；成功后刷新告警，失败后恢复按钮并显示可操作错误。
- 告警确认权限由服务端判断；权限拒绝作为操作错误显示，前端不预判权限。
- 历史请求失败保留已选择的设备、点位和范围，允许重试。
- 所有异步状态使用可访问的 `aria-live` 通知。

## 10. 可访问性

- 使用语义化标题、导航、按钮、表格和表单控件。
- 所有图标按钮具有可读名称。
- 图表提供文字统计和可键盘访问的数据点摘要。
- 状态不能只依赖颜色，同时显示文字或图形标记。
- 保留可见的 `:focus-visible`。
- 遵守 `prefers-reduced-motion`。
- 中文界面不使用仅英文的状态或操作标签。

## 11. 验收标准

1. 桌面正式页面的布局、颜色、字体、面板顺序和视觉密度与原型一致。
2. 390px 宽度无页面级横向溢出，主要功能可通过触控和键盘使用。
3. 页面不包含 `buildFleet()`、`genHistory()`、随机数、模拟停电或硬编码业务数值。
4. 所有设备和实时值来自 FIN 接口与设备树。
5. 电池容量和负载 Sparkline 来自 `upsPointHistory()`。
6. 历史详情支持 24 小时、7 天、30 天和自定义范围，并正确显示统计值。
7. 历史空数据、接口失败和数据质量异常均有明确反馈。
8. 告警确认调用真实 `upsAlarmAck()`，并处理加载、成功、失败和版本冲突。
9. Figma Desktop/Mobile 设计、Tailwind 令牌与生产页面一致。
10. UI 构建、POD 构建和相关测试通过，并在 FIN `mytest` 项目中完成运行验证。
11. 首次访问默认显示浅色主题；切换深色后刷新页面仍保持深色，再切回浅色后同样持久保存。
12. 浅色和深色主题均通过固定视口截图检查，无不可读文本、丢失边界或错误状态色。

## 12. 测试调整

- 替换 `UpsDomainTest.testPodAndMenuUseUpsNewName()` 中对 `overview/detail/alarms/risk/mapping` 五个页面 ID 的旧断言，改为验证原型结构锚点和 `upsNew` 菜单入口。
- 保留并扩充“无嵌入业务数据”测试，增加对 `buildFleet`、`genHistory`、`Math.random` 和“模拟停电”文案的禁止断言。
- 增加 `upsPointHistory` 调用、历史范围校验、统计过滤、降采样和部分成功的前端单元测试。
- 增加当前设备 `equipRef` 告警过滤和告警版本冲突重新读取测试。
- 增加 1440px 与 390px 截图检查；390px 页面不得出现根级横向滚动。
- 增加键盘焦点、Escape 关闭历史详情、`aria-live` 和减少动态效果检查。
- 增加默认浅色、主题持久化、无效存储值回退、首屏无闪烁和两套主题截图检查。
