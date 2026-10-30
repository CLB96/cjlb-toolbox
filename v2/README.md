# CJLB Toolbox v2

Aplicación React + Vite + TypeScript con Firebase (Auth + Firestore). Esta carpeta (`v2/`) convive con la versión actual del sitio y se despliega como un proyecto Vercel aparte.

## Antes de publicar

**Las pruebas de las reglas de seguridad de Firestore NUNCA se han ejecutado.** El emulador de Firestore necesita Java y no está instalado en la máquina de desarrollo. Antes de publicar:

1. Instala un JDK 17 o superior (por ejemplo Eclipse Temurin 17) y verifica con `java -version`.
2. Ejecuta:

   ```bash
   cd v2
   npm run test:rules
   ```

   (usa `vitest.rules.config.ts` dentro de `firebase emulators:exec`).
3. No despliegues `firestore.rules` hasta que esas pruebas pasen.

Otros puntos previos:

- Las reglas exigen correo verificado (`email_verified == true`). Las cuentas Google ya vienen verificadas; las de correo/contraseña reciben un correo de verificación desde la app. Desactiva el registro desde el cliente en Firebase (ver `SETUP-FIREBASE-VERCEL.md`).
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
| `VITE_ADMIN_EMAIL` | Correo del administrador (declarada; el administrador efectivo lo define el documento `config/app` en Firestore). |
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
| `img-src 'self' data:` | Imágenes propias e incrustadas. |
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
   const { markDirty, flush, lastSavedAt, restoreVersion } = usePersistentTool<MyState>(toolId, {
     getSnapshot: () => state,        // devuelve el estado serializable actual
     restore: (s) => setState(s),     // aplica un snapshot guardado
   })
   ```

   - `markDirty()` se llama tras cada cambio del usuario; el autosave guarda cada 60 s y al cerrar la página.
   - `flush()` guarda de inmediato (también se registra para el cierre de página).
   - `lastSavedAt` es `number | null` (marca de tiempo del último guardado o restauración).
   - `restoreVersion(id)` carga una versión anterior y la aplica con `restore`.
   - Al montar, el hook restaura el último snapshot automáticamente.
4. El estado se guarda por usuario: el hook lee el `uid` de `UidProvider`, y `AuthGate` monta `AppShell` con `key={uid}`, de modo que al cambiar de usuario se desmonta el estado keep-alive del anterior. No guardes estado de herramientas fuera de este hook.
