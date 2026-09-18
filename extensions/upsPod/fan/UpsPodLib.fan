using axon
using haystack

** Axon 函数注册中心。M1 后端唯一新增：upsOverview() 聚合函数（零新增论证 详设§2）。
** 契约（待 U4/U5 探测后固化进 docs/dev/08-api.md）：
**   upsOverview(site?) -> Grid：每行 = upsUnit + 最近负载/SOC + 采集时间戳 + 最高严重度
**   未会签口径的派生字段一律带 quality 标注（R3：宁缺毋假）。
** 版本 0.1.0
const class UpsPodLib {
  @Axon { admin = false }
  static Grid upsOverview(Str? site := null) {
    // TODO(段3): 无 FIN 环境，无法对 Folio/hisRead/alarm 做真实调用。
    // 实现须走：folio 读 upsUnit → hisRead 最近值 → alarm severity 聚合。
    // 未验证项清单 evidence/M1-未验证项清单.md U-API-01。
    throw UnsupportedErr("upsOverview: 待 FIN 5.3.0 目标实例实现并实测（U-API-01）")
  }
}
