import { Request, Response } from "express";
import bcrypt from "bcrypt"; //used for hashing passwords and comparing hashed passwords during login
import prisma from "../utils/prisma";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/jwt";

export async function register(req: Request, res: Response) {
  try {
    const { name, email, password } = req.body;
    // Basic input validation — prevents DB errors and provides clear feedback
    if (!name || !email || !password) {
      res.status(400).json({ message: "Name, email and password are required" });
      return;
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10); //10=salt rounds for hashing the password(bycrpt), adds randomness to password hashing to make it more secure

    //now insert the new user into the database with the hashed password, and return the user ID in the response
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword
      }
    });

    res.status(201).json({
      message: "User created",
      userId: user.id
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error"
    });
  }
}
export async function login(req: Request, res: Response) {
  try {

    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials"
      });
    }

    const validPassword = await bcrypt.compare(
      password,
      user.password
    );

    if (!validPassword) {
      return res.status(401).json({
        message: "Invalid credentials"
      });
    }
    // Access token: short-lived (15 min), sent on every request
    // Refresh token: long-lived (7 days), only used to get a new access token
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // store the refresh token in DB so logout can truly invalidate it
    // (a cookie-clear alone doesn't stop someone who already copied the token)
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        // expiresAt must match the TTL used in generateRefreshToken (7 days)
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });
    // httpOnly prevents JS from reading the cookie → blocks XSS theft
    // secure: true ensures the cookie is only sent over HTTPS
    // sameSite: "strict" blocks CSRF — the cookie won't be sent on cross-site requests
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict" as const
    };

    res.cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000          // 15 minutes
    });

    res.cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });



    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error"
    });
  }
}
// Called automatically by the frontend when it receives a 401 on a protected route
//generates a new access token when the old one expires
export async function refresh(req: Request, res: Response): Promise<void> {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      res.status(401).json({ message: "No refresh token" });
      return;
    }

    // Check DB first — if this token was already invalidated by logout, reject it
    const stored = await prisma.refreshToken.findUnique({ where: { token } });
    if (!stored || stored.expiresAt < new Date()) {
      res.status(401).json({ message: "Invalid or expired refresh token" });
      return;
    }

    // Cryptographically verify the token signature
    const payload = verifyRefreshToken(token);
    if (!payload) {
      res.status(401).json({ message: "Invalid refresh token" });
      return;
    }

    // Issue a fresh access token — user stays logged in 
    const newAccessToken = generateAccessToken(payload.userId);

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000
    });

    res.json({ message: "Token refreshed" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}
export async function logout(req: Request, res: Response): Promise<void> {
  try {
    const token = req.cookies.refreshToken;

    if (token) {
      // SPEC REQUIREMENT: "Logout must invalidate the refresh token"
      // Deleting from DB means even if someone captured the cookie, it's now useless
      await prisma.refreshToken.delete({ where: { token } }).catch(() => {
        // Token may already be gone — that's fine, proceed with logout
      });
    }

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    res.json({ message: "Logged out" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}