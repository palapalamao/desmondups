(function (root, factory) {
  var api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.ProjectContext = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var PROJECT_ID = /^[A-Za-z][A-Za-z0-9_-]{0,63}$/;

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
    if (!encoded) throw new Error("FIN 项目标识缺失或格式非法");
    var project;
    try {
      project = decodeURIComponent(encoded);
    } catch (error) {
      throw new Error("FIN 项目标识包含无效 URL 编码");
    }
    if (!PROJECT_ID.test(project)) throw new Error("FIN 项目标识缺失或格式非法");
    return project;
  }

  function resolveProjectContext(environment) {
    if (!environment) throw new Error("无法确定 FIN 项目上下文");
    var current;
    try {
      current = locationInfo(environment.location);
    } catch (error) {
      throw new Error("无法确定 FIN 页面来源");
    }
    if (!current || !current.origin || current.origin === "null") {
      throw new Error("无法确定 FIN 页面来源");
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
    if (projects.length === 0) throw new Error("无法从同源 /finMobile/<project> 路径确定 FIN 项目");
    if (projects.length !== 1) throw new Error("同源 FIN 页面包含冲突的项目上下文");

    var project = projects[0];
    return Object.freeze({
      project: project,
      evalUrl: "/api/" + encodeURIComponent(project) + "/eval",
    });
  }

  function assertProjectContext(context) {
    if (!context || !PROJECT_ID.test(String(context.project || ""))) {
      throw new Error("调用需要已解析的 FIN 项目上下文");
    }
    var expectedUrl = "/api/" + encodeURIComponent(context.project) + "/eval";
    if (context.evalUrl !== expectedUrl) throw new Error("FIN 项目上下文与 API 地址不一致");
    return context;
  }

  return {
    resolveProjectContext: resolveProjectContext,
    assertProjectContext: assertProjectContext,
  };
});
