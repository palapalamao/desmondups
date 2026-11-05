const class ExternalMapping
{
  new make(Str pointRef, Str connectorRef, Str externalPath, Str floorRef, Bool writeEnabled)
  {
    this.pointRef = pointRef
    this.connectorRef = connectorRef
    this.externalPath = externalPath
    this.floorRef = floorRef
    this.writeEnabled = writeEnabled
  }

  const Str pointRef
  const Str connectorRef
  const Str externalPath
  const Str floorRef
  const Bool writeEnabled
}

const class MappingValidator
{
  static Str[] validate(ExternalMapping mapping)
  {
    errors := Str[,]
    if (mapping.floorRef.trim.isEmpty) errors.add("UPS-1002 FLOOR_REF_REQUIRED")
    if (mapping.writeEnabled) errors.add("UPS-2003 POINT_WRITE_FORBIDDEN")
    if (mapping.externalPath.trim.isEmpty) errors.add("UPS-4001 EXTERNAL_PATH_REQUIRED")
    return errors
  }
}
