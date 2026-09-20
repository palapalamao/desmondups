using skyarcd
using hx

** 扩展入口：生命周期。所有初始化失败直接抛错——fail-closed，不静默。
** 版本 0.1.0
@ExtMeta { name = "upsPod"; depends = ["finstack", "finStackMobile"] }
const class UpsPodExt : Ext {
  new make() {}
  override HxLibWeb web() { UpsPodWeb(this) }
}
