import prisma from "./prisma";

/**
 * Returns the projectId that owns a given column.
 * Throws NOT_FOUND if the column doesn't exist.
 */
export async function getProjectIdFromColumn(columnId: string): Promise<string> {
    const column = await prisma.column.findUnique({
        where: { id: columnId },
        include: { board: true },
    });
    if (!column) throw new Error("NOT_FOUND: Column not found");
    return column.board.projectId;
}

/**
 * Returns the projectId that owns a given board.
 * Throws NOT_FOUND if the board doesn't exist.
 */
export async function getProjectIdFromBoard(boardId: string): Promise<string> {
    const board = await prisma.board.findUnique({
        where: { id: boardId },
        select: { projectId: true },
    });
    if (!board) throw new Error("NOT_FOUND: Board not found");
    return board.projectId;
}

/**
 * Returns the boardId that owns a given column.
 * Throws NOT_FOUND if the column doesn't exist.
 */
export async function getBoardIdFromColumn(columnId: string): Promise<string> {
    const column = await prisma.column.findUnique({
        where: { id: columnId },
        select: { boardId: true },
    });
    if (!column) throw new Error("NOT_FOUND: Column not found");
    return column.boardId;
}
