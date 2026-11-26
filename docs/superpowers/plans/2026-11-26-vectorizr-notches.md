# VectoriZr notches visuales (entrega 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: executing-plans (inline). Steps use checkbox syntax.

**Goal:** Notches I/V/T como línea fantasma visual en el editor, con menú de clic derecho, sin tocar la exportación.

**Architecture:** `Piece.notches` en el store (sin copia de trabajo ni historial). Geometría pura en `logic/notches.ts`. Menú HTML por evento `contextmenu` del contenedor; dibujo Konva en `NotchLayer`.

**Spec:** `docs/superpowers/specs/2026-11-26-vectorizr-multipieza-design.md` (sección Entrega 2). Mockup: `odd/mockups/vectorizr-notches.html`.

## Global Constraints
Sin punto y coma, comillas simples, archivos de menos de 400 líneas, textos nuevos en es y en. DXF/SVG/PDF no cambian. Comandos desde `v2/`: `npx vitest run`, `npx tsc --noEmit`.

## Review Focus
- Notch sobre contorno de 2 puntos, vacío o con curvas Bézier.
- Polígonos en sentido horario y antihorario: la V apunta siempre hacia adentro.
- Sesiones sin `notches` se abren sin error; las de piezas distintas no se mezclan.
- Profundidad vacía, 0 o negativa se corrige; escala 0 no rompe el dibujo.

### Task 1: Modelo, geometría y store
**Files:** `types.ts` (`Notch`, `Piece.notches`), `logic/notches.ts` (nuevo), `logic/pieces.ts` (`newPiece` con `notches: []`), `store.ts` (`addNotch`, `updateNotch`, `removeNotch`, migración), tests en `logic/logic.test.ts` y `store.test.ts`.
**Interfaces:** `nearestOnContour(points, x, y): { x, y, tx, ty, nx, ny, dist } | null` (nx, ny = normal hacia el interior); `notchGeometry(notch, points, scaleFactor): { type, base, tip, a?, b? } | null`; `clampDepth(v): number`; `DEFAULT_NOTCH_DEPTH = 5`.
- [ ] Tests en rojo: normal hacia adentro en polígono horario y antihorario; punto más cercano; V/I/T con `flipped`; `clampDepth`; acciones del store por pieza activa; piezas sin `notches` migran a `[]`.
- [ ] Implementar y ver verde. Commit.

### Task 2: Editor
**Files:** `components/editor/NotchLayer.tsx`, `NotchMenu.tsx`, `EditorCanvas.tsx`, `PropertiesPanel.tsx`, `Step4Editor.tsx`, `i18n.ts`, `vectorizr.css`, `VectorizrTool.test.tsx`.
- [ ] Test en rojo: clic derecho sobre el contorno muestra "Añadir notch"; al elegirlo y volver a hacer clic derecho sobre él aparece "Eliminar"; "Voltear", tipos y profundidad en el panel; Escape cierra el menú.
- [ ] Implementar y ver verde, `tsc`, build, suite. Commit.
