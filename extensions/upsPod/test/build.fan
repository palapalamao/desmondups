using build

** Build behavior tests as a separate pod against the production upsPod pod.
class Build : build::BuildPod {
  new make() {
    podName = "upsPodTest"
    summary = "upsPod isolated Hx/Folio behavior tests"
    depends = [
      "sys 1.0+",
      "concurrent 1.0+",
      "haystack 3.0.20+",
      "axon 3.0.20+",
      "folio 3.0.20+",
      "hx 3.0.20+",
      "upsPod 0.8.1",
    ]
    srcDirs = [`fan/`]
    version = Version("0.1.0")
    outPodDir = (scriptDir + `../.test-env/lib/fan/`).uri
  }
}
