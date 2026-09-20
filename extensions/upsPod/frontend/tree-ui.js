(function (root, factory) {
  var api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.TreeUi = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var TYPES = ["site", "floor", "equip", "point"];
  var METRICS = ["upsSocPct", "upsLoadPct", "upsBatteryTemp", "upsCommStatus"];
  var UPDATE_FIELDS = {
    site: ["dis", "navName", "tz"],
    floor: ["dis", "navName"],
    equip: ["dis", "navName", "make", "model", "serial", "ratedKva"],
    point: ["dis", "navName", "kind", "unit"],
  };

  function text(value) { return value === undefined || value === null ? "" : String(value); }

  function emptyDraft(type) {
    if (type === "site") return { dis: "", navName: "", tz: "" };
    if (type === "floor") return { dis: "", navName: "" };
    if (type === "equip") return { dis: "", navName: "", make: "", model: "", serial: "", ratedKva: "" };
    if (type === "point") return { dis: "", navName: "", kind: "Number", unit: "", metric: "upsSocPct" };
    throw new Error("不支持的设备树层级：" + type);
  }

  function normalizeRow(row) {
    var type = text(row && row.type);
    if (TYPES.indexOf(type) < 0) return null;
    var record = { id: text(row.id), type: type, dis: text(row.dis), navName: text(row.navName) };
    ["tz", "siteId", "floorId", "equipId", "make", "model", "serial", "kind", "unit", "metric", "upsTreeKey"]
      .forEach(function (name) { if (row[name] !== undefined && row[name] !== null) record[name] = row[name]; });
    if (row.ratedKva !== undefined && row.ratedKva !== null) record.ratedKva = Number(row.ratedKva);
    if (!record.metric) {
      METRICS.some(function (name) {
        if (row[name] === true) { record.metric = name; return true; }
        return false;
      });
    }
    return record;
  }

  function buildTreeModel(rows) {
    var model = { sites: [], floors: [], equips: [], points: [], byId: {} };
    (rows || []).forEach(function (row) {
      var record = normalizeRow(row);
      if (!record || !record.id) return;
      model.byId[record.id] = record;
      model[record.type === "equip" ? "equips" : record.type + "s"].push(record);
    });
    model.floors.forEach(function (record) {
      var site = model.byId[record.siteId];
      record.parentChain = [site ? site.dis : record.siteId || "未知站点"];
    });
    model.equips.forEach(function (record) {
      var site = model.byId[record.siteId], floor = model.byId[record.floorId];
      record.parentChain = [site ? site.dis : record.siteId || "未知站点", floor ? floor.dis : record.floorId || "未知楼层"];
    });
    model.points.forEach(function (record) {
      var site = model.byId[record.siteId], floor = model.byId[record.floorId], equip = model.byId[record.equipId];
      record.parentChain = [site ? site.dis : record.siteId || "未知站点", floor ? floor.dis : record.floorId || "未知楼层", equip ? equip.dis : record.equipId || "未知 UPS"];
    });
    return model;
  }

  function childrenFor(model, type, selections) {
    selections = selections || {};
    var list = model[type === "equip" ? "equips" : type + "s"] || [];
    if (type === "site") return list.slice();
    return list.filter(function (record) {
      if (record.siteId !== selections.siteId) return false;
      if ((type === "equip" || type === "point") && record.floorId !== selections.floorId) return false;
      if (type === "point" && record.equipId !== selections.equipId) return false;
      return true;
    });
  }

  function createKeyGenerator(project, cryptoApi) {
    project = text(project);
    return function () {
      if (cryptoApi && typeof cryptoApi.randomUUID === "function") {
        try { return "ups-tree:" + project + ":" + cryptoApi.randomUUID(); }
        catch (ignoreUuid) {}
      }
      if (cryptoApi && typeof cryptoApi.getRandomValues === "function" && typeof Uint8Array !== "undefined") {
        try {
          var bytes = new Uint8Array(16);
          cryptoApi.getRandomValues(bytes);
          var hex = Array.prototype.map.call(bytes, function (value) {
            return ("0" + value.toString(16)).slice(-2);
          }).join("");
          return "ups-tree:" + project + ":" + hex;
        } catch (ignoreRandomValues) {}
      }
      throw new Error("安全随机数不可用，无法创建记录");
    };
  }

  function required(value, label) {
    var normalized = text(value).trim();
    if (!normalized) throw new Error("请填写" + label);
    return normalized;
  }

  function optional(payload, name, value) {
    if (value !== undefined && value !== null && text(value).trim() !== "") payload[name] = text(value).trim();
  }

  function numeric(value, label) {
    var number = Number(value);
    if (text(value).trim() === "" || !Number.isFinite(number)) throw new Error(label + "必须是数字");
    return number;
  }

  function buildCreatePayload(type, draft, selections, key) {
    draft = draft || {};
    selections = selections || {};
    var payload = {
      dis: required(draft.dis, "显示名称"),
      navName: required(draft.navName, "导航名称"),
    };
    if (type === "site") optional(payload, "tz", draft.tz);
    else {
      payload.siteRef = required(selections.siteId, "所属站点");
      if (type === "equip" || type === "point") payload.floorRef = required(selections.floorId, "所属楼层");
      if (type === "point") payload.equipRef = required(selections.equipId, "所属 UPS");
    }
    if (type === "equip") {
      optional(payload, "make", draft.make);
      optional(payload, "model", draft.model);
      optional(payload, "serial", draft.serial);
      if (text(draft.ratedKva).trim() !== "") payload.ratedKva = numeric(draft.ratedKva, "额定容量");
    }
    if (type === "point") {
      payload.kind = required(draft.kind, "数据类别");
      payload.unit = required(draft.unit, "单位");
      if (METRICS.indexOf(draft.metric) < 0) throw new Error("请选择一个支持的数据类型");
      payload[draft.metric] = true;
    }
    payload.upsTreeKey = required(key, "创建标识");
    return payload;
  }

  function buildCreatePreview(type, draft, selections, key) {
    var metadata = buildCreatePayload(type, draft, selections, key);
    if (type === "site") { metadata.site = true; metadata.upsSite = true; }
    else if (type === "floor") metadata.floor = true;
    else if (type === "equip") { metadata.equip = true; metadata.upsUnit = true; }
    else if (type === "point") metadata.point = true;
    return metadata;
  }

  function editDraft(type, record) {
    var draft = {};
    UPDATE_FIELDS[type].forEach(function (name) {
      draft[name] = record[name] === undefined || record[name] === null ? "" : record[name];
    });
    return draft;
  }

  function buildUpdatePayload(type, draft, original) {
    if (!UPDATE_FIELDS[type]) throw new Error("不支持的设备树层级：" + type);
    var payload = {};
    UPDATE_FIELDS[type].forEach(function (name) {
      var before = original[name] === undefined || original[name] === null
        ? (name === "ratedKva" ? null : "") : original[name];
      var after = draft[name] === undefined || draft[name] === null ? "" : draft[name];
      if (name === "ratedKva" && text(after).trim() === "") after = null;
      else if (name === "ratedKva") after = numeric(after, "额定容量");
      else if (typeof after === "string") after = after.trim();
      if (String(after) !== String(before)) payload[name] = after;
    });
    return payload;
  }

  function errorText(error) { return String(error && error.message || error || "未知错误"); }

  function createTreeController(adapter, options) {
    options = options || {};
    var nextKey = options.keyGenerator || createKeyGenerator(options.project, options.cryptoApi);
    var refreshSequence = 0;
    var activeCount = 0;
    var state = {
      tree: buildTreeModel([]), treeLoaded: false, treeError: null, busy: false,
      activeType: "site", mode: "create",
      selections: { siteId: "", floorId: "", equipId: "", pointId: "" },
      drafts: { site: emptyDraft("site"), floor: emptyDraft("floor"), equip: emptyDraft("equip"), point: emptyDraft("point") },
      keys: { site: null, floor: null, equip: null, point: null },
      edit: null,
      pendingMutation: null,
      operation: { status: "idle", message: "", conflictId: null },
    };

    function find(type, id) {
      var record = state.tree.byId[id];
      return record && record.type === type ? record : null;
    }

    function createConfirmed(pending) {
      var record = find(pending.type, text(pending.result.id));
      if (!record) return false;
      if (pending.type !== "site" && text(record.siteId) !== text(pending.payload.siteRef)) return false;
      if ((pending.type === "equip" || pending.type === "point") && text(record.floorId) !== text(pending.payload.floorRef)) return false;
      if (pending.type === "point" && text(record.equipId) !== text(pending.payload.equipRef)) return false;
      if (!UPDATE_FIELDS[pending.type].every(function (name) {
        var expected = pending.payload[name] === undefined || pending.payload[name] === null ? "" : pending.payload[name];
        var actual = record[name] === undefined || record[name] === null ? "" : record[name];
        return String(actual) === String(expected);
      })) return false;
      if (pending.type === "point") {
        var expectedMetric = METRICS.find(function (name) { return pending.payload[name] === true; });
        if (record.metric !== expectedMetric) return false;
      }
      return true;
    }

    function beginActivity() {
      activeCount += 1;
      state.busy = true;
    }

    function endActivity() {
      activeCount = Math.max(0, activeCount - 1);
      state.busy = activeCount > 0;
    }

    function updateConfirmed(pending) {
      var record = find(pending.type, pending.id);
      if (!record) return false;
      return Object.keys(pending.payload).every(function (name) {
        var actual = record[name] === undefined || record[name] === null ? "" : record[name];
        return String(actual) === String(pending.payload[name]);
      });
    }

    function finalizePending() {
      var pending = state.pendingMutation;
      if (!pending) return false;
      if (pending.kind === "create") {
        if (!createConfirmed(pending)) return false;
        state.keys[pending.type] = null;
        state.drafts[pending.type] = emptyDraft(pending.type);
        select(pending.type, text(pending.result.id));
        var index = TYPES.indexOf(pending.type);
        state.activeType = TYPES[Math.min(index + 1, TYPES.length - 1)];
        state.mode = "create";
        state.operation = { status: "success", message: pending.result.status === "existing" ? "已确认现有记录" : "创建成功", conflictId: null };
      } else {
        if (!updateConfirmed(pending)) return false;
        var fresh = find(pending.type, pending.id);
        state.edit = { type: fresh.type, id: fresh.id, original: fresh, draft: editDraft(fresh.type, fresh) };
        state.operation = { status: "success", message: pending.result.status === "unchanged" ? "内容未变化" : "保存成功", conflictId: null };
      }
      state.pendingMutation = null;
      return true;
    }

    function markUnconfirmed(detail) {
      var message = "写入结果未确认，可刷新或用同一请求重试";
      if (detail) message += "：" + detail;
      state.operation = { status: "error", message: message, conflictId: null };
      var error = new Error(message);
      error.unconfirmed = true;
      return error;
    }

    function refresh(clearOperationError) {
      var requestSequence = ++refreshSequence;
      beginActivity();
      return Promise.resolve().then(function () { return adapter.treeRead(); }).then(function (rows) {
        if (requestSequence !== refreshSequence) return state.tree;
        state.tree = buildTreeModel(rows);
        state.treeLoaded = true;
        state.treeError = null;
        if (state.pendingMutation) {
          if (!finalizePending()) markUnconfirmed("刷新后未找到相符记录");
        } else if (clearOperationError && state.operation.status === "error") {
          state.operation = { status: "idle", message: "", conflictId: null };
        }
        return state.tree;
      }).catch(function (error) {
        if (requestSequence === refreshSequence) state.treeError = errorText(error);
        throw error;
      }).finally(endActivity);
    }

    function prepare(type) {
      if (TYPES.indexOf(type) < 0) throw new Error("不支持的设备树层级：" + type);
      state.activeType = type;
      state.mode = "create";
      state.edit = null;
      if (!state.keys[type]) {
        try { state.keys[type] = nextKey(); }
        catch (error) {
          state.operation = { status: "error", message: errorText(error), conflictId: null };
          return null;
        }
      }
      return state.keys[type];
    }

    function select(type, id) {
      var record = id ? find(type, id) : null;
      var value = record ? record.id : "";
      if (type === "site") {
        state.selections.siteId = value;
        state.selections.floorId = state.selections.equipId = state.selections.pointId = "";
      } else if (type === "floor") {
        state.selections.floorId = value;
        state.selections.equipId = state.selections.pointId = "";
        if (record) state.selections.siteId = text(record.siteId);
      } else if (type === "equip") {
        state.selections.equipId = value;
        state.selections.pointId = "";
        if (record) { state.selections.siteId = text(record.siteId); state.selections.floorId = text(record.floorId); }
      } else if (type === "point") {
        state.selections.pointId = value;
        if (record) {
          state.selections.siteId = text(record.siteId);
          state.selections.floorId = text(record.floorId);
          state.selections.equipId = text(record.equipId);
        }
      }
      return record;
    }

    function edit(type, id) {
      var record = select(type, id);
      if (!record) throw new Error("未找到要编辑的记录");
      state.activeType = type;
      state.mode = "edit";
      state.edit = { type: type, id: record.id, original: record, draft: editDraft(type, record) };
      return state.edit;
    }

    function create(type) {
      prepare(type);
      if (!state.keys[type]) {
        var keyError = new Error(state.operation.message || "安全随机数不可用，无法创建记录");
        return Promise.reject(keyError);
      }
      var payload;
      try { payload = buildCreatePayload(type, state.drafts[type], state.selections, state.keys[type]); }
      catch (error) {
        state.operation = { status: "error", message: errorText(error), conflictId: null };
        return Promise.reject(error);
      }
      beginActivity();
      state.operation = { status: "working", message: "正在创建…", conflictId: null };
      return Promise.resolve().then(function () { return adapter.treeCreate(type, payload); }).then(function (result) {
        if (result && result.status === "conflict") {
          var conflict = new Error("名称或创建标识与现有记录冲突");
          conflict.conflictId = result.conflictId;
          throw conflict;
        }
        if (!result || ["created", "existing"].indexOf(result.status) < 0) {
          throw new Error("创建结果无法确认");
        }
        state.pendingMutation = { kind: "create", type: type, payload: payload, result: result };
        return refresh(false).then(function () {
          if (state.pendingMutation) throw markUnconfirmed("刷新后未找到相符记录");
          return result;
        }).catch(function (error) {
          if (error && error.unconfirmed) throw error;
          if (state.pendingMutation) throw markUnconfirmed("刷新失败：" + errorText(error));
          throw error;
        });
      }).catch(function (error) {
        if (!error || !error.unconfirmed) {
          state.operation = { status: "error", message: errorText(error), conflictId: error && error.conflictId || null };
        }
        throw error;
      }).finally(endActivity);
    }

    function update() {
      if (!state.edit) return Promise.reject(new Error("请先选择要编辑的记录"));
      var payload;
      try {
        payload = buildUpdatePayload(state.edit.type, state.edit.draft, state.edit.original);
        if (!Object.keys(payload).length) throw new Error("没有需要保存的更改");
      } catch (error) {
        state.operation = { status: "error", message: errorText(error), conflictId: null };
        return Promise.reject(error);
      }
      beginActivity();
      state.operation = { status: "working", message: "正在保存…", conflictId: null };
      return Promise.resolve().then(function () { return adapter.treeUpdate(state.edit.id, payload); }).then(function (result) {
        if (result && result.status === "conflict") {
          var conflict = new Error("名称与现有记录冲突");
          conflict.conflictId = result.conflictId;
          throw conflict;
        }
        if (!result || ["updated", "unchanged"].indexOf(result.status) < 0) throw new Error("保存结果无法确认");
        state.pendingMutation = { kind: "update", type: state.edit.type, id: state.edit.id, payload: payload, result: result };
        return refresh(false).then(function () {
          if (state.pendingMutation) throw markUnconfirmed("刷新后记录内容与本次保存不一致");
          return result;
        }).catch(function (error) {
          if (error && error.unconfirmed) throw error;
          if (state.pendingMutation) throw markUnconfirmed("刷新失败：" + errorText(error));
          throw error;
        });
      }).catch(function (error) {
        if (!error || !error.unconfirmed) {
          state.operation = { status: "error", message: errorText(error), conflictId: error && error.conflictId || null };
        }
        throw error;
      }).finally(endActivity);
    }

    return { state: state, refresh: refresh, prepare: prepare, select: select, edit: edit, create: create, update: update };
  }

  return {
    TYPES: TYPES,
    METRICS: METRICS,
    UPDATE_FIELDS: UPDATE_FIELDS,
    emptyDraft: emptyDraft,
    buildTreeModel: buildTreeModel,
    childrenFor: childrenFor,
    createKeyGenerator: createKeyGenerator,
    buildCreatePayload: buildCreatePayload,
    buildCreatePreview: buildCreatePreview,
    buildUpdatePayload: buildUpdatePayload,
    createTreeController: createTreeController,
  };
});
