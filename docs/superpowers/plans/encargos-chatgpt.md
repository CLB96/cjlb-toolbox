# Encargos para ChatGPT (inventarios de Gantt y CapaFlow)

Objetivo: que ChatGPT haga la lectura larga del código original (lo más caro en tokens aquí) y entregue un inventario técnico exacto. Con ese inventario, Claude escribe el plan y migra la herramienta.

Cómo usarlo:
1. Abre un chat nuevo en ChatGPT (un chat por herramienta).
2. Pega el **Prompt** de abajo y adjunta el archivo indicado (o pega su contenido completo).
3. Si la respuesta se corta, pídele "continúa exactamente donde quedaste" hasta que termine.
4. Guarda la respuesta completa como archivo Markdown con el nombre indicado y pásamela (o pégala en el chat).

| Encargo | Archivo a adjuntar (en este repo) | Guardar la respuesta como |
|---|---|---|
| A. Gantt | `gantt/index.html` (≈2 140 líneas) | `docs/superpowers/plans/gantt-inventory.md` |
| B. CapaFlow | `capaflow/index.html` (≈8 600 líneas) | `docs/superpowers/plans/capaflow-inventory.md` |

CapaFlow es largo: si ChatGPT no acepta el archivo completo, pásalo en 3–4 partes ("parte 1 de 4…") y pídele el inventario solo al final.

---

## Prompt (igual para ambos; cambia solo el nombre de la herramienta)

```
Eres un ingeniero de software senior. Te adjunto el archivo index.html de una herramienta web de una sola página escrita en JavaScript "vanilla" llamada <NOMBRE: Gantt Tracker | CapaFlow>. Vamos a portarla a React + TypeScript y los resultados deben ser IDÉNTICOS al original (mismos valores, mismos textos, mismo formato). Necesito un INVENTARIO TÉCNICO COMPLETO Y EXACTO del archivo, en Markdown, escrito en inglés, citando números de línea del archivo en cada punto.

Reglas:
- Lee el archivo completo antes de escribir. No inventes nada: si algo no existe, dilo.
- Cita expresiones de cálculo TEXTUALES (copiadas tal cual, en bloques de código), incluidos redondeos (toFixed, Math.round, etc.), formatos de fecha y número, y concatenaciones de texto con sus espacios exactos.
- Copia los diccionarios de idioma (ES y EN) COMPLETOS y textuales.
- Marca como "observed bug" cualquier comportamiento extraño que notes. No lo corrijas.
- Si la respuesta es larga, divídela en partes y espera a que te diga "continúa".

Estructura obligatoria (usa exactamente estos títulos):

# <Tool> technical inventory
Header: libraries (CDN URLs and versions), file structure (CSS/HTML/script line ranges).

## 1. Global state variables
Table: name | type | initial value | line | notes.

## 2. Functions
### 2A. PURE CALCULATION logic (port byte-identical)
Every calculation function: line range, inputs/outputs, and its code verbatim. Include: date/duration math, progress %, dependencies/critical path (Gantt), statistics / capability indices / control limits / distributions (CapaFlow: Cp, Cpk, Pp, Ppk, sigma within/overall, normality tests, histograms, any constants tables like d2/c4), sorting, rounding and formatting helpers.
### 2B. UI / DOM functions
Table: function | lines | purpose | DOM ids read/written | side effects.

## 3. Data import / input
How data enters (file import: Excel/CSV/JSON, sheet selection, header handling, parsing rules; manual input forms; sample data like "Cargar datos de ejemplo" — copy the sample data verbatim). Validation and every error message (ES/EN, verbatim).

## 4. Displayed results
Every card, table, summary and result box: exact labels (ES/EN keys and strings), value formula, formatting, colors/classes by status.

## 5. Charts / visual timeline
Full config of every chart or timeline (Chart.js or custom SVG/canvas/DOM): datasets, exact color lists (hex), line styles, axes (min/max/ticks/titles), annotations/bands/thresholds, legends, tooltips, zoom/scroll, today line, bar rendering rules (Gantt), interactions (drag, resize, click).

## 6. Inputs / settings
Table: element id | type/attrs | default | behavior. Anything stored in localStorage/sessionStorage (keys and JSON shape) and when it is read/written.

## 7. Exports / sharing
Every export (PNG, PDF, Excel, CSV, JSON, ZIP, print, share links): exact composition, sizes, texts, filenames, libraries used, error messages. For Gantt, document JSONBin / share links (`?bin=`) and the preset/demo project, which will be REMOVED in the port.

## 8. i18n (verbatim)
Full ES and EN dictionaries, copied verbatim (code block).

## 9. Theme / language / menu / login / storage
Theme switching, language switching, menus, the password/lock screen (say where the password is hardcoded; do NOT copy its value), all storage keys.

## 10. Edge cases handled and observed bugs
List of edge cases the code handles, then a numbered list of "observed bug" items.

End with a short summary: total functions, total i18n keys, number of observed bugs.
```

---

## Qué hago yo con el resultado

- Reviso el inventario contra el código con verificaciones puntuales (no relectura completa) y corrijo lo que falle.
- Con eso preparo el mockup antes/después de cada herramienta para tu aprobación, y luego el plan y la migración, como en GapCheck y Bondline.
- Gantt además lleva tu decisión ya tomada: sin JSONBin ni proyecto de ejemplo, cada usuario ve solo lo suyo y puede guardar **hasta 5 Gantt** con un selector.
- Para CapaFlow, las pruebas usarán el set de ejemplo de la propia página ("Cargar datos de ejemplo", del ejercicio de Minitab).
