using axon
using haystack

** Parse the installed menu with the FIN parser before browser acceptance.
class VerifyMenu {
  static Void main(Str[] args) {
    if (args.size != 1) throw ArgErr("Usage: verifyMenu.fan <built-upsPod.pod>")
    podFile := File.os(args.first).normalize
    if (!podFile.exists) throw Err("Missing built pod: " + podFile.osPath)
    zip := Zip.open(podFile)
    Dict[] records := Dict[,]
    try {
      file := zip.contents[`/lib/menu.trio`]
      if (file == null) throw Err("Missing /lib/menu.trio")
      records = TrioReader(file.in).readAllDicts
    } finally zip.close
    menu := records.find |r| { r["name"] == "upsApp" }
    if (menu == null || !menu.has("finStackMobileMenu")) throw Err("Missing FIN menu hook")
    Parser(Loc.eval, ((Str)menu["src"]).in).parse
    // FIN's launcher invokes menu hooks with a target argument (including null).
    // Keep the menu expression intact except for the final list-to-grid conversion.
    src := ((Str)menu["src"]).replace("].toGrid", "]")
    items := (List)MenuContext().eval("do f: " + src + "\nf(null)\nend")
    if (items.size != 8) throw Err("Expected divider plus seven menu entries")
    labels := ["UPS Fleet / UPS 车队", "UPS 总览 / Overview", "设备详情 / Details",
      "历史趋势 / History", "告警 / Alarms", "配置 / Configuration", "审计 / Audit", "设备树 / Device Tree"]
    routes := ["", "/ups/overview", "/ups/unit/ups-pod-01", "/ups/history/ups-pod-01?metrics=soc,load",
      "/ups/alarms", "/ups/config", "/ups/audit", "/ups/tree"]
    icons := ["", "icon-gauge", "sm-ups", "chart-no-axes-column", "icon-alert", "icon-settings", "icon-file", "icon-sitemap"]
    items.each |Obj? item, Int index| {
      row := (Dict)item
      if (row["displayName"] != labels[index]) throw Err("Unexpected menu label at " + index)
      if (row.has("isDivider")) return
      action := (Str)row["action"]
      if (!action.contains("/pod/upsPod/frontend/index.html#" + routes[index])) throw Err("Invalid UPS route: " + action)
      if (row["icon"] != icons[index]) throw Err("Unexpected icon at " + index)
      if (((Number)row["order"]).toInt != -320 + index) throw Err("Unexpected order at " + index)
    }
    echo("PASS built upsApp has bilingual labels, valid syntax, routes, icons, and order")
  }
}

class MenuContext : AxonContext {
  override Namespace ns() { throw UnsupportedErr("Namespace not needed by menu test") }
  override Dict? deref(Ref id) { throw UnsupportedErr("No records in menu test") }
  override FilterInference inference() { throw UnsupportedErr("No filters in menu test") }
  override Dict toDict() { return Etc.emptyDict }
  override Fn? findTop(Str name, Bool checked := true) {
    throw UnsupportedErr("Unexpected external function: " + name)
  }
}
