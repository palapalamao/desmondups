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
  var translate = function (key) { return key; };

  function t(key, params) { return translate(key, params); }
  function setTranslator(fn) { translate = typeof fn === "function" ? fn : translate; }
  function messageDescriptor(key, params, detail) {
    return { key: key, params: params || {}, detail: detail === undefined || detail === null ? "" : String(detail) };
  }
  function renderMessageDescriptor(descriptor, translator) {
    if (!descriptor) return "";
    if (typeof descriptor === "string") return descriptor;
    var fn = typeof translator === "function" ? translator : t;
    var params = Object.assign({}, descriptor.params || {});
    if (descriptor.detailDescriptor) params.detail = renderMessageDescriptor(descriptor.detailDescriptor, fn);
    else if (descriptor.detail !== undefined) params.detail = descriptor.detail;
    return fn(descriptor.key, params);
  }
  function localizedError(key, params, detail) {
    var descriptor = messageDescriptor(key, params, detail);
    var error = new Error(renderMessageDescriptor(descriptor));
    error.i18nDescriptor = descriptor;
    error.rawDetail = detail;
    return error;
  }
  function descriptorFromError(error, fallbackKey) {
    if (error && error.i18nDescriptor) return error.i18nDescriptor;
    return messageDescriptor(fallbackKey, {}, String(error && error.message || error || t("common.unknownError")));
  }
  function operationState(status, descriptor, conflictId) {
    var operation = { status: status, messageDescriptor: descriptor || null, conflictId: conflictId || null };
    Object.defineProperty(operation, "message", {
      enumerable: true,
      get: function () { return renderMessageDescriptor(operation.messageDescriptor); },
    });
    return operation;
  }

  function text(value) { return value === undefined || value === null ? "" : String(value); }

  function emptyDraft(type) {
    if (type === "site") return { dis: "", navName: "", tz: "" };
    if (type === "floor") return { dis: "", navName: "" };
    if (type === "equip") return { dis: "", navName: "", make: "", model: "", serial: "", ratedKva: "" };
    if (type === "point") return { dis: "", navName: "", kind: "Number", unit: "", metric: "upsSocPct" };
    throw localizedError("tree.unsupportedType", { type: type });
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
      record.parentChain = [site ? site.dis : record.siteId || t("tree.unknownSite")];
    });
    model.equips.forEach(function (record) {
      var site = model.byId[record.siteId], floor = model.byId[record.floorId];
      record.parentChain = [site ? site.dis : record.siteId || t("tree.unknownSite"), floor ? floor.dis : record.floorId || t("tree.unknownFloor")];
    });
    model.points.forEach(function (record) {
      var site = model.byId[record.siteId], floor = model.byId[record.floorId], equip = model.byId[record.equipId];
      record.parentChain = [site ? site.dis : record.siteId || t("tree.unknownSite"), floor ? floor.dis : record.floorId || t("tree.unknownFloor"), equip ? equip.dis : record.equipId || t("tree.unknownEquip")];
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
      throw localizedError("tree.cryptoMissing");
    };
  }

  function required(value, labelKey) {
    var normalized = text(value).trim();
    if (!normalized) throw localizedError("tree.required", { label: t(labelKey) });
    return normalized;
  }

  function optional(payload, name, value) {
    if (value !== undefined && value !== null && text(value).trim() !== "") payload[name] = text(value).trim();
  }

  function numeric(value, labelKey) {
    var number = Number(value);
    if (text(value).trim() === "" || !Number.isFinite(number)) throw localizedError("tree.numeric", { label: t(labelKey) });
    return number;
  }

  function buildCreatePayload(type, draft, selections, key) {
    draft = draft || {};
    selections = selections || {};
    var payload = {
      dis: required(draft.dis, "tree.displayName"),
      navName: required(draft.navName, "tree.navigationName"),
    };
    if (type === "site") optional(payload, "tz", draft.tz);
    else {
      payload.siteRef = required(selections.siteId, "tree.parentSite");
      if (type === "equip" || type === "point") payload.floorRef = required(selections.floorId, "tree.parentFloor");
      if (type === "point") payload.equipRef = required(selections.equipId, "tree.parentEquip");
    }
    if (type === "equip") {
      optional(payload, "make", draft.make);
      optional(payload, "model", draft.model);
      optional(payload, "serial", draft.serial);
      if (text(draft.ratedKva).trim() !== "") payload.ratedKva = numeric(draft.ratedKva, "tree.ratedKva");
    }
    if (type === "point") {
      payload.kind = required(draft.kind, "tree.kind");
      payload.unit = required(draft.unit, "tree.unit");
      if (METRICS.indexOf(draft.metric) < 0) throw localizedError("tree.metricRequired");
      payload[draft.metric] = true;
    }
    payload.upsTreeKey = required(key, "tree.createKey");
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
    if (!UPDATE_FIELDS[type]) throw localizedError("tree.unsupportedType", { type: type });
    var payload = {};
    UPDATE_FIELDS[type].forEach(function (name) {
      var before = original[name] === undefined || original[name] === null
        ? (name === "ratedKva" ? null : "") : original[name];
      var after = draft[name] === undefined || draft[name] === null ? "" : draft[name];
      if (name === "ratedKva" && text(after).trim() === "") after = null;
      else if (name === "ratedKva") after = numeric(after, "tree.ratedKva");
      else if (typeof after === "string") after = after.trim();
      if (String(after) !== String(before)) payload[name] = after;
    });
    return payload;
  }

  function errorText(error) { return String(error && error.message || error || t("common.unknownError")); }

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
      operation: operationState("idle", null, null),
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
        var actual = record[name];
        if (name === "ratedKva" && pending.payload[name] === null) {
          return actual === undefined || actual === null || actual === "";
        }
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
        state.operation = operationState("success", messageDescriptor(pending.result.status === "existing" ? "tree.existingConfirmed" : "tree.created"));
      } else {
        if (!updateConfirmed(pending)) return false;
        var fresh = find(pending.type, pending.id);
        state.edit = { type: fresh.type, id: fresh.id, original: fresh, draft: editDraft(fresh.type, fresh) };
        state.operation = operationState("success", messageDescriptor(pending.result.status === "unchanged" ? "tree.unchanged" : "tree.saved"));
      }
      state.pendingMutation = null;
      return true;
    }

    function markUnconfirmed(detailDescriptor) {
      var descriptor = detailDescriptor
        ? { key: "tree.unconfirmedDetail", params: {}, detailDescriptor: detailDescriptor }
        : messageDescriptor("tree.unconfirmed");
      state.operation = operationState("error", descriptor);
      var error = new Error(renderMessageDescriptor(descriptor));
      error.i18nDescriptor = descriptor;
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
          if (!finalizePending()) markUnconfirmed(messageDescriptor("tree.recordMissingAfterRefresh"));
        } else if (clearOperationError && state.operation.status === "error") {
          state.operation = operationState("idle", null, null);
        }
        return state.tree;
      }).catch(function (error) {
        if (requestSequence === refreshSequence) state.treeError = descriptorFromError(error, "tree.readFailed");
        throw error;
      }).finally(endActivity);
    }

    function prepare(type) {
      if (TYPES.indexOf(type) < 0) throw localizedError("tree.unsupportedType", { type: type });
      state.activeType = type;
      state.mode = "create";
      state.edit = null;
      if (!state.keys[type]) {
        try { state.keys[type] = nextKey(); }
        catch (error) {
          state.operation = operationState("error", descriptorFromError(error, "tree.createFailed"));
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
      if (!record) throw localizedError("tree.editNotFound");
      state.activeType = type;
      state.mode = "edit";
      state.edit = { type: type, id: record.id, original: record, draft: editDraft(type, record) };
      return state.edit;
    }

    function create(type) {
      prepare(type);
      if (!state.keys[type]) {
        var keyError = localizedError("tree.cryptoMissing");
        return Promise.reject(keyError);
      }
      var payload;
      try { payload = buildCreatePayload(type, state.drafts[type], state.selections, state.keys[type]); }
      catch (error) {
        state.operation = operationState("error", descriptorFromError(error, "tree.createFailed"));
        return Promise.reject(error);
      }
      beginActivity();
      state.operation = operationState("working", messageDescriptor("tree.creating", { type: t("tree." + type) }));
      return Promise.resolve().then(function () { return adapter.treeCreate(type, payload); }).then(function (result) {
        if (result && result.status === "conflict") {
          var conflict = localizedError("tree.conflict");
          conflict.conflictId = result.conflictId;
          throw conflict;
        }
        if (!result || ["created", "existing"].indexOf(result.status) < 0) {
          throw localizedError("tree.createResultUnconfirmed");
        }
        state.pendingMutation = { kind: "create", type: type, payload: payload, result: result };
        return refresh(false).then(function () {
          if (state.pendingMutation) throw markUnconfirmed(messageDescriptor("tree.recordMissingAfterRefresh"));
          return result;
        }).catch(function (error) {
          if (error && error.unconfirmed) throw error;
          if (state.pendingMutation) throw markUnconfirmed(messageDescriptor("tree.refreshFailed", {}, errorText(error)));
          throw error;
        });
      }).catch(function (error) {
        if (!error || !error.unconfirmed) {
          state.operation = operationState("error", descriptorFromError(error, "tree.createFailed"), error && error.conflictId || null);
        }
        throw error;
      }).finally(endActivity);
    }

    function update() {
      if (!state.edit) return Promise.reject(localizedError("tree.selectEditFirst"));
      var payload;
      try {
        payload = buildUpdatePayload(state.edit.type, state.edit.draft, state.edit.original);
        if (!Object.keys(payload).length) throw localizedError("tree.noChangesToSave");
      } catch (error) {
        state.operation = operationState("error", descriptorFromError(error, "tree.updateFailed"));
        return Promise.reject(error);
      }
      beginActivity();
      state.operation = operationState("working", messageDescriptor("tree.saving"));
      return Promise.resolve().then(function () { return adapter.treeUpdate(state.edit.id, payload); }).then(function (result) {
        if (result && result.status === "conflict") {
          var conflict = localizedError("tree.conflict");
          conflict.conflictId = result.conflictId;
          throw conflict;
        }
        if (!result || ["updated", "unchanged"].indexOf(result.status) < 0) throw localizedError("tree.saveResultUnconfirmed");
        state.pendingMutation = { kind: "update", type: state.edit.type, id: state.edit.id, payload: payload, result: result };
        return refresh(false).then(function () {
          if (state.pendingMutation) throw markUnconfirmed(messageDescriptor("tree.recordMismatchAfterRefresh"));
          return result;
        }).catch(function (error) {
          if (error && error.unconfirmed) throw error;
          if (state.pendingMutation) throw markUnconfirmed(messageDescriptor("tree.refreshFailed", {}, errorText(error)));
          throw error;
        });
      }).catch(function (error) {
        if (!error || !error.unconfirmed) {
          state.operation = operationState("error", descriptorFromError(error, "tree.updateFailed"), error && error.conflictId || null);
        }
        throw error;
      }).finally(endActivity);
    }

    return { state: state, refresh: refresh, prepare: prepare, select: select, edit: edit, create: create, update: update };
  }

  return {
    setTranslator: setTranslator,
    messageDescriptor: messageDescriptor,
    renderMessageDescriptor: renderMessageDescriptor,
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
