import { Router } from "express";
import { authMiddleware } from "../middleware/authmiddleware";
import {
  getProjectsController,
  createProjectController,
  putProjectController,
  archiveProjectController,
  deleteProjectController,
  getProjectMembersController,
  upsertProjectMemberController,
  removeProjectMemberController
} from "../controllers/projectController";

const router = Router();
/*this route is protected by the authMiddleware
 Only authenticated users can do the following like craete,editing.....*/

router.post("/projects", authMiddleware, createProjectController);
router.get("/projects", authMiddleware, getProjectsController);
router.put("/projects/:projectId", authMiddleware, putProjectController);
router.delete("/projects/:projectId", authMiddleware, deleteProjectController); 
router.put("/:projectId",authMiddleware, putProjectController);
router.patch("/:projectId/archive",authMiddleware, archiveProjectController);
router.get("/:projectId/members",authMiddleware, getProjectMembersController);
router.post("/:projectId/members",authMiddleware, upsertProjectMemberController);
router.delete("/:projectId/members/:targetUserId",authMiddleware, removeProjectMemberController);
export default router;