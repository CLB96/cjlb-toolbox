// Textos de VectoriZr. ES copiado literal del JSX de Digitalizacion/src (inventario §7);
// EN = propuesta aprobada del inventario §7. Los añadidos de la v2 (mejoras M11, M12, M15,
// M18 y plataforma) van al final de cada idioma.
import { useI18n } from '../../i18n/useI18n'
import type { ToolId } from './types'

type A = number | string
export type Lang = 'es' | 'en'

const es = {
  appName: 'VectoriZr',
  appSub: 'R&D Engineering',
  steps: 'Cargar|Escala|Vectorizar|Editar',
  confirmNew: '¿Iniciar una nueva vectorización? Se perderán los cambios no exportados.',
  rotate: 'Rota tu dispositivo para usar el editor',
  manual: 'Manual de usuario',
  // Paso 1
  uploadTitle: 'Cargar imagen',
  uploadDesc: 'Sube una foto o archivo de tu dibujo. Asegúrate de que incluya una referencia de medida (regla, cinta, etc.).',
  dropPrefix: 'Arrastra tu imagen aquí o ',
  dropLink: 'haz clic para seleccionar',
  takePhoto: '📷 Tomar foto',
  processing: 'Procesando imagen…',
  errLoadImage: 'No se pudo cargar la imagen',
  errProcess: 'No se pudo procesar el archivo. Intenta con otro.',
  errCamera: 'No se pudo acceder a la cámara. Revisa los permisos.',
  // Paso 2
  back: '← Volver',
  scaleHint1: '① Clic en el primer punto de la referencia',
  scaleHint2: '② Clic en el segundo punto',
  scaleHint3: '③ Ingresa la medida real',
  zoomOut: 'Alejar',
  zoomIn: 'Acercar',
  oneToOne: '1:1',
  rotateLeft: 'Rotar izquierda',
  rotateRight: 'Rotar derecha',
  refAlt: 'referencia',
  realLabel: 'Medida real de la línea marcada',
  realPlaceholder: 'Ej: 30',
  unitMm: 'mm',
  unitCm: 'cm',
  unitM: 'm',
  unitIn: 'pulgadas',
  confirmScale: 'Confirmar escala',
  remark: 'Volver a marcar',
  // Paso 3
  chooseTitle: '¿Cómo quieres vectorizar?',
  autoTitle: 'Detección automática',
  autoDesc: 'La app detecta los bordes. Tú corriges los puntos.',
  manualTitle: 'Trazado manual',
  manualDesc: 'Haz clic para colocar cada punto del contorno.',
  detectingOpencv: 'Detectando bordes con OpenCV…',
  methodAuto: 'Automático',
  methodSemi: 'Semi automático',
  lowThreshold: 'Umbral bajo',
  highThreshold: 'Umbral alto',
  autoHelp: 'Detecta automáticamente el objeto más grande por contraste de color.',
  detecting: 'Detectando…',
  detectAgain: 'Volver a detectar',
  confirmPts: (n: A) => `Confirmar (${n} pts)`,
  guideTitle: 'Guía de umbrales',
  guideLowLabel: 'Umbral bajo:',
  guideLow: ' controla qué tan sensible es el detector. Un valor bajo capta más bordes débiles (puede agregar ruido); un valor alto solo detecta bordes muy marcados.',
  guideHighLabel: 'Umbral alto:',
  guideHigh: ' define los bordes principales. Debe ser 2–3× el umbral bajo. Súbelo si aparecen demasiados contornos falsos; bájalo si el contorno queda incompleto.',
  manualHelpA: 'Haz clic para agregar puntos. El primer punto se muestra en ',
  manualHelpOrange: 'naranja',
  manualHelpB: '. Haz clic cerca de él para cerrar el contorno.',
  pointsN: (n: A) => `Puntos: ${n}`,
  undoLast: 'Deshacer último',
  clearAll: 'Limpiar todo',
  confirm: 'Confirmar',
  changeMode: '← Cambiar modo',
  // Paso 4
  backStep3: '← Paso 3',
  pathsCount: (n: A, m: A) => `Trazos: ${n} (${m} pts)`,
  newPathTitle: 'Guarda el trazo actual y empieza uno nuevo',
  newPath: '+ Nuevo trazo',
  fit: '⊡ Fit',
  fitTitle: 'Centrar imagen',
  exportBtn: '↓ Exportar',
  savedPaths: 'Trazos guardados:',
  pathN: (i: A) => `Trazo ${i}`,
  deletePath: 'Eliminar trazo',
  activePath: (n: A) => `· Trazo activo: ${n} pts`,
  exportTitle: (n: A) => `Exportar — ${n} trazo(s)`,
  exportDesc: (n: A) => `Se exportarán todos los trazos (${n} en total).`,
  exportDxf: '📐 DXF (AutoCAD / CNC)',
  exportSvg: '🖼 SVG',
  exportPdf: '📄 PDF',
  successTitle: '¡Exportación exitosa!',
  successA: 'Tu vectorización fue exportada como ',
  successB: ' correctamente.',
  keepEditing: 'Continuar editando',
  goStart: 'Ir al inicio',
  // Toolbar
  toolSelect: 'Seleccionar (S)',
  toolEdit: 'Editar punto (E)',
  toolSegment: 'Tipo de segmento — click en punto para alternar línea/curva',
  toolAdd: 'Agregar punto (A)',
  toolDelete: 'Eliminar punto (D)',
  toolMeasure: 'Medir distancia — 2 clicks para medir',
  toolZoom: 'Zoom (Z)',
  undo: 'Deshacer (Ctrl+Z)',
  redo: 'Rehacer (Ctrl+Y)',
  // Propiedades
  selectedPoint: 'Punto seleccionado',
  noSelection: 'Sin selección',
  selectHint: 'Selecciona un punto para ver sus propiedades.',
  coordX: (v: A) => `X: ${v} mm`,
  coordY: (v: A) => `Y: ${v} mm`,
  segment: 'Segmento',
  segLine: 'Línea recta',
  segBezier: 'Bezier',
  total: (n: A) => `Total: ${n} pts`,
  length: (v: A) => `Longitud: ${v} mm`,
  // Barra de estado
  statusScale: (f: A) => `Escala: 1px = ${f} mm`,
  statusZoom: (z: A) => `Zoom: ${z}%`,
  statusTool: (t: A) => `Herramienta: ${t}`,
  statusPoints: (n: A) => `Puntos: ${n}`,
  // Lienzo
  zoomHint: (z: A) => `${z}% · Rueda = zoom · Arrastrar = mover`,
  measureStart: 'Haz click en el punto inicial',
  measureEnd: 'Haz click en el punto final',
  measureDist: (d: A) => `Distancia: ${d} mm · Click para nueva medición`,
  keysHint: 'S Selec · E Editar · A Agregar · D Borrar · M Medir · Z Zoom',
  // Manual
  tabFlow: '🚀 Flujo',
  tabTools: '🛠 Herramientas',
  tabKeys: '⌨️ Atajos',
  tabTips: '💡 Consejos',
  // --- v2 ---
  formats: 'JPG, PNG, WebP',
  errFormat: 'Formato no válido. Usa JPG, PNG o WebP.',
  errSamePoints: 'Los dos puntos coinciden. Marca dos puntos distintos.',
  errRealValue: 'Ingresa una medida mayor que cero.',
  errDetect: 'No se pudo detectar el contorno. Vuelve a intentarlo o usa el trazado manual.',
  errExport: 'No se pudo exportar el archivo.',
  manualBtn: '📖 Manual de usuario',
  historyBtn: '🕘 Historial',
  accept: 'Aceptar',
  cancel: 'Cancelar',
  stepsLabel: 'Pasos',
  toolsLabel: 'Herramientas',
  close: 'Cerrar',
}

export type VzKey = keyof typeof es
type Dict = { [K in VzKey]: (typeof es)[K] }

const en: Dict = {
  appName: 'VectoriZr',
  appSub: 'R&D Engineering',
  steps: 'Upload|Scale|Vectorize|Edit',
  confirmNew: 'Start a new vectorization? Unexported changes will be lost.',
  rotate: 'Rotate your device to use the editor',
  manual: 'User manual',
  uploadTitle: 'Upload image',
  uploadDesc: 'Upload a photo or file of your drawing. Make sure it includes a measurement reference (ruler, tape, etc.).',
  dropPrefix: 'Drag your image here or ',
  dropLink: 'click to select',
  takePhoto: '📷 Take photo',
  processing: 'Processing image…',
  errLoadImage: 'Could not load image',
  errProcess: 'Could not process the file. Try another one.',
  errCamera: 'Could not access the camera. Check permissions.',
  back: '← Back',
  scaleHint1: '① Click the first reference point',
  scaleHint2: '② Click the second point',
  scaleHint3: '③ Enter the real measurement',
  zoomOut: 'Zoom out',
  zoomIn: 'Zoom in',
  oneToOne: '1:1',
  rotateLeft: 'Rotate left',
  rotateRight: 'Rotate right',
  refAlt: 'reference',
  realLabel: 'Real length of the marked line',
  realPlaceholder: 'e.g. 30',
  unitMm: 'mm',
  unitCm: 'cm',
  unitM: 'm',
  unitIn: 'inches',
  confirmScale: 'Confirm scale',
  remark: 'Mark again',
  chooseTitle: 'How do you want to vectorize?',
  autoTitle: 'Automatic detection',
  autoDesc: 'The app detects the edges. You fix the points.',
  manualTitle: 'Manual tracing',
  manualDesc: 'Click to place each contour point.',
  detectingOpencv: 'Detecting edges with OpenCV…',
  methodAuto: 'Automatic',
  methodSemi: 'Semi-automatic',
  lowThreshold: 'Low threshold',
  highThreshold: 'High threshold',
  autoHelp: 'Automatically detects the largest object by color contrast.',
  detecting: 'Detecting…',
  detectAgain: 'Detect again',
  confirmPts: (n: A) => `Confirm (${n} pts)`,
  guideTitle: 'Threshold guide',
  guideLowLabel: 'Low threshold:',
  guideLow: ' controls how sensitive the detector is. A low value catches more weak edges (may add noise); a high value only detects very strong edges.',
  guideHighLabel: 'High threshold:',
  guideHigh: ' defines the main edges. It should be 2–3× the low threshold. Raise it if too many false contours appear; lower it if the contour is incomplete.',
  manualHelpA: 'Click to add points. The first point is shown in ',
  manualHelpOrange: 'orange',
  manualHelpB: '. Click near it to close the contour.',
  pointsN: (n: A) => `Points: ${n}`,
  undoLast: 'Undo last',
  clearAll: 'Clear all',
  confirm: 'Confirm',
  changeMode: '← Change mode',
  backStep3: '← Step 3',
  pathsCount: (n: A, m: A) => `Paths: ${n} (${m} pts)`,
  newPathTitle: 'Save the current path and start a new one',
  newPath: '+ New path',
  fit: '⊡ Fit',
  fitTitle: 'Center image',
  exportBtn: '↓ Export',
  savedPaths: 'Saved paths:',
  pathN: (i: A) => `Path ${i}`,
  deletePath: 'Delete path',
  activePath: (n: A) => `· Active path: ${n} pts`,
  exportTitle: (n: A) => `Export — ${n} path(s)`,
  exportDesc: (n: A) => `All paths will be exported (${n} total).`,
  exportDxf: '📐 DXF (AutoCAD / CNC)',
  exportSvg: '🖼 SVG',
  exportPdf: '📄 PDF',
  successTitle: 'Export successful!',
  successA: 'Your vectorization was exported as ',
  successB: ' successfully.',
  keepEditing: 'Keep editing',
  goStart: 'Go to start',
  toolSelect: 'Select (S)',
  toolEdit: 'Edit point (E)',
  toolSegment: 'Segment type — click a point to toggle line/curve',
  toolAdd: 'Add point (A)',
  toolDelete: 'Delete point (D)',
  toolMeasure: 'Measure distance — 2 clicks to measure',
  toolZoom: 'Zoom (Z)',
  undo: 'Undo (Ctrl+Z)',
  redo: 'Redo (Ctrl+Y)',
  selectedPoint: 'Selected point',
  noSelection: 'No selection',
  selectHint: 'Select a point to see its properties.',
  coordX: (v: A) => `X: ${v} mm`,
  coordY: (v: A) => `Y: ${v} mm`,
  segment: 'Segment',
  segLine: 'Straight line',
  segBezier: 'Bezier',
  total: (n: A) => `Total: ${n} pts`,
  length: (v: A) => `Length: ${v} mm`,
  statusScale: (f: A) => `Scale: 1px = ${f} mm`,
  statusZoom: (z: A) => `Zoom: ${z}%`,
  statusTool: (t: A) => `Tool: ${t}`,
  statusPoints: (n: A) => `Points: ${n}`,
  zoomHint: (z: A) => `${z}% · Wheel = zoom · Drag = pan`,
  measureStart: 'Click the start point',
  measureEnd: 'Click the end point',
  measureDist: (d: A) => `Distance: ${d} mm · Click for a new measurement`,
  keysHint: 'S Select · E Edit · A Add · D Delete · M Measure · Z Zoom',
  tabFlow: '🚀 Flow',
  tabTools: '🛠 Tools',
  tabKeys: '⌨️ Shortcuts',
  tabTips: '💡 Tips',
  formats: 'JPG, PNG, WebP',
  errFormat: 'Invalid format. Use JPG, PNG or WebP.',
  errSamePoints: 'The two points are the same. Mark two different points.',
  errRealValue: 'Enter a measurement greater than zero.',
  errDetect: 'Could not detect the contour. Try again or use manual tracing.',
  errExport: 'Could not export the file.',
  manualBtn: '📖 User manual',
  historyBtn: '🕘 History',
  accept: 'OK',
  cancel: 'Cancel',
  stepsLabel: 'Steps',
  toolsLabel: 'Tools',
  close: 'Close',
}

export const VZ_I18N: Record<Lang, Dict> = { es, en }

export function translate(lang: Lang, key: VzKey, ...args: A[]): string {
  const v = (VZ_I18N[lang] ?? es)[key] as string | ((...a: A[]) => string)
  return typeof v === 'function' ? v(...args) : v
}

export type VzT = (key: VzKey, ...args: A[]) => string

/** Traductor de VectoriZr con el idioma del toolbox. */
export function useVzT(): { t: VzT; lang: Lang } {
  const { lang } = useI18n()
  return { t: (key, ...args) => translate(lang, key, ...args), lang }
}

/** Etiqueta legible de la herramienta para la barra de estado (M17): la del toolbar sin atajo. */
const TOOL_NAMES: Record<Lang, Record<ToolId, string>> = {
  es: {
    select: 'Seleccionar',
    'edit-point': 'Editar punto',
    'segment-type': 'Tipo de segmento',
    'add-point': 'Agregar punto',
    'delete-point': 'Eliminar punto',
    measure: 'Medir distancia',
    zoom: 'Zoom',
  },
  en: {
    select: 'Select',
    'edit-point': 'Edit point',
    'segment-type': 'Segment type',
    'add-point': 'Add point',
    'delete-point': 'Delete point',
    measure: 'Measure distance',
    zoom: 'Zoom',
  },
}

export function toolName(lang: Lang, id: ToolId): string {
  return TOOL_NAMES[lang][id]
}

// --- Manual (HelpModal.tsx): ES literal, EN traducido ---

export interface HelpRow {
  icon: string
  title: string
  desc: string
}

export interface HelpContent {
  title: string
  flow: { section: string; intro: string; rows: HelpRow[] }
  tools: { section: string; rows: HelpRow[]; multiSection: string; multiRows: HelpRow[] }
  keys: {
    section: string
    mouse: [string, string][]
    toolSection: string
    tools: [string, string][]
    buttonSection: string
    buttons: [string, string][]
  }
  tips: { section: string; rows: HelpRow[] }
}

export const HELP: Record<Lang, HelpContent> = {
  es: {
    title: 'Manual de usuario',
    flow: {
      section: 'Cómo funciona VectoriZr',
      intro: 'La app convierte fotografías de piezas físicas en vectores listos para CNC o corte láser en 4 pasos.',
      rows: [
        { icon: '📂', title: 'Paso 1 — Cargar imagen', desc: 'Sube una foto clara de la pieza sobre un fondo contrastante. Acepta JPG, PNG y WebP. Cuanto más nítida sea la foto y mayor el contraste, mejor será el resultado.' },
        { icon: '📏', title: 'Paso 2 — Definir escala', desc: 'Marca dos puntos sobre la imagen cuya distancia real conoces (por ejemplo, los extremos de una regla). Ingresa la medida real en mm, cm, m o pulgadas. Esto permite que el DXF exportado tenga las medidas reales de la pieza.' },
        { icon: '🔍', title: 'Paso 3 — Vectorizar', desc: 'La app detecta el contorno automáticamente usando análisis de imagen. Puedes ajustar el umbral para incluir o excluir detalles. Si el resultado no es perfecto, puedes corregirlo en el paso siguiente.' },
        { icon: '✏️', title: 'Paso 4 — Editar y exportar', desc: 'Edita los puntos del contorno con precisión: muévelos, agrégalos, elimínalos o cambia los segmentos a curvas Bezier. Al terminar, exporta como DXF (AutoCAD/CNC), SVG o PDF.' },
      ],
    },
    tools: {
      section: 'Herramientas del editor',
      rows: [
        { icon: '☝️', title: 'Seleccionar', desc: 'Selecciona y arrastra puntos existentes para reposicionarlos. También permite mover toda la vista arrastrando el canvas.' },
        { icon: '✏️', title: 'Editar punto', desc: 'Igual que seleccionar pero especializado en edición. Haz click en un punto para ver sus coordenadas en el panel derecho y ajustar sus propiedades.' },
        { icon: '〜', title: 'Tipo de segmento', desc: 'Click sobre cualquier punto para alternar entre segmento recto (línea) y curva Bezier. Los puntos Bezier se muestran en morado. Las curvas usan interpolación Catmull-Rom automática.' },
        { icon: '●', title: 'Agregar punto', desc: 'Click en cualquier lugar del canvas (incluyendo sobre la foto) para insertar un nuevo punto al final del trazo activo.' },
        { icon: '⬜', title: 'Eliminar punto', desc: 'Click sobre un punto existente para eliminarlo del trazo.' },
        { icon: '📐', title: 'Medir distancia', desc: '1er click = punto A. 2do click = punto B. Muestra la distancia real en mm entre ambos puntos. El 3er click reinicia la medición. Útil para validar antes de exportar.' },
        { icon: '🔍', title: 'Zoom', desc: 'También puedes usar la rueda del mouse para hacer zoom centrado en el cursor, y arrastrar el canvas para mover la vista en cualquier modo.' },
      ],
      multiSection: 'Trazos múltiples',
      multiRows: [
        { icon: '＋', title: 'Nuevo trazo', desc: 'Guarda el trazo activo actual y empieza uno nuevo. Útil para piezas con huecos o contornos interiores. Al exportar se incluyen todos los trazos.' },
      ],
    },
    keys: {
      section: 'Atajos de teclado y ratón',
      mouse: [
        ['Rueda del mouse', 'Zoom centrado en el cursor'],
        ['Click + arrastrar', 'Mover la vista (en modo seleccionar o zoom)'],
        ['Click en punto', 'Seleccionar punto'],
        ['Arrastrar punto', 'Mover punto (seleccionar o editar)'],
        ['Ctrl + Z', 'Deshacer'],
        ['Ctrl + Y / Ctrl + Shift + Z', 'Rehacer'],
      ],
      toolSection: 'Teclas rápidas — herramientas',
      tools: [
        ['S', 'Seleccionar'],
        ['E', 'Editar punto'],
        ['A', 'Agregar punto'],
        ['D', 'Eliminar punto'],
        ['M', 'Medir distancia'],
        ['Z', 'Zoom'],
      ],
      buttonSection: 'Botones del editor',
      buttons: [
        ['↺ / ↻ (barra lateral)', 'Deshacer / Rehacer'],
        ['⊡ Fit (barra superior)', 'Centrar y ajustar imagen al canvas'],
        ['+ Nuevo trazo (barra superior)', 'Guarda el trazo actual y empieza uno nuevo'],
        ['↓ Exportar', 'Abre el panel de exportación (DXF / SVG / PDF)'],
      ],
    },
    tips: {
      section: 'Para mejores resultados',
      rows: [
        { icon: '📸', title: 'Fotografía adecuada', desc: 'Usa fondo blanco o negro con buena iluminación y sin sombras fuertes. La pieza debe contrastar claramente con el fondo. Evita fotos en ángulo — usa vista cenital (desde arriba).' },
        { icon: '📏', title: 'Escala precisa', desc: 'Coloca una regla o pieza de referencia conocida en la foto junto a la pieza. Cuanto más larga sea la referencia que elijas, más precisa será la escala.' },
        { icon: '🎯', title: 'Umbral de vectorización', desc: 'En el paso 3, si el contorno detectado tiene ruido o le faltan partes, ajusta el umbral. Valores más bajos capturan más detalles; valores más altos dan contornos más limpios.' },
        { icon: '✏️', title: 'Edición de puntos', desc: 'Menos puntos = contorno más suave para CNC. Elimina puntos redundantes en zonas rectas. Usa Bezier solo en curvas reales, no en segmentos casi rectos.' },
        { icon: '📐', title: 'Valida antes de exportar', desc: 'Usa la herramienta de medición para verificar dimensiones clave antes de exportar. Compara con las medidas reales de la pieza.' },
        { icon: '🗂️', title: 'Trazos múltiples', desc: 'Para piezas con agujeros, usa "Nuevo trazo" para cada contorno interior. En el DXF exportado, cada trazo aparece como una polilínea independiente.' },
      ],
    },
  },
  en: {
    title: 'User manual',
    flow: {
      section: 'How VectoriZr works',
      intro: 'The app turns photos of physical parts into vectors ready for CNC or laser cutting in 4 steps.',
      rows: [
        { icon: '📂', title: 'Step 1 — Upload image', desc: 'Upload a clear photo of the part on a contrasting background. Accepts JPG, PNG and WebP. The sharper the photo and the higher the contrast, the better the result.' },
        { icon: '📏', title: 'Step 2 — Set scale', desc: 'Mark two points on the image whose real distance you know (for example, the ends of a ruler). Enter the real measurement in mm, cm, m or inches. This lets the exported DXF have the real dimensions of the part.' },
        { icon: '🔍', title: 'Step 3 — Vectorize', desc: 'The app detects the contour automatically using image analysis. You can adjust the threshold to include or exclude details. If the result is not perfect, you can fix it in the next step.' },
        { icon: '✏️', title: 'Step 4 — Edit and export', desc: 'Edit the contour points precisely: move, add or delete them, or turn segments into Bezier curves. When you are done, export as DXF (AutoCAD/CNC), SVG or PDF.' },
      ],
    },
    tools: {
      section: 'Editor tools',
      rows: [
        { icon: '☝️', title: 'Select', desc: 'Select and drag existing points to reposition them. You can also move the whole view by dragging the canvas.' },
        { icon: '✏️', title: 'Edit point', desc: 'Like select, but focused on editing. Click a point to see its coordinates in the right panel and adjust its properties.' },
        { icon: '〜', title: 'Segment type', desc: 'Click any point to toggle between a straight segment (line) and a Bezier curve. Bezier points are shown in purple. Curves use automatic Catmull-Rom interpolation.' },
        { icon: '●', title: 'Add point', desc: 'Click anywhere on the canvas (including over the photo) to insert a new point at the end of the active path.' },
        { icon: '⬜', title: 'Delete point', desc: 'Click an existing point to remove it from the path.' },
        { icon: '📐', title: 'Measure distance', desc: '1st click = point A. 2nd click = point B. Shows the real distance in mm between both points. The 3rd click restarts the measurement. Useful to validate before exporting.' },
        { icon: '🔍', title: 'Zoom', desc: 'You can also use the mouse wheel to zoom centered on the cursor, and drag the canvas to move the view in any mode.' },
      ],
      multiSection: 'Multiple paths',
      multiRows: [
        { icon: '＋', title: 'New path', desc: 'Saves the current active path and starts a new one. Useful for parts with holes or inner contours. All paths are included when exporting.' },
      ],
    },
    keys: {
      section: 'Keyboard and mouse shortcuts',
      mouse: [
        ['Mouse wheel', 'Zoom centered on the cursor'],
        ['Click + drag', 'Move the view (in select or zoom mode)'],
        ['Click on point', 'Select point'],
        ['Drag point', 'Move point (select or edit)'],
        ['Ctrl + Z', 'Undo'],
        ['Ctrl + Y / Ctrl + Shift + Z', 'Redo'],
      ],
      toolSection: 'Hotkeys — tools',
      tools: [
        ['S', 'Select'],
        ['E', 'Edit point'],
        ['A', 'Add point'],
        ['D', 'Delete point'],
        ['M', 'Measure distance'],
        ['Z', 'Zoom'],
      ],
      buttonSection: 'Editor buttons',
      buttons: [
        ['↺ / ↻ (side bar)', 'Undo / Redo'],
        ['⊡ Fit (top bar)', 'Center and fit the image to the canvas'],
        ['+ New path (top bar)', 'Saves the current path and starts a new one'],
        ['↓ Export', 'Opens the export panel (DXF / SVG / PDF)'],
      ],
    },
    tips: {
      section: 'For best results',
      rows: [
        { icon: '📸', title: 'Suitable photo', desc: 'Use a white or black background with good lighting and no strong shadows. The part must contrast clearly with the background. Avoid angled photos — use a top-down view.' },
        { icon: '📏', title: 'Accurate scale', desc: 'Place a ruler or a known reference object in the photo next to the part. The longer the reference you choose, the more accurate the scale.' },
        { icon: '🎯', title: 'Vectorization threshold', desc: 'In step 3, if the detected contour is noisy or missing parts, adjust the threshold. Lower values capture more detail; higher values give cleaner contours.' },
        { icon: '✏️', title: 'Point editing', desc: 'Fewer points = smoother contour for CNC. Remove redundant points in straight areas. Use Bezier only on real curves, not on nearly straight segments.' },
        { icon: '📐', title: 'Validate before exporting', desc: 'Use the measuring tool to check key dimensions before exporting. Compare them with the real measurements of the part.' },
        { icon: '🗂️', title: 'Multiple paths', desc: 'For parts with holes, use "New path" for each inner contour. In the exported DXF, each path appears as an independent polyline.' },
      ],
    },
  },
}
