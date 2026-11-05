# UPS 前端

以原 UPS Fleet Monitor DEMO 为信息结构参考，已实现 `upsNew` FIN 单页应用。

- `index.html`：顶部 UPS 标签、设备状态与续航、六个监测面板、告警及历史详情。
- `styles.css`：按现有 UPS Fleet Monitor 设计稿制作的浅色/深色主题及响应式布局。
- `app.js`：由 `ui-src/app.js` 构建，使用 `haystack-nclient` 调用 `upsNew` Axon 接口。

构建时整个 `ui/` 目录打包进 `upsNew.pod`，入口为 `/pod/upsNew/ui/index.html`。
页面不内置站点、Floor、设备、点位、当前值、告警、评估或映射数据；全部从当前
FIN 项目的设备树和 Folio 接口读取。接口无记录时显示空状态。

前端构建：在 `ui-src/` 执行 `npm.cmd run build`，测试执行 `npm.cmd test`。
字体随 Pod 打包至 `ui/fonts/`。主题选择保存为 `upsNew.theme`，首次默认为浅色。

模拟记录只存在明确授权的演示项目中，携带 `upsDemo` 和
`upsDataSource:"simulated"`。演示健康评分使用独立的 `upsDemoAssessment()`
读取适配，正式健康评估接口仍排除模拟结果。
