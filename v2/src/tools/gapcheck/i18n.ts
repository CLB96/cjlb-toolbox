import { useI18n } from '../../i18n/useI18n'

/**
 * Diccionario copiado literal del original (gapcheck/index.html 1702-1795, inventario §10).
 * Añadidos de la v2: `importFailed` (aviso de lectura), `fileDims`, `changeFile` y `history`
 * (cabecera aprobada en el mockup).
 */
const es = {
  loginEnter: 'Ingresar',
  loginSuccess: 'Gracias por usar la app',
  loginError: 'Contraseña incorrecta, por favor ingresa la contraseña correcta',
  pageTitle: 'Gapcheck Análisis',
  pageSubtitle: 'Sube tu archivo Excel para analizar datos',
  importData: 'Importar Datos',
  uploadSubtitle: 'Selecciona o arrastra tu archivo Excel',
  dropText: '<strong>Clic para subir</strong> o arrastra y suelta',
  overview: 'Resumen de Datos',
  points: 'Puntos Medidos',
  avgValue: 'Promedio Global',
  minValue: 'Valor más bajo',
  maxValue: 'Valor más alto',
  meetingTarget: 'Cumplen Objetivo',
  skinThicknessLabel: 'Espesor de Skin (mm)',
  foamThicknessLabel: 'Espesor de Foam (mm)',
  compressionLabel: 'Compresión Buscada',
  chart: 'Gráfica de Datos',
  targets: 'Valores Objetivo',
  targetMin: 'Objetivo Mínimo',
  targetMax: 'Objetivo Máximo (opcional)',
  updateBtn: 'Actualizar Comparación',
  table: 'Tabla de Datos',
  thPoint: 'Punto',
  thIteration: 'Iteración',
  thValue: 'Valor',
  thTarget: 'Objetivo',
  thStatus: 'Estado',
  statusMet: '✅ Cumple',
  statusWarning: '⚠️ Cerca',
  statusNotMet: '❌ No cumple',
  gapLayout: 'Gapcheck Layout',
  gapLayoutSubtitle: 'Carga una imagen del diagrama y posiciona cada punto de medición',
  gapLayoutDrop: 'Arrastra una imagen del diagrama o <strong>haz clic para seleccionar</strong>',
  gapLayoutInstructions: 'Arrastra los puntos de medición para ubicarlos en el diagrama',
  markerSizeLabel: 'Tamaño de Puntos:',
  toggleTheme: 'Tema Oscuro / Claro',
  changeLanguage: 'Cambiar Idioma',
  filterPoints: 'Puntos',
  filterIterations: 'Iteraciones',
  exportPng: 'Exportar PNG',
  themeTitle: 'Tema',
  languageTitle: 'Idioma',
  footerCredit: 'Desarrollado por CJLB',
  importFailed: 'No se pudo leer el archivo',
  fileDims: '{n} iteraciones × {m} puntos',
  changeFile: 'Cambiar archivo',
  history: 'Historial',
} as const

export type GapcheckKey = keyof typeof es

const en: Record<GapcheckKey, string> = {
  loginEnter: 'Enter',
  loginSuccess: 'Thank you for using the app',
  loginError: 'Incorrect password, please enter the correct password',
  pageTitle: 'Gapcheck Analysis',
  pageSubtitle: 'Upload your Excel file to analyze data',
  importData: 'Import Data',
  uploadSubtitle: 'Select or drag your Excel file',
  dropText: '<strong>Click to upload</strong> or drag and drop',
  overview: 'Data Overview',
  points: 'Measurement Points',
  avgValue: 'Global Average',
  minValue: 'Lowest Value',
  maxValue: 'Highest Value',
  meetingTarget: 'Meeting Target',
  skinThicknessLabel: 'Skin Thickness (mm)',
  foamThicknessLabel: 'Foam Thickness (mm)',
  compressionLabel: 'Target Compression',
  chart: 'Data Chart',
  targets: 'Target Values',
  targetMin: 'Minimum Target',
  targetMax: 'Maximum Target (optional)',
  updateBtn: 'Update Comparison',
  table: 'Data Table',
  thPoint: 'Point',
  thIteration: 'Iteration',
  thValue: 'Value',
  thTarget: 'Target',
  thStatus: 'Status',
  statusMet: '✅ Met',
  statusWarning: '⚠️ Close',
  statusNotMet: '❌ Not Met',
  gapLayout: 'Gapcheck Layout',
  gapLayoutSubtitle: 'Load a diagram image and position each measurement point',
  gapLayoutDrop: 'Drag a diagram image or <strong>click to select</strong>',
  gapLayoutInstructions: 'Drag measurement points to position them on the diagram',
  markerSizeLabel: 'Point Size:',
  toggleTheme: 'Dark / Light Mode',
  changeLanguage: 'Change Language',
  filterPoints: 'Points',
  filterIterations: 'Iterations',
  exportPng: 'Export to PNG',
  themeTitle: 'Theme',
  languageTitle: 'Language',
  footerCredit: 'Developed by CJLB',
  importFailed: 'The file could not be read',
  fileDims: '{n} iterations × {m} points',
  changeFile: 'Change file',
  history: 'History',
}

export const GAPCHECK_TEXTS: Record<'es' | 'en', Record<GapcheckKey, string>> = { es, en }

/** Textos fijos del original que nunca se traducen (inventario §4, §6, §10). */
export const STATIC_TEXTS = {
  coveringType: 'Tipo de Covering',
  hard: 'Hard Covering',
  soft: 'Soft Covering',
  eyebrow: 'GapCheck Objetivo',
  mm: 'mm',
  pct: '%',
} as const

type Vars = Record<string, string | number>
export type GapcheckT = (key: GapcheckKey, vars?: Vars) => string

export function useGapcheckT(): GapcheckT {
  const { lang } = useI18n()
  return (key, vars) =>
    GAPCHECK_TEXTS[lang][key].replace(/\{(\w+)\}/g, (match, name: string) =>
      vars && name in vars ? String(vars[name]) : match,
    )
}
