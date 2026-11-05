# Trio 运行时资源

本目录只提供 FIN 5.3 / Haystack 3 的语义定义与 `upsNew` 菜单注册。

| 文件 | 用途 |
|---|---|
| `ups-defs.trio` | 与 `lib/ups/*.xeto` 对应的项目标签和枚举定义 |
| `upsNew-menu.trio` | 注册显示名称为 `upsNew` 的 FIN 顶栏菜单 |

项目导航层级固定为 `Site → Floor → Equip → Point`。每个设备和点位都显式带 `siteRef` 与 `floorRef`，点位同时保留 `equipRef`；文件不使用 `spaceRef`。Floor 记录仍同时带 `floor` 与 `space` 标记，这是 FIN 5.3 Floor 模板的记录形式，不代表另设通用 Space 层级。

运行时 Pod 不携带站点、设备、点位、当前值或映射示例。所有业务数据由
`upsNew` Axon 接口从当前 FIN 项目的设备树和 Folio 记录读取。
