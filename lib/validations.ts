import { z } from "zod";
import { isValidObjectId } from "@/lib/utils";
import { TASK_STATUSES, TASK_PRIORITIES } from "@/lib/types";

export const projectSchema = z.object({
    name: z.string().min(1, "Project name is required").max(100),
    description: z.string().max(500).optional(),
});

export const taskSchema = z.object({
    title: z.string().min(1, "Task title is required").max(200),
    description: z.string().max(2000).optional(),
    project: z.string().refine(isValidObjectId, { message: "Invalid project ID" }),
    assigneeId: z.string().optional(),
    status: z.enum(TASK_STATUSES).optional(),
    priority: z.enum(TASK_PRIORITIES).optional(),
    dueDate: z.string().optional(),
});

export const taskUpdateSchema = taskSchema.partial().omit({ project: true }).extend({
    order: z.number().optional(),
    assigneeId: z.string().nullable().optional(),
    dueDate: z.string().nullable().optional(),
}).refine(
    (data) => Object.values(data).some((v) => v !== undefined),
    { message: "At least one field must be provided" }
);

export const invitationSchema = z.object({
    projectId: z.string().min(1, "Project ID is required"),
    email: z.string().email("Invalid email address"),
});

export const userUpdateSchema = z.object({
    firstName: z.string().min(1).max(50).optional(),
    lastName: z.string().max(50).optional(),
}).refine(
    (data) => data.firstName !== undefined || data.lastName !== undefined,
    { message: "At least one field (firstName or lastName) is required" }
);

export const projectUpdateSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
}).refine(
    (data) => data.name !== undefined || data.description !== undefined,
    { message: "At least one field (name or description) is required" }
);