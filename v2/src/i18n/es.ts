export const es = {
  'home.greeting': 'Hola, {name}',
  'shell.tab.home': 'Inicio',
  'shell.tab.usage': 'Uso',
  'shell.theme.toggle': 'Cambiar tema',
  'shell.migrating': 'Esta herramienta está en migración.',
  'shell.counter': 'Contador',
  'shell.openCurrent': 'Abrir la herramienta actual',
  'shell.loading': 'Cargando…',
  'shell.lang.toggle': 'Cambiar idioma',
  'persist.saveFailed': 'No se pudo guardar automáticamente. Exporta tu trabajo.',
  'persist.restoreFailed': 'No se pudo restaurar el trabajo guardado.',
  'persist.savedAgo': 'Guardado hace {min} min',
  'persist.savedJustNow': 'Guardado hace un momento',
  'persist.history': 'Historial de versiones',
  'persist.historyEmpty': 'Aún no hay versiones guardadas.',
  'persist.restore': 'Restaurar',
  'persist.largeFilesSkipped': 'Los archivos de más de 20 MB no se guardan en el historial.',
  'persist.historyLoadFailed': 'No se pudo cargar el historial de versiones.',
} as const

export type MessageKey = keyof typeof es
