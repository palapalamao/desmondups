** Verify the pod built by this checkout without resolving an installed upsPod.
class VerifyRegistration {
  static Void main(Str[] args) {
    if (args.size != 1) throw ArgErr("Usage: verifyRegistration.fan <built-upsPod.pod>")
    podFile := File.os(args.first).normalize
    if (!podFile.exists) throw Err("Missing built pod: " + podFile.osPath)

    zip := Zip.open(podFile)
    try {
      files := zip.contents
      if (files == null) throw Err("Cannot read built pod archive")

      [`/frontend/index.html`, `/frontend/project-context.js`, `/frontend/fin-api.js`,
       `/frontend/app.js`, `/frontend/tree-ui.js`, `/frontend/styles.css`,
       `/frontend/vendor/ractive.min.js`].each |uri| {
        file := files[uri]
        if (file == null || file.in.readAllBuf.isEmpty)
          throw Err("Missing or empty resource in built pod: " + uri)
      }

      meta := read(files, `/meta.props`).in.readProps
      if (meta["pod.name"] != "upsPod") throw Err("Incorrect pod name")
      if (meta["pod.isScript"] != "false") throw Err("upsPod must be a compiled pod")

      index := read(files, `/index.props`).in.readProps
      if (index["skyarc.ext"] != "upsPod::UpsPodExt") throw Err("Missing extension index")
      if (index["skyarc.lib"] != "upsPod::UpsPodLib") throw Err("Missing function index")
      if (files.keys.any |uri| { uri.toStr.contains("UpsPodTreeTest") })
        throw Err("Production pod must not contain behavior test classes")

      api := read(files, `/doc/UpsPodExt.apidoc`)
      if (!api.contains("base=skyarcd::Ext hx::HxLib sys::Obj")) throw Err("Invalid extension base class")
      if (!api.contains("name=\"upsPod\"")) throw Err("Incorrect extension name")
      if (!api.contains("depends=[\"finstack\",\"finStackMobile\"]"))
        throw Err("Missing FIN menu namespace and launcher dependencies")
      if (!api.contains("-- make(\n) sys::Void")) throw Err("Extension constructor requires arguments")

      echo("PASS built upsPod metadata, indexes, constructor, and production-only classes")
    } finally {
      zip.close
    }
  }

  private static Str read([Uri:File] files, Uri uri) {
    file := files[uri]
    if (file == null) throw Err("Missing resource in built pod: " + uri)
    text := file.readAllStr
    if (text.isEmpty) throw Err("Empty resource in built pod: " + uri)
    return text
  }
}
