# CJLB Toolbox v2

Aplicación React + Vite + TypeScript con Firebase (Auth + Firestore). Esta carpeta (`v2/`) convive con la versión actual del sitio y se despliega como un proyecto Vercel aparte.

## Antes de publicar

Las pruebas de las reglas de seguridad de Firestore (25) pasan contra el emulador (verificado el 2026-10-29 con JDK 27). Vuelve a correrlas antes de desplegar cualquier cambio en `firestore.rules`:

1. Necesitas un JDK 17 o superior; verifica con `java -version`.
2. Ejecuta:

   ```bash
   cd v2
   npm run test:rules
   ```

   (usa `vitest.rules.config.ts` dentro de `firebase emulators:exec`). Los mensajes `PERMISSION_DENIED` en la salida son esperados: vienen de las pruebas que comprueban que las reglas rechazan lo indebido.
3. No despliegues `firestore.rules` si alguna prueba falla.

Si falla al arrancar el emulador:

- `Could not spawn 'java -version'`: Java no está en el PATH de esa terminal. Cierra y vuelve a abrir la terminal (o la app) después de instalar Java.
- `Unable to establish loopback connection` en `firestore-debug.log`: Java no puede crear su socket temporal. Usa una carpeta corta para él y reintenta (PowerShell):

  ```powershell
  New-Item -ItemType Directory -Force C:\tmp\jdk-uds | Out-Null
  $env:JAVA_TOOL_OPTIONS = "-Djdk.net.unixdomain.tmpdir=C:\tmp\jdk-uds"
  npm run test:rules
  ```

Otros puntos previos:

- Las reglas exigen correo verificado (`email_verified == true`). Las cuentas Google ya vienen verificadas; las de correo/contraseña ven la pantalla "Verifica tu correo" y se envían el correo de verificación con el botón de esa pantalla (no se envía automáticamente). Desactiva el registro desde el cliente en Firebase (ver `SETUP-FIREBASE-VERCEL.md`).
- El recorrido manual completo (login, saludo, cambio de herramienta, recarga, solicitud de acceso, aprobación, pestaña Uso) está **pendiente**: requiere emuladores (Java) o un proyecto Firebase real.

## Desarrollo local

```bash
cd v2
npm install
cp .env.example .env.local      # VITE_USE_EMULATORS=true ya viene por defecto
firebase emulators:start        # Auth :9099, Firestore :8080, UI de emuladores (requiere Java)
npm run dev                     # en otra terminal
```

`.firebaserc` apunta al proyecto `demo-cjlb-toolbox`, solo para emuladores. Para desplegar a un proyecto real, ver la guía de configuración.

## Pruebas y build

| Comando | Qué hace |
|---|---|
| `npm test` | Pruebas unitarias y de componentes (Vitest, jsdom). No necesita Java. |
| `npm run test:rules` | Pruebas de reglas de Firestore contra el emulador. Requiere JDK 17+. |
| `npm run build` | `tsc --noEmit` y `vite build` a `dist/` (ignorado por git; no se commitea). |
| `npm run preview` | Sirve `dist/` localmente. |

## Variables de entorno

Ver `.env.example` y `src/vite-env.d.ts`.

| Variable | Uso |
|---|---|
| `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID` | Configuración de la app web de Firebase (no son secretos, pero son propias de cada proyecto). |
| `VITE_ADMIN_EMAIL` | Sin uso actualmente (declarada para la UI; el administrador efectivo lo define `config/app.adminEmail` en Firestore). |
| `VITE_USE_EMULATORS` | `true` en local; **`false` en Vercel**. |
| `VITE_LEGACY_BASE_URL` | Dominio de la versión actual en producción; los enlaces "abrir versión actual" de los Placeholder se construyen con él. |

## Cabeceras y CSP (`vercel.json`)

Además del rewrite SPA (`/(.*)` a `/index.html`), se envían `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY` y `Permissions-Policy` sin cámara, micrófono ni geolocalización. La CSP permite:

| Origen | Motivo |
|---|---|
| `'self'` | Código y recursos propios. |
| `https://apis.google.com`, `https://www.gstatic.com` | Scripts del SDK de Google/Firebase usados en el inicio de sesión con popup. |
| `https://accounts.google.com` | Ventana/iframe de inicio de sesión con Google. |
| `https://*.firebaseapp.com` | Dominio de autenticación de Firebase (handler del popup, iframe). |
| `https://identitytoolkit.googleapis.com`, `https://securetoken.googleapis.com` | API de Firebase Auth (login, verificación de correo, renovación de token). |
| `https://firestore.googleapis.com`, `https://*.googleapis.com` | API de Firestore y otras APIs de Google. |
| `https://*.firebaseio.com`, `wss://*.firebaseio.com` | Canales en tiempo real de Firebase. |
| `https://fonts.googleapis.com`, `https://fonts.gstatic.com` | Hojas de estilo y archivos de fuentes (Inter, Space Grotesk). |
| `img-src 'self' data: blob:` | Imágenes propias, incrustadas y generadas en el navegador (`URL.createObjectURL`). |
| `'unsafe-inline'` en `style-src` | Estilos en línea de React y de Chart.js. |

Si algo queda bloqueado en producción, la consola del navegador indica el origen exacto que hay que añadir.

## Estructura

```
src/app/          shell, rutas, ToolHost (herramientas keep-alive)
src/auth/         AuthGate, login, verificación de correo, acceso denegado
src/access/       solicitudes de acceso (usuarios y panel del admin)
src/persistence/  usePersistentTool, autosave, snapshots en IndexedDB
src/usage/        registro y pestaña de uso (admin)
src/tools/        registry, tipos y Placeholder
src/data/         tools.json (catálogo)
firestore.rules   reglas de seguridad
```

## Portar una herramienta

1. Crea el componente en `src/tools/<id>/` con `export default function Tool({ toolId, active }: ToolProps)`.
2. En `src/tools/registry.ts`, el `load()` de cada herramienta debe devolver el módulo con el componente por defecto, por ejemplo `load: () => import('./gapcheck/GapCheck')` (hoy todas apuntan a `Placeholder`).
3. Persistencia con el hook:

   ```ts
   const stateRef = useRef<MyState>(INITIAL)
   const apply = (s: MyState) => {
     stateRef.current = s              // la ref se actualiza en el acto
     setState(s)
   }
   const { markDirty, flush, lastSavedAt, restoreVersion, restored } = usePersistentTool<MyState>(toolId, {
     getSnapshot: () => stateRef.current, // lee de la ref, nunca de un closure de un render anterior
     restore: (s) => apply(s),            // aplica un snapshot guardado
     reset: () => apply(INITIAL),         // vuelve al estado inicial ("Empezar de cero")
   })
   ```

   - `getSnapshot()` debe devolver datos aptos para structured clone (objetos planos, arrays, `Map`, `Set`, `Date`, `Blob`/`File`, `ArrayBuffer`/typed arrays; sin funciones ni instancias de clases propias) y leer de refs: se llama desde temporizadores y eventos fuera del render. Los archivos de más de 20 MB se sustituyen por `null` en el historial (con aviso).
   - `reset()` se usa cuando el usuario pulsa "Empezar de cero" con la herramienta ya abierta (keep-alive): el hook guarda antes el estado actual en el historial, llama a `reset()` y guarda el estado inicial. Debe actualizar la ref que lee `getSnapshot()`.
   - `restored` es `false` hasta que termina la restauración inicial; mientras tanto no se guarda nada, así que deshabilita la edición (o ignora cambios) hasta que sea `true`.

   - `markDirty()` se llama tras cada cambio del usuario; el autosave guarda cada 60 s y al cerrar la página.
   - `flush()` guarda de inmediato (también se registra para el cierre de página).
   - `lastSavedAt` es `number | null` (marca de tiempo del último guardado o restauración).
   - `restoreVersion(id)` carga una versión anterior, la aplica con `restore` y la guarda como la más reciente.
   - `HistoryPanel` recibe `lastSavedAt` para refrescar la lista tras cada guardado: `<HistoryPanel toolId={toolId} onRestore={restoreVersion} lastSavedAt={lastSavedAt} />`.
   - Cada herramienta se monta dentro de una frontera de error propia: si falla al renderizar o al importarse, se muestra "Reintentar" sin afectar al resto.
   - Al montar, el hook restaura el último snapshot automáticamente.
4. El estado se guarda por usuario: el hook lee el `uid` de `UidProvider`, y `AuthGate` monta `AppShell` con `key={uid}`, de modo que al cambiar de usuario se desmonta el estado keep-alive del anterior. No guardes estado de herramientas fuera de este hook.
