(function (root, factory) {
  var api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.FinApi = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function zincExprGrid(expr) {
    return 'ver:"3.0"\nexpr\n' + JSON.stringify(String(expr)) + "\n";
  }

  function axonString(value) {
    var text = String(value);
    var output = '"';
    for (var i = 0; i < text.length; i++) {
      var ch = text.charAt(i);
      var code = text.charCodeAt(i);
      if (ch === '"') output += '\\"';
      else if (ch === "\\") output += "\\\\";
      else if (ch === "\r") output += "\\r";
      else if (ch === "\n") output += "\\n";
      else if (ch === "\t") output += "\\t";
      else if (ch === "$") output += "\\$";
      else if (code < 0x20 || (code >= 0x7f && code <= 0x9f) || code === 0x2028 || code === 0x2029) {
        output += "\\u" + ("0000" + code.toString(16)).slice(-4);
      } else output += ch;
    }
    return output + '"';
  }

  function responseDetail(text) {
    return String(text || "")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 240);
  }

  function parseZincString(value) {
    var output = "";
    for (var i = 1; i < value.length - 1; i++) {
      var ch = value.charAt(i);
      if (ch !== "\\") { output += ch; continue; }
      i++;
      if (i >= value.length - 1) throw new Error("Invalid Zinc string escape");
      var escaped = value.charAt(i);
      if (escaped === "n") output += "\n";
      else if (escaped === "r") output += "\r";
      else if (escaped === "t") output += "\t";
      else if (escaped === '"' || escaped === "\\" || escaped === "$") output += escaped;
      else if (escaped === "u") {
        var hex = value.slice(i + 1, i + 5);
        if (!/^[0-9A-Fa-f]{4}$/.test(hex)) throw new Error("Invalid Zinc Unicode escape");
        output += String.fromCharCode(parseInt(hex, 16));
        i += 4;
      } else throw new Error("Invalid Zinc string escape");
    }
    return output;
  }

  function parseZincScalar(value) {
    var v = value === undefined ? "" : String(value).trim();
    if (v === "" || v === "N") return null;
    if (v === "M" || v === "T" || v === "true") return true;
    if (v === "F" || v === "false") return false;
    if (v.charAt(0) === "@") {
      var ref = v.match(/^@([^\s]+)/);
      return ref ? ref[1] : v.slice(1);
    }
    if (v.charAt(0) === '"' && v.charAt(v.length - 1) === '"') return parseZincString(v);
    var typedNumber = v.match(/^(?:Float|Int|Decimal|Number)\("(-?\d+(?:\.\d+)?)"\)$/);
    if (typedNumber) return Number(typedNumber[1]);
    if (/^-?\d+(\.\d+)?/.test(v)) return parseFloat(v);
    return v;
  }

  async function checkedText(response, label) {
    var text = await response.text();
    if (!response.ok) {
      var detail = responseDetail(text);
      throw new Error(label + "：HTTP " + response.status + (detail ? " · " + detail : ""));
    }
    return text;
  }

  async function evalZinc(fetchImpl, evalUrl, expr) {
    var auth = await fetchImpl("/finStackAuth", {
      method: "POST",
      credentials: "same-origin",
    });
    await checkedText(auth, "FIN 会话校验接口失败");
    var attestKey = auth.headers.get("fin-stack-auth");
    if (!attestKey) throw new Error("FIN 会话校验接口未返回 fin-stack-auth");

    var response = await fetchImpl(evalUrl, {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Accept": "text/zinc",
        "Content-Type": "text/zinc; charset=utf-8",
        "Attest-Key": attestKey,
      },
      body: zincExprGrid(expr),
    });
    var text = await checkedText(response, "Folio 数据接口失败");
    if (!/^ver:/m.test(text)) {
      var contentType = String(response.headers.get("content-type") || "").toLowerCase();
      if (contentType.indexOf("text/html") >= 0 || /<title>\s*login\s*<\/title>/i.test(text)) {
        throw new Error("FIN 登录会话已失效，请重新登录后刷新页面");
      }
      throw new Error("Folio 数据接口返回格式不是 Zinc Grid");
    }

    var metaLine = text.split(/\r?\n/, 1)[0];
    if (/(?:^|\s)err(?:\s|$)/.test(metaLine)) {
      var dis = metaLine.match(/(?:^|\s)dis:"((?:\\.|[^"\\])*)"/);
      var detail = "Axon 执行失败";
      if (dis) {
        try { detail = JSON.parse('"' + dis[1] + '"'); }
        catch (ignore) { detail = dis[1]; }
      }
      throw new Error("Folio Axon 执行失败：" + detail);
    }
    return text;
  }

  return {
    axonString: axonString,
    zincExprGrid: zincExprGrid,
    responseDetail: responseDetail,
    parseZincScalar: parseZincScalar,
    evalZinc: evalZinc,
  };
});
