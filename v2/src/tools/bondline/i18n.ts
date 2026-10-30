// Diccionario I18N copiado literal del original (bondline/index.html 731-970, inventario §8),
// incluidas las entradas función. Añadidos de la v2 al final de cada idioma:
// - fileDims, changeFile, history: cabecera del mockup aprobado (R6); fileDims y changeFile/history nuevos.
// - fileReadError, sheetEmpty, sheetNoTemp: alerts literales de lectura/hoja (solo ES en el original; EN nuevo, R10).
// - timeStartNegative, timeEndNotAfterStart, timeEndExceeds: alerts literales de applyTimeRange (ES/EN, §6).
// - defaultsConfirmReset: confirm literal de resetDefaults (ES/EN, §6).
// - layoutRealSize: botón "Tamaño real" del layout (R4, como GapCheck).
// - selectImage: alert literal de handleLayoutImage (2860); changeImage, imageLoadFailed: nuevos (como GapCheck).
// - exportThermo..exportNestLow: sub-etiquetas del PNG (ES literal del original; EN nuevo, mejora A3).
// - timeDecimals, exportNoLayoutImage: avisos nuevos (mejoras A17 y C38).
import { useI18n } from '../../i18n/useI18n'
import type { Lang } from './logic/types'

type A = number | string

const es = {
    appKicker:'R&D Process Engineering',
    appTitle:'Bondline',
    appSubtitle:'Visualización de ciclo térmico y ventana de activación de adhesivo',
    fileTitle:'📂 Archivo de datos',
    fileSubtitle:'.xlsx / .xls / .csv — sin encabezados, cada columna = termopar',
    fileDrop:'Arrastra tu archivo aquí o <strong>haz clic para seleccionar</strong>',
    rawMaterialTitle:'🧪 Materia Prima',
    rawMaterialSubtitle:'Adhesivo y sustrato',
    adhesiveSection:'Tipo de adhesivo',
    adhesiveTitle:'🧪 Tipo de adhesivo',
    adhesiveSubtitle:'Define los rangos de temperatura',
    adhesiveMin:'Mín',
    adhesiveMax:'Máx',
    substrateSection:'Tipo de sustrato',
    needsFlame:'Necesita Flama',
    flameYes:'SÍ',
    flameNo:'NO',
    chartPlaceholder:'Carga un archivo Excel para visualizar el perfil térmico',
    statThermocouples:'Termopares',
    statDuration:'Duración ciclo',
    statMinTemp:'Temp mín registrada',
    statMaxTemp:'Temp máx registrada',
    statActivation:'Inicio activación',
    statNotReached:'No alcanzada',
    legendLimits:'Límites adhesivo',
    legendWindow:'Ventana activación',
    axisTime:'Tiempo (segundos)',
    axisTemp:'Temperatura (°C)',
    annotMin:(v: A) =>`Temp Mín: ${v}°C`,
    annotMax:(v: A) =>`Temp Máx: ${v}°C`,
    annotWindow:(s: A) =>`Ventana de Activación (${s}s)`,
    resultPassTitle:'✓ Ventana de activación exitosa',
    resultPass:(min: A, t: A, dur: A, max: A) =>`Todos los termopares alcanzaron ${min}°C en t=${t}s. Durante los ${dur}s siguientes, todas las lecturas se mantuvieron entre ${min}°C y ${max}°C.`,
    resultFailTitle:'⚠ Activación no alcanzada',
    resultFail:(min: A, label: A) =>`No todos los termopares alcanzaron la temperatura mínima de ${min}°C del adhesivo ${label}.`,
    resultOutTitle:'⚠ Ventana de activación fuera de rango',
    resultOut:(t: A, dur: A, min: A, max: A) =>`La activación inició en t=${t}s, pero durante la ventana de ${dur}s algunos termopares salieron del rango ${min}°C – ${max}°C.`,
    // Cooling result
    coolingResultTitle:'✓ Enfriamiento correcto',
    coolingResult:(time: A, target: A) =>`La pieza alcanzó el correcto enfriamiento (${target}°C) ${time}s después de haber iniciado el ciclo de cooling.`,
    coolingResultFailTitle:'⚠ Enfriamiento no alcanzado',
    coolingResultFail:(target: A) =>`No todos los termopares alcanzaron la temperatura objetivo de ${target}°C durante el ciclo de cooling.`,
    // TC visibility
    showHideTCs:'Mostrar/Ocultar TCs',
    hideTC:'Ocultar',
    showTC:'Mostrar',
    footer:'Desarrollado por CJLB — R&D Process Engineering',
    // Events
    eventsTitle:'⏱ Sucesos',
    eventsSubtitle:'Marcadores de eventos del proceso',
    eventsPrensa:'🔧 Prensa',
    eventPressStart:'Inicia Ciclo Prensa',
    eventPressClosed:'Prensa Cerrada',
    eventPressOpen:'Prensa Abierta',
    eventPressEnd:'Termina Ciclo Prensa',
    eventsManipulation:'🤲 Manipulación',
    eventManipStart:'Inicia Manipulación',
    eventManipEnd:'Termina Manipulación',
    eventsCooling:'❄️ Cooling',
    eventCoolingStart:'Inicia Ciclo Cooling',
    eventCoolingClosed:'Cooling Cerrado',
    eventCoolingEnd:'Termina Ciclo Cooling',
    // Cooling parameters
    coolingParamsTitle:'Parámetros de Cooling',
    coolingChiller:'Chiller',
    coolingNestUpper:'Cooling Nido Superior',
    coolingNestLower:'Cooling Nido Inferior',
    // Time range
    timeRangeTitle:'⏱ Rango Temporal',
    timeRangeSubtitle:'Recorta el tiempo visible en la gráfica',
    timeRangeStart:'Inicio (s)',
    timeRangeEnd:'Fin (s)',
    timeRangeReset:'Mostrar todo',
    timeRangeApply:'Aplicar rango',
    // Test date
    testDateLabel:'Fecha de Prueba',
    testDatePlaceholder:'DD/MM/YYYY',
    // Bondline Layout
    layoutTitle:'📍 Bondline Layout',
    layoutSubtitle:'Diagrama visual de ubicación de termopares',
    layoutDrop:'Arrastra una imagen del guante o <strong>haz clic para seleccionar</strong>',
    layoutFileName:'Imagen cargada:',
    layoutInstructions:'Arrastra los termopares para ubicarlos en el diagrama',
    paramsTitle:'⚙ Parámetros del proceso',
    paramsSubtitleFull:'Temperaturas de termoreguladores, nidos, leisters y sliders',
    paramUpper:'▲ Superior',
    paramLower:'▼ Inferior',
    paramThermoregUpper:'Termoregulador Superior',
    paramNestUpper:'Nido Superior',
    paramThermoregLower:'Termoregulador Inferior',
    paramNestLower:'Nido Inferior',
    paramLoss:'Temperatura Pérdida',
    paramLeistersLabel:'Leisters',
    paramSlidersLabel:'Sliders',
    paramSliders:'Temperatura Sliders',
    menuDownload:'Descargar gráfica PNG',
    menuDefaults:'Valores Default',
    menuTheme:'Cambiar tema',
    menuLanguage:'Idioma:',
    // Defaults Modal
    defaultsTitle:'⚙️ Valores Default',
    defaultsSubtitle:'Configura los rangos de temperatura predeterminados',
    defaultsTempMin:'Temp Mín',
    defaultsTempMax:'Temp Máx',
    defaultsCoolingTarget:'Temp Objetivo Cooling',
    defaultsReset:'Restaurar valores de fábrica',
    defaultsSave:'Guardar',
    defaultsCancel:'Cancelar',
    exportTitle:'Perfil Térmico — Activación de Adhesivo',
    exportParams:'Parámetros del proceso',
    // Lock screen
    lockSubtitle:'Análisis Térmico',
    lockPrompt:'Ingresa la contraseña para comenzar a usar esta aplicación.',
    lockPlaceholder:'Contraseña de acceso',
    lockButton:'Entrar',
    lockDisclaimer:'Esta puerta de acceso protege la vista antes de comenzar.',
    lockError:'Contraseña incorrecta. Intenta de nuevo.',
    // --- v2 (no existen en el original; ver cabecera) ---
    fileDims: (n: A, m: A) => `${n} s × ${m} termopares`,
    changeFile: 'Cambiar archivo',
    history: 'Historial',
    fileReadError: 'Error al leer el archivo. Por favor intenta de nuevo.',
    exportNoData: 'Por favor carga datos primero',
    exportFailed: 'Error al generar la imagen. Por favor intenta de nuevo.',
    sheetEmpty: (name: A) => `La hoja "${name}" no contiene datos válidos`,
    sheetNoTemp: (name: A) => `La hoja "${name}" no contiene datos de temperatura válidos`,
    timeStartNegative: 'El tiempo de inicio debe ser mayor o igual a 0',
    timeEndNotAfterStart: 'El tiempo final debe ser mayor al inicial',
    timeEndExceeds: (total: A) => `El tiempo final no puede exceder ${total}s`,
    defaultsConfirmReset: '¿Restaurar valores de fábrica?',
    layoutRealSize: 'Tamaño real',
    selectImage: 'Por favor selecciona una imagen',
    changeImage: 'Cambiar imagen',
    imageLoadFailed: 'No se pudo mostrar la imagen',
    exportThermo: 'Termoreg.',
    exportNest: 'Nido',
    exportLoss: 'Pérdida',
    exportTemp: 'Temperatura',
    exportNestUp: 'Nido Sup',
    exportNestLow: 'Nido Inf',
    timeDecimals: 'El rango usa segundos enteros: se ignoraron los decimales',
    exportNoLayoutImage: 'Se exportó sin la imagen del layout',
}

export type BondlineKey = keyof typeof es
type Entry = string | ((...args: A[]) => string)

const en: Record<BondlineKey, Entry> = {
    appKicker:'R&D Process Engineering',
    appTitle:'Bondline',
    appSubtitle:'Thermal cycle visualization and adhesive activation window',
    fileTitle:'📂 Data file',
    fileSubtitle:'.xlsx / .xls / .csv — no headers, each column = thermocouple',
    fileDrop:'Drag your file here or <strong>click to select</strong>',
    rawMaterialTitle:'🧪 Raw Material',
    rawMaterialSubtitle:'Adhesive and substrate',
    adhesiveSection:'Adhesive type',
    adhesiveTitle:'🧪 Adhesive type',
    adhesiveSubtitle:'Sets the temperature range',
    adhesiveMin:'Min',
    adhesiveMax:'Max',
    substrateSection:'Substrate type',
    needsFlame:'Needs Flame',
    flameYes:'YES',
    flameNo:'NO',
    chartPlaceholder:'Load an Excel file to visualize the thermal profile',
    statThermocouples:'Thermocouples',
    statDuration:'Cycle duration',
    statMinTemp:'Min temp recorded',
    statMaxTemp:'Max temp recorded',
    statActivation:'Activation start',
    statNotReached:'Not reached',
    legendLimits:'Adhesive limits',
    legendWindow:'Activation window',
    axisTime:'Time (seconds)',
    axisTemp:'Temperature (°C)',
    annotMin:(v: A) =>`Min Temp: ${v}°C`,
    annotMax:(v: A) =>`Max Temp: ${v}°C`,
    annotWindow:(s: A) =>`Activation Window (${s}s)`,
    resultPassTitle:'✓ Activation window successful',
    resultPass:(min: A, t: A, dur: A, max: A) =>`All thermocouples reached ${min}°C at t=${t}s. During the following ${dur}s, all readings stayed between ${min}°C and ${max}°C.`,
    resultFailTitle:'⚠ Activation not reached',
    resultFail:(min: A, label: A) =>`Not all thermocouples reached the minimum temperature of ${min}°C for ${label} adhesive.`,
    resultOutTitle:'⚠ Activation window out of range',
    resultOut:(t: A, dur: A, min: A, max: A) =>`Activation started at t=${t}s, but during the ${dur}s window some thermocouples went outside the ${min}°C – ${max}°C range.`,
    // Cooling result
    coolingResultTitle:'✓ Correct cooling achieved',
    coolingResult:(time: A, target: A) =>`The part reached correct cooling (${target}°C) ${time}s after the cooling cycle started.`,
    coolingResultFailTitle:'⚠ Cooling not achieved',
    coolingResultFail:(target: A) =>`Not all thermocouples reached the target temperature of ${target}°C during the cooling cycle.`,
    // TC visibility
    showHideTCs:'Show/Hide TCs',
    hideTC:'Hide',
    showTC:'Show',
    footer:'Developed by CJLB — R&D Process Engineering',
    // Events
    eventsTitle:'⏱ Events',
    eventsSubtitle:'Process event markers',
    eventsPrensa:'🔧 Press',
    eventPressStart:'Press Cycle Start',
    eventPressClosed:'Press Closed',
    eventPressOpen:'Press Open',
    eventPressEnd:'Press Cycle End',
    eventsManipulation:'🤲 Manipulation',
    eventManipStart:'Manipulation Start',
    eventManipEnd:'Manipulation End',
    eventsCooling:'❄️ Cooling',
    eventCoolingStart:'Cooling Cycle Start',
    eventCoolingClosed:'Cooling Closed',
    eventCoolingEnd:'Cooling Cycle End',
    // Cooling parameters
    coolingParamsTitle:'Cooling Parameters',
    coolingChiller:'Chiller',
    coolingNestUpper:'Cooling Upper Nest',
    coolingNestLower:'Cooling Lower Nest',
    // Time range
    timeRangeTitle:'⏱ Time Range',
    timeRangeSubtitle:'Trim visible time in the chart',
    timeRangeStart:'Start (s)',
    timeRangeEnd:'End (s)',
    timeRangeReset:'Show all',
    timeRangeApply:'Apply range',
    // Test date
    testDateLabel:'Test Date',
    testDatePlaceholder:'MM/DD/YYYY',
    // Bondline Layout
    layoutTitle:'📍 Bondline Layout',
    layoutSubtitle:'Visual diagram of thermocouple locations',
    layoutDrop:'Drag a glove diagram image here or <strong>click to select</strong>',
    layoutFileName:'Image loaded:',
    layoutInstructions:'Drag thermocouples to position them on the diagram',
    paramsTitle:'⚙ Process parameters',
    paramsSubtitleFull:'Thermoregulator, nest, leister and slider temperatures',
    paramUpper:'▲ Upper',
    paramLower:'▼ Lower',
    paramThermoregUpper:'Upper Thermoregulator',
    paramNestUpper:'Upper Nest',
    paramThermoregLower:'Lower Thermoregulator',
    paramNestLower:'Lower Nest',
    paramLoss:'Temperature Loss',
    paramLeistersLabel:'Leisters',
    paramSlidersLabel:'Sliders',
    paramSliders:'Slider Temperature',
    menuDownload:'Download chart PNG',
    menuDefaults:'Default Values',
    menuTheme:'Change theme',
    menuLanguage:'Language:',
    // Defaults Modal
    defaultsTitle:'⚙️ Default Values',
    defaultsSubtitle:'Configure default temperature ranges',
    defaultsTempMin:'Min Temp',
    defaultsTempMax:'Max Temp',
    defaultsCoolingTarget:'Cooling Target Temp',
    defaultsReset:'Restore factory values',
    defaultsSave:'Save',
    defaultsCancel:'Cancel',
    exportTitle:'Thermal Profile — Adhesive Activation',
    exportParams:'Process Parameters',
    // Lock screen
    lockSubtitle:'Thermal Analysis',
    lockPrompt:'Enter the password to start using this app.',
    lockPlaceholder:'Access password',
    lockButton:'Enter',
    lockDisclaimer:'This access gate protects the view before you begin.',
    lockError:'Incorrect password. Try again.',
    // --- v2 ---
    fileDims: (n: A, m: A) => `${n} s × ${m} thermocouples`,
    changeFile: 'Change file',
    history: 'History',
    fileReadError: 'Error reading the file. Please try again.',
    exportNoData: 'Please load data first',
    exportFailed: 'Error generating image. Please try again.',
    sheetEmpty: (name: A) => `Sheet "${name}" contains no valid data`,
    sheetNoTemp: (name: A) => `Sheet "${name}" contains no valid temperature data`,
    timeStartNegative: 'Start time must be 0 or greater',
    timeEndNotAfterStart: 'End time must be greater than start time',
    timeEndExceeds: (total: A) => `End time cannot exceed ${total}s`,
    defaultsConfirmReset: 'Restore factory values?',
    layoutRealSize: 'Actual size',
    selectImage: 'Please select an image',
    changeImage: 'Change image',
    imageLoadFailed: 'The image could not be displayed',
    exportThermo: 'Thermoreg.',
    exportNest: 'Nest',
    exportLoss: 'Loss',
    exportTemp: 'Temperature',
    exportNestUp: 'Nest Up',
    exportNestLow: 'Nest Low',
    timeDecimals: 'The range uses whole seconds: decimals were ignored',
    exportNoLayoutImage: 'Exported without the layout image',
}

export const BONDLINE_I18N: Record<Lang, Record<BondlineKey, Entry>> = { es, en }

export type BondlineT = (key: BondlineKey, ...args: A[]) => string

/** T() del original: idioma -> ES -> clave; las entradas función reciben los argumentos. */
export function translate(lang: Lang, key: BondlineKey, ...args: A[]): string {
  const v: Entry | undefined = BONDLINE_I18N[lang]?.[key] ?? BONDLINE_I18N.es[key]
  if (typeof v === 'function') return v(...args)
  return v ?? key
}

/** Traductor de Bondline con el idioma del toolbox. */
export function useBondlineT(): BondlineT {
  const { lang } = useI18n()
  return (key, ...args) => translate(lang, key, ...args)
}

/** Texto del toast para un rechazo de `importWorkbook`. */
export function fileReadErrorText(lang: Lang): string {
  return translate(lang, 'fileReadError')
}

/** Literales del original fuera del diccionario (inventario §8): nunca se traducen. */
export const STATIC_TEXTS = {
  waterbase: 'Water Base',
  hotmelt: 'Hotmelt',
  pcabs: 'PC-ABS',
  pp: 'PP',
  activeSheet: '📊 Hoja Activa',
  prevSheet: 'Hoja anterior',
  nextSheet: 'Hoja siguiente',
  auto: 'Auto',
  applyRange: 'Aplicar rango',
  resetRange: 'Restaurar',
} as const
