using haystack

class UpsTrioTest : Test
{
  Void testEveryTrioResourceParsesInFin53()
  {
    names := [
      "ups-defs.trio", "upsNew-menu.trio",
    ]
    pod := UpsNewExt#.pod
    names.each |name|
    {
      file := pod.file(Uri("/trio/$name"))
      records := TrioReader(file.in).readAllDicts
      verify(records.size > 0, "$name contains no records")
    }
  }

  Void testDeploymentResourcesArePackaged()
  {
    pod := UpsNewExt#.pod
    menu := pod.file(`/lib/menu.trio`)
    verify(TrioReader(menu.in).readAllDicts.size > 0, "lib/menu.trio contains no records")

    ["lib.xeto", "tags.xeto", "equips.xeto", "points.xeto",
     "assessment.xeto", "mapping.xeto"].each |name|
    {
      verifyNotNull(pod.file(Uri("/lib/ups/$name"), false), "$name is not packaged")
    }
  }


  Void testDemoRecordsAreNotShipped()
  {
    pod := UpsNewExt#.pod
    ["demo-sites.trio", "demo-equips.trio", "demo-points.trio",
     "demo-mappings.trio"].each |name|
    {
      verifyNull(pod.file(Uri("/trio/$name"), false), "$name must not ship in the runtime pod")
    }
  }
}
