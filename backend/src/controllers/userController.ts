import { Request, Response } from "express";
import { getAllUsers, updateUserRole } from "../services/userService";

type AuthRequest = Request & { userId: string };

function handleError(res: Response, error: unknown): void {
    if (error instanceof Error) {
        if (error.message.startsWith("FORBIDDEN")) {
            res.status(403).json({ message: error.message });
            return;
        }
        if (error.message.startsWith("NOT_FOUND")) {
            res.status(404).json({ message: error.message });
            return;
        }
        if (
            error.message.startsWith("INVALID_ROLE") ||
            error.message.startsWith("INVALID")
        ) {
            res.status(400).json({ message: error.message });
            return;
        }
    }
    res.status(500).json({ message: "Server error" });
}

/** GET /api/users — list all users (Global Admin + Project Admin only) */
export async function getUsersController(
    req: Request,
    res: Response
): Promise<void> {
    try {
        const callerId = (req as AuthRequest).userId;
        const users = await getAllUsers(callerId);
        res.json(users);
    } catch (error) {
        handleError(res, error);
    }
}

/** PATCH /api/users/:targetUserId/role — change a user's global role */
export async function updateUserRoleController(
    req: Request,
    res: Response
): Promise<void> {
    try {
        const callerId = (req as AuthRequest).userId;
        const { targetUserId } = req.params;
        const { role } = req.body;

        if (!targetUserId || typeof targetUserId !== "string") {
            res.status(400).json({ message: "targetUserId is required" });
            return;
        }

        if (!role || typeof role !== "string") {
            res.status(400).json({ message: "role is required" });
            return;
        }

        const updated = await updateUserRole(callerId, targetUserId, role);
        res.json(updated);
    } catch (error) {
        handleError(res, error);
    }
}