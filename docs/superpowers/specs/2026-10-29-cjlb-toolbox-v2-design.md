# CJLB Toolbox v2 — Diseño

Fecha: 2026-10-29 · Estado: borrador para aprobación

Marcas usadas en este documento:
- **[Decidido]**: lo dijo el dueño del proyecto (CLB96).
- **[Propuesta]**: decisión del diseñador/builder, que el dueño puede revisar.

---

## 1. Intención y por qué

Hoy el CJLB Toolbox es una landing (`index.html` + `tools.json`) que enlaza a cinco
herramientas independientes, cada una con su propio HTML, sus estilos, su tema día/noche,
su selector de idioma, sus logos copiados y su pantalla de contraseña:

| Herramienta | Hoy | Tamaño | Librerías CDN | Guarda estado |
|---|---|---|---|---|
| Gantt Tracker | `gantt/index.html` vanilla | ~2.1k líneas | — | parcial (idioma, datos) |
| GapCheck | `gapcheck/index.html` vanilla | ~2.9k líneas | Chart.js 4.4.4, xlsx 0.18.5 | **nada** |
| Bondline Thermal | `bondline/index.html` vanilla | ~3.2k líneas | Chart.js 4.4.4, annotation 3.0.1, xlsx 0.18.5 | parcial (defaults, tema) |
| CapaFlow | `capaflow/index.html` vanilla | ~8.6k líneas | JSZip 3.10.1, xlsx 0.18.5 | parcial |
| VectoriZr | build de Vite desde `../Digitalizacion` (React 18 + TS + Tailwind + Zustand + Konva + OpenCV.js + PWA) | — | — | propio |

**Problema principal [Decidido]:** cualquier cambio de diseño o estructura hay que repetirlo
cinco veces; si no se hace, alguna herramienta se ve "atrasada". El objetivo es **una sola
aplicación con pestañas**, con una única fuente de diseño, marco, login y guardado.

**Cómo se usa [Decidido]:** normalmente se entra a una herramienta y se trabaja un rato.
Bondline y GapCheck se abren juntas: la misma persona hace los dos análisis (independientes,
sin intercambio de datos) y al final junta los resultados en un resumen.

**Dolor secundario [Decidido]:** un refresh, cerrar la pestaña por error o cambiar de página
borra el trabajo (GapCheck no guarda nada hoy).

## 2. Objetivos

1. Una sola app (SPA) con pestañas: Inicio, Gantt, GapCheck, Bondline, CapaFlow, VectoriZr
   (+ Uso, solo para el admin). [Decidido]
2. Un solo lenguaje visual: glassmorphism con paleta espacial **"Nebulosa"**, con modo día y
   noche. [Decidido]
3. Cambiar de pestaña **no** pierde lo cargado/calculado; las herramientas abiertas quedan
   montadas en segundo plano. [Decidido]
4. Guardado automático + pequeño historial que sobrevive refresh y cierre. [Decidido]
5. Login único con Firebase, saludo con nombre/correo, registro de uso: quién, cuántas horas,
   qué herramientas. [Decidido]
6. Inicio con saludo, accesos a herramientas y "¿Volver donde lo dejaste?" (Continuar / Empezar
   de cero). [Decidido]

## 3. No-objetivos

- **Sin niveles de usuario/roles.** Todos ven y hacen lo mismo; la única diferencia es que el
  admin ve la pestaña Uso. [Decidido]
- Sin edición de contenido o configuración desde el navegador (no hay panel admin de
  contenido); los cambios de código los hace el dueño con Claude vía Git. [Decidido]
- Los datos de los análisis **no** se suben a la nube; viven en el navegador de cada persona.
  [Propuesta]
- No se fusionan Bondline y GapCheck ni se crea un "resumen conjunto" automático (no se pidió).
- No se reescribe el motor de VectoriZr (OpenCV, exportación DXF/DWG).

## 4. Anti-objetivos (fallaría aunque "funcione")

- **Que cualquier cálculo dé un valor distinto al de hoy, o que los valores y gráficas se
  presenten de otra forma** (formato, unidades, decimales, orden, tipo de gráfico, qué datos
  muestra cada gráfica, contenido de reportes/exports). [Decidido] El **diseño** alrededor
  (colores, tipografía, layout, vidrio) sí puede cambiar, pero solo después de mostrar un
  mockup o propuesta y que el dueño lo apruebe (§6.4). [Decidido]
- Que desaparezca una función existente, aunque se use poco. [Decidido]
- Que la versión nueva reemplace a la actual antes de que el dueño esté 100% conforme. [Decidido]
- Mejoras "porque sí": toda mejora en valores o presentación se propone **aparte**,
  fundamentando qué está mal hoy vs. qué se gana, y solo se aplica con aprobación. [Decidido]
- Romper lo que hoy funciona: el sitio actual (raíz de este repo) y `../Digitalizacion` no se
  tocan. [Decidido]

## 5. Restricciones

- **Carpeta nueva [Decidido]:** todo el v2 vive en `v2/` dentro de este repo
  (`cjlb-toolbox/v2/`). [Propuesta: el nombre y la ubicación]. Nada fuera de `v2/` se modifica,
  salvo `.gitignore` (agregar `.superpowers/`, `v2/node_modules`, `v2/dist`) y este doc.
- **Publicación [Decidido]:** el v2 se publica en una dirección de prueba separada mientras se
  construye; el dominio actual sigue sirviendo la versión actual hasta que el dueño apruebe el
  cambio. [Propuesta: un proyecto Vercel nuevo apuntando a `v2/` como *Root Directory*; el
  corte final es reasignar el dominio, decisión del dueño.]
- **Firebase [Decidido]:** el dueño ya usa Firebase en otros proyectos. [Propuesta: proyecto
  Firebase **nuevo** dedicado al toolbox, plan gratuito Spark.] La configuración web de
  Firebase va en variables de entorno de Vite (`VITE_FIREBASE_*`) en `.env.local` (no
  versionado) y en Vercel; se versiona un `.env.example`.
- Plataforma: escritorio, navegadores modernos (Chrome/Edge). Debe verse bien también en
  pantallas angostas, pero no es una app móvil. [Propuesta]
- Idiomas ES/EN como hoy. [Propuesta: mantener ES por defecto]

## 6. Arquitectura [Propuesta]

### 6.1 Stack
Mismo stack que VectoriZr para tener **un solo build**:
**Vite + React 18 + TypeScript**, Zustand para estado, Vitest para tests.
- Estilos: CSS con *design tokens* (variables CSS) en un único archivo de tema; componentes
  base propios (`GlassCard`, `GlassBar`, `Button`, `Tabs`, `Dialog`, `Toast`, `Table`,
  `Field`). Tailwind solo dentro de VectoriZr si su código lo requiere; el tema expone los
  tokens para que Tailwind los consuma (mapear colores de `tailwind.config` a las variables).
- Chart.js, xlsx, JSZip, chartjs-plugin-annotation pasan de CDN a dependencias npm **en las
  mismas versiones** que hoy (Chart.js 4.4.4, xlsx 0.18.5, JSZip 3.10.1, annotation 3.0.1)
  para no alterar resultados ni exports.
- Firebase JS SDK modular (`firebase/auth`, `firebase/firestore`).

### 6.2 Estructura de carpetas (orientativa)
```
v2/
  index.html
  vite.config.ts
  .env.example
  src/
    app/            ← shell: AppShell, router de pestañas, providers
    theme/          ← tokens.css (Nebulosa día/noche), fonts, chartTheme.ts
    ui/             ← componentes glass compartidos
    auth/           ← Firebase auth, allowlist, LoginScreen
    usage/          ← tracking de sesiones + pestaña Uso
    persistence/    ← autosave + historial (API común)
    i18n/           ← diccionarios ES/EN y hook useT()
    home/           ← Inicio
    tools/
      gantt/        ← UI + logic/ (funciones puras)
      gapcheck/
      bondline/
      capaflow/
      vectorizr/    ← código copiado de ../Digitalizacion/src
    legacy-fixtures/ ← entradas y salidas de referencia de las herramientas actuales
  public/           ← logos, opencv.js, íconos
```

### 6.3 Shell y navegación
- Barra superior glass: logo CJLB (variantes día/noche usando `logo1.png`/`logo2.png`),
  pestañas, selector de idioma, botón de tema, avatar con menú (nombre, correo, cerrar sesión).
- Pestañas con URL propia (`/#/gapcheck` o rutas `/gapcheck`) para que refresh vuelva a la
  misma pestaña.
- **Keep-alive:** una herramienta se monta la primera vez que se abre y luego se oculta
  (no se desmonta) al cambiar de pestaña. Cada herramienta se carga con *lazy import* para que
  Inicio sea liviano; VectoriZr/OpenCV solo se descarga al abrir su pestaña.

### 6.4 Migración de las cuatro herramientas vanilla
- Cada herramienta se porta a React **separando la lógica de cálculo en funciones puras**
  (`tools/<id>/logic/*.ts`) copiadas del JS actual con el mínimo de cambios (tipado, sin
  cambiar fórmulas, redondeos ni orden de operaciones).
- **Pruebas de equivalencia (golden tests):** antes de portar, se capturan entradas reales/
  de ejemplo y las salidas de la versión actual (valores calculados, tablas, contenido de los
  Excel/ZIP exportados) en `legacy-fixtures/`; los tests de Vitest exigen que la versión nueva
  produzca exactamente lo mismo. Ningún port se da por terminado sin pasar sus golden tests.
- Inventario de funciones por herramienta (checklist) antes de portar, revisado contra la
  versión actual al final, para cumplir "no desaparece nada".
- Presentación: mismos datos, mismas columnas, mismos formatos numéricos y mismos tipos de
  gráfico; cambia solo la piel (glass + paleta). Los colores de series de gráficos se toman
  de la paleta; si una serie tiene hoy un color con significado (p. ej. rojo = fuera de
  tolerancia), se conserva el significado con el color semántico equivalente del tema.
- **Propuesta de rediseño por herramienta [Decidido]:** antes de portar cada herramienta, el
  builder entrega una propuesta visual **antes / después** (mockup HTML con datos reales o de
  ejemplo, en día y noche) de cada pantalla y de cada export con aspecto propio (PNG de
  gráficos, Excel con estilos, reportes). La propuesta indica qué cambia de diseño y confirma
  que valores y gráficas quedan iguales. Solo se implementa lo aprobado; lo no aprobado
  conserva el diseño actual adaptado mínimamente al shell.
- Se eliminan las cinco pantallas de contraseña hardcodeadas (reemplazadas por el login).

### 6.5 VectoriZr
- Su código fuente (`../Digitalizacion/src`) se copia a `v2/src/tools/vectorizr/` y se monta
  como pestaña. Motor, OpenCV y export DXF/DWG sin cambios; solo se re-tematiza (tokens
  Nebulosa) y se adapta al shell (sin su propia barra/título si duplica la del shell).
- PWA/service worker: [Propuesta] se elimina en v2 (el shell no es PWA); se conserva el
  cacheo de `opencv.js` vía cabeceras HTTP de caché. El VectoriZr original en
  `../Digitalizacion` y su despliegue no se tocan.

### 6.6 Orden de construcción
1. Shell, tema Nebulosa, componentes glass, i18n.
2. Login + allowlist + saludo + Inicio.
3. Persistencia/historial (API común).
4. GapCheck y Bondline (las que se usan juntas; además GapCheck es la que más sufre hoy).
5. Gantt, CapaFlow.
6. VectoriZr.

En los pasos 4 a 6, cada herramienta empieza con su propuesta antes/después (§6.4) y
espera la aprobación del dueño antes de implementar el rediseño.
7. Tracking de uso + pestaña Uso.
8. Publicación en la dirección de prueba; revisión del dueño herramienta por herramienta.

Cada paso se puede revisar en la dirección de prueba antes de pasar al siguiente.

## 7. Diseño visual — "Nebulosa" [Decidido: paleta y estilo · Propuesta: detalles]

Referencia visual aprobada: `.superpowers/brainstorm/*/content/estilo-espacial.html`, opción A.

- **Noche:** fondo con gradiente radial `#3b1a5e → #160c2e → #07061a`, estrellas sutiles,
  dos manchas de luz difusas (magenta `#c13cff`, azul `#3d5bff`). Vidrio
  `rgba(255,255,255,.07)` con borde `rgba(255,255,255,.16)` y `backdrop-filter: blur(14px)
  saturate(140%)`. Texto `#efe9ff`, secundario `#b3a6d9`. Acentos `#d16bff` / `#6a7bff`.
- **Día:** gradiente lavanda `#f6ecff → #e4e2ff → #d9ecff`; vidrio `rgba(255,255,255,.55)` con
  borde blanco; texto `#251a40`, secundario `#6d6290`; acentos `#9b3fe0` / `#4a5fe8`.
- Colores semánticos (OK / advertencia / error / info) definidos para ambos temas con
  contraste AA sobre vidrio.
- Tipografía: **Space Grotesk** (títulos, números destacados) + **Inter** (texto, tablas),
  autoalojadas o vía Google Fonts.
- Tema: por defecto sigue al sistema; el botón lo fija y se recuerda.
- Tablas y zonas densas de datos usan un vidrio más opaco para legibilidad.
- Accesibilidad: foco visible, navegación por teclado en pestañas, `prefers-reduced-motion`
  respeta animaciones, fallback sin `backdrop-filter` con fondos sólidos.

## 8. Login y usuarios

- **Firebase Authentication** con Google y con correo/contraseña. [Propuesta: ambos; el alta
  de cuentas de correo la hace el admin desde la consola de Firebase, sin registro público.]
- **Lista de correos autorizados [Decidido en esencia: solo gente del equipo]:** colección
  Firestore `allowlist/{email}`, administrada por el dueño desde la consola de Firebase.
  Un usuario autenticado que no está en la lista ve un mensaje "Sin acceso" y se cierra sesión.
  Las **reglas de seguridad de Firestore** verifican la allowlist (la protección real está en
  el servidor, no solo en la UI).
- **Solicitud de acceso [Decidido]:** quien inicia sesión y no está en la allowlist ve
  "Sin acceso" con la opción **Solicitar acceso** (nombre, correo de la cuenta y un motivo
  breve opcional). [Propuesta] La solicitud se guarda en Firestore `accessRequests/{email}`
  (una por correo, sin duplicados). El admin ve las solicitudes pendientes en su pestaña
  (con un contador en el avatar) y las **aprueba o rechaza desde la app**: aprobar agrega el
  correo a la allowlist. El solicitante ve "Solicitud enviada" / "pendiente" al volver a
  entrar. Sin correos automáticos en este alcance. Para correo/contraseña, como no hay
  registro público, la solicitud se hace con la cuenta de Google o dejando un correo de
  contacto en un formulario mínimo sin login (con límite básico anti-spam).
- **Admin:** un único correo (el del dueño), definido en la configuración (variable de entorno
  y regla de Firestore). Solo ve además la pestaña Uso. [Decidido]
- **Saludo [Decidido]:** "Hola, {nombre}" usando el nombre de la cuenta; si no hay nombre,
  el correo.
- Sesión persistente (no pedir login en cada visita).
- Nota honesta: el código de la SPA es público como cualquier sitio estático; lo que el login
  protege es el acceso a la app y el registro de uso. Los datos de análisis nunca salen del
  navegador del usuario.

## 9. Guardado automático e historial [Decidido: comportamiento · Propuesta: mecánica]

- API común en `persistence/`: cada herramienta expone `getSnapshot()` / `restore(snapshot)`
  de su estado serializable.
- Autosave **cada 1 minuto** si hubo cambios [Decidido], y además al ocultar/cerrar la
  pestaña o cambiar de herramienta (`visibilitychange`/`pagehide`) para no perder el último
  minuto. [Propuesta] Un indicador discreto muestra "Guardado hace X min".
- Almacenamiento en **IndexedDB** (los archivos cargados pueden superar el límite de
  localStorage), con clave por **usuario + herramienta**, para que dos personas en el mismo
  equipo no se mezclen.
- Historial: últimas **10** versiones por herramienta, con fecha/hora; se puede abrir un panel
  "Historial" en cada herramienta para restaurar una versión.
- Si guardar falla (cuota llena, modo privado) se muestra un aviso visible; nunca falla en
  silencio.
- Archivos cargados (Excel, imágenes): se guardan dentro del snapshot si pesan menos de un
  umbral (p. ej. 20 MB); si no, se guarda el estado derivado y se avisa que hay que volver a
  cargar el archivo.
- Las preferencias actuales (p. ej. `bondlineDefaults`, idioma, tema) se conservan como
  preferencias por usuario.

## 10. Inicio [Decidido]

- Saludo grande con nombre/correo.
- Tarjetas glass de acceso a las cinco herramientas (icono, nombre, descripción ES/EN,
  estado activo/pausado y badge "nuevo/actualizado" como en `tools.json`, que se
  reutiliza como fuente de estos datos).
- **"¿Volver donde lo dejaste?"**: si existe un snapshot reciente, muestra herramienta y
  hace cuánto ("GapCheck · hace 25 min") con **Continuar** (abre la pestaña y restaura) y
  **Empezar de cero** (abre limpio). Si hay varias herramientas con trabajo, se listan las
  más recientes (p. ej. GapCheck y Bondline). [Propuesta: hasta 3]
- **Empezar de cero no borra:** el estado anterior queda en el historial. [Propuesta]

## 11. Registro de uso y pestaña Uso [Decidido: quién, horas, herramientas · Propuesta: cómo]

- Se registra en Firestore `sessions/{id}`: `uid`, `email`, `name`, `tool`, `start`, `end`,
  `activeSeconds`.
- Tiempo **activo**: cuenta solo con la pestaña del navegador visible y con interacción en los
  últimos ~5 min; se envía un latido cada ~60 s que actualiza `activeSeconds`. Dejar la app
  abierta de noche no suma horas.
- Se registra también cada login (`logins/{id}`) para "última vez que entró".
- Pestaña **Uso** (solo admin): filtro por semana/mes/rango; tabla por persona (horas totales,
  última conexión) y desglose por herramienta; gráfico de horas por herramienta. Exportable a
  Excel.
- Reglas Firestore: cada usuario solo puede crear/actualizar sus propias sesiones; solo el
  admin puede leer todas.
- Volumen esperado bajo (equipo pequeño) → dentro del plan gratuito.

## 12. Calidad y verificación

- Golden tests de equivalencia por herramienta (§6.4) — criterio de "terminado".
- Tests unitarios de persistencia, allowlist y cálculo de tiempo activo.
- Revisión visual en día y noche, a 1440 px y 1024 px, por herramienta.
- Checklist de funciones por herramienta contrastado con la versión actual.

## 12b. Decisiones tras la revisión [Propuesta salvo que se indique]

- **Exports y pantallas [Decidido]:** pantallas y exports (PNG de gráficos, Excel, ZIP,
  reportes) pueden adoptar el lenguaje de diseño Nebulosa, siempre que valores y gráficas no
  cambien y que el cambio se haya mostrado antes en la propuesta antes/después (§6.4) y el
  dueño lo haya aprobado. Mientras no haya aprobación, el export conserva su aspecto actual.
  [Propuesta] Los golden tests comparan valores de celdas, contenido y estructura, no bytes
  (xlsx/JSZip meten fechas y metadatos); los PNG exportados se revisan visualmente.
- **Herramienta "pausada"** (`status: "hold"` en `tools.json`): su tarjeta y su pestaña se
  muestran deshabilitadas con el `holdLabel`, como hoy. `tools.json` se mueve a `v2/` y se
  empaqueta en el build; cambiarlo implica commit y redeploy, como hoy.
- **Datos guardados en el sitio actual:** no se migran automáticamente (el v2 está en otro
  dominio). Cada usuario empieza limpio en v2; si alguna herramienta ya tiene
  import/export de archivo (p. ej. JSON en Gantt), se mantiene y sirve para llevar datos.
- **Gantt — sin compartir en la nube [Decidido]:** se elimina JSONBin (Master Key, enlaces
  `?bin=`) y el Gantt "preset" de ejemplo, que ya no hacen falta. Cada usuario ve solo sus
  propios Gantt. [Decidido] Cada usuario puede guardar **hasta 5 Gantt** con nombre y elegir
  cuál ver en un selector; al elegir uno se muestra ese y se ocultan los demás. Crear,
  renombrar, duplicar y borrar (con confirmación) dentro de ese límite. [Propuesta: se guardan
  en el navegador con la misma persistencia por usuario de §9, y cada Gantt tiene su propio
  historial; sincronizar entre equipos queda como mejora futura.]
- **Archivos de prueba [Decidido]:** el dueño aporta un Excel real para GapCheck y otro para
  Bondline. [Decidido] CapaFlow usa el set de ejemplo que ya trae la página ("Cargar datos de
  ejemplo", basado en el ejercicio de muestra de Minitab). [Propuesta: el builder arma un
  archivo de ejemplo para Gantt. Los
  archivos reales se guardan en `v2/legacy-fixtures/private/`, fuera de git (gitignored); sus
  golden tests se saltan con aviso si los archivos no están.]
- **VectoriZr [Decidido]:** la copia dentro de `v2/` pasa a ser la versión oficial desde
  ahora; `../Digitalizacion` queda congelado como referencia y no se sincroniza.
- **Firebase y Vercel:** el dueño crea el proyecto Firebase (habilita Google y correo) y el
  proyecto Vercel, guiado paso a paso por el builder. Mientras tanto se desarrolla contra el
  **Firebase Emulator** local, así que esto no bloquea el avance.

## 13. Lo que queda a criterio del builder

- Detalles de componentes, animaciones e iconografía. [Decidido] Se **deben** cambiar cuando
  el reemplazo es consistente con el sistema y se ve mejor (p. ej. emojis de `tools.json` →
  set de íconos propio), y **se conserva siempre el emoji como fallback** si el ícono no carga.
- Router concreto (hash vs history) y librería de IndexedDB (p. ej. `idb-keyval`).
- Forma exacta de la pestaña Uso, dentro de lo descrito.
- Cómo partir cada herramienta grande en componentes.

## 14. Mejoras futuras (no en este alcance)

Se registran como propuestas separadas, cada una con "qué está mal hoy / qué se gana":
p. ej. resumen conjunto GapCheck + Bondline, sincronizar trabajo entre equipos vía nube.
