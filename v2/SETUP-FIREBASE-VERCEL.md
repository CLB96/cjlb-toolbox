# Guía: Firebase y Vercel para el despliegue de prueba

Todo esto es para un entorno de **prueba nuevo**. No toques el proyecto Vercel actual.

## 0. Requisito: Java

Instala un JDK 17+ (p. ej. Eclipse Temurin 17) y ejecuta `cd v2 && npm run test:rules`. Las reglas de seguridad nunca se han probado; no las despliegues hasta que pasen.

## 1. Proyecto Firebase

1. En la consola de Firebase crea un proyecto **nuevo** (plan Spark, gratuito).
2. **Authentication → Sign-in method**: habilita **Google** y **Correo electrónico/contraseña**.
3. **Authentication → Settings → User actions**: desmarca **Enable create (sign-up)**. Puede pedir actualizar a Identity Platform; sigue siendo gratuito a esta escala. Las reglas exigen correo verificado, así que las cuentas de correo/contraseña se crean **solo desde la consola** (Authentication → Users → Add user); al primer ingreso la app muestra la pantalla "Verifica tu correo", donde el usuario pulsa el botón para enviarse el correo de verificación (no se envía solo). Las cuentas Google ya vienen verificadas.
4. **Project settings → Your apps**: crea una app web y copia la configuración (`apiKey`, `authDomain`, `projectId`, `appId`).
5. **Firestore Database**: crea la base de datos en modo producción.

## 2. Datos iniciales en Firestore

- Colección `config`, documento `app`, campo `adminEmail` (string) con tu correo (en minúsculas recomendado; las reglas lo pasan a minúsculas de todos modos).
- Colección `allowlist`, documento con **tu correo en minúsculas como ID**, campos `addedAt` (timestamp) y `addedBy` (string, p. ej. tu correo).

## 3. Reglas e índices

Desde `v2/`, apuntando al proyecto real (`.firebaserc` trae `demo-cjlb-toolbox`, solo para emuladores):

```bash
firebase login
firebase use --add          # elige tu proyecto y dale un alias, p. ej. "test"
firebase use test
firebase deploy --only firestore:rules,firestore:indexes
```

## 4. Proyecto Vercel (nuevo)

1. Vercel → **Add New → Project** → importa este repositorio.
2. **Root Directory**: `v2`. **Framework Preset**: Vite. (`vercel.json` ya fija `outputDirectory: dist`.)
3. **Environment Variables**:

   | Variable | Valor |
   |---|---|
   | `VITE_FIREBASE_API_KEY` | de la config web |
   | `VITE_FIREBASE_AUTH_DOMAIN` | de la config web |
   | `VITE_FIREBASE_PROJECT_ID` | de la config web |
   | `VITE_FIREBASE_APP_ID` | de la config web |
   | `VITE_ADMIN_EMAIL` | sin uso por ahora (puedes omitirla); el administrador lo define `config/app.adminEmail` en Firestore |
   | `VITE_USE_EMULATORS` | `false` |
   | `VITE_LEGACY_BASE_URL` | dominio de producción actual (para los enlaces de los Placeholder) |

4. Despliega y anota el dominio de prueba (`xxx.vercel.app`).

## 5. Dominio autorizado

Firebase → **Authentication → Settings → Authorized domains → Add domain**: añade el dominio de prueba de Vercel (sin esto el login con Google falla).

## 6. Verificación (pendiente para ti)

Entra con tu correo: saludo, abrir una herramienta Placeholder, contar, cambiar de herramienta y volver, recargar (se restaura), Inicio con "Volver donde lo dejaste", tema día/noche y ES/EN, solicitud de acceso desde otra cuenta, aprobación como admin, pestaña Uso con horas.
