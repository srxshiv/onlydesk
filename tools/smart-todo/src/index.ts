import { defineTool } from '@onlydesk/tools-sdk'
import { manifest } from './manifest.js'
import { parseTodo } from './handlers/parse-todo.js'

export const smartTodoTool = defineTool({
  manifest,
  handlers: {
    'parse-todo': parseTodo,
  },
})

export { manifest }
export type { ParsedTodo, ParseTodoOutput } from './handlers/parse-todo.js'
