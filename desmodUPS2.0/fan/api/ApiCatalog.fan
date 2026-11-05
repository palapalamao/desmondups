const class ApiRoute
{
  new make(Str method, Str path, Str operation)
  {
    this.method = method
    this.path = path
    this.operation = operation
  }

  const Str method
  const Str path
  const Str operation
}

const class ApiCatalog
{
  static const ApiRoute[] routes := [
    ApiRoute("GET",  "/api/ups/v1/sites", "listSites"),
    ApiRoute("GET",  "/api/ups/v1/sites/{siteId}/floors", "listFloors"),
    ApiRoute("GET",  "/api/ups/v1/equips", "listEquips"),
    ApiRoute("GET",  "/api/ups/v1/equips/{equipId}", "getEquip"),
    ApiRoute("GET",  "/api/ups/v1/equips/{equipId}/points", "listEquipPoints"),
    ApiRoute("GET",  "/api/ups/v1/points/{pointId}/history", "readPointHistory"),
    ApiRoute("GET",  "/api/ups/v1/equips/{equipId}/events", "listEquipEvents"),
    ApiRoute("GET",  "/api/ups/v1/alarms", "listAlarms"),
    ApiRoute("GET",  "/api/ups/v1/alarms/{alarmId}", "getAlarm"),
    ApiRoute("POST", "/api/ups/v1/alarms/{alarmId}/acknowledgements", "acknowledgeAlarm"),
    ApiRoute("POST", "/api/ups/v1/alarms/{alarmId}/dispositions", "disposeAlarm"),
    ApiRoute("POST", "/api/ups/v1/alarms/{alarmId}/close", "closeAlarm"),
    ApiRoute("GET",  "/api/ups/v1/assessments", "listAssessments"),
    ApiRoute("GET",  "/api/ups/v1/equips/{equipId}/assessments/latest", "latestAssessment"),
    ApiRoute("GET",  "/api/ups/v1/assessments/{assessmentId}/risk-items", "listAssessmentRiskItems"),
    ApiRoute("GET",  "/api/ups/v1/risk-items/{riskItemId}/recommendations", "listRiskRecommendations"),
    ApiRoute("GET",  "/api/ups/v1/mappings", "listMappings"),
    ApiRoute("POST", "/api/ups/v1/mappings/validate", "validateMapping"),
    ApiRoute("GET",  "/api/ups/v1/health", "health"),
  ]
}
