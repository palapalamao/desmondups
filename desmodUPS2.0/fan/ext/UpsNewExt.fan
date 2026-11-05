using skyarcd

@ExtMeta { name = "upsNew"; depends = ["haystack", "finStackCore"] }
const class UpsNewExt : Ext
{
  override Void onStart() { log.info("upsNew started in read-only device mode") }
  override Void onStop() { log.info("upsNew stopped") }
}
