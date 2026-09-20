using axon
using concurrent
using haystack
using hx
using folio

class UpsPodTreeTest : HxTest {
  private static const AtomicRef runtimeRef := AtomicRef()

  override HxTestSpi spi() { hxdSpi }

  override Void teardown() {}

  private once HxTestSpi hxdSpi() {
    Type.find("hxd::HxdTestSpi").make([this])
  }

  private HxRuntime testRt := makeRuntime

  private HxRuntime makeRuntime() {
    runtime := runtimeRef.val as HxRuntime
    if (runtime == null) {
      runtime = hxdSpi.start(Etc.emptyDict)
      runtimeRef.val = runtime
    }
    return runtime
  }

  Void testCreateReadUpdate() {
    created := UpsPodTree.create(testRt.db, "site",
      "{\"dis\":\"Alpha Site\",\"navName\":\"alphaSite\",\"site\":true,\"tz\":\"Shanghai\",\"upsSite\":true,\"upsTreeKey\":\"site-alpha\"}")

    verifyEq(created["status"], "created")
    siteId := created["id"] as Ref
    verifyNotNull(siteId)

    stored := testRt.db.readById(siteId)
    verifyEq(stored["dis"], "Alpha Site")
    verify(stored.has("site"))
    verify(stored.has("upsSite"))

    tree := UpsPodTree.read(testRt.db)
    row := tree.find |r| { r["id"] == siteId }
    verifyNotNull(row)
    verifyEq(row["type"], "site")
    verifyEq(row["dis"], "Alpha Site")

    updated := UpsPodTree.update(testRt.db, siteId,
      "{\"dis\":\"Alpha Campus\",\"navName\":\"alphaCampus\",\"tz\":\"Asia/Shanghai\"}")
    verifyEq(updated["status"], "updated")
    verifyEq(testRt.db.readById(siteId)["dis"], "Alpha Campus")
    verifyEq(testRt.db.readById(siteId)["upsTreeKey"], "site-alpha")
  }

  Void testCreateAllTypesAndAllowlists() {
    initialTreeSize := UpsPodTree.read(testRt.db).size
    site := UpsPodTree.create(testRt.db, "site",
      "{\"dis\":\"Site One\",\"navName\":\"siteOne\",\"site\":true,\"tz\":\"Asia/Shanghai\",\"upsSite\":true,\"upsTreeKey\":\"site-1\"}")
    siteId := ((Ref)site["id"]).id

    floor := UpsPodTree.create(testRt.db, "floor",
      "{\"dis\":\"Floor One\",\"navName\":\"floorOne\",\"floor\":true,\"siteRef\":\"$siteId\",\"upsTreeKey\":\"floor-1\"}")
    floorId := ((Ref)floor["id"]).id

    equip := UpsPodTree.create(testRt.db, "equip",
      "{\"dis\":\"UPS One\",\"navName\":\"upsOne\",\"equip\":true,\"upsUnit\":true,\"siteRef\":\"$siteId\",\"floorRef\":\"$floorId\",\"make\":\"Acme\",\"model\":\"X1\",\"serial\":\"SN-1\",\"ratedKva\":40,\"upsTreeKey\":\"equip-1\"}")
    equipId := ((Ref)equip["id"]).id

    metrics := ["upsSocPct", "upsLoadPct", "upsBatteryTemp", "upsCommStatus"]
    metrics.each |metric, i| {
      point := UpsPodTree.create(testRt.db, "point",
        "{\"dis\":\"Point $i\",\"navName\":\"point$i\",\"point\":true,\"siteRef\":\"$siteId\",\"floorRef\":\"$floorId\",\"equipRef\":\"$equipId\",\"kind\":\"Number\",\"unit\":\"%\",\"$metric\":true,\"upsTreeKey\":\"point-$i\"}")
      verifyEq(point["status"], "created")
      verifyEq(point["siteId"], Ref(siteId))
      verifyEq(point["floorId"], Ref(floorId))
      verifyEq(point["equipId"], Ref(equipId))
    }

    equipRec := testRt.db.readById(Ref(equipId))
    verifyEq(equipRec["make"], "Acme")
    verifyEq(equipRec["model"], "X1")
    verifyEq(equipRec["serial"], "SN-1")
    verifyEq(((Number)equipRec["ratedKva"]).toInt, 40)

    tree := UpsPodTree.read(testRt.db)
    verifyEq(tree.size, initialTreeSize + 7)
    metrics.each |metric, i| {
      verifyNotNull(tree.find |r| { r["dis"] == "Point $i" })
    }
  }

  Void testIdempotencyAndConflicts() {
    initial := testRt.db.readCount(Filter.has("upsTreeKey"))
    payload := "{\"dis\":\"Stable Site\",\"navName\":\"stableSite\",\"site\":true,\"tz\":\"Asia/Shanghai\",\"upsSite\":true,\"upsTreeKey\":\"stable-key\"}"
    first := UpsPodTree.create(testRt.db, "site", payload)
    firstId := first["id"]
    retry := UpsPodTree.create(testRt.db, "site", payload)
    verifyEq(retry["status"], "existing")
    verifyEq(retry["id"], firstId)
    verifyEq(testRt.db.readCount(Filter.has("upsTreeKey")), initial + 1)

    changed := UpsPodTree.create(testRt.db, "site",
      "{\"dis\":\"Changed Site\",\"navName\":\"stableSite\",\"site\":true,\"tz\":\"Asia/Shanghai\",\"upsSite\":true,\"upsTreeKey\":\"stable-key\"}")
    verifyEq(changed["status"], "conflict")
    verifyEq(changed["conflictId"], firstId)
    verifyEq(testRt.db.readCount(Filter.has("upsTreeKey")), initial + 1)

    other := UpsPodTree.create(testRt.db, "site",
      "{\"dis\":\"Other Site\",\"navName\":\"otherSite\",\"site\":true,\"upsSite\":true,\"upsTreeKey\":\"other-key\"}")
    otherId := ((Ref)other["id"]).id
    typeConflict := UpsPodTree.create(testRt.db, "floor",
      "{\"dis\":\"Floor X\",\"navName\":\"floorX\",\"floor\":true,\"siteRef\":\"$otherId\",\"upsTreeKey\":\"stable-key\"}")
    verifyEq(typeConflict["status"], "conflict")
    verifyEq(typeConflict["conflictId"], firstId)

    parentConflict := UpsPodTree.create(testRt.db, "floor",
      "{\"dis\":\"Floor One\",\"navName\":\"floorOne\",\"floor\":true,\"siteRef\":\"$otherId\",\"upsTreeKey\":\"floor-key\"}")
    verifyEq(parentConflict["status"], "created")
    firstSiteId := ((Ref)firstId).id
    movedRetry := UpsPodTree.create(testRt.db, "floor",
      "{\"dis\":\"Floor One\",\"navName\":\"floorOne\",\"floor\":true,\"siteRef\":\"$firstSiteId\",\"upsTreeKey\":\"floor-key\"}")
    verifyEq(movedRetry["status"], "conflict")
    verifyEq(movedRetry["conflictId"], parentConflict["id"])

    duplicateDis := UpsPodTree.create(testRt.db, "floor",
      "{\"dis\":\"Floor One\",\"navName\":\"otherNav\",\"floor\":true,\"siteRef\":\"$otherId\",\"upsTreeKey\":\"floor-dup-dis\"}")
    verifyEq(duplicateDis["status"], "conflict")
    verifyEq(duplicateDis["conflictId"], parentConflict["id"])

    duplicateNav := UpsPodTree.create(testRt.db, "floor",
      "{\"dis\":\"Other Floor\",\"navName\":\"floorOne\",\"floor\":true,\"siteRef\":\"$otherId\",\"upsTreeKey\":\"floor-dup-nav\"}")
    verifyEq(duplicateNav["status"], "conflict")
    verifyEq(duplicateNav["conflictId"], parentConflict["id"])
  }

  Void testRejectsUnsafeUpdatesAndPreservesRuntimeState() {
    ids := createTree
    pointId := ids["point"]
    point := testRt.db.readById(pointId)
    ts := DateTime.now - 1min
    percent := Unit("percent")
    persistent := Str:Obj?[
      "his": Marker.val,
      "history": Marker.val,
      "alarms": Marker.val,
      "val": Number(71f, percent),
      "dmValue": Number(70f, percent),
      "upsSimVal": Number(69f, percent),
      "upsSimTs": ts - 1min,
      "tz": "Shanghai",
      "unrequestedMeta": "keep-me",
    ]
    point = testRt.db.commit(Diff(point, persistent)).newRec
    testRt.db.commit(Diff(point, [
      "curVal": Number(72f, percent),
      "curStatus": "ok",
      "curStatusTs": ts,
    ], Diff.transient))
    samples := [HisItem(ts - 2min, Number(60f, percent)),
                HisItem(ts - 1min, Number(65f, percent))]
    testRt.db.his.write(pointId, samples).get

    before := testRt.db.readById(pointId)
    beforeHistory := readHistory(pointId)
    equipId := ids["equip"].id
    blocked := [
      "{\"curVal\":99}",
      "{\"curStatus\":\"down\"}",
      "{\"curStatusTs\":\"2026-09-20T00:00:00Z\"}",
      "{\"his\":true}",
      "{\"history\":true}",
      "{\"alarms\":true}",
      "{\"val\":99}",
      "{\"dmValue\":99}",
      "{\"upsSimVal\":99}",
      "{\"upsSimTs\":\"2026-09-20T00:00:00Z\"}",
      "{\"upsTreeKey\":\"changed\"}",
      "{\"point\":true}",
      "{\"equipRef\":\"$equipId\"}",
      "{\"upsLoadPct\":true}",
      "{\"unknownField\":\"x\"}",
    ]
    blocked.each |payload| {
      verifyErr(ArgErr#) { UpsPodTree.update(testRt.db, pointId, payload) }
      verify(Etc.dictEq(before, testRt.db.readById(pointId)))
      verifyEq(readHistory(pointId), beforeHistory)
    }

    result := UpsPodTree.update(testRt.db, pointId,
      "{\"dis\":\"SOC Updated\",\"navName\":\"socUpdated\",\"kind\":\"Number\",\"unit\":\"%\"}")
    verifyEq(result["status"], "updated")
    after := testRt.db.readById(pointId)
    verifyEq(after["dis"], "SOC Updated")
    verifyEq(after["navName"], "socUpdated")
    verifyEq(after["kind"], "Number")
    verifyEq(after["unit"], "%")
    ["curVal", "curStatus", "curStatusTs", "his", "history", "alarms",
     "val", "dmValue", "upsSimVal", "upsSimTs", "tz", "unrequestedMeta",
     "point", "siteRef", "floorRef", "equipRef", "upsSocPct", "upsTreeKey"].each |name| {
      verifyEq(after[name], before[name], "Protected/unrequested field changed: $name")
    }
    verifyEq(readHistory(pointId), beforeHistory)
  }

  Void testAxonSecurityMetadataAndNoDeleteApi() {
    readMethod := UpsPodLib#.method("upsTreeRead", false)
    verifyNotNull(readMethod)
    verifyEq(((Axon)readMethod.facet(Axon#)).admin, false)

    ["upsTreeCreate", "upsTreeUpdate"].each |name| {
      method := UpsPodLib#.method(name, false)
      verifyNotNull(method)
      facet := method.facet(Axon#, false) as Axon
      verifyNotNull(facet)
      verify(facet.admin)
    }

    verifyNull(UpsPodTree#.method("delete", false))
    verifyNull(UpsPodLib#.method("upsTreeDelete", false))
  }

  Void testCreateRejectsUnknownReservedMetricsAndCrossChain() {
    initial := testRt.db.readCount(Filter.has("upsTreeKey"))
    reserved := ["curVal", "curStatus", "curStatusTs", "his", "history", "alarms",
                 "val", "dmValue", "upsSimVal", "upsSimTs"]
    reserved.each |name| {
      verifyErr(ArgErr#) {
        UpsPodTree.create(testRt.db, "site",
          "{\"dis\":\"Bad\",\"navName\":\"bad\",\"site\":true,\"upsSite\":true,\"upsTreeKey\":\"bad-$name\",\"$name\":true}")
      }
      verifyEq(testRt.db.readCount(Filter.has("upsTreeKey")), initial)
    }
    verifyErr(ArgErr#) {
      UpsPodTree.create(testRt.db, "site",
        "{\"dis\":\"Bad\",\"navName\":\"bad\",\"site\":true,\"upsSite\":true,\"upsTreeKey\":\"bad-unknown\",\"bogus\":true}")
    }
    verifyErr(ArgErr#) {
      UpsPodTree.create(testRt.db, "site",
        "{\"dis\":\"Bad\",\"navName\":\"bad\",\"site\":false,\"upsSite\":true,\"upsTreeKey\":\"bad-marker\"}")
    }

    ids := createTree
    equipId := ids["equip"].id
    siteId := ids["site"].id
    floorId := ids["floor"].id
    verifyErr(ArgErr#) {
      UpsPodTree.create(testRt.db, "point",
        "{\"dis\":\"No Metric\",\"navName\":\"noMetric\",\"point\":true,\"siteRef\":\"$siteId\",\"floorRef\":\"$floorId\",\"equipRef\":\"$equipId\",\"kind\":\"Number\",\"unit\":\"%\",\"upsTreeKey\":\"no-metric\"}")
    }
    verifyErr(ArgErr#) {
      UpsPodTree.create(testRt.db, "point",
        "{\"dis\":\"Two Metrics\",\"navName\":\"twoMetrics\",\"point\":true,\"siteRef\":\"$siteId\",\"floorRef\":\"$floorId\",\"equipRef\":\"$equipId\",\"kind\":\"Number\",\"unit\":\"%\",\"upsSocPct\":true,\"upsLoadPct\":true,\"upsTreeKey\":\"two-metrics\"}")
    }

    site2 := UpsPodTree.create(testRt.db, "site",
      "{\"dis\":\"Site Two\",\"navName\":\"siteTwo\",\"site\":true,\"upsSite\":true,\"upsTreeKey\":\"site-two\"}")
    site2Id := ((Ref)site2["id"]).id
    floor2 := UpsPodTree.create(testRt.db, "floor",
      "{\"dis\":\"Floor Two\",\"navName\":\"floorTwo\",\"floor\":true,\"siteRef\":\"$site2Id\",\"upsTreeKey\":\"floor-two\"}")
    floor2Id := ((Ref)floor2["id"]).id
    verifyErr(ArgErr#) {
      UpsPodTree.create(testRt.db, "point",
        "{\"dis\":\"Cross Chain\",\"navName\":\"crossChain\",\"point\":true,\"siteRef\":\"$site2Id\",\"floorRef\":\"$floor2Id\",\"equipRef\":\"$equipId\",\"kind\":\"Number\",\"unit\":\"%\",\"upsSocPct\":true,\"upsTreeKey\":\"cross-chain\"}")
    }
    verifyEq(testRt.db.readCount(Filter.has("upsTreeKey")), initial + 6)
  }

  Void testUpdateAllAllowlists() {
    ids := createTree
    verifyEq(UpsPodTree.update(testRt.db, ids["site"],
      "{\"dis\":\"Site U\",\"navName\":\"siteU\",\"tz\":\"Shanghai\"}")["status"], "updated")
    verifyEq(UpsPodTree.update(testRt.db, ids["floor"].id,
      "{\"dis\":\"Floor U\",\"navName\":\"floorU\"}")["status"], "updated")
    verifyEq(UpsPodTree.update(testRt.db, ids["equip"],
      "{\"dis\":\"UPS U\",\"navName\":\"upsU\",\"make\":\"NewMake\",\"model\":\"NewModel\",\"serial\":\"NewSerial\",\"ratedKva\":80}")["status"], "updated")
    verifyEq(UpsPodTree.update(testRt.db, ids["point"],
      "{\"dis\":\"SOC U\",\"navName\":\"socU\",\"kind\":\"Number\",\"unit\":\"%\"}")["status"], "updated")

    equip := testRt.db.readById(ids["equip"])
    verifyEq(equip["make"], "NewMake")
    verifyEq(equip["model"], "NewModel")
    verifyEq(equip["serial"], "NewSerial")
    verifyEq(((Number)equip["ratedKva"]).toInt, 80)
  }

  Void testSecondIsolatedFolioRemainsUnchanged() {
    pool := ActorPool()
    suffix := Ref.gen.id
    dir1 := Env.cur.tempDir + "upsPod-one-$suffix/".toUri
    dir2 := Env.cur.tempDir + "upsPod-two-$suffix/".toUri
    db1 := FolioFlatFile.open(FolioConfig {
      it.name = "upsPodOne"
      it.dir = dir1
      it.pool = pool
    })
    db2 := FolioFlatFile.open(FolioConfig {
      it.name = "upsPodTwo"
      it.dir = dir2
      it.pool = pool
    })
    try {
      sentinel := db2.commit(Diff.makeAdd(["dis":"Secondary Sentinel", "sentinel":Marker.val])).newRec
      before := db2.readById(sentinel.id)
      beforeCount := db2.readCount(Filter.has("sentinel"))

      UpsPodTree.create(db1, "site",
        "{\"dis\":\"Primary Site\",\"navName\":\"primarySite\",\"site\":true,\"upsSite\":true,\"upsTreeKey\":\"primary-site\"}")

      verifyEq(db1.readCount(Filter.has("upsTreeKey")), 1)
      verifyEq(db2.readCount(Filter.has("sentinel")), beforeCount)
      verify(Etc.dictEq(before, db2.readById(sentinel.id)))
      verifyEq(db2.readCount(Filter.has("upsTreeKey")), 0)
    } finally {
      db1.close
      db2.close
      pool.stop
    }
  }

  Void testReadIncludesExistingCoherentUpsTreeWithoutTreeKeys() {
    site := testRt.db.commit(Diff.makeAdd(["dis":"Legacy Site", "navName":"legacySite",
                    "site":Marker.val, "upsSite":Marker.val])).newRec
    floor := testRt.db.commit(Diff.makeAdd(["dis":"Legacy Floor", "navName":"legacyFloor",
                     "floor":Marker.val, "siteRef":site.id])).newRec
    equip := testRt.db.commit(Diff.makeAdd(["dis":"Legacy UPS", "navName":"legacyUps",
                     "equip":Marker.val, "upsUnit":Marker.val,
                     "siteRef":site.id, "floorRef":floor.id])).newRec
    point := testRt.db.commit(Diff.makeAdd(["dis":"Legacy SOC", "navName":"legacySoc",
                     "point":Marker.val, "upsSocPct":Marker.val,
                     "siteRef":site.id, "floorRef":floor.id, "equipRef":equip.id])).newRec
    unrelated := testRt.db.commit(Diff.makeAdd(["dis":"Other Site", "site":Marker.val])).newRec

    tree := UpsPodTree.read(testRt.db)
    [site.id, floor.id, equip.id, point.id].each |id| {
      verifyNotNull(tree.find |row| { row["id"] == id })
    }
    verifyNull(tree.find |row| { row["id"] == unrelated.id })
    verifyEq(tree.colNames.sort,
      ["dis", "equipId", "floorId", "id", "siteId", "status", "type"])
  }

  private Str:Ref createTree() {
    suffix := Ref.gen.id
    site := UpsPodTree.create(testRt.db, "site",
      "{\"dis\":\"Site $suffix\",\"navName\":\"site$suffix\",\"site\":true,\"tz\":\"Asia/Shanghai\",\"upsSite\":true,\"upsTreeKey\":\"tree-site-$suffix\"}")
    siteId := (Ref)site["id"]
    floor := UpsPodTree.create(testRt.db, "floor",
      "{\"dis\":\"Floor $suffix\",\"navName\":\"floor$suffix\",\"floor\":true,\"siteRef\":\"${siteId.id}\",\"upsTreeKey\":\"tree-floor-$suffix\"}")
    floorId := (Ref)floor["id"]
    equip := UpsPodTree.create(testRt.db, "equip",
      "{\"dis\":\"UPS $suffix\",\"navName\":\"ups$suffix\",\"equip\":true,\"upsUnit\":true,\"siteRef\":\"${siteId.id}\",\"floorRef\":\"${floorId.id}\",\"make\":\"Acme\",\"model\":\"X\",\"serial\":\"1\",\"ratedKva\":40,\"upsTreeKey\":\"tree-equip-$suffix\"}")
    equipId := (Ref)equip["id"]
    point := UpsPodTree.create(testRt.db, "point",
      "{\"dis\":\"SOC $suffix\",\"navName\":\"soc$suffix\",\"point\":true,\"siteRef\":\"${siteId.id}\",\"floorRef\":\"${floorId.id}\",\"equipRef\":\"${equipId.id}\",\"kind\":\"Number\",\"unit\":\"%\",\"upsSocPct\":true,\"upsTreeKey\":\"tree-point-$suffix\"}")
    return ["site":siteId, "floor":floorId, "equip":equipId, "point":(Ref)point["id"]]
  }

  private HisItem[] readHistory(Ref id) {
    items := HisItem[,]
    testRt.db.his.read(id, null, null) |item| { items.add(item) }
    return items
  }
}
