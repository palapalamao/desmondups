"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const I18n = require(path.join(__dirname, "..", "frontend", "i18n.js"));
const core = require(path.join(__dirname, "..", "frontend", "app.js"));

function storage(initial) {
  const values = Object.assign({}, initial);
  const writes = [];
  return {
    values,
    writes,
    getItem(key) { return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : null; },
    setItem(key, value) { values[key] = String(value); writes.push([key, String(value)]); },
  };
}

const zhKeys = Object.keys(I18n.dictionaries["zh-CN"]).sort();
const enKeys = Object.keys(I18n.dictionaries["en-US"]).sort();
assert.deepStrictEqual(enKeys, zhKeys, "Chinese and English dictionaries must have identical keys");
assert.ok(zhKeys.length > 20, "dictionary must contain the application UI, not only switch labels");

assert.strictEqual(I18n.detectLanguage("en-GB", null), "en-US");
assert.strictEqual(I18n.detectLanguage("EN-us", null), "en-US");
assert.strictEqual(I18n.detectLanguage("zh-TW", null), "zh-CN");
assert.strictEqual(I18n.detectLanguage("fr-FR", null), "zh-CN");
assert.strictEqual(I18n.detectLanguage("en-US", "zh-CN"), "zh-CN");
assert.strictEqual(I18n.detectLanguage("zh-CN", "en-US"), "en-US");
assert.strictEqual(I18n.detectLanguage("en-US", "invalid"), "en-US");

const firstStorage = storage();
const first = I18n.create({ navigatorLanguage: "en-AU", storage: firstStorage, development: true });
assert.strictEqual(first.language(), "en-US");
assert.deepStrictEqual(firstStorage.writes, [], "browser detection must not persist an implicit choice");
assert.strictEqual(first.t("test.greeting", { name: "UPS-01" }), "Hello UPS-01");

const notifications = [];
const unsubscribe = first.subscribe(language => notifications.push(language));
assert.strictEqual(first.setLanguage("zh-CN"), true);
assert.strictEqual(first.setLanguage("zh-CN"), false, "setting the active language must be a no-op");
unsubscribe();
first.setLanguage("en-US");
assert.deepStrictEqual(notifications, ["zh-CN"]);
assert.deepStrictEqual(firstStorage.writes, [
  ["upsPod.language", "zh-CN"],
  ["upsPod.language", "en-US"],
]);

const restored = I18n.create({ navigatorLanguage: "zh-CN", storage: storage({ "upsPod.language": "en-US" }), development: true });
assert.strictEqual(restored.language(), "en-US", "stored explicit choice must override browser language");
assert.throws(() => restored.setLanguage("fr-FR"), /Unsupported language/);

const stamp = Date.UTC(2026, 0, 2, 3, 4, 5);
const zh = I18n.create({ navigatorLanguage: "zh-CN", storage: storage(), development: true });
const en = I18n.create({ navigatorLanguage: "en-US", storage: storage(), development: true });
assert.strictEqual(zh.formatTime(stamp), new Date(stamp).toLocaleTimeString("zh-CN"));
assert.strictEqual(en.formatTime(stamp), new Date(stamp).toLocaleTimeString("en-US"));

assert.throws(() => en.t("missing.everywhere"), /Missing translation: missing\.everywhere/);
const production = I18n.create({ navigatorLanguage: "en-US", storage: storage(), development: false });
const englishGreeting = I18n.dictionaries["en-US"]["test.greeting"];
delete I18n.dictionaries["en-US"]["test.greeting"];
try {
  assert.strictEqual(production.t("test.greeting", { name: "UPS-02" }), "你好 UPS-02",
    "production must fall back to the Chinese value");
} finally {
  I18n.dictionaries["en-US"]["test.greeting"] = englishGreeting;
}
assert.strictEqual(production.t("missing.everywhere"), "[missing.everywhere]");

const frontend = path.join(__dirname, "..", "frontend");
for (const file of ["index.html", "app.js", "project-context.js", "fin-api.js", "tree-ui.js"]) {
  const source = fs.readFileSync(path.join(frontend, file), "utf8")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "")
    .replaceAll("中文", "");
  assert.doesNotMatch(source, /[\u3400-\u9fff]/, `${file} contains untranslated product text`);
  for (const match of source.matchAll(/\bt\(["']([^"']+)["']/g)) {
    if (match[1].endsWith(".")) continue;
    assert.ok(Object.prototype.hasOwnProperty.call(I18n.dictionaries["zh-CN"], match[1]),
      `${file} references missing translation key ${match[1]}`);
  }
}

assert.strictEqual(typeof core.createAppRuntime, "function");
const switchI18n = I18n.create({ navigatorLanguage: "zh-CN", storage: storage(), development: true });
const banner = { textContent: "", attrs: {}, setAttribute(name, value) { this.attrs[name] = value; } };
const buttons = ["zh-CN", "en-US"].map(language => ({ attrs: { "data-language": language },
  getAttribute(name) { return this.attrs[name]; }, setAttribute(name, value) { this.attrs[name] = value; } }));
const fakeDocument = {
  documentElement: { lang: "" }, title: "",
  getElementById(id) { return id === "data-mode" ? banner : null; },
  querySelectorAll(selector) { return selector === "[data-language]" ? buttons : []; },
};
const fakeLocation = { hash: "#/ups/tree" };
const state = { filter: { site: "s:1" }, page: 3, draft: { dis: "Keep me" }, selection: "e:1" };
let rerenders = 0;
const calls = { load: 0, treeRead: 0, treeCreate: 0, treeUpdate: 0 };
const runtime = core.createAppRuntime({ document: fakeDocument, location: fakeLocation, i18n: switchI18n,
  adapter: { projectName: () => "mytest", load: () => calls.load++, treeRead: () => calls.treeRead++,
    treeCreate: () => calls.treeCreate++, treeUpdate: () => calls.treeUpdate++ },
  state, rerender: () => { rerenders++; } });
runtime.updateChrome();
assert.strictEqual(fakeDocument.documentElement.lang, "zh-CN");
assert.match(fakeDocument.title, /UPS/);
assert.match(banner.textContent, /mytest/);
const stateBefore = JSON.stringify(state), hashBefore = fakeLocation.hash;
assert.strictEqual(runtime.setLanguage("en-US"), true);
assert.strictEqual(fakeDocument.documentElement.lang, "en-US");
assert.match(fakeDocument.title, /Fleet/);
assert.match(banner.textContent, /Current project: mytest/);
assert.strictEqual(buttons[1].attrs["aria-pressed"], "true");
assert.strictEqual(fakeLocation.hash, hashBefore);
assert.strictEqual(JSON.stringify(state), stateBefore);
assert.deepStrictEqual(calls, { load: 0, treeRead: 0, treeCreate: 0, treeUpdate: 0 });
assert.strictEqual(rerenders, 1);

console.log("PASS TC-I18N-01 dictionary parity, detection, persistence, interpolation, formatting and missing-key behavior");
console.log("PASS TC-I18N-05 language switch updates chrome without navigation, refetch, or state reset");
