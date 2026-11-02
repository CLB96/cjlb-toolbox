# CJLB Toolbox

Toda la aplicación está en `v2/` (React, Vite, TypeScript, Zustand, Firebase). Es lo único que hay que leer para modificarla.

## Dónde está cada cosa
- `v2/src/tools/<gantt|gapcheck|bondline|capaflow|vectorizr>/`: cada herramienta, con su `logic/`, `components/`, `export/`, `store.ts` e `i18n.ts`.
- `v2/src/app`, `home`, `ui`, `theme`, `i18n`: estructura, inicio, interfaz, tema e idiomas.
- `v2/src/auth`, `access`, `usage`, `persistence`: inicio de sesión, permisos, registro de uso y guardado (IndexedDB, por usuario).
- `v2/firestore.rules`, `v2/vercel.json`: reglas de seguridad y cabeceras.
- `v2/legacy-fixtures/`: copia de la lógica original para las pruebas diferenciales. No hay que leerla salvo que una de esas pruebas falle.
- `v2/legacy-fixtures/private/`: Excel reales para esas pruebas, fuera de git. Sin ellos, esas pruebas se omiten.

## Comandos (en `v2/`)
- `npm test`, `npm run build`, `npm run dev`
- `npm run test:rules`: reglas de Firestore; necesita JDK 17 o superior.

## Publicación
- Cada push a la rama `v2` publica en https://pte-toolbox.vercel.app (proyecto Vercel `pte-toolbox`, carpeta raíz `v2`). Siempre se pregunta antes de publicar.
- `main` conserva el sitio anterior y no se usa. Los proyectos Vercel anteriores están pausados.

## Reglas del dueño
- Los resultados calculados y su presentación no cambian sin aprobación.
- Los textos de la interfaz se copian tal cual del original.
- Unas 100 pruebas esenciales por herramienta.
- Cualquier rediseño pasa primero por un mockup.
- Estilo: sin punto y coma, comillas simples, archivos de menos de 400 líneas, UTF-8.

La historia del proyecto está en `docs/HISTORIA-v2.md`; no hace falta leerla para trabajar.
