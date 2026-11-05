# desmodUPS 候选语义库

本目录是 UPS 监测与运维领域的 Xeto 规格源真相。当前目标环境为本机 FIN 5.3.0.2761，但现场最终版本和已安装库尚未确认，因此这些文件用于评审和后续迁移，不能视为已经通过目标运行时编译。

## 文件

| 文件 | 职责 |
|---|---|
| `lib.xeto` | 库元数据和候选依赖 |
| `tags.xeto` | 项目标记、枚举和公共属性 |
| `equips.xeto` | UPS 与电池组设备规格 |
| `points.xeto` | 只读监测点规格 |
| `assessment.xeto` | 告警、规则版本、健康评估和维护建议 |
| `mapping.xeto` | 外部编码到内部对象的版本化映射 |

## 边界

- 所有监测点只读，不定义任何命令点或控制动作。
- 项目导航层级固定为 `Site → Floor → Equip → Point`；设备与点实例必须带 `siteRef` 和 `floorRef`，点位同时带 `equipRef`。
- 不建立通用 Space 实例，也不使用 `spaceRef`；Floor 记录本身按 FIN 5.3 形式同时带 `floor` 与 `space` 标记。
- Project Haystack 或现场库已有语义应优先复用，项目标签统一使用 `ups` 前缀。
- `unknown`、`stale`、`missing` 和 `invalid` 是必要状态，不能被映射为正常或零值。
- Xeto 文件与 `../../trio/ups-defs.trio` 表达相同的项目语义；前者面向 Xeto 环境，后者面向 FIN 5.3 的 Haystack 3 定义体系。
- 正式接入前必须根据现场点表核对单位、枚举、采集周期、过期时间和基础库名称。
