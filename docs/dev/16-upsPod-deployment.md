# upsPod 本机部署与验收

本次范围：FIN 5.3.0.2761 中注册并启用 upsPod，在 mytest 项目显示菜单，提供六个演示页面。2026-09-20 用户确认保留演示模式；真实采集、告警确认持久化、配置下发和持久审计不在本次范围内。

## 构建与安装

在仓库根目录执行：

```powershell
& 'C:\Program Files (x86)\FIN\FIN 5.3.0.2761\bin\fan.bat' extensions\upsPod\build.fan
if ($LASTEXITCODE -ne 0) { throw 'Build failed' }
& .\scripts\deploy-upsPod.ps1
```

部署脚本将旧 POD 备份到 `docs/evidence/upsPod-backup-时间/`，校验安装文件 SHA256 和扩展元数据、页面资源，然后重启 FIN5 并等待 HTTP 200。结果写入 `docs/evidence/upsPod-install-latest.log`。脚本会申请本机管理员权限，服务重启会使 FIN 登录会话失效。

新产物为 `extensions/upsPod/output/upsPod.pod`。如需回退，将对应备份中的 upsPod.pod 恢复到 FIN 的 lib/fan/upsPod.pod，再重启 FIN5。不要修改其他 POD 或项目数据库文件。

## 扩展与菜单

1. 登录 FIN，进入 mytest 项目。
2. 在设置的扩展列表中找到 `upsPod` / `desmondUPS UPS 车队监控` 并启用。
3. 刷新 FIN 外壳，打开“UPS 车队监控 · 演示”菜单。
4. 验证总览、设备详情、历史趋势、告警中心、运行配置和审计追踪。

直接页面地址：`http://localhost:8080/pod/upsPod/frontend/index.html#/ups/overview?site=site-myups`。

`mytest` 是 FIN 项目；`myups` 是演示数据中的站点名，两者不同。菜单设备详情和历史趋势指向该站点的 UPS-M01。

所有页面顶部持续显示演示说明。页面中的数值、曲线和告警均为模拟数据；确认告警、发布配置、回滚和审计仅在当前页面内存中存在，重载后重置，不写入真实设备。

## 已定位的部署问题

- FIN 菜单标记 `finStackMobileMenu` 定义在 finstack 库。`@ExtMeta.depends` 必须声明 `finstack` 和菜单外壳 `finStackMobile`；Fantom 的 pod.depends 不能替代扩展命名空间依赖。补齐后 2026-09-20 09:54:43 启动日志不再出现 upsPod 的该标记解析错误。
- 扩展类必须标注 `@ExtMeta`。原代码把它标注在构造函数上，编译可以通过，但类型反射报 `UnknownFacetErr`，FIN 无法发现扩展。2026-09-19 记录中“缺少 lib/*.trio 是根因”的推断不成立。
- BuildPod 的资源目录未递归包含 vendor，必须显式列入 `frontend/vendor/`，否则 Ractive 未进入 POD。
- 本机 FIN 的 POD 资源请求带查询参数会返回 404。菜单把路由参数放在 hash 中，资源地址不带查询参数。
- 本机 FIN 的 POD 资源白名单不发布 JSON 文件。构建时将唯一源 `frontend/seed.json` 的相同字节临时复制为 `frontend/seed-data.js` 并打包，随后删除临时文件。应用通过 fetch 加载并按 JSON 解析，不将其当 JavaScript 执行；不修改 FIN 白名单。

## 可复跑检查

```powershell
node extensions/upsPod/test/verify.cjs
node scripts/check-all.cjs
& 'C:\Program Files (x86)\FIN\FIN 5.3.0.2761\bin\fan.bat' extensions\upsPod\test\verifyRegistration.fan
& 'C:\Program Files (x86)\FIN\FIN 5.3.0.2761\bin\fan.bat' extensions\upsPod\test\verifyMenu.fan
```

Fantom 检查针对已安装 POD。它们不替代真实浏览器中的扩展列表、项目启用和菜单点击验收。HTTP 检查使用 GET；本机资源服务对 HEAD 返回 501。
