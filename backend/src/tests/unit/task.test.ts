// src/tests/taskService.test.ts

jest.mock("../../utils/prisma", () => ({
    __esModule: true,
    default: require("../mocks/prismaMock").default,
}));

jest.mock("../../services/notificationService", () => ({
    createNotification: jest.fn(),
}));

jest.mock("../../services/columnService", () => ({
    checkWipLimit: jest.fn(),
}));

jest.mock("../../utils/workflow", () => ({
    isValidTransition: jest.fn(),
}));

jest.mock("../../services/permissionService", () => ({
    requireProjectAccess: jest.fn().mockResolvedValue(undefined),
    requireWriteAccess: jest.fn().mockResolvedValue(undefined),
    getMembership: jest.fn(),
}));

jest.mock("../../utils/audit", () => ({
    logAudit: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../utils/resolvers", () => ({
    getProjectIdFromColumn: jest.fn().mockResolvedValue("proj-1"),
    getProjectIdFromBoard: jest.fn().mockResolvedValue("proj-1"),
}));

import { createTask, deleteTask, moveTask } from "../../services/taskService";
import prismaMock from "../mocks/prismaMock";
import { checkWipLimit } from "../../services/columnService";
import { isValidTransition } from "../../utils/workflow";
import { requireWriteAccess } from "../../services/permissionService";

// ─── createTask ───────────────────────────────────────────────────────────────
describe("createTask", () => {

    beforeEach(() => {
        jest.clearAllMocks();
        // Default: write access allowed
        (requireWriteAccess as jest.Mock).mockResolvedValue(undefined);
    });

    it("throws INVALID_TYPE for unknown task type", async () => {
        await expect(
            createTask("u1", "title", null, "col-1", null, "high", "epic", null, null, "u1", null)
        ).rejects.toThrow("INVALID_TYPE");
    });

    it("throws INVALID if story is given a parentId", async () => {
        // Stories use boardId — pass boardId so we reach the parentId check
        await expect(
            createTask("u1", "title", null, null, "board-1", "high", "story", null, null, "u1", "some-parent")
        ).rejects.toThrow("INVALID: Stories cannot have a parent task");
    });

    it("throws WIP_LIMIT_REACHED when column is full", async () => {
        (checkWipLimit as jest.Mock).mockResolvedValue(false);

        await expect(
            createTask("u1", "title", null, "col-1", null, "high", "task", null, null, "u1", null)
        ).rejects.toThrow("WIP_LIMIT_REACHED");
    });

    it("throws FORBIDDEN if caller is a project viewer", async () => {
        // Auth check fires — simulate viewer rejection
        (requireWriteAccess as jest.Mock).mockRejectedValue(
            new Error("FORBIDDEN: Project Viewers cannot modify tasks")
        );

        await expect(
            createTask("u1", "title", null, "col-1", null, "high", "task", null, null, "u1", null)
        ).rejects.toThrow("FORBIDDEN: Project Viewers cannot modify tasks");
    });

    it("creates task successfully", async () => {
        (checkWipLimit as jest.Mock).mockResolvedValue(true);
        (prismaMock.task.create as jest.Mock).mockResolvedValue({
            id: "task-1", title: "My Task", type: "task"
        });

        const result = await createTask("u1", "My Task", null, "col-1", null, "high", "task", null, null, "u1", null);
        expect(result.title).toBe("My Task");
    });

});

// ─── deleteTask ───────────────────────────────────────────────────────────────
describe("deleteTask", () => {

    beforeEach(() => {
        jest.clearAllMocks();
        (requireWriteAccess as jest.Mock).mockResolvedValue(undefined);
    });

    it("throws NOT_FOUND if task does not exist", async () => {
        (prismaMock.task.findUnique as jest.Mock).mockResolvedValue(null);

        await expect(deleteTask("u1", "task-999")).rejects.toThrow("NOT_FOUND");
    });

    it("makes children standalone when deleting a story that has children", async () => {
        // Stories use boardId, not columnId
        (prismaMock.task.findUnique as jest.Mock).mockResolvedValue({
            id: "story-1", type: "story", boardId: "board-1", columnId: null,
            children: [{ id: "child-1" }],
            parentId: null,
        });
        (prismaMock.task.updateMany as jest.Mock).mockResolvedValue({});
        (prismaMock.task.delete as jest.Mock).mockResolvedValue({});

        await expect(deleteTask("u1", "story-1")).resolves.not.toThrow();
        expect(prismaMock.task.updateMany).toHaveBeenCalledWith({
            where: { parentId: "story-1" },
            data: { parentId: null },
        });
    });

    it("deletes successfully when story has no children", async () => {
        (prismaMock.task.findUnique as jest.Mock).mockResolvedValue({
            id: "story-1", type: "story", boardId: "board-1", columnId: null,
            children: [],
            parentId: null,
        });
        (prismaMock.task.delete as jest.Mock).mockResolvedValue({});

        await expect(deleteTask("u1", "story-1")).resolves.not.toThrow();
    });

});

// ─── moveTask ─────────────────────────────────────────────────────────────────
describe("moveTask", () => {

    beforeEach(() => {
        jest.clearAllMocks();
        (requireWriteAccess as jest.Mock).mockResolvedValue(undefined);
    });

    it("throws NOT_FOUND if task does not exist", async () => {
        (prismaMock.task.findUnique as jest.Mock).mockResolvedValue(null);

        await expect(moveTask("u1", "task-999", "col-2")).rejects.toThrow("NOT_FOUND");
    });

    it("throws INVALID if trying to move a Story", async () => {
        (prismaMock.task.findUnique as jest.Mock).mockResolvedValue({
            id: "s1", type: "story", status: "To Do", columnId: "col-1", assigneeId: null
        });

        await expect(moveTask("u1", "s1", "col-2")).rejects.toThrow("INVALID: Stories cannot be moved");
    });

    it("throws INVALID_TRANSITION if move is not allowed", async () => {
        (prismaMock.task.findUnique as jest.Mock).mockResolvedValue({
            id: "t1", type: "task", status: "To Do", columnId: "col-1", assigneeId: null, parentId: null
        });
        (isValidTransition as jest.Mock).mockResolvedValue(false);

        await expect(moveTask("u1", "t1", "col-2")).rejects.toThrow("INVALID_TRANSITION");
    });

});