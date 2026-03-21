import prisma from "../utils/prisma";
import { requireAdminAccess } from "./permissionService";
// Role constants — mirrors what's stored in the DB
const GLOBAL_ADMIN = "admin";

/**
 * Create a new project.
 * Only Global Admins may do this .
 */
export async function createProject(
  userId: string,
  name: string,
  description?: string //description is optional, so it can be undefined
) {
  // Verify caller is a global admin
  const caller = await prisma.user.findUnique({ where: { id: userId } });
  if (!caller || caller.role !== GLOBAL_ADMIN) {
    throw new Error("FORBIDDEN: Only Global Admins can create projects");
  }
  //await  pauses the function untill database finishes createing project. 
  const project = await prisma.project.create({
    data: {          /*this tells Prisma what data to insert */
      name,
      description: description || "" //if description is undefined, use an empty string instead to avoid database errors since description is not nullable in the schema
    }
  });

  return project;
}
/**returns all projects that logge d-in user belongs to */
export async function getProjects(userId: string) { /**used aysync ,because database queries are asynchrounou */
  const caller = await prisma.user.findUnique({ where: { id: userId } });
  if (!caller) {
    throw new Error("FORBIDDEN: User not found");
  }

  if (caller.role === GLOBAL_ADMIN) {
    return prisma.project.findMany(); // global admin sees all
  }
  const memberships = await prisma.projectMember.findMany({
    where: { userId }, //filter memberships belonging to logged in user
    include: { project: true } //also fetch the retlated project
  });
  //Non-admins cannot see archived projects
  return memberships.map(m => m.project).filter((p) => !p.isArchived); //map extracts only projects
}
/**any updates if done,added to database */
export async function putProjectById(userID: string, projectId: string, updates: Partial<{ name: string; description: string }>) {
  await requireAdminAccess(userID, projectId); //only global admin or that project admin can add those can do updates
  const project = await prisma.project.update({
    where: {
      id: projectId
    },
    data: updates
  });
  return project;
}
/**
 * Soft-archive a project (sets isArchived = true, records timestamp).
 * Hard delete is kept separate. Allowed: Global Admin or Project Admin.
 */
export async function archiveProjectById(userId: string, projectId: string) {
  await requireAdminAccess(userId, projectId);

  return prisma.project.update({
    where: { id: projectId },
    data: { isArchived: true, archivedAt: new Date() }
  });
}
/***permenantly deletes a project */
export async function deleteProjectById(userId: string, projectId: string) {
  await requireAdminAccess(userId, projectId);
  await prisma.project.delete({
    where: {
      id: projectId
    }
  });
}
/**
 * Add a user to a project with a role, or update their role if already
 * a member (upsert). Only Global Admins and Project Admins can assign roles.
 */
export async function upsertProjectMember(
  callerId: string,
  projectId: string,
  targetUserId: string,
  role: string
) {
  await requireAdminAccess(callerId, projectId);

  const validRoles = ["project_admin", "project_member", "project_viewer"]; //allowed project roles
  if (!validRoles.includes(role)) {
    throw new Error(`INVALID_ROLE: must be one of ${validRoles.join(", ")}`);
  }

  return prisma.projectMember.upsert({
    where: { userId_projectId: { userId: targetUserId, projectId } },//composite unique key
    update: { role },
    create: { userId: targetUserId, projectId, role }
  });
}

/**
 * Remove a user from a project.
 * Only Global Admins and Project Admins can do this.
 */
export async function removeProjectMember(
  callerId: string,
  projectId: string,
  targetUserId: string
) {
  await requireAdminAccess(callerId, projectId);

  await prisma.projectMember.deleteMany({
    where: { userId: targetUserId, projectId }
  });
}

/**
 * List all members of a project.
 * Any project member (or Global Admin) can view the list.
 */
export async function getProjectMembers(userId: string, projectId: string) {
  const caller = await prisma.user.findUnique({ where: { id: userId } });
  if (!caller) throw new Error("FORBIDDEN: User not found");

  if (caller.role !== GLOBAL_ADMIN) {
    const membership = await prisma.projectMember.findFirst({
      where: { userId, projectId }
    });
    if (!membership) {
      throw new Error("FORBIDDEN: You are not a member of this project");
    }
  }

  return prisma.projectMember.findMany({
    where: { projectId },
    include: {
      user: { select: { id: true, name: true, email: true, avatar: true } }
    }
  });
}
