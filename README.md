# CJLB Engineering Toolbox — Monorepo (Opción B)

Suite de herramientas de ingeniería de procesos en un solo repositorio y un solo dominio.
Esta es la **Opción B**: versión consolidada en paralelo, la carpeta `Landing Page` original
y los sitios Netlify actuales siguen intactos.

## Estructura

```
cjlb-toolbox/
├── index.html          ← Landing (hub de herramientas)
├── tools.json          ← Datos de las tarjetas (única fuente de verdad)
├── logo1.png           ← Logo tema claro
├── logo2.png           ← Logo tema oscuro
├── gantt/index.html    ← Gantt Tracker
├── gapcheck/index.html ← GapCheck Analysis
├── bondline/index.html ← Bondline Thermal
├── capaflow/index.html ← CapaFlow
└── vectorizr/          ← VectoriZr (build de la app Vite en `Digitalizacion/`)
```

Cada herramienta queda disponible como ruta del mismo dominio: `/gantt/`, `/gapcheck/`,
`/bondline/`, `/capaflow/`, `/vectorizr/`.

## Diferencias vs. la landing original

- **Las tarjetas viven en `tools.json`**, no embebidas en el HTML ni en localStorage.
  Para agregar/editar/pausar una tarjeta: edita `tools.json` y haz commit. Vercel
  redespliega solo.
- **Se eliminó el panel admin del navegador** (contraseña hardcodeada visible en el
  código fuente) y el **publicador con token de GitHub** (guardaba un PAT en texto
  plano en localStorage). Con Git + Vercel ya no son necesarios.
- URLs de herramientas **relativas** (`/gantt/`) en vez de subdominios Netlify
  hardcodeados.

## Editar las tarjetas

Campos de cada entrada en `tools.json`:

| Campo | Valores |
|-------|---------|
| `status` | `"active"` (clickeable) / `"hold"` (deshabilitada, muestra holdLabel) |
| `badge` | `null` / `"new"` / `"updated"` |
| `url` | Ruta relativa (`/gantt/`) o URL absoluta (`https://...`) |
| `holdLabelEs/En` | Texto mostrado cuando `status` es `"hold"` |

Incrementa `version` cuando hagas cambios (referencia para depurar caché).

## Agregar una herramienta nueva

**Caso A — HTML autocontenido** (como gantt, gapcheck, bondline, capaflow):

1. Crea la carpeta `mi-herramienta/` en la raíz del repo y guarda el HTML
   como `mi-herramienta/index.html`.
2. Si el HTML carga `logo1.png`/`logo2.png`, copia ambos dentro de su carpeta.
3. Agrega su entrada en `tools.json` con `"url": "/mi-herramienta/"`,
   `"status": "active"` y `"badge": "new"`. Incrementa `version`.
4. Prueba en local (sección siguiente) y luego commit + push. La tarjeta
   aparece sola en la landing — no hay que tocar `index.html`.

**Caso B — app con build** (Vite/React/etc., como VectoriZr):

1. Desarrolla la app en su propia carpeta fuera de este repo.
2. Evita rutas absolutas (`/archivo.png`) en el código; usa
   `import.meta.env.BASE_URL` o rutas relativas.
3. Compila con la subruta como base y copia el resultado aquí:
   ```powershell
   npx vite build --base=/mi-herramienta/ --outDir dist-mi-herramienta
   Copy-Item dist-mi-herramienta\* ..\cjlb-toolbox\mi-herramienta\ -Recurse -Force
   ```
4. Igual que el caso A: entrada en `tools.json`, probar, commit + push.

**Caso C — anunciar sin publicar** ("Próximamente"): agrega la entrada en
`tools.json` con `"status": "hold"`, `"url": ""` y el texto que quieras en
`holdLabelEs`/`holdLabelEn`. La tarjeta sale deshabilitada con esa etiqueta.

## Probar en local

El landing carga `tools.json` con `fetch()`, así que necesita un servidor HTTP
(no funciona abriendo el archivo con doble click):

```powershell
# Con Python
python -m http.server 8080
# o con Node
npx serve .
```

Luego abre <http://localhost:8080>.

## Desplegar (GitHub + Vercel)

1. Crear el repositorio en GitHub:
   ```powershell
   gh repo create cjlb-toolbox --public --source . --push
   ```
2. En [vercel.com/new](https://vercel.com/new) importar el repo `cjlb-toolbox`.
   - Framework Preset: **Other** (sitio estático, sin build).
   - Sin variables de entorno ni comandos de build.
3. Cada `git push` a `main` redespliega automáticamente.

## Actualizar una herramienta

**Herramientas HTML** (gantt, gapcheck, bondline, capaflow): reemplaza el
`index.html` de su carpeta con la nueva versión, commit y push. Si quieres
anunciarlo, cambia su `badge` a `"updated"` en `tools.json`.

> **Logos:** gantt, gapcheck y bondline cargan `logo1.png`/`logo2.png` desde su
> propia carpeta (igual que en sus deploys Netlify originales). Esas copias ya
> están incluidas — no las borres al actualizar una herramienta. CapaFlow usa
> logo subido por el usuario (localStorage) y VectoriZr trae el suyo en su build.

**VectoriZr** (app Vite/React, código fuente en `Desktop\Proyectos IA\Digitalizacion`):

```powershell
cd "C:\Users\PC AERO R5 PRO\Desktop\Proyectos IA\Digitalizacion"
npm run build                                          # valida tsc + tests del deploy Netlify
npx vite build --base=/vectorizr/ --outDir dist-vectorizr
Copy-Item dist-vectorizr\* ..\cjlb-toolbox\vectorizr\ -Recurse -Force
```

Luego commit y push en `cjlb-toolbox`. El código fuente usa `import.meta.env.BASE_URL`
para logo y OpenCV, así que el mismo código sirve para Netlify (base `/`) y para
este monorepo (base `/vectorizr/`).

## Pendiente / futuro

- Dominio propio: se configura en Vercel → Settings → Domains y aplica a todas las
  herramientas a la vez.
