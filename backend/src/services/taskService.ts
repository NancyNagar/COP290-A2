import prisma from "../utils/prisma";
import { isValidTransition } from "../utils/workflow";
// NOTE: isValidTransition is now async and takes columnIds, not status strings
import { createNotification } from "./notificationService";
import { checkWipLimit } from "./columnService";
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

/**updates a task,used for
 * editing fileds
 * manually setting story status
 * changing assignee
 */

export async function updateTask(
    callerId: string,
    taskId: string,
    updates: Partial<{
        title: string;
        description: string;
        priority: string;
        assigneeId: string;
        dueDate: Date;
        status: string;
    }>
) {
    const existing = await prisma.task.findUnique({ where: { id: taskId } });
    if (!existing) throw new Error("NOT_FOUND: Task not found");

    const projectId = await getProjectIdFromColumn(existing.columnId);
    await requireWriteAccess(callerId, projectId);

    if (updates.status !== undefined) {
        if (existing.type !== "story") {
            throw new Error(
                "INVALID: Only Story status can be set manually. Tasks and Bugs derive status from their column."
            );
        }

        // Validate: the requested status must be a column name that exists on
        // the same board, so it is a real workflow state.
        const sourceColumn = await prisma.column.findUnique({
            where: { id: existing.columnId },
            include: { board: { include: { columns: true } } },
        });
        if (!sourceColumn) throw new Error("NOT_FOUND: Column not found");

        const validStatuses = sourceColumn.board.columns.map((c) => c.name);
        if (!validStatuses.includes(updates.status)) {
            throw new Error(
                `INVALID: Story status must be one of the board's column names: ${validStatuses.join(", ")}`
            );
        }
        // Consistency check: manually set status must be compatible with children.
        // Rule: the Story cannot be set to a status that is "further ahead" than
        // ALL of its children, and cannot be set to "done" (last column) while
        // any child is not in the last column.
        const children = await prisma.task.findMany({
            where: { parentId: taskId },
            include: { column: true },
        });

        if (children.length > 0) {
            const boardColumns = sourceColumn.board.columns.sort(
                (a, b) => a.order - b.order
            );//sort columns based on order becoause workflow is defined by order
            const lastColumnName = boardColumns[boardColumns.length - 1]?.name;
            const requestedOrder = boardColumns.findIndex(
                (c) => c.name === updates.status
            );//index of the requested status
            //max index of the children
            //gives most advanced child
            const maxChildOrder = Math.max(
                ...children.map((ch) =>
                    boardColumns.findIndex((c) => c.name === ch.column.name)
                )
            );

            // Cannot mark the story as done if any child isn't done
            if (
                updates.status === lastColumnName &&
                children.some((ch) => ch.column.name !== lastColumnName)
            ) {
                throw new Error(
                    "INVALID: Cannot mark Story as done while it still has incomplete children"
                );
            }

            // Cannot set story behind all children (e.g., "To Do" when all are "Done")
            if (requestedOrder < maxChildOrder - 1) {
                throw new Error(
                    "INVALID: Story status cannot be set behind its most advanced child's status"
                );
            }
        }

        // Audit the manual status change
        await prisma.auditLog.create({
            data: {
                action: "STATUS_CHANGE",
                oldValue: existing.status,
                newValue: updates.status,
                taskId,
                userId: callerId,
            },
        });
    }
    //update task in db
    const task = await prisma.task.update({
        where: { id: taskId },
        data: updates,
    });

    // Audit: assignee changed
    const newAssigneeId = updates.assigneeId;
    if (
        newAssigneeId !== undefined &&
        newAssigneeId !== existing.assigneeId
    ) {
        await prisma.auditLog.create({
            data: {
                action: "ASSIGNEE_CHANGE",
                oldValue: existing.assigneeId ?? "unassigned",
                newValue: newAssigneeId ?? "unassigned",
                taskId,
                userId: callerId,
            },
        });
        //also notify new assignee
        if (newAssigneeId) {
            await createNotification(
                newAssigneeId,
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
) {
    const existing = await prisma.task.findUnique({ where: { id: taskId } });
    if (!existing) throw new Error("NOT_FOUND: Task not found");

    const projectId = await getProjectIdFromColumn(existing.columnId);
    await requireWriteAccess(callerId, projectId);

    // Stories are not directly movable across columns
    if (existing.type === "story") {
        throw new Error("INVALID: Stories cannot be moved directly across columns");
    }

    // Validate the transition using allowedNextColumns on the source column
    const validMove = await isValidTransition(existing.columnId, newColumnId);
    if (!validMove) {
        throw new Error(
            `INVALID_TRANSITION: Move from current column to target column is not allowed`
        );
    }

    // Fetch destination column to get its name (which becomes the new status)
    const destColumn = await prisma.column.findUnique({
        where: { id: newColumnId },
    });
    if (!destColumn) throw new Error("NOT_FOUND: Destination column not found");

    // Status always mirrors the column name — no separate newStatus needed
    const newStatus = destColumn.name;

    // Enforce WIP limit on the destination column
    if (destColumn.wipLimit !== null && destColumn.wipLimit !== undefined) {
        const count = await prisma.task.count({ where: { columnId: newColumnId } });
        if (count >= destColumn.wipLimit) {
            throw new Error(
                `WIP_LIMIT: Column "${destColumn.name}" is at its WIP limit (${destColumn.wipLimit})`
            );
        }
    }

    // Determine if destination is the last column on this board (terminal column)
    // regardless of its name — last by order = "done" column
    const boardColumns = await prisma.column.findMany({
        where: { boardId: destColumn.boardId },
        orderBy: { order: "asc" },
        select: { id: true },
    });
    const isLastColumn = boardColumns[boardColumns.length - 1]?.id === newColumnId;

    // Set resolvedAt the first time a task reaches the terminal (last) column
    const resolvedAt = isLastColumn
        ? (existing.resolvedAt ?? new Date())
        : existing.resolvedAt;
    // closedAt is not tied to a column name — keep as-is
    const closedAt = existing.closedAt;

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

    // If this task belongs to a Story, derive and update the Story's status
    if (existing.parentId) {
        await deriveStoryStatus(existing.parentId);
    }

    return updatedTask;
}

/**
 * Derives the parent Story's status from its children's positions on the board.
 *
 * We use column ORDER (position) not column name — so this works for any
 * custom board layout, not just default "To Do / In Progress / Done" columns.
 *
 * Logic:
 *   - All children are in the LAST column  → Story gets the last column's name
 *   - All children are in the FIRST column → Story gets the first column's name
 *   - Mixed / some in middle columns       → Story gets the furthest child's column name
 *
 * Story's status is a plain string — Stories are shown in a separate panel,
 * not inside a column, so no columnId update is needed.
 */
async function deriveStoryStatus(storyId: string): Promise<void> {
    const children = await prisma.task.findMany({
        where: { parentId: storyId },
        include: { column: true },
    });

    const firstChild = children[0];
    if (!firstChild || !firstChild.column) return; // no children or missing column, nothing to derive

    // Get all columns of the board this story's children live on,
    // sorted by order so we can reason about position (first, last, furthest)
    const boardId = firstChild.column.boardId;
    const boardColumns = await prisma.column.findMany({
        where: { boardId },
        orderBy: { order: "asc" },
    });

    const firstColumn = boardColumns[0];
    const lastColumn = boardColumns[boardColumns.length - 1];

    if (!firstColumn || !lastColumn) return;

    // Check if all children have reached the terminal (last) column
    const allInLastColumn = children.every((c) => c.columnId === lastColumn.id);

    // Check if all children are still in the first column
    const allInFirstColumn = children.every((c) => c.columnId === firstColumn.id);

    let derivedStatus: string;

    if (allInLastColumn) {
        // Every child is done — story is done
        derivedStatus = lastColumn.name;
    } else if (allInFirstColumn) {
        // Nothing has started yet
        derivedStatus = firstColumn.name;
    } else {
        // Find the child that is furthest along (highest column order)
        // and use that column's name as the story status
        const furthestChild = children.reduce((furthest, child) => {
            const childOrder = child.column.order;
            const furthestOrder = furthest.column.order;
            return childOrder > furthestOrder ? child : furthest;
        });
        derivedStatus = furthestChild.column.name;
    }

    await prisma.task.update({
        where: { id: storyId },
        data: { status: derivedStatus },
    });
}