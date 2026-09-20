using concurrent
using folio
using haystack
using util

** Folio-backed UPS tree metadata boundary.
const class UpsPodTree {
  private static const ConcurrentMap mutationLocks := ConcurrentMap(16)
  private static const Duration mutationLockTimeout := 250ms

  static Grid read(Folio db) {
    rows := Dict[,]
    filter := Filter.has("site").or(Filter.has("floor")).or(Filter.has("equip")).or(Filter.has("point"))
    db.readAllList(filter, null).each |rec| {
      type := recType(rec)
      if (type != null && isReadable(db, rec, type)) rows.add(result("ok", rec, type))
    }
    return Etc.makeDictsGrid(null, rows)
  }

  static Dict create(Folio db, Str type, Str payloadJson) {
    allowed := createAllowed(type)
    payload := normalize(parsePayload(payloadJson), allowed)
    validateCreate(type, payload)
    gate := acquireMutationLock(db)
    try {
      keyed := findByTreeKey(db, (Str)payload["upsTreeKey"])
      if (keyed != null) {
        if (recType(keyed) == type && isReadable(db, keyed, type) &&
            sameParent(type, keyed, payload))
          return result("existing", keyed, type)
        return conflict(type, payload, keyed)
      }
      validateChain(db, type, payload)
      duplicate := findDuplicateName(db, type, payload)
      if (duplicate != null) return conflict(type, payload, duplicate)
      rec := db.commit(Diff.makeAdd(injectStructure(type, payload))).newRec
      return result("created", rec, type)
    } finally {
      gate.val = false
    }
  }

  static Dict update(Folio db, Obj id, Str payloadJson) {
    ref := id as Ref
    if (ref == null && id is Str) ref = Ref((Str)id)
    if (ref == null) throw ArgErr("Record id must be a Ref or string")
    gate := acquireMutationLock(db)
    try {
      old := db.readById(ref)
      type := recType(old)
      if (type == null || !isReadable(db, old, type))
        throw ArgErr("Record is outside the coherent UPS tree: $ref")
      changes := normalize(parsePayload(payloadJson), updateAllowed(type))
      if (changes.isEmpty) throw ArgErr("Update payload must not be empty")
      effective := Str:Obj?[:]
      changes.each |val, name| {
        if (old[name] != val) effective[name] = val
      }
      if (effective.isEmpty) return result("unchanged", old, type)
      duplicate := findDuplicateUpdate(db, type, old, effective)
      if (duplicate != null) return conflict(type, mergedForConflict(old, changes), duplicate)
      rec := db.commit(Diff(old, effective)).newRec
      return result("updated", rec, type)
    } finally {
      gate.val = false
    }
  }

  private static AtomicBool acquireMutationLock(Folio db) {
    key := db.dir.normalize.uri.toStr
    gate := (AtomicBool)mutationLocks.getOrAdd(key, AtomicBool())
    deadline := Duration.now + mutationLockTimeout
    while (!gate.compareAndSet(false, true)) {
      if (Duration.now >= deadline) throw UpsPodTreeBusyErr()
      Actor.sleep(1ms)
    }
    return gate
  }

  private static Str:Obj? parsePayload(Str json) {
    parsed := JsonInStream(json.in).readJson
    if (parsed isnot Map) throw ArgErr("Payload must be a JSON object")
    map := Str:Obj?[:]
    ((Map)parsed).each |val, key| {
      if (key isnot Str) throw ArgErr("Payload keys must be strings")
      map[(Str)key] = val
    }
    return map
  }

  private static Marker toMarker(Str name, Obj? val) {
    if (val != true) throw ArgErr("$name must be true")
    return Marker.val
  }

  private static Str[] createAllowed(Str type) {
    switch (type) {
      case "site":  return ["dis", "navName", "tz", "upsTreeKey"]
      case "floor": return ["dis", "navName", "siteRef", "upsTreeKey"]
      case "equip": return ["dis", "navName", "siteRef", "floorRef",
                            "make", "model", "serial", "ratedKva", "upsTreeKey"]
      case "point": return ["dis", "navName", "siteRef", "floorRef", "equipRef",
                            "kind", "unit", "upsSocPct", "upsLoadPct", "upsBatteryTemp",
                            "upsCommStatus", "upsTreeKey"]
      default: throw ArgErr("Unsupported UPS tree type: $type")
    }
  }

  private static Str[] updateAllowed(Str type) {
    switch (type) {
      case "site":  return ["dis", "navName", "tz"]
      case "floor": return ["dis", "navName"]
      case "equip": return ["dis", "navName", "make", "model", "serial", "ratedKva"]
      case "point": return ["dis", "navName", "kind", "unit"]
      default: throw ArgErr("Unsupported UPS tree type: $type")
    }
  }

  private static Str:Obj? normalize(Str:Obj? payload, Str[] allowed) {
    out := Str:Obj?[:]
    payload.each |val, name| {
      if (!allowed.contains(name)) throw ArgErr("Field is not allowed: $name")
      if (val == null) throw ArgErr("Field may not be null: $name")
      if (markerNames.contains(name)) out[name] = toMarker(name, val)
      else if (refNames.contains(name)) {
        if (val isnot Str) throw ArgErr("$name must be a record id")
        out[name] = Ref((Str)val)
      }
      else if (name == "ratedKva") {
        if (val isnot Num) throw ArgErr("ratedKva must be numeric")
        out[name] = Number.makeNum((Num)val)
      }
      else {
        if (val isnot Str) throw ArgErr("$name must be a string")
        out[name] = val
      }
    }
    return out
  }

  private static Str[] markerNames() {
    ["upsSocPct", "upsLoadPct", "upsBatteryTemp", "upsCommStatus"]
  }

  private static Str[] refNames() { ["siteRef", "floorRef", "equipRef"] }

  private static Void validateCreate(Str type, Str:Obj? payload) {
    required := Str["dis", "navName", "upsTreeKey"]
    switch (type) {
      case "floor":
        required.add("siteRef")
      case "equip":
        required.addAll(["siteRef", "floorRef"])
      case "point":
        required.addAll(["siteRef", "floorRef", "equipRef", "kind", "unit"])
        count := 0
        pointMetrics.each |name| { if (payload.containsKey(name)) count++ }
        if (count != 1) throw ArgErr("Point requires exactly one UPS metric marker")
    }
    required.each |name| {
      if (!payload.containsKey(name)) throw ArgErr("Missing required field: $name")
    }
  }

  private static Str[] pointMetrics() {
    ["upsSocPct", "upsLoadPct", "upsBatteryTemp", "upsCommStatus"]
  }

  private static Str:Obj? injectStructure(Str type, Str:Obj? payload) {
    changes := Str:Obj?[:]
    payload.each |val, name| { changes[name] = val }
    changes[type] = Marker.val
    if (type == "site") changes["upsSite"] = Marker.val
    if (type == "equip") changes["upsUnit"] = Marker.val
    return changes
  }

  private static Dict? findByTreeKey(Folio db, Str key) {
    db.readAllList(Filter.has("upsTreeKey"), null).find |rec| {
      rec["upsTreeKey"] == key
    }
  }

  private static Dict? findDuplicateName(Folio db, Str type, Str:Obj? payload) {
    return db.readAllList(Filter.has(type), null).find |rec| {
      recType(rec) == type && sameParent(type, rec, payload) &&
        (rec["dis"] == payload["dis"] || rec["navName"] == payload["navName"])
    }
  }

  private static Dict? findDuplicateUpdate(Folio db, Str type, Dict old, Str:Obj? changes) {
    dis := changes.containsKey("dis") ? changes["dis"] : old["dis"]
    navName := changes.containsKey("navName") ? changes["navName"] : old["navName"]
    return db.readAllList(Filter.has(type), null).find |rec| {
      rec.id != old.id && sameParentRec(type, rec, old) &&
        (rec["dis"] == dis || rec["navName"] == navName)
    }
  }

  private static Bool sameParentRec(Str type, Dict a, Dict b) {
    switch (type) {
      case "site": return true
      case "floor": return a["siteRef"] == b["siteRef"]
      case "equip": return a["floorRef"] == b["floorRef"]
      case "point": return a["equipRef"] == b["equipRef"]
      default: return false
    }
  }

  private static Str:Obj? mergedForConflict(Dict old, Str:Obj? changes) {
    map := Str:Obj?[:]
    old.each |val, name| { map[name] = val }
    changes.each |val, name| { map[name] = val }
    return map
  }

  private static Bool sameParent(Str type, Dict rec, Str:Obj? payload) {
    switch (type) {
      case "site": return true
      case "floor": return rec["siteRef"] == payload["siteRef"]
      case "equip": return rec["siteRef"] == payload["siteRef"] &&
                           rec["floorRef"] == payload["floorRef"]
      case "point": return rec["siteRef"] == payload["siteRef"] &&
                           rec["floorRef"] == payload["floorRef"] &&
                           rec["equipRef"] == payload["equipRef"]
      default: return false
    }
  }

  private static Void validateChain(Folio db, Str type, Str:Obj? payload) {
    if (type == "site") return
    site := db.readById((Ref)payload["siteRef"])
    if (!isUpsSite(site)) throw ArgErr("siteRef must reference an UPS site")
    if (type == "floor") return
    floor := db.readById((Ref)payload["floorRef"])
    if (!floor.has("floor")) throw ArgErr("floorRef must reference a floor")
    if (floor["siteRef"] != payload["siteRef"])
      throw ArgErr("floorRef does not belong to siteRef")
    if (type == "equip") return
    equip := db.readById((Ref)payload["equipRef"])
    if (!equip.has("equip") || !equip.has("upsUnit"))
      throw ArgErr("equipRef must reference an UPS unit")
    if (equip["siteRef"] != payload["siteRef"] || equip["floorRef"] != payload["floorRef"])
      throw ArgErr("Point parent references are not a coherent chain")
  }

  private static Bool isReadable(Folio db, Dict rec, Str type) {
    if (type == "site") return isUpsSite(rec)
    siteRef := rec["siteRef"] as Ref
    if (siteRef == null) return false
    site := db.readById(siteRef, false)
    if (site == null || !isUpsSite(site)) return false
    if (type == "floor") return true
    floorRef := rec["floorRef"] as Ref
    if (floorRef == null) return false
    floor := db.readById(floorRef, false)
    if (floor == null || !floor.has("floor") || floor["siteRef"] != siteRef) return false
    if (type == "equip") return rec.has("equip") && rec.has("upsUnit")
    equipRef := rec["equipRef"] as Ref
    if (equipRef == null || metricCount(rec) != 1) return false
    equip := db.readById(equipRef, false)
    return equip != null && equip.has("equip") && equip.has("upsUnit") &&
      equip["siteRef"] == siteRef && equip["floorRef"] == floorRef
  }

  private static Bool isUpsSite(Dict rec) {
    rec.has("site") && rec.has("upsSite")
  }

  private static Int metricCount(Dict rec) {
    count := 0
    pointMetrics.each |name| { if (rec.has(name)) count++ }
    return count
  }

  private static Str? recType(Dict rec) {
    if (rec.has("point")) return "point"
    if (rec.has("equip")) return "equip"
    if (rec.has("floor")) return "floor"
    if (rec.has("site")) return "site"
    return null
  }

  private static Dict result(Str status, Dict rec, Str type) {
    map := Str:Obj?[
      "status": status,
      "id": rec.id,
      "type": type,
      "dis": rec.dis,
    ]
    [["siteRef", "siteId"], ["floorRef", "floorId"], ["equipRef", "equipId"]].each |names| {
      ref := rec.get(names[0], null) as Ref
      if (ref != null) map[names[1]] = ref
    }
    updateAllowed(type).each |name| {
      val := rec.get(name, null)
      if (val != null) map[name] = val
    }
    if (type == "point") {
      metric := pointMetrics.find |name| { rec.has(name) }
      if (metric != null) map["metric"] = metric
    }
    return Etc.makeDict(map)
  }

  private static Dict conflict(Str type, Str:Obj? payload, Dict existing) {
    map := Str:Obj?[
      "status": "conflict",
      "type": type,
      "dis": payload["dis"],
      "conflictId": existing.id,
    ]
    [["siteRef", "siteId"], ["floorRef", "floorId"], ["equipRef", "equipId"]].each |names| {
      ref := payload[names[0]] as Ref
      if (ref != null) map[names[1]] = ref
    }
    return Etc.makeDict(map)
  }
}

const class UpsPodTreeBusyErr : Err {
  new make() : super("UPS tree metadata mutation busy") {}
}
