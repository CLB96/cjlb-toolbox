# Plan 1 (base v2) — pendientes para planes siguientes

Generado al cerrar el Plan 1. Ítems menores diferidos y decisiones abiertas que los planes 2–6 deben considerar.

## Antes de publicar
- Reglas de Firestore: 25 pruebas pasan contra el emulador (2026-10-29, JDK 27). Repetir `cd v2 && npm run test:rules` antes de cada despliegue de reglas.
- Recorrido manual de login/allowlist/uso con Firebase real o emuladores.

## Diferidos y estacionados
- Task 1: minor (deferred): consider `tsc --noEmit` build script; npm audit findings from firebase-tools (dev-only).
- Task 2: minor (deferred): chartTheme grid hardcoded (add --chart-grid token)
- Task 2: minor (deferred): Dialog lacks focus trap; backdrop click closes on drag-select
- Task 2: minor (deferred): Tabs no Home/End, value-not-found index -1, no aria-controls
- Task 2: minor (deferred): useTheme getSnapshot writes DOM; light users get dark flash (no pre-paint script)
- Task 2: minor (deferred): useTheme OS change listener untested; reset helper doesn't reset systemBound
- Task 2: minor (deferred): dismissToast untested; chartTheme.test reads tokens.css cwd-relative
- Task 2: minor (deferred): Starfield/ToastHost not yet mounted (expected in Task 4 shell)
- Task 2: minor (deferred): semantic color AA contrast (esp. light --warn #8a5a00 on glass) unmeasured
- Task 3: minor (deferred): useI18n getSnapshot writes DOM; `name in vars` matches prototype keys (use Object.hasOwn); t not memoized; no invalid-stored-lang/throwing-storage tests
- Task 4: minor (deferred): ToolHost Suspense lacks error boundary (failed lazy import unmounts shell) — carry to Task 5 dispatch
- Task 4: minor (deferred): ToolHost.test.tsx:27 vacuous toBeDefined assertion
- Task 4: minor (deferred): unknown hash not normalized to #/home; Tabs default label hardcoded Spanish
- Task 4: minor (deferred): onToolSwitch contract untested — carry to Task 5 dispatch (Task 5 adds test)
- Task 4: minor (deferred): home/usage panels not kept alive (OK for now)
- Task 5: minor (deferred): listSnapshots reads full records to prune (perf); prefix ambiguity for uids with ':' / '~fresh~'; stripLargeFiles ignores Map/Set/ArrayBuffer, no cycle guard
- Task 5: minor (deferred): restoreVersion doesn't markDirty/update lastSavedAt; HistoryPanel list stale, HistoryPanel/SavedIndicator untested; cross-tab same-ms overwrite
- Task 5: minor (deferred): StrictMode dev-only — first effect's cleanup flush may save unrestored state if markDirty called before effect
- Task 5: carry-forward: Task 7 must key the tool tree with key={uid}
- Task 6: minor (deferred): accessRequests createdAt/name/email format validation; App Check; extra rules tests (logins, unauth reads, sizes); firebase.test unstubAllEnvs in afterEach
- Task 6: carry-forward: README JDK note → Task 11
- Task 6: minor (deferred): +5 s slack per write allows small inflation; sessions.tool unbounded; accessRequests.createdAt untyped; stray email_verified field in test data (test.ts:133)
- Task 6: carry-forward: rules tests UNEXECUTED (no Java) — owner must install JDK 17+ and run `cd v2 && npm run test:rules`
- Task 6: carry-forward: clients must use serverTimestamp() for sessions.start/lastBeat and logins.at (Task 10)
- Task 7: minor (deferred): emailless user silent login loop; signOut rejection unhandled; verify cooldown set before send; "Ya lo verifiqué" no feedback; same-user re-emit resets to loading (unmounts shell); UserMenu details no outside-click/Escape
- Task 7: minor (deferred): App.test lacks shell-absent asserts; no uid-switch / stale-token / Google-failure / cooldown re-enable tests; RED partial
- Task 8: minor (deferred): permission-denied always → alreadyExists (24 h lock) even for real rule rejection; global COOLDOWN_KEY not per-email, no explanation after reload; AccessRequestsPanel shows "no pending" after load failure; untested failure branches; fakeFirestore batch.update on missing doc succeeds; rejected users can't re-request
- Task 8: minor (deferred): LoginScreen request view lacks logo
- Task 9: minor (deferred): metas not reset on uid change/failure; "Hola, " if user null; unused home.open; no 'updated' badge test / 47h boundary test; eslint-disable exhaustive-deps; all:unset focus ring
- Task 10: minor (deferred): pending overwrite on overlapping flushes; spurious usage session for non-admin #/usage and StrictMode double sessions; zero-second hidden beats bump lastBeat; UsagePage no refresh
- Task 10: minor (deferred): warnedRef resets per route (comment says per session); post-unmount rejection still toasts; offline hung beats accumulate; overlapping beats share lastSuccess baseline
- Task 11: minor (deferred): docs say verification email sent automatically (it's a button); custom authDomain needs CSP note; VITE_ADMIN_EMAIL unused but listed; img-src lacks blob: (future tools)
- Final: parked — startFresh persist() outside autosave chain (same-ms key race) — Ruling: both writes carry same pre-reset state, no data loss; fix opportunistically — cost: duplicate snapshot at worst
- Final: parked — Dialog document-level Escape closes stacked dialogs — Ruling: no nested dialogs exist; revisit if added
- Final: parked — error-boundary crash loop from bad persisted state; real-browser chunk cache on retry — Ruling: carry into Plan 2 (offer "Empezar de cero" in error panel)
- Final: parked — small typed-array view over >20 MB buffer kept — Ruling: rare; revisit in VectoriZr plan
- Final: parked — auth.verify.body copy says link already sent — Ruling: fix in first follow-up (copy only)
