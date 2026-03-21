// src/services/permissionService.ts
import prisma from "../utils/prisma";

const GLOBAL_ADMIN = "admin";
const PROJECT_VIEWER = "project_viewer";
const PROJECT_ADMIN = "project_admin";

/**
 * Returns the caller's project-level membership, or null if they have none.
 * Global Admins bypass project membership entirely.
 */
export async function getMembership(userId: string, projectId: string) {
    const caller = await prisma.user.findUniqueOrThrow({ where: { id: userId } })
        .catch(() => { throw new Error("FORBIDDEN: User not found"); });
    if (caller.role === GLOBAL_ADMIN) return null; // bypass
    return prisma.projectMember.findFirst({ where: { userId, projectId } });
}
/**
 * Throws FORBIDDEN unless the caller is a Global Admin or has ANY membership
 * in the project (project_admin, project_member, project_viewer).
 * Used for read operations.
 */
export async function requireProjectAccess(callerId: string, projectId: string) {
    const m = await getMembership(callerId, projectId);
    if (m === null) return; // global admin
    if (!m) throw new Error("FORBIDDEN: You are not a member of this project");
}
/**
 * Throws FORBIDDEN unless the caller is a Global Admin or a project_admin /
 * project_member. Project Viewers are read-only.
 * Used for write operations (create, update, delete, move).
 */
export async function requireWriteAccess(callerId: string, projectId: string) {
    const m = await getMembership(callerId, projectId);
    if (m === null) return;
    if (!m) throw new Error("FORBIDDEN: You are not a member of this project");
    if (m.role === PROJECT_VIEWER) throw new Error("FORBIDDEN: Project Viewers cannot modify tasks");
}

export async function requireAdminAccess(callerId: string, projectId: string) {
    const m = await getMembership(callerId, projectId);
    if (m === null) return;
    if (!m || m.role !== PROJECT_ADMIN)
        throw new Error("FORBIDDEN: Only Global Admins or Project Admins can modify this project");
}