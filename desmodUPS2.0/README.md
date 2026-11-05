# desmodUPS 2.0

GitHub 源码：[palapalamao/desmondups · desmodUPS2.0](https://github.com/palapalamao/desmondups/tree/main/desmodUPS2.0)。

面向 UPS 供电保障、电池健康与运维的 FIN 5.3 扩展。Pod 名称和 FIN 菜单名称均为 `upsNew`。

依据：`FIN-Pod-从需求到交付-通用方法论.md` 与 `demo/AI-CES-IoT-UPS/`。DEMO 提供展示场景，不代表已确认的生产算法、阈值或接口契约。

## 目录结构

```text
desmodUPS2.0/
├── README.md
├── FIN-Pod-从需求到交付-通用方法论.md
├── demo/                     原始演示与压缩包
├── docs/
│   ├── README.md             文档索引与后续产物清单
│   ├── requirements/         复用边界、业务需求、红线、点表
│   ├── design/               详细设计、接口契约、错误码
│   │   └── diagrams/         架构图、类图、时序图及图源
│   └── development/          编码约定、测试计划、开发任务
├── lib/
│   └── ups/                  UPS Xeto 候选语义库
├── trio/                     FIN 5.3 定义与菜单资源（不含实例数据）
├── fan/
│   ├── ext/                  Pod 生命周期与依赖装配
│   ├── domain/               领域对象、枚举与不变式
│   ├── repo/                 领域持久化唯一出口
│   ├── engine/               监测、续航、健康评估等业务逻辑
│   ├── api/                  REST 接口
│   ├── axon/                 Axon 函数，与 REST 共享引擎
│   ├── adapter/              外部数据接入与归一化
│   ├── scheduler/            调度与任务生命周期
│   └── test/                 Fantom 单元测试源码
├── ui/
│   ├── index.html             upsNew 单页应用入口
│   ├── styles.css             响应式界面样式
│   └── app.js                 页面切换与只读演示交互
├── test/
│   ├── integration/          接入至展示的集成验证
│   ├── api/                  接口契约、权限、错误行为验证
│   ├── acceptance/           现场验收步骤与结果
│   └── fixtures/             可复现样例数据
├── scripts/                  构建、语义检查与红线检查脚本
└── delivery/                 部署说明、交付清单、客户配合事项
```

## 开发边界

- 使用本机 FIN 5.3.0.2761 的 Fantom 运行时构建；Pod 与扩展名固定为 `upsNew`，语义标签继续使用 `ups` 前缀。
- 前端按已确认的 UPS Fleet Monitor 设计稿实现顶部设备标签、三段状态区、六个监测面板、告警列表和历史详情，默认浅色并支持深色主题。
- 先确认复用边界、产品红线与点表，再编写模型和业务引擎。
- 健康评分、预计续航和预测维护须定义计算依据、来源及可信度，不能直接采用 DEMO 常量作为实际结果。
- 设备控制范围尚未定义；DEMO 的停电模拟按钮不构成真实设备写控制需求。
- FIN 导航层级按项目约束固定为 `Site → Floor → Equip → Point`；不建立通用 Space 层级，设备和点位显式携带 `floorRef`。

当前发布版本为 `0.2.3`。页面数据通过接口读取当前项目的设备树、Folio 和历史；运行时 Pod 不携带模拟实例。设备与点位通道严格只读；仅告警确认、处置和关闭可更新业务记录。授权的 `ups2` 演示数据携带 `upsDemo`、`upsDataSource:"simulated"`，其健康评分使用独立的 `upsDemoAssessment()` 读取，正式健康评估仍排除模拟结果。

## 构建与测试

在仓库根目录使用 FIN 5.3.0.2761：

先在 `ui-src/` 执行 `npm.cmd test` 和 `npm.cmd run build`；字体与脚本均打包在 Pod 内。

```powershell
$env:FAN_ENV='util::PathEnv'
$env:FAN_ENV_PATH=(Resolve-Path 'build').Path
& 'C:\Program Files (x86)\FIN\FIN 5.3.0.2761\bin\fan.bat' build.fan clean compile
& 'C:\Program Files (x86)\FIN\FIN 5.3.0.2761\bin\fant.bat' upsNew
```

构建产物位于 `build/lib/fan/upsNew.pod`。部署到目标 FIN 前仍需核对现场协议、正式点表、认证权限和 Xeto 库兼容性。

`ups2` 演示初始化、只读验收、0.2.3 发布哈希与备份位置见 [演示与发布记录](delivery/ups2-demo.md)。
历史接口在 `hisRead` 后执行 `hisClip`，去除日期范围外的邻接样本。移动端目前仅有 CSS 响应式支持，尚未实际验收。
