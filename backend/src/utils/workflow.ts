import prisma from "./prisma";

/**
 * Validates whether moving a task from its current column to newColumnId
 * is permitted, based on the allowedNextColumns field stored on the source column.
 *
 * If allowedNextColumns is null (not configured), we allow any move —
 * this is a safe default so boards without configured transitions still work.
 */
export async function isValidTransition(
  currentColumnId: string,
  newColumnId: string
): Promise<boolean> {
  if (currentColumnId === newColumnId) return true;

  const sourceColumn = await prisma.column.findUnique({
    where: { id: currentColumnId },
  });

  if (!sourceColumn) return false;

  // If no transitions configured, allow any move
  if (!sourceColumn.allowedNextColumns) return true;

  const allowed: string[] = JSON.parse(sourceColumn.allowedNextColumns);
  return allowed.includes(newColumnId);
}