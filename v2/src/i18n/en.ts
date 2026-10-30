import type { MessageKey } from './es'

export const en: Record<MessageKey, string> = {
  'home.greeting': 'Hello, {name}',
  'shell.tab.home': 'Home',
  'shell.tab.usage': 'Usage',
  'shell.theme.toggle': 'Toggle theme',
  'shell.migrating': 'This tool is being migrated.',
  'shell.counter': 'Counter',
  'shell.openCurrent': 'Open the current tool',
  'shell.loading': 'Loading…',
  'shell.lang.toggle': 'Toggle language',
  'persist.saveFailed': 'Autosave failed. Export your work.',
  'persist.restoreFailed': 'Could not restore the saved work.',
  'persist.savedAgo': 'Saved {min} min ago',
  'persist.savedJustNow': 'Saved just now',
  'persist.history': 'Version history',
  'persist.historyEmpty': 'No saved versions yet.',
  'persist.restore': 'Restore',
  'persist.largeFilesSkipped': 'Files larger than 20 MB are not kept in the history.',
}
