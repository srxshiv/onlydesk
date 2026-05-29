import { Injectable, Logger } from '@nestjs/common'
import type { ToolMcpConfig } from '@onlydesk/shared-types'

/**
 * Thin adapter around Google ADK's MCPToolset. Each tool declares its MCP
 * config in its manifest; this service materializes it into an MCPToolset
 * the ADK agent can use as a tool.
 *
 * NOTE: ADK's TS package (`@google/adk`) exposes `MCPToolset` directly — this
 * service centralizes connection/auth concerns so tools don't each reinvent
 * env handling, OAuth token loading, etc.
 */
@Injectable()
export class McpService {
  private readonly logger = new Logger(McpService.name)

  async buildToolset(config: ToolMcpConfig, perUserEnv: Record<string, string> = {}): Promise<unknown> {
    // Lazy require to avoid pulling ADK into modules that don't need agents.
    const adk = (await import('@google/adk')) as { MCPToolset: new (opts: unknown) => unknown }
    const env = { ...(config.env ?? {}), ...perUserEnv }

    if (config.transport === 'stdio') {
      if (!config.command) throw new Error(`MCP config for transport=stdio requires "command"`)
      return new adk.MCPToolset({
        type: 'StdioConnectionParams',
        serverParams: { command: config.command, args: config.args ?? [], env },
      })
    }

    if (config.transport === 'sse' || config.transport === 'http') {
      if (!config.serverUrl) throw new Error(`MCP config for transport=${config.transport} requires "serverUrl"`)
      return new adk.MCPToolset({
        type: config.transport === 'sse' ? 'SseConnectionParams' : 'HttpConnectionParams',
        serverParams: { url: config.serverUrl, headers: perUserEnv },
      })
    }

    throw new Error(`Unsupported MCP transport: ${String(config.transport)}`)
  }
}
