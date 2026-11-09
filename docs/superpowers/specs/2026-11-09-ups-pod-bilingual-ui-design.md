# UPS POD bilingual UI design

## Goal

Make every user-facing UPS POD screen available in Simplified Chinese and English without changing routes, Folio records, runtime values, or the POD's read/write boundary.

## Language behavior

- Supported languages: `zh-CN` and `en-US`.
- On first visit, choose English when `navigator.language` begins with `en`; otherwise choose Chinese.
- Store the explicit choice in browser `localStorage` and reuse it on later visits.
- Show a persistent `中文 / English` switch in the application header.
- Switching language updates the current screen immediately without navigation, reload, or data refetch.
- Update the document `lang` attribute and title with the selected language.

## Translation boundary

Translate all product-owned text:

- overview titles, filters, status labels, pagination, freshness and empty states;
- equipment detail and history data-gap screens;
- unavailable routes, alarms, configuration and audit screens;
- device-tree navigation, forms, previews, operation messages and validation errors;
- loading, session, network, Zinc/Axon and fail-closed errors;
- accessibility labels and placeholders.

Do not translate Folio-owned content such as site, floor, equipment and point names, IDs, manufacturer, model, serial number, units, timestamps or raw server error details. Product prefixes around those values are translated.

## Frontend structure

Add one small browser module, `frontend/i18n.js`, containing:

- the two translation dictionaries;
- language detection and persistence;
- `t(key, params)` for plain text and parameter substitution;
- locale-aware date/time formatting;
- a subscription hook so the active Ractive view can rerender after a switch.

Ractive templates receive `t`, the active language and language labels as data/helpers. JavaScript-generated messages use the same module. Translation keys are semantic and shared across screens; templates do not contain parallel language conditionals.

`i18n.js` loads before the other application modules. Missing keys fail visibly in development/tests and fall back to the Chinese value in production so the interface never renders blank text.

## FIN shell menu

The current FIN 5.3 evidence set does not verify dynamic locale lookup for `finStackMobileMenu` `displayName`. The parent FIN menu also cannot observe the embedded page's `localStorage` choice. To keep every entry understandable in both languages, shell menu labels remain static bilingual labels, for example `UPS 总览 / Overview` and `设备树 / Device Tree`. The in-page switch controls all content inside the UPS POD page.

## Data and security behavior

- Language changes are browser-only and never call Axon or Folio APIs.
- Existing `upsOverview`, `upsTreeRead`, `upsTreeCreate` and `upsTreeUpdate` requests are unchanged.
- Server-provided error text is inserted through text rendering, never HTML.
- Route parsing, polling, mutation confirmation and fail-closed behavior remain unchanged.

## Verification

Automated checks must prove:

1. both dictionaries have identical key sets;
2. browser-language detection and stored preference precedence work;
3. switching updates the active screen without a fetch or route change;
4. every product-owned Chinese literal in production frontend files is represented by a translation key;
5. all overview, detail, history, unavailable and tree states render in both languages;
6. errors and operation messages are translated while raw external values remain escaped;
7. the built POD contains `i18n.js` and bilingual FIN menu labels;
8. existing Folio-only, no-simulator and no-runtime-write checks continue to pass.

## Acceptance criteria

- A user can switch between Chinese and English from every application route.
- The choice survives a browser refresh and a later visit.
- First visit follows browser language using the defined fallback.
- No product-owned text remains fixed to one language inside the application.
- Folio data and the POD ownership boundary are unchanged.
