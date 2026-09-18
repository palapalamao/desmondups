using ext
using concurrent

** 扩展入口：生命周期。所有初始化失败直接抛错——fail-closed，不静默。
** 版本 0.1.0
const class UpsPodExt : Ext {
  @ExtMeta { name = "upsPod" }
  new make() {}
  override Void onStart() {
    // 段3（无FIN环境）：无运行时初始化。段4+：此处注册轮询调度（经统一Actor，不自建线程池）
  }
  override Void onStop() {}
}
