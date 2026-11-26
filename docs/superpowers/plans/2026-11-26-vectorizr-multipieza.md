# VectoriZr varias piezas (entrega 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** VectoriZr detecta varias piezas en una foto, deja nombrarlas y editarlas de una en una, y exporta todo junto (como hoy) o un archivo por pieza.

**Architecture:** El store gana `pieces` + `activePieceId`. Los campos `contourPoints` y `paths` siguen siendo el estado de trabajo de la pieza activa, así que el editor, el lienzo y los exportadores casi no cambian; al cambiar de pieza se vuelca el trabajo a `pieces` y se carga la otra. La detección gana una variante que devuelve todos los contornos.

**Tech Stack:** React, Zustand (`zustand/vanilla`), Vitest, OpenCV en worker. Todo en `v2/src/tools/vectorizr/`.

**Spec:** `docs/superpowers/specs/2026-11-26-vectorizr-multipieza-design.md`. Mockup aprobado: `odd/mockups/vectorizr-multipieza.html`.

## Global Constraints

- Sin punto y coma, comillas simples, archivos de menos de 400 líneas, UTF-8.
- Los resultados calculados (DXF, SVG, PDF de "todo en un archivo" con una pieza) no cambian: mismo contenido, mismas capas, mismo nombre `vectorizr.*`.
- Textos de la interfaz nuevos en `es` y `en` de `i18n.ts`; los existentes no se tocan.
- Unas 100 pruebas esenciales por herramienta: se añaden pocas y dirigidas.
- Comandos desde `v2/`: `npx vitest run src/tools/vectorizr`, `npm run build`.
- Commits en la rama `v2` con mensajes convencionales y la línea `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`. No se hace push sin preguntar.

## Review Focus

- Foto sin ninguna pieza detectada (modo varias piezas): lista vacía, mensaje y "Confirm" desactivado.
- Quitar con la X todas las piezas de la lista: "Confirm" desactivado, sin error.
- Cantidad vacía, 0, negativa o decimal: se convierte a entero entre 1 y 999.
- Nombres vacíos, repetidos o con caracteres no válidos en archivos (`/ \ : * ? " < > |`): los archivos salen con nombre único y válido.
- Sesión guardada antigua (con `contourPoints` y `paths`, sin `pieces`): se abre como una sola pieza sin perder nada.
- Cambiar de pieza con historial de deshacer: Ctrl+Z no mezcla puntos de otra pieza.
- Borrar la pieza activa o la única: nunca queda el editor sin pieza.

---

### Task 1: Modelo de piezas en el store

**Files:**
- Modify: `v2/src/tools/vectorizr/types.ts` (añadir `Piece`)
- Create: `v2/src/tools/vectorizr/logic/pieces.ts`
- Modify: `v2/src/tools/vectorizr/store.ts`
- Modify: `v2/src/tools/vectorizr/useVectorizrPersistence.ts`
- Test: `v2/src/tools/vectorizr/store.test.ts`, `v2/src/tools/vectorizr/logic/logic.test.ts`

**Interfaces:**
- Produces, en `types.ts`: `interface Piece { id: string; name: string; quantity: number; contourPoints: ContourPoint[]; paths: ContourPoint[][] }`.
- Produces, en `logic/pieces.ts`:
  - `PIECE_COLORS: readonly string[]` (8 colores; los usan Paso 3 y las pestañas del Paso 4)
  - `pieceColor(index: number): string`
  - `clampQuantity(v: unknown): number` (entero 1 a 999; no numérico da 1)
  - `pieceLabel(piece: Piece, index: number): string` (nombre recortado o `Pieza N`)
  - `fileSafeName(label: string): string` (cambia `/ \ : * ? " < > |` por `_`)
  - `uniqueFileNames(labels: string[], ext: 'dxf' | 'svg' | 'pdf'): string[]` (sanea y desambigua repetidos con `-2`, `-3`)
  - `newPiece(index: number, points?: ContourPoint[]): Piece` (id único, `quantity: 1`, `paths: []`)
- Produces, en el store (`VectorizrData`): `pieces: Piece[]`, `activePieceId: string`. Acciones: `setPieces(pieces: Piece[], activeId?: string): void` (carga y activa; limpia historial), `switchPiece(id: string): void`, `addPiece(): void`, `removePiece(id: string): void`, `renamePiece(id: string, name: string): void`, `setPieceQuantity(id: string, q: number): void`. Selector exportado `piecesNow(s: VectorizrData): Piece[]` que devuelve `pieces` con la activa reemplazada por el estado de trabajo (`contourPoints`, `paths`).
- `VectorizrSnapshot` pasa a llevar `pieces` y `activePieceId`; conserva `contourPoints?` y `paths?` opcionales solo para leer sesiones antiguas.

- [ ] **Step 1: Escribir las pruebas que fallan** en `store.test.ts`: (a) `switchPiece` vuelca el trabajo a la pieza anterior, carga la otra y deja `history` vacío; (b) `piecesNow` incluye los puntos de trabajo de la activa; (c) `removePiece` de la activa activa a la vecina y, con una sola pieza, no hace nada; (d) `restoreInto` con un snapshot antiguo (`contourPoints` con 3 puntos y `paths` con 1 trazo, sin `pieces`) deja exactamente 1 pieza activa con esos datos; (e) `snapshotOf` guarda `pieces` con el trabajo de la activa incluido. En `logic/logic.test.ts`: `clampQuantity('', 0, -3, 2.7, '5')` da `1, 1, 1, 3, 5`; `uniqueFileNames(['A', 'A', 'x/y', ''], 'dxf')` da `['A.dxf', 'A-2.dxf', 'x_y.dxf', 'Pieza-4.dxf']`.
- [ ] **Step 2: Ejecutar** `npx vitest run src/tools/vectorizr/store.test.ts src/tools/vectorizr/logic/logic.test.ts`. Debe fallar por símbolos inexistentes.
- [ ] **Step 3: Implementar** `Piece`, `logic/pieces.ts` y las acciones del store con las firmas de arriba. `initialData()` crea una pieza vacía activa. `addPiece` y `switchPiece` primero vuelcan el trabajo a `pieces`. `restoreInto` usa `snap.pieces` si existe y es un arreglo no vacío; si no, construye una pieza con `snap.contourPoints` y `snap.paths`. Añadir `pieces` y `activePieceId` a `persistedChanged`.
- [ ] **Step 4: Ejecutar** las mismas pruebas más `useVectorizrPersistence.test.tsx`. Deben pasar.
- [ ] **Step 5: Commit** `feat(vectorizr): modelo de piezas en el store con migración de sesiones antiguas`.

### Task 2: Detección de varios contornos

**Files:**
- Modify: `v2/src/tools/vectorizr/worker/detect.ts`, `worker/protocol.ts`, `worker/opencv.worker.ts`, `worker/opencvClient.ts`, `worker/useOpencv.ts`
- Test: `v2/src/tools/vectorizr/worker/opencvClient.test.ts`

**Interfaces:**
- Produces: `detectAll(cv: Cv, input: DetectInput): ImagePoint[][]` en `detect.ts`. Mismos parámetros y mismo área mínima (0,5 %) que `detect`. Con Otsu usa la polaridad que da el contorno mayor (regla actual) y devuelve todos los contornos externos de esa polaridad; con Canny, todos los que superan el área mínima. Orden: por el borde izquierdo de su caja, de izquierda a derecha. Si no hay ninguno, devuelve el resultado de `detect` envuelto (`[]` si también está vacío).
- Produces: `OpencvClient.detectAll(imageData: ImageData, params: DetectParams): Promise<ImagePoint[][]>` y `UseOpencv.detectAll` con la misma firma. `detect` no cambia.
- Protocolo: `DetectRequest` gana `multi?: boolean`; nueva respuesta `ContoursResponse { type: 'contours'; id: number; contours: ImagePoint[][] }`.

- [ ] **Step 1: Escribir la prueba que falla** en `opencvClient.test.ts`, con el worker falso que ya usa ese archivo: `detectAll` envía un mensaje `detect` con `multi: true` y resuelve con los `contours` de la respuesta `contours`; `detect` sigue enviando sin `multi` y resolviendo con `points`.
- [ ] **Step 2: Ejecutar** `npx vitest run src/tools/vectorizr/worker`. Debe fallar.
- [ ] **Step 3: Implementar** `detectAll` reutilizando los ayudantes de `detect.ts` (`externalContours`, `approxPoints`, `areaAt`); el worker responde `contours` cuando `req.multi`. El cliente generaliza su trabajo en cola para resolver cualquiera de las dos respuestas.
- [ ] **Step 4: Ejecutar** `npx vitest run src/tools/vectorizr/worker`. Debe pasar. Comprobar a mano en el navegador (Task 3) con la foto de ejemplo del usuario, porque OpenCV no corre en Node.
- [ ] **Step 5: Commit** `feat(vectorizr): detección de varios contornos en el worker`.

### Task 3: Paso 3, casilla "Varias piezas"

**Files:**
- Modify: `v2/src/tools/vectorizr/components/steps/Step3Vectorize.tsx` (si pasa de 400 líneas, extraer la lista a `components/steps/DetectedPieces.tsx`)
- Modify: `v2/src/tools/vectorizr/i18n.ts`, `vectorizr.css`
- Test: `v2/src/tools/vectorizr/VectorizrTool.test.tsx`

**Interfaces:**
- Consumes: `useOpencv().detectAll`, `newPiece`, `pieceColor`, `clampQuantity`, `setPieces` (Task 1 y 2).
- Textos nuevos (es/en): `multiPieces` ("Varias piezas"), `multiPiecesHint`, `detectedPieces` (n), `pieceName`, `pieceQuantity`, `removePiece`, `confirmPieces` (n), `noPiecesDetected`.

- [ ] **Step 1: Escribir las pruebas que fallan** en `VectorizrTool.test.tsx` (con `detectAll` simulado): con la casilla encendida y 3 contornos aparecen 3 filas con "Pieza 1/2/3" y cantidad 1; quitar una deja 2; con 0 contornos sale `noPiecesDetected` y "Confirm" está desactivado; confirmar con 2 filas deja `pieces.length === 2` en el store, pasa al Paso 4 y la primera pieza queda activa; con la casilla apagada el flujo de una pieza no cambia.
- [ ] **Step 2: Ejecutar** `npx vitest run src/tools/vectorizr/VectorizrTool.test.tsx`. Debe fallar.
- [ ] **Step 3: Implementar** estado local `multi` (arranca en falso); al cambiarla se vuelve a detectar. En modo múltiple el lienzo pinta cada contorno con `pieceColor(i)` y la barra lateral lista nombre, cantidad (con `clampQuantity` al salir del campo) y X. Los controles de umbral siguen igual y re-detectan.
- [ ] **Step 4: Ejecutar** las pruebas del archivo y `npm run build`. Deben pasar.
- [ ] **Step 5: Commit** `feat(vectorizr): casilla Varias piezas con lista nombrable en el paso 3`.

### Task 4: Paso 4, pestañas de piezas

**Files:**
- Create: `v2/src/tools/vectorizr/components/editor/PieceBar.tsx`
- Modify: `v2/src/tools/vectorizr/components/steps/Step4Editor.tsx`, `components/editor/StatusBar.tsx`, `i18n.ts`, `vectorizr.css`
- Test: `v2/src/tools/vectorizr/VectorizrTool.test.tsx`

**Interfaces:**
- Consumes: `piecesNow`, `switchPiece`, `addPiece`, `removePiece`, `renamePiece`, `setPieceQuantity`, `pieceLabel`, `pieceColor`.
- Produces: `PieceBar()` sin props. Muestra "Editando: <nombre>", una pestaña por pieza (clic = `switchPiece`), "+ Nueva pieza", campos de nombre y cantidad de la activa, y una X por pestaña cuando hay más de una pieza.
- Textos nuevos: `editingPiece` (name), `newPiece`, `deletePiece`. "+ Nuevo trazo" (agujeros) queda igual y actúa sobre la pieza activa. `pathsCount` cuenta los trazos de la pieza activa.

- [ ] **Step 1: Escribir las pruebas que fallan**: con 2 piezas la barra muestra "Editando: Pieza 1"; clic en la pestaña 2 cambia el texto, el contador de puntos y el contorno dibujado; renombrar la activa a "Frente" actualiza la pestaña; "+ Nueva pieza" añade una pieza vacía y la activa; borrar la activa deja a la vecina activa; con una sola pieza no hay X.
- [ ] **Step 2: Ejecutar** `npx vitest run src/tools/vectorizr/VectorizrTool.test.tsx`. Debe fallar.
- [ ] **Step 3: Implementar** `PieceBar` y montarla en `Step4Editor` encima de la barra de herramientas. `selectedId` del editor se limpia al cambiar de pieza.
- [ ] **Step 4: Ejecutar** `npx vitest run src/tools/vectorizr` y `npm run build`. Deben pasar.
- [ ] **Step 5: Commit** `feat(vectorizr): pestañas de piezas y edición de una pieza a la vez`.

### Task 5: Exportación todo/individual

**Files:**
- Create: `v2/src/tools/vectorizr/logic/exportPieces.ts`, `components/editor/ExportDialog.tsx`
- Modify: `v2/src/tools/vectorizr/components/steps/Step4Editor.tsx` (el diálogo sale de aquí), `i18n.ts` (también el texto de ayuda de "Multiple paths"/piezas), `vectorizr.css`
- Test: `v2/src/tools/vectorizr/logic/logic.test.ts`, `VectorizrTool.test.tsx`

**Interfaces:**
- Consumes: `downloadDxf`, `downloadSvg`, `downloadPdf` (firma actual `(active, scaleFactor, extraPaths, filename)`), `piecesNow`, `uniqueFileNames`.
- Produces: `allInOneArgs(pieces: Piece[]): { active: ContourPoint[]; extra: ContourPoint[][] }` (activa = contorno de la primera pieza; extra = sus trazos guardados y luego, por pieza, sus trazos y su contorno; omite contornos de menos de 2 puntos). Con una pieza da exactamente lo que se exporta hoy.
- Produces: `exportIndividual(format: 'DXF' | 'SVG' | 'PDF', pieces: Piece[], scaleFactor: number): Promise<void>` (un archivo por pieza, nombres de `uniqueFileNames` sobre `pieceLabel`).
- Produces: `ExportDialog({ open, onClose, onDone })`. Vista "todo": los tres botones de hoy más "Descarga individual →" (oculto con una sola pieza). Vista "individual": casilla "Seleccionar todo", una casilla por pieza, botones `DXF (n)`, `SVG (n)`, `PDF (n)` desactivados si n es 0, y "← Volver".
- Textos nuevos: `exportIndividual`, `selectAll`, `exportOneFile`, `back`.

- [ ] **Step 1: Escribir las pruebas que fallan**: `allInOneArgs` con una sola pieza devuelve `active` y `extra` idénticos al estado de hoy; con 2 piezas devuelve los 4 contornos repartidos como se describe; `exportIndividual('DXF', [Frente, Espalda], f)` descarga 2 archivos `Frente.dxf` y `Espalda.dxf` (con `downloadBlob` simulado); en el diálogo, "Seleccionar todo" marca todas, desmarcar una cambia el contador a `DXF (1)`, y sin selección los botones están desactivados.
- [ ] **Step 2: Ejecutar** las pruebas. Deben fallar.
- [ ] **Step 3: Implementar** las dos funciones y el diálogo; `Step4Editor.doExport` pasa a usar `allInOneArgs`. En la exportación individual, si falla una descarga se muestra `errExport` y se detiene.
- [ ] **Step 4: Ejecutar** `npx vitest run src/tools/vectorizr` y `npm run build`. Deben pasar. Verificación manual en el navegador: 3 piezas, descarga individual de 2, confirmar los nombres y que el DXF "todo en uno" con una pieza coincide byte a byte con el de la versión publicada.
- [ ] **Step 5: Commit** `feat(vectorizr): exportar todo en un archivo o una pieza por archivo`.
