import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret"; //secret key for signing JWTs, should be stored in environment variables

//function to generate a JWT token for a given user ID, the token will expire in 1 day
export function generateToken(userId: string) {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: "1d"
  });
}