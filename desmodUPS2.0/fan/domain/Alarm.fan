enum class AlarmState { open, acknowledged, inProgress, resolved, closed }

class Alarm
{
  new make(Str id, Str subjectRef, AlarmState state := AlarmState.open)
  {
    this.id = id
    this.subjectRef = subjectRef
    this.state = state
  }

  const Str id
  const Str subjectRef
  AlarmState state { private set }
  Int version := 0 { private set }
  Str? acknowledgedBy { private set }
  Str? disposition { private set }
  Str? conclusion { private set }

  This acknowledge(Str actor, Str comment, Int expectedVersion)
  {
    checkVersion(expectedVersion)
    if (state != AlarmState.open) throw UpsErr("UPS-3001 ALARM_STATE_INVALID")
    acknowledgedBy = actor
    state = AlarmState.acknowledged
    version++
    return this
  }

  This startDisposition(Str actor, Str action, Int expectedVersion)
  {
    checkVersion(expectedVersion)
    if (state != AlarmState.acknowledged) throw UpsErr("UPS-3001 ALARM_STATE_INVALID")
    disposition = action
    state = AlarmState.inProgress
    version++
    return this
  }

  This markResolved(Int expectedVersion)
  {
    checkVersion(expectedVersion)
    if (state != AlarmState.inProgress) throw UpsErr("UPS-3001 ALARM_STATE_INVALID")
    state = AlarmState.resolved
    version++
    return this
  }

  This close(Str actor, Str conclusion, Int expectedVersion)
  {
    checkVersion(expectedVersion)
    if (state != AlarmState.resolved) throw UpsErr("UPS-3001 ALARM_STATE_INVALID")
    this.conclusion = conclusion
    state = AlarmState.closed
    version++
    return this
  }

  private Void checkVersion(Int expectedVersion)
  {
    if (version != expectedVersion) throw UpsErr("UPS-3002 ALARM_VERSION_CONFLICT")
  }
}
