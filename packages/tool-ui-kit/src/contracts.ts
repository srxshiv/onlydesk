import type { ComponentType } from 'react'
import type { ToolManifest } from '@onlydesk/shared-types'

/**
 * The standardized UI contract every tool package exports from `./ui`:
 * exactly two components — the desk-widget surface and the expanded workspace.
 * The harness (apps/web) supplies the manifest; everything else the tool needs
 * comes from the kit's hooks via ToolHostProvider.
 */

export type WidgetSizeId = 'sm' | 'md' | 'lg'

export type ToolDeskIconProps = {
  manifest: ToolManifest
  /** Current widget size — render denser/looser accordingly. */
  size: WidgetSizeId
}

export type ToolWorkspaceProps = {
  manifest: ToolManifest
}

/** Shape of a tool package's `./ui` module. */
export type ToolUiModule = {
  ToolDeskIcon: ComponentType<ToolDeskIconProps>
  ToolWorkspace: ComponentType<ToolWorkspaceProps>
}
