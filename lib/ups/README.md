# lib/ups · UPS 车队监控语义库

> P3 五步产物（v0.3.0，2026-09-19）。M1 最小集 v0.2 已落地，本次按方法论补齐枚举/点位/映射。
> 语法正确性未验证（U-DATA-01）：首次 fan build 以编译结果为 lint 证据，留档 docs/evidence/ 并回写本页。

## 依赖顺序（五步①）

```text
sys → ph → ph.points → ph.equips → ups（lib.xeto 显式声明；不得倒挂）
```

## 建模铁律（五步④，库级 5 条，AI 编码代理与新人的第一屏约束）

1. **点位全部只读**（R2）：本库不得出现任何写语义点位定义；写操作走 M5 配置域 + 守门引擎
2. **数据三态化**（R3）：无实测值必须可表达 `gap`/`stale`；估算值必须带来源等级标记
3. **严重度不自建**（Q3）：复用 FIN alarm 内核 severity，本库**禁设** upsSeverity 枚举
4. **外部编码经映射层落地**（mapping.xeto 四条约束），未映射不丢弃
5. **ph/base 已定义标签直接复用，不得重定义**（R4）；凡要新增标签先查 ph

## 命名规约（五步⑤，一次定死，全局适用）

| 类别 | 规则 | 示例 |
|---|---|---|
| Xeto spec | `Ups` + 大驼峰 | `UpsExtCodeMap` |
| Xeto 标签 | `ups` + 小驼峰 | `upsLoadPct` |
| Fantom 类 | `Ups` + 大驼峰 | `UpsGuardEngine` |
| Axon 函数 | `ups` + 小驼峰 | `upsOverview` |
| REST 基址 | `/api/ups/v1`（底座 `/api/base/v1` 不合并；二期若开放 REST 适用） | — |
| 错误码 | `UPS-nnnn` | `UPS-6003` |
| 权限点 | `ups:yyy` | `ups:guard` |

## 文件分工（五步③，一域一文件）

| 文件 | 内容 |
|---|---|
| lib.xeto | 库声明与依赖 |
| tags.xeto | 全局标签与枚举（枚举先行，枚举项必带 doc） |
| ups-core.xeto | 站点/UPS 单元核心域（M2 电池串/模块届时再扩） |
| points.xeto | 专属点位（含事故复盘点位） |
| mapping.xeto | 外部编码映射（R5 模型位） |

## 门禁状态（P3）

- [ ] `xeto lint` 通过 —— 待 U-DATA-01（首次 fan build）
- [x] 所有枚举项有 doc（tags.xeto）
- [x] 无重定义底座/ph 标签（铁律 5，本次新增项逐条人工比对）
- [x] 建模铁律写入库 README（本页第一屏）
- [ ] 点表评审通过（含事故复盘点位）—— 待需求方会签
