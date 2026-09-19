// build.fan — desmondUPS upsPod ext pod
// 契约来源：知识库 fin-dev-docs/extension/01（未经 FIN 5.3.0 运行时验证，见证据目录）
// 版本联动：改此版本号须同步 docs/dev/版本联动清单（阶段4成文）与 spec 版本行
using build

class Build : build::BuildPod {
  new make() {
    podName = "upsPod"
    summary = "desmondUPS UPS fleet monitor POD (FIN ext)"
    depends = ["sys 1.0", "concurrent 1.0", "haystack 4.0", "axon 2.1", "ui 0.1"]
    srcDirs = [`fan/`]
    resDirs = [`locale/`, `frontend/`]
    version = Version("0.3.0")
  }
}
