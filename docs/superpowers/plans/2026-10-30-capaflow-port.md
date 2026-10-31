# Port de CapaFlow a la v2

Origen: `capaflow/index.html` (8.617 líneas, un solo archivo). Inventario técnico: `capaflow-inventory/`. Quirks y mejoras: `capaflow-mejoras-propuestas.md` (no se corrigen; se porta el comportamiento original).

## Fase 1 (hecha): lógica de cálculo, referencia legacy, tests diferenciales

Sin interfaz. Mismo patrón que Bondline y Gantt.

- `v2/legacy-fixtures/capaflow/legacyReference.ts`: copia literal de las funciones puras del original (parseo, estadísticos, σ within, σ overall, índices Cp/Cpk/Pp/Ppk/Cpm/Cmk, PPM, nivel sigma, Anderson-Darling, clasificación, interpretación, histograma, corridas, Q-Q, box plot, constantes SPC, reglas Western Electric, gráficas de control) y los datos de ejemplo.
- `v2/legacy-fixtures/capaflow/fixtures.ts`: 16 entradas representativas (ejemplo, n pequeño, n no múltiplo del subgrupo, subgrupo 1, 10, 12 y mayor que los datos, un solo límite, sin target, fuera de especificación, descentrado, no normal, constante, separadores mixtos).
- `v2/legacy-fixtures/capaflow/legacyReference.test.ts`: nuevo contra legacy sobre todas las fixtures.
- `v2/src/tools/capaflow/logic/` (cada archivo < 400 líneas):

| Módulo | Contenido |
|---|---|
| `types.ts` | resultado, entrada, gráfica de control |
| `labels.ts` | subconjunto literal de TRANSLATIONS (ES/EN) que usa la lógica |
| `stats.ts` | parseData, mean, stddev, median, quartile, withinSigma, normCDF/PDF |
| `normality.ts` | Anderson-Darling |
| `analysis.ts` | runAnalysis (índices, PPM, nivel sigma) y mensajes de validación |
| `classify.ts` | umbrales World Class / Capaz / Marginal / No Capaz, colores |
| `interpretation.ts` | texto de interpretación (pantalla y PNG) |
| `histogram.ts` | clases, conteos, curva normal |
| `charts.ts` | corridas, Q-Q, box plot |
| `spc.ts` | constantes SPC, interpolación, reglas Western Electric, subgrupos |
| `controlCharts.ts` | I-MR, X̄-R, X̄-S (variante pantalla y variante PNG) |
| `format.ts`, `sample.ts`, `index.ts` | formato, datos de ejemplo, barrel |

## Fase 2 (pendiente): interfaz y entorno

1. `CapaFlow.tsx` registrado en `registry.ts`; formulario (datos, LSL, USL, target, subgrupo, confianza, nombre del punto), botón de datos de ejemplo, alertas de validación con los textos originales.
2. Resultados por análisis (varios análisis acumulados, carrusel, carpeta de proyecto): tarjetas Cpk/Cp/Ppk, barra sigma, tablas de capacidad y desempeño, estadísticos, interpretación.
3. Gráficas en canvas con los modelos de `logic/`: gauge, histograma, corridas, Q-Q, box plot, gráficas de control con selector auto / I-MR / X̄-R / X̄-S.
4. i18n ES/EN completo (los 200 claves), tema, y persistencia con `usePersistentTool` (entradas y análisis).
5. Exportaciones: PNG ejecutivo, resumen comparativo, ZIP, foto con marcadores; guía de lectura.
6. Decidir con el dueño qué mejoras del documento de mejoras se aplican; el conversor .mwx y la compuerta de contraseña quedan fuera salvo que se pidan.

## Bloqueos para la fase 2

Ninguno de lógica. Notas: `exceljs` no está instalado en el árbol de trabajo (fallan 2 archivos de test de Gantt, ya antes de esta fase); el dibujo de canvas del original (L4535-5337, L6045-6850, `_drawGuide` L7466-8340) no se portó, solo su matemática.
