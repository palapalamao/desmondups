using axon
using haystack

** Parse the installed menu with the FIN parser before browser acceptance.
class VerifyMenu {
  static Void main() {
    records := TrioReader(Pod.find("upsPod").file(`/lib/menu.trio`).in).readAllDicts
    menu := records.find |r| { r["name"] == "upsApp" }
    if (menu == null || !menu.has("finStackMobileMenu")) throw Err("Missing FIN menu hook")
    Parser(Loc.eval, ((Str)menu["src"]).in).parse
    // FIN's launcher invokes menu hooks with a target argument (including null).
    // Keep the menu expression intact except for the final list-to-grid conversion.
    src := ((Str)menu["src"]).replace("].toGrid", "]")
    items := (List)MenuContext().eval("do f: " + src + "\nf(null)\nend")
    if (items.size != 8) throw Err("Expected divider plus seven menu entries")
    items.each |Obj? item| {
      row := (Dict)item
      if (row.has("isDivider")) return
      action := (Str)row["action"]
      if (!action.contains("/pod/upsPod/frontend/index.html#/ups/"))
        throw Err("Invalid UPS route: " + action)
    }
    echo("PASS installed upsApp has FIN menu hook and valid Axon syntax")
    echo("PASS launcher target argument and seven page actions")
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
