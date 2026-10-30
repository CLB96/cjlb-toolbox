# CJLB Toolbox v2 — Plan 2: GapCheck Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Portar GapCheck a la pestaña `gapcheck` de `v2/` con resultados idénticos a `gapcheck/index.html`, el diseño Nebulosa aprobado (mockup `v2/legacy-fixtures/private/mockups/gapcheck.html`) y guardado automático.

**Architecture:** La lógica de cálculo se copia del original a funciones puras en `src/tools/gapcheck/logic/` y se valida con **pruebas diferenciales**: una copia literal del código original (adaptada solo para recibir argumentos en vez de leer el DOM) vive en `legacy-fixtures/gapcheck/legacyReference.ts`, y cada función nueva debe producir exactamente la misma salida (incluidas las cadenas formateadas) sobre el Excel real del dueño y sobre fixtures sintéticos. El estado de la herramienta vive en un store Zustand por usuario y se persiste con `usePersistentTool`. La UI se arma con los componentes glass del Plan 1.

**Tech Stack:** React 18.3.1, TypeScript, Zustand 5, Chart.js 4.4.4 + chartjs-plugin-annotation 3.0.1 (exactas), xlsx 0.18.5, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-29-cjlb-toolbox-v2-design.md` (§4, §6.4, §9, §12b). **Inventario del original (fuente de verdad del comportamiento):** `docs/superpowers/plans/gapcheck-inventory.md`.

## Global Constraints

- Ningún valor ni gráfica cambia: mismas fórmulas, mismo orden de suma, mismos `toFixed`, MIN/MAX sin formatear, OK como `k / n`, estado con tolerancia `target * 0.10`, cumplimiento `v <= target`.
- Textos de interfaz copiados **literalmente** del diccionario original (inventario §10) en ES y EN, incluidos los no traducidos (`Tipo de Covering`, `Hard Covering`, `PTS`…). Nunca reescribir términos técnicos (p. ej. "Espesor de Skin").
- Paletas exactas: `PALETTE_SOLID` (15 colores, iteraciones y export) y `POINT_COLORS` (marcadores en pantalla), inventario §1. Línea objetivo `#43b36b`, dash `[6, 3]`, ancho 2.5, etiqueta `GapCheck: ${target.toFixed(2)} mm`.
- Importación: solo la **primera hoja**; columnas = puntos, filas = iteraciones; reglas de cabecera y celdas del inventario §3.
- Chart.js `4.4.4`, chartjs-plugin-annotation `3.0.1`, xlsx `0.18.5`: versiones exactas en `package.json`.
- Persistencia vía `usePersistentTool('gapcheck', { getSnapshot, restore, reset })`; `getSnapshot` lee de refs/store, datos clonables (sin funciones, sin elementos DOM). Edición bloqueada hasta `restored`.
- El Excel real (`legacy-fixtures/private/gapcheck-real.xlsx`) no se versiona; sus pruebas se saltan con aviso si falta.
- Archivos < 400 líneas; sin `console.log`; errores visibles con `toast`.

## Rulings (decisiones del controlador, revisables por el dueño)

- **R1 Botón "Actualizar Comparación":** se mantiene: al escribir solo cambian el resultado y la fórmula; la gráfica, el resumen y la tabla se recalculan al pulsar el botón (igual que hoy).
- **R2 Chips de filtro:** reflejan siempre el filtro real (hoy se re-marcan todos al reconstruir aunque el filtro siga activo). No cambia ningún valor.
- **R3 Leyenda:** clic en la leyenda sincroniza con los chips de iteración (hoy oculta el dataset por su cuenta). No cambia valores.
- **R4 Layout:** posiciones guardadas en % **relativo a la imagen** en pantalla y en el export (hoy en pantalla son relativas al contenedor y el export las reinterpreta). Colores de marcadores sin cambios (pantalla `POINT_COLORS`, export `PALETTE_SOLID`) — se propone unificarlos en el documento de mejoras.
- **R5 Export PNG:** composición Nebulosa aprobada (fondo oscuro, logo, título "Gapcheck Análisis"/"Gapcheck Analysis", fecha `toLocaleString()` + `   •   Covering: …`, tarjetas con los mismos valores y subtítulos del export original, bloque GAPCHECK OBJETIVO, layout si existe, gráfica). Nombre de archivo idéntico: `Gapcheck-Export-${new Date().toISOString().split('T')[0]}.png`.
- **R6** Nombres de punto escapados (React lo hace por defecto); tabla sin recorte de 1500 px (scroll interno).
- Cualquier otro comportamiento raro del inventario §12 se conserva y se lista en `docs/superpowers/plans/gapcheck-mejoras-propuestas.md` (Task 9) para que el dueño decida.

## Review Focus

1. **Excel con cabecera de texto, celdas vacías y números como texto** (`"2,5"`, `" 3.2 "`): mismos puntos, nombres e iteraciones que el original (test diferencial con fixture sintético, Task 2).
2. **Filtro que deja todo oculto:** KPI `'0','0','0','0','0 / 0'`, tabla vacía, gráfica vacía (Task 2 y Task 5).
3. **Soft covering con foam 0 o skin 0:** eje de compresión devuelve `'0%'` sin dividir por cero (Task 2).
4. **Recargar la página a mitad de análisis:** vuelve el archivo, filtros, covering, entradas, imagen y marcadores (Task 3 y Task 8).
5. **Imagen de layout muy grande (> 20 MB):** no rompe el guardado; se avisa que hay que volver a cargar la imagen (Task 7).

---

## Estructura de archivos

```
v2/legacy-fixtures/gapcheck/
  legacyReference.ts            ← copia literal del cálculo original (solo argumentos en vez de DOM)
  fixtures.ts                   ← hojas sintéticas (arrays) para pruebas diferenciales
  realFixture.ts                ← carga gapcheck-real.xlsx si existe (skip si no)
v2/src/tools/gapcheck/
  logic/parse.ts  stats.ts  target.ts  axis.ts  status.ts  chartStyle.ts  markers.ts  types.ts
  logic/*.test.ts               ← pruebas diferenciales
  store.ts                      ← Zustand: estado + acciones + snapshot/restore/reset
  importExcel.ts                ← File → filas (xlsx, primera hoja)
  i18n.ts                       ← diccionario ES/EN literal del original
  GapcheckTool.tsx              ← componente raíz (registrado en tools/registry.ts)
  components/Header.tsx  EmptyState.tsx  Kpis.tsx  TargetPanel.tsx  Chart.tsx  Filters.tsx
             DataTable.tsx  Layout.tsx  Marker.tsx
  export/exportModel.ts  export/drawExport.ts
  gapcheck.css
```

---

### Task 1: Referencia legacy y fixtures

**Files:** Create `v2/legacy-fixtures/gapcheck/legacyReference.ts`, `fixtures.ts`, `realFixture.ts`, `legacyReference.test.ts`.

**Interfaces — Produces:**
- `legacyProcessData(rows: unknown[][]): { points: { name: string; values: number[] }[]; maxIter: number } | null` — cuerpo de `processData` (inventario §3) literal, sin DOM.
- `legacyComputeGapCheck(i: { coveringType: 'hard'|'soft'; skin: string; pct: string; skinSoft: string; foam: string; pctSoft: string }): { target: number; valueText: string; formulaHtml: string }` — `parseFloat(x) || 0` sobre los strings, como el original.
- `legacyStats(points, visiblePoints: Set<number>, visibleIters: Set<number>, target: number): { totalRecords: string; avg: string; min: string; max: string; meeting: string }` — textos exactos que el original pone en `textContent` (`String(...)`).
- `legacyStatus(value: number, target: number): 'met'|'warning'|'notMet'`, `legacyPointStyle(y, target): { style, radius, hoverRadius, borderWidth }`, `legacyIterDataset(points, visiblePoints, iterIdx)`, `legacyCompressionTick(value, i: { coveringType, skin, skinSoft, foam }): string`, `legacyDefaultMarkerPositions(count: number): { x: number; y: number }[]`.
- `FIXTURES: Record<string, unknown[][]>` con al menos: `plain` (10×20 numérico), `header` (fila de nombres), `ragged`, `numericStrings` (`"2,5"`, `" 3.2 "`, `"12abc"`), `blanks`, `numericHeader` (1,2,3 como primera fila), `single` (1×1), `textOnlyColumn`, `empty`.
- `loadRealRows(): unknown[][] | null` — lee `../private/gapcheck-real.xlsx` con `XLSX.readFile` + primera hoja + `sheet_to_json(ws, { header: 1, defval: null })`; `null` si no existe.

- [ ] **Step 1:** Copiar el código citado en el inventario §2A, §3, §8 desde `gapcheck/index.html` (líneas indicadas) **sin modificar expresiones**; solo reemplazar lecturas de DOM por parámetros. Encabezar el archivo con un comentario que diga de qué líneas viene cada función.
- [ ] **Step 2: Test** `legacyReference.test.ts`: sobre `loadRealRows()` (skip con `it.skipIf(!real)`), `legacyProcessData` da 20 puntos × 10 iteraciones; `legacyStats` con todo visible y target 5 da `{ totalRecords:'20', avg:'2.25', min:'1.7', max:'2.65', meeting:'200 / 200' }` (valores medidos en el original con este archivo); `legacyComputeGapCheck` por defecto hard da `valueText '5.00'` y `formulaHtml 'Skin × (1 - 50%)  →  10 × 0.50 = <strong>5.00 mm</strong>'`; soft por defecto `'35.00'`.
- [ ] **Step 3:** `cd v2 && npx vitest run legacy-fixtures` → PASS.
- [ ] **Step 4: Commit** `test(gapcheck): referencia legacy y fixtures para pruebas diferenciales`.

### Task 2: Lógica pura de GapCheck

**Files:** Create `src/tools/gapcheck/logic/{types,parse,stats,target,axis,status,chartStyle,markers}.ts` + `logic/differential.test.ts`.

**Interfaces — Produces:**
- `types.ts`: `CoveringType = 'hard'|'soft'`; `GapPoint { name: string; values: number[] }`; `TargetInputs { skin: string; pct: string; skinSoft: string; foam: string; pctSoft: string }` (strings, como los inputs); `DEFAULT_TARGET_INPUTS = { skin:'10', pct:'50', skinSoft:'10', foam:'50', pctSoft:'50' }`.
- `parseRows(rows: unknown[][]): { points: GapPoint[]; maxIter: number } | null`
- `computeTarget(covering: CoveringType, inputs: TargetInputs): { target: number; valueText: string; formula: { text: string; result: string } }` — `formula.text` es lo previo a `<strong>` y `formula.result` el contenido de `<strong>` (la UI los compone; el test reconstruye el HTML y lo compara con la referencia).
- `computeStats(points, visiblePoints: ReadonlySet<number>, visibleIters: ReadonlySet<number>, target: number): KpiTexts` (`KpiTexts = { totalRecords, avg, min, max, meeting }` strings).
- `statusOf(value, target)`, `pointStyle(y, target)`, `iterDataset(points, visiblePoints, iterIdx): { x: number; y: number }[]`, `compressionTick(value: number, covering, inputs): string`, `defaultMarkerPositions(count): { x: number; y: number }[]`.
- `PALETTE_SOLID`, `POINT_COLORS` (constantes literales), `hexToRgba(hex, alpha)`.

- [ ] **Step 1: Failing test** `differential.test.ts`: para cada fixture de `FIXTURES` y el real (skip si falta), `parseRows` ≡ `legacyProcessData` (`toEqual`); para combinaciones de visibilidad (todo, ninguno, solo puntos pares, solo iteración 1) `computeStats` ≡ `legacyStats`; para una malla de entradas (`'10','50'`, `''`, `'0'`, `'12.5'`, `'101'`, `'-5'`) en hard y soft, `computeTarget` reconstruido ≡ `legacyComputeGapCheck`; `compressionTick` ≡ referencia para valores `[0, 1, 1.7, 2.25, 5, 9.99]` con skin/foam `0` incluidos (Review Focus 3); `statusOf`, `pointStyle`, `iterDataset`, `defaultMarkerPositions(1..40)` ≡ referencia.
- [ ] **Step 2:** FAIL. **Step 3:** implementar copiando la lógica (TypeScript, inmutable). **Step 4:** PASS.
- [ ] **Step 5: Commit** `feat(gapcheck): lógica de cálculo idéntica al original con pruebas diferenciales`.

### Task 3: Store, importación y persistencia

**Files:** Create `src/tools/gapcheck/store.ts`, `importExcel.ts`, tests.

**Interfaces — Consumes:** `parseRows`, `computeTarget`, `computeStats` (Task 2); `usePersistentTool` (Plan 1, ver README "Portar una herramienta").
**Produces:**
- `importExcelFile(file: File): Promise<unknown[][]>` — `XLSX.read(new Uint8Array(buf), { type: 'array' })`, `SheetNames[0]`, `sheet_to_json(sheet, { header: 1, defval: null })`. Errores de lectura → rechaza con `Error` (la UI muestra toast `t('importFailed')`, clave nueva ES "No se pudo leer el archivo", EN "The file could not be read").
- `GapcheckState { fileName: string|null; points: GapPoint[]; maxIter: number; visiblePoints: number[]; visibleIters: number[]; covering: CoveringType; inputs: TargetInputs; appliedTarget: number; appliedCovering: CoveringType; appliedInputs: TargetInputs; tableOpen: boolean; layout: LayoutState }` (arrays en vez de Set para que sea clonable). `LayoutState { image: Blob|null; imageName: string|null; markers: { pointIndex: number; x: number; y: number }[]; markerSize: number }` (`markerSize` default 44).
- Acciones: `loadRows(fileName, rows)` (sin datos numéricos → no cambia estado y devuelve `false`; con datos resetea filtros a todo visible, aplica comparación y regenera marcadores por defecto si hay imagen), `togglePoint(i)`, `toggleIter(j)`, `setCovering(c)`, `setInput(key, value)`, `applyComparison()` (copia `covering`/`inputs` a `applied*` y `appliedTarget` — R1), `setTableOpen(b)`, `setLayoutImage(blob, name)`, `moveMarker(pointIndex, x, y)`, `setMarkerSize(n)`, `reset()`.
- Selectores: `selectKpis(state)` → `computeStats(points, new Set(visiblePoints), new Set(visibleIters), appliedTarget)`; `selectLiveTarget(state)` → `computeTarget(covering, inputs)` (resultado en vivo del panel).
- `useGapcheckPersistence()` — conecta el store con `usePersistentTool('gapcheck', { getSnapshot: () => store.getState() datos, restore: s => store.setState(s), reset })`, marca dirty en cada cambio de estado, y expone `restored`.

- [ ] **Step 1: Failing tests:** `loadRows` con fixture real → 20 puntos, filtros completos, `appliedTarget 5`; `loadRows` con `empty` → `false` y estado intacto; escribir `pct='60'` no cambia `appliedTarget` hasta `applyComparison()` (R1); snapshot → `structuredClone` sin error y `restore` devuelve el mismo estado (Review Focus 4); `importExcelFile` con un xlsx generado en el test (XLSX.write) devuelve las filas de la primera hoja aunque haya varias.
- [ ] **Step 2–4:** FAIL → implementar → PASS.
- [ ] **Step 5: Commit** `feat(gapcheck): estado, importación de Excel y guardado automático`.

### Task 4: i18n literal y estructura de la herramienta

**Files:** Create `src/tools/gapcheck/i18n.ts`, `GapcheckTool.tsx`, `components/{Header,EmptyState,Kpis,TargetPanel}.tsx`, `gapcheck.css`; Modify `src/tools/registry.ts` (load de `gapcheck` → `GapcheckTool`).

**Interfaces — Produces:** `useGapcheckT(): (key: GapcheckKey) => string` usando el idioma del toolbox (`useI18n().lang`) y el diccionario **copiado literal** del inventario §10 (+ `importFailed`). Componentes según el mockup aprobado: Header (título `pageTitle`, chip archivo con `fileName` y `"{n} iteraciones × {m} puntos"`, botones Cambiar archivo / Historial (`HistoryPanel` del Plan 1 en un `Dialog`) / Exportar PNG, `SavedIndicator`), EmptyState (zona de arrastre con textos `dropText`/`uploadSubtitle` originales, acepta `.xlsx,.xls,.csv`), Kpis (fila de 6: bloque GAPCHECK OBJETIVO con `appliedTarget.toFixed(2)` + `mm` y etiqueta del covering aplicado, más PTS/AVG/MIN/MAX/OK con chips de texto y etiquetas originales; valores = `selectKpis`), TargetPanel (segmentado Hard/Soft, inputs con ids/defaults/min/max/step del inventario §6, resultado en vivo y fórmula `formula.text` + `<strong>{formula.result}</strong>`, botón `updateBtn` → `applyComparison`).

- [ ] **Step 1: Failing tests:** sin datos se ve EmptyState; tras `loadRows` real, los 6 KPI muestran `5.00`, `20`, `2.25`, `1.7`, `2.65`, `200 / 200`; cambiar a EN muestra `Global Average`, `Skin Thickness (mm)`, `Update Comparison`; escribir `60` en compresión cambia el resultado en vivo a `4.00` pero el KPI objetivo sigue en `5.00` hasta pulsar el botón; edición deshabilitada mientras `restored` es false.
- [ ] **Step 2–4:** FAIL → implementar → PASS. Diseño: glass, tokens del tema, Space Grotesk en números, layout de 2 columnas (gráfica + panel objetivo) ≥ 1100 px y 1 columna debajo.
- [ ] **Step 5: Commit** `feat(gapcheck): estructura, resumen y valores objetivo`.

### Task 5: Gráfica y filtros

**Files:** Create `components/Chart.tsx`, `components/Filters.tsx`, tests; Modify `package.json` (añadir `chartjs-plugin-annotation@3.0.1` exacta).

**Interfaces — Consumes:** `iterDataset`, `pointStyle`, `compressionTick`, `PALETTE_SOLID`, `hexToRgba`, store. **Produces:** `buildChartConfig(input: { points, maxIter, visiblePoints, visibleIters, appliedTarget, appliedCovering, appliedInputs, lang, theme: { text: string; grid: string; tooltipBg; tooltipTitle; tooltipBody; tooltipBorder } }): ChartConfiguration` (función pura, testeable) y `<GapcheckChart/>` que la usa.

- [ ] **Step 1: Failing tests** sobre `buildChartConfig` con el fixture real: un dataset por iteración con `label 'Iter ${j+1}'`, colores `PALETTE_SOLID[j % 15]` y `hexToRgba(color, 0.82)`; arrays de estilo ≡ `pointStyle`; iteración oculta → arrays vacíos; anotación `gapLine` con los valores del Global Constraint y ausente si `appliedTarget <= 0`; eje `x` lineal `min 0, max points.length + 1`, ticks con nombres de punto; eje izquierdo `value.toFixed(2) + ' mm'` y títulos ES/EN literales; eje derecho espeja los ticks del izquierdo y formatea con `compressionTick` usando **`appliedCovering/appliedInputs`** (R1); tooltip `title` = nombre del punto y `label` = `` ` ${label}: ${y} mm` ``; leyenda filtrada por `visibleIters` y su clic llama `toggleIter` (R3); Filters: chips reflejan el estado real tras reconstruir (R2). Colores de texto/rejilla y tooltip salen de los tokens del tema (diseño aprobado); paleta de datos sin cambios.
- [ ] **Step 2–4:** FAIL → implementar (Chart.js mockeado en tests de componente; `buildChartConfig` sin mock) → PASS.
- [ ] **Step 5: Commit** `feat(gapcheck): gráfica de dispersión y filtros`.

### Task 6: Tabla de datos

**Files:** Create `components/DataTable.tsx` + test.

- [ ] **Step 1: Failing test:** colapsada por defecto (`tableOpen` persistido); abierta lista filas punto × iteración visibles en el orden del original; columnas `thPoint…thStatus` literales; valor crudo, objetivo `target.toFixed(2) + ' mm'`, estado con textos `✅ Cumple`/`⚠️ Cerca`/`❌ No cumple` (EN `✅ Met`/`⚠️ Close`/`❌ Not Met`) y clase según `statusOf`; nombres con `<b>` se muestran como texto (R6); contenedor con scroll en vez de recorte.
- [ ] **Step 2–4:** FAIL → implementar → PASS. **Step 5: Commit** `feat(gapcheck): tabla de datos`.

### Task 7: Layout de puntos

**Files:** Create `components/Layout.tsx`, `components/Marker.tsx` + tests.

**Interfaces — Consumes:** `defaultMarkerPositions`, `POINT_COLORS`, store layout actions.
- [ ] **Step 1: Failing tests:** sin imagen se ve zona de carga (`gapLayoutDrop`), archivo no imagen → toast con el texto original (`Por favor selecciona una imagen` / `Please select an image`); al cargar imagen con datos → un marcador por punto en `defaultMarkerPositions(count)` (% relativos a la **imagen**, R4), color `POINT_COLORS[i % 15]`, texto = nombre; slider 20–60 paso 2 cambia tamaño (`fontSize = Math.max(9, size * 0.27)`, `borderRadius = size / 4.4`); arrastre (pointer events) actualiza `moveMarker` con % relativos a la imagen y limitados a [0,100]; botón "Cambiar imagen" (nuevo, porque hoy no se puede reemplazar — anotarlo en mejoras); imagen > 20 MB → se guarda sin imagen y toast "Vuelve a cargar la imagen del layout al reabrir" (Review Focus 5; `persist.largeFilesSkipped` existe en Plan 1).
- [ ] **Step 2–4:** FAIL → implementar → PASS. **Step 5: Commit** `feat(gapcheck): layout de puntos con marcadores arrastrables`.

### Task 8: Export PNG Nebulosa

**Files:** Create `export/exportModel.ts`, `export/drawExport.ts` + tests.

**Interfaces — Produces:** `buildExportModel(state, lang, now: Date): ExportModel` (pura: título, línea de fecha `now.toLocaleString() + '   •   Covering: ' + ('Hard Covering'|'Soft Covering')`, tarjetas `{ badge, value, sub }` con los textos KPI de `selectKpis` y los subtítulos del export original (`Puntos Medidos`/`Measured Pts`, etc.), bloque `GAPCHECK OBJETIVO`/`GAPCHECK TARGET` con `appliedTarget.toFixed(2) + ' mm'`, marcadores visibles con color `PALETTE_SOLID`, filename); `drawExport(model, chartCanvas: HTMLCanvasElement, layoutImage: HTMLImageElement|null): HTMLCanvasElement` (dibuja composición Nebulosa: fondo degradado `#3b1a5e→#160c2e→#07061a`, logo oscuro, tarjetas glass, layout a la derecha si existe, gráfica abajo); `exportGapcheckPng()` descarga con el filename.
- [ ] **Step 1: Failing tests** sobre `buildExportModel` con fixture real: valores y textos exactos; filename `Gapcheck-Export-2026-10-30.png` para `now` fijo; sin datos → la UI muestra toast `No hay datos para exportar.` / `No data to export.`; marcador de punto oculto no se exporta.
- [ ] **Step 2–4:** FAIL → implementar (drawExport sin test unitario de píxeles; se verifica en navegador en Task 9) → PASS. **Step 5: Commit** `feat(gapcheck): export PNG con diseño nebulosa`.

### Task 9: Integración, mejoras propuestas y verificación

**Files:** Create `src/tools/gapcheck/GapcheckTool.integration.test.tsx`, `docs/superpowers/plans/gapcheck-mejoras-propuestas.md`; Modify `docs/superpowers/plans/2026-10-29-plan-1-pendientes.md` si aplica.

- [ ] **Step 1: Integration test:** `GapcheckTool` dentro de `AppShell` (como el test de integración del Plan 1): cargar fixture real → KPIs; cambiar filtros, covering y entradas, aplicar; desmontar/remontar → todo restaurado; "Empezar de cero" → EmptyState y versión previa en historial.
- [ ] **Step 2:** `gapcheck-mejoras-propuestas.md`: por cada ítem del inventario §12 que se conservó, "qué está mal hoy / qué se ganaría" (p. ej. MIN/MAX sin decimales fijos, colores de marcadores distintos pantalla/export, numeración de iteraciones que se corre con celdas vacías, `parseFloat` permisivo, filename en UTC, línea objetivo solo al pulsar el botón). No implementar.
- [ ] **Step 3:** `npm test`, `npm run build`. Verificación manual en navegador (emuladores) con el Excel real: KPIs `5.00 / 20 / 2.25 / 1.7 / 2.65 / 200 / 200`, gráfica igual al original (comparar con `mockups/antes-2.jpg`), tabla, layout con una imagen, export PNG, recarga a mitad de análisis, tema día/noche, ES/EN.
- [ ] **Step 4: Commit** `test(gapcheck): integración y documento de mejoras propuestas`.
