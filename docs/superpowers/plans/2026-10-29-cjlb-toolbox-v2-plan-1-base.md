# CJLB Toolbox v2 — Plan 1: Base (shell, tema, login, guardado, Inicio, Uso) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir en `v2/` la SPA base del CJLB Toolbox: shell con pestañas y keep-alive, tema Nebulosa día/noche, ES/EN, login Firebase con allowlist y solicitudes de acceso, guardado automático con historial, Inicio con "¿Volver donde lo dejaste?" y registro de uso con pestaña Uso para el admin. Las herramientas quedan como placeholders que los planes 2–6 reemplazan.

**Architecture:** Vite + React 18 + TypeScript. Una app de una página con rutas por hash (`#/gapcheck`). Cada herramienta se carga con `lazy()` y, una vez visitada, queda montada y oculta al cambiar de pestaña. Persistencia local en IndexedDB por usuario+herramienta. Auth, allowlist, solicitudes y uso en Firebase (Auth + Firestore), con reglas de seguridad probadas contra el emulador.

**Tech Stack:** Vite 6, React 18.3.1, TypeScript 5.6, Zustand 5, Firebase JS SDK 11 (modular), idb-keyval 6, Chart.js 4.4.4, xlsx 0.18.5, Vitest 2 + Testing Library + jsdom + fake-indexeddb, firebase-tools + @firebase/rules-unit-testing.

**Spec:** `docs/superpowers/specs/2026-10-29-cjlb-toolbox-v2-design.md`

## Global Constraints

- Todo el código nuevo vive en `v2/`. Fuera de `v2/` solo se toca `.gitignore` y `docs/`. No se modifica el sitio actual ni `../Digitalizacion`.
- Sin secretos en el repo: config Firebase en `VITE_FIREBASE_*` (`.env.local`, gitignored); se versiona `v2/.env.example`. El correo admin **no** se hardcodea: vive en Firestore `config/app.adminEmail` (lo crea el dueño) y en `VITE_ADMIN_EMAIL` solo para la UI.
- Correos siempre normalizados con `trim().toLowerCase()` antes de leer/escribir allowlist, solicitudes o sesiones.
- Autosave: cada **60 000 ms** si hay cambios + flush inmediato en `visibilitychange→hidden`, `pagehide` y cambio de pestaña.
- Historial: máximo **10** snapshots por usuario+herramienta; el más antiguo se descarta.
- Tiempo activo: cuenta solo con documento visible e interacción en los últimos **300 000 ms**; latido cada **60 000 ms**.
- "¿Volver donde lo dejaste?": hasta **3** herramientas, las más recientes.
- Paleta Nebulosa exacta de §7 del spec (valores hex/rgba copiados en Task 2).
- Tipografías: Space Grotesk (títulos/números) + Inter (texto).
- Idioma por defecto ES; tema por defecto = sistema.
- Ninguna falla de guardado o de red es silenciosa: se muestra un toast.
- Chart.js `4.4.4` y xlsx `0.18.5` exactos (mismas versiones que las herramientas actuales).

## Review Focus

1. **Dos personas en el mismo equipo/navegador**: cada una ve solo sus snapshots y su "Volver donde lo dejaste" (test en Task 5 y Task 9).
2. **IndexedDB no disponible o cuota llena** (modo privado, disco lleno): la app sigue funcionando y avisa "No se pudo guardar" (test en Task 5).
3. **Correo con mayúsculas** (`Fulano@Gmail.com`) contra allowlist en minúsculas: debe entrar (test en Task 7 y en reglas, Task 6).
4. **Laptop suspendida o pestaña olvidada abierta**: al volver no se suman las horas del hueco (test en Task 10).
5. **Cerrar la pestaña antes de que pase el minuto**: el último cambio queda guardado (test de flush en `pagehide`, Task 5).

---

## Estructura de archivos

```
v2/
  index.html  package.json  vite.config.ts  tsconfig.json  vitest.config.ts
  firebase.json  firestore.rules  firestore.indexes.json  vercel.json
  .env.example  README.md  SETUP-FIREBASE-VERCEL.md
  public/  logo-light.png (=logo1.png)  logo-dark.png (=logo2.png)
  src/
    main.tsx  App.tsx
    data/tools.json
    theme/   tokens.css  global.css  useTheme.ts  chartTheme.ts  Starfield.tsx
    ui/      GlassPanel.tsx  Button.tsx  Tabs.tsx  Dialog.tsx  Toast.tsx (+ toastStore.ts)  ui.css
    i18n/    es.ts  en.ts  useI18n.ts
    app/     routes.ts  useRoute.ts  AppShell.tsx  TopBar.tsx  ToolHost.tsx
    tools/   registry.ts  types.ts  Placeholder.tsx
    persistence/ snapshotStore.ts  autosave.ts  usePersistentTool.ts  HistoryPanel.tsx  SavedIndicator.tsx
    auth/    firebase.ts  authService.ts  useAuth.ts  LoginScreen.tsx  DeniedScreen.tsx  greeting.ts  email.ts
    access/  accessService.ts  RequestAccessForm.tsx  AccessRequestsPanel.tsx
    home/    HomePage.tsx  ResumeSection.tsx  ToolCard.tsx  resume.ts
    usage/   activity.ts  usageService.ts  useUsageTracking.ts  aggregate.ts  UsagePage.tsx
  tests/     (unit tests junto a cada módulo como *.test.ts[x]); tests/rules/*.test.ts
```

---

### Task 1: Scaffold de `v2/`

**Files:**
- Create: `v2/package.json`, `v2/vite.config.ts`, `v2/tsconfig.json`, `v2/vitest.config.ts`, `v2/index.html`, `v2/src/main.tsx`, `v2/src/App.tsx`, `v2/src/test-setup.ts`, `v2/.env.example`, `v2/src/data/tools.json` (copia de `tools.json` raíz), `v2/public/logo-light.png`, `v2/public/logo-dark.png`
- Modify: `.gitignore` (agregar `v2/node_modules/`, `v2/dist/`, `v2/.env.local`, `v2/legacy-fixtures/private/`)
- Test: `v2/src/App.test.tsx`

**Interfaces:**
- Produces: scripts `npm run dev`, `npm run build`, `npm test` (vitest run), `npm run test:rules`. `test-setup.ts` importa `@testing-library/jest-dom` y `fake-indexeddb/auto`.

- [ ] **Step 1:** `npm create vite@6 v2 -- --template react-ts`, luego instalar deps exactas: `react@18.3.1 react-dom@18.3.1 zustand@5 firebase@11 idb-keyval@6 chart.js@4.4.4 xlsx@0.18.5` y dev: `vitest@2 @vitest/coverage-v8@2 jsdom@25 @testing-library/react@16 @testing-library/jest-dom@6 @testing-library/user-event@14 fake-indexeddb@6 firebase-tools @firebase/rules-unit-testing`.
- [ ] **Step 2: Write the failing test** `App.test.tsx`: `render(<App/>)` → `expect(screen.getByText(/CJLB/)).toBeInTheDocument()`.
- [ ] **Step 3:** `cd v2 && npm test` → FAIL (App aún es la plantilla de Vite).
- [ ] **Step 4:** `App.tsx` mínimo que muestra "CJLB Toolbox". `.env.example` con `VITE_FIREBASE_API_KEY= VITE_FIREBASE_AUTH_DOMAIN= VITE_FIREBASE_PROJECT_ID= VITE_FIREBASE_APP_ID= VITE_ADMIN_EMAIL= VITE_USE_EMULATORS=true`.
- [ ] **Step 5:** `npm test` → PASS; `npm run build` → sin errores.
- [ ] **Step 6: Commit** `chore: scaffold de toolbox v2 (vite + react + ts)`.

---

### Task 2: Tema Nebulosa + componentes glass

**Files:**
- Create: `src/theme/tokens.css`, `src/theme/global.css`, `src/theme/useTheme.ts`, `src/theme/Starfield.tsx`, `src/theme/chartTheme.ts`, `src/ui/GlassPanel.tsx`, `src/ui/Button.tsx`, `src/ui/Tabs.tsx`, `src/ui/Dialog.tsx`, `src/ui/Toast.tsx`, `src/ui/toastStore.ts`, `src/ui/ui.css`
- Test: `src/theme/useTheme.test.ts`, `src/ui/toastStore.test.ts`

**Interfaces:**
- Produces:
  - `type ThemeMode = 'light' | 'dark' | 'system'`; `useTheme(): { mode: ThemeMode; resolved: 'light' | 'dark'; setMode(m: ThemeMode): void }`. Escribe `document.documentElement.dataset.theme = resolved`; guarda `mode` en localStorage `cjlb.theme` (try/catch).
  - `getChartTheme(resolved: 'light'|'dark'): { text: string; grid: string; series: string[]; ok: string; warn: string; error: string }` (lee los tokens).
  - `toast(kind: 'info'|'ok'|'warn'|'error', message: string): void` y `useToasts()` (Zustand).
  - Componentes: `<GlassPanel as? dense?>`, `<Button variant="primary"|"ghost"|"danger">`, `<Tabs items value onChange>` (roles ARIA `tablist`/`tab`, flechas ←/→), `<Dialog open onClose title>`.

- [ ] **Step 1: Write the failing tests**
  - `useTheme`: sin valor guardado y `matchMedia('(prefers-color-scheme: dark)')` = true → `resolved === 'dark'`; `setMode('light')` → `dataset.theme === 'light'` y `localStorage['cjlb.theme'] === 'light'`; localStorage que lanza excepción → no rompe y `resolved` sigue funcionando.
  - `toastStore`: `toast('error','x')` agrega un toast; se auto-descarta a los 5000 ms (fake timers).
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implementar. `tokens.css` define en `:root[data-theme="dark"]` y `:root[data-theme="light"]` las variables `--bg`, `--fg`, `--fg-muted`, `--glass`, `--glass-dense`, `--edge`, `--shadow`, `--accent-1`, `--accent-2`, `--glow-1`, `--glow-2`, `--ok`, `--warn`, `--error`, `--info`, con los valores de spec §7 (noche: bg `radial-gradient(ellipse at 70% 0%, #3b1a5e 0%, #160c2e 45%, #07061a 100%)`, fg `#efe9ff`, muted `#b3a6d9`, glass `rgba(255,255,255,.07)`, edge `rgba(255,255,255,.16)`, accent `#d16bff`/`#6a7bff`, glows `#c13cff`/`#3d5bff`; día: bg `linear-gradient(160deg,#f6ecff 0%,#e4e2ff 55%,#d9ecff 100%)`, fg `#251a40`, muted `#6d6290`, glass `rgba(255,255,255,.55)`, edge `rgba(255,255,255,.9)`, accent `#9b3fe0`/`#4a5fe8`). Semánticos con contraste AA en ambos temas. Vidrio: `backdrop-filter: blur(14px) saturate(140%)` con `@supports not (backdrop-filter: blur(1px))` → fondo sólido. `prefers-reduced-motion` desactiva animaciones. Fuentes vía Google Fonts en `index.html`. Referencia visual: opción A de `.superpowers/brainstorm/*/content/estilo-espacial.html`.
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5: Commit** `feat(v2): tema nebulosa y componentes glass`.

---

### Task 3: i18n ES/EN

**Files:**
- Create: `src/i18n/es.ts`, `src/i18n/en.ts`, `src/i18n/useI18n.ts`
- Test: `src/i18n/useI18n.test.ts`

**Interfaces:**
- Produces: `type Lang = 'es' | 'en'`; `useI18n(): { lang: Lang; setLang(l: Lang): void; t(key: MessageKey, vars?: Record<string,string|number>): string }`. `MessageKey = keyof typeof es`; `en` tipado como `Record<MessageKey,string>` (el compilador obliga a traducir todo). Guarda en localStorage `cjlb.lang`.

- [ ] **Step 1: Failing tests:** por defecto `lang === 'es'`; `t('home.greeting', {name:'Ana'})` → `'Hola, Ana'` en ES y `'Hello, Ana'` en EN; clave con variable faltante deja `{name}` visible (no lanza).
- [ ] **Step 2:** FAIL → **Step 3:** implementar → **Step 4:** PASS.
- [ ] **Step 5: Commit** `feat(v2): i18n es/en`.

Los textos que agregan las tareas siguientes van en `es.ts`/`en.ts` con prefijos `shell.*`, `auth.*`, `access.*`, `home.*`, `persist.*`, `usage.*`.

---

### Task 4: Rutas, shell, registro de herramientas y keep-alive

**Files:**
- Create: `src/app/routes.ts`, `src/app/useRoute.ts`, `src/app/AppShell.tsx`, `src/app/TopBar.tsx`, `src/app/ToolHost.tsx`, `src/tools/types.ts`, `src/tools/registry.ts`, `src/tools/Placeholder.tsx`
- Modify: `src/App.tsx`
- Test: `src/app/useRoute.test.ts`, `src/app/ToolHost.test.tsx`, `src/tools/registry.test.ts`

**Interfaces:**
- Produces:
  - `type ToolId = 'gantt' | 'gapcheck' | 'bondline' | 'capaflow' | 'vectorizr'`; `type Route = 'home' | 'usage' | ToolId`.
  - `parseHash(hash: string): Route` (desconocido → `'home'`); `useRoute(): { route: Route; navigate(r: Route): void }` (escribe `location.hash = '#/'+r`).
  - `interface ToolProps { toolId: ToolId; active: boolean }`.
  - `interface ToolDef { id: ToolId; icon: string; iconSvg?: string; nameEs; nameEn; descEs; descEn; badge: null|'new'|'updated'; status: 'active'|'hold'; holdLabelEs; holdLabelEn; load(): Promise<{ default: React.ComponentType<ToolProps> }> }`.
  - `TOOLS: ToolDef[]` (datos de `data/tools.json` + `load` que por ahora devuelve `Placeholder`); `getTool(id: ToolId): ToolDef`.
  - `<ToolHost route>`: monta cada herramienta la primera vez que su ruta es activa; después la deja montada con atributo `hidden` cuando no está activa. Callback `onToolSwitch?(from: ToolId|null, to: Route)` (lo usan Task 5 y Task 10).
  - `Placeholder`: panel glass "En migración" con contador local (sirve para probar keep-alive) y enlace a la herramienta actual (`/gantt/` etc. en el dominio actual, URL en `VITE_LEGACY_BASE_URL`).

- [ ] **Step 1: Failing tests**
  - `parseHash('#/gapcheck') === 'gapcheck'`, `parseHash('#/xyz') === 'home'`, `parseHash('') === 'home'`.
  - `ToolHost`: navegar a `gapcheck`, incrementar el contador del placeholder a 3, navegar a `bondline`, volver a `gapcheck` → el contador sigue en 3; `bondline` no se monta hasta visitarla.
  - registry: una herramienta con `status:'hold'` → su `Tab` tiene `aria-disabled="true"` y muestra `holdLabelEs`; navegar por hash a ella redirige a `home`.
- [ ] **Step 2:** FAIL → **Step 3:** implementar. `TopBar`: logo (`logo-dark.png`/`logo-light.png` según tema), `Tabs` (Inicio + 5 herramientas + "Uso" solo si `isAdmin`; por ahora prop), selector ES/EN, botón de tema, slot de avatar. → **Step 4:** PASS.
- [ ] **Step 5: Commit** `feat(v2): shell con pestañas y keep-alive`.

---

### Task 5: Guardado automático e historial

**Files:**
- Create: `src/persistence/snapshotStore.ts`, `src/persistence/autosave.ts`, `src/persistence/usePersistentTool.ts`, `src/persistence/HistoryPanel.tsx`, `src/persistence/SavedIndicator.tsx`
- Test: `src/persistence/snapshotStore.test.ts`, `src/persistence/autosave.test.ts`, `src/persistence/usePersistentTool.test.tsx`

**Interfaces:**
- Produces:
  - `interface SnapshotMeta { id: string; uid: string; toolId: ToolId; savedAt: number; label?: string }`; `interface Snapshot<S> extends SnapshotMeta { data: S }`.
  - `snapshotStore`: `saveSnapshot<S>(uid, toolId, data: S, label?): Promise<SnapshotMeta>` (poda a 10); `listSnapshots(uid, toolId): Promise<SnapshotMeta[]>` (más nuevo primero); `loadSnapshot<S>(uid, toolId, id): Promise<Snapshot<S>|null>`; `latestPerTool(uid, limit = 3): Promise<SnapshotMeta[]>`; `markFreshStart(uid, toolId): Promise<void>` (registra que el próximo arranque es limpio sin borrar historial); `consumeFreshStart(uid, toolId): Promise<boolean>`. Store idb-keyval `createStore('cjlb-toolbox', 'snapshots')`, clave `${uid}:${toolId}:${savedAt}`. Se usa structured clone (los `File`/`Blob` < 20 MB se guardan tal cual; los mayores se omiten y se devuelve `{ skippedLargeFiles: true }` en el meta).
  - `createAutosave(opts: { intervalMs: number; save(): Promise<void>; onError(e: unknown): void }): { markDirty(): void; flush(): Promise<void>; dispose(): void }`. Guarda solo si está dirty; registra listeners `visibilitychange` (hidden → flush) y `pagehide` (flush).
  - `usePersistentTool<S>(toolId: ToolId, adapter: { getSnapshot(): S; restore(s: S): void }): { markDirty(): void; flush(): Promise<void>; lastSavedAt: number | null }`. Al montar: si `consumeFreshStart` → no restaura; si no, restaura el último snapshot. Usa `createAutosave({ intervalMs: 60_000, ... })`. Errores → `toast('error', t('persist.saveFailed'))`.
  - `<HistoryPanel toolId>`: lista hasta 10 versiones con fecha/hora y botón Restaurar. `<SavedIndicator lastSavedAt>`: "Guardado hace X min".
  - Este hook es **el contrato** que los planes 2–6 usan para cada herramienta.

- [ ] **Step 1: Failing tests**
  - Guardar 12 snapshots para `(u1,'gapcheck')` → `listSnapshots` devuelve 10 y el más antiguo no está.
  - `latestPerTool('u1')` no incluye snapshots de `u2` (Review Focus 1).
  - autosave (fake timers): `markDirty()`, avanzar 59 999 ms → `save` no llamado; avanzar a 60 000 → llamado 1 vez; sin `markDirty` otro minuto → no se llama de nuevo.
  - autosave: `markDirty()` y disparar `pagehide` → `save` llamado de inmediato (Review Focus 5); igual con `visibilitychange` y `document.visibilityState='hidden'`.
  - `save` que rechaza (simula `QuotaExceededError`) → `onError` llamado, el intervalo sigue vivo (Review Focus 2).
  - `usePersistentTool`: con un snapshot previo, `restore` se llama con sus datos; tras `markFreshStart`, `restore` no se llama y el snapshot sigue en `listSnapshots`.
- [ ] **Step 2:** FAIL → **Step 3:** implementar. `ToolHost.onToolSwitch` dispara el `flush()` de la herramienta saliente (registro simple `Map<ToolId, () => Promise<void>>` en `usePersistentTool`). → **Step 4:** PASS.
- [ ] **Step 5: Commit** `feat(v2): autosave cada minuto con historial de 10 versiones`.

---

### Task 6: Firebase, emuladores y reglas de seguridad

**Files:**
- Create: `v2/firebase.json` (emuladores auth:9099, firestore:8080, ui), `v2/.firebaserc` (`demo-cjlb-toolbox`), `v2/firestore.rules`, `v2/firestore.indexes.json`, `src/auth/firebase.ts`, `src/auth/email.ts`, `tests/rules/firestore.rules.test.ts`
- Modify: `v2/package.json` (`"test:rules": "firebase emulators:exec --only firestore \"vitest run tests/rules\""`; la config de vitest por defecto excluye `tests/rules`)

**Interfaces:**
- Produces:
  - `normalizeEmail(e: string): string` (trim + lowercase).
  - `firebase.ts`: `app`, `auth`, `db`; si `import.meta.env.VITE_USE_EMULATORS === 'true'` conecta a los emuladores.
  - Colecciones: `config/app { adminEmail }`; `allowlist/{email} { addedAt, addedBy }`; `accessRequests/{email} { email, name, reason, uid|null, status: 'pending'|'approved'|'rejected', createdAt, honeypot? }`; `sessions/{id} { uid, email, name, tool: ToolId|'home'|'usage', start, lastBeat, activeSeconds }`; `logins/{id} { uid, email, name, at }`.
  - Reglas (funciones `isAdmin()` = `request.auth.token.email.lower() == get(/databases/$(database)/documents/config/app).data.adminEmail`; `isAllowed()` = `exists(.../allowlist/$(request.auth.token.email.lower()))`):
    - `allowlist`: leer el propio doc si autenticado; escribir solo admin.
    - `accessRequests`: `create` sin auth permitido si: `request.resource.id == request.resource.data.email`, email en minúsculas y ≤ 254 chars, `name` ≤ 80, `reason` ≤ 500, `status == 'pending'`, solo esas claves, y el doc no existe (create-only). Leer el propio si `auth.token.email.lower() == id`; leer/actualizar todo solo admin.
    - `sessions`/`logins`: `create`/`update` solo si `isAllowed()` y `data.uid == request.auth.uid`; en update `activeSeconds` solo puede crecer ≤ 120 por escritura; leer solo admin.
    - `config`: leer autenticado; escribir nadie.

- [ ] **Step 1: Failing rules tests** (con `@firebase/rules-unit-testing`, `projectId: 'demo-cjlb-toolbox'`, seed de `config/app.adminEmail = 'admin@x.com'` y `allowlist/ana@x.com`):
  - token email `Ana@X.com` puede crear `sessions` con su uid (Review Focus 3); `eve@x.com` (no en allowlist) no puede.
  - usuario no admin no puede leer `sessions` de otros; admin sí.
  - no autenticado puede crear `accessRequests/bob@x.com` válido; crear de nuevo el mismo id falla; `reason` de 501 chars falla; `status:'approved'` en create falla.
  - no admin no puede escribir `allowlist`; admin sí.
  - update de `activeSeconds` +500 falla; +60 pasa.
- [ ] **Step 2:** `npm run test:rules` → FAIL (requiere Java ≥ 11 para el emulador de Firestore; si falta, instalar Temurin JDK 17 y anotarlo en el README).
- [ ] **Step 3:** escribir `firestore.rules` y `firebase.ts`. → **Step 4:** `npm run test:rules` → PASS.
- [ ] **Step 5: Commit** `feat(v2): firebase con emuladores y reglas de firestore probadas`.

---

### Task 7: Login, allowlist y saludo

**Files:**
- Create: `src/auth/authService.ts`, `src/auth/useAuth.ts`, `src/auth/LoginScreen.tsx`, `src/auth/DeniedScreen.tsx`, `src/auth/greeting.ts`
- Modify: `src/App.tsx` (gate: loading → LoginScreen → DeniedScreen → AppShell), `src/app/TopBar.tsx` (avatar con nombre, correo y "Cerrar sesión")
- Test: `src/auth/useAuth.test.tsx`, `src/auth/greeting.test.ts`

**Interfaces:**
- Consumes: `auth`, `db`, `normalizeEmail` (Task 6).
- Produces:
  - `authService`: `signInWithGoogle(): Promise<void>`, `signInWithEmail(email, password): Promise<void>`, `signOut(): Promise<void>`, `onUser(cb: (u: AppUser|null) => void): () => void`, `isAllowed(email): Promise<boolean>`, `fetchAdminEmail(): Promise<string|null>`.
  - `interface AppUser { uid: string; email: string; displayName: string | null }` (email ya normalizado).
  - `type AuthStatus = 'loading' | 'signedOut' | 'denied' | 'allowed'`; `useAuth(): { status; user: AppUser|null; isAdmin: boolean; signInWithGoogle; signInWithEmail; signOut }`. Persistencia de sesión `browserLocalPersistence`.
  - `greetingName(u: AppUser): string` → `displayName?.trim() || email`.
- Sin registro público de correo/contraseña (no hay botón "crear cuenta").

- [ ] **Step 1: Failing tests** (mock de `authService` con `vi.mock`):
  - usuario con email en allowlist → `status === 'allowed'`; fuera → `'denied'`.
  - `onUser` con `Fulano@Gmail.com` → `user.email === 'fulano@gmail.com'` y `isAllowed` llamado con minúsculas.
  - `isAdmin` true solo si email === `fetchAdminEmail()`.
  - `greetingName({displayName:'Ana Pérez',...}) === 'Ana Pérez'`; `greetingName({displayName:null,email:'a@b.com'}) === 'a@b.com'`; `displayName:'  '` → email.
  - `LoginScreen`: error de `signInWithEmail` (credencial inválida) muestra `t('auth.invalidCredentials')`, sin detalles técnicos.
- [ ] **Step 2:** FAIL → **Step 3:** implementar (LoginScreen glass sobre `Starfield`, botones "Entrar con Google" y formulario correo/contraseña). → **Step 4:** PASS. Verificar a mano con `npm run dev` + emuladores (`firebase emulators:start`).
- [ ] **Step 5: Commit** `feat(v2): login firebase con allowlist y saludo`.

---

### Task 8: Solicitud de acceso y aprobación por el admin

**Files:**
- Create: `src/access/accessService.ts`, `src/access/RequestAccessForm.tsx`, `src/access/AccessRequestsPanel.tsx`
- Modify: `src/auth/DeniedScreen.tsx` (formulario con datos de la cuenta), `src/auth/LoginScreen.tsx` (enlace "¿No tienes acceso? Solicítalo" → formulario sin login), `src/app/TopBar.tsx` (contador de pendientes en el avatar si `isAdmin`)
- Test: `src/access/accessService.test.ts`, `src/access/RequestAccessForm.test.tsx`

**Interfaces:**
- Consumes: `db`, `normalizeEmail`, `useAuth`.
- Produces:
  - `type RequestStatus = 'pending' | 'approved' | 'rejected'`; `interface AccessRequest { email; name; reason; uid: string|null; status: RequestStatus; createdAt: number }`.
  - `submitAccessRequest(input: { email: string; name: string; reason?: string; uid?: string; honeypot?: string }): Promise<'sent' | 'alreadyExists' | 'ignored'>` (honeypot no vacío → `'ignored'` sin escribir; valida longitudes como las reglas; un error de permiso por doc existente → `'alreadyExists'`).
  - `getMyRequest(email): Promise<AccessRequest|null>`.
  - Admin: `listPendingRequests(): Promise<AccessRequest[]>`, `approveRequest(email): Promise<void>` (batch: `allowlist/{email}` + `status:'approved'`), `rejectRequest(email): Promise<void>`, `usePendingCount(): number`.
  - Cooldown cliente: tras enviar, el botón queda deshabilitado y se guarda `cjlb.accessRequestedAt` en localStorage.
- `AccessRequestsPanel` se monta dentro de `UsagePage` (Task 10) como sección "Solicitudes de acceso".

- [ ] **Step 1: Failing tests** (Firestore mockeado o contra emulador):
  - `submitAccessRequest` normaliza el correo y guarda `status:'pending'`.
  - segundo envío del mismo correo → `'alreadyExists'`; la UI muestra `t('access.pending')`.
  - honeypot con texto → `'ignored'` y no se escribe nada.
  - `approveRequest('bob@x.com')` → existe `allowlist/bob@x.com` y la solicitud queda `approved`.
  - `DeniedScreen` con solicitud previa pendiente muestra "Solicitud enviada, pendiente de aprobación" en vez del formulario.
- [ ] **Step 2:** FAIL → **Step 3:** implementar → **Step 4:** PASS.
- [ ] **Step 5: Commit** `feat(v2): solicitud de acceso y aprobación desde la app`.

---

### Task 9: Inicio y "¿Volver donde lo dejaste?"

**Files:**
- Create: `src/home/HomePage.tsx`, `src/home/ToolCard.tsx`, `src/home/ResumeSection.tsx`, `src/home/resume.ts`
- Modify: `src/app/ToolHost.tsx` (ruta `home` → `HomePage`)
- Test: `src/home/resume.test.ts`, `src/home/HomePage.test.tsx`

**Interfaces:**
- Consumes: `latestPerTool`, `markFreshStart` (Task 5), `TOOLS` (Task 4), `greetingName` (Task 7), `useRoute`.
- Produces: `buildResumeItems(metas: SnapshotMeta[], now: number, lang: Lang): { toolId: ToolId; label: string; ago: string }[]` (máx. 3; "hace 25 min", "hace 2 h", "ayer"; EN equivalente). Herramientas en `hold` se excluyen.

- [ ] **Step 1: Failing tests**
  - `buildResumeItems` con 5 metas → 3 items ordenados del más reciente; `savedAt = now - 25*60_000` → `'hace 25 min'`.
  - `HomePage` sin snapshots: saludo `Hola, Ana Pérez` y 5 tarjetas; sin sección de reanudar.
  - con snapshot de gapcheck: **Continuar** → `navigate('gapcheck')` sin `markFreshStart`; **Empezar de cero** → `markFreshStart(uid,'gapcheck')` y luego navega.
  - tarjeta `hold` deshabilitada con su `holdLabel`; badges `new`/`updated` visibles.
  - Ícono: `iconSvg` si existe; si falla la carga o no existe, se muestra el emoji `icon` (fallback).
- [ ] **Step 2:** FAIL → **Step 3:** implementar (saludo grande Space Grotesk, tarjetas glass con hover/focus diseñados). → **Step 4:** PASS.
- [ ] **Step 5: Commit** `feat(v2): inicio con saludo y volver donde lo dejaste`.

---

### Task 10: Registro de uso y pestaña Uso

**Files:**
- Create: `src/usage/activity.ts`, `src/usage/usageService.ts`, `src/usage/useUsageTracking.ts`, `src/usage/aggregate.ts`, `src/usage/UsagePage.tsx`
- Modify: `src/App.tsx` (activar `useUsageTracking` cuando `status==='allowed'`), `src/app/ToolHost.tsx` (ruta `usage` → `UsagePage` solo si `isAdmin`, si no → `home`)
- Test: `src/usage/activity.test.ts`, `src/usage/aggregate.test.ts`, `src/usage/useUsageTracking.test.tsx`

**Interfaces:**
- Consumes: `db`, `useAuth`, `useRoute`, `onToolSwitch`, `getChartTheme`, `AccessRequestsPanel` (Task 8).
- Produces:
  - `createActivityTracker(opts: { idleMs: number; now: () => number }): { recordInteraction(): void; collect(visible: boolean): number }`: `collect` devuelve los segundos activos desde la última llamada, contando solo el tramo en que estaba visible y la última interacción tenía menos de `idleMs`; nunca más que el tiempo real transcurrido; un hueco largo (suspensión) sin interacción aporta 0 tras superar `idleMs`.
  - `usageService`: `recordLogin(user): Promise<void>`, `startSession(user, tool): Promise<string>`, `beat(sessionId, addSeconds: number): Promise<void>` (`increment`, tope 120 por llamada como en las reglas), `fetchSessions(from: number, to: number): Promise<SessionDoc[]>`.
  - `useUsageTracking(user)`: escucha `pointerdown`, `keydown`, `wheel`, `visibilitychange`; cada 60 000 ms llama `beat` con `collect(document.visibilityState==='visible')`; cambio de ruta → `beat` final + `startSession` nueva.
  - `aggregateUsage(sessions: SessionDoc[]): { users: { email; name; totalHours: number; lastSeen: number; byTool: Partial<Record<ToolId, number>> }[]; byTool: Partial<Record<ToolId, number>> }` (horas con 1 decimal; ordenado por `totalHours` desc; `home`/`usage` no cuentan como herramienta pero sí en `totalHours`).
  - `UsagePage`: filtro Semana / Mes / Rango; tabla por persona (nombre, correo, horas, última conexión, desglose por herramienta); gráfico de barras Chart.js 4.4.4 de horas por herramienta con `getChartTheme`; botón "Exportar Excel" (xlsx 0.18.5, hoja `Uso` con las mismas columnas de la tabla); sección `AccessRequestsPanel`.

- [ ] **Step 1: Failing tests**
  - tracker: interacción en t=0, `collect(true)` en t=60 s → 60; sin interacción, `collect(true)` en t=60 s+6 min → solo cuenta hasta `idleMs` (≤ 300) y la siguiente llamada → 0 (Review Focus 4).
  - tracker: `collect(false)` (pestaña oculta) → 0.
  - tracker: salto de reloj de 8 h sin interacción → `collect` ≤ 300.
  - `aggregateUsage`: dos sesiones de ana (gapcheck 3600 s, bondline 1800 s) + una de bob (gantt 7200 s) → ana `totalHours 1.5`, `byTool.gapcheck 1.0`; bob primero en el orden.
  - `useUsageTracking` (fake timers, service mockeado): en 60 s con interacción → `beat(id, 60)`; al cambiar de ruta → `beat` final y `startSession` con la nueva herramienta.
  - `UsagePage` no se renderiza para no admin (redirige a `home`).
- [ ] **Step 2:** FAIL → **Step 3:** implementar → **Step 4:** PASS.
- [ ] **Step 5: Commit** `feat(v2): registro de uso y pestaña uso para admin`.

---

### Task 11: Despliegue de prueba y guía de configuración

**Files:**
- Create: `v2/vercel.json`, `v2/README.md`, `v2/SETUP-FIREBASE-VERCEL.md`
- Test: build + verificación manual en navegador

**Interfaces:**
- Consumes: todo lo anterior.

- [ ] **Step 1:** `vercel.json`: `framework: "vite"`, `outputDirectory: "dist"`, rewrite SPA `/(.*) → /index.html`, headers de seguridad (`X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`) y CSP que permite `self`, `https://*.googleapis.com`, `https://*.firebaseapp.com`, `https://apis.google.com`, `https://accounts.google.com`, `https://fonts.googleapis.com`, `https://fonts.gstatic.com`.
- [ ] **Step 2:** `SETUP-FIREBASE-VERCEL.md` paso a paso para el dueño: crear proyecto Firebase nuevo (plan Spark), habilitar Google y Correo/Contraseña, crear app web y copiar config, crear `config/app` con `adminEmail`, agregar su correo a `allowlist`, agregar el dominio de prueba de Vercel a *Authorized domains*, `firebase deploy --only firestore:rules`, crear proyecto Vercel con *Root Directory* `v2` y variables `VITE_*` (`VITE_USE_EMULATORS=false`). Sin tocar el proyecto Vercel actual.
- [ ] **Step 3:** `README.md` de v2: cómo correr en local con emuladores (`firebase emulators:start` + `npm run dev`), tests (`npm test`, `npm run test:rules`), requisito Java, estructura y contrato `usePersistentTool` para portar herramientas.
- [ ] **Step 4:** `npm test` y `npm run test:rules` → PASS; `npm run build` → OK; con emuladores, recorrido manual en el panel del navegador: login → saludo → abrir GapCheck placeholder, contar, cambiar a Bondline y volver (estado intacto) → recargar (vuelve a la pestaña y estado restaurado) → Inicio muestra "Volver donde lo dejaste" → tema día/noche y ES/EN → usuario no autorizado solicita acceso → admin lo aprueba → pestaña Uso muestra horas. Capturas en 1440 y 1024 px, día y noche.
- [ ] **Step 5: Commit** `docs(v2): despliegue de prueba y guía de firebase/vercel`.

---

## Planes siguientes (se escriben al terminar este)

Cada uno arranca con el **mockup antes/después** de pantallas y exports (spec §6.4) y espera aprobación; luego inventario de funciones, captura de golden fixtures desde la versión actual, port de la lógica a `tools/<id>/logic/*.ts` con golden tests, UI en React sobre `usePersistentTool`, y checklist final contra la versión actual.

- **Plan 2 — GapCheck** (fixture: Excel real del dueño en `v2/legacy-fixtures/private/`).
- **Plan 3 — Bondline** (fixture: Excel real del dueño; conserva `bondlineDefaults` como preferencia por usuario).
- **Plan 4 — Gantt** (sin JSONBin ni preset; hasta 5 Gantt por usuario con selector, crear/renombrar/duplicar/borrar; fixture de ejemplo creado por el builder).
- **Plan 5 — CapaFlow** (fixture: "Cargar datos de ejemplo" del ejercicio Minitab).
- **Plan 6 — VectoriZr** (copia de `../Digitalizacion/src`, se vuelve la oficial; re-tema con tokens; sin PWA; `opencv.js` en `public/` con caché HTTP).
