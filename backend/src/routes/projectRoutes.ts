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

router.post("/", authMiddleware, createProjectController);
router.get("/", authMiddleware, getProjectsController);
router.put("/:projectId", authMiddleware, putProjectController);
router.delete("/:projectId", authMiddleware, deleteProjectController);
router.patch("/:projectId/archive", authMiddleware, archiveProjectController);
router.get("/:projectId/members", authMiddleware, getProjectMembersController);
router.put("/:projectId/members", authMiddleware, upsertProjectMemberController);
router.delete("/:projectId/members/:targetUserId", authMiddleware, removeProjectMemberController);
export default router;