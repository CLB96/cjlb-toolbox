# VectoriZr: varias piezas, notches visuales y polilíneas (diseño)

## Intención
Acercar VectoriZr a lo que hace el competidor de pago (NShot Pro): digitalizar varias piezas de una sola foto, marcar notches y, más adelante, generar líneas paralelas (margen de costura). Es para uso interno del equipo.

## Entregas (en este orden, cada una con mockup aprobado antes de programar)
1. **Varias piezas** (modelo Pieza + detección múltiple + nombres y cantidad). Es la base de las otras.
2. **Notches visuales** en el editor.
3. **Unir segmentos en una polilínea** y, sobre eso, líneas paralelas.

## Entrega 1: varias piezas

### Qué ve el usuario
- Paso 3 (modo automático): casilla **"Varias piezas"**. Apagada = comportamiento de hoy (una pieza, el contorno mayor).
- Con la casilla encendida: la detección devuelve todos los contornos externos con área ≥ 0,5 % de la imagen. Cada uno se pinta de un color y aparece en una lista lateral con **nombre** (por defecto "Pieza 1", "Pieza 2"…) y **cantidad** (por defecto 1). Se puede quitar de la lista un contorno falso. Los umbrales siguen funcionando igual.
- Al confirmar, cada contorno pasa a ser una pieza y se entra al paso 4.
- Paso 4: se edita **una pieza a la vez** y se muestra siempre el nombre de la pieza en trabajo. Al elegir otra pieza en el selector, cambia todo (lienzo, puntos, panel). "+ New path" pasa a "Nueva pieza". El resto de la edición no cambia.

### Modelo de datos (decisión B, ajustada tras leer el código)
Hoy "+ Nuevo trazo" sirve para agujeros y contornos interiores de una misma pieza (lo dice el manual de la herramienta). Por eso una pieza **no** es un solo trazo: `Pieza { id, name, quantity, contourPoints: ContourPoint[], paths: ContourPoint[][] }`, donde `contourPoints` es el contorno editable y `paths` los trazos ya guardados de esa pieza (agujeros). Hay una pieza activa. Las sesiones ya guardadas se migran al cargar: su trazo activo y sus trazos guardados pasan a ser una sola pieza. `ContourPoint` no cambia. Los notches (`notches`) se añaden a la pieza en la entrega 2, no antes.

### Detección
`detect.ts` gana una variante que devuelve todos los contornos que superan el área mínima (hoy elige solo el mayor). Se ordenan de izquierda a derecha y de arriba abajo. Con la casilla apagada el resultado es idéntico al actual.

### Exportación (decisión del usuario)
El diálogo de exportar de hoy (tres botones: DXF, SVG, PDF) se conserva tal cual y es la opción **"Todo en un archivo"**: un solo archivo con todas las piezas, con las capas numeradas como ahora; el resultado no cambia.

Se agrega un botón **"Descarga individual"** en ese mismo diálogo. Abre la selección de piezas: casillas por pieza, "Seleccionar todo" y selección de varias. Luego se elige el formato (DXF, SVG o PDF) y se descarga **un archivo por pieza seleccionada, con el nombre de la pieza** (por ejemplo `Frente.dxf`). El contenido de cada archivo es el de hoy para un solo trazo.

Con varias piezas, el navegador puede pedir permiso para descargar varios archivos a la vez. Un ZIP queda como alternativa si molesta (decisión del constructor).

## Entrega 2: notches (solo visual) — mockup aprobado: `odd/mockups/vectorizr-notches.html`
- Los notches siguen siendo parte del trazo, como hoy. No hay entidad de notch en la exportación: DXF, SVG y PDF no cambian.
- `Notch { id, x, y, type: 'I' | 'V' | 'T', depth (mm, 5 por defecto), flipped }`, guardado en `Pieza.notches` (visual, se guarda con la sesión). No entra al historial de deshacer.
- Clic derecho sobre el contorno: menú "Añadir notch" (coloca el notch en el punto más cercano del contorno). Clic derecho sobre un notch: Eliminar, Voltear, I/V/T y Profundidad…; el notch seleccionado muestra tipo y profundidad en el panel lateral. Se mueve arrastrándolo.
- Dibujo: línea fantasma amarilla y punteada hacia el interior de la pieza (normal del contorno; "Voltear" la invierte). El notch siempre se dibuja pegado al punto más cercano del contorno, así que si se editan los puntos no se descuadra.
- Fuera de alcance: Rotar, Mover x,y y Añadir esquina de NShot.
- Nota: el mockup decía que el menú contextual "ya existe"; no era cierto, el editor no tenía ninguno. Se crea aquí.

## Entrega 3: cancelada (2026-11-26)
La polilínea y las líneas paralelas se cancelaron por decisión del dueño: cada contorno ya sale en el DXF como una sola polilínea cerrada y funciona bien en AutoCAD, así que no hace falta unir segmentos, y sin eso las paralelas tampoco.

## Objetivos / no objetivos
- Objetivos: varias piezas por foto, nombres y cantidades, sin romper sesiones guardadas ni la exportación actual.
- No objetivos: cámara en vivo, calibración con cámara, graduación, formatos de exportación nuevos, líneas de costura, taladros.
- Antiobjetivo: cambiar los resultados calculados o los textos originales sin aprobación.

## Restricciones
Las del proyecto: sin punto y coma, comillas simples, archivos de menos de 400 líneas, unas 100 pruebas esenciales por herramienta, textos de interfaz como el original, mockup antes de cualquier rediseño.

## Enfoques considerados (entrega 1)
- A. Lista paralela de nombres y cantidades junto a `paths`: lo más rápido, pero se descuadra y los notches no tendrían dónde colgar. Descartado.
- B. Pieza como objeto con migración: elegido por el usuario.

## Preguntas abiertas
1. La cantidad de cada pieza: ¿solo informativa en pantalla o también se escribe en algún lado (por ejemplo en el PDF)? Mientras tanto, solo en pantalla.
