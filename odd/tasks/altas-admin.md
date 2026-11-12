# Altas de usuarios hechas por el administrador
El admin crea cuentas con correo y contraseña temporal para personas cuyo correo no recibe el enlace de verificación de Firebase.
Rama: `feat/altas-admin` (desde `v2` en 052bc61). Entrega: ask-on-risk. Pruebas: `npm test` y `npm run test:rules` en `v2/` (JDK 27 disponible).

## Specs
- S1: «He tenido temas con los emails de correos externos para que les llegue el link para iniciar sesion, hay alguna forma de crearles un usuario y passwor?» Respuesta elegida: «Altas hechas por mí».
- S2: Solo el administrador (`config/app.adminEmail`) puede crear cuentas desde su panel (página de uso, junto a «Solicitudes de acceso"). Campos: correo, nombre (opcional) y contraseña temporal, con un botón para generarla. Al crear, su sesión de admin no se cierra.
- S3: La cuenta creada queda en la lista de acceso (`allowlist/{correo}`) con el `uid` de Firebase. Las reglas aceptan un token sin `email_verified` solo si `allowlist/{correo}.uid == request.auth.uid`. Cualquier otra cuenta sin verificar sigue rechazada, igual que hoy.
- S4: La persona entra con correo y contraseña sin ver la pantalla de verificación. Desde su menú de usuario puede cambiar la contraseña indicando la actual.
- S5: Si ya existe una cuenta con ese correo, no se toca: el panel explica que hay que borrarla en la consola de Firebase y volver a crearla. La app no puede restablecer ni borrar cuentas ajenas, porque eso requiere el SDK de administración en un servidor y el toolbox no tiene.
- S6: La contraseña temporal se muestra una sola vez, con un botón para copiarla, y nunca se guarda en Firestore ni en el navegador.
- S7: «Cualquier rediseño pasa primero por un mockup.» Los textos nuevos se aprueban con el mockup.

## Tasks
- T1 [S2-S7] inline: mockup `odd/mockups/altas-admin.html`. Pendiente de aprobación.
- T2 [S3] inline: reglas (`signedIn()` acepta la cuenta de confianza) y pruebas de reglas. Riesgo 2 (seguridad).
- T3 [S2,S5,S6] inline: `createUserByAdmin` con una app secundaria de Firebase, panel «Crear usuario» y pruebas.
- T4 [S4] inline: `useAuth` deja pasar a la cuenta de confianza sin verificar; «Cambiar contraseña» en el menú; pruebas.
- T5 inline: verificación independiente (riesgo alto), suite, build, `test:rules`. Publicar solo con permiso, y desplegar las reglas de Firestore aparte, con permiso.

## Avance
- T1 aprobado («Aprobado», 2026-11-12).
- T2 hecho: `adminCreated()` en `signedIn()`; 5 pruebas de reglas nuevas, RED observado y luego 39/39. Commit 9b1eb2c. El emulador necesita `JAVA_TOOL_OPTIONS=-Djdk.net.unixdomain.tmpdir=C:/jdk-uds` en este equipo (Java 27 no abre el socket local en la carpeta temporal).
- T3 y T4 hechos: `createUser.ts`, `CreateUserPanel.tsx`, `ChangePasswordDialog.tsx` (se carga al abrirlo), `useAuth` e `isAdminCreated`/`changePassword`, y textos ES/EN. Sin RED en la app: el código se escribió antes que sus pruebas. 892/892 y build correctos. Textos de error nuevos, no mostrados en el mockup: `access.create.invalid`, `weakPassword`, `accessFailed`, `failed`, `auth.password.mismatch`, `wrong`, `failed`.

## Log
- L1 (2026-11-12): «He tenido temas con los emails de correos externos para que les llegue el link para iniciar sesion, hay alguna forma de crearles un usuario y passwor?» → «Altas hechas por mí».
- L2: la app exige `emailVerified` en `useAuth.ts` (pantalla de verificación) y `email_verified == true` en `signedIn()` de `firestore.rules`. Firebase envía el enlace desde `noreply@…firebaseapp.com`, que los filtros corporativos bloquean. Crear la cuenta en la consola de Firebase no basta, porque queda sin verificar. Las herramientas de Firebase disponibles no pueden marcar un correo como verificado. Las solicitudes ya guardan `uid == request.auth.uid`, pero aprobar cuentas que crearon los propios usuarios permitiría suplantaciones, así que solo cuentan las cuentas creadas por el admin.
