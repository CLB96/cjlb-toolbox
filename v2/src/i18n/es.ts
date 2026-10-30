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
} as const

export type MessageKey = keyof typeof es
