import prisma from "../utils/prisma";

const GLOBAL_ADMIN = "admin";
const PROJECT_ADMIN = "project_admin";

/**
 * Returns all registered users.
 * Accessible by: Global Admins (to manage all users) and
 * Project Admins (to look up users when adding them to a project).
 * Regular members cannot list all users — design decision for privacy.
 */
export async function getAllUsers(callerId: string) {
    const caller = await prisma.user.findUnique({ where: { id: callerId } });
    if (!caller) throw new Error("FORBIDDEN: User not found");

    // Check if caller is a Global Admin
    if (caller.role === GLOBAL_ADMIN) {
        return prisma.user.findMany({
            select: { id: true, name: true, email: true, avatar: true, role: true },
            orderBy: { name: "asc" },
        });
    }

    // Check if caller is a Project Admin in at least one project
    const projectAdminship = await prisma.projectMember.findFirst({
        where: { userId: callerId, role: PROJECT_ADMIN },
    });

    if (!projectAdminship) {
        throw new Error("FORBIDDEN: Only Global Admins and Project Admins can list users");
    }

    // Project Admins see all users (they need this to add members to their project)
    // but do not see other users' global roles — only name, email, avatar
    return prisma.user.findMany({
        select: { id: true, name: true, email: true, avatar: true },
        orderBy: { name: "asc" },
    });
}

/**
 * Updates a user's global role.
 * Only Global Admins can do this.
 * Safeguard: cannot demote yourself or the last remaining Global Admin.
 */
export async function updateUserRole(
    callerId: string,
    targetUserId: string,
    newRole: string
) {
    const validRoles = ["admin", "member"];
    if (!validRoles.includes(newRole)) {
        throw new Error(`INVALID_ROLE: global role must be one of: ${validRoles.join(", ")}`);
    }

    const caller = await prisma.user.findUnique({ where: { id: callerId } });
    if (!caller || caller.role !== GLOBAL_ADMIN) {
        throw new Error("FORBIDDEN: Only Global Admins can change global roles");
    }

    const target = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) throw new Error("NOT_FOUND: Target user not found");

    // Prevent demoting the last Global Admin — system must always have at least one
    if (target.role === GLOBAL_ADMIN && newRole !== GLOBAL_ADMIN) {
        const adminCount = await prisma.user.count({ where: { role: GLOBAL_ADMIN } });
        if (adminCount <= 1) {
            throw new Error(
                "INVALID: Cannot demote the last Global Admin. Promote another user first."
            );
        }
    }

    return prisma.user.update({
        where: { id: targetUserId },
        data: { role: newRole },
        select: { id: true, name: true, email: true, role: true },
    });
}