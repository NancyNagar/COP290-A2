import prisma from "../utils/prisma";
import { isValidTransition } from "../utils/workflow";
import { createNotification } from "./notificationService";
import { checkWipLimit } from "./coloumService";
const GLOBAL_ADMIN = "admin";
const PROJECT_VIEWER = "project_viewer";

/**
 * fetches the projectId that a column belongs to.
 * Throws if the column doesn't exist.
 */
async function getProjectIdFromColumn(columnId: string): Promise<string> {
    const column = await prisma.column.findUnique({
        where: { id: columnId },
        include: { board: true },
    });
    if (!column) throw new Error("NOT_FOUND: Column not found");
    return column.board.projectId;
}

/**
 * Returns the caller's project-level membership, or null if they have none.
 * Global Admins bypass project membership entirely.
 */
async function getMembership(userId: string, projectId: string) {
    const caller = await prisma.user.findUnique({ where: { id: userId } });
    if (!caller) throw new Error("FORBIDDEN: User not found");
    if (caller.role === GLOBAL_ADMIN) return null; // global admin — always allowed
    const membership = await prisma.projectMember.findFirst({
        where: { userId, projectId },
    });
    return membership;
}
/**
 * Throws FORBIDDEN unless the caller is a Global Admin or has ANY membership
 * in the project (project_admin, project_member, project_viewer).
 * Used for read operations.
 */
async function requireProjectAccess(
    callerId: string,
    projectId: string
): Promise<void> {
    const membership = await getMembership(callerId, projectId);
    if (membership === null) return; // global admin
    if (!membership) {
        throw new Error("FORBIDDEN: You are not a member of this project");
    }
}

/**
 * Throws FORBIDDEN unless the caller is a Global Admin or a project_admin /
 * project_member. Project Viewers are read-only.
 * Used for write operations (create, update, delete, move).
 */
async function requireWriteAccess(
    callerId: string,
    projectId: string
): Promise<void> {
    const membership = await getMembership(callerId, projectId);
    if (membership === null) return; // global admin
    if (!membership) {
        throw new Error("FORBIDDEN: You are not a member of this project");
    }
    if (membership.role === PROJECT_VIEWER) {
        throw new Error("FORBIDDEN: Project Viewers cannot modify tasks");
    }
}

export async function createTask(
    callerId: string,    //callerid is the one performing the action
    title: string,
    description: string | null,
    columnId: string,
    priority: string,
    type: string, //"story " or "bug" or "task"
    dueDate: Date | null,
    assigneeId: string | null,
    reporterId: string,
    parentId: string | null,
) {
    const projectId = await getProjectIdFromColumn(columnId);
    await requireWriteAccess(callerId, projectId);

    // Validate type
    const validTypes = ["story", "task", "bug"];
    if (!validTypes.includes(type)) {
        throw new Error(`INVALID_TYPE: must be one of ${validTypes.join(", ")}`);
    }

    // Stories cannot have a parentId (they are top-level)
    if (type === "story" && parentId) {
        throw new Error("INVALID: Stories cannot have a parent task");
    }

    // Tasks and Bugs linked to a parent must belong to a Story
    if (parentId) {
        const parent = await prisma.task.findUnique({ where: { id: parentId } });
        if (!parent) throw new Error("NOT_FOUND: Parent task not found");
        if (parent.type !== "story") {
            throw new Error("INVALID: Only Stories can be parent tasks");
        }
    }
    // Check WIP limit for the target column
    const hasWipLimit = await checkWipLimit(columnId);
    if (!hasWipLimit) {
        throw new Error("WIP_LIMIT_REACHED: Cannot create more tasks in this column");
    }


    const task = await prisma.task.create({
        data: {
            title,
            description,
            type,
            columnId,
            priority,
            status: "To Do", //default status for a new task is "To Do"
            dueDate,
            assigneeId,
            reporterId,
            parentId,
        }
    });
    // Create notification for assignee if assigneeId is provided
    if (assigneeId) {
        await createNotification(
            assigneeId,
            `You have been assigned a new ${type}: ${title}`
        );
    }
    //stores activity history of the task
    await prisma.auditLog.create({
        data: {
            action: "TASK_CREATED",
            newValue: title,
            taskId: task.id,
            userId: callerId,
        }
    });
    return task;
}
/**returns all tasks in a column */
export async function getTasksByColumn(callerId: string, columnId: string) {
    const projectId = await getProjectIdFromColumn(columnId);
    await requireProjectAccess(callerId, projectId);

    return prisma.task.findMany({
        where: { columnId },
        include: {
            assignee: true,
            reporter: true,
            children: true,   // include child tasks for Stories
        },
    });
}

/**fetch single task by id */
export async function getTaskById(callerId: string, taskId: string) {
    const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: {
            assignee: true,
            reporter: true,
            comments: { include: { user: true } },
            audits: { include: { user: true } },
            children: true,
            parent: true,
        },
    });
    if (!task) throw new Error("NOT_FOUND: Task not found");

    const projectId = await getProjectIdFromColumn(task.columnId);
    await requireProjectAccess(callerId, projectId);

    return task;
}

/**updates a task */
export async function updateTask(
    callerId: string,
    taskId: string,
    updates: Partial<{
        title: string;
        description: string;
        priority: string;
        assigneeId: string;
        dueDate: Date;
    }>
) {
    const existing = await prisma.task.findUnique({ where: { id: taskId } });
    if (!existing) throw new Error("NOT_FOUND: Task not found");

    const projectId = await getProjectIdFromColumn(existing.columnId);
    await requireWriteAccess(callerId, projectId);

    const task = await prisma.task.update({
        where: { id: taskId },
        data: updates,
    });

    // Audit: assignee changed
    if (
        updates.assigneeId !== undefined &&
        updates.assigneeId !== existing.assigneeId
    ) {
        await prisma.auditLog.create({
            data: {
                action: "ASSIGNEE_CHANGE",
                oldValue: existing.assigneeId ?? "unassigned",
                newValue: updates.assigneeId ?? "unassigned",
                taskId,
                userId: callerId,
            },
        });
        //also notify new assignee
        if (updates.assigneeId) {
            await createNotification(
                updates.assigneeId,
                `You were assigned task: ${existing.title}`
            );
        }
    }

    return task;
}
/**deletes a task */
export async function deleteTask(callerId: string, taskId: string) {
    const existing = await prisma.task.findUnique({
        where: { id: taskId },
        include: { children: true },
    });
    if (!existing) throw new Error("NOT_FOUND: Task not found");

    const projectId = await getProjectIdFromColumn(existing.columnId);
    await requireWriteAccess(callerId, projectId);

    // Prevent deleting a Story that still has children
    if (existing.type === "story" && existing.children.length > 0) {
        throw new Error(
            "INVALID: Cannot delete a Story that still has child tasks. Remove or reassign them first."
        );
    }

    await prisma.task.delete({ where: { id: taskId } });
}
/**moves a task to a different column and updates its status */
export async function moveTask(
    callerId: string,
    taskId: string,
    newColumnId: string,
    newStatus: string
) {
    const existing = await prisma.task.findUnique({ where: { id: taskId } });
    if (!existing) throw new Error("NOT_FOUND: Task not found");

    const projectId = await getProjectIdFromColumn(existing.columnId);
    await requireWriteAccess(callerId, projectId);

    // Stories are not directly movable across columns
    if (existing.type === "story") {
        throw new Error("INVALID: Stories cannot be moved directly across columns");
    }

    // Validate the status transition
    if (!isValidTransition(existing.status, newStatus)) {
        throw new Error(
            `INVALID_TRANSITION: Cannot move from "${existing.status}" to "${newStatus}"`
        );
    }

    // Enforce WIP limit on the destination column
    const destColumn = await prisma.column.findUnique({
        where: { id: newColumnId },
    });
    if (!destColumn) throw new Error("NOT_FOUND: Destination column not found");

    if (destColumn.wipLimit !== null && destColumn.wipLimit !== undefined) {
        const count = await prisma.task.count({ where: { columnId: newColumnId } });
        if (count >= destColumn.wipLimit) {
            throw new Error(
                `WIP_LIMIT: Column "${destColumn.name}" is at its WIP limit (${destColumn.wipLimit})`
            );
        }
    }

    // Set resolved/closed timestamps when entering terminal statuses
    const resolvedAt =
        newStatus === "Done" ? (existing.resolvedAt ?? new Date()) : existing.resolvedAt;
    const closedAt =
        newStatus === "Closed" ? (existing.closedAt ?? new Date()) : existing.closedAt;

    const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: {
            columnId: newColumnId,
            status: newStatus,
            resolvedAt,
            closedAt,
        },
    });

    // Audit: status changed
    await prisma.auditLog.create({
        data: {
            action: "STATUS_CHANGE",
            oldValue: existing.status,
            newValue: newStatus,
            taskId,
            userId: callerId,
        },
    });

    // Notify assignee of status change
    if (existing.assigneeId) {
        await createNotification(
            existing.assigneeId,
            `Task "${existing.title}" status changed to ${newStatus}`
        );
    }

    return updatedTask;
}