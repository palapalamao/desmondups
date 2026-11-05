enum class DataSource { measured, derived, manual, simulated }
enum class DataQuality { valid, stale, missing, invalid }

const class Observation
{
  new make(Str pointRef, Obj? val, DateTime observedAt, DataSource source)
  {
    this.pointRef = pointRef
    this.val = val
    this.observedAt = observedAt
    this.source = source
  }

  const Str pointRef
  const Obj? val
  const DateTime observedAt
  const DataSource source
}

const class DataQualityPolicy
{
  static DataQuality classify(Observation? observation, DateTime now, Duration maxAge)
  {
    if (observation == null || observation.val == null) return DataQuality.missing
    if (observation.source == DataSource.simulated) return DataQuality.invalid
    if (observation.observedAt > now) return DataQuality.invalid
    if (now - observation.observedAt > maxAge) return DataQuality.stale
    return DataQuality.valid
  }
}
