import { Request, Response } from "express"; //used for typing express requests
import {
  createProject,
  deleteProjectById,
  putProjectById,
  archiveProjectById,
  upsertProjectMember,
  removeProjectMember,
  getProjectMembers
} from "../services/projectService";
import { getProjects } from "../services/projectService";
type AuthRequest = Request & { userId: string };//extends express request

// Reusable helper — keeps catch blocks DRY(need not to repeat)
function handleError(res: Response, error: unknown): void {
  if (error instanceof Error) {
    if (error.message.startsWith("FORBIDDEN")) {
      res.status(403).json({ message: error.message });
      return;
    }
    if (error.message.startsWith("INVALID_ROLE")) {
      res.status(400).json({ message: error.message });
      return;
    }
    //prisma throws P2025 for not found
    //surface it as 404 instead of letting it fall through to 500
    if (
      error.message.startsWith("NOT_FOUND") ||
      (error as NodeJS.ErrnoException & { code?: string }).code === "P2025"
    ) {
      res.status(404).json({ message: "Resource not found" });
      return;
    }
  }
  res.status(500).json({ message: "Server error" });
}
export async function getProjectsController(
  req: Request,
  res: Response
): Promise<void> {

  try {

    //read userid
    const userId = (req as Request & { userId: string }).userId;
    //fetch projects from database
    const projects = await getProjects(userId);
    //send response
    res.json(projects);

  } catch (error) {
    handleError(res, error);
  }
}

/**handles http request */
export async function createProjectController(
  req: Request,
  res: Response
): Promise<void> {

  try {

    const userId = (req as AuthRequest).userId;
    const { name, description } = req.body;

    if (!name) {
      res.status(400).json({
        message: "Project name is required"
      });
      return;
    }

    const project = await createProject(userId, name, description);

    res.status(201).json(project); //can be written just res.json(project)
    //anyways it automatically generates 201 which means resource created

  } catch (error) {
    handleError(res, error);
  }

}
/**handles PUT/projects/:projectId */
export async function putProjectController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = (req as AuthRequest).userId;
    const { projectId } = req.params;

    if (!projectId || typeof projectId !== "string") {
      res.status(400).json({ message: "Project ID is required" });
      return;
    }

    const { name, description } = req.body;

    if (!name && !description) {
      res.status(400).json({
        message:
          "At least one field (name or description) is required for update"
      });
      return;
    }

    // Build the partial update object with only provided fields
    const updates: Partial<{ name: string; description: string }> = {}; // partila used becoause update may contain only ome fields
    if (name) updates.name = name;
    if (description) updates.description = description;

    const updatedProject = await putProjectById(userId, projectId, updates);
    res.status(200).json(updatedProject);
  } catch (error) {
    handleError(res, error);
  }
}
/**handles PATCH/projects/:projectId/archieve */
export async function archiveProjectController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = (req as AuthRequest).userId;
    const { projectId } = req.params;

    if (!projectId || typeof projectId !== "string") {
      res.status(400).json({ message: "Project ID is required" });
      return;
    }

    const project = await archiveProjectById(userId, projectId);
    res.status(200).json(project);
  } catch (error) {
    handleError(res, error);
  }
}
/**DELETE/projetcs/:prohjetid */
export async function deleteProjectController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = (req as AuthRequest).userId;
    const { projectId } = req.params;
    if (!projectId || typeof projectId !== "string") {
      res.status(400).json({
        message: "Project ID is required"
      });
      return;
    }
    await deleteProjectById(userId, projectId);
    res.status(204).send(); /**204 for delte because delete succeds but no response body is returned */
  } catch (error) {
    handleError(res, error);
  }
}
/**GET/projects/:projetcId/members */
export async function getProjectMembersController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = (req as AuthRequest).userId;
    const { projectId } = req.params;

    if (!projectId || typeof projectId !== "string") {
      res.status(400).json({ message: "Project ID is required" });
      return;
    }

    const members = await getProjectMembers(userId, projectId);
    res.status(200).json(members);
  } catch (error) {
    handleError(res, error);
  }
}
/**PUT/projetcs/:projectId/members */
export async function upsertProjectMemberController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const callerId = (req as AuthRequest).userId;
    const { projectId } = req.params;
    const { userId: targetUserId, role } = req.body;

    if (!projectId || typeof projectId !== "string") {
      res.status(400).json({ message: "Project ID is required" });
      return;
    }
    if (!targetUserId || !role) {
      res.status(400).json({ message: "userId and role are required" });
      return;
    }

    const membership = await upsertProjectMember(
      callerId,
      projectId,
      targetUserId,
      role
    );
    res.status(200).json(membership);
  } catch (error) {
    handleError(res, error);
  }
}
/**DELETE /projects/:projectId/members/:targetUserId */
export async function removeProjectMemberController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const callerId = (req as AuthRequest).userId;
    const { projectId, targetUserId } = req.params;

    if (!projectId || !targetUserId || typeof projectId !== "string" || typeof targetUserId !== "string") {
      res.status(400).json({ message: "projectId and targetUserId are required" });
      return;
    }

    await removeProjectMember(callerId, projectId, targetUserId);
    res.status(204).send();
  } catch (error) {
    handleError(res, error);
  }
}