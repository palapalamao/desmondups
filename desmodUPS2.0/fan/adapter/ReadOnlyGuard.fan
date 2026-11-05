const class ReadOnlyGuard
{
  static Void checkPointWrite(Str pointRef)
  {
    throw UpsErr("UPS-2003 POINT_WRITE_FORBIDDEN")
  }
}
