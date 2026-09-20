using concurrent
using folio
using haystack
using hxFolio

class UpsPodTreeSeed {
  static Int main(Str[] args) {
    projDir := args.isEmpty ? Env.cur.workDir + `var/proj/mytest/db/` : File.os(args[0]).normalize
    if (!projDir.exists) {
      echo("FAIL missing project db: $projDir")
      return 2
    }

    pool := ActorPool()
    db := HxFolio.open(FolioConfig {
      it.name = "mytest"
      it.dir = projDir
      it.log = Log.get("upsPod.seed")
      it.pool = pool
    })
    try {
      diffs := Diff[,]
      now := DateTime.now
      site := Ref("ups-pod-site", "UPS 监控站点")
      floor := Ref("ups-pod-floor", "UPS 配电间")

      removeDuplicateUnits(db, diffs)

      addIfMissing(db, diffs, site, [
        "dis": "UPS 监控站点",
        "navName": "UPS 监控站点",
        "site": Marker.val,
        "upsSite": Marker.val,
        "tz": TimeZone.cur.name,
        "upsPodSeed": Marker.val,
      ])

      addIfMissing(db, diffs, floor, [
        "dis": "UPS 配电间",
        "navName": "UPS 配电间",
        "floor": Marker.val,
        "siteRef": site,
        "upsPodSeed": Marker.val,
      ])

      addUps(db, diffs, site, floor, "ups-pod-01", "UPS-01", 92f, 41f, 26f, "online", now)
      addUps(db, diffs, site, floor, "ups-pod-02", "UPS-02", 78f, 56f, 29f, "online", now)
      addUps(db, diffs, site, floor, "ups-pod-03", "UPS-03", null, null, null, "offline", null)

      if (diffs.isEmpty) {
        echo("OK upsPod seed already present")
      } else {
        db.commitAll(diffs)
        db.sync(30sec)
        echo("OK committed " + diffs.size + " upsPod tree records")
      }
      return 0
    } finally {
      db.close(30sec)
      pool.stop
    }
  }

  private static Void addUps(Folio db, Diff[] diffs, Ref site, Ref floor, Str id, Str dis,
                             Float? soc, Float? load, Float? temp, Str comm, DateTime? ts) {
    equip := Ref(id, dis)
    addIfMissing(db, diffs, equip, [
      "dis": dis,
      "navName": dis,
      "equip": Marker.val,
      "upsUnit": Marker.val,
      "siteRef": site,
      "floorRef": floor,
      "make": "desmondUPS",
      "model": "POD-SIM",
      "serial": id.upper,
      "ratedKva": Number(80f, null),
      "upsPodSeed": Marker.val,
    ])
    addPoint(db, diffs, equip, site, floor, id + "-soc", dis + " SOC", "upsSocPct", soc, Number.percent, ts)
    addPoint(db, diffs, equip, site, floor, id + "-load", dis + " 负载率", "upsLoadPct", load, Number.percent, ts)
    addPoint(db, diffs, equip, site, floor, id + "-temp", dis + " 电池温度", "upsBatteryTemp", temp, Number.C, ts)
    addPoint(db, diffs, equip, site, floor, id + "-comm", dis + " 通讯状态", "upsCommStatus", comm, null, ts ?: DateTime.now)
  }

  private static Void addPoint(Folio db, Diff[] diffs, Ref equip, Ref site, Ref floor, Str id,
                               Str dis, Str metricTag, Obj? val, Unit? unit, DateTime? ts) {
    tags := Str:Obj?[
      "dis": dis,
      "navName": dis,
      "point": Marker.val,
      "siteRef": site,
      "floorRef": floor,
      "equipRef": equip,
      metricTag: Marker.val,
      "kind": val is Str ? "Str" : "Number",
      "upsPodSeed": Marker.val,
    ]
    if (val is Float) tags["upsSimVal"] = Number((Float)val, unit)
    else if (val != null) tags["upsSimVal"] = val
    if (ts != null) tags["upsSimTs"] = ts
    upsertPoint(db, diffs, Ref(id, dis), tags)
  }

  private static Void upsertPoint(Folio db, Diff[] diffs, Ref id, [Str:Obj?] tags) {
    rec := db.readById(id, false)
    if (rec == null) {
      diffs.add(Diff.makeAdd(tags, id))
      return
    }
    changes := Str:Obj?[:]
    tags.each |v, k| { if (rec.get(k, null) != v) changes[k] = v }
    if (!tags.containsKey("upsSimVal") && rec.has("upsSimVal")) changes["upsSimVal"] = Remove.val
    if (!tags.containsKey("upsSimTs") && rec.has("upsSimTs")) changes["upsSimTs"] = Remove.val
    if (rec.has("dmValue")) changes["dmValue"] = Remove.val
    if (rec.has("val")) changes["val"] = Remove.val
    if (!changes.isEmpty) diffs.add(Diff(rec, changes))
  }

  private static Void removeDuplicateUnits(Folio db, Diff[] diffs) {
    expected := ["UPS-01":"ups-pod-01", "UPS-02":"ups-pod-02", "UPS-03":"ups-pod-03"]
    units := db.readAllList(Filter.has("upsPodSeed").and(Filter.has("upsUnit")).and(Filter.has("equip")), null)
    points := db.readAllList(Filter.has("upsPodSeed").and(Filter.has("point")).and(Filter.has("equipRef")), null)
    units.each |u| {
      expectedId := expected[u.dis(null, "")]
      if (expectedId == null || u.id.id == expectedId) return
      points.each |p| {
        equipRef := p.get("equipRef", null) as Ref
        if (equipRef?.id == u.id.id) diffs.add(Diff(p, null, Diff.remove))
      }
      diffs.add(Diff(u, null, Diff.remove))
    }
  }

  private static Void addIfMissing(Folio db, Diff[] diffs, Ref id, [Str:Obj?] tags) {
    if (db.readById(id, false) != null) return
    diffs.add(Diff.makeAdd(tags, id))
  }
}
