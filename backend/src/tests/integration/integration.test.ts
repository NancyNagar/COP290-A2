// Full HTTP stack tests via supertest.
// Prisma, JWT, and side-effect services are all mocked — no DB needed.

// ── ALL jest.mock calls MUST come before any imports ─────────────────────────

jest.mock("../../utils/prisma", () => ({
    __esModule: true,
    default: require("../mocks/prismaMock").default,
}));

jest.mock("../../utils/jwt", () => ({
    generateAccessToken: jest.fn().mockReturnValue("fake-access"),
    generateRefreshToken: jest.fn().mockReturnValue("fake-refresh"),
    verifyAccessToken: jest.fn(),
    verifyRefreshToken: jest.fn(),
}));

jest.mock("bcrypt", () => ({
    hash: jest.fn().mockResolvedValue("hashed-pw"),
    compare: jest.fn(),
}));

// Side-effect services
jest.mock("../../services/notificationService", () => ({ createNotification: jest.fn() }));
jest.mock("../../utils/audit", () => ({ logAudit: jest.fn() }));
jest.mock("../../services/columnService", () => ({ checkWipLimit: jest.fn().mockResolvedValue(true) }));
jest.mock("../../utils/workflow", () => ({ isValidTransition: jest.fn().mockResolvedValue(true) }));

// Mock resolvers so no real DB column/board lookup happens
jest.mock("../../utils/resolvers", () => ({
    getProjectIdFromColumn: jest.fn().mockResolvedValue("proj-1"),
    getProjectIdFromBoard: jest.fn().mockResolvedValue("proj-1"),
    getBoardIdFromColumn: jest.fn().mockResolvedValue("board-1"),
}));

// This fixes "Cannot find module '../types/express'" inside authmiddleware
// The file is a .d.ts (type-only) — at runtime it's a no-op import.
jest.mock("../../types/express", () => ({}), { virtual: true });

// ── imports ───────────────────────────────────────────────────────────────────
import request from "supertest";
import app from "../../server";
import prismaMock from "../mocks/prismaMock";
import * as jwtUtils from "../../utils/jwt";
import * as bcrypt from "bcrypt";

// Makes the auth middleware pass as userId
function loginAs(userId = "u1") {
    (jwtUtils.verifyAccessToken as jest.Mock).mockReturnValue({ userId });
}
const COOKIE = "accessToken=fake-access";

beforeEach(() => jest.clearAllMocks());

// ─────────────────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────────────────
describe("POST /api/auth/register", () => {
    it("201 — creates user", async () => {
        (prismaMock.user.findUnique as jest.Mock).mockResolvedValue(null);
        (prismaMock.user.create as jest.Mock).mockResolvedValue({ id: "u1" });
        const res = await request(app).post("/api/auth/register")
            .send({ name: "Alice", email: "a@b.com", password: "pw" });
        expect(res.status).toBe(201);
    });

    it("400 — duplicate email", async () => {
        (prismaMock.user.findUnique as jest.Mock).mockResolvedValue({ id: "u1" });
        const res = await request(app).post("/api/auth/register")
            .send({ name: "Alice", email: "a@b.com", password: "pw" });
        expect(res.status).toBe(400);
    });
});

describe("POST /api/auth/login", () => {
    it("200 — sets access + refresh cookies on success", async () => {
        (prismaMock.user.findUnique as jest.Mock).mockResolvedValue({
            id: "u1", name: "Alice", email: "a@b.com", role: "user", password: "hashed",
        });
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        (prismaMock.refreshToken.create as jest.Mock).mockResolvedValue({});

        const res = await request(app).post("/api/auth/login")
            .send({ email: "a@b.com", password: "correct" });

        expect(res.status).toBe(200);
        const cookies: string[] = (res.headers["set-cookie"] as unknown as string[]) || [];
        expect(cookies.some((c: string) => c.startsWith("accessToken="))).toBe(true);
        expect(cookies.some((c: string) => c.startsWith("refreshToken="))).toBe(true);
    });

    it("401 — wrong password", async () => {
        (prismaMock.user.findUnique as jest.Mock).mockResolvedValue({ id: "u1", password: "hashed" });
        (bcrypt.compare as jest.Mock).mockResolvedValue(false);
        const res = await request(app).post("/api/auth/login")
            .send({ email: "a@b.com", password: "wrong" });
        expect(res.status).toBe(401);
    });
});

describe("POST /api/auth/logout", () => {
    it("200 — clears cookies", async () => {
        (prismaMock.refreshToken.delete as jest.Mock).mockResolvedValue({});
        const res = await request(app).post("/api/auth/logout")
            .set("Cookie", "refreshToken=tok");
        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ message: "Logged out" });
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// PROJECTS
// ─────────────────────────────────────────────────────────────────────────────
describe("POST /api/projects", () => {
    it("401 — no token", async () => {
        (jwtUtils.verifyAccessToken as jest.Mock).mockReturnValue(null);
        const res = await request(app).post("/api/projects").send({ name: "P" });
        expect(res.status).toBe(401);
    });

    it("403 — non-admin blocked", async () => {
        loginAs();
        (prismaMock.user.findUnique as jest.Mock).mockResolvedValue({ id: "u1", role: "project_member" });
        const res = await request(app).post("/api/projects")
            .set("Cookie", COOKIE).send({ name: "P" });
        expect(res.status).toBe(403);
    });

    it("201 — global admin creates project", async () => {
        loginAs();
        (prismaMock.user.findUnique as jest.Mock).mockResolvedValue({ id: "u1", role: "admin" });
        (prismaMock.project.create as jest.Mock).mockResolvedValue({ id: "p1", name: "P", description: "" });
        const res = await request(app).post("/api/projects")
            .set("Cookie", COOKIE).send({ name: "P" });
        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({ name: "P" });
    });
});

describe("GET /api/projects", () => {
    it("200 — member only sees non-archived projects", async () => {
        loginAs();
        (prismaMock.user.findUnique as jest.Mock).mockResolvedValue({ id: "u1", role: "user" });
        (prismaMock.projectMember.findMany as jest.Mock).mockResolvedValue([
            { project: { id: "p1", name: "Active", isArchived: false } },
            { project: { id: "p2", name: "Old", isArchived: true } },
        ]);
        const res = await request(app).get("/api/projects").set("Cookie", COOKIE);
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0].id).toBe("p1");
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// TASKS
// ─────────────────────────────────────────────────────────────────────────────
describe("POST /api/tasks", () => {
    it("403 — viewer cannot create tasks", async () => {
        loginAs();
        (prismaMock.user.findUnique as jest.Mock).mockResolvedValue({ id: "u1", role: "user" });
        (prismaMock.projectMember.findFirst as jest.Mock).mockResolvedValue({ role: "project_viewer" });
        const res = await request(app).post("/api/tasks").set("Cookie", COOKIE)
            .send({ title: "T", columnId: "col-1", priority: "high", reporterId: "u1" });
        expect(res.status).toBe(403);
    });

    it("201 — member creates task", async () => {
        loginAs();
        (prismaMock.user.findUnique as jest.Mock).mockResolvedValue({ id: "u1", role: "user" });
        (prismaMock.projectMember.findFirst as jest.Mock).mockResolvedValue({ role: "project_member" });
        (prismaMock.task.create as jest.Mock).mockResolvedValue({ id: "t1", title: "T", type: "task" });
        (prismaMock.auditLog.create as jest.Mock).mockResolvedValue({});
        const res = await request(app).post("/api/tasks").set("Cookie", COOKIE)
            .send({ title: "T", columnId: "col-1", priority: "high", reporterId: "u1" });
        expect(res.status).toBe(201);
    });

    it("400 — WIP limit blocks creation", async () => {
        loginAs();
        const { checkWipLimit } = require("../../services/columnService");
        (checkWipLimit as jest.Mock).mockResolvedValue(false);
        (prismaMock.user.findUnique as jest.Mock).mockResolvedValue({ id: "u1", role: "user" });
        (prismaMock.projectMember.findFirst as jest.Mock).mockResolvedValue({ role: "project_member" });
        const res = await request(app).post("/api/tasks").set("Cookie", COOKIE)
            .send({ title: "T", columnId: "col-1", priority: "high", reporterId: "u1" });
        expect(res.status).toBe(400);
    });
});

describe("PATCH /api/tasks/move/:taskId", () => {
    it("400 — invalid workflow transition blocked", async () => {
        loginAs();
        const { isValidTransition } = require("../../utils/workflow");
        (isValidTransition as jest.Mock).mockResolvedValue(false);
        (prismaMock.task.findUnique as jest.Mock).mockResolvedValue({
            id: "t1", type: "task", columnId: "col-1", boardId: null,
            status: "Done", assigneeId: null, parentId: null, resolvedAt: null, closedAt: null,
        });
        (prismaMock.user.findUnique as jest.Mock).mockResolvedValue({ id: "u1", role: "user" });
        (prismaMock.projectMember.findFirst as jest.Mock).mockResolvedValue({ role: "project_member" });
        const res = await request(app).patch("/api/tasks/move/t1")
            .set("Cookie", COOKIE).send({ newColumnId: "col-99" });   // ← newColumnId
        expect(res.status).toBe(400);
    });

    it("200 — valid move returns updated task", async () => {
        loginAs();
        const { isValidTransition } = require("../../utils/workflow");
        (isValidTransition as jest.Mock).mockResolvedValue(true);   // ← re-set after clearAllMocks
        (prismaMock.task.findUnique as jest.Mock).mockResolvedValue({
            id: "t1", type: "task", columnId: "col-1", boardId: null,
            status: "To Do", assigneeId: null, parentId: null, resolvedAt: null, closedAt: null,
        });
        (prismaMock.user.findUnique as jest.Mock).mockResolvedValue({ id: "u1", role: "user" });
        (prismaMock.projectMember.findFirst as jest.Mock).mockResolvedValue({ role: "project_member" });
        (prismaMock.column.findUnique as jest.Mock).mockResolvedValue({
            id: "col-2", boardId: "board-1", wipLimit: null, name: "In Progress",
        });
        (prismaMock.column.findMany as jest.Mock).mockResolvedValue([
            { id: "col-1" }, { id: "col-2" }, { id: "col-3" },
        ]);
        (prismaMock.task.update as jest.Mock).mockResolvedValue({ id: "t1", status: "In Progress" });
        (prismaMock.auditLog.create as jest.Mock).mockResolvedValue({});
        const res = await request(app).patch("/api/tasks/move/t1")
            .set("Cookie", COOKIE).send({ newColumnId: "col-2" });    // ← newColumnId
        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ status: "In Progress" });
    });
});

describe("DELETE /api/tasks/:taskId", () => {
    it("404 — task not found", async () => {
        loginAs();
        (prismaMock.task.findUnique as jest.Mock).mockResolvedValue(null);
        const res = await request(app).delete("/api/tasks/ghost").set("Cookie", COOKIE);
        expect(res.status).toBe(404);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// COMMENTS
// ─────────────────────────────────────────────────────────────────────────────
describe("POST /api/comments/:taskId", () => {
    it("201 — creates comment", async () => {
        loginAs();
        (prismaMock.comment.create as jest.Mock).mockResolvedValue({
            id: "c1", content: "LGTM", taskId: "t1", userId: "u1",
        });
        (prismaMock.auditLog.create as jest.Mock).mockResolvedValue({});
        (prismaMock.task.findUnique as jest.Mock).mockResolvedValue({ assigneeId: null });
        const res = await request(app).post("/api/comments/t1")
            .set("Cookie", COOKIE).send({ content: "LGTM" });
        expect(res.status).toBe(201);
    });

    it("400 — empty content rejected", async () => {
        loginAs();
        const res = await request(app).post("/api/comments/t1")
            .set("Cookie", COOKIE).send({ content: "  " });
        expect(res.status).toBe(400);
    });
});

describe("DELETE /api/comments/:commentId", () => {
    it("403 — non-owner blocked", async () => {
        loginAs();
        (prismaMock.comment.findUnique as jest.Mock).mockResolvedValue({
            id: "c1", userId: "other-user", content: "hi", taskId: "t1",
        });
        const res = await request(app).delete("/api/comments/c1").set("Cookie", COOKIE);
        expect(res.status).toBe(403);
    });

    it("404 — comment not found", async () => {
        loginAs();
        (prismaMock.comment.findUnique as jest.Mock).mockResolvedValue(null);
        const res = await request(app).delete("/api/comments/ghost").set("Cookie", COOKIE);
        expect(res.status).toBe(404);
    });
});