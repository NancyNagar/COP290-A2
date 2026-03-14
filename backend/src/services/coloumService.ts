import prisma from "../utils/prisma";
const GLOBAL_ADMIN = "admin";
const PROJECT_ADMIN = "project_admin";

/** check if user is allowed to modify board */
async function checkBoardAccess(userId: string, boardId: string) {

  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: { projectId: true },
  });

  if (!board) {
    throw new Error("FORBIDDEN: Board not found");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("FORBIDDEN: User not found");
  }

  if (user.role === GLOBAL_ADMIN) return; //if user is global admin ,they can modify any board
  /**checks if user is a member of the project that owns the board */
  const membership = await prisma.projectMember.findUnique({
    where: {
      userId_projectId: {
        userId,
        projectId: board.projectId, //schema contains the composite key of userId and projectId
      },
    },
  });

  if (!membership || membership.role !== PROJECT_ADMIN) {
    throw new Error("FORBIDDEN: Only Project Admins can modify columns");
  }
}
/**check if user is allowed to read board */
async function checkReadAccess(userId: string, boardId: string) {
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: { projectId: true },
  });
  if (!board) throw new Error("FORBIDDEN: Board not found");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("FORBIDDEN: User not found");
  if (user.role === GLOBAL_ADMIN) return;

  const membership = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId: board.projectId } },
  });
  if (!membership) throw new Error("FORBIDDEN: Not a project member");
  // any role (admin, member, viewer) can read
}
/**check if user is allowed to modify column,when only column is given */
async function checkBoardAccessByColumn(userId: string, columnId: string) {
  const column = await prisma.column.findUnique({
    where: { id: columnId },
    select: { boardId: true },
  });
  if (!column) throw new Error("FORBIDDEN: Column not found");
  await checkBoardAccess(userId, column.boardId);
}
/**craetes a new column on a board at the given ordr position */
export async function createColumn(userId: string, boardId: string, name: string, order: number) {
  await checkBoardAccess(userId, boardId);
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
  await checkReadAccess(userId, boardId);
  const columns = await prisma.column.findMany({
    where: { boardId },
    include: { tasks: true },
    orderBy: { order: "asc" } //order columns by their order field in ascending order so that they are returned in the correct order for display on the frontend
  });
  return columns;
}
/**renames a column */
export async function updateColumn(userId: string, columnId: string, name: string) {
  await checkBoardAccessByColumn(userId, columnId);
  const column = await prisma.column.update({
    where: { id: columnId },
    data: { name }
  });
  return column;
}
/**deletes column by id */
export async function deleteColumn(userId: string, columnId: string) {
  await checkBoardAccessByColumn(userId, columnId);
  await prisma.column.delete({
    where: { id: columnId }
  });
}
/**reorders column */
export async function reorderColumns(userId: string, boardId: string, orderedIds: string[]) {
  await checkBoardAccess(userId, boardId);

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
  await checkBoardAccessByColumn(userId, columnId);

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