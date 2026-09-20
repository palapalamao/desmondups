using axon
using folio
using haystack
using hx
using util

** Axon 函数注册中心。M1 后端唯一新增：upsOverview() 聚合函数（零新增论证 详设§2）。
** 契约（待 U4/U5 探测后固化进 docs/dev/08-api.md）：
**   upsOverview(site?) -> Grid：每行 = upsUnit + 最近负载/SOC + 采集时间戳 + 最高严重度
**   未会签口径的派生字段一律带 quality 标注（R3：宁缺毋假）。
** 版本 0.1.0
const class UpsPodLib {
  @Axon { admin = false }
  static Grid upsOverview(Str? site := null) {
    cx := HxContext.curHx(true)
    rows := buildUnits(cx, site)
    gb := GridBuilder()
    gb.addColNames(["id", "dis", "siteId", "siteName", "floorId", "floorName",
      "soc", "loadPct", "batteryTemp", "commLost", "mode", "ts"])
    rows.each |row| {
      gb.addRow([row["id"], row["name"], row["siteId"], row["siteName"],
        row["floorId"], row["floorName"], row["soc"], row["loadPct"],
        row["batteryTemp"], row["commLost"], row["mode"], row["ts"]])
    }
    return gb.toGrid
  }

  static Str overviewJson(HxContext cx) {
    JsonOutStream.writeJsonToStr(buildSnapshot(cx, null))
  }

  static Str overviewJsonFromRuntime(HxRuntime rt) {
    JsonOutStream.writeJsonToStr(buildSnapshotFromDb(rt.db, null))
  }

  static [Str:Obj?] buildSnapshot(HxContext cx, Str? site) {
    buildSnapshotFromDb(cx.db, site)
  }

  static [Str:Obj?] buildSnapshotFromDb(Folio db, Str? site) {
    units := buildUnitsFromDb(db, site)
    sitesById := Str:Str[:]
    units.each |u| {
      sid := (Str)u["siteId"]
      if (!sitesById.containsKey(sid)) sitesById[sid] = (Str)u["siteName"]
    }
    sites := Obj?[,]
    sitesById.each |name, id| { sites.add(["id": id, "name": name]) }
    return [
      "source": "fin-tree",
      "sourceText": "FIN 设备树数据",
      "pollPeriodMs": 10000,
      "generatedAt": DateTime.now.toJava,
      "sites": sites,
      "units": units,
      "auditLog": Obj?[,],
    ]
  }

  private static [Str:Obj?][] buildUnits(HxContext cx, Str? site) {
    buildUnitsFromDb(cx.db, site)
  }

  private static [Str:Obj?][] buildUnitsFromDb(Folio db, Str? site) {
    units := [Str:Obj?][,]
    unitRecs := db.readAllList(Filter.has("upsUnit").and(Filter.has("equip")), null)
    pointRecs := db.readAllList(Filter.has("point").and(Filter.has("equipRef")), null)
    unitRecs.each |u| {
      siteRef := u.get("siteRef", null) as Ref
      if (site != null && siteRef != null && siteRef.id != site) return
      floorRef := u.get("floorRef", null) as Ref
      siteRec := siteRef == null ? null : db.readById(siteRef, false)
      floorRec := floorRef == null ? null : db.readById(floorRef, false)
      pts := pointRecs.findAll |p| { (p.get("equipRef", null) as Ref)?.id == u.id.id }
      soc := pointVal(pts, "upsSocPct")
      load := pointVal(pts, "upsLoadPct")
      temp := pointVal(pts, "upsBatteryTemp")
      comm := pointVal(pts, "upsCommStatus")
      ts := pointTs(pts)
      commLost := comm == null ? ts == null : (comm.toStr != "online" && comm.toStr != "ok" && comm.toStr != "1")
      units.add([
        "id": u.id.id,
        "name": u.dis(null, u.id.id),
        "siteId": siteRef?.id ?: "",
        "siteName": siteRec?.dis(null, siteRef?.id ?: "") ?: "",
        "floorId": floorRef?.id ?: "",
        "floorName": floorRec?.dis(null, floorRef?.id ?: "") ?: "",
        "location": floorRec?.dis(null, "") ?: u.dis("navName", ""),
        "make": strVal(u, "make"),
        "model": strVal(u, "model"),
        "serial": strVal(u, "serial"),
        "ratedKva": numVal(u.get("ratedKva", null)),
        "soc": numVal(soc),
        "loadPct": numVal(load),
        "batteryTemp": numVal(temp),
        "commLost": commLost,
        "mode": commLost ? "offline" : "online",
        "ts": ts,
      ])
    }
    return units.sort |a, b| { ((Str)a["name"]).compare((Str)b["name"]) }
  }

  private static Obj? pointVal(Dict[] pts, Str tag) {
    p := pts.find |x| { x.has(tag) }
    if (p == null) return null
    return p.get("curVal", null)
  }

  private static Int? pointTs(Dict[] pts) {
    ts := (DateTime?)null
    pts.each |p| {
      t := p.get("curStatusTs", null) as DateTime
      if (t != null && (ts == null || t > ts)) ts = t
    }
    return ts?.toJava
  }

  private static Float? numVal(Obj? v) {
    if (v == null) return null
    if (v is Number) return ((Number)v).toFloat
    if (v is Int) return ((Int)v).toFloat
    if (v is Float) return v
    return null
  }

  private static Str strVal(Dict d, Str name) {
    v := d.get(name, "")
    return v == null ? "" : v.toStr
  }
}
