"use strict";

const assert = require("assert");
const FinApi = require("../frontend/fin-api.js");
const core = require("../frontend/app.js");
const ProjectContext = require("../frontend/project-context.js");

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
  assert.strictEqual(FinApi.parseZincScalar('@p:1 "SOC point"'), "p:1");
  assert.strictEqual(FinApi.parseZincScalar('"rack\\$one\\n中文"'), "rack$one\n中文");
}

function testAxonString() {
  assert.strictEqual(
    FinApi.axonString('quote" slash\\\r\n\t\u0000\u001f中文😀$name'),
    '"quote\\" slash\\\\\\r\\n\\t\\u0000\\u001f中文😀\\$name"'
  );
  assert.strictEqual(
    FinApi.axonString('x"); evil(); ("'),
    '"x\\"); evil(); (\\""'
  );
}

async function testTreeApiExpressionsAndResponses() {
  const expressions = [];
  const evalUrls = [];
  const replies = [
    'ver:"3.0"\nid,dis,siteId,siteName,floorId,floorName,location,make,model,serial,ratedKva,soc,loadPct,batteryTemp,commLost,mode,ts\n',
    'ver:"3.0"\nid,type,dis,siteId,floorId,equipId,status\n@p:1 "SOC point","point","SOC",@s:1 "Site",@f:1 "Floor",@e:1 "UPS","ok"\n',
    'ver:"3.0"\nstatus,type,dis,siteId,floorId,conflictId\n"conflict","equip","UPS A",@s:1,@f:1,@e:existing\n',
    'ver:"3.0"\nstatus,id,type,dis,siteId,floorId,equipId\n"updated",@p:1,"point","SOC main",@s:1,@f:1,@e:1\n',
  ];
  let replyIndex = 0;
  const fetchImpl = async (url, options) => {
    if (url === "/finStackAuth") return response(200, "", { "fin-stack-auth": "session-key" });
    evalUrls.push(url);
    const expression = JSON.parse(options.body.split("\n")[2]);
    expressions.push(expression);
    return response(200, replies[replyIndex++], { "content-type": "text/zinc" });
  };
  const context = ProjectContext.resolveProjectContext({
    location: { origin: "https://fin.example", pathname: "/pod/upsPod/frontend/index.html", href: "https://fin.example/pod/upsPod/frontend/index.html" },
    parent: { location: { origin: "https://fin.example", pathname: "/finMobile/my%2Dproject/", href: "https://fin.example/finMobile/my%2Dproject/" } },
    top: { location: { origin: "https://fin.example", pathname: "/finMobile/my%2Dproject/", href: "https://fin.example/finMobile/my%2Dproject/" } },
    document: { referrer: "" },
  });
  const adapter = core.createFinAdapter({ projectContext: context, finApi: FinApi, fetchImpl });

  const snapshot = await adapter.load();
  assert.deepStrictEqual(snapshot.units, []);

  const rows = await adapter.treeRead();
  assert.deepStrictEqual(rows, [{ id: "p:1", type: "point", dis: "SOC", siteId: "s:1", floorId: "f:1", equipId: "e:1", status: "ok" }]);

  const payload = { dis: 'UPS "A"', navName: "rack\\one", siteRef: "s:1", floorRef: "f:1" };
  const created = await adapter.treeCreate('equip"); evil(); ("', payload);
  assert.deepStrictEqual(created, { status: "conflict", type: "equip", dis: "UPS A", siteId: "s:1", floorId: "f:1", conflictId: "e:existing" });

  const updated = await adapter.treeUpdate('p:1"); evil(); ("', { dis: "SOC main" });
  assert.deepStrictEqual(updated, { status: "updated", id: "p:1", type: "point", dis: "SOC main", siteId: "s:1", floorId: "f:1", equipId: "e:1" });

  assert.deepStrictEqual(expressions, [
    "upsOverview()",
    "upsTreeRead()",
    "upsTreeCreate(" + FinApi.axonString('equip"); evil(); ("') + "," + FinApi.axonString(JSON.stringify(payload)) + ")",
    "upsTreeUpdate(" + FinApi.axonString('p:1"); evil(); ("') + "," + FinApi.axonString(JSON.stringify({ dis: "SOC main" })) + ")",
  ]);
  assert.ok(expressions[2].startsWith('upsTreeCreate("equip\\"); evil(); (\\"","'));
  assert.ok(expressions[3].startsWith('upsTreeUpdate("p:1\\"); evil(); (\\"","'));
  assert.deepStrictEqual(evalUrls, Array(4).fill("/api/my-project/eval"));
}

async function testTreeOperationRequiresOneRow() {
  const fetchImpl = async url => {
    if (url === "/finStackAuth") return response(200, "", { "fin-stack-auth": "session-key" });
    return response(200, 'ver:"3.0"\nstatus,id\n', { "content-type": "text/zinc" });
  };
  const adapter = core.createFinAdapter({
    projectContext: { project: "mytest", evalUrl: "/api/mytest/eval" },
    finApi: FinApi,
    fetchImpl,
  });
  await assert.rejects(() => adapter.treeUpdate("p:1", { dis: "SOC" }), /operation result|操作结果/i);
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
  testAxonString();
  console.log("PASS TC-FIN-API-07 Axon 字符串编码");
  await testTreeApiExpressionsAndResponses();
  console.log("PASS TC-FIN-API-08 树接口表达式与 Zinc 结果");
  await testTreeOperationRequiresOneRow();
  console.log("PASS TC-FIN-API-09 树操作结果关闭失败");
})().catch(err => {
  console.error("FAIL", err.stack || err);
  process.exit(1);
});
