using axon
using haystack
using skyarcd

** Shared application service for Axon and REST adapters.
const class UpsApplicationService
{
  static Grid sites() { toGrid(Context.cur.proj.readAllList("site")) }

  static Grid floors(Ref siteRef)
  {
    toGrid(Context.cur.proj.readAllList("floor and space").findAll |d| { d["siteRef"] == siteRef })
  }

  static Grid equips(Ref? siteRef := null, Ref? floorRef := null)
  {
    rows := Context.cur.proj.readAllList("equip and ups").findAll |d|
    {
      (siteRef == null || d["siteRef"] == siteRef) &&
      (floorRef == null || d["floorRef"] == floorRef)
    }
    rows.each |d| { requireFloor(d) }
    return toGrid(rows)
  }

  static Dict equipSummary(Ref equipRef)
  {
    equip := readById(equipRef)
    requireFloor(equip)
    groups := Context.cur.proj.readAllList("upsBatteryGroup")
      .findAll |d| { d["equipRef"] == equipRef }
    return mergeBatteryGroup(equip, groups)
  }

  static Grid equipPoints(Ref equipRef)
  {
    requireFloor(readById(equipRef))
    rows := Context.cur.proj.readAllList("point")
    return toGrid(pointRows(rows, equipRef))
  }

  // Axon date-time range expressions arrive as ObjRange. Let the native
  // historian normalize the supported span forms before it reads records.
  static Obj? pointHistory(Ref pointRef, Obj span, Dict? opts := null)
  {
    requireFloor(readById(pointRef))
    // FIN includes interpolation neighbors by default; the UI contract uses
    // an inclusive start and exclusive end for both statistics and charts.
    history := AxonContext.curAxon.call("hisRead", [pointRef, span, opts])
    return AxonContext.curAxon.call("hisClip", [history])
  }

  static Grid activeAlarms(Dict? filter := null)
  {
    rows := Context.cur.proj.readAllList("upsAlarmRecord")
    return toGrid(activeAlarmRows(rows, filter))
  }

  static Dict alarmAck(Ref alarmRef, Str? comment, Int version)
  {
    transition(alarmRef, version, ["open"], "acknowledged", [
      "upsAckComment":comment ?: "", "acknowledgedAt":DateTime.nowUtc, "acknowledgedBy":contextUser,
    ])
  }

  static Dict alarmDisposition(Ref alarmRef, Str action, Str? comment, Int version)
  {
    if (action.trim.isEmpty) throw UpsErr("UPS-3003 DISPOSITION_REQUIRED")
    return transition(alarmRef, version, ["acknowledged"], "inProgress", [
      "upsDisposition":action, "upsDispositionComment":comment ?: "",
      "upsDispositionAt":DateTime.nowUtc, "upsDispositionBy":contextUser,
    ])
  }

  static Dict alarmClose(Ref alarmRef, Str conclusion, Int version)
  {
    if (conclusion.trim.isEmpty) throw UpsErr("UPS-3004 CONCLUSION_REQUIRED")
    return transition(alarmRef, version, ["resolved"], "closed", [
      "conclusion":conclusion, "closedAt":DateTime.nowUtc, "closedBy":contextUser,
    ])
  }

  static Dict? latestAssessment(Ref equipRef)
  {
    rows := Context.cur.proj.readAllList("upsHealthAssessment")
    return latestAssessmentRow(rows, equipRef)
  }

  ** Explicit display adapter for isolated virtual demonstration equipment.
  ** Production assessment queries continue to exclude all simulated results.
  static Dict? demoAssessment(Ref equipRef)
  {
    subject := readById(equipRef)
    requireFloor(subject)
    if (subject["upsDemo"] == null || subject["upsDataSource"] != "simulated")
      throw UpsErr("UPS-5001 DEMO_SUBJECT_REQUIRED")
    rows := Context.cur.proj.readAllList("upsHealthAssessment")
    return demoAssessmentRow(rows, subject)
  }

  static Grid assessmentRiskItems(Ref assessmentRef)
  {
    rows := Context.cur.proj.readAllList("upsRiskItem")
    return toGrid(assessmentRiskItemRows(rows, assessmentRef))
  }

  static Grid riskRecommendations(Ref riskItemRef)
  {
    rows := Context.cur.proj.readAllList("upsRecommendation")
    return toGrid(riskRecommendationRows(rows, riskItemRef))
  }

  static Grid mappings(Ref? equipRef := null)
  {
    rows := Context.cur.proj.readAllList("upsExternalMapping")
      .findAll |d| { equipRef == null || d["equipRef"] == equipRef }
    return toGrid(rows)
  }

  static Dict validateMapping(Dict mapping)
  {
    errors := Str[,]
    if (mapping["floorRef"] == null) errors.add("UPS-1002 FLOOR_REF_REQUIRED")
    if (mapping["writeEnabled"] == true || mapping["writable"] != null) errors.add("UPS-2003 POINT_WRITE_FORBIDDEN")
    if (mapping["externalPath"] == null) errors.add("UPS-4001 EXTERNAL_PATH_REQUIRED")
    return Etc.makeDict(["valid":errors.isEmpty, "errors":errors])
  }

  private static Grid toGrid(Dict[] rows) { Etc.makeDictsGrid(null, rows) }
  private static Dict readById(Ref id) { Context.cur.proj.readById(id) }

  private static Void requireFloor(Dict rec)
  {
    if (rec["floorRef"] == null) throw UpsErr("UPS-1002 FLOOR_REF_REQUIRED")
    if (rec["spaceRef"] != null) throw UpsErr("UPS-1004 SPACE_REF_FORBIDDEN")
  }

  internal static Dict[] activeAlarmRows(Dict[] rows, Dict? filter := null)
  {
    filterEquip := filter?.get("equipRef")
    if (filterEquip != null && filterEquip isnot Ref)
      throw UpsErr("UPS-1006 EQUIP_REF_INVALID")
    equipRef := filterEquip as Ref
    states := ["open", "acknowledged", "inProgress", "resolved"]
    required := ["id", "dis", "subjectRef", "upsRiskLevel", "upsAlarmState",
      "upsAlarmVersion", "raisedAt", "upsRuleVersion"]
    optional := ["triggerValue", "threshold", "acknowledgedBy", "acknowledgedAt"]
    return rows.findAll |d|
    {
      state := d["upsAlarmState"] as Str
      return d["upsAlarmRecord"] != null &&
      state != null && states.contains(state) &&
      (equipRef == null || d["subjectRef"] == equipRef)
    }.map |d->Dict| { selectFields(d, required, optional) }
  }

  internal static Dict[] pointRows(Dict[] rows, Ref equipRef)
  {
    matches := rows.findAll |d| { d["equipRef"] == equipRef }
    required := ["id", "dis", "equipRef", "siteRef", "floorRef", "curVal", "curStatus"]
    return matches.map |d->Dict|
    {
      requireFloor(d)
      required.each |name|
      {
        if (d[name] == null) throw UpsErr("UPS-1005 REQUIRED_FIELD_MISSING: $name")
      }
      if (d["upsObservedAt"] != null && d["upsDataQuality"] != null &&
          d["upsStaleAfterSec"] != null) return d

      values := copyFields(d)
      values["upsDataQuality"] = "missing"
      return Etc.makeDict(values)
    }
  }

  internal static Dict? latestAssessmentRow(Dict[] rows, Ref subjectRef)
  {
    return rows.findAll |d|
    {
      d["upsHealthAssessment"] != null && d["subjectRef"] == subjectRef &&
      d["upsDataSource"] != "simulated"
    }.sort |a, b|
    {
      ((DateTime?)b["calculatedAt"] ?: DateTime.defVal) <=>
        ((DateTime?)a["calculatedAt"] ?: DateTime.defVal)
    }.first
  }

  internal static Dict? demoAssessmentRow(Dict[] rows, Dict subject)
  {
    if (subject["upsDemo"] == null || subject["upsDataSource"] != "simulated") return null
    return rows.findAll |d|
    {
      d["upsHealthAssessment"] != null && d["upsDemo"] != null &&
      d["upsDataSource"] == "simulated" && d["subjectRef"] == subject["id"]
    }.sort |a, b|
    {
      ((DateTime?)b["calculatedAt"] ?: DateTime.defVal) <=>
        ((DateTime?)a["calculatedAt"] ?: DateTime.defVal)
    }.first
  }

  internal static Dict[] assessmentRiskItemRows(Dict[] rows, Ref assessmentRef)
  {
    required := ["id", "dis", "upsRiskLevel"]
    optional := ["evidenceRefs"]
    return rows.findAll |d|
    {
      d["upsRiskItem"] != null && d["assessmentRef"] == assessmentRef
    }.map |d->Dict| { selectFields(d, required, optional) }
  }

  internal static Dict[] riskRecommendationRows(Dict[] rows, Ref riskItemRef)
  {
    required := ["id", "dis", "priority"]
    optional := ["dueDate"]
    return rows.findAll |d|
    {
      d["upsRecommendation"] != null && d["riskItemRef"] == riskItemRef
    }.map |d->Dict| { selectFields(d, required, optional) }
  }

  internal static Dict mergeBatteryGroup(Dict equip, Dict[] groups)
  {
    primaries := groups.findAll |d| { d["primary"] != null }
    Dict? selected := primaries.size == 1 ? primaries.first :
      (primaries.isEmpty && groups.size == 1 ? groups.first : null)
    if (selected == null)
    {
      if (groups.size <= 1) return equip
      values := copyFields(equip)
      values["upsSummaryWarning"] = "MULTIPLE_BATTERY_GROUPS"
      return Etc.makeDict(values)
    }

    values := copyFields(equip)
    values["upsBatteryGroupRef"] = selected["id"]
    if (selected["upsCellCount"] != null) values["upsCellCount"] = selected["upsCellCount"]
    if (selected["upsBatteryType"] != null) values["upsBatteryType"] = selected["upsBatteryType"]
    return Etc.makeDict(values)
  }

  private static Dict selectFields(Dict source, Str[] required, Str[] optional)
  {
    values := Str:Obj[:]
    required.each |name|
    {
      value := source[name]
      if (value == null) throw UpsErr("UPS-1005 REQUIRED_FIELD_MISSING: $name")
      values[name] = value
    }
    optional.each |name|
    {
      value := source[name]
      if (value != null) values[name] = value
    }
    return Etc.makeDict(values)
  }

  private static Str:Obj copyFields(Dict source)
  {
    values := Str:Obj[:]
    source.each |value, name| { values[name] = value }
    return values
  }

  internal static Str resolveContextUser(|->Obj?| resolver)
  {
    value := resolver()
    if (value == null || value.toStr.trim.isEmpty)
      throw UpsErr("UPS-3007 ALARM_ACTOR_REQUIRED")
    return value.toStr
  }

  private static Str contextUser()
  {
    return resolveContextUser |->Obj?| { AxonContext.curAxon.call("userId", Obj?[,]) }
  }

  internal static Dict transitionRecord(Dict oldRec, Int expectedVersion,
    Str[] allowed, Str target, Str:Obj changes)
  {
    if (oldRec["upsAlarmRecord"] == null) throw UpsErr("UPS-3005 ALARM_NOT_FOUND")
    current := oldRec["upsAlarmState"] as Str ?: "open"
    currentVersion := oldRec["upsAlarmVersion"] as Int
    if (currentVersion == null) throw UpsErr("UPS-3006 ALARM_VERSION_REQUIRED")
    if (currentVersion != expectedVersion) throw UpsErr("UPS-3002 ALARM_VERSION_CONFLICT")
    if (!allowed.contains(current)) throw UpsErr("UPS-3001 ALARM_STATE_INVALID")
    values := copyFields(oldRec)
    changes.each |v, k| { values[k] = v }
    values["upsAlarmState"] = target
    values["upsAlarmVersion"] = currentVersion + 1
    return Etc.makeDict(values)
  }

  private static Dict transition(Ref id, Int expectedVersion, Str[] allowed, Str target, Str:Obj changes)
  {
    oldRec := readAlarmById(id)
    updated := transitionRecord(oldRec, expectedVersion, allowed, target, changes)
    diff := AxonContext.curAxon.call("diff", [oldRec, updated, Etc.makeDict(["update":Marker.val])])
    AxonContext.curAxon.call("commit", [diff])
    return readAlarmById(id)
  }

  private static Dict readAlarmById(Ref id)
  {
    rec := Context.cur.proj.readById(id, false)
    if (rec == null) throw UpsErr("UPS-3005 ALARM_NOT_FOUND")
    return rec
  }
}
