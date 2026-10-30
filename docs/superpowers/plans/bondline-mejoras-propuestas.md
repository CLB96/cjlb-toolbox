# Bondline: mejoras propuestas (para decidir)

Qué es esto: al portar Bondline a la v2 se copió el comportamiento del original tal cual, salvo lo que acordamos cambiar (reglas R1–R10). Aquí está cada rareza del original (inventario §10) que se **conservó**, con qué pasa hoy y qué se ganaría si decides cambiarla. Después, lo que **se cambió por regla** y lo que es **nuevo**. El dueño aprobó las mejoras el 2026-10-30: las que no cambian valores calculados están implementadas; las que sí (8, 9, 10, 12 y 18) quedan pendientes de su decisión.

Estados: **conservado** (igual que el original), **cambiado en el port, aprobado por regla R#**, **nuevo** (no existía).

Decisiones del dueño ya tomadas en GapCheck que aplican aquí: la lectura permisiva de números (`parseFloat`: "12abc" se lee como 12) se conserva; la primera fila del Excel siempre es dato; la imagen del layout se ajusta a la pantalla y hay botón "Tamaño real".

---

## A. Rarezas del original que se conservaron

### 1. Lectura permisiva de números y primera fila (decisión del dueño)
- **Qué pasa hoy:** "12abc" se lee como 12 y "1,5" como 1 (`parseFloat`); un texto en una celda se ignora. La primera fila siempre es dato (el archivo es solo números, sin encabezados; una columna = un termopar).
- **Qué se ganaría:** nada que el dueño haya pedido; se conserva a propósito.
- **Estado:** conservado (decisión del dueño, igual que GapCheck).

### 2. Doble triángulo en "▲ ▲ Superior" del PNG (§10.14)
- **Qué pasa hoy:** el PNG muestra "▲ ▲ Superior" y "▼ ▼ Inferior" (el texto ya trae el triángulo y el dibujo agrega otro).
- **Qué se ganaría:** un solo triángulo.
- **Estado:** cambiado, aprobado por el dueño 2026-10-30. El PNG muestra "▲ Superior" / "▼ Inferior" con un solo triángulo.

### 3. Sub-etiquetas del PNG siempre en español (§10.14)
- **Qué pasa hoy:** "Termoreg.", "Nido", "Pérdida", "Temperatura", "Nido Sup/Inf" salen en español aunque la app esté en inglés.
- **Qué se ganaría:** PNG en el idioma activo.
- **Estado:** cambiado, aprobado por el dueño 2026-10-30. Sub-etiquetas del PNG en el idioma activo; en español, los mismos textos del original.

### 4. `exportTitle` sin uso (§10.14)
- **Qué pasa hoy:** existe un texto de título de exportación que nunca se usa; el título del PNG es otro.
- **Qué se ganaría:** nada visible; solo limpieza.
- **Estado:** conservado sin cambio: `exportTitle` sí se usa en la v2 como nombre accesible de la gráfica en pantalla; no hay nada que limpiar.

### 5. La línea de cooling del PNG no se ajusta al rango temporal (§10.14)
- **Qué pasa hoy:** con un rango temporal activo, la línea objetivo de cooling del PNG usa el segundo absoluto sin restar el inicio del rango.
- **Qué se ganaría:** línea en su sitio también con rango.
- **Estado:** cambiado, aprobado por el dueño 2026-10-30. La línea de cooling del PNG resta el inicio del rango, igual que en pantalla.

### 6. La leyenda del PNG puede salirse del ancho (§10.14)
- **Qué pasa hoy:** con muchos termopares la leyenda no hace salto de línea y puede cortarse en el borde.
- **Qué se ganaría:** leyenda siempre completa.
- **Estado:** cambiado, aprobado por el dueño 2026-10-30. La leyenda del PNG salta de línea al llegar al borde de la gráfica (mismo orden y espaciado).

### 7. Resolución del PNG (§10.14)
- **Qué pasa hoy:** el original dependía de `devicePixelRatio` de la pantalla para la gráfica temporal.
- **Qué se ganaría:** PNG idéntico en cualquier monitor.
- **Estado:** cambiado en el port con el diseño Nebulosa (R9); aquí solo se anota porque el tamaño final puede diferir del original.

### 8. Duración y activación del PNG distintas de la pantalla (§10.11)
- **Qué pasa hoy:** con rango temporal activo, el PNG muestra la duración del rango (p. ej. 60s con rango 20–80) y el segundo de activación **absoluto** (t=53s en el Excel real); en pantalla el resultado es relativo al inicio del rango (puede salir negativo).
- **Qué se ganaría:** un solo criterio (siempre relativo o siempre absoluto).
- **Estado:** conservado — **pendiente de decisión del dueño**: cambiarlo altera valores mostrados (duración/activación del PNG, t=53s verificado) y hay que elegir el criterio (relativo o absoluto).

### 9. La validación de la ventana de activación (§10.12)
- **Qué pasa hoy:** se validan 30 muestras (desde el inicio hasta inicio+29), la caja dibuja hasta inicio+30 y se exige que la ventana termine dentro de los datos; una ventana que se pasa del final cuenta como NOK aunque las muestras existentes estén en rango.
- **Qué se ganaría:** criterio más claro para ventanas al final del ciclo.
- **Estado:** conservado — **pendiente de decisión del dueño**: cambiar el criterio altera el resultado OK/NOK calculado.

### 10. Activación, cooling, mínimo y máximo ignoran visibilidad y rango (§10.13)
- **Qué pasa hoy:** ocultar un termopar o recortar el rango no cambia el mínimo, el máximo, la activación ni el cooling (se calculan con todos los termopares y todos los datos).
- **Qué se ganaría:** resultados que siguen lo que se está viendo.
- **Estado:** conservado — **pendiente de decisión del dueño**: cambiarlo altera mínimo, máximo, activación y cooling calculados.

### 11. Eje Y fijo en 80 (§10.13)
- **Qué pasa hoy:** `yMax` es 80; datos o adhesivos con máximo mayor quedan cortados.
- **Qué se ganaría:** eje que se adapta a los datos.
- **Estado:** cambiado, aprobado por el dueño 2026-10-30. El eje Y sigue en 80 salvo que los datos visibles o el máximo del adhesivo lo superen (se redondea hacia arriba).

### 12. Tiempo de cooling con decimales sin redondear (§10.19)
- **Qué pasa hoy:** con un inicio no entero, el tiempo transcurrido muestra la diferencia tal cual (decimales largos). Un inicio negativo pasa el chequeo de cooling aunque no tenga sentido.
- **Qué se ganaría:** valores enteros y entradas validadas.
- **Estado:** conservado — **pendiente de decisión del dueño**: redondear o rechazar inicios negativos cambia el valor mostrado y el resultado del chequeo de cooling.

### 13. El sustrato no afecta el cálculo (§10.21)
- **Qué pasa hoy:** PC-ABS, PP, etc. solo cambian el texto "Necesita Flama" (PP = SÍ); la activación no cambia.
- **Qué se ganaría:** cálculo por sustrato si algún día hace falta.
- **Estado:** conservado.

### 14. Los marcadores vuelven a su sitio por defecto (§10.10)
- **Qué pasa hoy:** al cargar una imagen, cambiar de hoja sin configuración guardada o ocultar/mostrar un termopar, los marcadores se reacomodan en la distribución por defecto y las posiciones arrastradas se pierden.
- **Qué se ganaría:** conservar las posiciones si el número de termopares no cambia.
- **Estado:** cambiado, aprobado por el dueño 2026-10-30. Cambiar la imagen, ocultar/mostrar un termopar o visitar otra hoja con el mismo número de termopares conserva las posiciones arrastradas; una TC que reaparece va a su sitio por defecto.

### 15. Fecha de prueba sin sanear en el nombre del archivo (§10.16)
- **Qué pasa hoy:** el nombre es `Bondline - {fecha} - {hoja}.png`; el nombre de la hoja sí se limpia de `/ \ : * ? " < > |`, pero la fecha se escribe tal cual (una fecha con "/" como 30/10/2026 hace que el navegador cambie esos caracteres al guardar). Sin fecha: `SinFecha`.
- **Qué se ganaría:** nombres de archivo siempre válidos y uniformes (p. ej. 2026-10-30).
- **Estado:** cambiado, aprobado por el dueño 2026-10-30. La fecha se limpia de `/ \ : * ? " < > |` igual que la hoja (30/10/2026 → 30-10-2026); se escribe como la tecleó el usuario, sin reformatear.

### 16. Volver a elegir el mismo archivo no lo recarga (§10.17)
- **Qué pasa hoy:** elegir el mismo archivo dos veces seguidas no hace nada (por ejemplo, tras corregirlo y guardarlo).
- **Qué se ganaría:** recargar el archivo corregido sin elegir otro antes.
- **Estado:** cambiado, aprobado por el dueño 2026-10-30. Elegir el mismo archivo otra vez lo recarga.

### 17. Rango temporal con decimales (§10.15)
- **Qué pasa hoy:** el rango se lee como entero (se truncan decimales).
- **Qué se ganaría:** aviso si se escribe un decimal.
- **Estado:** cambiado, aprobado por el dueño 2026-10-30. El rango se sigue truncando a entero (mismo valor), pero se avisa: "El rango usa segundos enteros: se ignoraron los decimales".

### 18. El arrastre de un suceso muestra el segundo absoluto
- **Qué pasa hoy:** al arrastrar una línea de suceso, el tooltip muestra el segundo absoluto del ciclo (no relativo al rango), coherente con R3.
- **Qué se ganaría:** posibilidad de mostrar el tiempo relativo si hay rango activo.
- **Estado:** conservado — **pendiente de decisión del dueño**: depende del criterio del ítem 8 (tiempo relativo o absoluto).

---

## B. Lo que se cambió en el port (aprobado por regla)

### 19. Valores por defecto: una preferencia por usuario (bug 18, R1)
- **Antes:** vivían en el `localStorage` del navegador (compartidos por todos) y un JSON incompleto hacía caer la herramienta.
- **Ahora:** se guardan por usuario, sobreviven a "Empezar de cero", a cargar otro archivo y a restaurar versiones del historial. Una preferencia ilegible o incompleta vuelve a los valores de fábrica. Mismas reglas de guardado (`parseFloat(x) || valor de fábrica`, sin chequeo mín < máx). No se migran los valores del navegador viejo.
- **Estado:** cambiado en el port, aprobado por regla R1.

### 20. La configuración se guarda y se recupera por hoja (bugs 1–6, R2)
- **Antes:** al volver a una hoja casi nada se restauraba (error interno), Prensa Cerrada nunca se guardaba, la imagen del layout impedía guardar, el rango temporal se arrastraba de otra hoja y un archivo nuevo con las mismas hojas heredaba configuraciones viejas.
- **Ahora:** cada hoja guarda fecha, adhesivo, sustrato, visibilidad, rango, sucesos (con Prensa Cerrada), cooling, parámetros, leisters, layout y marcadores. Primera visita: hereda la configuración activa con rango reiniciado. Cargar otro archivo limpia todo.
- **Estado:** cambiado en el port, aprobado por regla R2.

### 21. Arrastrar sucesos respeta el rango temporal (bugs 7 y 8, R3)
- **Antes:** con rango activo el arrastre caía en el sitio equivocado; cada dibujo agregaba listeners y un tooltip nuevo.
- **Ahora:** el arrastre acierta con rango y escribe el segundo absoluto; un solo juego de listeners y un tooltip.
- **Estado:** cambiado en el port, aprobado por regla R3.

### 22. Layout: posiciones relativas a la imagen (bug 10, R4)
- **Antes:** el % era relativo al contenedor en pantalla y el PNG lo reinterpretaba.
- **Ahora:** % relativo a la imagen, centro del marcador, igual en pantalla y PNG.
- **Estado:** cambiado en el port, aprobado por regla R4.

### 23. Sin login ni menú propios (bugs 20 y 22, R5)
- **Antes:** contraseña fija en el navegador y menú con idioma/tema propios.
- **Ahora:** los aporta el toolbox; "Valores Default" y "Descargar gráfica PNG" son botones de la cabecera con los mismos textos.
- **Estado:** cambiado en el port, aprobado por regla R5.

### 24. Fecha de prueba siempre visible (bug 16, R6)
- **Antes:** solo había fecha con archivos de varias hojas (si no, el nombre salía con `SinFecha`).
- **Ahora:** siempre se puede escribir la fecha.
- **Estado:** cambiado en el port, aprobado por regla R6.

### 25. Restaurar valores de fábrica refresca al momento (bug 9, R8)
- **Antes:** la info del adhesivo y la gráfica quedaban desactualizadas hasta otro render.
- **Ahora:** se refrescan de inmediato (siguen guardándose al instante, con confirmación).
- **Estado:** cambiado en el port, aprobado por regla R8.

### 26. Composición del PNG (diseño Nebulosa) (R9)
- **Antes:** diseño del export original.
- **Ahora:** fondo oscuro, logo, título, tarjetas, panel de parámetros; gráfica siempre en tema oscuro; contenido, textos y nombre de archivo idénticos al original. La gráfica temporal se destruye siempre tras dibujar.
- **Estado:** cambiado en el port, aprobado por regla R9 (mockup aprobado por el dueño).

### 27. Errores de archivo como aviso (bug 17, R10)
- **Antes:** un `alert` (solo en español) y el nombre del archivo aparecía como cargado aunque fallara.
- **Ahora:** aviso con el texto original en español y traducción al inglés; si falla, el estado previo queda intacto y no se marca como cargado.
- **Estado:** cambiado en el port, aprobado por regla R10.

### 28. Tema y paleta (R7)
- **Antes:** colores fijos del original.
- **Ahora:** texto, rejilla y tooltip de la gráfica siguen el tema día/noche; colores de datos y anotaciones, los del original.
- **Estado:** cambiado en el port, aprobado por regla R7.

---

## C. Comportamientos y textos nuevos

| # | Qué hay ahora | Qué se ganó | Estado |
|---|---|---|---|
| 29 | Cabecera con nombre del archivo, chip "{n} s × {m} termopares" (`fileDims`), **Cambiar archivo**, **Historial** e indicador de guardado. Los análisis se guardan solos y se pueden restaurar. | Reabrir donde se dejó; volver a versiones previas. | Nuevo (textos nuevos) |
| 30 | Paneles Parámetros, Sucesos y Layout plegables, plegados por defecto; el estado se guarda. | Pantalla más limpia (mockup). | Nuevo |
| 31 | Avisos de error en inglés y español: archivo ilegible, hoja sin datos o sin temperatura, rango temporal inválido, PNG fallido, PNG sin datos. | Se sabe qué pasó, en el idioma activo. | Nuevo (traducciones EN) |
| 32 | **Tamaño real** en el Layout: la imagen se ajusta a la pantalla por defecto y el botón la muestra a su tamaño natural con scroll. La preferencia se guarda. Pedido por el dueño. | Imágenes grandes completas; detalle cuando se necesita. | Nuevo |
| 33 | Botón **Cambiar imagen** en el Layout; el original no permitía reemplazarla. | No hay que recargar la herramienta. | Nuevo (texto nuevo) |
| 34 | Imágenes de Layout de más de 20 MB se usan en pantalla pero no se guardan en el historial; aviso único: "Los archivos de más de 20 MB no se guardan en el historial.". | No llenar el almacenamiento del navegador. | Nuevo |
| 35 | Si la imagen del Layout no se puede decodificar, aviso y vuelta a la zona de carga (antes, cuadro roto). | Se puede elegir otra imagen. | Nuevo (texto nuevo) |
| 36 | Los marcadores se mueven con las flechas del teclado (1 %; con Shift, 5 %). | Accesibilidad y ajuste fino. | Nuevo |
| 37 | Cambiar el rango, los sucesos, los parámetros o los valores por defecto refresca resultados y gráfica de inmediato. | Se ve el efecto al momento. | Nuevo (R8) |
| 38 | Si la imagen del Layout no carga al exportar, el PNG se genera igual sin su caja y ahora avisa: "Se exportó sin la imagen del layout". | No se pierde el export y se sabe por qué falta. | Cambiado, aprobado por el dueño 2026-10-30 |
