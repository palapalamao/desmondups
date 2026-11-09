# UPS POD Bilingual UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add complete Simplified Chinese and English switching to every UPS POD UI state, with browser-language detection and persisted user preference, while preserving all Folio and mutation boundaries.

**Architecture:** Add a dependency-free UMD `i18n.js` module that owns dictionaries, detection, persistence, interpolation and locale formatting. Inject its translator into the existing application, FIN API and device-tree modules; make the Ractive template key-driven and rerender the current in-memory view on language changes without routing or data requests. Use static bilingual labels for the parent FIN menu because dynamic `finStackMobileMenu` locale resolution is not verified for FIN 5.3.

**Tech Stack:** Browser JavaScript (UMD), Ractive 1.4, Node.js contract tests, Trio menu resource, Fantom POD build.

---

## File map

- Create `extensions/upsPod/frontend/i18n.js`: dictionaries, language selection, persistence, translation and formatting.
- Create `extensions/upsPod/test/verifyI18n.cjs`: unit and production-text coverage tests.
- Modify `extensions/upsPod/frontend/index.html`: translation keys, persistent switch and script order.
- Modify `extensions/upsPod/frontend/app.js`: language lifecycle, translated view models and no-refetch rerender.
- Modify `extensions/upsPod/frontend/project-context.js`: injected translator for fail-closed project discovery errors.
- Modify `extensions/upsPod/frontend/fin-api.js`: injected translator for session, HTTP, Zinc and Axon errors.
- Modify `extensions/upsPod/frontend/tree-ui.js`: injected translator for validation and operation messages.
- Modify `extensions/upsPod/frontend/styles.css`: compact accessible language switch styles.
- Modify `extensions/upsPod/lib/menu.trio`: static bilingual FIN shell labels.
- Modify `extensions/upsPod/test/verify.cjs`, `verifyFinApi.cjs`, `verifyTreeUi.cjs`, `verifyRegistration.fan`: bilingual behavior and packaging assertions.
- Modify `extensions/upsPod/test/verifyMenu.fan`: inspect the explicitly built POD instead of the installed POD.
- Modify `scripts/check-all.cjs` only if required to invoke the new i18n contract test; otherwise keep the current six red-line checks unchanged and run `verifyI18n.cjs` explicitly.

### Task 1: Translation core

**Files:**
- Create: `extensions/upsPod/frontend/i18n.js`
- Create: `extensions/upsPod/test/verifyI18n.cjs`

- [ ] **Step 1: Write failing translation-core tests**

Test the public contract:

```js
const I18n = require("../frontend/i18n.js");
assert.deepStrictEqual(Object.keys(I18n.dictionaries["zh-CN"]).sort(),
  Object.keys(I18n.dictionaries["en-US"]).sort());
assert.strictEqual(I18n.detectLanguage("en-GB", null), "en-US");
assert.strictEqual(I18n.detectLanguage("zh-TW", null), "zh-CN");
assert.strictEqual(I18n.detectLanguage("en-US", "zh-CN"), "zh-CN");
```

Use a fake storage object to verify only `setLanguage()` persists, reloads reuse the stored value, invalid stored values are ignored, parameter substitution works and one change notification fires per actual language change. Assert `formatTime()` uses `zh-CN` versus `en-US` locale formatting.

Define and test missing-key behavior through `create({ development })`: in development/tests, `t()` throws `Missing translation: <key>` when the active dictionary lacks a key; in production, it returns the matching Chinese value when English is missing, and returns a visible `[<key>]` marker only when neither dictionary contains the key.

- [ ] **Step 2: Run the new test and confirm the missing-module failure**

Run: `node extensions/upsPod/test/verifyI18n.cjs`

Expected: FAIL because `frontend/i18n.js` does not exist.

- [ ] **Step 3: Implement the dependency-free UMD module**

Expose:

```js
{
  dictionaries,
  detectLanguage(navigatorLanguage, storedLanguage),
  create({ navigatorLanguage, storage, storageKey, development }),
}
```

Each created instance exposes `language()`, `t(key, params)`, `setLanguage(language)`, `subscribe(listener)` and `formatTime(timestamp)`. Normalize only `en*` to `en-US`; all other browser languages fall back to `zh-CN`. Persist only an explicit `setLanguage` call. `development` defaults to `true` so missing keys fail visibly; production boot explicitly passes `development: false`. Escape nothing in the translation layer; callers continue to use text nodes or Ractive-escaped interpolation.

- [ ] **Step 4: Populate both complete dictionaries**

Include semantic keys for document chrome, overview, unit detail, history/data-gap, unavailable routes, device-tree navigation/forms/previews, validation, operation outcomes, FIN API errors and accessibility labels. Keep Folio values outside the dictionaries.

- [ ] **Step 5: Run translation-core tests**

Run: `node extensions/upsPod/test/verifyI18n.cjs`

Expected: PASS for dictionary parity, detection, persistence, interpolation, locale-specific time formatting, notifications and both missing-key modes.

- [ ] **Step 6: Commit**

```powershell
git add extensions/upsPod/frontend/i18n.js extensions/upsPod/test/verifyI18n.cjs
git commit -m "feat: add UPS POD translation core"
```

### Task 2: Translate JavaScript-generated messages

**Files:**
- Modify: `extensions/upsPod/frontend/fin-api.js`
- Modify: `extensions/upsPod/frontend/project-context.js`
- Modify: `extensions/upsPod/frontend/tree-ui.js`
- Modify: `extensions/upsPod/frontend/app.js`
- Modify: `extensions/upsPod/test/verifyFinApi.cjs`
- Modify: `extensions/upsPod/test/verifyTreeUi.cjs`
- Modify: `extensions/upsPod/test/verify.cjs`

- [ ] **Step 1: Add failing English-message tests**

Configure each module with an English `t` function and assert representative failures:

- expired FIN login and malformed Zinc;
- missing, malformed and conflicting same-origin FIN project contexts;
- missing display name, unsupported metric and invalid capacity;
- create conflict, unconfirmed mutation and refresh failure;
- malformed route, missing project context and unavailable history/detail.

Also assert raw server details and Folio record names are preserved verbatim and not passed through translation lookup.

- [ ] **Step 2: Run focused tests and confirm they fail with Chinese output**

Run:

```powershell
node extensions/upsPod/test/verifyFinApi.cjs
node extensions/upsPod/test/verifyTreeUi.cjs
node extensions/upsPod/test/verify.cjs
```

Expected: new English assertions FAIL while existing behavior remains green.

- [ ] **Step 3: Add explicit translator injection**

Each module exposes `setTranslator(fn)` and internally calls a small `t(key, params)` wrapper. The browser configures `ProjectContext`, `FinApi`, `TreeUi` and the app core from the same i18n instance before the first API request. Tests configure Chinese or English explicitly; modules do not read browser globals or storage themselves.

- [ ] **Step 4: Replace product-owned message literals with keys**

Keep stable technical tokens such as `fin-stack-auth`, `Zinc Grid`, Axon function names, record IDs and raw response details unchanged. Preserve `textContent`/Ractive rendering for external details.

Do not persist already-localized strings in application/controller state. Store message descriptors such as `{ key, params, detail }` for poll failures, fatal errors and every tree operation state (working, success, conflict, unconfirmed, validation, refresh and generic API failure). Keep raw external detail in `detail`; translate the descriptor only when building the current rendered view. Thrown errors may expose a current-language `message` for callers but must also retain `i18nKey`, `i18nParams` and `rawDetail` so stored UI state can be rendered again after a language switch.

- [ ] **Step 5: Run focused tests**

Expected: all three test files PASS in both language paths. Add pure descriptor assertions through an exported `renderMessageDescriptor(descriptor, t)` helper for a poll failure, tree success, conflict, unconfirmed result, generic operation error and API error with raw detail. The same descriptor must produce the correct Chinese and English prefix while raw detail stays byte-for-byte equivalent. Actual visible switching and Ractive escaping are tested after the runtime seam exists in Task 3.

- [ ] **Step 6: Commit**

```powershell
git add extensions/upsPod/frontend/app.js extensions/upsPod/frontend/project-context.js extensions/upsPod/frontend/fin-api.js extensions/upsPod/frontend/tree-ui.js extensions/upsPod/test/verify.cjs extensions/upsPod/test/verifyFinApi.cjs extensions/upsPod/test/verifyTreeUi.cjs
git commit -m "feat: translate UPS POD runtime messages"
```

### Task 3: Translate every rendered UI state and add the switch

**Files:**
- Modify: `extensions/upsPod/frontend/index.html`
- Modify: `extensions/upsPod/frontend/app.js`
- Modify: `extensions/upsPod/frontend/styles.css`
- Modify: `extensions/upsPod/test/verifyI18n.cjs`
- Modify: `extensions/upsPod/test/verifyTreeUi.cjs`

- [ ] **Step 1: Add failing template-coverage and rendering tests**

Parse the production Ractive template and render these states in both languages: loading; overview with and without units; all filter, pagination, severity and freshness variants; unit detail and missing-unit detail; history gap and missing-unit history; alarms, configuration and audit unavailable routes separately; generic invalid route; all four conditional tree create forms; tree edit; tree read error; operation success, conflict, unconfirmed and generic error; startup fatal; and the data-source banner. Assert that product-owned Chinese text is absent from English output and key English labels are present.

Render hostile external values such as `<img src=x onerror=alert(1)>` as a Folio name and raw server detail. Assert output is escaped while the text meaning is preserved.

Add a production-source scan allowing Chinese only inside `i18n.js`, comments and the visible language name `中文`. Fail on untranslated Han text in `index.html`, `app.js`, `project-context.js`, `fin-api.js` or `tree-ui.js`.

- [ ] **Step 2: Run tests and confirm untranslated-template failures**

Run:

```powershell
node extensions/upsPod/test/verifyI18n.cjs
node extensions/upsPod/test/verifyTreeUi.cjs
```

Expected: FAIL on current fixed Chinese template text.

- [ ] **Step 3: Convert the template to semantic keys**

Load `i18n.js` before `project-context.js`, `fin-api.js`, `tree-ui.js` and `app.js`. Pass `t` and `lang` into Ractive data. Replace all headings, labels, buttons, options, placeholders, aria labels, notices, status/freshness labels and pagination text with `t(...)` expressions.

- [ ] **Step 4: Extract a testable browser runtime and add the persistent switch**

Move browser lifecycle wiring behind an exported `createAppRuntime({ document, location, adapter, Ractive, i18n, timers })` factory while keeping the current pure `upsCore` exports. Production `boot()` creates the i18n instance with `development: false` and constructs this runtime from browser globals. The factory owns title/banner updates, descriptor translation, Ractive state and language switching; it must not own or alter the adapter's Folio semantics.

Add a two-button control that is visible on every route. On selection:

1. call `i18n.setLanguage(language)`;
2. update `document.documentElement.lang`, document title and the data-source banner;
3. set the Ractive `lang` dependency and rebuild only the current in-memory view model;
4. do not call `adapter.load`, `treeRead`, change `location.hash`, or reset drafts/selections.

Use `aria-pressed`, visible keyboard focus and a short localized accessible label. Add only the CSS needed to place the control within the existing industrial visual system and maintain the existing mobile breakpoint.

- [ ] **Step 5: Add a no-refetch switch test**

Instantiate `createAppRuntime` with fake document/location/timers, Ractive and a spying adapter. Render overview and tree routes, switch twice, and assert `load`, `treeRead`, `treeCreate` and `treeUpdate` counts and `location.hash` are unchanged while visible text, title, banner and `document.lang` change. Capture and compare tree drafts, selections, edit mode, pending mutation, overview filter and page state before and after switching. Repeat while each stored poll/error/operation descriptor listed in Task 2 is visible to prove old localized strings cannot survive a switch.

- [ ] **Step 6: Run focused UI tests**

Expected: `verifyI18n.cjs` and `verifyTreeUi.cjs` PASS, including all bilingual states and no-refetch behavior.

- [ ] **Step 7: Commit**

```powershell
git add extensions/upsPod/frontend/index.html extensions/upsPod/frontend/app.js extensions/upsPod/frontend/styles.css extensions/upsPod/test/verifyI18n.cjs extensions/upsPod/test/verifyTreeUi.cjs
git commit -m "feat: add bilingual UPS POD interface"
```

### Task 4: FIN menu and POD packaging

**Files:**
- Modify: `extensions/upsPod/lib/menu.trio`
- Modify: `extensions/upsPod/test/verifyRegistration.fan`
- Modify: `extensions/upsPod/test/verifyMenu.fan`
- Modify: `extensions/upsPod/test/verifyI18n.cjs`

- [ ] **Step 1: Add failing packaging and menu assertions**

Require `/frontend/i18n.js` in the built POD. Change `verifyMenu.fan` to accept `<built-upsPod.pod>`, open that archive explicitly, parse `/lib/menu.trio`, and never call `Pod.find("upsPod")`. Assert the divider and each user-visible `displayName` have concise Chinese/English labels and existing routes, app IDs, order and icons are unchanged.

- [ ] **Step 2: Run tests and confirm failures**

First build the current pre-menu source so the red test inspects a fresh artifact, then run:

```powershell
fan extensions/upsPod/build.fan
node extensions/upsPod/test/verifyI18n.cjs
fan extensions/upsPod/test/verifyMenu.fan extensions/upsPod/output/upsPod.pod
fan extensions/upsPod/test/verifyRegistration.fan extensions/upsPod/output/upsPod.pod
```

Expected: the fresh built-artifact checks FAIL specifically for missing bilingual labels and/or `i18n.js`, not for a missing or installed stale POD.

- [ ] **Step 3: Update only menu display text**

Use compact labels such as `UPS 总览 / Overview`, `设备详情 / Details`, `历史趋势 / History`, `告警 / Alarms`, `配置 / Configuration`, `审计 / Audit`, and `设备树 / Device Tree`. Do not change any route or action.

- [ ] **Step 4: Build and verify the POD**

Run:

```powershell
fan extensions/upsPod/build.fan
$pod = (Resolve-Path extensions/upsPod/output/upsPod.pod).Path
fan extensions/upsPod/test/verifyRegistration.fan $pod
fan extensions/upsPod/test/verifyMenu.fan $pod
```

Expected: BUILD SUCCESS, registration PASS with `i18n.js` present, and menu PASS against the same explicit artifact.

- [ ] **Step 5: Commit**

```powershell
git add extensions/upsPod/lib/menu.trio extensions/upsPod/test/verifyRegistration.fan extensions/upsPod/test/verifyMenu.fan extensions/upsPod/test/verifyI18n.cjs
git commit -m "feat: add bilingual UPS POD menu labels"
```

### Task 5: Full regression and delivery

**Files:**
- Modify only if a failing check identifies a requirement-related defect.

- [ ] **Step 1: Build the exact source state that all artifact checks will inspect**

```powershell
fan extensions/upsPod/build.fan
```

Expected: BUILD SUCCESS.

- [ ] **Step 2: Run all frontend and boundary checks**

```powershell
node extensions/upsPod/test/verifyI18n.cjs
node extensions/upsPod/test/verify.cjs
node extensions/upsPod/test/verifyFinApi.cjs
node extensions/upsPod/test/verifyTreeContract.cjs
node extensions/upsPod/test/verifyTreeUi.cjs
node scripts/check/pod-check-utils.test.cjs
node scripts/check-all.cjs extensions/upsPod/output/upsPod.pod
fan extensions/upsPod/test/verifyRegistration.fan (Resolve-Path extensions/upsPod/output/upsPod.pod).Path
fan extensions/upsPod/test/verifyMenu.fan (Resolve-Path extensions/upsPod/output/upsPod.pod).Path
```

Expected: every command PASS and red-line checks report 6/6.

- [ ] **Step 3: If any source or test changed during verification, rebuild and rerun the entire Step 2 suite**

```powershell
fan extensions/upsPod/build.fan
node extensions/upsPod/test/verifyI18n.cjs
node extensions/upsPod/test/verify.cjs
node extensions/upsPod/test/verifyFinApi.cjs
node extensions/upsPod/test/verifyTreeContract.cjs
node extensions/upsPod/test/verifyTreeUi.cjs
node scripts/check/pod-check-utils.test.cjs
node scripts/check-all.cjs extensions/upsPod/output/upsPod.pod
fan extensions/upsPod/test/verifyRegistration.fan (Resolve-Path extensions/upsPod/output/upsPod.pod).Path
fan extensions/upsPod/test/verifyMenu.fan (Resolve-Path extensions/upsPod/output/upsPod.pod).Path
git diff --check
```

Expected: the complete frontend, boundary, red-line, registration and menu suite PASS against the rebuilt POD; no whitespace errors. Repeat until a full run completes with no subsequent source or test changes. If no source or test changed after Step 2, do not repeat identical checks; run only `git diff --check`.

- [ ] **Step 4: Verify change isolation**

Inspect `git status --short` and `git diff --stat`. Confirm no Folio backend, Axon mutation allowlist, deployment script, simulator boundary or generated output is committed by this feature.

- [ ] **Step 5: Commit all final source and test adjustments, verify isolation, then push the feature branch**

Stage every intentional bilingual-feature source/test change created by the verification loop and commit it. Re-run `git status --short` to confirm no intended feature change is left uncommitted and generated output remains untracked.

```powershell
git push origin codex/ups-pod-folio-boundary
```

Expected: remote branch resolves to the same final commit as local HEAD.

Live FIN deployment remains a separate operation and must not be inferred from a successful local build.
