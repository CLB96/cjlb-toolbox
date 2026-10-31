# CapaFlow: mejoras propuestas (no aplicadas)

Origen: inventario §10 (`capaflow-inventory/`, hallazgos 1-29) y revisión del código al portar la lógica. **Nada de esto está corregido**: la v2 reproduce el comportamiento original byte a byte y los tests diferenciales lo fijan. El dueño decide cuáles aplicar; cada una se haría como cambio aparte con su test.

> **Actualización 2026-10-30 (petición del dueño):** las cuatro exportaciones PNG (Resumen Ejecutivo, Guía de Lectura, Resumen comparativo y Plano) ya usan el diseño Nebulosa del toolbox en lugar de la apariencia del original; el contenido (datos, textos, secciones, nombres de archivo) no cambia. De paso, los marcadores del Plano PNG ya salen con su color real (antes `var(--...)` se leía como negro). La nota C6 (grano aleatorio) queda resuelta: el fondo Nebulosa no usa ruido.

Referencias `Lxxxx` = líneas de `capaflow/index.html`. "Valores" = efecto sobre los números mostrados.

## A. Afectan a los números (lógica de cálculo, fase 1)

| # | Qué pasa hoy | Corrección propuesta | Impacto en valores |
|---|---|---|---|
| A1 | PPM a dos lados usa `3·Cpk` en ambas colas (L3853-3860); fuera de centro cuenta dos veces la cola cercana. | Usar `Φ(-3·Cpu)` y `Φ(-3·Cpl)` por separado (cola superior e inferior reales). | PPM esperado baja cuando el proceso está descentrado; igual si está centrado. Con los datos de ejemplo (PPM 1 y 2) el cambio es de unidades, no se verificó el valor exacto. |
| A2 | Sin validación `USL > LSL` (L3828-3847); acepta límites iguales o invertidos. | Mensaje de error y no calcular. | Hoy da Cp negativo/infinito; con la mejora no hay resultado. |
| A3 | Subgrupo no acotado a 1-25: `n` mayor que los datos da `σ within = NaN` (sin grupos completos); `n` negativo recorre el bucle sin terminar (L3831, L3756-3762). | Limitar `n` a 1-25 y a `n <= datos`; avisar. | Solo casos hoy rotos (NaN o cuelgue). |
| A4 | Datos constantes o `Infinity` sin guarda de varianza: σ = 0, p de Anderson-Darling = NaN, divisiones por cero (L3736, L3781-3794). | Rechazar `Infinity` y avisar "sin variación". | Hoy: índices NaN/Infinity y gráficas rotas. |
| A5 | Parser acepta prefijos numéricos (`2abc` = 2), `Infinity`, y la coma siempre separa (`3,14` = 3 y 14) (L3735-3737). | Validar token completo y ofrecer aviso con los tokens descartados; decidir tratamiento de coma decimal. | Puede cambiar N y todos los índices con entradas "sucias". Con datos limpios no cambia nada. |
| A6 | `Cmk` es un alias de `Cpk` (`const Cmk = Cpk`, L3850). | Quitarlo, o calcularlo de verdad (índice de máquina con σ de corto plazo) si se quiere. | Hoy siempre igual a Cpk. |
| A7 | Si el divisor `d2` no está en la tabla, usa 2.326 (n=5) sin interpolar (L3754); fuera de 1-25 aplica a cualquier n. | Resolver con A3 (limitar n). | Solo n fuera de 1-25. |
| A8 | El campo "Confianza (95)" no se lee en ningún cálculo; normalidad fija en `p >= 0.05` y banda Q-Q con 1.36 fijo (L2875, L5024, L6588). | Conectar el campo (alfa = 1 - confianza) o quitarlo de la interfaz. | Con 95 no cambia; con otro valor cambiaría la conclusión de normalidad y la banda. |
| A9 | Regla Western Electric 2 marca siempre el punto nuevo aunque esté en el centro: `weViolations([2.1,2.2,0],0,1)` da `[0,1,2]` (L6915-6923). | Marcar el punto actual solo si supera 2σ del mismo lado. | Menos puntos "fuera de control"; cambia contadores OOC. |
| A10 | Gráficas de control en pantalla y PNG usan salvaguardas distintas para σ inferior (`max(botSigma,1e-10)` frente a `botSigma>0 ? botSigma : CL/3 \|\| 0.001`) (L7059-7062 vs L7320). | Unificar en una sola. | Solo cuando σ del gráfico inferior es 0 (datos constantes). |
| A11 | Gráfica de corridas: `runs` arranca en 1 aunque todo sea la mediana; "esperado" es `round((2N-1)/3)` fijo, sin tener en cuenta cuántos puntos hay sobre/bajo la mediana (L4850-4856). | Fórmula estándar de la prueba de rachas (media y varianza por n1, n2). | Cambia el "Esperado" mostrado. |
| A12 | Corridas en pantalla usa últimos 25 puntos y su mediana local; el PNG usa todos los datos y la mediana global (L4840-4862 vs L6502-6511). | Elegir una sola regla para ambos. | Valores de mediana y conteo distintos entre pantalla y PNG con más de 25 datos. |
| A13 | Q-Q: ejes invertidos entre pantalla (X observado) y PNG (X teórico) (L4990-5005 vs L6575-6580). | Un solo criterio de ejes. | Solo presentación, no cifras. |
| A14 | Límite inferior de control negativo no entra en la extensión vertical (`lcl > 0 ? lcl : 0`) (L7138-7148). | Incluir `lcl` aunque sea negativo. | Solo escala del gráfico. |
| A15 | Tooltip de la barra sigma siempre en español y con umbrales 5/4/3σ en vez de 1.67/1.33/1.00 Cpk (L4140-4144); son equivalentes salvo el redondeo. | Usar `classifyCpk` y traducción. | Solo texto. |

## B. Idioma, formato y texto

| # | Qué pasa hoy | Corrección propuesta | Impacto |
|---|---|---|---|
| B1 | Claves duplicadas `panel.guideTitle`/`panel.guideSub` en ES y EN (L3025-3026, L3141-3142, L3229-3230, L3345-3346). | Dejar una sola declaración (la última, que es la que rige). | Ninguno. |
| B2 | `gate.subtitle` dice "Análisis Térmico" (copiado de otra herramienta) (L7, L2631, L2997). | Texto de capacidad de proceso. | Solo texto (la v2 no lleva compuerta de contraseña). |
| B3 | Textos fijos en español aunque el idioma sea EN: Q-Q ("Punto", "Observado", "Teórico", "Desviación"), "datos", clasificación del tooltip sigma, conversor (L3904, L4140-4144, L5093, L8408, L8440, L8451-8583). | Pasarlos al diccionario. | Solo texto. |
| B4 | Cambiar de idioma no regenera resultados ya dibujados (interpretación, carpeta, fotos) (L3411-3442). | Renderizar desde estado, no desde HTML guardado. | Solo presentación. |
| B5 | Cambiar de tema no redibuja los canvas ya pintados (L3447-3456). | Redibujar al cambiar tema. | Solo presentación. |
| B6 | Formatos con la configuración regional del equipo: `toLocaleString()` en PPM y `toLocaleTimeString` (L3885-3887). | Fijar locale por idioma. | PPM >= 1000 muestra separador distinto según equipo. |
| B7 | `<html lang="es">` no cambia a EN (L2, L3432-3442). | Actualizar el atributo. | Accesibilidad. |
| B8 | Mini-histograma sin nombre en EN cae a "Punto N" con puntos suspensivos innecesarios (L5866-5874). | Respetar el nombre por idioma. | Solo texto. |

## C. Interfaz y datos fuera de la lógica (fase 2)

| # | Qué pasa hoy | Corrección propuesta |
|---|---|---|
| C1 | Nombres de punto y de archivos se insertan como HTML sin escapar (L3832, L3901-3904, L4432-4438, L5433-5443, L8402-8409). Riesgo XSS propio. | Escapar o usar nodos de texto (React lo hace por defecto). |
| C2 | Botón de colapsar dispara `toggleCard` dos veces por burbujeo (L3896, L4505-4530). | Un solo manejador. |
| C3 | `colorForCpk` devuelve `var(--accent-...)` que se pasa a canvas, y se concatena alfa tipo `var(--x)33` (L3803-3807, L4410, L4463-4470). | Resolver colores reales antes de pintar. |
| C4 | Tooltip del gauge no cubre el cuadrante superior derecho (L4581-4606). | Normalizar el ángulo. |
| C5 | Logo: el aviso "Logo guardado" sale aunque `localStorage` falle; la clave del tema se calcula al terminar de leer el archivo (L3490-3504). | Capturar tema al empezar; avisar el fallo. |
| C6 | PNG ejecutivo no repetible (grano con `Math.random`) (L6201-6207). | Semilla fija. |
| C7 | ZIP anuncia éxito aunque falten PNG o el resumen (L5991-6024). | Informar de los fallos. |
| C8 | Conversor .mwx lee solo la primera hoja `sheet.json` (L8488-8497). | Elegir/avisar. Fuera de alcance de esta fase. |
| C9 | Contraseña fija `CJLB` en el código del cliente (L3668). | No se porta: la v2 usa su propio acceso. |

## Rechazado en el inventario

Anchos de columna del resumen suman 804 (correcto); no es un defecto.
