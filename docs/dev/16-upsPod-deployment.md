# upsPod 本机部署与验收

本次范围：FIN 5.3.0.2761 中注册并启用 upsPod，在目标项目显示菜单，并从当前项目 Folio 设备树只读加载 UPS 总览。没有后端数据源的详情、历史、告警、配置和审计页面明确显示数据缺口，不生成演示值。

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
3. 刷新 FIN 外壳，打开“UPS 车队监控”菜单。
4. 验证总览来自当前项目 Folio；其余页面按后端能力显示数据或明确缺口。

直接页面地址：`http://localhost:8080/pod/upsPod/frontend/index.html#/ups/overview`。页面通过 FIN 外壳解析当前项目；项目上下文缺失或冲突时 fail-closed，不回落到其他项目或静态数据。

## 已定位的部署问题

- FIN 菜单标记 `finStackMobileMenu` 定义在 finstack 库。`@ExtMeta.depends` 必须声明 `finstack` 和菜单外壳 `finStackMobile`；Fantom 的 pod.depends 不能替代扩展命名空间依赖。补齐后 2026-09-20 09:54:43 启动日志不再出现 upsPod 的该标记解析错误。
- 扩展类必须标注 `@ExtMeta`。原代码把它标注在构造函数上，编译可以通过，但类型反射报 `UnknownFacetErr`，FIN 无法发现扩展。2026-09-19 记录中“缺少 lib/*.trio 是根因”的推断不成立。
- BuildPod 的资源目录未递归包含 vendor，必须显式列入 `frontend/vendor/`，否则 Ractive 未进入 POD。
- 本机 FIN 的 POD 资源请求带查询参数会返回 404。菜单把路由参数放在 hash 中，资源地址不带查询参数。
- 生产源码与构建 POD 均不得包含 seed/mock 入口。R3/R5 检查显式读取当前 checkout 的 output POD，并校验源码、资源内容和 ZIP entry 名。

## 可复跑检查

```powershell
node extensions/upsPod/test/verify.cjs
node scripts/check-all.cjs
$pod = (Resolve-Path extensions\upsPod\output\upsPod.pod).Path
& 'C:\Program Files (x86)\FIN\FIN 5.3.0.2761\bin\fan.bat' extensions\upsPod\test\verifyRegistration.fan $pod
& 'C:\Program Files (x86)\FIN\FIN 5.3.0.2761\bin\fan.bat' extensions\upsPod\test\verifyMenu.fan
```

`check-all` 无参数时检查当前 checkout 的 `extensions/upsPod/output/upsPod.pod`，也接受同一路径作为显式参数；通过口径为 6/6。`verifyRegistration` 检查显式 output POD，`verifyMenu` 检查已安装 POD。它们不替代真实浏览器中的扩展列表、项目启用和菜单点击验收。HTTP 检查使用 GET；本机资源服务对 HEAD 返回 501。
