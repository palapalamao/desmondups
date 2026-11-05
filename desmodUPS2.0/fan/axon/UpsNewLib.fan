using axon
using haystack

** Thin FIN Axon adapter. REST and Axon contracts share UpsApplicationService.
const class UpsNewLib
{
  @Axon static Grid upsSites() { UpsApplicationService.sites }
  @Axon static Grid upsFloors(Ref siteRef) { UpsApplicationService.floors(siteRef) }
  @Axon static Grid upsEquips(Ref? siteRef := null, Ref? floorRef := null) { UpsApplicationService.equips(siteRef, floorRef) }
  @Axon static Dict upsEquipSummary(Ref equipRef) { UpsApplicationService.equipSummary(equipRef) }
  @Axon static Grid upsEquipPoints(Ref equipRef) { UpsApplicationService.equipPoints(equipRef) }
  @Axon static Obj? upsPointHistory(Ref pointRef, Obj span, Dict? opts := null) { UpsApplicationService.pointHistory(pointRef, span, opts) }
  @Axon static Grid upsActiveAlarms(Dict? filter := null) { UpsApplicationService.activeAlarms(filter) }

  @Axon { admin = true }
  static Dict upsAlarmAck(Ref alarmRef, Str? comment, Int version) { UpsApplicationService.alarmAck(alarmRef, comment, version) }

  @Axon { admin = true }
  static Dict upsAlarmDisposition(Ref alarmRef, Str action, Str? comment, Int version) { UpsApplicationService.alarmDisposition(alarmRef, action, comment, version) }

  @Axon { admin = true }
  static Dict upsAlarmClose(Ref alarmRef, Str conclusion, Int version) { UpsApplicationService.alarmClose(alarmRef, conclusion, version) }

  @Axon static Dict? upsLatestAssessment(Ref equipRef) { UpsApplicationService.latestAssessment(equipRef) }
  @Axon static Dict? upsDemoAssessment(Ref equipRef) { UpsApplicationService.demoAssessment(equipRef) }
  @Axon static Grid upsAssessmentRiskItems(Ref assessmentRef) { UpsApplicationService.assessmentRiskItems(assessmentRef) }
  @Axon static Grid upsRiskRecommendations(Ref riskItemRef) { UpsApplicationService.riskRecommendations(riskItemRef) }
  @Axon static Grid upsMappings(Ref? equipRef := null) { UpsApplicationService.mappings(equipRef) }
  @Axon static Dict upsValidateMapping(Dict mapping) { UpsApplicationService.validateMapping(mapping) }
}
