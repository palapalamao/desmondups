using hx
using web

const class UpsPodWeb : HxLibWeb {
  new make(UpsPodExt ext) : super(ext) {}

  override Void onGet() {
    rel := req.modRel.toStr
    if (rel == `/overview`.toStr || rel == `overview`.toStr) {
      res.headers["Content-Type"] = "application/json; charset=utf-8"
      res.out.print(UpsPodLib.overviewJsonFromRuntime(rt))
      return
    }
    res.sendErr(404, "Unknown upsPod API: " + rel)
  }
}
