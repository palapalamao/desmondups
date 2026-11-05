# 文档导航

推荐顺序：根目录方法论 → 原始 DEMO → requirements → design → development。

## 现有产物

- `requirements/desmodUPS-business-plan.docx`：基于当前 DEMO 的 UPS 运行监测与运维业务方案 V0.1。
- `requirements/desmodUPS-domain-and-semantic-model.docx`：业务领域对象、关系、不变式、状态机与 FIN/Xeto 候选语义模型 V0.2，采用 Site → Floor → Equip → Point。
- `requirements/desmodUPS-point-list-and-semantic-mapping.docx`：22 类点、3 台 UPS 的 66 条模拟点实例、Floor 引用、外部映射、质量规则及验收门禁 V0.2。
- `design/desmodUPS-detailed-design.docx`：分层架构、UML 核心类图、FIN 语义与记录设计、REST/Axon 接口清单、错误码、关键流程、权限、测试与部署设计 V0.1。
- `design/diagrams/`：详细设计使用的组件图、UML 类图、采集时序图和告警生命周期图。
- `../lib/ups/`：6 个 Xeto 候选语义规格文件。
- `../trio/`：FIN 5.3 / Haystack 3 候选定义、站点、设备、66 条点实例和 66 条映射。

以下为计划产物，尚未生成完整需求或设计内容。

| 目录 | 计划产物 | 对应方法论阶段 |
|---|---|---|
| requirements/ | 底座差异与复用边界、红线矩阵及后续现场点表修订 | P0–P3 |
| design/ | 后续接口修订、前端交互细化与目标运行时验证记录 | P4–P5 |
| design/diagrams/ | 后续补充部署图和现场网络拓扑 | P4–P5 |
| development/ | 编码约定、测试计划、任务拆解、里程碑 | P5–P7 |
| ../delivery/ | 部署与回退说明、客户配合事项、验收与交付清单 | P8 |

## 从 DEMO 提取的需求候选

1. 多台 UPS 切换及供电状态展示。
2. 电池电压、内阻、温度、电流与容量趋势。
3. 当前负载、额定容量、预计续航与保障时长比较。
4. 逆变器、整流器、电容与风机状态。
5. 环境温湿度、漏水、转换及旁路状态。
6. 告警查看与确认。
7. 健康评分、维护预测及其依据展示。

## FIN 导航层级约束

当前项目固定采用 `Site → Floor → Equip → Point`。`trio/demo-sites.trio` 中的三个位置均建为 Floor；所有设备和点位显式带 `siteRef` 与 `floorRef`，点位同时带 `equipRef`。不建立通用 Space 实例，也不使用 `spaceRef`。

候选需求需要进一步明确数据可得性和验收口径；未确认的预测算法不视作已承诺能力。

## 文档维护

开发文档应标注所依据的需求及设计条目。发现冲突时记录并解决，同时回写相关上游文件，不以 DEMO 的演示行为替代业务决策。正式编码前补充项目级代理入口文件，记录已经确认的红线、命名与阅读顺序。
