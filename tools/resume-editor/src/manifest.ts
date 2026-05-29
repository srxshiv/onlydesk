import type { ToolManifest } from '@onlydesk/shared-types'

export const manifest: ToolManifest = {
  id: 'resume-editor',
  name: 'Resume Editor',
  description: 'Tailor a LaTeX resume to a specific job description using your work history and projects.',
  version: '0.1.0',
  category: 'professional',
  icon: { deskObject: 'notebook', color: 'amber' },
  model: 'gemini-2.5-pro',
  mcp: {
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@overleaf/mcp-server'],
    auth: 'oauth',
    requiredScopes: ['projects:read', 'projects:write'],
  },
  contextScopes: ['work_log', 'projects', 'skills', 'education', 'job_target'],
  actions: [
    {
      id: 'tailor-resume',
      name: 'Tailor resume to JD',
      description: 'Generate a LaTeX resume tailored to a given job description, grounded in your context store.',
      execution: 'queued',
      input: {
        type: 'object',
        properties: {
          jobTargetId: { type: 'string', description: 'ID of an existing job_target entry' },
          overleafProjectId: { type: 'string', description: 'Optional Overleaf project to push into' },
        },
        required: ['jobTargetId'],
      },
    },
  ],
  permissions: {
    read: ['work_log', 'projects', 'skills', 'education', 'job_target'],
    write: [],
  },
  surfaces: {
    deskIcon: '@onlydesk/tool-resume-editor/surfaces/desk-icon',
    workspace: '@onlydesk/tool-resume-editor/surfaces/workspace',
  },
}
