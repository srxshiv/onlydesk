import type { ToolManifest } from '@onlydesk/shared-types'

export const manifest: ToolManifest = {
  id: 'resume-editor',
  name: 'Resume Editor',
  description: 'Paste a job description; get a tailored LaTeX resume grounded in your work history, with a diff of every change it made.',
  version: '0.2.0',
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
      description: 'Reads the pasted job description, compares it against your granted context, and generates tailored LaTeX plus a change diff.',
      execution: 'queued',
      input: {
        type: 'object',
        properties: {
          jobDescription: { type: 'string', description: 'The full job description text' },
          filename: { type: 'string', description: 'Output Profile target filename (e.g. resume.pdf)' },
        },
        required: ['jobDescription'],
      },
    },
  ],
  permissions: {
    read: ['work_log', 'projects', 'skills', 'education', 'job_target'],
    write: [],
  },
  surfaces: {
    deskIcon: '@onlydesk/tool-resume-editor/ui#ToolDeskIcon',
    workspace: '@onlydesk/tool-resume-editor/ui#ToolWorkspace',
  },
}
