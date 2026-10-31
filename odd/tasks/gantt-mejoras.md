# Gantt v2: owner-approved improvements
Objective: apply every proposal in docs/superpowers/plans/gantt-mejoras-propuestas.md.
Branch: claude/elegant-almeida-6a8612 · Delivery: work-unit commits, owner approves the push to v2 · Runner: `npm test` / `npm run build` in v2/.

## Specs
- S1 (A2) "Que la tabla y los exportes respeten el orden elegido." Roots follow the chosen sort; children keep their manual order.
- S2 (A3) "Guardar la fecha local (sin UTC)."
- S3 (A4) "Recalcular "hoy" al cambiar de día."
- S4 (A6) "Mostrar "+ Add" en inglés."
- S5 (A8) "Dibujar la línea de hoy también encima de las barras."
- S6 (A10) "Añadir las reglas completas (barra con fechas efectivas y "Tarde")."
- S7 (B1) "Recordar qué está plegado."
- S8 (B2) "Usar un ancho fijo en el PNG." Assumption: the PNG never uses less than the default 280 px.
- S9 (B3) "Que cada Gantt recuerde los suyos." (search, filter, sort)
- S10 (B4) "Botón "Importar Excel" que lea el Excel exportado por el original." Assumption: the import creates a new Gantt.
- S11 (B6) "Habilitar táctil." (bar move/resize)

## Tasks
- T1 S2,S3,S4 inline · done · 1f70d6d
- T2 S1 inline · done · fb1617e
- T3 S7,S9 inline · done · c3330a5
- T4 S5,S8 inline · done · d783e23
- T5 S6,S10 inline · done · d0a04da
- T6 S11 inline · done · 41f6f88

## Log
- L1 (2026-10-30) "Implementa las mejoras."
- L2 (2026-10-30) Done: all 6 tasks committed with RED→GREEN tests. Full suite 389 passed / 11 skipped; `npm run build` OK. Browser check blocked: the shared Firestore emulator (another worktree's, port 8080) answers REST but the SDK listen channel stalls ("No se pudo comprobar tu acceso"). Not pushed to v2.
