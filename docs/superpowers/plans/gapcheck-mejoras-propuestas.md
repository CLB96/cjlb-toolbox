# GapCheck: mejoras propuestas (para decidir)

Qué es esto: al portar GapCheck a la v2 se copió el comportamiento del original tal cual, salvo lo que acordamos cambiar (reglas R1–R6 y P2-D). Aquí está cada rareza del original (inventario §12) que se **conservó**, con qué pasa hoy y qué se ganaría si decides cambiarla. Al final, lo que **se cambió o se añadió** en el port. Nada de la primera parte está implementado: esperan tu decisión.

Estados: **conservado** (igual que el original), **cambiado en el port, aprobado por regla R#**, **nuevo** (no existía).

---

## A. Rarezas del original que se conservaron

### 1. Mínimo y máximo sin formato (§12.4)
- **Qué pasa hoy:** el promedio sale con 2 decimales (2.25), pero el mínimo y el máximo salen tal cual vienen del Excel (1.7, 2.65). Con ciertos números pueden aparecer decimales largos (por ejemplo 2.6500000000000004).
- **Qué se ganaría:** tarjetas con presentación uniforme y sin decimales raros.
- **Estado:** conservado (regla del dueño: no cambiar la presentación de valores).

### 2. La tarjeta "Cumplen Objetivo" muestra "k / n" (§12.4)
- **Qué pasa hoy:** muestra, por ejemplo, "200 / 200" (cuántos cumplen de cuántos hay), incluso cuando el objetivo inicial es 0%.
- **Qué se ganaría:** un porcentaje o una barra se leería más rápido que dos números.
- **Estado:** conservado.

### 3. La numeración de iteraciones se corre cuando hay celdas vacías (§12.5)
- **Qué pasa hoy:** si un punto tiene una celda vacía en medio, los valores siguientes pasan a la iteración anterior (el valor de la iteración 3 aparece como iteración 2).
- **Qué se ganaría:** cada medición se queda en su iteración real; la gráfica y la tabla mostrarían un hueco en lugar de mover datos.
- **Estado:** conservado.

### 4. Lectura permisiva de números (`parseFloat`) (§12.6)
- **Qué pasa hoy:** "12abc" se lee como 12 y "1,5" (coma decimal) se lee como 1. Una primera fila de solo números se trata como dato, no como encabezado.
- **Qué se ganaría:** no aceptar texto mezclado en silencio y entender la coma decimal; o al menos avisar de las celdas que se descartaron.
- **Estado:** conservado.

### 5. Volver a elegir el mismo archivo no lo recarga (§12.7)
- **Qué pasa hoy:** si eliges el mismo archivo dos veces seguidas, la segunda vez no pasa nada (por ejemplo, tras corregir el Excel y guardarlo).
- **Qué se ganaría:** poder recargar el archivo corregido sin elegir otro antes.
- **Estado:** conservado.

### 6. La línea y el eje de objetivo solo cambian al pulsar el botón (§12.8)
- **Qué pasa hoy:** al escribir en los campos de objetivo solo cambian el resultado y la fórmula de esa tarjeta. La gráfica (línea objetivo, eje derecho), las tarjetas y la tabla se actualizan al pulsar "Actualizar Comparación".
- **Qué se ganaría:** ver el efecto al escribir, sin pulsar nada; o un aviso de "hay cambios sin aplicar".
- **Estado:** conservado, con tres consecuencias de la regla R1 que **sí cambian** respecto al original (puntos 22, 23 y 24 de la sección B, marcados "cambiado (R1)").

### 7. Márgenes de compresión y espesor sin límites (§12.16)
- **Qué pasa hoy:** se pueden escribir compresiones negativas o mayores a 100 % y espesores negativos; el objetivo resultante no tiene sentido y la tolerancia (10 % del objetivo) se comporta raro con objetivos negativos.
- **Qué se ganaría:** valores siempre válidos y un mensaje claro si se escribe algo fuera de rango.
- **Estado:** conservado.

### 8. Los marcadores del Layout ignoran los filtros de puntos (§12.12)
- **Qué pasa hoy:** si ocultas un punto en la gráfica, su marcador sigue visible en el diagrama.
- **Qué se ganaría:** diagrama y gráfica coherentes con lo que se está mirando.
- **Estado:** conservado. Ojo: esto es solo en **pantalla**. El PNG exportado sí oculta los marcadores de los puntos filtrados, en el original (§12.13) y en la v2 (igual).

### 9. Los marcadores vuelven a su sitio al cargar otro Excel (§12.12)
- **Qué pasa hoy:** al cargar un archivo nuevo con una imagen ya puesta, las posiciones que arrastraste se pierden y vuelven a la distribución por defecto.
- **Qué se ganaría:** conservar las posiciones cuando el número de puntos no cambia.
- **Estado:** conservado.

### 10. Colores de marcadores distintos en pantalla y en el PNG (§12.12)
- **Qué pasa hoy:** el diagrama en pantalla usa una paleta (`POINT_COLORS`) y el PNG exportado otra (`PALETTE_SOLID`); el mismo punto cambia de color.
- **Qué se ganaría:** el PNG se vería igual que lo que se ve en pantalla.
- **Estado:** conservado (regla R4 deja los colores sin cambios a propósito).

### 11. Nombre del archivo exportado con fecha en UTC (§12.13)
- **Qué pasa hoy:** `Gapcheck-Export-AAAA-MM-DD.png` usa la fecha UTC; por la tarde-noche en América puede salir el día siguiente.
- **Qué se ganaría:** la fecha local de quien exporta.
- **Estado:** conservado (regla R5: nombre idéntico).

### 12. Etiqueta "Measured Pts" en el PNG en inglés (§12.13)
- **Qué pasa hoy:** el PNG en inglés dice "Measured Pts" mientras la pantalla dice "Measurement Points".
- **Qué se ganaría:** el mismo texto en pantalla y en el PNG.
- **Estado:** conservado.

### 13. Cosas del original que no se portaron
- Código muerto del original (`toggleTheme` duplicado, `rawData`, textos sin usar; §12.1) y el login con contraseña fija `CJLB` en el navegador (§12.14): la v2 usa el login y el tema de la app (Plan 1).
- **Estado:** no aplica al port.

---

## B. Lo que se cambió en el port (aprobado por regla)

### 14. Los chips de filtro reflejan el filtro real (§12.3)
- **Antes:** al cambiar tema, idioma o pulsar el botón, todos los chips se veían activos aunque el filtro siguiera aplicado.
- **Ahora:** los chips siempre muestran lo que está realmente filtrado.
- **Estado:** cambiado en el port, aprobado por regla R2.

### 15. La leyenda sincroniza con los chips de iteración (§12.10)
- **Antes:** pulsar la leyenda ocultaba la serie sin que el chip lo supiera.
- **Ahora:** leyenda y chips van juntos.
- **Estado:** cambiado en el port, aprobado por regla R3.

### 16. Tabla con scroll y nombres de punto como texto (§12.11)
- **Antes:** la tabla se cortaba a 1500 px de alto sin scroll; el nombre de un punto con HTML se interpretaba como HTML.
- **Ahora:** scroll dentro de la tabla; los nombres se muestran como texto.
- **Estado:** cambiado en el port, aprobado por regla R6.

### 17. Layout: posiciones relativas a la imagen y arrastre sin salto (§12.12)
- **Antes:** el marcador saltaba medio tamaño al agarrarlo; en pantalla las posiciones eran relativas al contenedor y el export las reinterpretaba.
- **Ahora:** el marcador no salta; el % es relativo a la imagen, igual en pantalla y en el PNG.
- **Estado:** cambiado en el port, aprobado por regla R4.

### 18. Composición del PNG (diseño Nebulosa) (§12.13)
- **Antes:** diseño del export original.
- **Ahora:** fondo oscuro, logo, título, tarjetas y bloque GAPCHECK OBJETIVO; la gráfica del PNG siempre en tema oscuro y a doble resolución (ya no depende de la pantalla). Mismos valores y mismo nombre de archivo.
- **Estado:** cambiado en el port, aprobado por regla R5.

### 19. Tarjetas de resumen sin unidad "mm" (decisión P2-D)
- **Qué pasa:** el mockup mostraba "mm" en las tarjetas; el original no. Se dejó **sin** unidad para no cambiar la presentación de los valores (solo la tarjeta de objetivo y el resultado llevan "mm", como en el original).
- **Qué se ganaría:** agregar la unidad es trivial si la quieres.
- **Estado:** conservado (decisión P2-D).

### 20. Borde de la caja del Layout en el PNG (§12.13)
- **Qué pasa hoy (original):** la caja del layout en el PNG se dibujaba con el borde que hubiera quedado del dibujo anterior (estado sobrante del canvas), así que el estilo era accidental.
- **Qué hace la v2:** dibuja un borde propio y explícito (cristal translúcido de 1 px, igual que las tarjetas).
- **Estado:** cambiado en el port, aprobado por regla R5 (composición Nebulosa).

### 21. Eje derecho de compresión (§12.9)
- **Antes:** en el original el eje derecho podía quedar desalineado en la primera construcción.
- **Ahora:** en la v2 se calcula desde la escala de la misma gráfica. Verificado en navegador el 2026-10-30 con el Excel real: al abrir, tras cargar, tras pasar a Soft + Actualizar Comparación y tras recargar la página, los ticks del eje derecho quedan alineados con los del izquierdo (Hard: 50 %…85 %, Soft: 50 %…120 %).
- **Estado:** cambiado en el port (verificado).

### 22. Los chips de filtro y la tabla usan el objetivo aplicado
- **Antes:** en el original, tras escribir en los campos sin pulsar el botón, pulsar un chip de filtro recalculaba tarjetas, tabla y estilo de puntos con el objetivo **escrito**.
- **Ahora:** v2 usa siempre el objetivo **aplicado** (el del último "Actualizar Comparación").
- **Estado:** cambiado (R1).

### 23. El eje derecho usa los datos aplicados
- **Antes:** el eje derecho de compresión leía los campos escritos en el momento de dibujar.
- **Ahora:** v2 usa los datos aplicados, coherentes con la línea de objetivo.
- **Estado:** cambiado (R1).

### 24. Cambiar tema o idioma no aplica lo escrito
- **Antes:** en el original, cambiar de tema o de idioma aplicaba los campos pendientes de objetivo.
- **Ahora:** v2 no lo hace; solo el botón "Actualizar Comparación" aplica.
- **Estado:** cambiado (R1).

---

## C. Comportamientos nuevos añadidos en el port

| # | Qué hay ahora | Qué se ganó | Estado |
|---|---|---|---|
| 25 | Si el archivo no se puede leer, sale un aviso "No se pudo leer el archivo" / "The file could not be read". El original no avisaba y mostraba el nombre como si hubiera cargado (§12.7). | Se sabe que algo falló. | Nuevo (texto nuevo) |
| 26 | Si el archivo no tiene datos numéricos, sale un aviso "El archivo no contiene datos numéricos" / "The file contains no numeric data". El original no hacía nada. | No parece que la app se colgó. | Nuevo (texto nuevo) |
| 27 | Botón **Cambiar imagen** en el Layout; el original no permitía reemplazar la imagen (§12.12). | No hay que recargar la herramienta. | Nuevo (texto nuevo) |
| 28 | Los marcadores se pueden mover con las flechas del teclado (1 %; con Shift, 5 %). | Accesibilidad y ajuste fino. | Nuevo |
| 29 | Se muestra el nombre de la imagen del Layout. | Saber qué imagen está puesta. | Nuevo |
| 30 | Se quitó el alto mínimo y el ajuste "object-fit" de la imagen: la imagen se ve a su proporción real (los % de los marcadores dependen de eso). | Marcadores exactos sobre la imagen. | Nuevo |
| 31 | El PNG usa el objetivo y el covering **aplicados** (los de las tarjetas y la gráfica); el original usaba los que estaban escritos en ese momento aunque no se hubiera pulsado el botón. | PNG coherente con lo que se ve en pantalla. Solo difiere si se escribió sin pulsar "Actualizar". | Cambiado en el port (consecuencia de R1) |
| 32 | Si el PNG falla, el aviso también existe en inglés ("Export failed. Check that the uploaded images are not remote (CORS)."); el original solo lo tenía en español. | Mensaje en el idioma activo. | Nuevo (texto nuevo) |
| 33 | Si la imagen del Layout no carga al exportar, el PNG se genera igual sin la caja del Layout. Es **silencioso**: no sale ningún aviso (igual que el original). Mejora propuesta: un toast tipo "No se pudo cargar la imagen del layout; se exportó sin ella". | No se pierde el export por una imagen y se sabe por qué falta. | Conservado (el aviso es solo propuesta) |
| 34 | Cabecera con nombre del archivo, "{n} iteraciones × {m} puntos", **Cambiar archivo**, **Historial** e indicador de guardado (textos `fileDims`, `changeFile`, `history`). Los análisis se guardan solos y se pueden restaurar. | Reabrir donde se dejó; volver a versiones previas. | Nuevo (textos nuevos) |
| 35 | Imágenes de Layout de más de 20 MB se usan en pantalla pero no se guardan en el historial. El aviso ("Los archivos de más de 20 MB no se guardan en el historial.") sale **una vez por herramienta abierta** mientras el estado siga con ese archivo omitido; si más adelante un guardado ya no omite nada y luego vuelve a ocurrir, avisa otra vez (antes avisaba en cada autoguardado). Al volver a subir la imagen tras restaurar, se conservan las posiciones de marcadores guardadas. | No llenar el almacenamiento del navegador sin repetir el aviso. | Nuevo |
| 36 | Títulos de ejes de la gráfica ("Medición de Espesor (mm)", "Compresión Real (%)") tomados literalmente del original, con traducción EN. Colores de texto, rejilla y tooltip salen del tema día/noche; en tema claro el borde del tooltip es más oscuro para verse. | Gráfica legible en ambos temas. | Nuevo (la paleta de datos no cambió) |
| 37 | **Archivos muy grandes:** mínimo, máximo y lectura de columnas/iteraciones ya no usan `Math.min(...lista)` / `Math.max(...lista)`, que fallaba con cientos de miles de valores (y la herramienta se caía). Mismos valores y mismos textos que el original. | Ningún archivo grande rompe la herramienta. | Cambiado: ya no se cae con archivos muy grandes, mismos valores |
| 38 | Si la imagen del Layout no se puede decodificar, sale el aviso "No se pudo mostrar la imagen" / "The image could not be displayed" y se vuelve a la zona de carga (antes quedaba un cuadro roto). | Se sabe qué pasó y se puede elegir otra imagen. | Nuevo (texto nuevo) |
| 39 | Accesibilidad: los marcadores se describen con las instrucciones del Layout, la tabla solo declara `aria-controls` cuando está abierta y los emojis de los títulos se ocultan a lectores de pantalla; soltar el puntero fuera de la ventana cierra el arrastre. | Mejor uso con teclado y lector de pantalla; sin arrastres colgados. | Nuevo |
