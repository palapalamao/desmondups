"use strict";

const assert = require("assert");
const FinApi = require("../frontend/fin-api.js");

function response(status, body, headers) {
  const map = Object.fromEntries(Object.entries(headers || {}).map(([k, v]) => [k.toLowerCase(), v]));
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: name => map[String(name).toLowerCase()] || null },
    text: async () => body,
  };
}

async function testAuthenticatedEval() {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    if (url === "/finStackAuth") return response(200, "", { "fin-stack-auth": "session-key" });
    return response(200, 'ver:"3.0"\nval\n2\n', { "content-type": "text/zinc" });
  };

  const zinc = await FinApi.evalZinc(fetchImpl, "/api/mytest/eval", "1+1");

  assert.strictEqual(zinc, 'ver:"3.0"\nval\n2\n');
  assert.strictEqual(calls.length, 2);
  assert.strictEqual(calls[0].url, "/finStackAuth");
  assert.strictEqual(calls[0].options.method, "POST");
  assert.strictEqual(calls[0].options.credentials, "same-origin");
  assert.strictEqual(calls[1].url, "/api/mytest/eval");
  assert.strictEqual(calls[1].options.headers["Attest-Key"], "session-key");
  assert.ok(!("SkyArc-Attest-Key" in calls[1].options.headers));
  assert.strictEqual(calls[1].options.body, 'ver:"3.0"\nexpr\n"1+1"\n');
}

async function testResponseBodyInError() {
  const fetchImpl = async url => {
    if (url === "/finStackAuth") return response(200, "", { "fin-stack-auth": "session-key" });
    return response(400, "<html><body>Attest-Key header required</body></html>", { "content-type": "text/html" });
  };

  await assert.rejects(
    () => FinApi.evalZinc(fetchImpl, "/api/mytest/eval", "upsOverview()"),
    err => err.message.includes("HTTP 400") && err.message.includes("Attest-Key header required")
  );
}

async function testMissingAttestKeyFailsClosed() {
  const fetchImpl = async () => response(200, "", {});
  await assert.rejects(
    () => FinApi.evalZinc(fetchImpl, "/api/mytest/eval", "upsOverview()"),
    /未返回 fin-stack-auth/
  );
}

async function testAxonErrorGridFailsClosed() {
  const fetchImpl = async url => {
    if (url === "/finStackAuth") return response(200, "", { "fin-stack-auth": "session-key" });
    return response(200, 'ver:"3.0" errType:"axon::EvalErr" err dis:"Unknown symbol upsOverview"\nempty\n\n', { "content-type": "text/zinc" });
  };
  await assert.rejects(
    () => FinApi.evalZinc(fetchImpl, "/api/mytest/eval", "upsOverview()"),
    /Unknown symbol upsOverview/
  );
}

async function testLoginHtmlFailsClosed() {
  const fetchImpl = async url => {
    if (url === "/finStackAuth") return response(200, "", { "fin-stack-auth": "session-key" });
    return response(200, "<!DOCTYPE html><title>Login</title>", { "content-type": "text/html" });
  };
  await assert.rejects(
    () => FinApi.evalZinc(fetchImpl, "/api/mytest/eval", "upsOverview()"),
    /登录会话已失效/
  );
}

function testTypedZincScalars() {
  assert.strictEqual(FinApi.parseZincScalar('Float("92.0")'), 92);
  assert.strictEqual(FinApi.parseZincScalar('Int("1789876799788")'), 1789876799788);
  assert.strictEqual(FinApi.parseZincScalar("F"), false);
  assert.strictEqual(FinApi.parseZincScalar("T"), true);
}

(async () => {
  await testAuthenticatedEval();
  console.log("PASS TC-FIN-API-01 会话校验头");
  await testResponseBodyInError();
  console.log("PASS TC-FIN-API-02 错误正文");
  await testMissingAttestKeyFailsClosed();
  console.log("PASS TC-FIN-API-03 缺少校验码时关闭失败");
  await testAxonErrorGridFailsClosed();
  console.log("PASS TC-FIN-API-04 Axon 错误 Grid");
  await testLoginHtmlFailsClosed();
  console.log("PASS TC-FIN-API-05 登录页响应");
  testTypedZincScalars();
  console.log("PASS TC-FIN-API-06 Zinc 类型值");
})().catch(err => {
  console.error("FAIL", err.stack || err);
  process.exit(1);
});
