# ups2 UPS Prototype Parity Implementation Plan

> **For agentic workers:** Use subagent-driven development for the isolated UI, data and integration tasks. The user explicitly requested implementation, seeding and deployment in ups2.

**Goal:** Enable upsNew in FIN project ups2, provision clearly marked virtual UPS data, and render the existing approved prototype layout.

**Architecture:** Preserve Fantom/Axon as the only data boundary. Reuse the existing 2026-09-21 design specification and the light reference screenshot `.codex-artifacts/upsnew-figma-prototype-light.png`; retain the original dark prototype as the alternate theme. No business values or simulated histories are embedded in production UI assets. Demo assessments use a separate guarded read adapter, leaving production assessment filtering intact.

**Tech Stack:** FIN 5.3.0.2761, Fantom, Axon, existing Haystack browser client, local CSS/font assets, esbuild, Node test runner.

**Repository:** This directory has no Git metadata; preserve file hashes and verification logs instead of claiming commits. No Figma write is requested.

## Task 1: Project and virtual data

- [x] Open the user-specified ups2 project and enable upsNew through project extension settings.
- [x] Adapt the existing seed to guard the project name, duplicate keys and remote connection fields before mutation.
- [x] Provision a Site, two Floors, three UPS, three battery groups, 66 semantic points, numeric histories, and simulated alarms, assessments, risks and recommendations.
- [x] Retain upsDemo and upsDataSource=simulated. Point writes are restricted to newly created or verified virtual points; remove writable/curTracksWrite when complete.
- [x] Execute the authorized seed in ups2 and verify counts, references, values, history and absence of real connectors/writable tags. Do not replay unknown outcomes.

## Task 2: Prototype shell and styling

- [x] Replace sidebar navigation with the existing reference header, equipment tabs, three-part hero, six panels and full-width alarms.
- [x] Match reference grid, 1240px centered content, spacing, type roles, borders and light/dark colors.
- [x] Package fonts locally and support the existing design's theme choice.
- [x] Verify final 0.2.3 desktop geometry against reference screenshots. At the 1440px reference viewport, panel rows start at 414px and 682px with 250px heights; alarms start at 950px with 218px height. Saved final light/dark screenshots and UI verification JSON.
- [ ] Verify mobile geometry and interaction against reference screenshots. CSS responsive support is implemented, but no actual mobile verification has been performed.

## Task 3: Real FIN client behavior

- [x] Add tested semantic point selection, quality/time formatting, theme persistence and history parsing/statistics.
- [x] Load all displayed values through FIN APIs; render empty/error/stale states without fabricated values.
- [x] Guard asynchronous device changes and polling; show history details with time-range controls.
- [x] Keep alarm acknowledgement as a deliberate separate business action, not part of acceptance clicks.

## Task 4: Integration and deployment

- [x] Add an explicit demo-assessment reader requiring an upsDemo simulated subject; keep upsLatestAssessment production exclusion.
- [x] Adapt resource tests to the approved prototype architecture, retaining read-only invariants.
- [x] Fix any required FIN menu registration using verified runtime conventions.
- [x] Rebuild UI and versioned POD in shadow FAN_HOME; run relevant Node and Fantom checks. Release 0.2.3: 18 frontend tests and 21 Fantom methods / 171 assertions passed; history reads apply hisClip after hisRead to remove out-of-window neighbors.
- [x] Back up current installed POD, stop FIN5, wait for port release, install and hash-verify, start FIN5 and verify served assets. Release 0.2.3 deployment result reports installed, matching SHA256 and HTTP readiness.
- [x] Open ups2, switch all three devices, inspect trend dialog/theme, retain the running page and screenshots. Final 0.2.3 custom range 2026-11-04 18:00 to 2026-11-05 12:00 exclusive returns 18 hourly samples, ending at 11:00. Desktop geometry matches the reference; device names, dates and explicit simulation labels reflect the seeded project.
