# upsNew Figma + Tailwind UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current upsNew interface with a production UI that matches the approved UPS Fleet Monitor prototype, defaults to a light theme with a persistent dark-theme option, and renders real FIN current and historical data.

**Architecture:** Keep the existing Fantom/Axon service boundary and framework-free browser client. Normalize the Xeto/Trio contracts first, expose deterministic read APIs, then build a small set of testable browser modules for point selection, history processing, theme persistence, API access, and page rendering. Tailwind CSS v4 is compiled locally into the POD; Figma contains the matching token and component system.

**Tech Stack:** FIN 5.3, Fantom, Axon, Xeto/Trio, Haystack 3, haystack-nclient, haystack-core, Tailwind CSS 4.3 CLI, esbuild, Node built-in test runner, Figma Plugin API.

**Reference spec:** `docs/superpowers/specs/2026-09-21-upsnew-figma-tailwind-ui-design.md`

**Repository note:** `D:\mygithub\desmodUPS2.0` has no `.git` directory. Worktree and commit steps cannot run here; after each task, preserve the listed verification evidence and file hashes instead of claiming a commit.

---

## File Structure

### Create

- `ui-src/styles.css` — Tailwind import, light/dark design tokens, prototype-specific component layer.
- `ui-src/theme.js` — theme validation, persistence, DOM application, theme-color handling.
- `ui-src/point-schema.js` — deterministic semantic point selectors and field metadata.
- `ui-src/history.js` — range validation, history parsing, statistics and display downsampling.
- `ui-src/api.js` — FIN/Axon calls and response normalization.
- `ui-src/alarm-controller.js` — testable alarm acknowledgement and conflict/permission behavior.
- `ui-src/chart.js` — SVG sparkline and history chart rendering without business data.
- `ui-src/test/theme.test.js` — theme behavior tests.
- `ui-src/test/point-schema.test.js` — semantic matching and ambiguity tests.
- `ui-src/test/history.test.js` — range, statistics and downsampling tests.
- `ui-src/test/api.test.js` — expression generation and stale-response tests.
- `ui-src/test/alarm-controller.test.js` — acknowledgement conflict and permission tests.
- `ui-src/scripts/copy-fonts.mjs` — copy required IBM Plex WOFF2 assets into the POD UI.
- `ui/fonts/` — packaged IBM Plex Sans and IBM Plex Mono font files.
- `docs/design/figma-upsNew.md` — Figma URL, file key, frame IDs and token mapping.

### Modify

- `lib/ups/tags.xeto` — canonical alarm/assessment and observation tags.
- `lib/ups/points.xeto` — dedicated semantic markers required by the UI.
- `lib/ups/assessment.xeto` — alarm version, health score and recommendation due date.
- `trio/ups-defs.trio` — FIN 5.3 definitions matching Xeto.
- `fan/engine/UpsApplicationService.fan` — canonical alarm filtering, point observation metadata, assessment/risk/recommendation reads.
- `fan/domain/Alarm.fan` — canonical alarm states and transitions.
- `fan/axon/UpsNewLib.fan` — add read-only risk and recommendation Axon functions.
- `fan/api/ApiCatalog.fan` — add matching read routes.
- `fan/test/UpsDomainTest.fan` — contract and UI resource tests.
- `scripts/seed-upsNew-device-tree.axon` — device-tree-only demo records for all required semantics and histories.
- `scripts/verify-upsNew-fin.axon` — read-only FIN verification for hierarchy, semantics, current values and histories.
- `ui-src/package.json` and `ui-src/package-lock.json` — Tailwind, IBM Plex and test/build scripts.
- `ui-src/app.js` — page state, polling, event handling and rendering orchestration.
- `ui/index.html` — prototype-aligned semantic shell and first-paint theme bootstrap.
- `ui/styles.css` — generated Tailwind output.
- `ui/app.js` — generated esbuild output.
- `build.fan` — version bump and unchanged UI resource packaging.
- `README.md` and `ui/README.md` — build, theme, history and deployment instructions.

### Remove

- `ui/live-data.css` — superseded by compiled Tailwind output.

---

### Task 1: Lock Canonical FIN Semantic Contracts

**Files:**
- Modify: `lib/ups/tags.xeto`
- Modify: `lib/ups/points.xeto`
- Modify: `lib/ups/assessment.xeto`
- Modify: `trio/ups-defs.trio`
- Test: `fan/test/UpsDomainTest.fan`
- Test: `fan/test/UpsTrioTest.fan`

- [ ] **Step 1: Add failing contract assertions**

Assert the packaged definitions contain `upsBatteryTemp`, `upsChargeCurrent`, `upsLoadPower`, `upsVoltage`, `upsFrequency`, `upsThd`, `upsAmbientTemp`, `upsHumidity`, `upsTransferStatus`, `upsTransferDuration`, `upsLastTransferAt`, `upsObservedAt`, `upsAlarmVersion`, `upsHealthScore`, and recommendation `dueDate`.

- [ ] **Step 2: Run the POD tests and confirm failure**

Run:

```powershell
$env:FAN_ENV_PATH=(Resolve-Path 'build').Path
& 'C:\Program Files (x86)\FIN\FIN 5.3.0.2761\bin\fan.bat' build.fan clean compile
& 'C:\Program Files (x86)\FIN\FIN 5.3.0.2761\bin\fant.bat' test -pod upsNew
```

Expected: semantic contract assertions fail because the dedicated tags do not exist.

- [ ] **Step 3: Add the minimum Xeto and Trio definitions**

Keep standard Haystack tags alongside the dedicated UPS markers, but make the dedicated markers the UI selection contract. Add `upsAlarmVersion: Int`, `upsHealthScore: Number<0..100>`, `upsObservedAt: DateTime`, and optional recommendation `dueDate: Date`.

- [ ] **Step 4: Rebuild and run the tests**

Expected: all semantic resource parsing and contract assertions pass.

- [ ] **Step 5: Record checkpoint evidence**

Save the build/test result and SHA-256 hashes of the four changed contract files. Git commit is unavailable in this directory.

### Task 2: Normalize Alarm, Assessment and Observation Services

**Files:**
- Modify: `fan/engine/UpsApplicationService.fan`
- Modify: `fan/domain/Alarm.fan`
- Modify: `fan/axon/UpsNewLib.fan`
- Modify: `fan/api/ApiCatalog.fan`
- Modify: `fan/test/UpsDomainTest.fan`

- [ ] **Step 1: Add failing service contract tests**

Test that:

- active alarms use `upsAlarmRecord`, `subjectRef`, `upsRiskLevel`, canonical states and `upsAlarmVersion`;
- `activeAlarms({equipRef})` filters by `subjectRef`;
- transitions accept `open → acknowledged → inProgress → resolved → closed`;
- latest assessment uses `subjectRef` and `calculatedAt`;
- risk items and recommendations have read-only Axon interfaces;
- point rows expose `upsObservedAt` and quality fields without substituting `mod`.

- [ ] **Step 2: Run tests and confirm the legacy-name failures**

Expected: failures mention `upsAlarm`, `equipRef`, `pendingAck`, `upsAssetRef` or missing Axon methods.

- [ ] **Step 3: Implement canonical service reads and transitions**

Update `Alarm.fan` first so its enum, default state, transition methods and close precondition use `open → acknowledged → inProgress → resolved → closed`. Then update service filters and state names, require the version field, add `assessmentRiskItems(assessmentRef)` and `riskRecommendations(riskItemRef)`, and keep all new functions read-only.

Normalize the primary battery group in `upsEquipSummary(equipRef)`: find `upsBatteryGroup and equipRef==equipRef`, prefer the single `primary` record, accept a sole unmarked record, and merge display-only `upsBatteryGroupRef` and `upsCellCount` into the returned summary. Multiple unmarked groups leave those fields absent and add `upsSummaryWarning:"MULTIPLE_BATTERY_GROUPS"`. Add focused tests for all four cases.

- [ ] **Step 4: Update Axon and REST catalogs**

Add `upsAssessmentRiskItems` and `upsRiskRecommendations`; update the expected Axon method list and REST route count.

- [ ] **Step 5: Run focused and full POD tests**

Expected: alarm lifecycle, filter, assessment, API catalog and full pod tests pass.

### Task 3: Provision Complete Device-Tree Demo Data

**Files:**
- Modify: `scripts/seed-upsNew-device-tree.axon`
- Create: `scripts/verify-upsNew-fin.axon`

- [ ] **Step 1: Extend verification before seed changes**

Require three Equip records, every Equip and Point to have `siteRef` and `floorRef`, all required semantic point types, `upsObservedAt`, current values, and history for numeric trend points.

- [ ] **Step 2: Run verification against `mytest` and capture the expected missing-tag failures**

- [ ] **Step 3: Extend the idempotent seed**

Create device-tree records for the complete UI contract, including one primary `upsBatteryGroup` with `upsCellCount` per Equip. Keep all values in FIN Folio/history; do not add values to Fantom or browser code. Mark seed records `upsDemo` and `upsDataSource:"simulated"` so they remain excluded from production assessment logic.

- [ ] **Step 4: Execute seed and verification through FIN Expert**

Call `fin_live_list_connections`, select the registered `mytest` connection, and run its connection validation/test operation before any mutation. Execute the seed once, execute `verify-upsNew-fin.axon`, execute the seed a second time, then execute the verification again and compare record counts. Expected: the second seed creates no duplicates; all required records and histories verify successfully. If any mutation returns `outcome_unknown`, stop mutation retries and use read-only queries to determine the resulting state.

### Task 4: Create the Figma Design System and Approved Screens

**Files:**
- Create: `docs/design/figma-upsNew.md`

- [ ] **Step 1: Load the required Figma skills**

Use `figma:figma-create-new-file`, `figma:figma-use`, `figma:figma-generate-design`, and `figma:figma-generate-library` before the matching Figma tools.

- [ ] **Step 2: Identify the authenticated Figma plan and create the file**

Create `upsNew — UPS Fleet Monitor`. If exactly one writable plan is returned, use it; if several plans are returned, request the plan choice before creating the external file.

- [ ] **Step 3: Build Foundations and components**

In the new blank file, first create local light/dark variables, text/effect styles and reusable components/variant sets; only then assemble screens from component instances. Create device tabs, badges, buttons, health ring, panels, trends, alarm rows, history controls and state components with Auto Layout. Every `use_figma` call must include the required `skillNames`, return all created or mutated node IDs, and handle only one major section.

- [ ] **Step 4: Build four primary frames**

Create Desktop Light `1440×1800`, Desktop Dark `1440×1800`, Mobile Light `390×1600`, and Mobile Dark `390×1600`, plus desktop/mobile history-detail states. Preserve prototype anchors and panel order.

- [ ] **Step 5: Validate each frame visually**

Capture screenshots after each major section and again for the whole frame; correct clipped text, overflow, wrong font, theme contrast and component inconsistencies before continuing.

- [ ] **Step 6: Record handoff metadata**

Write the Figma URL, file key, frame IDs and exact Figma-variable-to-Tailwind-token mapping in `docs/design/figma-upsNew.md`.

### Task 5: Add Tailwind and Local Font Build

**Files:**
- Modify: `ui-src/package.json`
- Modify: `ui-src/package-lock.json`
- Create: `ui-src/styles.css`
- Create: `ui-src/scripts/copy-fonts.mjs`
- Create: `ui/fonts/*`
- Generate: `ui/styles.css`
- Remove: `ui/live-data.css`

- [ ] **Step 1: Add a failing build check**

Add scripts `build:css`, `build:fonts`, `build:js`, `build`, and `test`. The build check must verify `ui/styles.css` and the required WOFF2 files exist.

- [ ] **Step 2: Install pinned build dependencies**

Run in `ui-src`:

```powershell
npm install --save-dev tailwindcss@4.3.0 @tailwindcss/cli@4.3.0
npm install @fontsource/ibm-plex-sans @fontsource/ibm-plex-mono
```

- [ ] **Step 3: Define tokens and component layer**

Use `@import "tailwindcss"`, an explicit source path for `index.html` and JavaScript, Figma-matched light/dark CSS variables, `color-scheme`, prototype grid background, and reduced-motion rules.

- [ ] **Step 4: Copy only required font weights**

Package IBM Plex Sans 400/500/600/700 and IBM Plex Mono 400/500/600 WOFF2 assets. Do not load Google Fonts or any runtime CDN.

- [ ] **Step 5: Run the full UI build**

Expected: static `ui/styles.css`, `ui/app.js`, and local fonts exist; `index.html` has no Tailwind or font CDN.

### Task 6: Implement Theme, Point Mapping and History Utilities Test-First

**Files:**
- Create: `ui-src/theme.js`
- Create: `ui-src/point-schema.js`
- Create: `ui-src/history.js`
- Test: `ui-src/test/theme.test.js`
- Test: `ui-src/test/point-schema.test.js`
- Test: `ui-src/test/history.test.js`

- [ ] **Step 1: Write failing theme tests**

Cover default light, saved dark, invalid-value fallback, persistence, root `data-theme`, `color-scheme`, and theme-color selection.

- [ ] **Step 2: Write failing point selection tests**

Cover zero/one/multiple matches, `primary` priority, stable sorting, strict unit matching and no display-name fallback.

- [ ] **Step 3: Write failing history tests**

Cover 24h/7d/30d/custom validation, 366-day limit, `[start,end)`, finite-number statistics, quality filtering, strict unit compatibility, empty data and maximum 600 display points while retaining extrema.

- [ ] **Step 4: Run `npm test` and confirm failures**

- [ ] **Step 5: Implement the pure utility modules**

Keep modules independent of DOM and network except `applyTheme`, which receives its storage/document dependencies for testing.

- [ ] **Step 6: Run tests and confirm all utility tests pass**

### Task 7: Implement FIN API Client and Stale-Response Protection

**Files:**
- Create: `ui-src/api.js`
- Create: `ui-src/alarm-controller.js`
- Test: `ui-src/test/api.test.js`
- Test: `ui-src/test/alarm-controller.test.js`

- [ ] **Step 1: Write failing API expression tests**

Verify escaped refs, canonical alarm filters, history spans generated by Haystack values, risk/recommendation reads, and no unescaped user text in Axon expressions.

- [ ] **Step 2: Write failing request-generation tests**

Resolve two device/history requests out of order and assert only the newest generation can update state.

- [ ] **Step 3: Write failing alarm controller tests**

Inject acknowledgement and reload functions. Assert `UPS-3002` reloads alarms only for the current Equip, reports “记录已变化”, restores the button state and never retries acknowledgement. Assert a permission rejection restores the button and exposes the server-provided permission message.

- [ ] **Step 4: Implement the API wrapper and alarm controller**

Expose project bootstrap, hierarchy reads, current reads, history reads, alarm acknowledgement and generation guards. Use `Promise.allSettled` for multi-point history. Keep acknowledgement behavior in `alarm-controller.js` so the conflict and permission paths run without DOM dependencies.

- [ ] **Step 5: Run API and complete UI tests**

Expected: all Node tests pass without a FIN server.

### Task 8: Rebuild the Production UI to Match the Prototype

**Files:**
- Modify: `ui/index.html`
- Modify: `ui-src/app.js`
- Create: `ui-src/chart.js`
- Generate: `ui/app.js`
- Generate: `ui/styles.css`

- [ ] **Step 1: Replace legacy five-page structure assertions**

Update `UpsDomainTest` to require prototype anchors: header, fleet tabs, Hero, six ordered panels, alarm section, history dialog and theme toggle.

- [ ] **Step 2: Run POD tests and confirm the old UI fails the new structure**

- [ ] **Step 3: Add the first-paint theme bootstrap and semantic shell**

Default to light before stylesheet paint, restore only valid saved values, provide skip link, live status region and correctly labelled controls.

- [ ] **Step 4: Render real hierarchy and selected-device data**

Map all fields through `point-schema.js`; show “未配置” for missing data; never synthesize a value. Preserve the prototype order, density and typography.

- [ ] **Step 5: Render real Sparkline and history detail**

Use SVG paths derived from `upsPointHistory`. Add 24h/7d/30d/custom range controls, unit-compatible comparison, stats, partial failures, keyboard data summaries, Escape close and focus restoration.

- [ ] **Step 6: Add polling and visibility handling**

Implement 15s points, 30s alarms, 60s Sparkline, 5m hierarchy/assessment refresh, pause while hidden, immediate refresh on visibility restore, and no local-clock data timestamp.

- [ ] **Step 7: Add canonical alarm acknowledgement**

Only open alarms show the action. Disable while submitting; on version conflict refresh and explain; on permission rejection restore the action and display the server error.

- [ ] **Step 8: Build and run all tests**

Expected: Node tests, UI resource assertions and POD tests pass; generated files contain no prototype mock functions, random values or simulated outage action.

### Task 9: Prepare Production Verification Assets

**Files:**
- Create/update: `.codex-artifacts/upsnew-ui/prototype-*` reference screenshots
- Create: `docs/design/upsNew-visual-checklist.md`

- [ ] **Step 1: Render the prototype reference at fixed viewports**

Capture the original dark prototype at `1440×1800` and `390×1600`. Do not generate production screenshots from static HTML or intercepted/mock API data.

- [ ] **Step 2: Record objective layout anchors**

Record header, fleet tabs, Hero segments, panel order, three-column rhythm, alarm row, spacing and density in the visual checklist.

- [ ] **Step 3: Record runtime checks for post-deployment execution**

Include fixed URLs, viewports, root overflow assertion, theme persistence sequence, keyboard sequence, history ranges and expected real-device labels from the FIN verification script.

### Task 10: Build, Deploy and Runtime-Verify in FIN

**Files:**
- Modify: `build.fan`
- Modify: `README.md`
- Modify: `ui/README.md`
- Use: `scripts/deploy-upsNew.ps1`

- [ ] **Step 1: Bump the POD version and update documentation**

Document the local Tailwind build, local fonts, theme behavior, history interaction and real-data-only rule.

- [ ] **Step 2: Run the complete clean build**

```powershell
Set-Location 'D:\mygithub\desmodUPS2.0\ui-src'
npm test
npm run build
Set-Location 'D:\mygithub\desmodUPS2.0'
$env:FAN_ENV_PATH=(Resolve-Path 'build').Path
& 'C:\Program Files (x86)\FIN\FIN 5.3.0.2761\bin\fan.bat' build.fan clean compile
& 'C:\Program Files (x86)\FIN\FIN 5.3.0.2761\bin\fant.bat' test -pod upsNew
```

Expected: every command exits 0 and `build/lib/fan/upsNew.pod` exists.

- [ ] **Step 3: Deploy the POD and verify artifact identity**

Before deployment, verify the current PowerShell process is elevated:

```powershell
$principal = [Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) { throw 'Administrator PowerShell is required for FIN POD deployment.' }
& '.\scripts\deploy-upsNew.ps1'
$deploy = Get-Content -Raw '.\scripts\deploy-result.json' | ConvertFrom-Json
$sourceHash = (Get-FileHash -LiteralPath '.\build\lib\fan\upsNew.pod' -Algorithm SHA256).Hash
if ($deploy.status -ne 'installed') { throw 'upsNew deployment did not report installed status.' }
if ($deploy.sha256 -ne $sourceHash) { throw 'Deployed POD hash does not match the build artifact.' }
if ($deploy.service -ne 'Running' -or -not $deploy.port8080) { throw 'FIN is not ready after deployment.' }
```

Confirm `deploy-result.json` reports `status:"installed"`, the build artifact SHA-256, `service:"Running"`, and `port8080:true`. Extension enablement is verified in Step 4 by opening the new route and with a read-only FIN query; the deployment JSON does not claim it.

- [ ] **Step 4: Verify live behavior in `mytest`**

Use the authenticated browser to open `http://localhost:8080/finMobile/mytest`, launch the `upsNew` menu entry, and verify the page URL/heading proves the new UI route is active. Select each device, inspect current values, open 24h/7d history, switch themes, reload, and confirm displayed device labels and values match the read-only FIN verification result.

- [ ] **Step 5: Execute real-data visual and accessibility verification**

With the deployed POD and seeded `mytest` device tree, capture light and dark production screenshots at `1440×1800` and `390×1600`, plus desktop/mobile history detail. Compare dark mode to the prototype references and light mode to the Figma frame. At 390px assert root scroll width equals client width. Verify theme persistence, keyboard focus, Escape close, focus restoration, live status announcements and reduced motion. Do not use request interception or mock responses.

- [ ] **Step 6: Capture final evidence**

Save build/test logs, deployment hash, FIN verification output, screenshots for both themes and viewports, and the Figma handoff URL.
