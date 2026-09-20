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

function deterministicCrypto(seed) {
  return { getRandomValues: bytes => {
    for (let index = 0; index < bytes.length; index++) bytes[index] = (seed + index) & 255;
    return bytes;
  } };
}

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
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

  const nextUuid = TreeUi.createKeyGenerator("my-project", { randomUUID: () => "uuid-1" });
  assert.strictEqual(nextUuid(), "ups-tree:my-project:uuid-1");
  const sessionOneKey = TreeUi.createKeyGenerator("my-project", deterministicCrypto(1))();
  const sessionTwoKey = TreeUi.createKeyGenerator("my-project", deterministicCrypto(33))();
  assert.match(sessionOneKey, /^ups-tree:my-project:[0-9a-f]{32}$/);
  assert.notStrictEqual(sessionOneKey, sessionTwoKey, "independent sessions must not reuse a counter-derived key");
  const uuidFallbackCrypto = deterministicCrypto(65);
  uuidFallbackCrypto.randomUUID = () => { throw new Error("UUID unavailable"); };
  assert.match(TreeUi.createKeyGenerator("my-project", uuidFallbackCrypto)(), /^ups-tree:my-project:[0-9a-f]{32}$/);
  assert.throws(() => TreeUi.createKeyGenerator("my-project", {})(), /安全随机数不可用，无法创建/);
  assert.throws(() => TreeUi.createKeyGenerator("my-project", {
    getRandomValues: () => { throw new Error("entropy unavailable"); },
  })(), /安全随机数不可用，无法创建/);
  const noRandomController = TreeUi.createTreeController({
    treeRead: async () => [], treeCreate: async () => { throw new Error("must not run"); },
    treeUpdate: async () => { throw new Error("must not run"); },
  }, { project: "no-random", cryptoApi: {} });
  assert.strictEqual(noRandomController.prepare("site"), null);
  assert.match(noRandomController.state.operation.message, /安全随机数不可用，无法创建/);
  await assert.rejects(() => noRandomController.create("site"), /安全随机数不可用，无法创建/);

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
  assert.deepStrictEqual(TreeUi.buildCreatePreview("site", { dis: "北区", navName: "north", tz: "Asia/Shanghai" }, selections, "k-site"), {
    dis: "北区", navName: "north", tz: "Asia/Shanghai", upsTreeKey: "k-site", site: true, upsSite: true,
  });
  assert.deepStrictEqual(TreeUi.buildCreatePreview("floor", { dis: "二层", navName: "f2" }, selections, "k-floor"), {
    dis: "二层", navName: "f2", siteRef: "s:1", upsTreeKey: "k-floor", floor: true,
  });
  assert.deepStrictEqual(TreeUi.buildCreatePreview("equip", { dis: "UPS B", navName: "upsB", make: "Acme", model: "Y", serial: "SN-2", ratedKva: "80" }, selections, "k-equip"), {
    dis: "UPS B", navName: "upsB", siteRef: "s:1", floorRef: "f:1", make: "Acme", model: "Y", serial: "SN-2", ratedKva: 80, upsTreeKey: "k-equip", equip: true, upsUnit: true,
  });
  assert.deepStrictEqual(TreeUi.buildCreatePreview("point", { dis: "负载", navName: "load", kind: "Number", unit: "%", metric: "upsLoadPct" }, selections, "k-point"), {
    dis: "负载", navName: "load", siteRef: "s:1", floorRef: "f:1", equipRef: "e:1", kind: "Number", unit: "%", upsLoadPct: true, upsTreeKey: "k-point", point: true,
  });
  ["", "other", "upsSocPct,upsLoadPct"].forEach(metric => {
    assert.throws(() => TreeUi.buildCreatePayload("point", { dis: "P", navName: "p", kind: "Number", unit: "%", metric }, selections, "k"), /数据类型|metric/i);
  });

  assert.deepStrictEqual(TreeUi.buildUpdatePayload("equip", {
    dis: "UPS A+", navName: "upsA", make: "Acme", model: "X", serial: "SN-1", ratedKva: "50",
  }, model.equips[0]), { dis: "UPS A+", ratedKva: 50 });
  assert.deepStrictEqual(TreeUi.buildUpdatePayload("equip", {
    dis: "UPS A", navName: "upsA", make: "Acme", model: "X", serial: "SN-1", ratedKva: "",
  }, model.equips[0]), { ratedKva: null });
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

  const orderedReads = [];
  const ordered = TreeUi.createTreeController({
    treeRead: () => { const next = deferred(); orderedReads.push(next); return next.promise; },
    treeCreate: async () => { throw new Error("unused"); }, treeUpdate: async () => { throw new Error("unused"); },
  }, { project: "ordered", cryptoApi: deterministicCrypto(50) });
  const oldRefresh = ordered.refresh();
  await Promise.resolve();
  const newRefresh = ordered.refresh();
  await Promise.resolve();
  assert.strictEqual(ordered.state.busy, true);
  orderedReads[1].resolve(rows.concat({ id: "s:new", type: "site", dis: "最新站点", navName: "new" }));
  await newRefresh;
  assert.strictEqual(ordered.state.tree.byId["s:new"].dis, "最新站点");
  assert.strictEqual(ordered.state.busy, true, "older refresh remains active");
  orderedReads[0].resolve(rows);
  await oldRefresh;
  assert.strictEqual(ordered.state.tree.byId["s:new"].dis, "最新站点", "stale response must not overwrite latest tree");
  assert.strictEqual(ordered.state.busy, false);

  const mutationReads = [];
  let mutationReadCount = 0;
  const staleMutation = TreeUi.createTreeController({
    treeRead: async () => {
      mutationReadCount++;
      if (mutationReadCount === 1) return rows;
      const next = deferred(); mutationReads.push(next); return next.promise;
    },
    treeCreate: async (type, payload) => ({ status: "created", id: "f:stale", type,
      dis: payload.dis, siteId: payload.siteRef }),
    treeUpdate: async () => { throw new Error("unused"); },
  }, { project: "stale", keyGenerator: () => "stale-key" });
  await staleMutation.refresh();
  staleMutation.select("site", "s:1");
  staleMutation.prepare("floor");
  Object.assign(staleMutation.state.drafts.floor, { dis: "乱序楼层", navName: "staleFloor" });
  const mutationCreate = staleMutation.create("floor");
  while (mutationReads.length < 1) await Promise.resolve();
  const latestRefresh = staleMutation.refresh();
  while (mutationReads.length < 2) await Promise.resolve();
  mutationReads[1].resolve(rows);
  await latestRefresh;
  assert.strictEqual(staleMutation.state.busy, true, "mutation refresh remains active");
  mutationReads[0].resolve(rows.concat({ id: "f:stale", type: "floor", dis: "乱序楼层",
    navName: "staleFloor", siteId: "s:1", status: "ok" }));
  await assert.rejects(() => mutationCreate, /写入结果未确认/);
  assert.strictEqual(staleMutation.state.tree.byId["f:stale"], undefined,
    "stale mutation response must not confirm or replace the latest tree");
  assert.strictEqual(staleMutation.state.keys.floor, "stale-key");
  assert.strictEqual(staleMutation.state.drafts.floor.dis, "乱序楼层");
  assert.strictEqual(staleMutation.state.busy, false);

  let confirmRead = 0;
  const confirmationCalls = [];
  const confirmingAdapter = {
    treeRead: async () => {
      confirmRead++;
      if (confirmRead === 1) return rows;
      if (confirmRead === 2) throw new Error("刷新中断");
      if (confirmRead === 3) return rows;
      return rows.concat({ id: "f:confirmed", type: "floor", dis: "三层", navName: "f3", siteId: "s:1", status: "ok" });
    },
    treeCreate: async (type, payload) => {
      confirmationCalls.push([type, Object.assign({}, payload)]);
      return { status: confirmationCalls.length === 1 ? "created" : "existing", id: "f:confirmed", type, dis: payload.dis, siteId: payload.siteRef };
    },
    treeUpdate: async () => { throw new Error("unused"); },
  };
  const confirming = TreeUi.createTreeController(confirmingAdapter, { project: "my-project", keyGenerator: () => "confirm-key" });
  await confirming.refresh();
  confirming.select("site", "s:1");
  confirming.prepare("floor");
  Object.assign(confirming.state.drafts.floor, { dis: "三层", navName: "f3" });
  await assert.rejects(() => confirming.create("floor"), /写入结果未确认/);
  assert.strictEqual(confirming.state.keys.floor, "confirm-key");
  assert.deepStrictEqual(confirming.state.drafts.floor, { dis: "三层", navName: "f3" });
  assert.deepStrictEqual(confirming.state.selections, { siteId: "s:1", floorId: "", equipId: "", pointId: "" });
  assert.strictEqual(confirming.state.activeType, "floor");
  assert.match(confirming.state.operation.message, /写入结果未确认，可刷新或用同一请求重试/);
  await assert.rejects(() => confirming.create("floor"), /写入结果未确认/);
  assert.strictEqual(confirming.state.keys.floor, "confirm-key");
  assert.strictEqual(confirming.state.activeType, "floor");
  const confirmed = await confirming.create("floor");
  assert.strictEqual(confirmed.status, "existing");
  assert.strictEqual(confirming.state.keys.floor, null);
  assert.strictEqual(confirming.state.selections.floorId, "f:confirmed");
  assert.strictEqual(confirming.state.activeType, "equip");
  assert.deepStrictEqual(confirmationCalls.map(call => call[1].upsTreeKey), ["confirm-key", "confirm-key", "confirm-key"]);

  const editedExisting = TreeUi.createTreeController({
    treeRead: async () => rows.concat({ id: "f:edited", type: "floor", dis: "后来改名",
      navName: "laterName", siteId: "s:1", status: "ok" }),
    treeCreate: async (type, payload) => ({ status: "existing", id: "f:edited", type,
      dis: payload.dis, siteId: payload.siteRef }),
    treeUpdate: async () => { throw new Error("unused"); },
  }, { project: "edited-existing", keyGenerator: () => "edited-existing-key" });
  await editedExisting.refresh();
  editedExisting.select("site", "s:1");
  editedExisting.prepare("floor");
  Object.assign(editedExisting.state.drafts.floor, { dis: "原始楼层", navName: "originalFloor" });
  await assert.rejects(() => editedExisting.create("floor"), /写入结果未确认/);
  assert.strictEqual(editedExisting.state.keys.floor, "edited-existing-key");
  assert.strictEqual(editedExisting.state.drafts.floor.dis, "原始楼层");

  let updateRead = 0;
  const updateCalls = [];
  const updateRows = rows.map(row => Object.assign({}, row));
  const updateAdapter = {
    treeRead: async () => {
      updateRead++;
      if (updateRead < 3) return updateRows;
      return updateRows.map(row => row.id === "e:1" ? Object.assign({}, row, { dis: "UPS A confirmed" }) : row);
    },
    treeCreate: async () => { throw new Error("unused"); },
    treeUpdate: async (id, payload) => {
      updateCalls.push([id, Object.assign({}, payload)]);
      return { status: updateCalls.length === 1 ? "updated" : "unchanged", id, type: "equip", dis: payload.dis };
    },
  };
  const updating = TreeUi.createTreeController(updateAdapter, { project: "my-project", keyGenerator: () => "unused" });
  await updating.refresh();
  updating.edit("equip", "e:1");
  updating.state.edit.draft.dis = "UPS A confirmed";
  await assert.rejects(() => updating.update(), /写入结果未确认/);
  assert.strictEqual(updating.state.edit.draft.dis, "UPS A confirmed");
  assert.strictEqual(updating.state.edit.original.dis, "UPS A");
  const updated = await updating.update();
  assert.strictEqual(updated.status, "unchanged");
  assert.strictEqual(updating.state.edit.original.dis, "UPS A confirmed");
  assert.deepStrictEqual(updateCalls, [
    ["e:1", { dis: "UPS A confirmed" }],
    ["e:1", { dis: "UPS A confirmed" }],
  ]);

  const html = fs.readFileSync(path.join(__dirname, "..", "frontend", "index.html"), "utf8");
  const app = fs.readFileSync(path.join(__dirname, "..", "frontend", "app.js"), "utf8");
  const helper = fs.readFileSync(path.join(__dirname, "..", "frontend", "tree-ui.js"), "utf8");
  const styles = fs.readFileSync(path.join(__dirname, "..", "frontend", "styles.css"), "utf8");
  const menu = fs.readFileSync(path.join(__dirname, "..", "lib", "menu.trio"), "utf8");
  assert.match(menu, /设备树管理[\s\S]*\/ups\/tree/);
  assert.match(html, /设备树管理/);
  assert.match(html, /层级与数据类型创建后不可更改/);
  assert.match(html, /即将保存/);
  assert.doesNotMatch(html, /<input[^>]+(?:curVal|curStatusTs)|<select[^>]+(?:curVal|curStatusTs)/i);
  assert.doesNotMatch(html, /删除|更换父级|运行值|告警确认/);
  assert.match(app, /route\.page === "tree"[\s\S]*renderTree\(\)/);
  assert.match(app, /treeController\.refresh\(\)/);
  assert.doesNotMatch(helper, /Math\.random|Date\.now/);
  assert.doesNotMatch(helper, /treeKeyCounter|localCounter|sessionStorage/);
  assert.match(styles, /@media \(max-width: 800px\)[\s\S]*\.tree-layout\s*\{\s*grid-template-columns: 1fr/);
  assert.match(styles, /:focus-visible/);
  assert.match(styles, /prefers-reduced-motion: reduce/);
  const marker = '<script id="overview-template" type="text/ractive">';
  const templateStart = html.indexOf(marker), templateEnd = html.indexOf("</script>", templateStart);
  assert.ok(templateStart >= 0 && templateEnd > templateStart, "Ractive template must exist");
  const template = html.slice(templateStart + marker.length, templateEnd);
  assert.doesNotThrow(() => Ractive.parse(template));

  // Render the production template and drive its actual Ractive events. This keeps
  // the interaction contract executable without a FIN server or browser DOM.
  Ractive.DEBUG = false;
  let fixtureRows = rows.slice();
  let fixtureCreateFails = true;
  const fixtureAdapter = {
    treeRead: async () => fixtureRows,
    treeCreate: async (type, payload) => {
      if (fixtureCreateFails) throw new Error("楼层名称已存在");
      const createdRow = { id: "f:fixture", type, dis: payload.dis, navName: payload.navName,
        siteId: payload.siteRef, status: "ok" };
      fixtureRows = fixtureRows.concat(createdRow);
      return { status: "created", id: createdRow.id, type, dis: createdRow.dis, siteId: createdRow.siteId };
    },
    treeUpdate: async () => { throw new Error("保存服务暂时不可用"); },
  };
  const fixtureController = TreeUi.createTreeController(fixtureAdapter, {
    project: "fixture-project", keyGenerator: () => "fixture-floor-key",
  });
  await fixtureController.refresh();
  fixtureController.select("site", "s:1");
  fixtureController.prepare("floor");
  Object.assign(fixtureController.state.drafts.floor, { dis: "交互测试楼层", navName: "fixtureFloor" });
  const typeLabels = { site: "站点", floor: "楼层", equip: "UPS", point: "点位" };
  const fieldLabels = { dis: "显示名称", navName: "导航名称", siteRef: "所属站点",
    upsTreeKey: "创建标识", floor: "楼层标记", ratedKva: "额定容量（kVA）" };
  function fixtureVm() {
    const state = fixtureController.state;
    let preview = [], previewError = null;
    if (state.mode === "create") {
      try {
        preview = Object.entries(TreeUi.buildCreatePreview(state.activeType, state.drafts[state.activeType], state.selections, state.keys[state.activeType]))
          .map(([name, value]) => ({ label: fieldLabels[name] || name, value: value === true ? "是" : String(value) }));
      } catch (error) {
        previewError = String(error.message || error);
      }
    }
    return {
      step: TreeUi.TYPES.indexOf(state.activeType) + 1,
      typeLabel: typeLabels[state.mode === "edit" && state.edit ? state.edit.type : state.activeType],
      draft: state.drafts[state.activeType],
      floors: TreeUi.childrenFor(state.tree, "floor", state.selections),
      equips: TreeUi.childrenFor(state.tree, "equip", state.selections),
      points: TreeUi.childrenFor(state.tree, "point", state.selections),
      floorChoices: TreeUi.childrenFor(state.tree, "floor", { siteId: state.selections.siteId }),
      equipChoices: TreeUi.childrenFor(state.tree, "equip", { siteId: state.selections.siteId, floorId: state.selections.floorId }),
      preview, previewError,
      updatePreview: state.mode === "edit" ? Object.entries(TreeUi.buildUpdatePayload(state.edit.type,
        state.edit.draft, state.edit.original)).map(([name, value]) => ({
          label: fieldLabels[name] || name, value: value === null ? "清空" : String(value),
        })) : [],
      updatePreviewError: null,
      parentText: state.edit && state.edit.original.parentChain && state.edit.original.parentChain.length
        ? state.edit.original.parentChain.join(" / ") : "顶层",
    };
  }
  const fixture = new Ractive({ template, data: { view: "tree", tree: fixtureController.state,
    treeVm: fixtureVm(), treeMetricLabel: metric => metric } });
  function fixtureRender() {
    fixture.reset({ view: "tree", tree: fixtureController.state, treeVm: fixtureVm(), treeMetricLabel: metric => metric });
  }
  let fixtureAction = Promise.resolve();
  fixture.on("treeCreate", function (event, type) {
    fixtureAction = fixtureController.create(type).then(fixtureRender).catch(fixtureRender);
    fixtureRender();
  });
  fixture.on("treeEdit", function (event, type, id) {
    fixtureController.edit(type, id);
    fixtureRender();
  });
  fixture.on("treeUpdate", function () {
    fixtureAction = fixtureController.update().then(fixtureRender).catch(fixtureRender);
    fixtureRender();
  });

  let fixtureHtml = fixture.toHTML();
  assert.match(fixtureHtml, /创建楼层/);
  assert.match(fixtureHtml, /即将创建/);
  assert.match(fixtureHtml, /value="交互测试楼层"/);
  assert.match(fixtureHtml, /楼层标记<\/dt><dd>是/);
  assert.match(fixtureHtml, /所属站点<\/dt><dd>s:1/);
  fixture.fire("treeCreate", null, "floor");
  await fixtureAction;
  fixtureHtml = fixture.toHTML();
  assert.match(fixtureHtml, /楼层名称已存在/);
  assert.match(fixtureHtml, /value="交互测试楼层"/);
  assert.match(fixtureHtml, />创建楼层<\/button>/);

  fixtureCreateFails = false;
  fixture.fire("treeCreate", null, "floor");
  await fixtureAction;
  fixtureHtml = fixture.toHTML();
  assert.match(fixtureHtml, /创建UPS/);
  assert.match(fixtureHtml, /f:fixture/);

  fixture.fire("treeEdit", null, "equip", "e:1");
  fixtureHtml = fixture.toHTML();
  assert.match(fixtureHtml, /维护现有记录/);
  assert.match(fixtureHtml, /记录 ID<\/dt><dd>e:1/);
  assert.match(fixtureHtml, /层级与数据类型创建后不可更改/);
  fixtureController.state.edit.draft.dis = "UPS A 交互修改";
  fixtureController.state.edit.draft.ratedKva = "";
  fixtureRender();
  assert.match(fixture.toHTML(), /额定容量（kVA）<\/dt><dd>清空/);
  fixture.fire("treeUpdate");
  await fixtureAction;
  fixtureHtml = fixture.toHTML();
  assert.match(fixtureHtml, /保存服务暂时不可用/);
  assert.match(fixtureHtml, /value="UPS A 交互修改"/);
  assert.match(fixtureHtml, />保存更改<\/button>/);

  console.log("PASS TC-TREE-UI-01 route, hierarchy, stable keys, exact payloads, recovery, and safe edit boundary");
})().catch(error => {
  console.error("FAIL", error.stack || error);
  process.exit(1);
});
