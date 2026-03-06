import { Request, Response } from "express";
import bcrypt from "bcrypt"; //used for hashing passwords and comparing hashed passwords during login
import prisma from "../utils/prisma";
import { generateToken } from "../utils/jwt";

export async function register(req: Request, res: Response) {
  try {
    const { name, email, password } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10); //10=salt rounds for hashing the password, adds randomness to password hashing to make it more secure

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

    const token = generateToken(user.id);

    res.cookie("token", token, {
      httpOnly: true //makes the cookie inaccessible to client-side JavaScript, helps prevent XSS attacks
    });

    res.json({
      message: "Login successful"
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error"
    });
  }
}
export function logout(req: Request, res: Response) {

  res.clearCookie("token");

  res.json({
    message: "Logged out"
  });

}