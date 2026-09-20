using skyarcd
using concurrent
using folio
using haystack
using hx

** 扩展入口：生命周期。所有初始化失败直接抛错——fail-closed，不静默。
** 版本 0.1.0
@ExtMeta { name = "upsPod"; depends = ["finstack", "finStackMobile"] }
const class UpsPodExt : Ext {
  new make() {}
  override HxLibWeb web() { UpsPodWeb(this) }
  override Duration? houseKeepingFreq() { 10sec }
  override Void onStart() { publishSimCurVals }
  override Void onHouseKeeping() { publishSimCurVals }

  private Void publishSimCurVals() {
    diffs := Diff[,]
    now := DateTime.now
    proj.readAllList("point and upsPodSeed").each |point| {
      changes := Str:Obj?[:]
      simVal := point.get("upsSimVal", null)
      if (simVal != null) {
        changes["curVal"] = simVal
        changes["curStatusTs"] = now
      }
      if (!changes.isEmpty) diffs.add(Diff(point, changes, Diff.transient))
    }
    if (!diffs.isEmpty) proj.commitAll(diffs)
  }
  override Void onStop() {}
}
