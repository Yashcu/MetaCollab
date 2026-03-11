export const TASK_STATUSES = ["todo", "in-progress", "done"] as const;
export type TaskStatus = typeof TASK_STATUSES[number];

export const TASK_PRIORITIES = ["low", "medium", "high"] as const;
export type TaskPriority = typeof TASK_PRIORITIES[number];

export const PROJECT_ROLES = ["owner", "admin", "member"] as const;
export type ProjectRole = typeof PROJECT_ROLES[number];

export const INVITATION_STATUSES = ["pending", "accepted", "declined", "expired"] as const;
export type InvitationStatus = typeof INVITATION_STATUSES[number];
