# UPS POD Read-Only Telemetry and Tree UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Track every checkbox and stop when its verification fails.

**Goal:** Make the UPS POD read telemetry only from Folio while allowing an authenticated administrator to create and safely edit site/floor/equip/point metadata through the UI. FIN Expert exclusively owns simulated runtime values.

**Architecture:** `upsOverview()` remains a `curVal`/`curStatusTs`-only reader. The POD exposes admin-only Axon functions for tree metadata and never writes telemetry, history, or alarms. A small standalone project-context module resolves exactly one FIN project before any call. Deployment copies only the POD and proves, by hashes and full Folio projections, that it did not mutate data.

**Tech stack:** Fantom/Fan POD, FIN 5.3.0.2761, Folio/Haystack, Axon, Ractive 1.4.4, browser Fetch API, Node.js contract tests, PowerShell deployment, FIN Expert 2.0 governed live operations.

---

## File map

- Modify `extensions/upsPod/fan/UpsPodExt.fan`: remove the lifecycle simulator.
- Create `extensions/upsPod/fan/UpsPodTree.fan`: tree read/create/update validation and Folio commits.
- Modify `extensions/upsPod/fan/UpsPodLib.fan`: expose admin-only Axon tree APIs.
- Create `extensions/upsPod/test/UpsPodTreeTest.fan`: real isolated-Folio behavior tests.
- Modify `extensions/upsPod/frontend/fin-api.js`: safe Axon string encoding and generic grid evaluation.
- Create `extensions/upsPod/frontend/project-context.js`: fail-closed project resolution that is testable outside the browser bootstrap.
- Modify `extensions/upsPod/frontend/app.js`, `index.html`, `styles.css`, and `lib/menu.trio`: tree-management route and forms.
- Modify `extensions/upsPod/build.fan`: remove seed-data packaging.
- Delete `extensions/upsPod/frontend/seed.json` and generated `seed-data.js` if tracked.
- Modify `scripts/deploy-upsPod-tree.ps1`: POD-only deployment with source/destination SHA-256 verification.
- Delete `scripts/seed/upsPodTreeSeed.fan`: remove POD-owned seeding/simulation.
- Modify `extensions/upsPod/test/verify.cjs`, `verifyRegistration.fan`, and all affected checks in `scripts/check`, including `r3-no-fake-data.cjs` and `r5-idempotent-seed.cjs`, so the regression suite verifies the Folio-only product rather than the deleted demo seed.
- Modify `docs/dev/16-upsPod-deployment.md` and add acceptance evidence under `docs/evidence`.

## Task 1: Remove every POD-owned simulator

- [ ] In `verifyTreeContract.cjs`, first add failing assertions that production sources contain no `MockAdapter`, `?mock=1`, `genHistory`, `deriveHistory`, `deriveEvents`, `prnd3`, `METRIC_DOMAIN`, `upsSimVal`, `upsSimTs`, lifecycle telemetry publisher, `Diff.transient` write, seed JSON, or seed deployment call.
- [ ] In `upsPod-deploy-health.cjs`, first add failing assertions that deployment has no project database mutation and that it computes and compares SHA-256 for the built source POD and installed destination POD.
- [ ] Run both checks and record the expected failures.
- [ ] Reduce `UpsPodExt` to extension/web lifecycle only. Remove `MockAdapter`, mock query selection, `genHistory`, `deriveHistory`, `deriveEvents`, `prnd3`, `METRIC_DOMAIN`, every `FinAdapter`/detail/history call to those generators, seed imports, seed packaging in `build.fan`, `seed.json`, generated `seed-data.js`, and the seed Fantom script. When Folio has no history/event source, the production history UI must show an explicit unavailable/data-gap state and an empty series; it must never synthesize a value.
- [ ] Rewrite `verify.cjs`, `verifyRegistration.fan`, `r3-no-fake-data.cjs`, and `r5-idempotent-seed.cjs` in this same task. Remove tests that load/regenerate the seed or expect synthetic history/alarms/config. Replace them with production-path assertions that Folio overview data is preserved and missing history/events render as unavailable with empty data.
- [ ] Make `deploy-upsPod-tree.ps1` copy only the POD, compare source/destination SHA-256, restart FIN, and wait for readiness. It must not open or mutate any project database.
- [ ] Run every Node test under `extensions/upsPod/test`, every `scripts/check/*.cjs` check, the registration/menu Fan checks, and `fan .\extensions\upsPod\build.fan`; require all pass before the Task 1 commit so no seed-dependent regression is deferred.
- [ ] Commit only this task as `refactor: make ups pod telemetry read only`.

## Task 2: Implement and behavior-test the metadata boundary

- [ ] Create `UpsPodTreeTest.fan` with an isolated test Folio. Write failing tests for `read`, `create`, and `update`, rather than checking source tokens.
- [ ] Cover the exact create allowlists from the approved design, separate update allowlists, whole-request rejection of unknown/reserved fields, exactly one point metric marker, valid `site -> floor -> equip -> point` parent chains, and rejection of cross-chain references.
- [ ] Cover stable `upsTreeKey` idempotency, conflict on same key with changed type/parent, and same-parent duplicate display-name rejection that returns the conflicting record ID.
- [ ] Cover immutable structural fields, no delete/reparent path, and non-admin denial of every mutating Axon entry point.
- [ ] Snapshot the complete target record and history samples, perform create/update attempts, then prove `curVal`, `curStatus`, `curStatusTs`, history samples, runtime alarm tags, and every unrequested field are preserved exactly. Also snapshot another project/database and prove it is unchanged.
- [ ] Run the new Fantom test and record the expected failures.
- [ ] Implement `UpsPodTree.read(Folio)`, `create(Folio, Str, Str)`, and `update(Folio, Ref, Str)`. Parse one JSON object, reject every unrecognized field, inject structural markers server-side, validate coherent parent chains, and commit one metadata record per call.
- [ ] Add `@Axon { admin = true }` functions `upsTreeRead`, `upsTreeCreate`, and `upsTreeUpdate`; resolve the active database only from `HxContext.curHx(true).db` and call `checkAdmin` inside mutation paths as defense in depth.
- [ ] Return compact Zinc-friendly operation grids with record ID, type, display name, parent IDs, status, and conflict ID where applicable.
- [ ] Run `UpsPodTreeTest.fan`, `verifyTreeContract.cjs`, and the POD build; require all pass.
- [ ] Commit only this task as `feat: add admin tree metadata api`.

## Task 3: Add safe frontend calls and project isolation

- [ ] Extract project discovery to UMD module `project-context.js` so Node tests execute it without the early browser return in `app.js`.
- [ ] First add failing tests for missing, malformed, and mutually conflicting same-origin parent/top/referrer `/finMobile/<project>` candidates. No default project is permitted.
- [ ] First add failing `fin-api` tests for quotes, backslashes, CR/LF, control characters, and Unicode in Axon string arguments.
- [ ] Implement `resolveProjectContext` to return one normalized project or fail before any network request.
- [ ] Implement `axonString(value)` and use it for all user-controlled Axon arguments. Preserve attestation, same-origin credentials, error-grid detection, and response diagnostics.
- [ ] Add `FinAdapter.treeRead`, `treeCreate`, and `treeUpdate`; keep them separate from overview snapshot parsing.
- [ ] Run `verifyFinApi.cjs` and `verify.cjs`; require all pass.
- [ ] Commit only this task as `feat: add fail closed tree api client`.

## Task 4: Add the device-tree management UI

- [ ] First add failing UI checks for `#/ups/tree`, a menu/overview entry, site/floor/equip/point create modes, dependent parent selectors, point metric selection, safe edit fields, immutable-field text, and visible operation errors. Assert there are no runtime-value, history, alarm, delete, reparent, or metric-change controls.
- [ ] Add the route and load Folio rows on entry. Build the four lists from returned records and retain the last successful step and selected parents after later-step errors.
- [ ] Add compact create forms. Generate one stable `upsTreeKey` per pending form and reuse it for retry. Show the exact metadata preview before submission and re-read after success.
- [ ] Add edit forms containing only the approved per-type update allowlist. Show Folio ID, parent chain, type, and metric marker read-only.
- [ ] Add “设备树管理” navigation and responsive styling consistent with the existing extension.
- [ ] Run all three Node checks and the POD build; require all pass.
- [ ] Commit only this task as `feat: add ups device tree management ui`.

## Task 5: Use FIN Expert for governed live data work

- [ ] Call `fin_live_list_connections`. Continue live work only if the exact registered connection `local-mytest` exists. If the MCP tools or connection are absent, report `FIN Expert MCP backend unavailable` and do not substitute HTTP, browser eval, CLI, or a standalone runtime.
- [ ] Capture current UPS records with `fin_live_read` using `{connection_id:"local-mytest", operation:"read", filter:"upsPodSeed or upsUnit or upsSimVal or upsSimTs", limit:1000, max_bytes:1000000, timeout_seconds:30, actor:"codex-ups-pod"}`.
- [ ] Build a canonical full-record projection for every matching site/floor/equip/point record, excluding only the Folio `mod` tag. For each point carrying history, make a separate governed single-point call `{connection_id:"local-mytest", operation:"hisRead", record_id:"<exact point ref>", range:"today", limit:10000, max_bytes:10000000, timeout_seconds:60, actor:"codex-ups-pod"}`. Save record IDs, runtime fields, every returned history timestamp/value/unit, truncation flags, and audit IDs. Any truncation or unsupported history response blocks the live zero-change claim.
- [ ] If legacy `upsSimVal`/`upsSimTs` tags exist, call `fin_live_execute_axon` with the exact cleanup request and `confirmed:false`. Present target, effect, risk, request hash, expiry, and single-use confirmation token. Do not execute until the user confirms that exact preview.
- [ ] After confirmation, resend the unchanged request with `confirmed:true` and the token. Re-read and prove only those two tags changed. For `outcome_unknown`, query `fin_live_operation_status` and re-read; never retry blindly.
- [ ] Stage any test `curVal`/`curStatusTs` update separately with `fin_live_point_write`, again requiring its own preview confirmation. A persistent 10-second simulator, if requested, must be a separately previewed `fin_live_execute_axon` operation owned by FIN Expert.

## Task 6: Deploy and run full acceptance

**Hard gate:** If the FIN Expert MCP tools are unavailable, `local-mytest` is absent, or the bounded record/history baselines cannot be captured without truncation, stop Tasks 5 and 6. Do not deploy, perform browser writes, create/commit final acceptance evidence, or claim completion. Tasks 1–4 may be delivered only as locally verified work with the exact live blocker reported as `FIN Expert MCP backend unavailable` (or the observed connection/history error).

- [ ] Run all Node checks, Fantom tree behavior tests, registration/menu checks, and the POD build. Stop on any failure.
- [ ] Through FIN Expert, capture the canonical pre-deployment projection of all matching records in `mytest`, plus the same projection/count for a second project.
- [ ] Run `powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\deploy-upsPod-tree.ps1 -ProjectName mytest`. Require FIN Running/readiness and identical source/destination SHA-256 in the log.
- [ ] Capture both projections again. Compare every tag and history sample excluding only `mod`; require no deployment-caused difference and no second-project difference.
- [ ] In the authenticated browser, create one complete `site -> floor -> equip -> point` chain. Before any FIN Expert point write, verify the new point shows a data gap. After a separately confirmed FIN Expert write, verify it appears within one polling interval.
- [ ] Edit each record type and prove runtime fields/history remain identical. Send crafted requests containing each forbidden field and an unknown field; require rejection and a zero-change canonical projection.
- [ ] Force one failure at each wizard step, correct it, and retry with the same `upsTreeKey`; require no duplicates. Attempt duplicate display names and cross-chain parents; require the conflict ID/error.
- [ ] Verify missing, malformed, and conflicting project paths fail closed before a request.
- [ ] Verify freshness at the boundary: age exactly 20 seconds is “实测”; age greater than 20 seconds is “参考值”; the last `curVal` remains visible and no fallback value appears.
- [ ] Record tests, hashes, audit IDs, canonical diffs, browser observations, and limitations in `docs/evidence/upsPod-tree-ui-acceptance-20260920.md` and update deployment documentation.
- [ ] Commit only documentation/evidence as `docs: record ups tree deployment acceptance`.

## Final acceptance criteria

- [ ] Every UI value comes from Folio `curVal`/`curStatusTs`; the repository and deployed POD contain no mock/simulator/seed value path.
- [ ] The UI can create and safely edit the complete hierarchy while preserving telemetry, history, alarms, and unrelated projects.
- [ ] POD deployment is hash-verified and produces a zero canonical Folio diff excluding `mod`.
- [ ] FIN Expert is the only path used for simulated values, and every live mutation has a recorded preview, confirmation, audit ID, and reconciliation read.
