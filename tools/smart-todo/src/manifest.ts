import type { ToolManifest } from '@onlydesk/shared-types'

export const manifest: ToolManifest = {
  id: 'smart-todo',
  name: 'Smart Todo',
  description: 'Type like a human — "gym at 7pm every Monday" — and get structured tasks, a weekly habit matrix, and streak analytics.',
  version: '0.1.0',
  category: 'planning',
  icon: { deskObject: 'pen', color: 'teal' },
  model: 'gemini-2.5-pro',
  contextScopes: ['todos'],
  actions: [
    {
      id: 'parse-todo',
      name: 'Parse natural-language todo',
      description: 'Parses a natural-language task into structured fields (title, date, time, recurrence, tags) and saves it.',
      execution: 'inline',
      input: {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'The natural-language task, e.g. "Add gym at 7pm every Monday"' },
        },
        required: ['text'],
      },
    },
  ],
  permissions: {
    read: ['todos'],
    write: ['todos'],
  },
  surfaces: {
    deskIcon: '@onlydesk/tool-smart-todo/ui#ToolDeskIcon',
    workspace: '@onlydesk/tool-smart-todo/ui#ToolWorkspace',
  },
}
