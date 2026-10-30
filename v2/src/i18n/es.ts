export const es = {
  'home.greeting': 'Hola, {name}',
  'shell.tab.home': 'Inicio',
  'shell.tab.usage': 'Uso',
  'shell.theme.toggle': 'Cambiar tema',
  'shell.lang.toggle': 'Cambiar idioma',
} as const

export type MessageKey = keyof typeof es
