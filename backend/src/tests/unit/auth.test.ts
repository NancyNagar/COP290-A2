// src/tests/unit/auth.test.ts

jest.mock("../../utils/prisma", () => ({
    __esModule: true,
    default: require("../mocks/prismaMock").default,
}));

jest.mock("../../utils/jwt", () => ({
    generateAccessToken: jest.fn().mockReturnValue("fake-access"),
    generateRefreshToken: jest.fn().mockReturnValue("fake-refresh"),
    verifyRefreshToken: jest.fn(),
    verifyAccessToken: jest.fn(),
}));

jest.mock("bcrypt", () => ({
    hash: jest.fn().mockResolvedValue("hashed-pw"),
    compare: jest.fn(),
}));

import { register, login, logout, refresh } from "../../controllers/authController";
import prismaMock from "../mocks/prismaMock";
import * as bcrypt from "bcrypt";
import * as jwtUtils from "../../utils/jwt";

function make(body = {}, cookies = {}) {
    const json = jest.fn();
    const cookie = jest.fn();
    const clearCookie = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    return {
        req: { body, cookies } as any,
        res: { status, json, cookie, clearCookie } as any,
        status, json, cookie, clearCookie,
    };
}

beforeEach(() => jest.clearAllMocks());

// ── register ──────────────────────────────────────────────────────────────────
describe("register", () => {
    it("400 — missing fields", async () => {
        const { req, res, status } = make({ email: "a@b.com" });
        await register(req, res);
        expect(status).toHaveBeenCalledWith(400);
    });

    it("400 — duplicate email", async () => {
        (prismaMock.user.findUnique as jest.Mock).mockResolvedValue({ id: "u1" });
        const { req, res, status } = make({ name: "Alice", email: "a@b.com", password: "pw" });
        await register(req, res);
        expect(status).toHaveBeenCalledWith(400);
    });

    it("201 — creates user and hashes password", async () => {
        (prismaMock.user.findUnique as jest.Mock).mockResolvedValue(null);
        (prismaMock.user.create as jest.Mock).mockResolvedValue({ id: "u-new" });
        const { req, res, status } = make({ name: "Alice", email: "new@b.com", password: "plain" });
        await register(req, res);
        expect(bcrypt.hash).toHaveBeenCalledWith("plain", 10);
        expect(status).toHaveBeenCalledWith(201);
    });
});

// ── login ─────────────────────────────────────────────────────────────────────
describe("login", () => {
    it("401 — unknown user", async () => {
        (prismaMock.user.findUnique as jest.Mock).mockResolvedValue(null);
        const { req, res, status } = make({ email: "x@b.com", password: "pw" });
        await login(req, res);
        expect(status).toHaveBeenCalledWith(401);
    });

    it("401 — wrong password", async () => {
        (prismaMock.user.findUnique as jest.Mock).mockResolvedValue({ id: "u1", password: "hashed" });
        (bcrypt.compare as jest.Mock).mockResolvedValue(false);
        const { req, res, status } = make({ email: "a@b.com", password: "wrong" });
        await login(req, res);
        expect(status).toHaveBeenCalledWith(401);
    });

    it("200 — sets accessToken and refreshToken cookies", async () => {
        (prismaMock.user.findUnique as jest.Mock).mockResolvedValue({
            id: "u1", name: "Alice", email: "a@b.com", role: "user", password: "hashed",
        });
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        (prismaMock.refreshToken.create as jest.Mock).mockResolvedValue({});

        const { req, res, cookie } = make({ email: "a@b.com", password: "correct" });
        await login(req, res);

        // Check that res.cookie was called for both token names (not the value,
        // since the value comes from generateAccessToken which the controller calls internally)
        const names = (cookie as jest.Mock).mock.calls.map((args: any[]) => args[0]);
        expect(names).toContain("accessToken");
        expect(names).toContain("refreshToken");
    });

    it("200 — returns Login successful message", async () => {
        (prismaMock.user.findUnique as jest.Mock).mockResolvedValue({
            id: "u1", name: "Alice", email: "a@b.com", role: "user", password: "hashed",
        });
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        (prismaMock.refreshToken.create as jest.Mock).mockResolvedValue({});

        const { req, res, json } = make({ email: "a@b.com", password: "correct" });
        await login(req, res);
        expect(json).toHaveBeenCalledWith(
            expect.objectContaining({ message: "Login successful" })
        );
    });
});

// ── logout ────────────────────────────────────────────────────────────────────
describe("logout", () => {
    it("200 — clears both cookies and returns Logged out", async () => {
        (prismaMock.refreshToken.delete as jest.Mock).mockResolvedValue({});
        const { req, res, clearCookie, json } = make({}, { refreshToken: "tok" });
        await logout(req, res);
        expect(clearCookie).toHaveBeenCalledWith("accessToken");
        expect(clearCookie).toHaveBeenCalledWith("refreshToken");
        expect(json).toHaveBeenCalledWith({ message: "Logged out" });
    });
});

// ── refresh ───────────────────────────────────────────────────────────────────
describe("refresh", () => {
    it("401 — no cookie", async () => {
        const { req, res, status } = make({}, {});
        await refresh(req, res);
        expect(status).toHaveBeenCalledWith(401);
    });

    it("401 — token not in DB", async () => {
        (prismaMock.refreshToken.findUnique as jest.Mock).mockResolvedValue(null);
        const { req, res, status } = make({}, { refreshToken: "old" });
        await refresh(req, res);
        expect(status).toHaveBeenCalledWith(401);
    });

    it("401 — token expired", async () => {
        (prismaMock.refreshToken.findUnique as jest.Mock).mockResolvedValue({
            token: "exp", expiresAt: new Date(Date.now() - 1000),
        });
        const { req, res, status } = make({}, { refreshToken: "exp" });
        await refresh(req, res);
        expect(status).toHaveBeenCalledWith(401);
    });

    it("200 — issues new accessToken cookie", async () => {
        (prismaMock.refreshToken.findUnique as jest.Mock).mockResolvedValue({
            token: "valid", expiresAt: new Date(Date.now() + 10000),
        });
        (jwtUtils.verifyRefreshToken as jest.Mock).mockReturnValue({ userId: "u1" });

        const { req, res, cookie } = make({}, { refreshToken: "valid" });
        await refresh(req, res);

        const names = (cookie as jest.Mock).mock.calls.map((args: any[]) => args[0]);
        expect(names).toContain("accessToken");
    });
});