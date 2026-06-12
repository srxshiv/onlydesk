# Building a Tool

This walks through building a new tool from scratch. Copy `tools/resume-editor` as your starting template.

## 1. Create the package

```
tools/my-tool/
├── package.json          # name: @onlydesk/tool-my-tool
├── tsconfig.json
└── src/
    ├── manifest.ts       # the ToolManifest export
    ├── handlers/         # one file per action
    ├── surfaces/         # React components for desk-icon + workspace
    └── index.ts          # defineTool({ manifest, handlers })
```

## 2. Write the manifest

```ts
// src/manifest.ts
import type { ToolManifest } from '@onlydesk/shared-types'

export const manifest: ToolManifest = {
  id: 'tweet-writer',
  name: 'Tweet Writer',
  description: 'Draft tweets grounded in your work log, in your voice.',
  version: '0.1.0',
  category: 'creative',
  icon: { deskObject: 'frame', color: 'sky' },
  model: 'gemini-2.5-pro',
  contextScopes: ['work_log', 'social_voice'],
  actions: [
    {
      id: 'draft',
      name: 'Draft a tweet',
      description: 'Suggest 3 tweets based on recent work.',
      execution: 'inline',
      input: {
        type: 'object',
        properties: { topic: { type: 'string' } },
        required: ['topic'],
      },
    },
  ],
  permissions: { read: ['work_log', 'social_voice'], write: [] },
  surfaces: {
    deskIcon: '@onlydesk/tool-tweet-writer/surfaces/desk-icon',
    workspace: '@onlydesk/tool-tweet-writer/surfaces/workspace',
  },
}
```

**Invariants checked at registration time:**

- Every `contextScopes` entry must appear in `permissions.read`.
- Every action `id` must have a matching handler.
- Manifest must satisfy `ToolManifestSchema` (Zod).

If any fails, the API refuses to start. That's intentional.

## 3. Write a handler

```ts
// src/handlers/draft.ts
import type { ActionHandler } from '@onlydesk/tools-sdk'

type Scopes = 'work_log' | 'social_voice'

export const draft: ActionHandler<Scopes> = async ({ input, ctx, runAgent }) => {
  const [workLog, voice] = await Promise.all([
    ctx.read('work_log', { limit: 20 }),
    ctx.read('social_voice', { limit: 30 }),
  ])
  const agent = await runAgent({
    instruction: 'Write 3 tweets matching the given voice samples and grounded in the work log.',
    prompt: JSON.stringify({ topic: input.topic, workLog, voice }, null, 2),
  })
  return { tweets: agent.text.split('\n\n').filter(Boolean) }
}
```

What you get in `ActionContext`:

- `userId` — the caller's id.
- `input` — the validated action input.
- `ctx.read(scope, opts)` — typed read, refuses scopes not declared.
- `ctx.write(scope, entry)` — typed write, requires the scope in `permissions.write`.
- `ctx.summarize(scope)` — rolling summary string.
- `runAgent({ model?, instruction, prompt, tools? })` — fires the ADK runner.
- `getMcpToolset()` — builds the manifest's MCP server as an ADK `MCPToolset`.
- `toolConfig` — per-user config saved on the install row (tokens, project IDs).
- `stream(chunk)` — push partial output to the caller (used by SSE/WS in Phase 2).

## 4. Export `defineTool`

```ts
// src/index.ts
import { defineTool } from '@onlydesk/tools-sdk'
import { manifest } from './manifest.js'
import { draft } from './handlers/draft.js'

export const tweetWriterTool = defineTool({
  manifest,
  handlers: { draft },
})
```

## 5. Register it in the API

In `apps/api/src/tools/tools.module.ts`:

```ts
import { tweetWriterTool } from '@onlydesk/tool-tweet-writer'
// ...
onModuleInit() {
  this.registry.register(resumeEditorTool)
  this.registry.register(tweetWriterTool)   // <-- add
}
```

That's it. The desk auto-discovers it via `/tools/available`; users can install it.

## 6. Build the surfaces

`desk-icon.tsx` — the object on the desk. Keep it small, recognizable.
`workspace.tsx` — the focused view. Be clean. The desk metaphor is the home — the workspace is where work happens.

Both are loaded by the web app via dynamic `import()`. Register the workspace in `apps/web/src/app/desk/[toolId]/page.tsx` so the dispatch table knows about it (until we land a fully dynamic loader in Phase 3).

## Rules of thumb

- **Never reach into the database from a tool.** Always go through `ctx`. The next person reading the code needs to be able to see, from the manifest alone, what scopes the tool touches.
- **Declare the minimum scopes.** Removing a scope later breaks user trust ("why is this tool reading my health log now?"); adding one is fine.
- **Pick execution mode honestly.** If the action calls `runAgent` and waits for MCP tools, it is `queued`. If it transforms input and returns, it is `inline`.
