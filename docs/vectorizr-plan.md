# VectoriZr → pestaña del CJLB Toolbox v2: plan de integración

Estado: **borrador para que el dueño lo apruebe** (2026-10-31). No se ha portado nada.

Base técnica: [vectorizr-inventario.md](vectorizr-inventario.md). Proceso el mismo de las otras cuatro herramientas:
1. Mockup aprobado.
2. Copia literal del original en `legacy-fixtures`.
3. Pruebas diferenciales.
4. Mejoras, solo si se aprueban.
5. Preguntar antes de publicar.

Decisión ya tomada: la copia dentro de `v2/` pasa a ser la fuente oficial y `../Digitalizacion` deja de serlo. La carpeta `vectorizr/` de la raíz (sitio viejo en `main`) no se toca.

## 1. Qué se copia y adónde

```
v2/public/vendor/opencv/opencv-4.x.js     ← Digitalizacion/public/opencv.js (sin cambios, 9 991 739 B)
v2/legacy-fixtures/vectorizr/
  legacyReference.ts                      ← copia literal de lib/export-{dxf,svg,pdf}.ts, hooks/useScale.ts,
                                            lib/imageNormalize.ts (clampDimensions), buildPath de EditorCanvas.tsx:20-39
  legacyDetect.ts                         ← cuerpo de workers/opencv.worker.ts:37-166 como función detect(cv, msg)
  fixtures/                               ← imágenes sintéticas generadas por código (rectángulo, círculo, polígono,
                                            polaridad invertida, PNG transparente, objeto < minArea)
v2/legacy-fixtures/private/vectorizr/     ← (gitignored) 3-5 fotos reales del dueño + contornos "golden"
v2/src/tools/vectorizr/
  VectorizrTool.tsx                       ← default export, recibe { toolId, active }; monta el Provider
  VectorizrStoreProvider.tsx              ← un store por montaje (patrón Gantt)
  store.ts (+ store.test.ts)              ← port de store/appStore.ts como createVectorizrStore()
  useVectorizrPersistence.ts              ← usePersistentTool (ver §4)
  i18n.ts                                 ← textos ES literales + EN aprobado (inventario §7)
  vectorizr.css                           ← estilos con tokens Nebulosa, sin Tailwind
  logic/  scale.ts, imageNormalize.ts, contourPath.ts (buildPath), exportDxf.ts, exportSvg.ts,
          exportPdf.ts, download.ts       ← funciones puras, mismas firmas que el original
  worker/ opencv.worker.ts                ← worker clásico; detect() idéntico a legacyDetect
          protocol.ts                     ← tipos de mensajes (init/ready/detect/contour/+error)
          opencvClient.ts                 ← cliente singleton con carga diferida (ver §3)
  components/steps/  Step1Upload, Step2Scale, Step3Vectorize, Step4Editor
  components/editor/ EditorCanvas, Toolbar, PropertiesPanel, StatusBar, HelpPanel
```

**Qué no se copia:**
- `HamburgerMenu`: el toolbox ya tiene navegación, y "Volver al Toolbox" apunta a Netlify. "Manual" pasa a un botón `?` y "Nueva vectorización" se cubre con "Empezar de cero" del historial.
- PWA y `vite-plugin-pwa`.
- Tailwind.
- `useHistory.ts` (código muerto).
- Íconos de 1×1 y `logo.png`: el toolbox ya tiene su logo.

**Registro:**
- En `src/tools/registry.ts` se añade `vectorizr: () => import('./vectorizr/VectorizrTool')`.
- En `data/tools.json` se revisa `url: "/vectorizr/"`, que solo sirve para enlazar al sitio viejo.

## 2. Dependencias (versiones exactas, como en el resto de `package.json`)

| Paquete | Versión | Nota |
|---|---|---|
| `konva` | `9.3.22` | La misma que usa el original |
| `react-konva` | `18.2.16` | Es la línea para React 18. La 19.x exige React 19 |
| `jspdf` | **`4.2.1`** (propuesta) o `2.5.2` (la del original) | `npm audit` con 2.5.2 marca **1 vulnerabilidad crítica y 1 alta** (jspdf y su dompurify); con 4.2.1, 0. Solo se usan `line`, `setDrawColor`, `setLineWidth` y `save`. La prueba diferencial compara las llamadas, no los bytes. Ver mejora M1 |

No se añaden `vite-plugin-pwa`, `tailwindcss`, `postcss` ni `autoprefixer`. OpenCV va como archivo estático, no como paquete npm.

**Peso:**
- El chunk de la pestaña es aproximado y se medirá en T7: Konva y react-konva ~170 kB min (~55 kB gzip). jsPDF va en un chunk aparte que se carga solo al exportar a PDF.
- OpenCV: 10 MB sin comprimir; Vercel lo sirve con brotli (~2,35 MB).

## 3. CSP, Vercel y carga diferida de OpenCV

**Resultado del spike** (Vite 6 de v2, `vite build` + `preview` con cabeceras CSP; no se commitea):

| CSP del worker y de opencv.js | Resultado |
|---|---|
| `script-src 'self' 'wasm-unsafe-eval'` | **Falla**: `EvalError … 'unsafe-eval' is not an allowed source`. Viene de los 2 `new Function` de embind dentro de opencv.js |
| `script-src 'self' 'unsafe-eval' 'wasm-unsafe-eval'` **solo en el worker y opencv.js**, la página con su CSP actual | **Funciona**: listo en ~0,5 s en local y `findContours` encuentra el rectángulo de prueba |

Un worker clásico de mismo origen recibe su propia CSP (la de la respuesta de su script), así que el permiso de eval no llega a la página.

**Cambios en `v2/vercel.json`:**
- Añadir una regla de `headers` después de la general, con `source` `/vendor/opencv/(.*)` y `/assets/opencv.worker-(.*)`.
- Esa regla pone una `Content-Security-Policy`: `default-src 'self'; script-src 'self' 'unsafe-eval' 'wasm-unsafe-eval'; connect-src 'self'; object-src 'none'; base-uri 'self'`.
- Para opencv añade además `Cache-Control: public, max-age=31536000, immutable`. El nombre lleva versión, así que la caché es segura.
- **La CSP de la página no cambia** (no hace falta `'wasm-unsafe-eval'` en ella).
- **Riesgo a verificar** en el primer deploy de prueba: que Vercel aplique la cabecera de la regla específica sobre la general cuando ambas coinciden. Lo cubre una prueba que lee `vercel.json` y un `curl -I` contra el preview antes de publicar.
- **Si Vercel no lo permite:** como plan B, el worker se sirve desde `/vendor/opencv/worker.js` (copiado tal cual a `public/`) para que una sola regla cubra ambos archivos.

**Dev server:** hoy no lleva CSP, así que no cambia. Opcional: añadir `server.headers` para reproducir la CSP en dev.

**Carga diferida:**
- `opencvClient.ts` crea el worker la **primera vez que se entra al Paso 3** (igual que el original) y lo mantiene vivo mientras la pestaña esté montada (keep-alive). Así no se recompila al volver del Paso 4 (mejora M9).
- El worker se termina al desmontar la herramienta, por ejemplo al cambiar de usuario.
- La URL se calcula con `import.meta.env.BASE_URL`.
- `StrictMode`: el singleton evita el doble worker.
- Opcional: precargar `opencv.js` con `requestIdleCallback` al abrir la pestaña (M10).

## 4. Estado y persistencia (`usePersistentTool`)

El original no guarda nada. En el toolbox todas las herramientas guardan solas, así que esto es nuevo por plataforma, no un cambio del cálculo.

| Campo | Se guarda | Forma |
|---|---|---|
| `step` | sí | 1–4 |
| imagen normalizada | sí | `Blob` JPEG 0.92 (en lugar del `HTMLImageElement`, que no es clonable). Al restaurar se crea un object URL y se carga en un `Image`. Una de 4096 px pesa ~2–6 MB, bajo el límite de 20 MB del hook (por encima se guarda `null` con aviso) |
| `imageWidth`, `imageHeight` | sí | number |
| `scaleRef`, `scaleFactor` | sí | objeto plano y number |
| `contourPoints`, `paths` | sí | arrays de `ContourPoint` |
| `imageRotation` | sí | 0/90/180/270 |
| `detectionMethod`, `threshold1`, `threshold2` | sí | hoy son estado local del Paso 3; se suben al store |
| `history`, `historyIndex` | **no** | deshacer es por sesión, como en Gantt |
| `zoom`, `stagePos`, `activeToolId`, `exported`, `mode` del Paso 3 | no | vista y transitorios |

- `markDirty` se dispara cuando cambian los campos persistidos; se hace con `subscribe` y comparando referencias, como `useGanttPersistence.ts`.
- `restored === false`: el Paso 1 queda deshabilitado.
- Las fotos son datos del usuario y quedan en IndexedDB local por usuario, nunca en Firestore ni en git.

## 5. Pruebas (~100 esenciales)

Todas comparan contra `legacy-fixtures/vectorizr/legacyReference.ts` / `legacyDetect.ts`, que son copias literales.

| Grupo | Qué compara | ~N |
|---|---|---|
| Escala | `unitToMm`, `computeScaleFactor` y `pxToMm` contra legacy en una tabla de unidades y distancias | 10 |
| Normalización | `clampDimensions` (bordes 4096, vertical y horizontal) | 5 |
| DXF | Texto idéntico al de legacy: 0, 1 y N trazos, capas, `toFixed(6)`, escala | 10 |
| SVG | Texto idéntico: vacío, 1 y N trazos, viewBox, `toFixed(3)` | 8 |
| PDF | jsPDF simulado: misma secuencia de llamadas (`line`, márgenes, grosor) que legacy | 5 |
| `buildPath` | Misma cadena de path con mezcla línea/Bezier (Catmull-Rom t=0.35) | 6 |
| Detección | **Golden:** `detect(cv, msg)` nuevo contra `legacyDetect` con la misma opencv.js cargada en Vitest (la UMD funciona en Node, sin CSP). Arrays de puntos idénticos en 6 imágenes sintéticas × Otsu/Canny × 2 umbrales, más el fallback y el caso "nada" | 20 |
| Fotos reales (privadas) | Mismos puntos que legacy en 3–5 fotos del dueño. Se omiten si la carpeta privada no existe | 5 |
| Store | Acciones del appStore portado: historial, trazos, reset | 12 |
| Persistencia | Snapshot clonable, Blob de imagen ida y vuelta, `restore`, `reset`, no marcar dirty por zoom | 8 |
| UI | Recorrido de pasos 1→4 con worker simulado, textos ES/EN de la tabla, modales de exportación (nombres `vectorizr.dxf\|svg\|pdf`) | 10 |
| CSP | `vercel.json` tiene la regla del worker y la página no tiene `'unsafe-eval'` | 2 |

**Riesgos de las pruebas:**
- **Konva en jsdom:** no hay canvas real. Las pruebas de UI simulan `react-konva` o cubren solo los paneles; la lógica del canvas vive en funciones puras.
- **OpenCV en Vitest:** cargar 10 MB tarda ~1–2 s. Se carga una sola vez en `beforeAll` y esa suite va en su propio archivo.

## 6. Diseño (ver mockup)

- **Tema:** tokens Nebulosa (día y noche) en los paneles. El lienzo mantiene fondo oscuro neutro en los dos temas para que la foto y los colores del contorno se vean igual.
- **Estructura:** stepper 1–4 con etiquetas visibles (hoy nunca se ven), y en cada paso panel glass a la derecha, área de trabajo, barra de herramientas y barra de estado.
- **Colores del contorno:** los originales, ya que son la "salida visual". Cambiarlos sería mejora M14.
- **Ayuda:** "Manual" como panel o modal glass con sus 4 pestañas y los textos literales.
- **Idioma:** ES/EN con el selector del toolbox. El EN se aprueba en la tabla del inventario §7.

## 7. Riesgos

| Riesgo | Mitigación |
|---|---|
| Vercel no aplica la CSP por ruta como espera el plan | Preview de prueba + `curl -I`; plan B con el worker en `/vendor/opencv/` |
| `'unsafe-eval'` en el worker | Solo afecta al worker: sin DOM, solo recibe `ImageData` de nuestro hilo y la página sigue estricta. Alternativa más cara: compilar OpenCV sin embind dinámico |
| 10 MB de OpenCV en redes lentas | Brotli ~2,35 MB, caché inmutable, carga solo en el Paso 3 y spinner existente |
| Memoria con imágenes de 4096 px | Transferir el buffer (M8) y liberar Mats (M7) |
| Diferencias de resultado por la versión de jsPDF | Prueba de llamadas; el PDF solo usa primitivas estables |
| Konva y la keep-alive de pestañas | Pausar listeners de teclado cuando `active === false`, porque si no S/E/A/D/M/Z dispararían en otras pestañas |
| Atajos globales del toolbox | Revisar choques con las teclas de la shell |

## 8. Tareas y estimación

| ID | Tarea | Estimación |
|---|---|---|
| T1 | Copiar opencv.js y legacy-fixtures; añadir deps; regla CSP en `vercel.json` | 0,5 h |
| T2 | `logic/*` + pruebas diferenciales (escala, DXF, SVG, PDF, buildPath) | 1,5 h |
| T3 | Worker, protocolo y cliente singleton; golden de detección con opencv en Vitest | 2 h |
| T4 | Store por montaje, persistencia y pruebas | 1,5 h |
| T5 | Pasos 1–3 con estilos Nebulosa e i18n | 2,5 h |
| T6 | Paso 4: editor Konva, toolbar, propiedades, exportación y manual | 3 h |
| T7 | Registro, `build`, prueba en navegador (día y noche, ES/EN), preview en Vercel con verificación de CSP | 1 h |
| T8 | Mejoras aprobadas (según lo que se elija en §9) | 1–4 h |

**Total:** ~12 h de port fiel más las mejoras. Unos 2–3 bloques de trabajo, con commits por tarea en una rama de feature.

## 9. Mejoras propuestas (para que el dueño decida)

**A. Cambian el resultado exportado** (requieren aprobación explícita):

| # | Mejora | Recomendación |
|---|---|---|
| M2 | DXF con **Y invertida**: hoy la pieza sale espejada en CAD (#3) | **Sí**, salvo que el CNC ya lo compense |
| M3 | Exportar lo que se ve: Bezier (Catmull-Rom) también en SVG, DXF (aproximado con segmentos finos) y PDF (#2) | Sí |
| M4 | SVG con viewBox de mínimo a máximo (sin margen sobrante) (#4) | Sí |
| M5 | PDF: elegir "1:1 en varias hojas" o "ajustar a A4" con la escala impresa, en vez de recortar (#5) | Sí (decidir variante) |
| M6 | PNG transparente → fondo **blanco** en lugar de negro antes de detectar (#7) | Sí |
| M11 | PDF de entrada: renderizar la 1.ª página o quitar "PDF" de lo aceptado (#6) | Quitarlo (lo barato) |

**B. Sin cambio en los resultados** (calidad y estabilidad):

| # | Mejora |
|---|---|
| M1 | jsPDF 2.5.2 → 4.2.1 (`npm audit`: 1 crítica + 1 alta → 0) |
| M7 | Liberar los `contours.get(i)` en el worker (fuga de memoria) (#8) |
| M8 | Transferir el `ImageData` al worker en vez de copiarlo (#15) |
| M9 | Worker y OpenCV vivos mientras la pestaña esté abierta; no recompilar al volver al Paso 3 (#13) |
| M10 | Precargar OpenCV en segundo plano al abrir la pestaña |
| M12 | Errores del worker con mensaje y fin del spinner (#9); cola de `detect` hasta `ready` y detección automática al estar listo (#10-12) |
| M13 | Ctrl+Z ya no activa Zoom; las teclas de herramienta ignoran Ctrl/Cmd (#1) |
| M15 | Escala: avisar si los dos puntos coinciden o la medida no es válida (#17) |
| M16 | Auto-fit de la imagen al entrar a los pasos 2 y 4 (#25) |
| M17 | Etiquetas visibles en el stepper (#26); la barra de estado muestra el nombre de la herramienta (#28) |
| M18 | Modales con Escape y `role=dialog`; confirmar "Ir al inicio" (#33) |
| M19 | Umbrales: impedir bajo ≥ alto y volver a detectar al soltar el slider (#14) |

**C. Funciones nuevas** (para más adelante):
- M20: insertar el punto en el segmento más cercano (#24).
- M21: deshacer el borrado de trazos (#23).
- M22: pegar imagen desde el portapapeles.
- M23: detectar varios contornos o huecos (#16).
- M24: vista previa de cámara (#21).

**Observación (#35):** con mi foto sintética, "Automático" tomó el borde de toda la imagen y no la pieza. Hace falta probarlo con 3–5 fotos reales del dueño; esas mismas fotos serían los fixtures privados de las pruebas golden.
