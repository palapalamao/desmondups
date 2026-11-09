(function (root, factory) {
  var api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.ProjectContext = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var PROJECT_ID = /^[A-Za-z][A-Za-z0-9_-]{0,63}$/;
  var translate = function (key) { return key; };
  function t(key, params) { return translate(key, params); }
  function setTranslator(fn) { translate = typeof fn === "function" ? fn : translate; }

  function locationInfo(location) {
    if (!location) return null;
    var href = String(location.href || "");
    var origin = String(location.origin || "");
    var pathname = String(location.pathname || "");
    if ((!origin || !pathname) && href) {
      var parsed = new URL(href);
      if (!origin) origin = parsed.origin;
      if (!pathname) pathname = parsed.pathname;
    }
    return { origin: origin, pathname: pathname, href: href };
  }

  function sameOriginFramePath(frame, origin) {
    try {
      var info = locationInfo(frame && frame.location);
      if (!info || info.origin !== origin) return null;
      return info.pathname;
    } catch (ignore) {
      return null;
    }
  }

  function projectFromPath(pathname) {
    var segments = String(pathname || "").split("/");
    var index = segments.indexOf("finMobile");
    if (index < 0) return null;
    var encoded = segments[index + 1];
    if (!encoded) throw new Error(t("context.projectInvalid"));
    var project;
    try {
      project = decodeURIComponent(encoded);
    } catch (error) {
      throw new Error(t("context.projectEncoding"));
    }
    if (!PROJECT_ID.test(project)) throw new Error(t("context.projectInvalid"));
    return project;
  }

  function resolveProjectContext(environment) {
    if (!environment) throw new Error(t("context.environmentMissing"));
    var current;
    try {
      current = locationInfo(environment.location);
    } catch (error) {
      throw new Error(t("context.originUnknown"));
    }
    if (!current || !current.origin || current.origin === "null") {
      throw new Error(t("context.originUnknown"));
    }

    var paths = [];
    var selfPath = sameOriginFramePath(environment, current.origin);
    var parentPath = sameOriginFramePath(environment.parent, current.origin);
    var topPath = sameOriginFramePath(environment.top, current.origin);
    [selfPath, parentPath, topPath].forEach(function (path) {
      if (path !== null) paths.push(path);
    });

    var referrer = environment.document && environment.document.referrer;
    if (referrer) {
      try {
        var referrerUrl = new URL(String(referrer), current.href || current.origin + "/");
        if (referrerUrl.origin === current.origin) paths.push(referrerUrl.pathname);
      } catch (ignore) {}
    }

    var projects = [];
    paths.forEach(function (path) {
      var project = projectFromPath(path);
      if (project !== null && projects.indexOf(project) < 0) projects.push(project);
    });
    if (projects.length === 0) throw new Error(t("context.pathMissing"));
    if (projects.length !== 1) throw new Error(t("context.conflict"));

    var project = projects[0];
    return Object.freeze({
      project: project,
      evalUrl: "/api/" + encodeURIComponent(project) + "/eval",
    });
  }

  function assertProjectContext(context) {
    if (!context || !PROJECT_ID.test(String(context.project || ""))) {
      throw new Error(t("context.required"));
    }
    var expectedUrl = "/api/" + encodeURIComponent(context.project) + "/eval";
    if (context.evalUrl !== expectedUrl) throw new Error(t("context.urlMismatch"));
    return context;
  }

  return {
    setTranslator: setTranslator,
    resolveProjectContext: resolveProjectContext,
    assertProjectContext: assertProjectContext,
  };
});
