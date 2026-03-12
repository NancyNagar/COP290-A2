import prisma from "../utils/prisma";

// Role constants — mirrors what's stored in DB
const GLOBAL_ADMIN = "admin";
const PROJECT_ADMIN = "project_admin";

/**helper checks whether user is a project admin or global admin */
async function checkBoardAccess(userId: string, projectId: string) {

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new Error("FORBIDDEN: User not found");
  }

  if (user.role === GLOBAL_ADMIN) return;

  const membership = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
  });

  if (!membership || membership.role !== PROJECT_ADMIN) {
    throw new Error("FORBIDDEN: Only Project Admins can modify boards");
  }
}

export async function createBoard(userId:string,projectId: string, name: string) {

  await checkBoardAccess(userId,projectId);

  /**automatically creates board+4 default columns */
  return await prisma.$transaction(async (tx) => {

        const board = await tx.board.create({ data: { name, projectId } });

        // requires default columns
        const defaults = ["To Do", "In Progress", "Review", "Done"];

        await Promise.all(
          defaults.map((colName, index) =>
            tx.column.create({
              data: { name: colName, boardId: board.id, order: index },
            })
          )
        );

        return tx.board.findUnique({ //fetches board
          where: { id: board.id },
          include: { columns: { orderBy: { order: "asc" } } }, //also returns columns of this board
        });
  });
}

export async function getBoards(userId:string,projectId: string) {
  await checkBoardAccess(userId, projectId);
  const boards = await prisma.board.findMany({//retrieves multiple boards for project
    where: { projectId },
    include: {
      columns: {
        orderBy: { order: "asc" },
      },
    },
  });

  return boards;
}

/**returns a single board by Id with its columns and tasks */
export async function getBoardById(userId:string ,boardId: string) {

 const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: {
      columns: {
        orderBy: { order: "asc" },
        include: { tasks: true },
      },
    },
  });

  if (!board) return null; // controller handles the 404

  // Now check read access using the board's projectId
  await checkBoardAccess(userId, board.projectId);

  return board;
}

//renaming
export async function updateBoard(
  userId:string,
  projectId:string,
  boardId: string,
  name: string
) {

  await checkBoardAccess(userId,projectId);

  return await prisma.board.update({
    where: { id: boardId },
    data: { name },
  });
}

//deltes board and all its columns/taslks
export async function deleteBoard(
  userId:string,
  projectId:string,
  boardId: string
) {

  await checkBoardAccess(userId,projectId);

  await prisma.board.delete({
    where: { id: boardId },
  });
}