using build

class Build : BuildPod
{
  new make()
  {
    podName = "upsNew"
    summary = "Read-only UPS monitoring and assessment extension for FIN 5.3"
    version = Version("0.2.5")
    outPodDir = `build/lib/fan/`
    depends = [
      "sys 1.0+",
      "concurrent 1.0+",
      "haystack 3.0.20+",
      "axon 3.0.20+",
      "skyarc 3.0.20+",
      "skyarcd 3.0.20+",
    ]
    index = [
      "skyarc.ext": "upsNew::UpsNewExt",
      "skyarc.lib": "upsNew::UpsNewLib",
      "fin.lang": "upsNew",
    ]
    srcDirs = [
      `fan/domain/`,
      `fan/repo/`,
      `fan/adapter/`,
      `fan/engine/`,
      `fan/api/`,
      `fan/axon/`,
      `fan/ext/`,
      `fan/scheduler/`,
      `fan/test/`,
    ]
    // BuildPod resource directories are not recursive. Keep FIN runtime defs/menu
    // in lib/, and package the Xeto source contract from lib/ups/ explicitly.
    resDirs = [`lib/`, `lib/ups/`, `locale/`, `trio/`, `ui/`, `ui/fonts/`]
  }
}
