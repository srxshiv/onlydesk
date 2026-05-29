import { defineTool } from '@onlydesk/tools-sdk'
import { manifest } from './manifest.js'
import { tailorResume } from './handlers/tailor-resume.js'

export const resumeEditorTool = defineTool({
  manifest,
  handlers: {
    'tailor-resume': tailorResume,
  },
})

export { manifest }
