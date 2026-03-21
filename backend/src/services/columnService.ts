import prisma from "../utils/prisma";
import { getProjectIdFromBoard, getBoardIdFromColumn } from "../utils/resolvers";
import { requireAdminAccess, requireProjectAccess } from "./permissionService";
const GLOBAL_ADMIN = "admin";
const PROJECT_ADMIN = "project_admin";

/** Resolves projectId from boardId, then checks admin access. */
async function checkBoardAdminAccess(userId: string, boardId: string) {
  const projectId = await getProjectIdFromBoard(boardId);
  await requireAdminAccess(userId, projectId);
}

/** Same as above but starting from a columnId. */
async function checkColumnAdminAccess(userId: string, columnId: string) {
  const boardId = await getBoardIdFromColumn(columnId);
  await checkBoardAdminAccess(userId, boardId);
}
/**craetes a new column on a board at the given ordr position */
export async function createColumn(userId: string, boardId: string, name: string, order: number) {
  await checkBoardAdminAccess(userId, boardId);
  const column = await prisma.column.create({
    data: {
      name,
      boardId,
      order
    }
  });
  return column;
}
/**returns columns in ascending order */
export async function getColumns(userId: string, boardId: string) {
  const projectId = await getProjectIdFromBoard(boardId);
  await requireProjectAccess(userId, projectId);
  const columns = await prisma.column.findMany({
    where: { boardId },
    include: { tasks: true },
    orderBy: { order: "asc" } //order columns by their order field in ascending order so that they are returned in the correct order for display on the frontend
  });
  return columns;
}
/**renames a column */
export async function updateColumn(userId: string, columnId: string, name: string) {
  await checkColumnAdminAccess(userId, columnId);
  const column = await prisma.column.update({
    where: { id: columnId },
    data: { name }
  });
  return column;
}
/**deletes column by id */
export async function deleteColumn(userId: string, columnId: string) {
  await checkColumnAdminAccess(userId, columnId);
  await prisma.column.delete({
    where: { id: columnId }
  });
}
/**reorders column */
export async function reorderColumns(userId: string, boardId: string, orderedIds: string[]) {
  await checkBoardAdminAccess(userId, boardId);

  // Verify all column IDs actually belong to this board
  const columns = await prisma.column.findMany({
    where: { id: { in: orderedIds }, boardId },
    select: { id: true },
  });

  if (columns.length !== orderedIds.length) {
    throw new Error("FORBIDDEN: Some columns do not belong to this board");
  }
  const updates = orderedIds.map((id, index) =>
    prisma.column.update({
      where: { id },
      data: { order: index },
    })
  );
  return await prisma.$transaction(updates); //transaction ensures that all updates are applied or none are
}
/**updates WIP limits for a column
 * pass null to remove the limit entirely
 */
export async function updateWipLimit(
  userId: string,
  columnId: string,
  wipLimit: number | null
) {
  await checkColumnAdminAccess(userId, columnId);

  if (wipLimit !== null && (wipLimit < 1 || !Number.isInteger(wipLimit))) {
    throw new Error("WIP_LIMIT_INVALID");
  }
  return await prisma.column.update({
    where: { id: columnId },
    data: { wipLimit },
  });
}
/**checks whther a column has room for another task 
 * returns true,if task can be added,or else false if wiplimit reached
*/
export async function checkWipLimit(columnId: string): Promise<boolean> {
  const column = await prisma.column.findUnique({
    where: { id: columnId },
    include: { _count: { select: { tasks: true } } }, //counts tasks in the column
  });

  if (!column) return false;
  if (column.wipLimit === null) return true; // no limit set

  return column._count.tasks < column.wipLimit;
}
/**
 * Sets the allowed next columns for a given column (valid transitions).
 * allowedNextColumnIds is an array of column IDs that tasks can move to from this column.
 * Pass an empty array to block all transitions out of this column.
 * Pass null to clear configuration (any transition allowed).
 */
export async function setAllowedTransitions(
  userId: string,
  columnId: string,
  allowedNextColumnIds: string[] | null
) {
  await checkColumnAdminAccess(userId, columnId);

  if (allowedNextColumnIds !== null && allowedNextColumnIds.length > 0) {
    const sourceColumn = await prisma.column.findUnique({
      where: { id: columnId },
      select: { boardId: true },
    });
    if (!sourceColumn) throw new Error("NOT_FOUND: Column not found");

    const targetColumns = await prisma.column.findMany({
      where: { id: { in: allowedNextColumnIds }, boardId: sourceColumn.boardId },
      select: { id: true },
    });

    if (targetColumns.length !== allowedNextColumnIds.length) {
      throw new Error(
        "INVALID: Some target columns do not exist or belong to a different board"
      );
    }
  }

  return await prisma.column.update({
    where: { id: columnId },
    data: {
      allowedNextColumns:
        allowedNextColumnIds === null
          ? null
          : JSON.stringify(allowedNextColumnIds),
    },
  });
}