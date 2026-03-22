import prisma from "../utils/prisma";
import { isValidTransition } from "../utils/workflow";
// NOTE: isValidTransition is now async and takes columnIds, not status strings
import { createNotification } from "./notificationService";
import { checkWipLimit } from "./columnService";
import { requireProjectAccess, requireWriteAccess, getMembership } from "./permissionService";
import { logAudit } from "../utils/audit";
import { getProjectIdFromColumn, getProjectIdFromBoard } from "../utils/resolvers";

export async function createTask(
    callerId: string,    //callerid is the one performing the action
    title: string,
    description: string | null,
    columnId: string | null, //null for stories
    boardId: string | null, //null for tasks and bugs
    priority: string,
    type: string, //"story " or "bug" or "task"
    dueDate: Date | null,
    assigneeId: string | null,
    reporterId: string,
    parentId: string | null,
) {
    // Validate type
    const validTypes = ["story", "task", "bug"];
    if (!validTypes.includes(type)) {
        throw new Error(`INVALID_TYPE: must be one of ${validTypes.join(", ")}`);
    }
    let projectId: string;
    if (type === "story") {
        // Stories live on a board, not inside a column
        if (!boardId) throw new Error("INVALID: Stories require a boardId");
        if (columnId) throw new Error("INVALID: Stories do not belong to a column");
        if (parentId) throw new Error("INVALID: Stories cannot have a parent task");

        projectId = await getProjectIdFromBoard(boardId);
    } else {
        // Tasks and Bugs live inside a column
        if (!columnId) throw new Error("INVALID: Tasks and Bugs require a columnId");
        if (boardId) throw new Error("INVALID: Only Stories use boardId");

        // If linked to a parent, it must be a Story
        if (parentId) {
            const parent = await prisma.task.findUnique({ where: { id: parentId } });
            if (!parent) throw new Error("NOT_FOUND: Parent task not found");
            if (parent.type !== "story") {
                throw new Error("INVALID: Only Stories can be parent tasks");
            }
        }

        // Check WIP limit — only applies to columns
        const hasRoom = await checkWipLimit(columnId);
        if (!hasRoom) {
            throw new Error("WIP_LIMIT_REACHED: Cannot create more tasks in this column");
        }

        projectId = await getProjectIdFromColumn(columnId);
    }
    // Auth checked BEFORE WIP limit — a viewer must get FORBIDDEN,
    // not WIP_LIMIT_REACHED, regardless of how full the column is.
    await requireWriteAccess(callerId, projectId);

    // WIP limit only applies to columns (Tasks and Bugs), not Stories
    if (type !== "story") {
        const hasRoom = await checkWipLimit(columnId!);
        if (!hasRoom) {
            throw new Error("WIP_LIMIT_REACHED: Cannot create more tasks in this column");
        }
    }

    const task = await prisma.task.create({
        data: {
            title,
            description,
            type,
            columnId: type === "story" ? null : columnId,
            boardId: type === "story" ? boardId : null,
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
    await logAudit(task.id, callerId, "TASK_CREATED", null, title);
    return task;
}
/**returns all tasks in a column (tasks and bugs only not stories) */
export async function getTasksByColumn(callerId: string, columnId: string) {
    const projectId = await getProjectIdFromColumn(columnId);
    await requireProjectAccess(callerId, projectId);

    return prisma.task.findMany({
        where: { columnId },
        include: {
            assignee: true,
            reporter: true,
        },
    });
}
/** Returns all Stories for a board, each with their children */
export async function getStoriesByBoard(callerId: string, boardId: string) {
    const projectId = await getProjectIdFromBoard(boardId);
    await requireProjectAccess(callerId, projectId);

    return prisma.task.findMany({
        where: { boardId, type: "story" },
        include: {
            children: {
                include: { assignee: true }
            }
        },
        orderBy: { createdAt: "asc" }
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

    // Stories have boardId, Tasks/Bugs have columnId — resolve projectId accordingly
    let projectId: string;
    if (task.type === "story") {
        if (!task.boardId) throw new Error("CORRUPT: Story is missing boardId");
        projectId = await getProjectIdFromBoard(task.boardId);
    } else {
        if (!task.columnId) throw new Error("CORRUPT: Task is missing columnId");
        projectId = await getProjectIdFromColumn(task.columnId);
    }
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
        description: string | null;
        priority: string;
        assigneeId: string | null;
        dueDate: Date | null;
    }>
) {
    const existing = await prisma.task.findUnique({ where: { id: taskId } });
    if (!existing) throw new Error("NOT_FOUND: Task not found");

    // Resolve projectId depending on whether it's a Story or Task/Bug
    let projectId: string;
    if (existing.type === "story") {
        if (!existing.boardId) throw new Error("CORRUPT: Story is missing boardId");
        projectId = await getProjectIdFromBoard(existing.boardId);
    } else {
        if (!existing.columnId) throw new Error("CORRUPT: Task is missing columnId");
        projectId = await getProjectIdFromColumn(existing.columnId);
    }
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
        await logAudit(taskId, callerId, "ASSIGNEE_CHANGE", existing.assigneeId ?? "unassigned", updates.assigneeId ?? "unassigned");
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
/** Deletes a task. Blocks deletion of a Story that still has children. */
export async function deleteTask(callerId: string, taskId: string) {
    const existing = await prisma.task.findUnique({
        where: { id: taskId },
        include: { children: true },
    });
    if (!existing) throw new Error("NOT_FOUND: Task not found");

    // Resolve projectId
    let projectId: string;
    if (existing.type === "story") {
        if (!existing.boardId) throw new Error("CORRUPT: Story is missing boardId");
        projectId = await getProjectIdFromBoard(existing.boardId);
    } else {
        if (!existing.columnId) throw new Error("CORRUPT: Task is missing columnId");
        projectId = await getProjectIdFromColumn(existing.columnId);
    }

    await requireWriteAccess(callerId, projectId);

    // Design decision: deleting a Story makes its child Tasks/Bugs standalone
    // (parentId set to null) rather than deleting them. This preserves all
    // work — no data loss if a story is accidentally deleted.
    if (existing.type === "story" && existing.children.length > 0) {
        await prisma.task.updateMany({
            where: { parentId: taskId },
            data: { parentId: null },
        });
    }

    await prisma.task.delete({ where: { id: taskId } });

    // If a Task/Bug with a parent was deleted, re-derive the Story's status
    // since one of its children is now gone
    if (existing.parentId) {
        await deriveStoryStatus(existing.parentId);
    }
}
/**moves a task to a different column and updates its status */
export async function moveTask(
    callerId: string,
    taskId: string,
    newColumnId: string,
) {
    const existing = await prisma.task.findUnique({ where: { id: taskId } });
    if (!existing) throw new Error("NOT_FOUND: Task not found");
    if (!existing.columnId) throw new Error("CORRUPT: Task is missing columnId");
    const projectId = await getProjectIdFromColumn(existing.columnId);
    await requireWriteAccess(callerId, projectId);

    // Stories are not directly movable across columns
    if (existing.type === "story") {
        throw new Error("INVALID: Stories cannot be moved directly across columns");
    }
    if (!existing.columnId) {
        throw new Error("CORRUPT: Task is missing columnId");
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
    // FIX 3: Use board-configured resolvedColumnId and closedColumnId
    // instead of hardcoding "last column = resolved". Project Admin sets
    // these via PATCH /api/boards/:boardId/timestamp-columns.
    const board = await prisma.board.findUnique({
        where: { id: destColumn.boardId },
        select: { resolvedColumnId: true, closedColumnId: true },
    });
    // Set resolvedAt when task enters the configured resolved column (first time only).
    // Clear it if the task moves back out of that column.
    const resolvedAt =
        board?.resolvedColumnId === newColumnId
            ? (existing.resolvedAt ?? new Date())
            : board?.resolvedColumnId !== null && board?.resolvedColumnId !== undefined
                ? null
                : existing.resolvedAt;

    // Set closedAt when task enters the configured closed column (first time only).
    // Clear it if the task moves back out of that column.
    const closedAt =
        board?.closedColumnId === newColumnId
            ? (existing.closedAt ?? new Date())
            : board?.closedColumnId !== null && board?.closedColumnId !== undefined
                ? null
                : existing.closedAt;

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
    await logAudit(taskId, callerId, "STATUS_CHANGE", existing.status, newStatus);

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

    // If all children were deleted, reset story to "To Do"
    if (children.length === 0) {
        await prisma.task.update({
            where: { id: storyId },
            data: { status: "To Do" },
        });
        return;
    }

    const childrenWithColumn = children.filter(
        (c): c is typeof c & { column: NonNullable<typeof c.column> } =>
            c.column !== null
    );
    if (childrenWithColumn.length === 0) return;

    // Get all columns of the board this story's children live on,
    // sorted by order so we can reason about position (first, last, furthest)
    const firstCol = childrenWithColumn[0]?.column;
    if (!firstCol) return;
    const boardId = firstCol.boardId;
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
        const furthestChild = childrenWithColumn.reduce((furthest, child) => {
            return child.column!.order > furthest.column!.order ? child : furthest;
        });
        derivedStatus = furthestChild.column!.name;
    }

    await prisma.task.update({
        where: { id: storyId },
        data: { status: derivedStatus },
    });
}