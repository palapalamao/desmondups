// build.fan — desmondUPS upsPod ext pod
// 契约来源：知识库 fin-dev-docs/extension/01（未经 FIN 5.3.0 运行时验证，见证据目录）
// 版本联动：改此版本号须同步 docs/dev/版本联动清单（阶段4成文）与 spec 版本行
// 2026-09-19 按本机 FIN 5.3.0.2761 实际 pod 版本修正依赖（careBalance/energyMatrix 同款已验证配方）
using build

class Build : build::BuildPod {
  new make() {
    podName = "upsPod"
    summary = "desmondUPS UPS fleet monitor POD (FIN ext)"
    depends = [
      "sys 1.0+",
      "concurrent 1.0+",
      "haystack 3.0.20+",
      "axon 3.0.20+",
      "folio 3.0.20+",
      "hx 3.0.20+",
      "skyarc 3.0.20+",
      "skyarcd 3.0.20+",
      "util 1.0+",
      "web 1.0+",
    ]
    srcDirs = [`fan/`]
    resDirs = [`locale/`, `frontend/`, `frontend/vendor/`, `lib/`]
    version = Version("0.8.1")
    outPodDir = (scriptDir + `output/`).uri
    index = [
      "skyarc.ext": "upsPod::UpsPodExt",
      "skyarc.lib": "upsPod::UpsPodLib",
      "fin.lang": "upsPod",
    ]
  }

  // FIN publishes .js resources but excludes .json. Keep the demo seed canonical
  // as JSON, then package the same bytes under a served extension.
  override Void compileFan() {
    servedSeed := scriptDir + `frontend/seed-data.js`
    if (servedSeed.exists) throw Err("Unexpected generated file: " + servedSeed)
    (scriptDir + `frontend/seed.json`).copyTo(servedSeed)
    try { super.compileFan() }
    finally { servedSeed.delete }
  }
}
