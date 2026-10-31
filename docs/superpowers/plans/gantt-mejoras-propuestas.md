# Gantt: mejoras propuestas (para decisión del dueño)

La v2 conserva el comportamiento original en todo lo de abajo hasta que decidas. Marca cada punto con
**Sí** (corregir), **No** (dejar igual) o pregunta.

## A. Fallas observadas en el original (inventario §10)

| # | Qué pasa hoy | Estado en v2 | Propuesta |
|---|---|---|---|
| A1 | Borrar todas las tareas y recargar trae de vuelta el demo. | **Ya resuelto** por tu decisión: sin demo, un Gantt vacío se queda vacío. | — |
| A2 | El orden elegido (Nombre A-Z, Por estado, Fin más próximo, "más lejano") **no cambia el orden de la tabla ni de los exportes**: la tabla siempre ordena las tareas raíz por inicio efectivo. El orden solo se nota en la búsqueda/filtro. | Igual que el original. | Que la tabla y los exportes respeten el orden elegido. |
| A3 | Las fechas se guardan con hora UTC: en un país con huso **positivo** (Europa, Asia) cada guardado puede mover las fechas un día. En México (UTC-6) no pasa. | Igual que el original. | Guardar la fecha local (sin UTC). |
| A4 | "Hoy" se calcula una sola vez al abrir la página. Si se deja abierta pasada la medianoche, la línea de hoy, Tarde/Vencida y los nombres de archivo siguen con el día anterior. En v2 la pestaña sigue viva al cambiar de herramienta, así que pasa más fácil. | Igual que el original. | Recalcular "hoy" al cambiar de día. |
| A5 | Idioma guardado desconocido rompe la página. | **No aplica**: el idioma es el del toolbox. | — |
| A6 | En inglés el botón "+ Agregar" sigue en español (`formBtnAdd` existe pero no se usa). | Igual que el original. | Mostrar "+ Add" en inglés. |
| A7 | El selector de idioma del menú arranca mal posicionado. | **No aplica**: menú propio eliminado. | — |
| A8 | Si una barra empieza antes de hoy, la línea roja de "hoy" no se dibuja en esa fila (la barra ocupa la celda). Se ve en la captura "Antes": la línea se corta en las filas cuya barra cruza hoy. | Igual que el original. | Dibujar la línea de hoy también encima de las barras. |
| A9 | En la vista compartida no se puede cambiar Días/Semanas. | **No aplica**: vista compartida eliminada. | — |
| A10 | Excel: el color de las barras de las tareas padre no se recalcula si cambias el estado en Excel, y "Tarde" no tiene regla. En la práctica el original **nunca** aplica el parche de formato condicional completo (depende de un detalle interno de ExcelJS que no existe), así que siempre sale la versión "de respaldo". | La v2 genera lo mismo que el original realmente descarga (versión de respaldo). | Añadir las reglas completas (barra con fechas efectivas y "Tarde"). |
| A11 | La contraseña del cliente no protegía nada. | **Ya resuelto**: se quitó; protege el login Firebase. | — |
| A12 | Si falla la carga de ExcelJS o la creación del archivo, no sale ningún aviso. | La v2 incluye ExcelJS en la app (sin CDN). Si algo falla muestra un aviso nuevo "No se pudo crear el Excel". | — (ya mejorado, avísame si no lo quieres) |
| A13 | Preferencias guardadas como `null` rompen el arranque. | **No aplica**: las preferencias se guardan con el resto del Gantt. | — |

## B. Otras rarezas encontradas al portar

| # | Qué pasa hoy | Estado en v2 | Propuesta |
|---|---|---|---|
| B1 | Las tareas plegadas (▶) se despliegan solas al recargar (no se guardan). | Igual que el original. | Recordar qué está plegado. |
| B2 | El PNG usa el ancho de columna de tareas que tengas en pantalla; si la achicas a 80 px los nombres quedan cortados en el PNG. | Igual que el original. | Usar un ancho fijo en el PNG. |
| B3 | Buscar, filtrar y ordenar se guardan y se aplican a todos tus Gantts (en v2 hay hasta 5). | Compartidos entre Gantts. | Que cada Gantt recuerde los suyos. |
| B4 | No hay forma de traer las tareas que ya tienes en el Gantt viejo (se guardan en el navegador, en otro sitio). | Sin importación. | Botón "Importar Excel" que lea el Excel exportado por el original. |
| B5 | Si se escriben a mano en el formulario fechas con año de 5+ dígitos o inválidas, el original muestra "Fechas inválidas"; igual en v2. | Igual. | — |
| B6 | Mover/estirar barras solo funciona con el mouse y en vista Días (no en táctil). | Igual que el original. | Habilitar táctil. |
