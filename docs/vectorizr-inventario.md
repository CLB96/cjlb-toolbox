# VectoriZr — inventario técnico

Fuente: `../Digitalizacion` (solo lectura), commit `8612078 feat: rutas conscientes del base para servir la app bajo subruta`. El código se cita como `archivo:línea` relativo a `Digitalizacion/src/`.
Inventario hecho el 2026-10-31 con lectura del código, más una ejecución local del build publicado (`vectorizr/` en la raíz de este repo).

**No hay README.** La spec original está en `docs/superpowers/specs/2026-06-04-vectorizr-design.md` y el plan en `docs/superpowers/plans/2026-06-04-vectorizr-plan.md`. La spec fija la UI en "Español mexicano" y deja fuera de v1 la persistencia, el OCR y las capas múltiples.

## 1. Stack y dependencias

SPA/PWA: Vite 6 + React 18 + TypeScript 5.6 + Zustand 5. El editor usa Konva/react-konva y el PDF usa jsPDF. No hay router: el paso activo (1–4) vive en el store.

| dependencies | declarada | instalada |
|---|---|---|
| react / react-dom | ^18.3.1 | 18.3.1 |
| zustand | ^5.0.3 | 5.0.14 |
| konva | ^9.3.18 | 9.3.22 |
| react-konva | ^18.2.10 | 18.2.16 |
| jspdf | ^2.5.2 | 2.5.2 |

devDependencies relevantes:
- vite ^6.0.5 (6.4.3) y @vitejs/plugin-react ^4.3.4
- vite-plugin-pwa ^0.21.1
- tailwindcss ^3.4.16, postcss y autoprefixer
- vitest ^2.1.8 con jsdom ^25 y testing-library
- typescript ~5.6.2

Scripts: `dev: vite`, `build: tsc -b && vite build`, `preview`, `test: vitest`, `test:ui`.

Configuración:
- `vite.config.ts:5-37` usa `react()` y `VitePWA` (`autoUpdate`):
  - Manifest: `VectoriZr`, description `Digitaliza y escala dibujos 2D — R&D Engineering`, theme `#0d0d1f`.
  - Workbox: precachea todo menos `opencv.js`, que va con `CacheFirst` (`opencv-cache`).
- **No define `base`.** El build publicado en `/vectorizr/` (`dist-vectorizr/`) no sale de ningún script. Lo probable es que se hiciera con `vite build --base /vectorizr/ --outDir dist-vectorizr`.
- `vitest.config.ts`: jsdom, `globals:true`, setup `src/test/setup.ts`.
- `tsconfig.app.json`: ES2020, `bundler`, `strict`, `noUnusedLocals/Parameters`.
- Tailwind casi no se usa (unas clases en StepBar y RotatePrompt); el estilo es inline `style={{}}`.
- Despliegue: `netlify.toml` (publish `dist`) y proyecto Vercel `vectorizr` vinculado.

Tamaños del build (`vectorizr/assets`):

| Archivo | Bytes |
|---|---|
| `index-*.js` | 865 599 |
| `index.es-*.js` (jsPDF) | 159 616 |
| `html2canvas` (chunk de jsPDF, no se usa) | 202 401 |
| `purify` (chunk de jsPDF, no se usa) | 22 031 |
| worker | 2 349 |
| CSS | 7 782 |

## 2. Módulos (`src/`, ~2 980 líneas)

| Archivo | LOC | Propósito |
|---|---|---|
| main.tsx | 10 | `createRoot` + `StrictMode` |
| App.tsx | 30 | Shell: Header, RotatePrompt (vertical y paso ≥3), switch por `step`, atajos |
| types/index.ts | 38 | `AppStep`, `ScaleUnit`, `SegmentType`, `BezierHandles`, `ContourPoint`, `ToolId`, `ContourSnapshot`, `ScaleRef` |
| store/appStore.ts | 123 | Store Zustand global único (estado, historial, acciones) |
| workers/opencv.worker.ts | 167 | Worker clásico: carga OpenCV y detecta el contorno |
| lib/imageNormalize.ts | 26 | `clampDimensions` (máx 4096) y `normalizeImage` (JPEG 0.92) |
| lib/export-dxf.ts | 60 | `pointsToDxf`, `downloadDxf` |
| lib/export-svg.ts | 53 | `pointsToSvg`, `downloadSvg` |
| lib/export-pdf.ts | 33 | `downloadPdf` (jsPDF) |
| hooks/useScale.ts | 31 | `unitToMm`, `computeScaleFactor`, `pxToMm`, `mmToPx` (funciones puras) |
| hooks/useHistory.ts | 33 | Pila de historial pura; **la app no la usa**, solo los tests |
| hooks/useKeyboardShortcuts.ts | 18 | Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z en el paso 4 |
| hooks/useOrientation.ts | 17 | `matchMedia('(orientation: portrait)')` |
| components/layout/Header.tsx | 65 | Logo, nombre, StepBar y menú |
| components/layout/StepBar.tsx | 36 | Indicador de los 4 pasos |
| components/layout/HamburgerMenu.tsx | 90 | Manual, Volver al Toolbox, Nueva vectorización |
| components/layout/HelpModal.tsx | 204 | Manual con 4 pestañas |
| components/layout/RotatePrompt.tsx | 14 | Overlay "Rota tu dispositivo" |
| components/steps/Step1Upload.tsx | 104 | Archivo, drag&drop y cámara |
| components/steps/Step2Scale.tsx | 283 | Calibración con 2 puntos, zoom y rotación de vista |
| components/steps/Step3Vectorize.tsx | 323 | Auto o manual, worker, sliders y canvas 2D |
| components/steps/Step4Editor.tsx | 260 | Editor: barra superior, trazos, modales de exportación |
| components/editor/EditorCanvas.tsx | 402 | Stage Konva: pan/zoom, herramientas, medición, teclas |
| components/editor/Toolbar.tsx | 124 | Barra vertical de herramientas, deshacer y rehacer |
| components/editor/PropertiesPanel.tsx | 74 | Coordenadas, tipo de segmento, totales |
| components/editor/StatusBar.tsx | 22 | Escala, zoom, herramienta, puntos |
| components/ui/{Button,Modal,Slider,Toast}.tsx | 96 | Primitivas de UI |
| index.css, styles/tokens.css | 59 | Tokens, `.glass`, keyframes |
| test/*.ts | 184 | 5 suites (26 tests) |

## 3. OpenCV

- **Archivo:** propio y local, `public/opencv.js`, de **9 991 739 bytes**. Comprimido ocupa 3,26 MB con gzip -9 y 2,35 MB con brotli. No viene de npm ni de CDN.
- **Contenido:** wrapper UMD de Emscripten con el wasm incrustado en base64 (no hay `.wasm` aparte). Tiene 1 `WebAssembly.instantiate`, 2 `instantiateStreaming` y **2 `new Function`**. No se encontró la cadena de versión de OpenCV; parece un build 4.x antiguo.
- **Rarezas del objeto `cv`:** es *thenable* (`Module.then`), así que `await cv` puede colgarse. Además depende del `Module` global (`return cv(Module)`).
- **Worker:** clásico, sin `{type:'module'}`, creado en `Step3Vectorize.tsx:47` con `new Worker(new URL('../../workers/opencv.worker.ts', import.meta.url))`. Vite lo emite como IIFE.
- **Carga diferida:** se carga al montar el Paso 3 (`Step3Vectorize.tsx:46-67`). El hilo principal envía `{type:'init', opencvUrl: `${BASE_URL}opencv.js`}` y el worker hace `importScripts` una sola vez (`opencv.worker.ts:48-54`).
- **Recarga:** al desmontar se llama `worker.terminate()`, así que **cada vez que se vuelve al Paso 3 OpenCV se carga y compila de nuevo**.
- **Señal de listo:** `self.Module = { onRuntimeInitialized(){ … postMessage({type:'ready'}) } }` (`opencv.worker.ts:8-13`). En el hilo principal es un ref (`Step3Vectorize.tsx:42,57`).
- **Protocolo:**
  - Pregunta: `{type:'detect', imageData, method (0=Otsu, 1=Canny), threshold1, threshold2}`.
  - Respuesta: `{type:'contour', points:{x,y}[]}`.
  - No hay mensaje de error ni de progreso. El `ImageData` viaja copiado (hasta 64 MB), no transferido.
- **Memoria:** sí se llama `.delete()` sobre los Mat principales. **Los `contours.get(i)` nunca se liberan** (`opencv.worker.ts:41,81,125-126,150`).
- **CSP (spike de este inventario):**
  - Con `script-src 'self' 'wasm-unsafe-eval'`, la carga falla con `EvalError … 'unsafe-eval' is not an allowed source`, por los `new Function` de embind.
  - **Funciona** si la página conserva su CSP estricta y solo las respuestas del worker y de `opencv.js` llevan `script-src 'self' 'unsafe-eval' 'wasm-unsafe-eval'`. En ese caso queda listo en ~0,5 s en local y detecta el contorno. Ver el plan, §3.

## 4. Pipeline

**Paso 1 — normalización** (`lib/imageNormalize.ts`):
- Se lee el `File` en un `Image` con object URL (`Step1Upload.tsx:22-29`).
- `clampDimensions` limita el lado mayor a `MAX_SIZE = 4096` manteniendo la proporción (:1-11).
- `normalizeImage` redibuja en un canvas y genera `toDataURL('image/jpeg', 0.92)` (:13-25), así que **la transparencia sale negra**.
- El store guarda `rawImage` (HTMLImageElement), `imageWidth` e `imageHeight`.

**Paso 2 — escala** (`Step2Scale.tsx`):
- **Rotación ±90°:** solo visual, con un canvas offscreen (`rotateImageData` :9-29). Los clics se convierten a coordenadas de la imagen original (`getImageCoords` :65-78; inversa `toDisplayPercent` :81-91).
- **Clics:** el 1.º marca p1, el 2.º marca p2 y el 3.º reinicia p1 (:93-98).
- **Factor de escala:** `computeScaleFactor(p1,p2,real,unit) = unitToMm(real)/distPx`, en **mm por px** (`hooks/useScale.ts:12-23`). Conversiones: mm=1, cm=10, m=1000, in=25,4.
- **Guardado:** `setScaleRef({p1,p2,realValue,unit}, factor)` y paso 3 (:109-116).
- **Zoom:** rueda ×1,18 / ×0,85; botones ×1,2 / ×0,8; rango 0,3–8 (:100-104, 145-150).

**Paso 3 — vectorización** (`workers/opencv.worker.ts`):

| # | Operación | Parámetros | Línea |
|---|---|---|---|
| 0 | `minArea` | `w*h*0.005` (0,5 %), fijo | :58 |
| 1 | `cv.matFromImageData` → `cvtColor` | `COLOR_RGBA2GRAY` | :60-62 |
| 2 | `cv.GaussianBlur` | `Size(7,7)`, sigma 0 | :65 |
| C1 | `cv.Canny` (method 1) | `threshold1`, `threshold2` | :72 |
| C2 | `cv.findContours` | `RETR_EXTERNAL`, `CHAIN_APPROX_SIMPLE` | :76 |
| C3 | `findLargestContour` | máximo `contourArea` > minArea | :37-45, :78 |
| C4 | `cv.approxPolyDP` | `0.002 * arcLength(c, true)`, cerrado | :81 |
| O1 | `getStructuringElement` (method 0) | `MORPH_ELLIPSE`, `Size(7,7)` | :93 |
| O2 | `cv.threshold` | 0, 255, `inv + 8` (OTSU; prueba inv=1 y luego 0) | :98, :112-114 |
| O3 | `morphologyEx` | `MORPH_CLOSE` y luego `MORPH_OPEN` | :101-102 |
| O4 | `findContours` + elección | gana la polaridad de mayor área | :106, :117-134 |
| O6 | fallback (ninguna encontró nada) | `Canny(blurred, 50, 150)`, minArea **0** | :135-147 |
| O7 | `approxPolyDP` | 0,2 % del perímetro | :149-158 |
| out | `points` | enteros de `approx.data32S` | :155-166 |

Solo se devuelve **un contorno**, el externo de mayor área: sin huecos y sin curvas (no hay potrace ni ajuste Bezier).

| Parámetro UI | Default | Rango | Etiqueta | Línea |
|---|---|---|---|---|
| detectionMethod | 0 (Otsu) | 0/1 | `Automático` / `Semi automático` | :35, :248-255 |
| threshold1 | 50 | 10–200, paso 1 | `Umbral bajo` | :36, :259 |
| threshold2 | 150 | 50–400 | `Umbral alto` | :37, :260 |

- **Sliders:** solo aparecen en Semi automático. Moverlos no vuelve a detectar: hay que pulsar `Volver a detectar`.
- **Manual** (`Step3Vectorize.tsx:123-147`): cada clic agrega un punto, con corrección del letterbox de `objectFit: contain` (`canvasClickToImageCoords` :11-26). Un clic a menos de **18 px de pantalla** del primer punto, con más de 2 puntos, cierra y confirma.
- **Confirmar:** convierte a `ContourPoint {id:String(i), x, y, type:'line'}`, llama a `setContourPoints` y `pushHistory`, y pasa al paso 4 (:149-165).

**Paso 4 — editor** (`EditorCanvas.tsx`):
- **`buildPath`** (:20-39): los segmentos `bezier` se dibujan con **Catmull-Rom → cúbica, `t = 0.35`** (:31-32). No usa `handles`.
- **`stageToImageCoords`** (:46-60): deshace la rotación 0/90/180/270 del Group alrededor del centro.
- **Agregar punto:** el punto nuevo se **añade al final** del trazo activo (`Step4Editor.tsx:51-55`).

## 5. Entradas y salidas

- **Input:** `accept="image/jpeg,image/png,image/webp,application/pdf"` (`Step1Upload.tsx:94`), y la validación MIME usa la misma lista (:16-20). **Un PDF pasa la validación pero siempre falla** al cargarse en `Image`.
- **Drag & drop:** solo toma el primer archivo. No hay pegado desde el portapapeles.
- **Cámara:** `getUserMedia({video:{facingMode:'environment'}})`. Captura el **primer frame** sin vista previa y lo guarda como JPEG 0.92 (:41-61).
- **Tamaño:** no hay límite en bytes. En píxeles, el lado mayor se limita a 4096.

Exportación (modal `Step4Editor.tsx:189-206`). Siempre exporta todos los trazos: los guardados más el activo, si tiene más de 1 punto.

| Formato | Función | Nombre | Formato exacto |
|---|---|---|---|
| DXF | `lib/export-dxf.ts:48-60` | `vectorizr.dxf` (`application/dxf`) | HEADER solo con `$ACADVER`=`AC1009` (R12). Un `POLYLINE` por trazo con `8`=capa, `66`=1, `70`=1 (cerrada). `VERTEX` con 10/20 = `px*scaleFactor` a **`toFixed(6)`** y 30=`0.0`. Luego `SEQEND`, `ENDSEC`, `EOF`, separados por `\n`. Capas: trazos guardados `"1".."n"`, activo `"0"`. Sin unidades (se asumen mm). **Y sin invertir.** |
| SVG | `lib/export-svg.ts:41-53` | `vectorizr.svg` | `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 W H" width="Wmm" height="Hmm">`, donde W y H son el **máximo** x/y en mm a `toFixed(3)`. Por trazo, `<path d="M … L … Z" fill="none" stroke="#000000" stroke-width="0.5"/>`. Sin trazos: `<svg xmlns="http://www.w3.org/2000/svg"></svg>`. Sin declaración XML. |
| PDF | `lib/export-pdf.ts` | `vectorizr.pdf` | `new jsPDF({unit:'mm', format:'a4'})`, margen 15 mm, `setDrawColor(0)`, `setLineWidth(0.3)` y `doc.line` por segmento, cerrado. Escala 1:1 sin ajuste ni paginación. |

La descarga se hace con `<a download>.click()` y luego `URL.revokeObjectURL` inmediato. El modelo interno está en px de la imagen normalizada, `scaleFactor` en mm/px, y la UI muestra mm.

## 6. Controles de UI

- **Global:**
  - Logo `${BASE_URL}logo.png`; si falla, muestra el texto `CJLB`.
  - Menú hamburguesa (`Menú`): `📖 Manual de usuario`, `← Volver al Toolbox` (abre `https://ptetoolbox.netlify.app`) y `🗑️ Nueva vectorización` (con `window.confirm`).
  - StepBar 1–4 con ✓.
- **Paso 1:** zona de arrastre clicable y botón `📷 Tomar foto`.
- **Paso 2:**
  - Barra: `← Volver`, `−` (`Alejar`), `%`, `+` (`Acercar`), `1:1`, `↺` (`Rotar izquierda`), `↻` (`Rotar derecha`) y `N°`.
  - Imagen con cursor crosshair; la rueda hace zoom.
  - Panel derecho: número (placeholder `Ej: 30`), unidad (mm/cm/m/pulgadas, **default `cm`**), `Confirmar escala` y `Volver a marcar`.
- **Paso 3:**
  - Elección de modo: tarjetas `🤖 Detección automática` y `✏️ Trazado manual`, más `← Volver`.
  - Auto: toggle `Automático`/`Semi automático`, sliders, `Volver a detectar`/`Detectando…` y `Confirmar (N pts)` (deshabilitado con menos de 3).
  - Manual: `Deshacer último`, `Limpiar todo` y `Confirmar`.
  - Siempre: `← Cambiar modo`.
- **Paso 4:**
  - Barra superior: `← Paso 3`, `Trazos: N (M pts)`, `+ Nuevo trazo` (con menos de 2 pts está deshabilitado), `⊡ Fit`, `−`/`+`/`1:1` (zoom 0,1–10), `↺`/`↻` (`imageRotation`) y `↓ Exportar`.
  - Toolbar vertical (`Toolbar.tsx:78-86`): select, edit-point, segment-type, add-point, delete-point, measure y zoom; abajo deshacer y rehacer.
  - Konva: pan con select/zoom; rueda ×1,12 / ×0,9 hacia el cursor; arrastrar puntos; clic en un punto según la herramienta (borrar, alternar tipo, seleccionar).
  - PropertiesPanel: segmento `Línea recta`/`Bezier`, totales y lista de trazos guardados con `✕`.
  - Modal de exportación con DXF/SVG/PDF. Modal de éxito con `Continuar editando` / `Ir al inicio` (este hace reset sin confirmar).
- **Teclado:**
  - `S/E/A/D/M/Z` eligen herramienta (`EditorCanvas.tsx:130-143`; ignoradas dentro de inputs).
  - `Ctrl/Cmd+Z` deshace; `Ctrl/Cmd+Y` o `Ctrl+Shift+Z` rehace (solo en el paso 4).
  - Escape no cierra los modales.

## 7. Textos (verbatim) e i18n

**No hay i18n.** Todo el texto está en español dentro del JSX, sin detección de idioma ni textos en inglés. La columna EN es una **propuesta** para el v2 (el toolbox es ES/EN) y necesita aprobación.

| Origen | ES (literal) | EN (propuesta) |
|---|---|---|
| title / Header.tsx:53,56 | VectoriZr · R&D Engineering | = |
| StepBar.tsx:4 | Cargar · Escala · Vectorizar · Editar | Upload · Scale · Vectorize · Edit |
| HamburgerMenu :52/:78/:80/:82 | Menú · Manual de usuario · Volver al Toolbox · Nueva vectorización | Menu · User manual · Back to Toolbox · New vectorization |
| HamburgerMenu :38 | ¿Iniciar una nueva vectorización? Se perderán los cambios no exportados. | Start a new vectorization? Unexported changes will be lost. |
| RotatePrompt :9 | Rota tu dispositivo para usar el editor | Rotate your device to use the editor |
| Step1 :72 | Cargar imagen | Upload image |
| Step1 :74 | Sube una foto o archivo de tu dibujo. Asegúrate de que incluya una referencia de medida (regla, cinta, etc.). | Upload a photo or file of your drawing. Make sure it includes a measurement reference (ruler, tape, etc.). |
| Step1 :91 | Arrastra tu imagen aquí o **haz clic para seleccionar** | Drag your image here or **click to select** |
| Step1 :93 | JPG, PNG, PDF | = |
| Step1 :98 / :100 | 📷 Tomar foto · Procesando imagen… | 📷 Take photo · Processing image… |
| Step1 :18 | Formato no válido. Usa JPG, PNG o PDF. | Invalid format. Use JPG, PNG or PDF. |
| Step1 :28 (interno) | No se pudo cargar la imagen | Could not load image |
| Step1 :35 | No se pudo procesar el archivo. Intenta con otro. | Could not process the file. Try another one. |
| Step1 :59 | No se pudo acceder a la cámara. Revisa los permisos. | Could not access the camera. Check permissions. |
| Step2 :136 / Step3 :208 | ← Volver | ← Back |
| Step2 :139-141 | ① Clic en el primer punto de la referencia · ② Clic en el segundo punto · ③ Ingresa la medida real | ① Click the first reference point · ② Click the second point · ③ Enter the real measurement |
| Step2/Step4 títulos | Alejar · Acercar · 1:1 · Rotar izquierda · Rotar derecha | Zoom out · Zoom in · 1:1 · Rotate left · Rotate right |
| Step2 :177 alt | referencia | reference |
| Step2 :247 / :250 | Medida real de la línea marcada · Ej: 30 | Real length of the marked line · e.g. 30 |
| Step2 :266-269 | mm · cm · m · pulgadas | mm · cm · m · inches |
| Step2 :271 / :276 | Confirmar escala · Volver a marcar | Confirm scale · Mark again |
| Step3 :173 | ¿Cómo quieres vectorizar? | How do you want to vectorize? |
| Step3 :178-179 | Detección automática · La app detecta los bordes. Tú corriges los puntos. | Automatic detection · The app detects the edges. You fix the points. |
| Step3 :184-185 | Trazado manual · Haz clic para colocar cada punto del contorno. | Manual tracing · Click to place each contour point. |
| Step3 :233 | Detectando bordes con OpenCV… | Detecting edges with OpenCV… |
| Step3 :251 / :255 | Automático · Semi automático | Automatic · Semi-automatic |
| Step3 :259 / :260 | Umbral bajo · Umbral alto | Low threshold · High threshold |
| Step3 :265 | Detecta automáticamente el objeto más grande por contraste de color. | Automatically detects the largest object by color contrast. |
| Step3 :269 | Detectando… · Volver a detectar | Detecting… · Detect again |
| Step3 :272 | Confirmar ({n} pts) | Confirm ({n} pts) |
| Step3 :281 | Guía de umbrales | Threshold guide |
| Step3 :283 | **Umbral bajo:** controla qué tan sensible es el detector. Un valor bajo capta más bordes débiles (puede agregar ruido); un valor alto solo detecta bordes muy marcados. | **Low threshold:** controls how sensitive the detector is. A low value catches more weak edges (may add noise); a high value only detects very strong edges. |
| Step3 :286 | **Umbral alto:** define los bordes principales. Debe ser 2–3× el umbral bajo. Súbelo si aparecen demasiados contornos falsos; bájalo si el contorno queda incompleto. | **High threshold:** defines the main edges. It should be 2–3× the low threshold. Raise it if too many false contours appear; lower it if the contour is incomplete. |
| Step3 :295 | Haz clic para agregar puntos. El primer punto se muestra en **naranja**. Haz clic cerca de él para cerrar el contorno. | Click to add points. The first point is shown in **orange**. Click near it to close the contour. |
| Step3 :298 | Puntos: {n} | Points: {n} |
| Step3 :301/:304/:307 | Deshacer último · Limpiar todo · Confirmar | Undo last · Clear all · Confirm |
| Step3 :318 | ← Cambiar modo | ← Change mode |
| Step4 :100 / :106 | ← Paso 3 · Trazos: {n} ({m} pts) | ← Step 3 · Paths: {n} ({m} pts) |
| Step4 :113 / :115 | Guarda el trazo actual y empieza uno nuevo · + Nuevo trazo | Save the current path and start a new one · + New path |
| Step4 :121 | ⊡ Fit (title: Centrar imagen) | ⊡ Fit (Center image) |
| Step4 :137 | ↓ Exportar | ↓ Export |
| Step4 :164/:171/:175/:184 | Trazos guardados: · Trazo {i} · Eliminar trazo · · Trazo activo: {n} pts | Saved paths: · Path {i} · Delete path · · Active path: {n} pts |
| Step4 :190 / :193 | Exportar — {n} trazo(s) · Se exportarán todos los trazos ({n} en total). | Export — {n} path(s) · All paths will be exported ({n} total). |
| Step4 :196/:199/:202 | 📐 DXF (AutoCAD / CNC) · 🖼 SVG · 📄 PDF | = |
| Step4 :228 / :234 | ¡Exportación exitosa! · Tu vectorización fue exportada como **{FMT}** correctamente. | Export successful! · Your vectorization was exported as **{FMT}** successfully. |
| Step4 :245 / :252 | Continuar editando · Ir al inicio | Keep editing · Go to start |
| Toolbar :79-85 | Seleccionar (S) · Editar punto (E) · Tipo de segmento — click en punto para alternar línea/curva · Agregar punto (A) · Eliminar punto (D) · Medir distancia — 2 clicks para medir · Zoom (Z) | Select (S) · Edit point (E) · Segment type — click a point to toggle line/curve · Add point (A) · Delete point (D) · Measure distance — 2 clicks to measure · Zoom (Z) |
| Toolbar :116 / :119 | Deshacer (Ctrl+Z) · Rehacer (Ctrl+Y) | Undo (Ctrl+Z) · Redo (Ctrl+Y) |
| Properties :32/:41 | Punto seleccionado · Sin selección · Selecciona un punto para ver sus propiedades. | Selected point · No selection · Select a point to see its properties. |
| Properties :36-37 | X: {v} mm · Y: {v} mm | = |
| Properties :48/:59-60 | Segmento · Línea recta · Bezier | Segment · Straight line · Bezier |
| Properties :66/:69 | Total: {n} pts · Longitud: {v} mm | Total: {n} pts · Length: {v} mm |
| StatusBar :16-19 | Escala: 1px = {f} mm · Zoom: {z}% · Herramienta: {toolId} · Puntos: {n} | Scale: 1px = {f} mm · Zoom: {z}% · Tool: {toolId} · Points: {n} |
| EditorCanvas :375 | {z}% · Rueda = zoom · Arrastrar = mover | {z}% · Wheel = zoom · Drag = pan |
| EditorCanvas :385-387 | Haz click en el punto inicial · Haz click en el punto final · Distancia: {d} mm · Click para nueva medición | Click the start point · Click the end point · Distance: {d} mm · Click for a new measurement |
| EditorCanvas :398 | S Selec · E Editar · A Agregar · D Borrar · M Medir · Z Zoom | S Select · E Edit · A Add · D Delete · M Measure · Z Zoom |
| HelpModal :171, :9-12 | Manual de usuario · 🚀 Flujo · 🛠 Herramientas · ⌨️ Atajos · 💡 Consejos | User manual · Flow · Tools · Shortcuts · Tips |

**HelpModal**: los textos largos se copiarán literales desde `components/layout/HelpModal.tsx` al portar, no se reproducen aquí.
- Flujo :43-55: `Cómo funciona VectoriZr` y Pasos 1–4. El Paso 1 dice "Acepta JPG, PNG y WebP".
- Herramientas :63-81.
- Atajos :87-135.
- Consejos :150-162.

## 8. Persistencia

**No hay ninguna.** No usa localStorage, sessionStorage, IndexedDB ni `persist`; todo vive en memoria en `useAppStore`.
- Estado: `step`, `rawImage` (HTMLImageElement, dataURL JPEG ≤4096 px), `imageWidth/Height`, `scaleRef`, `scaleFactor`, `contourPoints`, `paths`, `history`, `historyIndex`, `activeToolId`, `zoom`, `stagePos`, `imageRotation`, `exported`.
- Al recargar se pierde todo; la spec lo dejó así a propósito.
- Lo único que persiste es la caché del service worker.

## 9. Assets externos y red

- **`public/`:** `opencv.js`, `logo.png` (48 986 B) y los íconos PWA `icon-192/512.png` (**PNG de 1×1 de relleno, 70 B**).
- **Fuente:** declara `'Inter'`, pero nunca la carga, así que sale la del sistema.
- **CDNs:** ninguno.
- **Enlaces externos:** solo `https://ptetoolbox.netlify.app` (`HamburgerMenu.tsx:80`).
- **Favicon:** `/vite.svg`, que no existe.
- **Envíos de datos:** no se sube nada a ningún servidor.

## 10. Estilo visual

- **Tema:** oscuro fijo, sin modo claro (`styles/tokens.css`).
  - Fondos: bg `#0d0d1f`, surface `#1a1a2e`.
  - Colores: primary `#4a7eff`, accent `#7c5cbf`, success `#22c55e`, error `#ef4444`, rose `#e11d48`, orange `#ea580c`.
  - Glass: `.06` con borde `.12` y `blur(12px)`.
- **Layout:**
  - Header fijo de 52 px.
  - Pasos 2 y 3: área de trabajo más panel derecho de 200 px.
  - Paso 4: barra de 44 px, toolbar izquierda de 44 px, canvas, panel derecho de 180 px y StatusBar de 28 px.
- **Canvas del paso 4:**
  - Trazo activo `#4a7eff`, con grosor 2/zoom.
  - Trazos guardados `rgba(74,158,255,.5)` discontinuos.
  - Puntos blancos con borde azul; el seleccionado en `#ea580c`.
  - Bezier `#a855f7`; medición `#fbbf24`.
- **Canvas del paso 3:** primer punto `#ea580c`, el resto `#e11d48`.

## 11. Tests y fixtures

Hay 5 suites de Vitest con 26 tests (`src/test/`):
- export-dxf (4)
- export-svg (4)
- imageNormalize (3)
- useHistory (6, sobre código que la app no usa)
- useScale (9)

No hay tests de componentes ni de OpenCV, y **no hay imágenes de prueba**.

## 12. Bugs y quirks

| # | Dónde | Qué pasa |
|---|---|---|
| 1 | EditorCanvas.tsx:130-140 | Las teclas de herramienta no miran `ctrlKey`: **Ctrl+Z deshace y además activa Zoom**, y Ctrl+A activa add-point. |
| 2 | export-svg.ts:8, export-dxf.ts:10-15, export-pdf.ts:25-29 | Bezier: el canvas dibuja Catmull-Rom, pero el SVG solo usa `handles` (siempre vacíos) y el DXF y el PDF son rectos. **Lo que se ve no es lo que se exporta.** |
| 3 | export-dxf.ts:12-13 | El DXF no invierte Y, así que en CAD la pieza sale **espejada verticalmente**. |
| 4 | export-svg.ts:28-31 | El viewBox va de 0 al máximo (no del mínimo al máximo): sobra margen. |
| 5 | export-pdf.ts:13-30 | A4 1:1 sin ajuste ni paginación: lo que mide más de ~180×267 mm se corta. |
| 6 | Step1Upload.tsx:16,94 | Acepta PDF pero siempre falla. La ayuda dice "JPG, PNG y WebP" y la UI dice "JPG, PNG, PDF". |
| 7 | imageNormalize.ts:24 | Todo se convierte a JPEG, así que un PNG transparente queda con fondo negro (afecta a Otsu). |
| 8 | opencv.worker.ts:41,81,125-126,150 | Fuga de Mat en `contours.get(i)`. |
| 9 | opencv.worker.ts:47-167 | No hay try/catch: si OpenCV lanza, el spinner gira para siempre. |
| 10 | opencv.worker.ts:55 | Un `detect` que llega antes de `ready` se descarta en silencio. |
| 11 | Step3Vectorize.tsx:55-59 | `onmessage` captura `mode` del montaje: si eliges Automático antes de que OpenCV esté listo, no detecta hasta que pulsas el botón. |
| 12 | Step3Vectorize.tsx:268 | `disabled={!workerReady.current}` lee un ref, que no provoca re-render. |
| 13 | Step3Vectorize.tsx:46-66 | El worker se recrea en cada entrada al paso 3 y recompila OpenCV. |
| 14 | Step3Vectorize.tsx:259-260 | No valida `umbral bajo < alto`, y cambiar sliders no vuelve a detectar. |
| 15 | Step3Vectorize.tsx:82 | El `ImageData` se copia (hasta 64 MB) en vez de transferirse. |
| 16 | opencv.worker.ts:58,65,81,93,141 | Valores fijos: minArea 0,5 %, blur y kernel 7×7, epsilon 0,2 %, fallback Canny 50/150. Un solo contorno externo. |
| 17 | Step2Scale.tsx:109-116 | Si p1 == p2, el factor sale Infinity. Un valor inválido se ignora sin aviso. |
| 18 | Step2Scale.tsx:100-101 | `preventDefault` en un `onWheel` pasivo: warning, y la página hace scroll. |
| 19 | Step2Scale.tsx:45 | La rotación del paso 2 no pasa al paso 4 (allí hay otra `imageRotation`). |
| 20 | Step1Upload.tsx:23,31 | Si hay error, el object URL no se revoca. |
| 21 | Step1Upload.tsx:46-50 | La cámara captura el primer frame sin vista previa (puede salir negro). |
| 22 | Toast.tsx:13-16 | `onDone` inline reinicia el temporizador en cada render. |
| 23 | appStore.ts:74-88 | Deshacer solo afecta al trazo activo. `addNewPath` borra el historial y `removePathAt` no se puede deshacer. |
| 24 | Step4Editor.tsx:51-55 | El punto nuevo va al final, no al segmento más cercano. |
| 25 | EditorCanvas.tsx:106-107 | Sin auto-fit al entrar al paso 4: la imagen sale al 100 % en el origen. En el paso 2 pasa lo mismo: se ve recortada hasta que alejas. |
| 26 | StepBar.tsx:28-29 | El `display:'none'` inline gana a `sm:block`: **las etiquetas de los pasos nunca se ven**. |
| 27 | Step3:234 / RotatePrompt:11 | `@keyframes spin` está definido dos veces de forma global, con efectos distintos. |
| 28 | StatusBar.tsx:18 | Muestra el id interno (`edit-point`) en vez de una etiqueta. |
| 29 | PropertiesPanel.tsx:18-23 | La longitud siempre cierra el lazo y trata los Bezier como rectas. |
| 30 | HamburgerMenu.tsx:80 | URL fija `ptetoolbox.netlify.app`. |
| 31 | index.html:5, public/icon-*.png | El favicon no existe y los íconos son de 1×1. |
| 32 | useHistory.ts, `mmToPx`, `BezierHandles`, `scaleRef`, Button `danger` | Código muerto. |
| 33 | Modal.tsx, Step4:249 | Sin Escape, sin focus trap ni `role=dialog`. `Ir al inicio` resetea sin confirmar. |
| 34 | export-*.ts | `revokeObjectURL` justo después de `click()`. |
| 35 | Prueba manual 2026-10-31 | Con una foto sintética (papel claro sobre fondo gris, dibujo a línea y regla), **Automático tomó el borde de toda la imagen** (4 pts) en lugar de la pieza. Con un trazo de línea fina, Otsu + morfología no separa la pieza. Hay que validarlo con fotos reales. |

## 13. Cómo correrlo

```
cd ../Digitalizacion
npm install
npm run dev       # http://localhost:5173
npm run build     # dist/ (base '/')
npx vitest run
```
Build publicado: `vectorizr/` en la raíz de este repo. Para verlo, sirve la raíz con `python -m http.server 4330` y abre `/vectorizr/`.
