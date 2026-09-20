using axon
using concurrent
using haystack
using hx
using folio

class UpsPodTreeTest : HxTest {
  private static const AtomicRef runtimeRef := AtomicRef()

  override HxTestSpi spi() { hxdSpi }

  override Void teardown() {}

  Void testLoadsProductionPodFromActivePathEnv() {
    treeUi := Pod.find("upsPod").file(`/frontend/tree-ui.js`).readAllStr
    verify(treeUi.contains("getRandomValues"))
    verifyFalse(treeUi.contains("treeKeyCounter"))
  }

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
    rtRef = runtime
    return runtime
  }

  Void testCreateReadUpdate() {
    created := UpsPodTree.create(testRt.db, "site",
      "{\"dis\":\"Alpha Site\",\"navName\":\"alphaSite\",\"tz\":\"Shanghai\",\"upsTreeKey\":\"site-alpha\"}")

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
    verifyEq(row["navName"], "alphaSite")
    verifyEq(row["tz"], "Shanghai")

    updated := UpsPodTree.update(testRt.db, siteId,
      "{\"dis\":\"Alpha Campus\",\"navName\":\"alphaCampus\",\"tz\":\"Asia/Shanghai\"}")
    verifyEq(updated["status"], "updated")
    verifyEq(testRt.db.readById(siteId)["dis"], "Alpha Campus")
    verifyEq(testRt.db.readById(siteId)["upsTreeKey"], "site-alpha")
  }

  Void testCreateAllTypesAndAllowlists() {
    initialTreeSize := UpsPodTree.read(testRt.db).size
    site := UpsPodTree.create(testRt.db, "site",
      "{\"dis\":\"Site One\",\"navName\":\"siteOne\",\"tz\":\"Asia/Shanghai\",\"upsTreeKey\":\"site-1\"}")
    siteId := ((Ref)site["id"]).id

    floor := UpsPodTree.create(testRt.db, "floor",
      "{\"dis\":\"Floor One\",\"navName\":\"floorOne\",\"siteRef\":\"$siteId\",\"upsTreeKey\":\"floor-1\"}")
    floorId := ((Ref)floor["id"]).id
    verify(testRt.db.readById(Ref(floorId)).has("floor"))

    equip := UpsPodTree.create(testRt.db, "equip",
      "{\"dis\":\"UPS One\",\"navName\":\"upsOne\",\"siteRef\":\"$siteId\",\"floorRef\":\"$floorId\",\"make\":\"Acme\",\"model\":\"X1\",\"serial\":\"SN-1\",\"ratedKva\":40,\"upsTreeKey\":\"equip-1\"}")
    equipId := ((Ref)equip["id"]).id
    equipStored := testRt.db.readById(Ref(equipId))
    verify(equipStored.has("equip"))
    verify(equipStored.has("upsUnit"))

    metrics := ["upsSocPct", "upsLoadPct", "upsBatteryTemp", "upsCommStatus"]
    metrics.each |metric, i| {
      point := UpsPodTree.create(testRt.db, "point",
        "{\"dis\":\"Point $i\",\"navName\":\"point$i\",\"siteRef\":\"$siteId\",\"floorRef\":\"$floorId\",\"equipRef\":\"$equipId\",\"kind\":\"Number\",\"unit\":\"%\",\"$metric\":true,\"upsTreeKey\":\"point-$i\"}")
      verifyEq(point["status"], "created")
      verifyEq(point["siteId"], Ref(siteId))
      verifyEq(point["floorId"], Ref(floorId))
      verifyEq(point["equipId"], Ref(equipId))
      pointStored := testRt.db.readById((Ref)point["id"])
      verify(pointStored.has("point"))
      verify(pointStored.has(metric))
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
    equipRow := tree.find |r| { r["id"] == Ref(equipId) }
    verifyEq(equipRow["make"], "Acme")
    verifyEq(equipRow["model"], "X1")
    verifyEq(equipRow["serial"], "SN-1")
    verifyEq(((Number)equipRow["ratedKva"]).toInt, 40)
    pointRow := tree.find |r| { r["dis"] == "Point 0" }
    verifyEq(pointRow["kind"], "Number")
    verifyEq(pointRow["unit"], "%")
    verifyEq(pointRow["metric"], "upsSocPct")
  }

  Void testIdempotencyAndConflicts() {
    initial := testRt.db.readCount(Filter.has("upsTreeKey"))
    payload := "{\"dis\":\"Stable Site\",\"navName\":\"stableSite\",\"tz\":\"Asia/Shanghai\",\"upsTreeKey\":\"stable-key\"}"
    first := UpsPodTree.create(testRt.db, "site", payload)
    firstId := first["id"]
    retry := UpsPodTree.create(testRt.db, "site", payload)
    verifyEq(retry["status"], "existing")
    verifyEq(retry["id"], firstId)
    verifyEq(testRt.db.readCount(Filter.has("upsTreeKey")), initial + 1)

    changed := UpsPodTree.create(testRt.db, "site",
      "{\"dis\":\"Changed Site\",\"navName\":\"stableSite\",\"tz\":\"Asia/Shanghai\",\"upsTreeKey\":\"stable-key\"}")
    verifyEq(changed["status"], "existing")
    verifyEq(changed["id"], firstId)
    verifyEq(testRt.db.readById((Ref)firstId)["dis"], "Stable Site")
    verifyEq(testRt.db.readCount(Filter.has("upsTreeKey")), initial + 1)

    UpsPodTree.update(testRt.db, firstId,
      "{\"dis\":\"Renamed Stable Site\",\"navName\":\"renamedStableSite\"}")
    replay := UpsPodTree.create(testRt.db, "site", payload)
    verifyEq(replay["status"], "existing")
    verifyEq(replay["id"], firstId)
    verifyEq(testRt.db.readById((Ref)firstId)["dis"], "Renamed Stable Site")

    other := UpsPodTree.create(testRt.db, "site",
      "{\"dis\":\"Other Site\",\"navName\":\"otherSite\",\"upsTreeKey\":\"other-key\"}")
    otherId := ((Ref)other["id"]).id
    typeConflict := UpsPodTree.create(testRt.db, "floor",
      "{\"dis\":\"Floor X\",\"navName\":\"floorX\",\"siteRef\":\"$otherId\",\"upsTreeKey\":\"stable-key\"}")
    verifyEq(typeConflict["status"], "conflict")
    verifyEq(typeConflict["conflictId"], firstId)

    parentConflict := UpsPodTree.create(testRt.db, "floor",
      "{\"dis\":\"Floor One\",\"navName\":\"floorOne\",\"siteRef\":\"$otherId\",\"upsTreeKey\":\"floor-key\"}")
    verifyEq(parentConflict["status"], "created")
    firstSiteId := ((Ref)firstId).id
    movedRetry := UpsPodTree.create(testRt.db, "floor",
      "{\"dis\":\"Floor One\",\"navName\":\"floorOne\",\"siteRef\":\"$firstSiteId\",\"upsTreeKey\":\"floor-key\"}")
    verifyEq(movedRetry["status"], "conflict")
    verifyEq(movedRetry["conflictId"], parentConflict["id"])

    duplicateDis := UpsPodTree.create(testRt.db, "floor",
      "{\"dis\":\"Floor One\",\"navName\":\"otherNav\",\"siteRef\":\"$otherId\",\"upsTreeKey\":\"floor-dup-dis\"}")
    verifyEq(duplicateDis["status"], "conflict")
    verifyEq(duplicateDis["conflictId"], parentConflict["id"])

    duplicateNav := UpsPodTree.create(testRt.db, "floor",
      "{\"dis\":\"Other Floor\",\"navName\":\"floorOne\",\"siteRef\":\"$otherId\",\"upsTreeKey\":\"floor-dup-nav\"}")
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
    ["upsTreeRead", "upsTreeCreate", "upsTreeUpdate"].each |name| {
      method := Pod.find("upsPod").type("UpsPodLib").method(name, false)
      verifyNotNull(method)
      facet := method.facet(Axon#, false) as Axon
      verifyNotNull(facet)
      verify(facet.admin)
    }

    verifyNull(Pod.find("upsPod").type("UpsPodTree").method("delete", false))
    verifyNull(Pod.find("upsPod").type("UpsPodLib").method("upsTreeDelete", false))
  }

  Void testAxonWrappersEnforceAdminAndUseCurrentDb() {
    suffix := Ref.gen.id
    operator := addUser("operator$suffix", "pass", ["userRole":"op"])
    admin := addUser("admin$suffix", "pass", ["userRole":"admin"])
    operatorCx := makeContext(operator)
    adminCx := makeContext(admin)
    before := testRt.db.readCount(Filter.has("upsTreeKey"))
    payload := "{\"dis\":\"Wrapper $suffix\",\"navName\":\"wrapper$suffix\",\"upsTreeKey\":\"wrapper-$suffix\"}"
    deniedBefore := canonicalSnapshot(testRt.db)

    verifyErr(PermissionErr#) { callWrapper(operatorCx, "upsTreeRead") }
    verifyErr(PermissionErr#) { callWrapper(operatorCx, "upsTreeCreate", ["site", payload]) }
    verifyEq(testRt.db.readCount(Filter.has("upsTreeKey")), before)
    verifyEq(canonicalSnapshot(testRt.db), deniedBefore)

    created := (Dict)callWrapper(adminCx, "upsTreeCreate", ["site", payload])
    verifyEq(created["status"], "created")
    verifyEq(testRt.db.readCount(Filter.has("upsTreeKey")), before + 1)
    id := (Ref)created["id"]

    updateBefore := canonicalSnapshot(testRt.db)
    verifyErr(PermissionErr#) {
      callWrapper(operatorCx, "upsTreeUpdate", [id, "{\"dis\":\"Denied\"}"])
    }
    verifyEq(testRt.db.readById(id)["dis"], "Wrapper $suffix")
    verifyEq(canonicalSnapshot(testRt.db), updateBefore)

    updated := (Dict)callWrapper(adminCx, "upsTreeUpdate",
      [id, "{\"dis\":\"Wrapper Updated $suffix\"}"])
    verifyEq(updated["status"], "updated")
    actorKey := Etc.cxActorLocalsKey
    priorCx := Actor.locals[actorKey]
    sentinelCx := makeContext(admin)
    Grid? grid := null
    try {
      Actor.locals[actorKey] = sentinelCx
      grid = (Grid)callWrapper(adminCx, "upsTreeRead")
      verifySame(Actor.locals[actorKey], sentinelCx)
    } finally {
      if (priorCx == null) Actor.locals.remove(actorKey)
      else Actor.locals[actorKey] = priorCx
    }
    verifySame(Actor.locals[actorKey], priorCx)
    verifyNotNull(grid)
    actualGrid := (Grid)grid
    verifyNotNull(actualGrid.find |row| { row["id"] == id })

    verifyNotNull(ZincWriter.gridToStr(actualGrid))
    verifyNotNull(ZincWriter.gridToStr(Etc.makeDictsGrid(null, [created])))
    verifyNotNull(ZincWriter.gridToStr(Etc.makeDictsGrid(null, [updated])))
  }

  Void testCreateRejectsUnknownReservedMetricsAndCrossChain() {
    initial := testRt.db.readCount(Filter.has("upsTreeKey"))
    reserved := ["curVal", "curStatus", "curStatusTs", "his", "history", "alarms",
                 "val", "dmValue", "upsSimVal", "upsSimTs"]
    reserved.each |name| {
      verifyErr(ArgErr#) {
        UpsPodTree.create(testRt.db, "site",
          "{\"dis\":\"Bad\",\"navName\":\"bad\",\"upsTreeKey\":\"bad-$name\",\"$name\":true}")
      }
      verifyEq(testRt.db.readCount(Filter.has("upsTreeKey")), initial)
    }
    verifyErr(ArgErr#) {
      UpsPodTree.create(testRt.db, "site",
        "{\"dis\":\"Bad\",\"navName\":\"bad\",\"upsTreeKey\":\"bad-unknown\",\"bogus\":true}")
    }
    ["site", "upsSite", "floor", "equip", "upsUnit", "point"].each |marker| {
      verifyErr(ArgErr#) {
        UpsPodTree.create(testRt.db, "site",
          "{\"dis\":\"Bad\",\"navName\":\"bad\",\"upsTreeKey\":\"bad-$marker\",\"$marker\":true}")
      }
    }

    ids := createTree
    equipId := ids["equip"].id
    siteId := ids["site"].id
    floorId := ids["floor"].id
    verifyErr(ArgErr#) {
      UpsPodTree.create(testRt.db, "point",
        "{\"dis\":\"No Metric\",\"navName\":\"noMetric\",\"siteRef\":\"$siteId\",\"floorRef\":\"$floorId\",\"equipRef\":\"$equipId\",\"kind\":\"Number\",\"unit\":\"%\",\"upsTreeKey\":\"no-metric\"}")
    }
    verifyErr(ArgErr#) {
      UpsPodTree.create(testRt.db, "point",
        "{\"dis\":\"Two Metrics\",\"navName\":\"twoMetrics\",\"siteRef\":\"$siteId\",\"floorRef\":\"$floorId\",\"equipRef\":\"$equipId\",\"kind\":\"Number\",\"unit\":\"%\",\"upsSocPct\":true,\"upsLoadPct\":true,\"upsTreeKey\":\"two-metrics\"}")
    }

    site2 := UpsPodTree.create(testRt.db, "site",
      "{\"dis\":\"Site Two\",\"navName\":\"siteTwo\",\"upsTreeKey\":\"site-two\"}")
    site2Id := ((Ref)site2["id"]).id
    floor2 := UpsPodTree.create(testRt.db, "floor",
      "{\"dis\":\"Floor Two\",\"navName\":\"floorTwo\",\"siteRef\":\"$site2Id\",\"upsTreeKey\":\"floor-two\"}")
    floor2Id := ((Ref)floor2["id"]).id
    verifyErr(ArgErr#) {
      UpsPodTree.create(testRt.db, "point",
        "{\"dis\":\"Cross Chain\",\"navName\":\"crossChain\",\"siteRef\":\"$site2Id\",\"floorRef\":\"$floor2Id\",\"equipRef\":\"$equipId\",\"kind\":\"Number\",\"unit\":\"%\",\"upsSocPct\":true,\"upsTreeKey\":\"cross-chain\"}")
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

  Void testClearRatedKvaRemovesOnlyThatTag() {
    ids := createTree
    equipId := ids["equip"]
    pointId := ids["point"]
    ts := DateTime.now - 1min
    equip := testRt.db.readById(equipId)
    equip = testRt.db.commit(Diff(equip, ["unrequestedMeta":"keep-me"])).newRec
    point := testRt.db.readById(pointId)
    point = testRt.db.commit(Diff(point, ["his":Marker.val, "tz":TimeZone.cur.name])).newRec
    testRt.db.commit(Diff(point, [
      "curVal":Number(17), "curStatus":"ok", "curStatusTs":ts,
    ], Diff.transient))
    testRt.db.his.write(pointId, [HisItem(ts, Number(17))]).get
    before := testRt.db.readById(equipId)
    beforePoint := testRt.db.readById(pointId)
    beforeHistory := readHistory(pointId)

    result := UpsPodTree.update(testRt.db, equipId, "{\"ratedKva\":null}")

    verifyEq(result["status"], "updated")
    after := testRt.db.readById(equipId)
    verifyFalse(after.has("ratedKva"))
    ["dis", "navName", "make", "model", "serial", "siteRef", "floorRef",
     "equip", "upsUnit", "upsTreeKey", "unrequestedMeta"].each |name| {
      verifyEq(after[name], before[name], "Unrelated field changed while clearing ratedKva: $name")
    }
    verify(Etc.dictEq(testRt.db.readById(pointId), beforePoint))
    verifyEq(readHistory(pointId), beforeHistory)

    beforeRepeatVer := testRt.db.curVer
    repeated := UpsPodTree.update(testRt.db, equipId, "{\"ratedKva\":null}")
    verifyEq(repeated["status"], "unchanged")
    verifyEq(testRt.db.curVer, beforeRepeatVer)

    verifyErr(ArgErr#) { UpsPodTree.update(testRt.db, equipId, "{\"make\":null}") }
    siteId := ids["site"].id
    floorId := ids["floor"].id
    verifyErr(ArgErr#) {
      UpsPodTree.create(testRt.db, "equip",
        "{\"dis\":\"Bad\",\"navName\":\"bad\",\"siteRef\":\"$siteId\",\"floorRef\":\"$floorId\",\"ratedKva\":null,\"upsTreeKey\":\"bad-null-rated\"}")
    }
  }

  Void testRepeatedUpdateDoesNotCommitOrNotifyObservers() {
    ids := createTree
    point := testRt.db.readById(ids["point"])
    beforeVer := testRt.db.curVer
    before := canonicalSnapshot(testRt.db)
    pointDis := point.dis
    pointNav := (Str)point["navName"]
    pointKind := (Str)point["kind"]
    pointUnit := (Str)point["unit"]

    result := UpsPodTree.update(testRt.db, point.id,
      "{\"dis\":\"$pointDis\",\"navName\":\"$pointNav\",\"kind\":\"$pointKind\",\"unit\":\"$pointUnit\"}")

    verifyEq(result["status"], "unchanged")
    verifyEq(result["id"], point.id)
    verifyEq(testRt.db.curVer, beforeVer)
    verifyEq(canonicalSnapshot(testRt.db), before)
  }

  Void testCreateAndUpdateRejectRecordsOutsideCoherentUpsBoundary() {
    suffix := Ref.gen.id
    ordinarySite := testRt.db.commit(Diff.makeAdd([
      "dis":"Ordinary Site $suffix", "navName":"ordinarySite$suffix",
      "site":Marker.val, "upsTreeKey":"ordinary-key-$suffix"])).newRec
    ordinaryFloor := testRt.db.commit(Diff.makeAdd([
      "dis":"Ordinary Floor", "floor":Marker.val, "siteRef":ordinarySite.id])).newRec
    ordinaryEquip := testRt.db.commit(Diff.makeAdd([
      "dis":"Ordinary Equip", "equip":Marker.val,
      "siteRef":ordinarySite.id, "floorRef":ordinaryFloor.id])).newRec
    ordinaryPoint := testRt.db.commit(Diff.makeAdd([
      "dis":"Ordinary Point", "point":Marker.val, "upsSocPct":Marker.val,
      "siteRef":ordinarySite.id, "floorRef":ordinaryFloor.id,
      "equipRef":ordinaryEquip.id])).newRec

    keyCollision := UpsPodTree.create(testRt.db, "site",
      "{\"dis\":\"Ordinary Site $suffix\",\"navName\":\"ordinarySite$suffix\",\"upsTreeKey\":\"ordinary-key-$suffix\"}")
    verifyEq(keyCollision["status"], "conflict")
    verifyEq(keyCollision["conflictId"], ordinarySite.id)

    verifyErr(ArgErr#) {
      UpsPodTree.create(testRt.db, "floor",
        "{\"dis\":\"Rejected Floor\",\"navName\":\"rejectedFloor\",\"siteRef\":\"${ordinarySite.id.id}\",\"upsTreeKey\":\"rejected-floor-${ordinarySite.id.id}\"}")
    }
    verifyErr(ArgErr#) {
      UpsPodTree.create(testRt.db, "equip",
        "{\"dis\":\"Rejected UPS\",\"navName\":\"rejectedUps\",\"siteRef\":\"${ordinarySite.id.id}\",\"floorRef\":\"${ordinaryFloor.id.id}\",\"upsTreeKey\":\"rejected-equip-${ordinaryEquip.id.id}\"}")
    }
    verifyErr(ArgErr#) {
      UpsPodTree.create(testRt.db, "point",
        "{\"dis\":\"Rejected Point\",\"navName\":\"rejectedPoint\",\"siteRef\":\"${ordinarySite.id.id}\",\"floorRef\":\"${ordinaryFloor.id.id}\",\"equipRef\":\"${ordinaryEquip.id.id}\",\"kind\":\"Number\",\"unit\":\"%\",\"upsSocPct\":true,\"upsTreeKey\":\"rejected-point-${ordinaryPoint.id.id}\"}")
    }

    [ordinarySite.id, ordinaryFloor.id, ordinaryEquip.id, ordinaryPoint.id].each |id| {
      before := testRt.db.readById(id)
      verifyErr(ArgErr#) { UpsPodTree.update(testRt.db, id, "{\"dis\":\"Rejected\"}") }
      verify(Etc.dictEq(before, testRt.db.readById(id)))
    }

    ids := createTree
    brokenEquip := testRt.db.readById(ids["equip"])
    testRt.db.commit(Diff(brokenEquip, ["upsUnit":Remove.val]))
    point := testRt.db.readById(ids["point"])
    verifyErr(ArgErr#) { UpsPodTree.update(testRt.db, point.id, "{\"dis\":\"Rejected Point\"}") }
    verify(Etc.dictEq(point, testRt.db.readById(point.id)))
  }

  Void testConcurrentIdempotentCreateCommitsExactlyOneRecord() {
    suffix := Ref.gen.id
    payload := "{\"dis\":\"Concurrent $suffix\",\"navName\":\"concurrent$suffix\",\"upsTreeKey\":\"concurrent-$suffix\"}"
    before := testRt.db.readCount(Filter.eq("upsTreeKey", "concurrent-$suffix"))
    ready := AtomicInt()
    start := AtomicBool()
    pool := ActorPool { it.maxThreads = 12 }
    receive := |Obj? msg->Obj?| {
      args := (Obj?[])msg
      ((AtomicInt)args[0]).increment
      gate := (AtomicBool)args[1]
      while (!gate.val) Actor.sleep(1ms)
      return UpsPodTree.create((Folio)args[2], "site", (Str)args[3])
    }
    try {
      futures := Future[,]
      12.times {
        actor := Actor(pool, receive)
        futures.add(actor.send(Obj?[ready, start, testRt.db, payload].toImmutable))
      }
      while (ready.val < 12) Actor.sleep(1ms)
      start.val = true
      results := Dict[,]
      futures.each |future| { results.add((Dict)future.get(10sec)) }
      verifyEq(results.findAll |r| { r["status"] == "created" }.size, 1)
      verifyEq(results.findAll |r| { r["status"] == "existing" }.size, 11)
      ids := Ref[,]
      results.each |r| { ids.add((Ref)r["id"]) }
      verifyEq(ids.unique.size, 1)
      verifyEq(testRt.db.readCount(Filter.eq("upsTreeKey", "concurrent-$suffix")), before + 1)
    } finally {
      pool.stop.join(5sec)
    }
  }

  Void testConcurrentMutationsPreserveSiblingNameUniqueness() {
    suffix := Ref.gen.id
    site := UpsPodTree.create(testRt.db, "site",
      "{\"dis\":\"Race Site $suffix\",\"navName\":\"raceSite$suffix\",\"upsTreeKey\":\"race-site-$suffix\"}")
    siteId := (Ref)site["id"]
    pool := ActorPool { it.maxThreads = 4 }
    receive := |Obj? msg->Obj?| {
      args := (Obj?[])msg
      ((AtomicInt)args[0]).increment
      gate := (AtomicBool)args[1]
      while (!gate.val) Actor.sleep(1ms)
      db := (Folio)args[2]
      if (args[3] == "create") return UpsPodTree.create(db, "floor", (Str)args[5])
      return UpsPodTree.update(db, (Ref)args[4], (Str)args[5])
    }
    try {
      20.times |round| {
        left := UpsPodTree.create(testRt.db, "floor",
          "{\"dis\":\"Left $suffix $round\",\"navName\":\"left${suffix}$round\",\"siteRef\":\"${siteId.id}\",\"upsTreeKey\":\"left-$suffix-$round\"}")
        right := UpsPodTree.create(testRt.db, "floor",
          "{\"dis\":\"Right $suffix $round\",\"navName\":\"right${suffix}$round\",\"siteRef\":\"${siteId.id}\",\"upsTreeKey\":\"right-$suffix-$round\"}")
        targetDis := "Updated Race $suffix $round"
        targetNav := "updatedRace${suffix}$round"
        payload := "{\"dis\":\"$targetDis\",\"navName\":\"$targetNav\"}"
        results := runOverlap(pool, receive, [
          Obj?[testRt.db, "update", (Ref)left["id"], payload],
          Obj?[testRt.db, "update", (Ref)right["id"], payload],
        ])
        verifyEq(results.findAll |r| { r["status"] == "updated" }.size, 1)
        verifyEq(results.findAll |r| { r["status"] == "conflict" }.size, 1)
        verifyEq(siblingNameMatches(siteId, targetDis, targetNav), 1)

        existing := UpsPodTree.create(testRt.db, "floor",
          "{\"dis\":\"Existing $suffix $round\",\"navName\":\"existing${suffix}$round\",\"siteRef\":\"${siteId.id}\",\"upsTreeKey\":\"existing-$suffix-$round\"}")
        createDis := "Create Update Race $suffix $round"
        createNav := "createUpdateRace${suffix}$round"
        updatePayload := "{\"dis\":\"$createDis\",\"navName\":\"$createNav\"}"
        createPayload := "{\"dis\":\"$createDis\",\"navName\":\"$createNav\",\"siteRef\":\"${siteId.id}\",\"upsTreeKey\":\"created-$suffix-$round\"}"
        results = runOverlap(pool, receive, [
          Obj?[testRt.db, "create", null, createPayload],
          Obj?[testRt.db, "update", (Ref)existing["id"], updatePayload],
        ])
        verifyEq(results.findAll |r| { r["status"] != "conflict" }.size, 1)
        verifyEq(results.findAll |r| { r["status"] == "conflict" }.size, 1)
        verifyEq(siblingNameMatches(siteId, createDis, createNav), 1)
      }
    } finally {
      pool.stop.join(5sec)
    }
  }

  Void testMutationLockIsPerFolioAndTimesOut() {
    suffix := Ref.gen.id
    dir2 := Env.cur.tempDir + "upsPod-lock-two-$suffix/".toUri
    rt2 := (HxRuntime)Type.find("hxd::HxdTestSpi").method("boot").call(dir2, Etc.emptyDict)
    pool := ActorPool()
    held := AtomicBool()
    release := AtomicBool()
    holder := Actor(pool) |Obj? msg->Obj?| {
      args := (Obj?[])msg
      acquire := Pod.find("upsPod").type("UpsPodTree").method("acquireMutationLock", false)
      if (acquire == null) throw Err("Missing per-Folio lock acquisition")
      gate := (AtomicBool)acquire.call((Folio)args[0])
      ((AtomicBool)args[1]).val = true
      until := (AtomicBool)args[2]
      while (!until.val) Actor.sleep(1ms)
      gate.val = false
      return null
    }
    future := holder.send(Obj?[testRt.db, held, release].toImmutable)
    try {
      deadline := Duration.now + 2sec
      while (!held.val && Duration.now < deadline) Actor.sleep(1ms)
      verify(held.val, "Timed out waiting for the test to hold db1 mutation lock")

      other := UpsPodTree.create(rt2.db, "site",
        "{\"dis\":\"Other DB $suffix\",\"navName\":\"otherDb$suffix\",\"upsTreeKey\":\"other-db-$suffix\"}")
      verifyEq(other["status"], "created")
      verify(held.val, "db2 mutation must complete while db1 remains locked")

      started := Duration.now
      Err? busy := null
      try {
        UpsPodTree.create(testRt.db, "site",
          "{\"dis\":\"Busy $suffix\",\"navName\":\"busy$suffix\",\"upsTreeKey\":\"busy-$suffix\"}")
      } catch (Err err) {
        busy = err
      }
      verifyNotNull(busy)
      verifyEq(((Err)busy).typeof.name, "UpsPodTreeBusyErr")
      verify(Duration.now - started < 2sec, "Same-db lock timeout must be bounded")
    } finally {
      release.val = true
      future.get(5sec)
      pool.stop.join(5sec)
      rt2.typeof.method("stop").call(rt2)
    }
  }

  Void testSecondIsolatedFolioRemainsUnchanged() {
    suffix := Ref.gen.id
    dir2 := Env.cur.tempDir + "upsPod-two-$suffix/".toUri
    rt2 := (HxRuntime)Type.find("hxd::HxdTestSpi").method("boot").call(dir2, Etc.emptyDict)
    db2 := rt2.db
    try {
      sentinel := db2.commit(Diff.makeAdd(["dis":"Secondary Sentinel", "sentinel":Marker.val,
        "point":Marker.val, "kind":"Number", "tz":TimeZone.cur.name, "his":Marker.val])).newRec
      secondHis := db2.readById(sentinel.id)
      db2.his.write(secondHis.id, [HisItem(DateTime.now - 1min, Number(7))]).get
      db2.commit(Diff.makeAdd(["dis":"Secondary Metadata", "meta":"unchanged"]))
      before := canonicalSnapshot(db2)

      admin := addUser("snapshotAdmin$suffix", "pass", ["userRole":"admin"])
      created := (Dict)callWrapper(makeContext(admin), "upsTreeCreate", ["site",
        "{\"dis\":\"Primary Site $suffix\",\"navName\":\"primarySite$suffix\",\"upsTreeKey\":\"primary-site-$suffix\"}"])

      verifyEq(testRt.db.readById((Ref)created["id"])["upsTreeKey"], "primary-site-$suffix")
      verifyEq(canonicalSnapshot(db2), before)
    } finally {
      rt2.typeof.method("stop").call(rt2)
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
    verify(tree.colNames.containsAll(
      ["dis", "equipId", "floorId", "id", "kind", "make", "metric", "model",
       "navName", "ratedKva", "serial", "siteId", "status", "type", "tz", "unit"]))
  }

  private Str:Ref createTree() {
    suffix := Ref.gen.id
    site := UpsPodTree.create(testRt.db, "site",
      "{\"dis\":\"Site $suffix\",\"navName\":\"site$suffix\",\"tz\":\"Asia/Shanghai\",\"upsTreeKey\":\"tree-site-$suffix\"}")
    siteId := (Ref)site["id"]
    floor := UpsPodTree.create(testRt.db, "floor",
      "{\"dis\":\"Floor $suffix\",\"navName\":\"floor$suffix\",\"siteRef\":\"${siteId.id}\",\"upsTreeKey\":\"tree-floor-$suffix\"}")
    floorId := (Ref)floor["id"]
    equip := UpsPodTree.create(testRt.db, "equip",
      "{\"dis\":\"UPS $suffix\",\"navName\":\"ups$suffix\",\"siteRef\":\"${siteId.id}\",\"floorRef\":\"${floorId.id}\",\"make\":\"Acme\",\"model\":\"X\",\"serial\":\"1\",\"ratedKva\":40,\"upsTreeKey\":\"tree-equip-$suffix\"}")
    equipId := (Ref)equip["id"]
    point := UpsPodTree.create(testRt.db, "point",
      "{\"dis\":\"SOC $suffix\",\"navName\":\"soc$suffix\",\"siteRef\":\"${siteId.id}\",\"floorRef\":\"${floorId.id}\",\"equipRef\":\"${equipId.id}\",\"kind\":\"Number\",\"unit\":\"%\",\"upsSocPct\":true,\"upsTreeKey\":\"tree-point-$suffix\"}")
    return ["site":siteId, "floor":floorId, "equip":equipId, "point":(Ref)point["id"]]
  }

  private HisItem[] readHistory(Ref id) {
    items := HisItem[,]
    testRt.db.his.read(id, null, null) |item| { items.add(item) }
    return items
  }

  private Str canonicalSnapshot(Folio db) {
    recs := db.readAllList(Filter.has("id"), null).dup.sort |a, b| { a.id.id <=> b.id.id }
    buf := StrBuf()
    recs.each |rec| {
      buf.add(ZincWriter.gridToStr(Etc.makeDictsGrid(null, [rec])))
      if (rec.has("his")) {
        db.his.read(rec.id, null, null) |item| {
          buf.add("his ").add(rec.id.id).add(" ").add(item.ts.toStr)
            .add(" ").add(item.val.toStr).addChar('\n')
        }
      }
    }
    return buf.toStr
  }

  private Dict[] runOverlap(ActorPool pool, Func receive, Obj?[][] requests) {
    ready := AtomicInt()
    start := AtomicBool()
    futures := Future[,]
    requests.each |request| {
      msg := Obj?[ready, start]
      msg.addAll(request)
      futures.add(Actor(pool, receive).send(msg.toImmutable))
    }
    while (ready.val < requests.size) Actor.sleep(1ms)
    start.val = true
    results := Dict[,]
    futures.each |future| { results.add((Dict)future.get(10sec)) }
    return results
  }

  private Int siblingNameMatches(Ref siteId, Str dis, Str navName) {
    testRt.db.readAllList(Filter.has("floor"), null).findAll |rec| {
      rec["siteRef"] == siteId && (rec["dis"] == dis || rec["navName"] == navName)
    }.size
  }

  private Obj? callWrapper(HxContext cx, Str name, Obj?[] args := Obj?[,]) {
    locals := Actor.locals
    old := locals[Etc.cxActorLocalsKey]
    locals[Etc.cxActorLocalsKey] = cx
    try {
      return Pod.find("upsPod").type("UpsPodLib").method(name).callList(args)
    } finally {
      if (old == null) locals.remove(Etc.cxActorLocalsKey)
      else locals[Etc.cxActorLocalsKey] = old
    }
  }
}

** Test-only reflective boundary for exercising the internal production type.
internal class UpsPodTree {
  private static Type target() { Pod.find("upsPod").type("UpsPodTree") }

  static Grid read(Folio db) {
    return (Grid)target.method("read").call(db)
  }

  static Dict create(Folio db, Str type, Str payloadJson) {
    return (Dict)target.method("create").call(db, type, payloadJson)
  }

  static Dict update(Folio db, Obj id, Str payloadJson) {
    return (Dict)target.method("update").call(db, id, payloadJson)
  }
}
