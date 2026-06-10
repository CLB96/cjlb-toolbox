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
└── capaflow/index.html ← CapaFlow
```

Cada herramienta queda disponible como ruta del mismo dominio: `/gantt/`, `/gapcheck/`,
`/bondline/`, `/capaflow/`. VectoriZr es una app Vite/React aparte (carpeta `Digitalizacion`)
y por ahora se enlaza a su URL de Netlify.

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

Reemplaza el `index.html` de su carpeta (p. ej. `gantt/index.html`) con la nueva
versión, commit y push. Si quieres anunciarlo, cambia su `badge` a `"updated"` en
`tools.json`.

## Pendiente / futuro

- **VectoriZr**: migrar la app Vite (`Digitalizacion`) a su propio proyecto Vercel o
  integrarla a este dominio (p. ej. build estático servido en `/vectorizr/`), y
  actualizar su URL en `tools.json` a ruta relativa.
- Dominio propio: se configura en Vercel → Settings → Domains y aplica a todas las
  herramientas a la vez.
