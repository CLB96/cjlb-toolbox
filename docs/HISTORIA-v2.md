# Cómo se construyó el CJLB Toolbox v2 (resumen)

Del 29 al 31 de octubre de 2026 se rehízo el toolbox: de cinco páginas HTML sueltas (Gantt, GapCheck, Bondline, CapaFlow y VectoriZr) se pasó a una sola app con pestañas, en la carpeta `v2/`.

## Qué se decidió
- **Stack:** Vite + React + TypeScript + Zustand, con Firebase (Auth + Firestore) para el login, la lista de usuarios permitidos, las solicitudes de acceso y el registro de uso (pestaña Uso, solo admin).
- **Diseño:** glassmorphism "Nebulosa" con tema de día y de noche.
- **Guardado:** automático cada minuto, con historial y "Volver donde lo dejaste" (IndexedDB, por usuario).
- **Publicación:** la rama `v2` se publica en pte-toolbox.vercel.app. `main` y el sitio viejo siguen intactos hasta reemplazarlos.

## Cómo se portó cada herramienta
1. Se hizo un inventario técnico del HTML original (los de Gantt y CapaFlow los generó ChatGPT para ahorrar tokens).
2. El dueño aprobó un mockup antes/después del diseño.
3. Se copió la lógica original tal cual en `v2/legacy-fixtures/<herramienta>/legacyReference.ts`, y unas pruebas diferenciales comparan la versión nueva contra esa copia con datos reales y casos representativos.
4. Las rarezas del original se listaron como "mejoras propuestas" y solo se cambiaron con aprobación del dueño.

## Reglas del dueño que siguen vigentes
- **Resultados:** idénticos al original salvo mejoras aprobadas.
- **Textos:** copiados tal cual del original.
- **Pruebas:** unas 100 esenciales por herramienta.
- **Diseño:** cualquier rediseño pasa primero por un mockup.
- **Publicación:** siempre se pregunta antes de publicar.

## Estado al cierre
| Herramienta | Estado |
|---|---|
| GapCheck | Portado y publicado; mejoras aplicadas |
| Bondline | Portado y publicado; mejoras aplicadas (incluidas 8, 9, 10, 12, 18) |
| Gantt | Portado y publicado (hasta 5 Gantts por usuario, sin JSONBin); mejoras aplicadas |
| CapaFlow | Portado y publicado; PNG en diseño Nebulosa; mejoras aplicadas (PPM por cola, sin Cmk, confianza conectada, etc.) |
| VectoriZr | **Pendiente.** Se copiará el código de `../Digitalizacion` y hará falta `'wasm-unsafe-eval'` en la CSP por OpenCV |

Los planes, inventarios, mockups y documentos de mejoras que se usaron en el camino se borraron el 2026-10-31. Siguen en el historial de git (commits anteriores a esa fecha) por si se necesitan.
