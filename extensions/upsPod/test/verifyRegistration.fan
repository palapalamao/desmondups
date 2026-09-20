using skyarcd
using upsPod

** Verify the metadata consumed by FIN's extension discovery, not just class loading.
class VerifyRegistration {
  static Void main() {
    t := Type.find("upsPod::UpsPodExt")
    meta := (ExtMeta)t.facet(ExtMeta#)
    if (meta.name != "upsPod") throw Err("Incorrect extension name")
    if (!meta.depends.contains("finstack") || !meta.depends.contains("finStackMobile"))
      throw Err("Missing FIN menu namespace and launcher dependencies")
    if (!Env.cur.index("skyarc.ext").contains(t.qname)) throw Err("Missing extension index")
    if (!Env.cur.index("skyarc.lib").contains("upsPod::UpsPodLib")) throw Err("Missing function index")
    if (!t.fits(Ext#)) throw Err("Invalid extension base class")
    if (!t.method("make").params.isEmpty) throw Err("Extension constructor requires arguments")
    pod := Pod.find("upsPod")
    [`/frontend/index.html`, `/frontend/app.js`, `/frontend/styles.css`,
     `/frontend/vendor/ractive.min.js`, `/frontend/seed-data.js`].each |uri| {
      if (pod.file(uri).size == 0) throw Err("Empty resource: " + uri)
    }
    if (pod.file(`/frontend/seed-data.js`).readAllStr != pod.file(`/frontend/seed.json`).readAllStr)
      throw Err("Served demo seed differs from canonical seed")
    echo("PASS upsPod class metadata, extension index, function index, constructor signature")
    echo("PASS frontend resources and canonical demo data packaged")
  }
}
