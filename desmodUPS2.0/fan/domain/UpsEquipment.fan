const class UpsEquipment
{
  new make(Str id, Str dis, Str siteRef, Str floorRef)
  {
    if (id.trim.isEmpty) throw ArgErr("UPS-1001 EQUIP_REF_REQUIRED")
    if (siteRef.trim.isEmpty) throw ArgErr("UPS-1003 SITE_REF_REQUIRED")
    if (floorRef.trim.isEmpty) throw ArgErr("UPS-1002 FLOOR_REF_REQUIRED")
    this.id = id
    this.dis = dis
    this.siteRef = siteRef
    this.floorRef = floorRef
  }

  const Str id
  const Str dis
  const Str siteRef
  const Str floorRef
}

const class BatteryGroup
{
  new make(Str id, Str equipRef, Str floorRef)
  {
    if (floorRef.trim.isEmpty) throw ArgErr("UPS-1002 FLOOR_REF_REQUIRED")
    this.id = id
    this.equipRef = equipRef
    this.floorRef = floorRef
  }

  const Str id
  const Str equipRef
  const Str floorRef
}
