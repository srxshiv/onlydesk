import { Injectable, Logger } from '@nestjs/common'
import { env } from '../env'

export type RunAgentOptions = {
  model?: string
  instruction: string
  prompt: string
  tools?: unknown[]
}

export type RunAgentResult = { text: string; raw: unknown }

/**
 * Wraps Google ADK's LlmAgent / Runner. One place to swap models, attach
 * tracing, enforce budgets, and inject MCPToolsets coming from McpService.
 */
@Injectable()
export class AgentRunnerService {
  private readonly logger = new Logger(AgentRunnerService.name)

  async run(opts: RunAgentOptions): Promise<RunAgentResult> {
    const adk = (await import('@google/adk')) as {
      LlmAgent: new (config: { name: string; model: string; instruction: string; tools?: unknown[] }) => unknown
      Runner: new (agent: unknown) => { run: (input: string) => Promise<{ text: string }> }
    }

    const model = opts.model ?? env.GEMINI_DEFAULT_MODEL
    const agent = new adk.LlmAgent({
      name: 'onlydesk_tool_agent',
      model,
      instruction: opts.instruction,
      tools: opts.tools,
    })
    const runner = new adk.Runner(agent)
    const out = await runner.run(opts.prompt)
    return { text: out.text, raw: out }
  }
}
