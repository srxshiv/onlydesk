/** Shared BullMQ queue names so producers and consumers cannot drift. */
export const TOOL_ACTIONS_QUEUE = 'tool-actions'
export const TOOL_ACTIONS_DLQ = 'tool-actions-dlq'

/** The single job name used on the tool-actions queue. */
export const INVOKE_JOB = 'invoke'
