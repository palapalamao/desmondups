# ups2 UPS 设计稿演示

当前发布版本：upsNew 0.2.5，FIN 5.3.0.2761。

首页最下方显示“当前版本 upsNew v0.2.5”，版本从 `ui-src/package.json`
自动进入前端构建；连接信息中的项目名仅出现一次。顶部应用启动器只将 `icon` 渲染为 CSS 类，
故菜单采用本机 `css/icons.css` 已定义的 `icon-battery-full`，`iconType:"class"`。
设计的青绿色 UPS 机柜与闪电 SVG 保留于 `ui/ups-menu-icon-0.2.4.svg`；它可用于支持图片的普通导航菜单，
顶部入口不支持该图片分支。未修改 FIN 核心文件。
本次 Pod SHA256 为 `9134A206835BFC26C6AA55F753CB54B081AEDDCAC96B5B950AD8C9CE24E45F94`。
部署脚本、结果和旧版本备份分别为 `scripts/deploy-upsNew-0.2.5-20261105.ps1`、
`scripts/deploy-upsNew-0.2.5-20261105-result.json`、`deployment-backups/upsNew-0.2.5-20261105/upsNew.pod`。
前端构建和 21 个 Fantom 测试方法 / 171 项断言通过；18 项前端逻辑测试亦已通过。
安装、服务及页面验收已通过。18:10:44（上海时间）重建模拟快照，98 条记录、66 个当前值、
45 条各 24 样本的历史均通过只读验收，设备点无 writable/curTracksWrite。
实际页面已确认 `upsNew v0.2.5`、单次项目名和顶部电池图标。
证据为 `.codex-artifacts/ups2-0.2.5-verification.txt`、
`.codex-artifacts/ups2-0.2.5-final-desktop.jpg`、`.codex-artifacts/ups2-0.2.5-menu-icon.jpg`、
`.codex-artifacts/ups2-0.2.5-footer.jpg`。

打开 `http://localhost:8080/finMobile/ups2`，在 FIN 左上角应用菜单选择 `upsNew`。
原生菜单使用 `index-0.2.5.html` 及同版本脚本、样式文件，避免旧路径缓存。
浅色设计基准为 `.codex-artifacts/upsnew-figma-prototype-light.png`；深色基准为原始 UPS Fleet Monitor 原型。

## 模拟数据

数据限定为 `ups2` 项目的 `ups2.demo.*` 命名空间，均携带 `upsDemo`、
`upsDataSource:"simulated"` 和 `upsSourceSystem:"ups2-prototype-demo-v1"`。
规模为 1 个站点、2 个楼层、3 台 UPS、3 个电池组、66 个点、3 个模拟评估、
9 个风险项、9 个维护建议及 2 条模拟告警，共 98 条记录。
45 个数值点各有 24 条小时历史，共 1,080 个样本。

这是明确标记的模拟快照。FIN 重启会清除虚拟点的瞬时当前值；重启后需再次初始化本批快照。
没有配置真实连接器、设备写控制或后台定时模拟任务。

## 初始化与只读验收

在已认证的 `ups2` Folio 中，依次执行下列文件内容：

1. `scripts/preflight-ups2-demo.axon`：只读项目、命名空间、重复键和连接能力检查。
2. `scripts/seed-ups2-demo.axon`：初始化或刷新本批模拟快照。
3. `scripts/verify-ups2-demo.axon`：只读检查引用、字段、当前值及全部历史。

经 Folio 的 `eval` 执行多行脚本时必须包成顶层函数：
`call(eval("() => " + source))`，其中 `source` 是所选文件的完整文本。
这保证嵌套函数可以访问脚本中的局部变量。
Folio 输入框可能先将输入选为查询标签，需要再按 Enter 提交；提交后应核对结果，不要盲目重复写入。

初始化仅针对明确归属本批的虚拟点。刷新会重建这 45 个模拟点的小时历史，
并重置本批演示告警。未知执行结果须先只读回查。
验收预期 `verified:true`、`currentValueCount:66`、`writablePointCount:0`、
`curTracksWritePointCount:0`、`spaceRefViolationCount:0`。

## 0.2.3 完整演示验收记录

- 构建产物：`build/lib/fan/upsNew.pod`。
- SHA256：`242E5D8DD19FDD3702857D2971FA0083B404DC218B4BB6FFB1D516BB27331B2B`。
- 部署脚本：`scripts/deploy-upsNew-0.2.3-20261105.ps1`。
- 部署结果：`scripts/deploy-upsNew-0.2.3-20261105-result.json`。
- 更新前备份：`deployment-backups/upsNew-0.2.3-20261105/upsNew.pod`。
- 离线验证：18 项前端测试；21 个 Fantom 测试方法、171 项断言。
- 最终模拟快照：2026-11-05 16:54:49（上海时间）；重启后初始化并通过全部只读验收。
- 数据验收：`.codex-artifacts/ups2-0.2.3-verification.txt`。
- 页面验收：`.codex-artifacts/ups2-0.2.3-ui-verification.json`。
- 最终桌面截图：`.codex-artifacts/ups2-0.2.3-final-desktop.jpg`；深色截图：`.codex-artifacts/ups2-0.2.3-final-dark.jpg`。

1440px 设计基准下，两排面板顶部分别为 414px、682px，高度均为 250px；
告警面板顶部为 950px、高度 218px，与参考稿一致。设备名称、日期和模拟标记使用当前项目数据。
三台设备切换及浅深主题已验证；自定义历史 11 月 4 日 18:00 至 11 月 5 日 12:00（不含）
返回 18 条小时样本，首条 18:00、末条 11:00。

生产评估接口继续排除模拟结果。`upsDemoAssessment` 只为明确标记的模拟设备返回模拟评分。
历史接口接受 Axon 日期范围对象，交由 FIN 原生 `hisRead` 归一化和读取，随后调用
`hisClip` 去除范围边界外的前后邻接样本，避免历史详情将窗口外数据计入统计。

移动端目前仅有 CSS 响应式支持，尚未进行实际移动端布局与操作验收。
