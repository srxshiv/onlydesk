import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common'
import { env } from '../env'

export type RunAgentOptions = {
  model?: string
  instruction: string
  prompt: string
  tools?: unknown[]
  /**
   * Standard JSON Schema for structured output. When set, Gemini is forced to
   * emit JSON matching this shape (responseMimeType + responseJsonSchema), so
   * handlers can JSON.parse the reply without prose-stripping heuristics.
   */
  responseSchema?: Record<string, unknown>
}

export type RunAgentResult = { text: string; raw: unknown }

/** Minimal structural view of an ADK event — enough to pull text out. */
type AdkEventLike = { content?: { parts?: { text?: string }[] } }

/**
 * Runs Gemini 2.5 Pro through Google ADK (`LlmAgent` + `InMemoryRunner`).
 * One place to swap models, attach tracing, enforce budgets, and inject
 * MCPToolsets from McpService.
 *
 * No mock engine lives behind this service: when GOOGLE_API_KEY is missing or
 * the model fails, the error propagates as a typed, user-visible failure on
 * the invocation — never a silent fallback.
 */
@Injectable()
export class AgentRunnerService {
  private readonly logger = new Logger(AgentRunnerService.name)

  /** Whether a Gemini key is configured. */
  available(): boolean {
    return Boolean(env.GOOGLE_API_KEY)
  }

  async run(opts: RunAgentOptions): Promise<RunAgentResult> {
    if (!env.GOOGLE_API_KEY) {
      throw new ServiceUnavailableException('Gemini is not configured. Set GOOGLE_API_KEY in apps/api/.env and restart the API.')
    }
    // ADK's google-genai client reads the key from the environment.
    process.env.GOOGLE_API_KEY = env.GOOGLE_API_KEY

    const adk = await import('@google/adk')
    const model = opts.model ?? env.GEMINI_DEFAULT_MODEL

    const agent = new adk.LlmAgent({
      name: 'onlydesk_tool_agent',
      model,
      instruction: opts.instruction,
      ...(opts.responseSchema
        ? { generateContentConfig: { responseMimeType: 'application/json', responseJsonSchema: opts.responseSchema } }
        : {}),
      ...(opts.tools?.length ? { tools: opts.tools as never[] } : {}),
    })
    const runner = new adk.InMemoryRunner({ agent, appName: 'onlydesk' })

    const events: unknown[] = []
    let finalText = ''
    try {
      for await (const event of runner.runEphemeral({
        userId: 'onlydesk',
        newMessage: { parts: [{ text: opts.prompt }] },
      })) {
        events.push(event)
        const text = ((event as AdkEventLike).content?.parts ?? []).map((p) => p.text ?? '').join('')
        // Keep the latest non-empty model text; final responses overwrite partials.
        if (text.trim()) finalText = text
      }
    } catch (e) {
      const why = e instanceof Error ? e.message : String(e)
      this.logger.error(`Gemini run failed on ${model}: ${why}`)
      throw new ServiceUnavailableException(`Gemini request failed: ${why}`)
    }

    if (!finalText.trim()) {
      this.logger.warn(`Agent run on ${model} produced no text (${events.length} events)`)
      throw new ServiceUnavailableException('Gemini returned no output')
    }
    return { text: finalText, raw: events }
  }
}
