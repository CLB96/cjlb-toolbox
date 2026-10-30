# CJLB Toolbox v2 — Plan 3: Bondline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Portar Bondline (Análisis Térmico — Activación de Adhesivo) a la pestaña `bondline` de `v2/` con resultados idénticos a `bondline/index.html`, el diseño Nebulosa aprobado (vista "Después" de `v2/legacy-fixtures/private/mockups/bondline.html`) y guardado automático.

**Architecture:** Igual que GapCheck (Plan 2). La lógica de cálculo se copia del original a funciones puras en `src/tools/bondline/logic/` y se valida con **pruebas diferenciales** contra una copia literal del código original (solo argumentos en vez de DOM) en `legacy-fixtures/bondline/legacyReference.ts`, sobre el Excel real del dueño y fixtures sintéticos. El estado vive en un store Zustand **por instancia** (`createBondlineStore` + `BondlineStoreProvider`, sin estado mutable de módulo) y se persiste con `usePersistentTool('bondline', …)`. Los valores por defecto (`bondlineDefaults`) pasan a ser una **preferencia por usuario** fuera del snapshot (R1). La UI usa los componentes glass del Plan 1 y los patrones del port de GapCheck (`Marker`, `RichText`, export Nebulosa).

**Tech Stack:** React 18.3.1, TypeScript, Zustand 5, Chart.js 4.4.4 + chartjs-plugin-annotation 3.0.1 (exactas, ya instaladas), xlsx 0.18.5, idb-keyval, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-29-cjlb-toolbox-v2-design.md` (§4, §6.4, §9, §12b). **Inventario del original (fuente de verdad):** `docs/superpowers/plans/bondline-inventory.md`. **Decisiones del dueño heredadas:** `docs/superpowers/plans/gapcheck-mejoras-propuestas.md` (§A.4, §C.30, §C.35).

## Global Constraints

- Ningún valor ni gráfica cambia: mismas fórmulas y comparaciones del inventario §2A (activación `>= cfg.min` sobre **todas** las TC y datos completos; ventana `ACTIVATION_DURATION = 30` filas `start..start+29`, inclusiva `[min,max]`, NOK si `activationEnd > effectiveEnd` o el rango la corta; `yMax = 80`, `yMin = Math.floor(avgFirst * 0.95)`; cooling `<= coolingTarget` desde `Math.floor(coolingStart)`; pérdida `thermo - nest` con `toFixed(1) + ' °C'`).
- Formato exacto (inventario §2A "Number formatting"): min/max `v.toFixed(1) + '°'`, duración `${totalRows}s` en pantalla y `effectiveRows + 's'` en PNG, activación `'t=' + activationStart + 's'` o `'—'`, tooltip `` `t = ${label}s` `` / `` ` ${dataset.label}: ${y?.toFixed(1) ?? '—'}°C` ``, ticks Y `v + '°C'`, actividad mostrada en el resultado = `activationStart - effectiveStart` (puede ser negativa).
- Lectura (inventario §3): `sheet_to_json(sheet, { header: 1, defval: null })`, filas en blanco eliminadas, `parseFloat` por celda (**se conserva la permisividad**: `"12abc"` → 12, `"1,5"` → 1 — decisión del dueño, gapcheck-mejoras §A.4), columnas todo-null descartadas, recorte a `lastRow`, nulls interiores conservados. Columnas = termopares, filas = segundos; no hay cabecera: la primera fila siempre es dato (ya es así en el original).
- Selector de hoja original: hoja por defecto índice 0, opciones `` `${idx+1}. ${name}` ``, botones ←/→ acotados sin vuelta.
- Paleta `TC_COLORS` (20 colores, inventario §1) para líneas, leyenda, marcadores y PNG; colores de anotaciones `lc`/`gc`/`purple` y de eventos (tabla §5C) literales según tema día/noche.
- Textos de interfaz copiados **literalmente** de `I18N` (inventario §8) en ES y EN, más los literales fuera del diccionario (`Water Base`, `Hotmelt`, `PC-ABS`, `PP`, `📊 Hoja Activa`, `Auto`, `Leister ${n}`, `EVENTS_LABELS`). Si el mockup parafrasea un texto que existe en el original, gana el original. Textos nuevos solo para controles nuevos, anotados en el documento de mejoras.
- Chart.js `4.4.4` y chartjs-plugin-annotation `3.0.1` exactas (ya en `package.json`; no tocar versiones).
- Persistencia vía `usePersistentTool('bondline', { getSnapshot, restore, reset })` (README "Portar una herramienta"): `getSnapshot` lee de `api.getState()`, datos aptos para structured clone (arrays, `Blob`, objetos planos; sin funciones, sin DOM, sin workbook de SheetJS). Edición bloqueada hasta `restored && defaultsLoaded`.
- El Excel real (`legacy-fixtures/private/bondline-real.xlsx`) no se versiona; sus pruebas usan `it.skipIf(!real)`.
- Archivos < 400 líneas; sin `console.log`; errores visibles con `toast` (los `alert` del original pasan a toast con el mismo texto).

## Rulings (decisiones del controlador, revisables por el dueño)

- **R1 Valores por defecto = preferencia por usuario.** `bondlineDefaults` se guarda en un módulo nuevo `src/persistence/preferences.ts` (idb-keyval, clave `~pref~:${uid}:bondline:defaults`), **no** en el snapshot: sobrevive a "Empezar de cero", a cargar otro archivo y a restaurar versiones del historial, igual que el `localStorage` original. Semántica original intacta: `saveDefaults` aplica `parseFloat(x) || 55 / 75 / 60 / 80 / 35`, sin chequeo min<max, guarda, aplica y cierra el diálogo; `resetDefaults` pide confirmación (`¿Restaurar valores de fábrica?` / `Restore factory values?`), guarda **inmediatamente** los de fábrica y rellena el diálogo sin cerrarlo. Una preferencia ilegible o con forma incompleta → `FACTORY_DEFAULTS` (corrige el crash del bug 18 sin cambiar valores). No se migra el `localStorage` del original (no es por usuario).
- **R2 Configuración por hoja funciona.** Cada hoja guarda su configuración (fecha, adhesivo, sustrato, visibilidad TC, rango temporal, sucesos **incluido Prensa Cerrada**, parámetros de cooling, parámetros del proceso, leisters, layout y marcadores) al cambiar de hoja y la recupera al volver (corrige bugs 1, 2, 3, 4). Primera visita a una hoja: se hereda la configuración activa, con rango temporal reiniciado y visibilidad TC reiniciada si cambia el número de TC (lo que hace hoy el original). `sheetConfigs` se vacía al cargar otro archivo (bugs 5, 6). Ningún cálculo cambia.
- **R3 Arrastre de sucesos respeta el rango temporal.** Hit-test con `evt.x - effectiveStart` y valor escrito `newX + effectiveStart`, limitado a `[0, totalRows-1]` (bug 8). Sin rango activo es idéntico al original. Un solo juego de listeners y un solo tooltip flotante por gráfica (bug 7).
- **R4 Layout.** Posiciones en % **relativo a la imagen** (centro del marcador) en pantalla y PNG (bug 10, parte pantalla vs PNG), como GapCheck. Se **conserva** que los marcadores vuelven a sus posiciones por defecto (§2A, sobre TC visibles) al cargar imagen, cambiar de hoja sin config guardada y ocultar/mostrar una TC. Imagen ajustada a la pantalla por defecto con botón **"Tamaño real"** persistido (gapcheck-mejoras §C.30). Imagen > 20 MB: se usa en pantalla, no se guarda, aviso único (§C.35).
- **R5 Sin login ni menú propios.** Contraseña, tema, idioma y menú hamburguesa los aporta el toolbox (bugs 20, 22 desaparecen). La acción del menú `menuDownload`/`menuDefaults` pasa a botones de la cabecera con los mismos textos (`Valores Default`/`Default Values`, `Descargar gráfica PNG`/`Download chart PNG`).
- **R6 Cabecera según mockup.** Nombre de archivo, chip `{n} s × {m} termopares` (nuevo, `fileDims`), selector de hoja (solo si hay > 1 hoja, como hoy), **Fecha de Prueba siempre visible** (hoy solo con varias hojas, bug 16), indicador de guardado, Cambiar archivo / Valores Default / Historial / Descargar gráfica PNG. Paneles Parámetros, Sucesos y Layout plegables y **plegados por defecto** (mockup), estado persistido.
- **R7 Tema.** Texto, rejilla y tooltip de la gráfica salen de `getChartTheme` (precedente GapCheck §C.36); los colores de datos y anotaciones (`TC_COLORS`, `lc`, `gc`, `purple`, eventos) son los literales del original con `dark = resolved === 'dark'`.
- **R8 Refresco inmediato.** Tras "Restaurar valores de fábrica" la info del adhesivo y la gráfica se refrescan al momento (hoy quedan desactualizadas hasta otro render, bug 9); valores = los vigentes.
- **R9 Export PNG.** Fondo Nebulosa como GapCheck (siempre en variante oscura), contenido idéntico al original (inventario §7: lienzo 1920×1280, mismos textos —incluido `▲ ▲ Superior` y sub-etiquetas en español—, mismas tarjetas, panel de parámetros, gráfica 1800×845 con las anotaciones de export, leyenda, layout, pie, nombre `` `Bondline - ${testDate||'SinFecha'} - ${cleanSheetName}.png` ``). La gráfica temporal se destruye tras dibujarla. **Se implementa solo después de que el dueño apruebe el mockup del PNG (Task 9 Step 1).**
- **R10 Errores de archivo.** Los `alert` de lectura/hoja (solo ES en el original) se muestran como toast con el texto literal en ES y una traducción EN nueva; si falla, el estado previo queda intacto y no se marca como cargado (bug 17, parte "cargado aunque falle").
- Todo lo demás del inventario §10 se conserva (bugs 11, 12, 13, 14 salvo lo de R9, 15, 17 resto, 19, 21) y se documenta en `docs/superpowers/plans/bondline-mejoras-propuestas.md` (Task 10).

## Review Focus

1. **Ventana de activación en el borde:** activación a < 30 s del final de los datos o cortada por el rango temporal → `⚠ Ventana de activación fuera de rango` aunque las muestras existentes estén en rango (Task 2).
2. **Rango temporal activo:** etiquetas desde 0, resultado con tiempo relativo (negativo posible), PNG con tiempo absoluto y duración `effectiveRows`; arrastrar un suceso escribe el segundo absoluto (R3) (Tasks 2, 6, 9).
3. **Cambiar de hoja ida y vuelta:** cada hoja recupera su adhesivo, rango, sucesos (incluida Prensa Cerrada), parámetros y layout (R2, Task 4).
4. **Valores por defecto por usuario:** cambiar defaults, "Empezar de cero" y restaurar una versión antigua no los altera; usuario B no ve los de A (R1, Tasks 3 y 10).
5. **Cooling con inicio negativo o decimal:** mismo resultado que el original (bug 19 conservado, Task 2).

---

## Estructura de archivos

```
v2/legacy-fixtures/bondline/
  legacyReference.ts            ← copia literal del cálculo original (solo argumentos en vez de DOM)
  fixtures.ts                   ← hojas sintéticas (arrays) para pruebas diferenciales
  realFixture.ts                ← carga bondline-real.xlsx si existe (skip si no)
  legacyReference.test.ts
v2/src/persistence/
  preferences.ts (+ test)       ← preferencias por usuario (R1)
v2/src/tools/bondline/
  logic/types.ts parse.ts range.ts activation.ts cooling.ts stats.ts results.ts events.ts loss.ts
        markers.ts defaults.ts differential.test.ts
  store.ts  BondlineStoreProvider.tsx  useBondlinePersistence.ts  useBondlineDefaults.ts
  importWorkbook.ts  i18n.ts  BondlineTool.tsx  bondline.css
  components/Header.tsx EmptyState.tsx DefaultsDialog.tsx Kpis.tsx ResultBoxes.tsx RawMaterial.tsx
             TimeRange.tsx Chart.tsx chartConfig.ts Legend.tsx useEventDrag.ts
             ProcessParams.tsx Events.tsx Layout.tsx
  export/exportModel.ts exportChart.ts drawExport.ts exportPng.ts
v2/src/ui/RichText.tsx          ← movido desde gapcheck (lo usan ambas herramientas)
```

---

### Task 1: Referencia legacy y fixtures

**Files:** Create `v2/legacy-fixtures/bondline/{legacyReference,fixtures,realFixture,legacyReference.test}.ts`.

**Interfaces — Produces:**
- `legacyLoadSheet(raw: unknown[][]): { columns: (number|null)[][]; totalRows: number } | 'empty' | 'noTemperature'` — pasos 4–7 de `loadSheet` (1580-1668) literales.
- `legacyRenderCalc(p: { columns; totalRows; cfg: { min: number; max: number; label: string }; timeRange: { active: boolean; start: number; end: number|null } }): { effectiveStart; effectiveEnd; effectiveRows; labels: number[]; trimmedColumns; activationStart: number|null; activationEnd: number|null; allInRange: boolean; yMin: number; yMax: number; minTemp: number; maxTemp: number }` — cuerpos de 1775-1828 sin modificar expresiones.
- `legacyStatsTexts(calc, lang): { tc: string; duration: string; min: string; max: string; activation: string; activated: boolean }` y `legacyActivationResultHtml(calc, cfg, lang): { className: string; html: string }` (2117-2132, con `T()` y el `I18N` literal).
- `legacyCooling(columns, totalRows, inputs: { start: string; closed: string; end: string }, target: number, lang): { className: string; display: string; html: string }` (1931-1941, 2134-2171).
- `legacyActiveEvents(inputs: Record<EventInputId, string>, lang): { x: number; label: string; color: string; id: string }[]` (1270-1288 + `EVENTS_CONFIG`/`EVENTS_LABELS`).
- `legacyCalcLoss(thermo: string, nest: string): { text: string; className: string }` (3083-3101).
- `legacyMarkerPositions(n: number): { x: number; y: number }[]` (2905-2936).
- `legacySaveDefaults(form: { wbMin: string; wbMax: string; hmMin: string; hmMax: string; cooling: string }): BondlineDefaults` (1067-1095, los `|| 55` etc.).
- `legacyApplyTimeRange(start: string, end: string, totalRows: number, lang): { start: number; end: number|null } | { alert: string }` (1714-1751).
- `legacyDragDelta(newX: number, originalX: number): { text: string; color: string }` (2015-2088).
- `legacyAnnotations(calc, cfg, adhesiveType, events, cooling, dark, lang)` (1858-1970) — objeto `annotations` sin funciones `enter/leave`.
- `FIXTURES: Record<string, unknown[][]>`: `plain` (4 TC × 120 s, activa y pasa), `outOfRange` (una TC supera max en la ventana), `neverActivates`, `windowPastEnd` (activa a 10 s del final), `blankRows`, `interiorNulls`, `textColumn` (columna de hora en texto, se descarta), `numericStrings` (`"12abc"`, `"1,5"`, `" 60 "`), `trailingNulls`, `empty`, `allText`.
- `loadRealWorkbook(): { name: string; raw: unknown[][] }[] | null` — `XLSX.readFile('../private/bondline-real.xlsx')`, todas las hojas con `sheet_to_json(ws, { header: 1, defval: null })`; `null` si no existe.

- [ ] **Step 1:** Copiar el código citado en el inventario §2A, §3, §4, §5C, §6 desde `bondline/index.html` (líneas indicadas) **sin modificar expresiones**; solo reemplazar DOM y globales por parámetros. Comentario de cabecera con las líneas de origen de cada función. `I18N` y `EVENTS_LABELS` copiados literal.
- [ ] **Step 2: Test** `legacyReference.test.ts` (real con `it.skipIf(!real)`): hoja 1 del real → 6 TC, `totalRows 91`; con waterbase 55/75 y sin rango: `legacyStatsTexts` = `{ tc:'6', duration:'91s', min:'28.7°', max:'64.4°', activation:'t=53s', activated:true }`; `legacyActivationResultHtml` → `className 'activation-result pass'` y título `✓ Ventana de activación exitosa` (valores medidos en el original por el dueño). `legacyCalcLoss('200','195')` → `'5.0 °C'` + `loss-positive`; `legacySaveDefaults` con todo vacío → fábrica.
- [ ] **Step 3:** `cd v2 && npx vitest run legacy-fixtures/bondline` → PASS.
- [ ] **Step 4: Commit** `test(bondline): referencia legacy y fixtures para pruebas diferenciales`.

### Task 2: Lógica pura de Bondline

**Files:** Create `src/tools/bondline/logic/{types,parse,range,activation,cooling,stats,results,events,loss,markers,defaults}.ts` + `logic/differential.test.ts`.

**Interfaces — Produces:**
- `types.ts`: `Column = (number|null)[]`; `ParsedSheet { columns: Column[]; totalRows: number }`; `AdhesiveType = 'waterbase'|'hotmelt'`; `SubstrateType = 'pcabs'|'pp'`; `BondlineDefaults { waterbase: {min,max}; hotmelt: {min,max}; coolingTarget: number }`; `FACTORY_DEFAULTS = { waterbase:{min:55,max:75}, hotmelt:{min:60,max:80}, coolingTarget:35 }`; `ACTIVATION_DURATION = 30`; `TC_COLORS` (20, literal); `TimeRange { active: boolean; start: number; end: number|null }`; `EventInputId` (las 9 ids de §5C); `EventInputs = Record<EventInputId, string>`; `EVENTS_CONFIG` (orden, id, labelKey, color literales).
- `parse.ts`: `parseSheetRows(raw: unknown[][]): { ok: true; data: ParsedSheet } | { ok: false; reason: 'empty'|'noTemperature' }` (sin `Math.max(...)` sobre arrays grandes — precedente GapCheck §C.37; mismos resultados).
- `range.ts`: `effectiveRange(totalRows, tr: TimeRange): { start: number; end: number; rows: number }`; `trimColumns(columns, start, end): Column[]`; `validateTimeRange(start: string, end: string, totalRows): { ok: true; range: TimeRange } | { ok: false; error: 'startNegative'|'endNotAfterStart'|'endExceeds' }` (`parseInt(x) || 0`, comprobaciones en el orden original).
- `activation.ts`: `adhesiveConfig(defaults, type): { min; max; label: 'Water Base'|'Hotmelt' }`; `findActivationStart(columns, totalRows, min): number|null`; `isWindowInRange(columns, totalRows, activationStart, range, cfg): boolean`; `yLimits(trimmed: Column[]): { yMin: number; yMax: 80 }`.
- `stats.ts`: `minMaxTemp(columns): { min: number; max: number }`; `kpiTexts(data: ParsedSheet, activationStart): { tc; duration; min; max; activation: string; activated: boolean }`.
- `results.ts`: `activationResult(activationStart, allInRange, effectiveStart, cfg): { variant: 'pass'|'fail'; titleKey: 'resultPassTitle'|'resultFailTitle'|'resultOutTitle'; bodyKey: 'resultPass'|'resultFail'|'resultOut'; args: (number|string)[] }`.
- `cooling.ts`: `coolingCheck(columns, totalRows, inputs: Pick<EventInputs,'eventCoolingStart'|'eventCoolingClosed'|'eventCoolingEnd'>, target): { hasCoolingEvents: boolean; show: boolean; achievedAt: number|null; elapsed: number|null; coolingStart: number }`.
- `events.ts`: `activeEvents(inputs: EventInputs, lang): ActiveEvent[]`; `visibleEventX(evt, range): number|null` (`evt.x - effectiveStart` en `[0, rows)`); `dragDelta(newX, originalX): { text: string; tone: 'pos'|'neg'|'zero' }`; `dragToAbsolute(relX: number, range, totalRows): number|null` (R3).
- `loss.ts`: `computeLoss(thermo: string, nest: string): { text: string; positive: boolean }`.
- `markers.ts`: `defaultMarkerPositions(visibleCount): { x: number; y: number }[]`.
- `defaults.ts`: `parseDefaultsForm(form): BondlineDefaults`; `normalizeDefaults(raw: unknown): BondlineDefaults` (forma inválida/parcial → `FACTORY_DEFAULTS`, R1).

- [ ] **Step 1: Failing test** `differential.test.ts`: para cada fixture y cada hoja del real (skip si falta), `parseSheetRows` ≡ `legacyLoadSheet`; para cada hoja válida × {waterbase, hotmelt} × rangos (`inactivo`, `{0,null}`, `{10,60}`, `{60,null}`, uno que corta la ventana, uno que deja la activación antes del inicio) los resultados de `effectiveRange`+`trimColumns`+`findActivationStart`+`isWindowInRange`+`yLimits`+`minMaxTemp` ≡ `legacyRenderCalc`; `kpiTexts` ≡ `legacyStatsTexts`; `activationResult` renderizado con `T` ≡ `legacyActivationResultHtml` (Review Focus 1–2); `coolingCheck` + texto ≡ `legacyCooling` para inicios `''`, `'0'`, `'40'`, `'40.5'`, `'-3'`, `'500'` y con/sin `closed`/`end` (Review Focus 5); `activeEvents` ≡ referencia (incluye `'-1'`, `'abc'`, `'12abc'`); `computeLoss` ≡ `legacyCalcLoss` (`''`, `'0'`, negativos, `'1,5'`); `defaultMarkerPositions(1..25)` ≡ referencia; `parseDefaultsForm` ≡ `legacySaveDefaults` (vacíos, `'0'`, `'12abc'`); `validateTimeRange` mapeado a los textos de alerta ≡ `legacyApplyTimeRange` (`'-1'`, `'5.7'`, `end<=start`, `end>totalRows`, `''`); `dragDelta` ≡ referencia; `dragToAbsolute` con rango inactivo ≡ valor legacy.
- [ ] **Step 2:** FAIL. **Step 3:** implementar copiando la lógica (TypeScript, inmutable). **Step 4:** PASS.
- [ ] **Step 5: Commit** `feat(bondline): lógica de cálculo idéntica al original con pruebas diferenciales`.

### Task 3: Preferencia por usuario de valores por defecto

**Files:** Create `src/persistence/preferences.ts` + test, `src/tools/bondline/useBondlineDefaults.ts` + test.

**Interfaces — Consumes:** `useUid()` (`persistence/uidContext.tsx`), `normalizeDefaults`, `parseDefaultsForm`, `FACTORY_DEFAULTS` (Task 2).
**Produces:**
- `loadPreference<T>(uid: string, key: string): Promise<T | undefined>`, `savePreference<T>(uid: string, key: string, value: T): Promise<void>` — mismo object store de idb-keyval que `snapshotStore`, prefijo `~pref~:` (las funciones de listado/poda de snapshots deben ignorarlo; test).
- `useBondlineDefaults(): { defaults: BondlineDefaults; loaded: boolean; save(form): Promise<void>; resetToFactory(): Promise<void> }` — carga al montar con `normalizeDefaults`; `save` = R1 (`parseDefaultsForm`, guarda, aplica); `resetToFactory` guarda y aplica fábrica.

- [ ] **Step 1: Failing tests:** sin preferencia → fábrica y `loaded` true; `save` con `{ wbMin:'', wbMax:'80', … }` → `{ waterbase:{min:55,max:80}, … }` guardado bajo el uid actual; otro uid no lo ve (Review Focus 4); preferencia corrupta (`{ waterbase: 3 }`) → fábrica; `listSnapshots`/poda no tocan claves `~pref~:`.
- [ ] **Step 2–4:** FAIL → implementar → PASS.
- [ ] **Step 5: Commit** `feat(bondline): valores por defecto como preferencia por usuario`.

### Task 4: Store por instancia, importación de libro y persistencia

**Files:** Create `src/tools/bondline/{store,BondlineStoreProvider,useBondlinePersistence,importWorkbook}.ts(x)` + tests.

**Interfaces — Consumes:** `parseSheetRows`, `defaultMarkerPositions` (Task 2); `usePersistentTool`; patrón de `gapcheck/GapcheckStoreProvider.tsx` y `useGapcheckPersistence.ts`.
**Produces:**
- `importWorkbook(file: File): Promise<{ name: string; raw: unknown[][] }[]>` — `XLSX.read(new Uint8Array(buf), { type: 'array' })`, todas las hojas con `sheet_to_json(ws, { header: 1, defval: null })`. Error → rechaza (toast `T('fileReadError')` = `Error al leer el archivo. Por favor intenta de nuevo.` + EN nueva).
- `SheetConfig { testDate: string; adhesive: AdhesiveType; substrate: SubstrateType; tcVisibility: boolean[]; timeRange: TimeRange; timeRangeInputs: { start: string; end: string }; events: EventInputs; coolingParams: { chiller; nestUpper; nestLower: string }; params: { thermoUpper; nestUpper; thermoLower; nestLower; slidersTemp: string; leisters: string[] }; layout: { image: Blob|null; imageName: string|null; markers: { tcIndex: number; x: number; y: number }[] } }` (`leisters` arranca en `['']`).
- `BondlineState { fileName: string|null; sheets: { name: string; data: ParsedSheet | null; reason?: 'empty'|'noTemperature' }[]; sheetIndex: number; config: SheetConfig; sheetConfigs: Record<string, SheetConfig>; panels: { params: boolean; events: boolean; layout: boolean }; layoutFit: boolean }` — todo clonable; los defaults **no** están aquí (R1).
- Acciones: `loadWorkbook(fileName, sheets): { ok: true } | { ok: false; sheetName: string; reason }` (parsea todas; si la hoja 0 no es válida devuelve el error y no cambia el estado — R10; si es válida vacía `sheetConfigs`, R2), `selectSheet(index)` (guarda `config` en `sheetConfigs[nombre actual]`, restaura el de destino o hereda según R2; hoja inválida → `{ ok:false }` con el texto `La hoja "${sheetName}" no contiene datos válidos` / `…datos de temperatura válidos`, estado intacto), `setTestDate`, `setAdhesive`, `setSubstrate`, `toggleTC(i)` (regenera marcadores por defecto si hay imagen, R4), `setTimeRangeInput`, `applyTimeRange(): 'startNegative'|'endNotAfterStart'|'endExceeds'|null`, `resetTimeRange()`, `setEvent(id, value)`, `setCoolingParam`, `setParam`, `addLeister()`, `removeLeister()` (mín. 1), `setLeister(i, v)`, `setLayoutImage(blob, name)`, `moveMarker(tcIndex, x, y)`, `setLayoutFit(b)`, `setPanelOpen(key, b)`, `reset()`.
- `selectActiveSheet(s): ParsedSheet | null`; `snapshotOf(s): BondlineState`; `restoreInto(api, snapshot)` (rellena campos faltantes con `initialData()` como GapCheck).
- `BondlineStoreProvider` (store y ref del canvas de la gráfica por montaje, `useState(createBondlineStore)`), `useBondline(selector)`, `useBondlineApi()`, `useBondlineChartCanvas()`.
- `useBondlinePersistence()` — `usePersistentTool('bondline', { getSnapshot: () => snapshotOf(api.getState()), restore, reset })`, `markDirty` en cada cambio tras `restored`.

- [ ] **Step 1: Failing tests:** `loadWorkbook` con el real → hoja 0 activa, 6 TC, `sheetConfigs` vacío; libro con hoja 0 `empty` → `{ ok:false, reason:'empty' }` y estado intacto; libro sintético de 2 hojas: cambiar adhesivo, rango, `eventPressClosed`, leisters y marcador en hoja 1 → ir a hoja 2 (hereda adhesivo, rango reiniciado) → volver → todo recuperado (Review Focus 3); hoja 2 con distinto nº de TC → visibilidad toda `true`; cargar otro archivo vacía `sheetConfigs`; `applyTimeRange` con `'-1'` → `'startNegative'` y rango sin cambios; `removeLeister` con 1 no hace nada; `structuredClone(snapshotOf(s))` sin error y `restoreInto` devuelve el mismo estado; dos Providers montados no comparten estado; `importWorkbook` con xlsx generado (XLSX.write, 3 hojas) devuelve las 3 en orden.
- [ ] **Step 2–4:** FAIL → implementar → PASS.
- [ ] **Step 5: Commit** `feat(bondline): estado por instancia, libro con varias hojas y guardado automático`.

### Task 5: i18n literal, estructura, cabecera, resumen y paneles laterales

**Files:** Create `src/tools/bondline/{i18n.ts,BondlineTool.tsx,bondline.css}`, `components/{Header,EmptyState,DefaultsDialog,Kpis,ResultBoxes,RawMaterial,TimeRange}.tsx` + tests; Move `src/tools/gapcheck/components/RichText.tsx` → `src/ui/RichText.tsx` (actualizar imports de gapcheck); Modify `src/tools/registry.ts` (`bondline: () => import('./bondline/BondlineTool')`).

**Interfaces — Consumes:** store (Task 4), `useBondlineDefaults` (Task 3), lógica (Task 2), `HistoryPanel`, `SavedIndicator`, `Dialog`, `Button`, `GlassPanel`, `toast`.
**Produces:** `useBondlineT(): (key: BondlineKey, ...args: (number|string)[]) => string` — diccionario §8 **literal** (entradas función incluidas) con el idioma del toolbox (`useI18n().lang`), fallback lang → ES → key como `T()`; claves nuevas: `fileDims` (`{n} s × {m} termopares` / `{n} s × {m} thermocouples`), `changeFile`, `history`, `fileReadError`, `sheetEmpty`, `sheetNoTemp`, `timeStartNegative`, `timeEndNotAfterStart`, `timeEndExceeds`, `defaultsConfirmReset`, `layoutFit`/`layoutRealSize` (`Tamaño real`, como GapCheck). `useBondlineView()` — selector derivado (memo) que combina hoja activa + `config` + `defaults` y devuelve `{ cfg, range, trimmed, labels, activationStart, activationEnd, allInRange, yMin, yMax, kpis, result, cooling, events }` (una sola fuente para gráfica, resumen y export).
- Header (R6): `📂 {fileName}`, chip `fileDims`, `📊 Hoja Activa` + `<select>` `` `${idx+1}. ${name}` `` + ←/→ (títulos `Hoja anterior`/`Hoja siguiente`) solo si hay > 1 hoja, `testDateLabel` + input con `testDatePlaceholder`, `SavedIndicator`, botones `changeFile`, `menuDefaults` (abre DefaultsDialog), `history`, `menuDownload`.
- DefaultsDialog: `defaultsTitle`/`defaultsSubtitle`, grupos Water Base / Hotmelt (`defaultsTempMin`/`defaultsTempMax`) y `defaultsCoolingTarget`, inputs number step 0.1, pie `defaultsReset` | `defaultsCancel` | `defaultsSave` (semántica R1, R8).
- EmptyState: `fileTitle`, `fileSubtitle`, `fileDrop` (RichText), `.xlsx,.xls,.csv`. Kpis: 5 tarjetas con chips `TC`/`⏱`/`↓`/`↑`/`⚡`, colores de chip del original (§4A) mapeados a tokens, etiquetas `statThermocouples`…`statActivation`/`statNotReached`. ResultBoxes: `activationResult` (`pass`/`fail`) y `coolingResult` (solo si `cooling.show`). RawMaterial: `rawMaterialTitle`, `adhesiveSection` Water Base/Hotmelt, `tempInfo` (`` `${adhesiveMin}: ${min}°C | ${adhesiveMax}: ${max}°C` ``), `substrateSection` PC-ABS/PP, `` `${needsFlame}: ${pp ? flameYes : flameNo}` ``. TimeRange: `timeRangeTitle`, `timeRangeSubtitle`, `timeRangeStart`, `timeRangeEnd` (placeholder `0` / `Auto`), botones `✓` (title `Aplicar rango`) y `↻` (title `Restaurar`); errores → toast con los textos de §6.

- [ ] **Step 1: Failing tests:** sin datos se ve EmptyState; tras cargar el real: KPIs `6`, `91s`, `28.7°`, `64.4°`, `t=53s` y caja `✓ Ventana de activación exitosa` con cuerpo `Todos los termopares alcanzaron 55°C en t=53s. Durante los 30s siguientes, todas las lecturas se mantuvieron entre 55°C y 75°C.`; Hotmelt cambia `tempInfo` a `Mín: 60°C | Máx: 80°C` y recalcula; PP muestra `Necesita Flama: SÍ` sin cambiar valores; EN muestra `Thermocouples`, `Cycle duration`, `Default Values`; guardar defaults con Water Base mín `''` y máx `'60'` aplica `55/60` (R1), cambia `tempInfo` a `Mín: 55°C | Máx: 60°C` y la caja ≡ `legacyActivationResultHtml` con `{min:55,max:60}`; "Restaurar valores de fábrica" pide confirmación, deja el diálogo abierto y refresca al momento (R8); selector de hoja oculto con 1 hoja; Fecha de Prueba visible con 1 hoja; edición deshabilitada mientras no `restored && loaded`; hoja inválida → toast con el texto literal.
- [ ] **Step 2–4:** FAIL → implementar → PASS. Diseño según mockup: cabecera en una tira, fila KPI de 5 + caja de resultado, grid principal (gráfica izquierda; Materia Prima y Rango Temporal a la derecha) ≥ 1100 px y una columna debajo; glass y tokens del tema; Space Grotesk en números.
- [ ] **Step 5: Commit** `feat(bondline): estructura, cabecera, resumen, materia prima y rango temporal`.

### Task 6: Gráfica, leyenda y arrastre de sucesos

**Files:** Create `components/{chartConfig.ts,Chart.tsx,Legend.tsx,useEventDrag.ts}` + tests.

**Interfaces — Consumes:** `useBondlineView`, `getChartTheme`, `useTheme().resolved`, `TC_COLORS`, `visibleEventX`, `dragDelta`, `dragToAbsolute`; registro de Chart.js como `gapcheck/components/Chart.tsx` (`LineController`, `LineElement`, `PointElement`, `CategoryScale`, `LinearScale`, `Tooltip`, `annotationPlugin`).
**Produces:**
- `buildChartConfig(input: { view; tcVisibility: boolean[]; adhesive: AdhesiveType; coolingTarget: number; lang; dark: boolean; theme: BondlineChartTheme; t: BondlineT }): ChartConfiguration<'line'>` — pura: opciones de §5A, datasets de §5B (`TC-${i+1}`, `borderWidth 2.5`, `pointRadius 0`, `pointHoverRadius 5`, `tension .3`, `spanGaps true`, `hidden: !tcVisibility[i]`), anotaciones de §5C (`minLine`, `maxLine`, `activationWindow` con su condición y clamp, `event_${idx}`, `coolingTargetLine` con `🎯 ${T}°C`), tooltip y ticks del Global Constraint.
- `<BondlineChart/>` (canvas en el ref del Provider, alto 500 px, instancia recreada al cambiar config) y `<Legend/>` (§5D: línea de color, `TC-n`, botón `hideTC`/`showTC` → `toggleTC`, ítems ocultos opacidad .4, `legendLimits` con borde `--amber`/`--cyan`, `legendWindow`, `🎯 Cooling ${T}°C` si hay sucesos de cooling).
- `useEventDrag(chartRef, events, range, totalRows, setEvent)` — clic `< 10px` selecciona (último que coincide), arrastre redondea con `getValueForPixel`, escribe el absoluto (R3), tooltip flotante `<span style="color:{tone}">{delta}s</span> — t={newX}s`; listeners añadidos una vez y retirados al desmontar.

- [ ] **Step 1: Failing tests** sobre `buildChartConfig` con el real y con fixtures: un dataset por TC con color `TC_COLORS[i % 20]`, TC oculta → `hidden: true`; `y.min = yMin` legacy y `y.max = 80`; labels `0..effectiveRows-1`; anotaciones ≡ `legacyAnnotations` (sin `enter/leave`) para waterbase/hotmelt × día/noche × con/sin rango × con/sin sucesos y cooling; suceso fuera del rango no aparece; textos `Temp Mín: 55°C`, `Ventana de Activación (30s)`, EN `Activation Window (30s)`. `useEventDrag`: con rango `{20, null}` arrastrar la línea de `Inicia Prensa` (x=30) a la posición relativa 15 escribe `35`; delta `+5`/`-3`/`±0`; re-renders no duplican listeners ni tooltips (cuenta de `#dragEventTooltip` = 1). Leyenda: clic en `Ocultar` cambia a `Mostrar` y oculta el dataset sin cambiar KPIs ni resultado.
- [ ] **Step 2–4:** FAIL → implementar (Chart.js mockeado en tests de componente; `buildChartConfig` sin mock) → PASS.
- [ ] **Step 5: Commit** `feat(bondline): gráfica térmica, leyenda y sucesos arrastrables`.

### Task 7: Parámetros del proceso y Sucesos

**Files:** Create `components/{ProcessParams,Events}.tsx` + tests.

**Interfaces — Consumes:** store (`setParam`, `addLeister`, `removeLeister`, `setLeister`, `setEvent`, `setCoolingParam`, `setPanelOpen`), `computeLoss`, `useBondlineView().cooling`.
- ProcessParams (plegable, `paramsTitle`/`paramsSubtitleFull`): columnas `paramUpper` (`paramThermoregUpper`, `paramNestUpper`, `paramLoss`) y `paramLower` (idem inferior), cajas de pérdida con `computeLoss` (`— °C` inicial; clase ámbar si positiva), `paramLeistersLabel` con `Leister ${n}` dinámicos (+/−, mín. 1; inputs number step 0.1, placeholder `°C`), `paramSlidersLabel` / `paramSliders`.
- Events (plegable, `eventsTitle`/`eventsSubtitle`): grupos `eventsPrensa`, `eventsManipulation`, `eventsCooling` con las 9 entradas (labels `eventPressStart`…, number step 1 min 0 placeholder `s`); `coolingParamsTitle` con `coolingChiller`/`coolingNestUpper`/`coolingNestLower` visible solo si los 3 sucesos de cooling no están vacíos (`checkCoolingParams`).

- [ ] **Step 1: Failing tests:** plegados por defecto y estado persistido (R6); `thermoUpper 200` + `nestUpper 195` → `5.0 °C` ámbar; vacío → `— °C`; añadir 2 leisters → `Leister 2`, `Leister 3`; quitar con 1 no hace nada; escribir `Inicia Ciclo Cooling 40` aparece la caja de cooling y la línea objetivo en la config de la gráfica; parámetros de cooling ocultos hasta rellenar los 3 sucesos; valores `'12abc'` se aceptan como en el original.
- [ ] **Step 2–4:** FAIL → implementar → PASS. **Step 5: Commit** `feat(bondline): parámetros del proceso y sucesos`.

### Task 8: Bondline Layout

**Files:** Create `components/Layout.tsx` + test (reutiliza `gapcheck/components/Marker.tsx`; si necesita cambios, moverlo a `src/ui/` en este task y actualizar GapCheck).

**Interfaces — Consumes:** `defaultMarkerPositions`, `TC_COLORS`, store layout actions, `MAX_FILE_BYTES`.
- [ ] **Step 1: Failing tests:** sin imagen zona de carga (`layoutTitle`, `layoutSubtitle`, `layoutDrop` en RichText); archivo no imagen → toast `Por favor selecciona una imagen` / `Please select an image`; con datos, un marcador por TC **visible** en `defaultMarkerPositions(visibles)` (% relativo a la imagen, R4), color `TC_COLORS[idx % 20]`, texto `idx+1`, etiqueta accesible `TC-${idx+1}`; arrastre (pointer) y flechas actualizan `moveMarker` limitado a [0,100]; ocultar una TC regenera posiciones por defecto (conservado); `layoutInstructions` visible; botón `Tamaño real` alterna ajuste/tamaño natural y se persiste (§C.30); "Cambiar imagen"; imagen que no decodifica → aviso y vuelve a la zona de carga (§C.38); imagen > 20 MB → se usa, aviso único (§C.35).
- [ ] **Step 2–4:** FAIL → implementar → PASS. **Step 5: Commit** `feat(bondline): layout de termopares con marcadores arrastrables`.

### Task 9: Export PNG Nebulosa (con aprobación previa del dueño)

**Files:** Create `v2/legacy-fixtures/private/mockups/bondline-export.html` (+ `bondline-export.png`), luego `export/{exportModel,exportChart,drawExport,exportPng}.ts` + tests.

**Interfaces — Produces:** `buildExportModel(state, view, defaults, lang, now: Date): BondlineExportModel | null` (pura: título `Bondline — Activación de Adhesivo` / `Bondline — Adhesive Activation`; fecha `now.toLocaleString(es ? 'es-MX' : 'en-US')`; 5 tarjetas §7.4 con duración `effectiveRows + 's'` y activación absoluta; panel `exportParams` con columnas `'▲ ' + T('paramUpper')`, `'▼ ' + T('paramLower')`, sub-filas `Termoreg.`/`Nido`/`Pérdida`, Leisters (si alguno tiene valor), Sliders (`Temperatura`), `❄️ Cooling` (`Chiller`/`Nido Sup`/`Nido Inf`) con la regla de cabida §7.5; leyenda §7.7; marcadores de TC visibles; pie `T('footer')`; ``fileName = `Bondline - ${testDate || 'SinFecha'} - ${sheetName.replace(/[/\\:*?"<>|]/g, '-')}.png` ``, `sheetName` = hoja activa o `'Hoja1'`); `buildExportChartConfig(...)` (§7.6: 1800×845, solo TC visibles, `borderWidth 3`, anotaciones de export con sus anchos/dashes/fuentes, cooling `xMin: coolingStartTime, xMax: totalRows` sin ajuste, sin tooltip); `drawExport(model, chartCanvas, layoutImage): HTMLCanvasElement` (1920×1280, composición aprobada); `exportBondlinePng(...)` (descarga; sin datos → toast `Por favor carga datos primero` / `Please load data first`; error → `Error al generar la imagen. Por favor intenta de nuevo.` / `Error generating image. Please try again.`; destruye la gráfica temporal).

- [ ] **Step 1: Mockup y STOP.** Producir un mockup estático del PNG (HTML + captura PNG en `legacy-fixtures/private/mockups/`, mismo lenguaje que el export de GapCheck: fondo Nebulosa, logo oscuro, tarjetas glass) con el contenido exacto de §7 usando la hoja 1 del Excel real (6 TC, `91s`, `28.7°`, `64.4°`, `t=53s`), con y sin layout, y una nota de qué es igual y qué cambia de aspecto. **Detenerse y pedir aprobación al dueño.** No seguir con los pasos 2–5 hasta tenerla; anotar en el plan las correcciones que pida.
- [ ] **Step 2: Failing tests** sobre `buildExportModel`/`buildExportChartConfig` con el real: textos y valores exactos (incluido `▲ ▲ Superior`), con rango `{20, 80}` duración `60s` y activación absoluta `t=53s`; filename `Bondline - 30/10/2026 - Hoja 1.png` para fecha y hoja dadas, `Bondline - SinFecha - Hoja1.png` sin ellas; TC oculta no se exporta (línea, leyenda ni marcador); columna de cooling omitida cuando no cabe con layout; config de export ≡ anotaciones de export del original (`legacyAnnotations` variante export añadida en Task 1 si hace falta).
- [ ] **Step 3–4:** FAIL → implementar (drawExport sin test de píxeles; se verifica en navegador en Task 10) → PASS.
- [ ] **Step 5: Commit** `feat(bondline): export PNG con diseño nebulosa`.

### Task 10: Integración, mejoras propuestas y verificación

**Files:** Create `src/tools/bondline/BondlineTool.integration.test.tsx`, `docs/superpowers/plans/bondline-mejoras-propuestas.md`.

- [ ] **Step 1: Integration test** (como `GapcheckTool.integration.test.tsx`): `BondlineTool` dentro de `AppShell` con persistencia real (fake-indexeddb): cargar el real → KPIs y resultado; cambiar adhesivo, rango, sucesos, parámetros, leisters, hoja y fecha; desmontar/remontar → todo restaurado; "Empezar de cero" → EmptyState, versión previa en el historial y **defaults intactos** (R1); restaurar la versión previa no cambia defaults; cambiar de usuario → no ve el análisis ni los defaults del anterior (Review Focus 4).
- [ ] **Step 2:** `bondline-mejoras-propuestas.md` con el formato de `gapcheck-mejoras-propuestas.md`: **A** cada rareza conservada del inventario §10 (11, 12, 13, 14 —`▲ ▲ Superior`, sub-etiquetas en ES, `exportTitle` sin uso, cooling sin ajuste en PNG, leyenda que se sale—, 15, 17 mismo archivo, 19, 21; `yMax` fijo 80; marcadores que vuelven a su sitio; fecha de prueba sin sanear en el nombre de archivo; activación/cooling ignoran visibilidad y rango) con "qué pasa hoy / qué se ganaría / estado"; **B** lo cambiado por regla (R1–R10, incl. bugs 1–10, 16, 18, 20, 22); **C** comportamientos y textos nuevos (cabecera, `fileDims`, toasts EN de errores, Tamaño real, Cambiar imagen, aviso > 20 MB, imagen que no decodifica, flechas de teclado, refresco inmediato R8). No implementar.
- [ ] **Step 3:** `npm test`, `npm run build`. **Verificación manual en navegador (la hace el controlador)** con el Excel real: KPIs `6 / 91s / 28.7° / 64.4° / t=53s`, caja `✓ Ventana de activación exitosa`, gráfica igual al original (comparar con `mockups/bondline-antes-3.jpg` y `-4.jpg`), Hotmelt, rango temporal, sucesos arrastrables con rango activo, cooling, parámetros, layout (ajuste y Tamaño real), selector de hoja, valores por defecto, export PNG contra el mockup aprobado, recarga a mitad de análisis, tema día/noche, ES/EN.
- [ ] **Step 4: Commit** `test(bondline): integración y documento de mejoras propuestas`.
