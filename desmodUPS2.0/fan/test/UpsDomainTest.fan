using axon
using haystack

class UpsDomainTest : Test
{
  Void testHierarchyRequiresFloor()
  {
    verifyErrMsg(ArgErr#, "UPS-1002 FLOOR_REF_REQUIRED") |->| {
      invalid := UpsEquipment("equip-1", "UPS 1", "site-1", "")
    }

    equip := UpsEquipment("equip-1", "UPS 1", "site-1", "floor-1")
    verifyEq(equip.floorRef, "floor-1")
  }

  Void testDeviceWritesAreAlwaysRejected()
  {
    verifyErrMsg(UpsErr#, "UPS-2003 POINT_WRITE_FORBIDDEN") |->| {
      ReadOnlyGuard.checkPointWrite("point-1")
    }
  }

  Void testAlarmLifecycleAndOptimisticVersion()
  {
    alarm := Alarm("alarm-1", "equip-1")
    verifyEq(alarm.subjectRef, "equip-1")
    verifyEq(alarm.state, AlarmState.open)
    alarm.acknowledge("operator", "checked", 0)
    verifyEq(alarm.state, AlarmState.acknowledged)
    verifyEq(alarm.version, 1)

    verifyErrMsg(UpsErr#, "UPS-3002 ALARM_VERSION_CONFLICT") |->| {
      alarm.startDisposition("operator", "investigating", 0)
    }

    alarm.startDisposition("operator", "investigating", 1)
    alarm.markResolved(2)
    alarm.close("operator", "utility stable", 3)
    verifyEq(alarm.state, AlarmState.closed)
    verifyEq(alarm.version, 4)
  }

  Void testCanonicalAlarmRowsFilterBySubjectRef()
  {
    equip1 := Ref("equip-1")
    rows := [
      dict(["id":Ref("alarm-1"), "dis":"A1", "upsAlarmRecord":Marker.val,
        "subjectRef":equip1, "upsRiskLevel":"warning", "upsAlarmState":"open",
        "upsAlarmVersion":0, "raisedAt":DateTime.nowUtc, "upsRuleVersion":"v1"]),
      dict(["id":Ref("alarm-2"), "dis":"A2", "upsAlarmRecord":Marker.val,
        "subjectRef":Ref("equip-2"), "upsRiskLevel":"critical", "upsAlarmState":"acknowledged",
        "upsAlarmVersion":2, "raisedAt":DateTime.nowUtc, "upsRuleVersion":"v1"]),
      dict(["id":Ref("alarm-3"), "dis":"A3", "upsAlarmRecord":Marker.val,
        "subjectRef":equip1, "upsRiskLevel":"info", "upsAlarmState":"closed",
        "upsAlarmVersion":4, "raisedAt":DateTime.nowUtc, "upsRuleVersion":"v1"]),
    ]

    actual := UpsApplicationService.activeAlarmRows(rows, dict(["equipRef":equip1]))
    verifyEq(actual.size, 1)
    verifyEq(actual.first["id"], Ref("alarm-1"))
    verifyEq(actual.first["subjectRef"], equip1)
    verifyEq(actual.first["upsAlarmVersion"], 0)
    verifyEq(actual.first["equipRef"], null)

    verifyErrMsg(UpsErr#, "UPS-1006 EQUIP_REF_INVALID") |->| {
      UpsApplicationService.activeAlarmRows(rows, dict(["equipRef":"equip-1"]))
    }
  }

  Void testApplicationServiceTransitionContract()
  {
    old := dict(["id":Ref("alarm-1"), "dis":"Battery alarm",
      "upsAlarmRecord":Marker.val, "upsAlarmState":"open", "upsAlarmVersion":3])
    updated := UpsApplicationService.transitionRecord(old, 3, ["open"], "acknowledged", [
      "acknowledgedBy":"operator", "acknowledgedAt":DateTime.nowUtc,
    ])
    verifyEq(updated["dis"], "Battery alarm")
    verifyEq(updated["acknowledgedBy"], "operator")
    verifyEq(updated["upsAlarmState"], "acknowledged")
    verifyEq(updated["upsAlarmVersion"], 4)

    verifyErrMsg(UpsErr#, "UPS-3005 ALARM_NOT_FOUND") |->| {
      UpsApplicationService.transitionRecord(
        dict(["id":Ref("not-alarm"), "upsAlarmState":"open", "upsAlarmVersion":0]),
        0, ["open"], "acknowledged", Str:Obj[:])
    }
    verifyErrMsg(UpsErr#, "UPS-3002 ALARM_VERSION_CONFLICT") |->| {
      UpsApplicationService.transitionRecord(old, 2, ["open"], "acknowledged", Str:Obj[:])
    }
    verifyErrMsg(UpsErr#, "UPS-3001 ALARM_STATE_INVALID") |->| {
      UpsApplicationService.transitionRecord(old, 3, ["resolved"], "closed", Str:Obj[:])
    }
  }

  Void testContextUserResolutionDoesNotForgeIdentity()
  {
    verifyEq(UpsApplicationService.resolveContextUser(|->Obj?| { "operator" }), "operator")
    verifyErrMsg(UpsErr#, "UPS-3007 ALARM_ACTOR_REQUIRED") |->| {
      UpsApplicationService.resolveContextUser(|->Obj?| { null })
    }
    verifyErrMsg(Err#, "identity lookup failed") |->| {
      UpsApplicationService.resolveContextUser(|->Obj?| { throw Err("identity lookup failed") })
    }
  }

  Void testLatestAssessmentUsesSubjectAndCalculationTime()
  {
    equip := Ref("equip-1")
    old := dict(["id":Ref("assessment-1"), "upsHealthAssessment":Marker.val,
      "subjectRef":equip, "calculatedAt":DateTime.nowUtc - 1day,
      "upsDataSource":"measured"])
    latest := dict(["id":Ref("assessment-2"), "upsHealthAssessment":Marker.val,
      "subjectRef":equip, "calculatedAt":DateTime.nowUtc,
      "upsDataSource":"derived"])
    simulated := dict(["id":Ref("assessment-simulated"), "upsHealthAssessment":Marker.val,
      "subjectRef":equip, "calculatedAt":DateTime.nowUtc + 1hr,
      "upsDataSource":"simulated"])
    legacy := dict(["id":Ref("assessment-legacy"), "upsHealthAssessment":Marker.val,
      "upsAssetRef":equip, "upsAssessedAt":DateTime.nowUtc + 1day])

    verifyEq(UpsApplicationService.latestAssessmentRow([old, legacy, latest, simulated], equip)["id"], Ref("assessment-2"))
  }

  Void testDemoAssessmentRequiresExplicitSimulatedSubject()
  {
    reader := UpsApplicationService#.method("demoAssessmentRow", false)
    verify(reader != null, "An explicit guarded demo assessment reader is required")
    if (reader == null) return
    subject := dict(["id":Ref("demo-equip"), "upsDemo":Marker.val,
      "upsDataSource":"simulated"])
    older := dict(["id":Ref("demo-old"), "upsHealthAssessment":Marker.val,
      "upsDemo":Marker.val, "upsDataSource":"simulated", "subjectRef":Ref("demo-equip"),
      "calculatedAt":DateTime.nowUtc - 1hr, "upsHealthScore":80])
    latest := dict(["id":Ref("demo-new"), "upsHealthAssessment":Marker.val,
      "upsDemo":Marker.val, "upsDataSource":"simulated", "subjectRef":Ref("demo-equip"),
      "calculatedAt":DateTime.nowUtc, "upsHealthScore":92])
    other := dict(["id":Ref("other"), "upsHealthAssessment":Marker.val,
      "upsDemo":Marker.val, "upsDataSource":"simulated", "subjectRef":Ref("other-equip"),
      "calculatedAt":DateTime.nowUtc + 1hr, "upsHealthScore":99])
    actual := reader.call([older, latest, other], subject) as Dict
    verifyEq(actual["id"], Ref("demo-new"))
    verifyEq(actual["upsDataSource"], "simulated")
    verifyEq(reader.call([latest], dict(["id":Ref("demo-equip"), "upsDataSource":"measured"])), null)
    verifyEq(reader.call([latest], dict(["id":Ref("demo-equip"), "upsDemo":Marker.val])), null)
    verifyEq(UpsApplicationService.latestAssessmentRow([latest], Ref("demo-equip")), null)
  }

  Void testRiskRelationsAreFilteredReadOnlyRows()
  {
    assessment := Ref("assessment-1")
    risk := Ref("risk-1")
    risks := UpsApplicationService.assessmentRiskItemRows([
      dict(["id":risk, "dis":"Battery risk", "upsRiskItem":Marker.val,
        "assessmentRef":assessment, "upsRiskLevel":"warning", "evidenceRefs":[Ref("point-1")]]),
      dict(["id":Ref("risk-2"), "dis":"Other", "upsRiskItem":Marker.val,
        "assessmentRef":Ref("assessment-2"), "upsRiskLevel":"info"]),
    ], assessment)
    verifyEq(risks.size, 1)
    verifyEq(risks.first["id"], risk)
    verifyEq(risks.first["assessmentRef"], null)

    recommendations := UpsApplicationService.riskRecommendationRows([
      dict(["id":Ref("recommendation-1"), "dis":"Inspect battery", "upsRecommendation":Marker.val,
        "riskItemRef":risk, "priority":"high"]),
      dict(["id":Ref("recommendation-2"), "dis":"Other", "upsRecommendation":Marker.val,
        "riskItemRef":Ref("risk-2"), "priority":"low"]),
    ], risk)
    verifyEq(recommendations.size, 1)
    verifyEq(recommendations.first["id"], Ref("recommendation-1"))
    verifyEq(recommendations.first["riskItemRef"], null)
  }

  Void testPointRowsRequireObservationMetadataWithoutUsingMod()
  {
    equip := Ref("equip-1")
    observedAt := DateTime.nowUtc - 1min
    point := dict(["id":Ref("point-1"), "dis":"Voltage", "equipRef":equip,
      "siteRef":Ref("site-1"), "floorRef":Ref("floor-1"), "curVal":220f,
      "curStatus":"ok", "upsObservedAt":observedAt, "upsDataQuality":"valid",
      "upsStaleAfterSec":300, "mod":DateTime.nowUtc])
    actual := UpsApplicationService.pointRows([point], equip)
    verifyEq(actual.first["upsObservedAt"], observedAt)
    verifyEq(actual.first["upsDataQuality"], "valid")
    verifyEq(actual.first["upsStaleAfterSec"], 300)

    incomplete := UpsApplicationService.pointRows([
      dict(["id":Ref("point-2"), "dis":"Legacy", "equipRef":equip,
        "siteRef":Ref("site-1"), "floorRef":Ref("floor-1"), "curVal":220f,
        "curStatus":"ok", "upsDataQuality":"valid", "mod":DateTime.nowUtc]),
    ], equip)
    verifyEq(incomplete.size, 1)
    verifyEq(incomplete.first["upsDataQuality"], "missing")
    verifyEq(incomplete.first["upsObservedAt"], null)
    verifyEq(incomplete.first["upsStaleAfterSec"], null)

    verifyErrMsg(UpsErr#, "UPS-1005 REQUIRED_FIELD_MISSING: curStatus") |->| {
      UpsApplicationService.pointRows([
        dict(["id":Ref("point-3"), "dis":"Incomplete", "equipRef":equip,
          "siteRef":Ref("site-1"), "floorRef":Ref("floor-1"), "curVal":220f,
          "upsObservedAt":observedAt, "upsDataQuality":"valid", "upsStaleAfterSec":300]),
      ], equip)
    }
  }

  Void testEquipSummarySelectsBatteryGroupDeterministically()
  {
    equip := dict(["id":Ref("equip-1"), "dis":"UPS 1"])
    none := UpsApplicationService.mergeBatteryGroup(equip, Dict[,])
    verifyEq(none["upsBatteryGroupRef"], null)

    sole := UpsApplicationService.mergeBatteryGroup(equip, [batteryGroup("group-1", 40, false)])
    verifyEq(sole["upsBatteryGroupRef"], Ref("group-1"))
    verifyEq(sole["upsCellCount"], 40)
    verifyEq(sole["upsBatteryType"], "VRLA")

    primary := UpsApplicationService.mergeBatteryGroup(equip, [
      batteryGroup("group-1", 40, false), batteryGroup("group-2", 44, true),
    ])
    verifyEq(primary["upsBatteryGroupRef"], Ref("group-2"))
    verifyEq(primary["upsCellCount"], 44)

    ambiguous := UpsApplicationService.mergeBatteryGroup(equip, [
      batteryGroup("group-1", 40, false), batteryGroup("group-2", 44, false),
    ])
    verifyEq(ambiguous["upsBatteryGroupRef"], null)
    verifyEq(ambiguous["upsCellCount"], null)
    verifyEq(ambiguous["upsSummaryWarning"], "MULTIPLE_BATTERY_GROUPS")
  }

  Void testQualityUsesAgeAndSource()
  {
    now := DateTime(2026, Month.sep, 20, 12, 0, 0, 0, TimeZone.utc)
    recent := Observation("point-1", 220f, now - 1min, DataSource.measured)
    old := Observation("point-1", 220f, now - 20min, DataSource.measured)
    simulated := Observation("point-1", 220f, now, DataSource.simulated)

    verifyEq(DataQualityPolicy.classify(recent, now, 5min), DataQuality.valid)
    verifyEq(DataQualityPolicy.classify(old, now, 5min), DataQuality.stale)
    verifyEq(DataQualityPolicy.classify(simulated, now, 5min), DataQuality.invalid)
  }

  Void testMappingValidationRequiresFloorAndReadOnly()
  {
    ok := ExternalMapping("point-1", "connector-1", "device/voltage", "floor-1", false)
    verifyEq(MappingValidator.validate(ok).isEmpty, true)

    invalid := ExternalMapping("point-1", "connector-1", "device/voltage", "", true)
    errors := MappingValidator.validate(invalid)
    verify(errors.contains("UPS-1002 FLOOR_REF_REQUIRED"))
    verify(errors.contains("UPS-2003 POINT_WRITE_FORBIDDEN"))
  }

  Void testApiContractIsCompleteAndDeviceReadOnly()
  {
    routes := ApiCatalog.routes
    verifyEq(routes.size, 19)
    verify(routes.all |r| { r.path.startsWith("/api/ups/v1") })
    verify(routes.all |r| { !["PUT", "PATCH", "DELETE"].contains(r.method) })
    verify(routes.find |ApiRoute r->Bool| { r.method == "POST" && r.path.contains("/points") } == null)
    verifyEq(routes.find |r| { r.path == "/api/ups/v1/health" }.method, "GET")
    verifyEq(routes.find |r| { r.path == "/api/ups/v1/assessments/{assessmentId}/risk-items" }.method, "GET")
    verifyEq(routes.find |r| { r.path == "/api/ups/v1/risk-items/{riskItemId}/recommendations" }.method, "GET")
  }

  Void testAxonInterfaceListMatchesDetailedDesign()
  {
    expected := [
      "upsSites", "upsFloors", "upsEquips", "upsEquipSummary", "upsEquipPoints",
      "upsPointHistory", "upsActiveAlarms", "upsAlarmAck",
      "upsAlarmDisposition", "upsAlarmClose", "upsLatestAssessment", "upsDemoAssessment",
      "upsAssessmentRiskItems", "upsRiskRecommendations",
      "upsMappings", "upsValidateMapping",
    ]
    actual := UpsNewLib#.methods
      .findAll |m| { m.hasFacet(Axon#) }
      .map |m->Str| { m.name }
      .sort
    verifyEq(actual, expected.sort)
  }

  Void testPodAndMenuUseUpsNewName()
  {
    pod := UpsNewExt#.pod
    verifyEq(pod.name, "upsNew")
    html := pod.file(`/ui/index.html`).readAllStr
    menu := pod.file(`/trio/upsNew-menu.trio`).readAllStr
    verify(html.contains("upsNew · UPS Fleet Monitor"))
    verify(html.contains("id=\"fleet-tabs\""))
    verify(html.contains("id=\"hero\""))
    verify(html.contains("id=\"device-panels\""))
    verify(html.contains("id=\"alarm-list\""))
    verify(html.contains("id=\"history-dialog\""))
    verify(menu.contains("displayName: \"upsNew\""))
    verify(menu.contains("/pod/upsNew/ui/index-"))
  }

  Void testCanonicalSemanticContractsArePackaged()
  {
    pod := UpsNewExt#.pod
    tags := pod.file(`/lib/ups/tags.xeto`).readAllStr
    points := pod.file(`/lib/ups/points.xeto`).readAllStr
    assessment := pod.file(`/lib/ups/assessment.xeto`).readAllStr
    defs := TrioReader(pod.file(`/trio/ups-defs.trio`).in).readAllDicts

    markerNames := [
      "upsBatteryTemp", "upsChargeCurrent", "upsLoadPower", "upsVoltage",
      "upsFrequency", "upsThd", "upsAmbientTemp", "upsHumidity",
      "upsTransferStatus", "upsTransferDuration",
    ]
    markerNames.each |name|
    {
      verify(points.contains("$name: Marker"), "$name marker is missing from points.xeto")
      verifyEq(trioDef(defs, name)["is"], Symbol.fromStr("marker"))
    }

    verify(tags.contains(
      "upsObservedAt: DateTime <doc:\"观测产生时间；不得以记录修改时间代替\">\n" +
      "upsAlarmVersion:  Int      <doc:\"告警记录乐观并发版本；初始值为 0\">\n" +
      "upsHealthScore:   Number   <minVal:0, maxVal:100, doc:\"健康评估分数，范围 0–100\">"))
    verify(tags.contains(
      "UpsConfidence: Enum {\n" +
      "  high        <doc:\"高可信度\">\n" +
      "  medium      <doc:\"中可信度\">\n" +
      "  low         <doc:\"低可信度\">\n" +
      "  unavailable <doc:\"不可评估\">\n" +
      "}\n" +
      "upsConfidence: UpsConfidence?"))

    ["upsObservedAt", "upsLastTransferAt"].each |name|
    {
      verifyEq(trioDef(defs, name)["is"], Symbol.fromStr("dateTime"))
    }
    verifyEq(trioDef(defs, "upsAlarmVersion")["is"], Symbol.fromStr("number"))
    healthDef := trioDef(defs, "upsHealthScore")
    verifyEq(healthDef["is"], Symbol.fromStr("number"))
    verifyEq(healthDef["minVal"].toStr, "0")
    verifyEq(healthDef["maxVal"].toStr, "100")
    verifyEq(trioDef(defs, "dueDate")["is"], Symbol.fromStr("date"))
    confidenceDef := trioDef(defs, "upsConfidence")
    verifyEq(confidenceDef["is"], Symbol.fromStr("str"))
    confidenceEnum := ((Str)confidenceDef["enum"]).splitLines.map |Str line->Str| { line.trim }
    verifyEq(confidenceEnum, [
      "- high: 高", "- medium: 中", "- low: 低", "- unavailable: 不可评估",
    ])

    verify(points.contains("upsBatteryTemp, unit:\"°C\""))
    verify(points.contains("upsChargeCurrent, unit:\"A\""))
    verify(points.contains("upsLoadPower, unit:\"kW\""))
    verify(points.contains("upsInverter, upsVoltage, unit:\"V\""))
    verify(points.contains("upsInverter, upsFrequency, unit:\"Hz\""))
    verify(points.contains("upsInverter, upsThd, unit:\"%\""))
    verify(points.contains("upsAmbientTemp, unit:\"°C\""))
    verify(points.contains("upsHumidity, unit:\"%RH\""))
    verify(points.contains("upsTransfer, upsTransferStatus"))
    verify(points.contains("upsTransfer, upsTransferDuration, unit:\"ms\""))
    verify(points.contains("upsLastTransferAt: DateTime?"))

    verify(assessment.contains("upsAlarmVersion: Int"))
    verify(assessment.contains(
      "  upsHealthScore: Number <minVal:0, maxVal:100>\n" +
      "  coverage: Number <unit:\"%\">\n" +
      "  upsConfidence: UpsConfidence\n" +
      "  calculatedAt: DateTime"))
    verify(assessment.contains("dueDate: Date?"))
  }

  private Dict trioDef(Dict[] defs, Str name)
  {
    symbol := Symbol.fromStr(name)
    matches := defs.findAll |def| { def["def"] == symbol }
    verifyEq(matches.size, 1, "Expected exactly one def:^$name record")
    return matches.first
  }

  private Dict batteryGroup(Str id, Int cellCount, Bool primary)
  {
    values := Str:Obj["id":Ref(id), "upsCellCount":cellCount, "upsBatteryType":"VRLA"]
    if (primary) values["primary"] = Marker.val
    return dict(values)
  }

  private Dict dict(Str:Obj values) { Etc.makeDict(values) }

  Void testUiReadsFinApisWithoutEmbeddedOperationalData()
  {
    pod := UpsNewExt#.pod
    js := pod.file(`/ui/app.js`).readAllStr
    html := pod.file(`/ui/index.html`).readAllStr

    verify(js.contains("upsSites()"))
    verify(js.contains("upsEquips("))
    verify(js.contains("upsEquipPoints("))
    verify(js.contains("upsActiveAlarms("))
    verifyFalse(js.contains("380.4"))
    verifyFalse(js.contains("UPS-A01"))
    verifyFalse(html.contains("UPS-DEMO-A01"))
    verifyFalse(html.contains("华东数据中心"))
  }
}
