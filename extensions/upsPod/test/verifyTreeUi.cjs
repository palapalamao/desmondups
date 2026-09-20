"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const Ractive = require("../frontend/vendor/ractive.min.js");
const TreeUi = require("../frontend/tree-ui.js");
const core = require("../frontend/app.js");

const rows = [
  { id: "s:1", type: "site", dis: "北区", navName: "north", tz: "Asia/Shanghai", status: "ok" },
  { id: "s:2", type: "site", dis: "南区", navName: "south", status: "ok" },
  { id: "f:1", type: "floor", dis: "一层", navName: "f1", siteId: "s:1", status: "ok" },
  { id: "f:2", type: "floor", dis: "二层", navName: "f2", siteId: "s:2", status: "ok" },
  { id: "e:1", type: "equip", dis: "UPS A", navName: "upsA", siteId: "s:1", floorId: "f:1", make: "Acme", model: "X", serial: "SN-1", ratedKva: 40, status: "ok" },
  { id: "p:1", type: "point", dis: "SOC", navName: "soc", siteId: "s:1", floorId: "f:1", equipId: "e:1", kind: "Number", unit: "%", metric: "upsSocPct", status: "ok" },
];

function storage() {
  const values = new Map();
  return { getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)) };
}

(async () => {
  assert.deepStrictEqual(core.parseHashValue("#/ups/tree"), {
    page: "tree", unitId: null, q: {}, invalid: false, error: null,
  });

  const model = TreeUi.buildTreeModel(rows);
  assert.deepStrictEqual(model.sites.map(record => record.id), ["s:1", "s:2"]);
  assert.deepStrictEqual(TreeUi.childrenFor(model, "floor", { siteId: "s:1" }).map(record => record.id), ["f:1"]);
  assert.deepStrictEqual(TreeUi.childrenFor(model, "equip", { siteId: "s:1", floorId: "f:1" }).map(record => record.id), ["e:1"]);
  assert.deepStrictEqual(TreeUi.childrenFor(model, "point", { siteId: "s:1", floorId: "f:1", equipId: "e:1" }).map(record => record.id), ["p:1"]);
  assert.deepStrictEqual(model.points[0].parentChain, ["北区", "一层", "UPS A"]);

  const fallbackStorage = storage();
  const nextFallback = TreeUi.createKeyGenerator("my-project", {}, fallbackStorage);
  assert.strictEqual(nextFallback(), "ups-tree:my-project:1");
  assert.strictEqual(nextFallback(), "ups-tree:my-project:2");
  const nextUuid = TreeUi.createKeyGenerator("my-project", { randomUUID: () => "uuid-1" }, fallbackStorage);
  assert.strictEqual(nextUuid(), "ups-tree:my-project:uuid-1");

  const selections = { siteId: "s:1", floorId: "f:1", equipId: "e:1", pointId: "" };
  assert.deepStrictEqual(TreeUi.buildCreatePayload("site", { dis: "北区", navName: "north", tz: "Asia/Shanghai" }, selections, "k-site"), {
    dis: "北区", navName: "north", tz: "Asia/Shanghai", upsTreeKey: "k-site",
  });
  assert.deepStrictEqual(TreeUi.buildCreatePayload("floor", { dis: "二层", navName: "f2" }, selections, "k-floor"), {
    dis: "二层", navName: "f2", siteRef: "s:1", upsTreeKey: "k-floor",
  });
  assert.deepStrictEqual(TreeUi.buildCreatePayload("equip", { dis: "UPS B", navName: "upsB", make: "Acme", model: "Y", serial: "SN-2", ratedKva: "80" }, selections, "k-equip"), {
    dis: "UPS B", navName: "upsB", siteRef: "s:1", floorRef: "f:1", make: "Acme", model: "Y", serial: "SN-2", ratedKva: 80, upsTreeKey: "k-equip",
  });
  assert.deepStrictEqual(TreeUi.buildCreatePayload("point", { dis: "负载", navName: "load", kind: "Number", unit: "%", metric: "upsLoadPct" }, selections, "k-point"), {
    dis: "负载", navName: "load", siteRef: "s:1", floorRef: "f:1", equipRef: "e:1", kind: "Number", unit: "%", upsLoadPct: true, upsTreeKey: "k-point",
  });
  ["", "other", "upsSocPct,upsLoadPct"].forEach(metric => {
    assert.throws(() => TreeUi.buildCreatePayload("point", { dis: "P", navName: "p", kind: "Number", unit: "%", metric }, selections, "k"), /数据类型|metric/i);
  });

  assert.deepStrictEqual(TreeUi.buildUpdatePayload("equip", {
    dis: "UPS A+", navName: "upsA", make: "Acme", model: "X", serial: "SN-1", ratedKva: "50",
  }, model.equips[0]), { dis: "UPS A+", ratedKva: 50 });
  assert.deepStrictEqual(TreeUi.buildUpdatePayload("point", {
    dis: "SOC", navName: "soc", kind: "Number", unit: "%", metric: "upsLoadPct", equipId: "e:2",
  }, model.points[0]), {});

  let records = rows.slice();
  const calls = [];
  let failCreate = true;
  const adapter = {
    treeRead: async () => { calls.push(["read"]); return records; },
    treeCreate: async (type, payload) => {
      calls.push(["create", type, payload]);
      if (failCreate) throw Object.assign(new Error("名称冲突"), { conflictId: "f:existing" });
      const id = type.charAt(0) + ":new";
      records = records.concat(Object.assign({ id, type, status: "ok" }, type === "floor" ? { siteId: payload.siteRef } : {}, payload));
      return { status: "created", id, type, dis: payload.dis };
    },
    treeUpdate: async (id, payload) => { calls.push(["update", id, payload]); throw new Error("更新失败"); },
  };
  const keys = ["site-key", "floor-key", "floor-key-next"];
  const controller = TreeUi.createTreeController(adapter, { project: "my-project", keyGenerator: () => keys.shift() });
  await controller.refresh();
  controller.select("site", "s:1");
  controller.prepare("floor");
  Object.assign(controller.state.drafts.floor, { dis: "三层", navName: "f3" });
  const firstKey = controller.state.keys.floor;
  const firstDraft = Object.assign({}, controller.state.drafts.floor);
  const firstSelections = Object.assign({}, controller.state.selections);
  await assert.rejects(() => controller.create("floor"), /名称冲突/);
  assert.strictEqual(controller.state.keys.floor, firstKey);
  assert.deepStrictEqual(controller.state.drafts.floor, firstDraft);
  assert.deepStrictEqual(controller.state.selections, firstSelections);
  assert.strictEqual(controller.state.operation.conflictId, "f:existing");
  failCreate = false;
  const created = await controller.create("floor");
  assert.strictEqual(created.id, "f:new");
  assert.strictEqual(controller.state.selections.floorId, "f:new");
  assert.strictEqual(controller.state.activeType, "equip");
  assert.strictEqual(controller.state.keys.floor, null);
  assert.deepStrictEqual(calls.filter(call => call[0] === "create").map(call => call[2].upsTreeKey), [firstKey, firstKey]);

  controller.edit("equip", "e:1");
  controller.state.edit.draft.dis = "UPS A updated";
  await assert.rejects(() => controller.update(), /更新失败/);
  assert.strictEqual(controller.state.edit.draft.dis, "UPS A updated");
  assert.deepStrictEqual(calls.find(call => call[0] === "update").slice(1), ["e:1", { dis: "UPS A updated" }]);

  const lastGood = controller.state.tree;
  adapter.treeRead = async () => { throw new Error("读取失败"); };
  await assert.rejects(() => controller.refresh(), /读取失败/);
  assert.strictEqual(controller.state.tree, lastGood);
  adapter.treeRead = async () => records;
  await controller.refresh();
  assert.strictEqual(controller.state.treeError, null);

  const html = fs.readFileSync(path.join(__dirname, "..", "frontend", "index.html"), "utf8");
  const app = fs.readFileSync(path.join(__dirname, "..", "frontend", "app.js"), "utf8");
  const helper = fs.readFileSync(path.join(__dirname, "..", "frontend", "tree-ui.js"), "utf8");
  const styles = fs.readFileSync(path.join(__dirname, "..", "frontend", "styles.css"), "utf8");
  const menu = fs.readFileSync(path.join(__dirname, "..", "lib", "menu.trio"), "utf8");
  assert.match(menu, /设备树管理[\s\S]*\/ups\/tree/);
  assert.match(html, /设备树管理/);
  assert.match(html, /层级与数据类型创建后不可更改/);
  assert.doesNotMatch(html, /<input[^>]+(?:curVal|curStatusTs)|<select[^>]+(?:curVal|curStatusTs)/i);
  assert.doesNotMatch(html, /删除|更换父级|运行值|告警确认/);
  assert.match(app, /route\.page === "tree"[\s\S]*renderTree\(\)/);
  assert.match(app, /treeController\.refresh\(\)/);
  assert.doesNotMatch(helper, /Math\.random|Date\.now/);
  assert.match(styles, /@media \(max-width: 800px\)[\s\S]*\.tree-layout\s*\{\s*grid-template-columns: 1fr/);
  assert.match(styles, /:focus-visible/);
  assert.match(styles, /prefers-reduced-motion: reduce/);
  const marker = '<script id="overview-template" type="text/ractive">';
  const templateStart = html.indexOf(marker), templateEnd = html.indexOf("</script>", templateStart);
  assert.ok(templateStart >= 0 && templateEnd > templateStart, "Ractive template must exist");
  assert.doesNotThrow(() => Ractive.parse(html.slice(templateStart + marker.length, templateEnd)));

  console.log("PASS TC-TREE-UI-01 route, hierarchy, stable keys, exact payloads, recovery, and safe edit boundary");
})().catch(error => {
  console.error("FAIL", error.stack || error);
  process.exit(1);
});
