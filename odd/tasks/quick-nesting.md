# Quick Nesting en el toolbox
Integrar la app independiente `Quick-Nesting-Entrega/` como séptima herramienta de `v2/`, con el mismo stack que las demás (React, TypeScript, Zustand, todo en el navegador).
Rama: `feat/quick-nesting` (desde `v2` en d44009a). Entrega: ask-on-risk; previsión ~2500 líneas, así que se preguntará la estrategia de cadena antes de pasar de ~400. Pruebas: `npm test` en `v2/`.

## Specs
- S1: «tambien acabo de agregar una carpeta llamada quick nesting para integrar a la app y que est}e lean con todo lo demas.» Quick Nesting entra como herramienta de `v2/src/tools/quicknesting/` con la misma estructura que las otras (store, i18n, components, logic) y sin servidor propio.
- S2 (supuesto, a confirmar con el mockup): motor portado a TypeScript puro en un Web Worker, sin Python ni WASM, para no tocar la arquitectura (Vercel estático + Firebase) ni el CSP.
- S3: comportamiento aceptado del original, sin cambios (regla del dueño: «Los resultados calculados y su presentación no cambian sin aprobación»). Son los S1-S15 de `Quick-Nesting-Entrega/odd/tasks/local-nesting.md` y los ocho puntos de «Preserve these behaviours» de `START-HERE-INTEGRATION.md`: automático, manual por capa, varias capas de largo fijo, margen interno, rotación absoluta/libre/independiente, separación borde a borde, diagnóstico colapsado e invalidación del resultado al cambiar algo.
- S4: ejemplos de referencia que deben seguir saliendo igual: cuatro cuadrados de 10 × 10 mm en 22 × 22 mm con 2 mm de separación; manual de cinco cuadrados en 22 mm de ancho da 34 mm de largo y de ocho da 46 mm; 2000 × 2000 mm con 10 mm por lado deja 1980 × 1980 mm útiles; cinco piezas con capacidad cuatro por capa dan un grupo completo de cuatro y un parcial de uno, cinco en total.
- S5: textos de la interfaz copiados tal cual de `Quick-Nesting-Entrega/web/i18n.js` (regla del dueño). Solo se omiten los que dependen del servidor local (`offline`, `request_error`) y los controles que ya da el toolbox (idioma, tema, insignia «Procesamiento local»), según el mockup aprobado.
- S6: «Cualquier rediseño pasa primero por un mockup.» La pantalla dentro del toolbox se aprueba antes de escribir la interfaz.
- S7: unas 100 pruebas esenciales para la herramienta; diferenciales contra el motor Python original con resultados de referencia generados una vez.

## Tasks
- T0 [S1,S5,S6] inline: mockup `odd/mockups/quick-nesting.html`. Pendiente de aprobación.
- T1 [S3,S7] inline: resultados de referencia del Python original (casos deterministas, sin límite de tiempo) en `v2/legacy-fixtures/quicknesting/`. Necesita instalar ezdxf 1.3.2 y shapely 2.1.2 en un entorno temporal; pendiente de permiso.
- T2 [S2,S3] inline: geometría base (rotar, trasladar, área, validez, contención, solape, distancia entre bordes) y pruebas.
- T3 [S3,S7] inline: lector DXF (LINE, ARC, LWPOLYLINE con bulge, POLYLINE, SPLINE, ELLIPSE; unidades, unión de abiertos, diagnósticos, límites) contra referencias. Riesgo 2: archivo no confiable.
- T4 [S3,S4,S7] inline: motor de acomodo en Web Worker (fijo, libre, independiente, separación, límites) contra referencias.
- T5 [S3,S4,S7] inline: margen y planes de capas contra referencias.
- T6 [S1,S5,S6] inline: interfaz React según el mockup aprobado: store, i18n, componentes, dibujo SVG, cliente del worker.
- T7 [S1] inline: registro (`routes.ts`, `tools.json`, `registry.ts`), `CLAUDE.md`, build y suite completa.

## Log
- L1 (2026-11-05): «Continúa el trabajo en curso en v2: revisa los cambios sin confirmar, dime en qué estado están y termina lo que se empezó.» Luego: «tambien acabo de agregar una carpeta llamada quick nesting para integrar a la app y que est}e lean con todo lo demas.»
- L2: estado inicial: v2 limpio y publicado (d44009a); la carpeta `Quick-Nesting-Entrega/` está sin seguimiento y su integración no ha empezado. El explorador mapeó el patrón de herramienta (routes.ts, tools.json, registry.ts; access y usage no requieren cambios), los tokens del tema (misma paleta Nebulosa que el original), el CSP (`worker-src 'self' blob:` ya permitido) y las funciones de Shapely/ezdxf que usa el motor.
- L3: siguiente paso: aprobación del mockup y permiso para instalar las dependencias Python en un entorno temporal (solo para generar referencias).
